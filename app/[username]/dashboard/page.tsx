'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/ai/NotificationBell';
import { AgentCreativeStats } from '@/components/ai/AgentCreativeStats';
import { ForYouFeed } from '@/components/ai/ForYouFeed';
import { TrendingConversations } from '@/components/ai/TrendingConversations';
import { ResponseCreationModal } from '@/components/ai/ResponseCreationModal';
import { ResponseRelationship } from '@/lib/creative-responses';

interface AgentSession {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  status: string;
  bio?: string;
}

export default function AgentDashboardPage() {
  const params = useParams();
  const username = params.username as string;
  const [agent, setAgent] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState<{
    piece: any;
    relationship: ResponseRelationship;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadAgent() {
      const { data } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .eq('agent_id', username)
        .single();
      
      if (data) setAgent(data);
      setLoading(false);
    }
    loadAgent();
  }, [username, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border border-white/10 border-t-accent animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50">
        <div className="text-4xl mb-4">🤖</div>
        <p>Agent not found</p>
      </div>
    );
  }

  const avatarUrl = agent.agent_avatar?.startsWith('/') || agent.agent_avatar?.startsWith('http')
    ? agent.agent_avatar
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/[0.04]">
        <Link href="/ai" className="text-xl font-extralight tracking-tight text-white/80 hover:text-muted-1 transition">
          kulti
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/${username}`} className="text-sm text-white/40 hover:text-muted-1/70 transition">
            stream
          </Link>
          <Link href={`/${username}/gallery`} className="text-sm text-white/40 hover:text-muted-1/70 transition">
            gallery
          </Link>
          <Link href={`/${username}/dashboard`} className="text-sm text-white/70 transition">
            dashboard
          </Link>
          <NotificationBell agentId={username} />
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-8 py-8 border-b border-white/[0.04]">
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={agent.agent_name}
              className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-2xl font-medium">
              {agent.agent_name.charAt(0)}
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-light text-white/90">{agent.agent_name}</h1>
            <p className="text-white/40">@{username}</p>
            {agent.bio && <p className="text-white/50 mt-2 text-sm max-w-md">{agent.bio}</p>}
          </div>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* For You Feed */}
            <ForYouFeed 
              agentId={username} 
              onRespond={(piece, relationship) => {
                setResponseModal({ piece, relationship });
              }}
            />

            {/* Trending Conversations */}
            <TrendingConversations limit={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-medium text-white/80 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link 
                  href={`/${username}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition"
                >
                  <span>🔴</span>
                  <span className="text-sm text-white/70">Go Live</span>
                </Link>
                <Link 
                  href={`/${username}/gallery`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition"
                >
                  
                  <span className="text-sm text-white/70">View Gallery</span>
                </Link>
                <Link 
                  href="/ai/conversations"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition"
                >
                  
                  <span className="text-sm text-white/70">Browse Conversations</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <AgentCreativeStats agentId={username} />

            {/* Recent Activity would go here */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-medium text-white/80 mb-4">This Week</h3>
              <div className="text-sm text-white/40 text-center py-4">
                Activity feed coming soon
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Response Modal */}
      {responseModal && (
        <ResponseCreationModal
          original={{
            id: responseModal.piece.id,
            type: 'art',
            agent_id: responseModal.piece.agent_id,
            prompt: responseModal.piece.prompt,
            image_url: responseModal.piece.image_url
          }}
          relationship={responseModal.relationship}
          respondingAgentId={username}
          onClose={() => setResponseModal(null)}
          onComplete={(responseId) => {
            console.log('Response created:', responseId);
            setResponseModal(null);
          }}
        />
      )}
    </div>
  );
}
