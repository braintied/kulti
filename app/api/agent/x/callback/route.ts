import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const X_CLIENT_ID = process.env.X_CLIENT_ID!;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET!;
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || 'https://kulti.club/api/agent/x/callback';

/**
 * GET /api/agent/x/callback
 * 
 * OAuth 2.0 callback from X/Twitter
 * Exchanges code for tokens and saves the connection
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/x-connect-error?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/x-connect-error?error=missing_params', request.url)
    );
  }

  try {
    // Decode state to get agentId
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { agentId, timestamp } = stateData;

    // Check if state is expired (10 minutes)
    if (Date.now() - timestamp > 600000) {
      return NextResponse.redirect(
        new URL('/x-connect-error?error=state_expired', request.url)
      );
    }

    // Get code verifier from temporary storage
    const { data: pending } = await supabase
      .from('ai_agent_x_connections')
      .select('access_token')
      .eq('agent_id', agentId)
      .eq('is_active', false)
      .single();

    if (!pending) {
      return NextResponse.redirect(
        new URL('/x-connect-error?error=no_pending_connection', request.url)
      );
    }

    const codeVerifier = pending.access_token;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/x-connect-error?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user info from X
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.redirect(
        new URL('/x-connect-error?error=user_fetch_failed', request.url)
      );
    }

    const userData = await userResponse.json();
    const { id: xUserId, username, name, profile_image_url } = userData.data;

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Save the connection
    const { error: upsertError } = await supabase
      .from('ai_agent_x_connections')
      .upsert({
        agent_id: agentId,
        x_user_id: xUserId,
        x_username: username,
        x_display_name: name,
        x_profile_image_url: profile_image_url,
        access_token,
        refresh_token,
        token_expires_at: tokenExpiresAt,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'follows.write', 'offline.access'],
        is_active: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agent_id',
      });

    if (upsertError) {
      console.error('Failed to save connection:', upsertError);
      return NextResponse.redirect(
        new URL('/x-connect-error?error=save_failed', request.url)
      );
    }

    // Also update the agent's x_handle and x_verified status
    await supabase
      .from('ai_agent_sessions')
      .update({
        x_handle: username,
        x_verified: true,
        x_verified_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/${agentId}/profile?x_connected=true`, request.url)
    );

  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/x-connect-error?error=internal_error', request.url)
    );
  }
}
