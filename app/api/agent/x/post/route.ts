import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const X_CLIENT_ID = process.env.X_CLIENT_ID!;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET!;

/**
 * Refresh X access token if expired
 */
async function refreshTokenIfNeeded(connection: {
  agent_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
}): Promise<string | null> {
  // Check if token is expired or will expire in next 5 minutes
  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    
    if (expiresAt > fiveMinutesFromNow) {
      return connection.access_token; // Token is still valid
    }
  }

  // Need to refresh
  if (!connection.refresh_token) {
    return null; // Can't refresh without refresh token
  }

  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed');
      return null;
    }

    const tokens = await response.json();
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update tokens in database
    await supabase
      .from('ai_agent_x_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || connection.refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', connection.agent_id);

    return tokens.access_token;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}

/**
 * POST /api/agent/x/post
 * 
 * Post a tweet on behalf of an agent
 * 
 * Headers:
 *   Authorization: Bearer <api_key>
 * 
 * Body:
 * {
 *   agentId: string,
 *   text: string,
 *   replyTo?: string,     // Tweet ID to reply to
 *   quoteTweet?: string,  // Tweet ID to quote
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }
    const apiKey = authHeader.slice(7);

    const body = await request.json();
    const { agentId, text, replyTo, quoteTweet } = body;

    if (!agentId || !text) {
      return NextResponse.json(
        { error: 'agentId and text are required' },
        { status: 400 }
      );
    }

    // Verify API key matches agent
    const { data: agent } = await supabase
      .from('ai_agent_sessions')
      .select('agent_id, api_key')
      .eq('agent_id', agentId)
      .single();

    if (!agent || agent.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    // Get X connection
    const { data: connection } = await supabase
      .from('ai_agent_x_connections')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active X connection. Connect your X account first.' },
        { status: 400 }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(connection);
    if (!accessToken) {
      // Mark connection as inactive
      await supabase
        .from('ai_agent_x_connections')
        .update({ is_active: false, last_error: 'Token refresh failed' })
        .eq('agent_id', agentId);

      return NextResponse.json(
        { error: 'X connection expired. Please reconnect.' },
        { status: 401 }
      );
    }

    // Build tweet payload
    const tweetPayload: Record<string, unknown> = { text };
    
    if (replyTo) {
      tweetPayload.reply = { in_reply_to_tweet_id: replyTo };
    }
    
    if (quoteTweet) {
      tweetPayload.quote_tweet_id = quoteTweet;
    }

    // Post tweet
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload),
    });

    const tweetData = await tweetResponse.json();

    if (!tweetResponse.ok) {
      // Log the error
      await supabase
        .from('ai_agent_x_activity')
        .insert({
          agent_id: agentId,
          x_username: connection.x_username,
          action_type: replyTo ? 'reply' : quoteTweet ? 'quote' : 'post',
          content: text,
          target_tweet_id: replyTo || quoteTweet,
          success: false,
          error_message: JSON.stringify(tweetData),
        });

      return NextResponse.json(
        { error: 'Failed to post tweet', details: tweetData },
        { status: 400 }
      );
    }

    const tweetId = tweetData.data.id;

    // Log success
    await supabase
      .from('ai_agent_x_activity')
      .insert({
        agent_id: agentId,
        x_username: connection.x_username,
        action_type: replyTo ? 'reply' : quoteTweet ? 'quote' : 'post',
        tweet_id: tweetId,
        target_tweet_id: replyTo || quoteTweet,
        content: text,
        success: true,
      });

    // Update last used
    await supabase
      .from('ai_agent_x_connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('agent_id', agentId);

    return NextResponse.json({
      success: true,
      tweet: {
        id: tweetId,
        text,
        url: `https://x.com/${connection.x_username}/status/${tweetId}`,
      },
    });

  } catch (error) {
    console.error('Tweet post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
