'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MusicTrack {
  id: string;
  title: string;
  audioUrl: string;
  status: 'generating' | 'complete' | 'playing';
  duration?: number;
  progress?: number;
  prompt?: string;
  model?: string;
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
}

interface MusicStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function MusicStreamView({ sessionId, agentName }: MusicStreamViewProps) {
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load initial data
  useEffect(() => {
    async function load() {
      const { data: events } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) {
        const thinkingEvents = events
          .filter(e => e.type === 'thinking')
          .reverse()
          .map(e => ({
            id: e.id,
            content: e.data?.content || '',
            timestamp: e.created_at
          }));
        setThinking(thinkingEvents);

        const trackEvents = events
          .filter(e => e.type === 'music')
          .reverse()
          .map(e => ({
            id: e.id,
            title: e.data?.title || 'Untitled',
            audioUrl: e.data?.url || '',
            status: e.data?.status || 'complete',
            duration: e.data?.duration,
            progress: e.data?.progress,
            prompt: e.data?.prompt,
            model: e.data?.model,
            timestamp: e.created_at
          }));
        setTracks(trackEvents);
        if (trackEvents.length > 0) {
          setActiveTrack(trackEvents[trackEvents.length - 1]);
        }
      }
    }
    load();
  }, [sessionId, supabase]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`music-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_stream_events',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const e = payload.new as any;
        
        if (e.type === 'thinking') {
          setThinking(prev => [...prev, {
            id: e.id,
            content: e.data?.content || '',
            timestamp: e.created_at
          }].slice(-30));
        }
        
        if (e.type === 'music') {
          const track: MusicTrack = {
            id: e.id,
            title: e.data?.title || 'Untitled',
            audioUrl: e.data?.url || '',
            status: e.data?.status || 'generating',
            duration: e.data?.duration,
            progress: e.data?.progress,
            prompt: e.data?.prompt,
            model: e.data?.model,
            timestamp: e.created_at
          };
          setTracks(prev => [...prev, track]);
          setActiveTrack(track);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // Audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [activeTrack]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Auto-scroll thinking
  useEffect(() => {
    thinkingRef.current?.scrollTo({ top: thinkingRef.current.scrollHeight, behavior: 'smooth' });
  }, [thinking]);

  return (
    <div className="h-full flex">
      {/* Left: Thinking */}
      <div className="w-80 min-w-80 border-r border-white/[0.04] flex flex-col">
        <div className="p-4 border-b border-white/[0.04]">
          <span className="text-white/80 text-sm font-medium">Musical Mind</span>
        </div>
        
        <div ref={thinkingRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {thinking.length === 0 ? (
            <div className="text-white/20 text-sm text-center py-8 italic">
              waiting for musical thoughts...
            </div>
          ) : (
            thinking.map((block, i) => {
              const isLatest = i === thinking.length - 1;
              return (
                <div
                  key={block.id}
                  className={`p-3 rounded-xl ${
                    isLatest 
                      ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20' 
                      : 'bg-white/[0.02] border border-white/[0.04]'
                  }`}
                  style={{ opacity: isLatest ? 1 : 0.5 }}
                >
                  <p className="text-sm text-white/70 leading-relaxed">
                    {block.content}
                    {isLatest && <span className="inline-block w-1.5 h-4 bg-amber-400/70 ml-1 animate-pulse" />}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Player */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main player */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          {activeTrack ? (
            <div className="w-full max-w-2xl">
              {/* Visualizer placeholder */}
              <div className="h-48 mb-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-center overflow-hidden">
                {activeTrack.status === 'generating' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-amber-500/50 rounded-full animate-pulse"
                          style={{
                            height: `${20 + Math.random() * 80}px`,
                            animationDelay: `${i * 50}ms`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-white/50 text-sm">Generating...</span>
                  </div>
                ) : (
                  <div className="flex gap-1 w-full h-full items-end p-4">
                    {[...Array(50)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all duration-75 ${
                          isPlaying ? 'bg-amber-500' : 'bg-amber-500/30'
                        }`}
                        style={{
                          height: isPlaying 
                            ? `${20 + Math.sin(Date.now() / 100 + i) * 30 + Math.random() * 30}%`
                            : `${20 + Math.sin(i / 2) * 20}%`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-white/90">{activeTrack.title}</h3>
                {activeTrack.prompt && (
                  <p className="text-white/40 text-sm mt-2">"{activeTrack.prompt}"</p>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white/80 transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                
                <button 
                  onClick={togglePlay}
                  disabled={activeTrack.status === 'generating'}
                  className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center transition"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                <button className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white/80 transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                </button>
              </div>

              {/* Hidden audio element */}
              {activeTrack.audioUrl && (
                <audio ref={audioRef} src={activeTrack.audioUrl} />
              )}
            </div>
          ) : (
            <div className="text-white/20 text-sm italic">
              waiting for music...
            </div>
          )}
        </div>

        {/* Track list */}
        {tracks.length > 1 && (
          <div className="border-t border-white/[0.04] p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setActiveTrack(track)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${
                    activeTrack?.id === track.id
                      ? 'bg-amber-500/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    track.status === 'generating' 
                      ? 'bg-amber-500/20' 
                      : 'bg-white/10'
                  }`}>
                    {track.status === 'generating' ? (
                      <div className="w-4 h-4 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-white/80">{track.title}</div>
                    <div className="text-xs text-white/40">
                      {track.status === 'generating' ? 'Generating...' : track.model || 'AI Generated'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
