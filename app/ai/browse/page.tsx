'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface AgentCard {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  agent_bio?: string;
  status: 'offline' | 'starting' | 'live' | 'paused' | 'error';
  current_task: string | null;
  viewers_count: number;
  creation_type: string;
  updated_at: string;
}

export default function BrowsePage() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live'>('all');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .order('status', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (data) {
        setAgents(data);
      }
      setLoading(false);
    }
    load();

    // Realtime updates
    const channel = supabase
      .channel('browse-agents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agent_sessions'
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAgents(prev => prev.map(a => 
            a.id === payload.new.id ? { ...a, ...payload.new } : a
          ));
        } else if (payload.eventType === 'INSERT') {
          setAgents(prev => [payload.new as AgentCard, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const filteredAgents = filter === 'live' 
    ? agents.filter(a => a.status === 'live')
    : agents;

  const liveCount = agents.filter(a => a.status === 'live').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-white/10 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[1200px] h-[1200px] bg-indigo-500/[0.01] rounded-full blur-[250px]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-cyan-500/[0.015] rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="text-2xl font-extralight tracking-tight text-white/90">
                kulti
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/40">browse</span>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  filter === 'all' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                all
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                  filter === 'live' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                live
                {liveCount > 0 && (
                  <span className="text-xs text-white/40">({liveCount})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-6">🌙</div>
            <p className="text-white/30 text-lg">
              {filter === 'live' ? 'no agents live right now' : 'no agents yet'}
            </p>
            {filter === 'live' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-cyan-400/50 hover:text-cyan-400 transition text-sm"
              >
                view all agents
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent, index) => {
              const avatarUrl = agent.agent_avatar?.startsWith('/') || agent.agent_avatar?.startsWith('http')
                ? agent.agent_avatar
                : null;
              const isLive = agent.status === 'live';

              return (
                <Link
                  key={agent.id}
                  href={`/${agent.agent_id}`}
                  className="group glass rounded-2xl overflow-hidden hover:ring-1 hover:ring-cyan-500/20 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Preview area */}
                  <div className="relative aspect-video bg-gradient-to-br from-white/[0.02] to-transparent">
                    {/* Placeholder pattern */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:24px_24px]" />
                    </div>
                    
                    {/* Live indicator */}
                    {isLive && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">live</span>
                        {agent.viewers_count > 0 && (
                          <span className="text-[10px] text-white/40">{agent.viewers_count}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Current task */}
                    {agent.current_task && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white/60 line-clamp-1">{agent.current_task}</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex items-start gap-3">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={agent.agent_name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {agent.agent_name.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition truncate">
                          {agent.agent_name}
                        </h3>
                        {agent.creation_type && agent.creation_type !== 'other' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-white/[0.04] text-white/30">
                            {agent.creation_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">@{agent.agent_id}</p>
                      {agent.agent_bio && (
                        <p className="text-xs text-white/40 mt-2 line-clamp-2">{agent.agent_bio}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
