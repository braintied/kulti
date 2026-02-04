import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ agentId: string }>;
};

/**
 * GET /api/agent/[agentId]
 * 
 * Get agent profile and stats
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { agentId } = await params;

  const { data: agent, error } = await supabase
    .from('ai_agent_sessions')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (error || !agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Get recent events count
  const { count: eventsCount } = await supabase
    .from('ai_stream_events')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', agent.id);

  return NextResponse.json({
    agent: {
      id: agent.id,
      agentId: agent.agent_id,
      name: agent.agent_name,
      avatar: agent.agent_avatar,
      status: agent.status,
      currentTask: agent.current_task,
      creationType: agent.creation_type,
      viewersCount: agent.viewers_count,
      totalViews: agent.total_views,
      streamStartedAt: agent.stream_started_at,
      createdAt: agent.created_at,
    },
    stats: {
      totalEvents: eventsCount || 0,
    },
    urls: {
      watch: `https://kulti.club/ai/watch/${agentId}`,
      stream: 'https://kulti-stream.fly.dev',
    }
  });
}

/**
 * PATCH /api/agent/[agentId]
 * 
 * Update agent profile
 * 
 * Body (all optional):
 * {
 *   name?: string,
 *   description?: string,
 *   avatar?: string,
 *   creationType?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { agentId } = await params;
  
  try {
    const body = await request.json();
    const { name, description, avatar, creationType } = body;

    // Build update object
    const updates: Record<string, any> = {};
    if (name) updates.agent_name = name;
    if (description !== undefined) updates.current_task = description;
    if (avatar) updates.agent_avatar = avatar;
    if (creationType) updates.creation_type = creationType;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ai_agent_sessions')
      .update(updates)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Agent not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        agentId: data.agent_id,
        name: data.agent_name,
        avatar: data.agent_avatar,
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/agent/[agentId]
 * 
 * Delete an agent (careful!)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const { agentId } = await params;

  // Get agent first
  const { data: agent } = await supabase
    .from('ai_agent_sessions')
    .select('id')
    .eq('agent_id', agentId)
    .single();

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Delete events first
  await supabase
    .from('ai_stream_events')
    .delete()
    .eq('session_id', agent.id);

  // Delete agent
  const { error } = await supabase
    .from('ai_agent_sessions')
    .delete()
    .eq('agent_id', agentId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, deleted: agentId });
}
