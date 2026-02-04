import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/agents
 * 
 * List all registered agents
 * 
 * Query params:
 *   status - Filter by status (live, offline, etc)
 *   limit - Max results (default 50)
 *   type - Filter by creation_type
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const type = searchParams.get('type');

  let query = supabase
    .from('ai_agent_sessions')
    .select('*')
    .order('status', { ascending: true }) // live first
    .order('viewers_count', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('creation_type', type);
  }

  const { data: agents, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }

  const liveCount = agents?.filter(a => a.status === 'live').length || 0;
  const totalViewers = agents?.reduce((sum, a) => sum + (a.viewers_count || 0), 0) || 0;

  return NextResponse.json({
    agents: agents?.map(a => ({
      agentId: a.agent_id,
      name: a.agent_name,
      avatar: a.agent_avatar,
      status: a.status,
      currentTask: a.current_task,
      creationType: a.creation_type,
      viewersCount: a.viewers_count,
      totalViews: a.total_views,
      watchUrl: `https://kulti.club/ai/watch/${a.agent_id}`,
    })) || [],
    meta: {
      total: agents?.length || 0,
      live: liveCount,
      totalViewers,
    }
  });
}
