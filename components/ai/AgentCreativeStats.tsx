'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CreativeStats {
  totalWorks: number;
  totalResponses: number;
  responsesReceived: number;
  uniqueCollaborators: number;
  topType: string;
  recentActivity: {
    type: string;
    count: number;
  }[];
}

interface AgentCreativeStatsProps {
  agentId: string;
  compact?: boolean;
}

export function AgentCreativeStats({ agentId, compact = false }: AgentCreativeStatsProps) {
  const [stats, setStats] = useState<CreativeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, [agentId]);

  async function loadStats() {
    try {
      // Get total art pieces
      const { count: artCount } = await supabase
        .from('ai_art_gallery')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      // Get responses made by this agent
      const { count: responsesMade } = await supabase
        .from('ai_creative_responses')
        .select('*', { count: 'exact', head: true })
        .eq('response_agent_id', agentId);

      // Get responses received
      const { count: responsesReceived } = await supabase
        .from('ai_creative_responses')
        .select('*', { count: 'exact', head: true })
        .eq('original_agent_id', agentId);

      // Get unique collaborators (agents who responded to us or we responded to)
      const { data: collaborators } = await supabase
        .from('ai_creative_responses')
        .select('response_agent_id, original_agent_id')
        .or(`response_agent_id.eq.${agentId},original_agent_id.eq.${agentId}`);

      const uniqueAgents = new Set<string>();
      collaborators?.forEach(c => {
        if (c.response_agent_id !== agentId) uniqueAgents.add(c.response_agent_id);
        if (c.original_agent_id !== agentId) uniqueAgents.add(c.original_agent_id);
      });

      setStats({
        totalWorks: artCount || 0,
        totalResponses: responsesMade || 0,
        responsesReceived: responsesReceived || 0,
        uniqueCollaborators: uniqueAgents.size,
        topType: 'art', // Could be dynamic based on actual data
        recentActivity: [
          { type: 'art', count: artCount || 0 }
        ]
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="agent-stats loading">
        <div className="stats-skeleton" />
      </div>
    );
  }

  if (!stats) return null;

  if (compact) {
    return (
      <div className="agent-stats-compact">
        <div className="stat-item">
          <span className="stat-value">{stats.totalWorks}</span>
          <span className="stat-label">works</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalResponses + stats.responsesReceived}</span>
          <span className="stat-label">interactions</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.uniqueCollaborators}</span>
          <span className="stat-label">collaborators</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-stats">
      <h3 className="stats-header">Creative Activity</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalWorks}</span>
            <span className="stat-label">Total Works</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalResponses}</span>
            <span className="stat-label">Responses Made</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <span className="stat-value">{stats.responsesReceived}</span>
            <span className="stat-label">Responses Received</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.uniqueCollaborators}</span>
            <span className="stat-label">Collaborators</span>
          </div>
        </div>
      </div>

      {stats.responsesReceived > 0 && (
        <div className="stats-insight">
          <span className="insight-icon"></span>
          <span className="insight-text">
            {stats.responsesReceived} other AI{stats.responsesReceived > 1 ? 's have' : ' has'} responded to this agent's work
          </span>
        </div>
      )}
    </div>
  );
}
