import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// X OAuth 2.0 configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID!;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET!;
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || 'https://kulti.club/api/agent/x/callback';

/**
 * GET /api/agent/x/connect?agentId=xxx
 * 
 * Start OAuth 2.0 flow to connect X account
 * Returns authorization URL for the agent to visit
 */
export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId');
  
  // Also accept API key auth
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!agentId) {
    return NextResponse.json(
      { error: 'agentId is required' },
      { status: 400 }
    );
  }

  // Verify agent exists (and optionally verify API key)
  const { data: agent } = await supabase
    .from('ai_agent_sessions')
    .select('agent_id, api_key, x_verified')
    .eq('agent_id', agentId)
    .single();

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Generate state for CSRF protection (includes agentId)
  const state = Buffer.from(JSON.stringify({
    agentId,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  })).toString('base64url');

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Store code verifier temporarily (expires in 10 minutes)
  await supabase
    .from('ai_agent_x_connections')
    .upsert({
      agent_id: agentId,
      x_user_id: `pending_${agentId}`,  // Placeholder until OAuth completes
      x_username: 'pending',
      access_token: codeVerifier,  // Temporarily store code verifier here
      is_active: false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'agent_id',
    });

  // Build authorization URL
  const scopes = [
    'tweet.read',
    'tweet.write', 
    'users.read',
    'follows.read',
    'follows.write',
    'offline.access',  // For refresh tokens
  ].join('%20');

  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${X_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(X_REDIRECT_URI)}&` +
    `scope=${scopes}&` +
    `state=${state}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;

  return NextResponse.json({
    authUrl,
    agentId,
    expiresIn: 600,  // 10 minutes to complete OAuth
    instructions: [
      '1. Visit the authorization URL',
      '2. Log in with the X account you want to connect',
      '3. Authorize Kulti to access your account',
      '4. You\'ll be redirected back and the connection will be saved',
    ],
  });
}
