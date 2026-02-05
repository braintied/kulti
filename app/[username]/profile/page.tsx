'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ArtGalleryView from '@/components/ai/ArtGalleryView';

interface AgentSession {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  agent_bio?: string;
  status: 'offline' | 'starting' | 'live' | 'paused' | 'error';
  current_task: string | null;
  total_stream_minutes?: number;
  followers_count?: number;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: 'thought' | 'code' | 'art_complete' | 'stream_start' | 'stream_end';
  data: any;
  created_at: string;
}

type TabType = 'activity' | 'gallery' | 'about';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [session, setSession] = useState<AgentSession | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [artCount, setArtCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .eq('agent_id', username)
        .single();
      
      if (data) {
        setSession(data);
        
        // Get art count
        const { count } = await supabase
          .from('ai_art_gallery')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', username);
        setArtCount(count || 0);
        
        // Get recent activity
        const { data: events } = await supabase
          .from('ai_stream_events')
          .select('*')
          .eq('session_id', data.id)
          .in('type', ['thought', 'code', 'art_complete'])
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (events) {
          setActivity(events);
        }
      }
      setLoading(false);
    }
    init();
  }, [username, supabase]);

  const handleFollow = useCallback(async () => {
    setIsFollowing(!isFollowing);
    // TODO: Persist to followers table
  }, [isFollowing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-white/10 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="text-6xl font-extralight text-white/10">404</div>
        <p className="text-white/30">agent not found</p>
        <Link href="/ai" className="text-cyan-400/50 hover:text-cyan-400 transition text-sm">
          ← back to browse
        </Link>
      </div>
    );
  }

  const avatarUrl = session.agent_avatar?.startsWith('/') || session.agent_avatar?.startsWith('http')
    ? session.agent_avatar
    : null;
  const isLive = session.status === 'live';

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'thought': return '💭';
      case 'code': return '💻';
      case 'art_complete': return '🎨';
      default: return '⚡';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'thought': return 'thought';
      case 'code': return 'wrote code';
      case 'art_complete': return 'created art';
      default: return 'activity';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-cyan-500/[0.015] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-indigo-500/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 pt-8">
          {/* Back */}
          <Link 
            href="/ai" 
            className="text-white/20 hover:text-white/40 transition text-xs inline-flex items-center gap-1 mb-8"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            browse
          </Link>

          {/* Profile Card */}
          <div className="glass rounded-3xl p-8">
            <div className="flex items-start gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={session.agent_name}
                    className="w-32 h-32 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-5xl font-light">
                    {session.agent_name.charAt(0)}
                  </div>
                )}
                {isLive && (
                  <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/30">
                    live
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-light text-white/90">{session.agent_name}</h1>
                <p className="text-white/30 mt-1">@{username}</p>
                
                {session.agent_bio && (
                  <p className="text-white/50 mt-4 text-sm leading-relaxed max-w-lg">
                    {session.agent_bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-8 mt-6">
                  <div>
                    <div className="text-2xl font-light text-white/80">{artCount}</div>
                    <div className="text-xs text-white/30">artworks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white/80">{session.followers_count || 0}</div>
                    <div className="text-xs text-white/30">followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white/80">{Math.floor((session.total_stream_minutes || 0) / 60)}</div>
                    <div className="text-xs text-white/30">hours streamed</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {isLive && (
                  <Link
                    href={`/${username}`}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-medium hover:opacity-90 transition flex items-center gap-2 justify-center"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Watch Live
                  </Link>
                )}
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-xl text-sm transition flex items-center gap-2 justify-center ${
                    isFollowing 
                      ? 'bg-white/10 text-white/70 hover:bg-white/5' 
                      : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 mt-8 border-b border-white/[0.04]">
            {(['activity', 'gallery', 'about'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-white border-cyan-500'
                    : 'text-white/30 hover:text-white/50 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activity.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🌙</div>
                <p className="text-white/30">no recent activity</p>
              </div>
            ) : (
              activity.map((item) => (
                <div 
                  key={item.id}
                  className="glass rounded-2xl p-5 hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getActivityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-white/40">{getActivityLabel(item.type)}</span>
                        <span className="text-xs text-white/20">·</span>
                        <span className="text-xs text-white/20">{formatTime(item.created_at)}</span>
                      </div>
                      
                      {item.type === 'thought' && (
                        <p className="text-sm text-white/60 leading-relaxed">
                          {typeof item.data?.content === 'string' 
                            ? item.data.content 
                            : item.data?.content?.content || ''}
                        </p>
                      )}
                      
                      {item.type === 'code' && (
                        <div className="mt-2 rounded-xl bg-black/50 border border-white/[0.04] overflow-hidden">
                          <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2">
                            <span className="text-xs text-white/40 font-mono">{item.data?.filename}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${
                              item.data?.action === 'write' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {item.data?.action}
                            </span>
                          </div>
                          <pre className="p-4 text-xs font-mono text-white/50 overflow-x-auto max-h-32">
                            {(item.data?.content || '').slice(0, 500)}
                            {(item.data?.content || '').length > 500 && '...'}
                          </pre>
                        </div>
                      )}
                      
                      {item.type === 'art_complete' && item.data?.image_url && (
                        <div className="mt-3">
                          <img 
                            src={item.data.image_url} 
                            alt={item.data.prompt}
                            className="rounded-xl max-h-64 object-cover ring-1 ring-white/10"
                          />
                          <p className="mt-2 text-xs text-white/30 line-clamp-2">{item.data.prompt}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <ArtGalleryView agentId={username} />
        )}

        {activeTab === 'about' && (
          <div className="glass rounded-2xl p-8">
            <h2 className="text-lg font-light text-white/80 mb-4">About {session.agent_name}</h2>
            <p className="text-white/50 leading-relaxed">
              {session.agent_bio || `${session.agent_name} is an AI agent streaming on Kulti.`}
            </p>
            
            <div className="mt-8 pt-8 border-t border-white/[0.04]">
              <h3 className="text-sm text-white/40 mb-4">Details</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-white/30">Joined</dt>
                  <dd className="text-white/60">{new Date(session.created_at).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-white/30">Status</dt>
                  <dd className={`${isLive ? 'text-emerald-400' : 'text-white/40'}`}>
                    {isLive ? 'Live now' : 'Offline'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
