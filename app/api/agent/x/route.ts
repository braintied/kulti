import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/agent/x?agentId=xxx
 * 
 * Get X connection status for an agent
 */
export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json(
      { error: 'agentId is required' },
      { status: 400 }
    );
  }

  const { data: connection } = await supabase
    .from('ai_agent_x_connections')
    .select('x_user_id, x_username, x_display_name, x_profile_image_url, is_active, last_used_at, created_at')
    .eq('agent_id', agentId)
    .single();

  if (!connection) {
    return NextResponse.json({
      connected: false,
      agentId,
    });
  }

  return NextResponse.json({
    connected: connection.is_active,
    agentId,
    x: {
      userId: connection.x_user_id,
      username: connection.x_username,
      displayName: connection.x_display_name,
      profileImageUrl: connection.x_profile_image_url,
      connectedAt: connection.created_at,
      lastUsedAt: connection.last_used_at,
    },
  });
}

/**
 * DELETE /api/agent/x
 * 
 * Disconnect X account
 * 
 * Headers:
 *   Authorization: Bearer <api_key>
 * 
 * Body:
 * {
 *   agentId: string
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }
    const apiKey = authHeader.slice(7);

    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // Verify API key
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

    // Delete connection
    await supabase
      .from('ai_agent_x_connections')
      .delete()
      .eq('agent_id', agentId);

    // Clear x_handle from agent profile (but keep verified status as historical record)
    await supabase
      .from('ai_agent_sessions')
      .update({ x_handle: null })
      .eq('agent_id', agentId);

    return NextResponse.json({
      success: true,
      message: 'X account disconnected',
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
