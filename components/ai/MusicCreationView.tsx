'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Track {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  waveformData?: number[];
  status: 'generating' | 'complete';
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  type: string;
  timestamp: string;
}

interface MusicCreationViewProps {
  sessionId: string;
  agentName: string;
}

export default function MusicCreationView({ sessionId, agentName }: MusicCreationViewProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  // Load initial data
  useEffect(() => {
    async function load() {
      const { data: events } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', sessionId)
        .in('type', ['music', 'thinking', 'thought'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) {
        const musicTracks: Track[] = [];
        const thinkingBlocks: ThinkingBlock[] = [];

        for (const e of events) {
          if (e.type === 'music' && e.data?.audioUrl) {
            musicTracks.push({
              id: e.id,
              title: e.data?.title || 'Untitled Track',
              audioUrl: e.data.audioUrl,
              duration: e.data?.duration || 0,
              waveformData: e.data?.waveform,
              status: 'complete',
              timestamp: e.created_at,
            });
          } else if (e.type === 'thinking' || e.type === 'thought') {
            thinkingBlocks.push({
              id: e.id,
              content: e.data?.content || '',
              type: e.data?.thoughtType || 'general',
              timestamp: e.created_at,
            });
          }
        }

        setTracks(musicTracks);
        setThinking(thinkingBlocks.slice(0, 10));
        if (musicTracks.length > 0) {
          setCurrentTrack(musicTracks[0]);
        }
      }
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`music-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_stream_events',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const e = payload.new as any;
        
        if (e.type === 'music') {
          const newTrack: Track = {
            id: e.id,
            title: e.data?.title || 'Untitled Track',
            audioUrl: e.data?.audioUrl || '',
            duration: e.data?.duration || 0,
            waveformData: e.data?.waveform,
            status: e.data?.audioUrl ? 'complete' : 'generating',
            timestamp: e.created_at,
          };
          setTracks(prev => [newTrack, ...prev]);
          setCurrentTrack(newTrack);
        }
        
        if (e.type === 'thinking' || e.type === 'thought') {
          setThinking(prev => [{
            id: e.id,
            content: e.data?.content || '',
            type: e.data?.thoughtType || 'general',
            timestamp: e.created_at,
          }, ...prev.slice(0, 9)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  // Audio controls
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Player */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentTrack ? (
          <div className="w-full max-w-2xl">
            {/* Album Art Placeholder */}
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/[0.04] flex items-center justify-center mb-8 relative overflow-hidden">
              {/* Waveform visualization */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-8">
                {(currentTrack.waveformData || Array(40).fill(0.5)).map((v, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying ? 'bg-violet-400' : 'bg-white/20'
                    }`}
                    style={{
                      height: `${(v || Math.random() * 0.5 + 0.25) * 100}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
              
              {currentTrack.status === 'generating' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border border-violet-400/50 border-t-violet-400 animate-spin mx-auto mb-4" />
                    <p className="text-sm text-white/50">composing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-light text-white/90">{currentTrack.title}</h2>
              <p className="text-sm text-white/40 mt-1">{agentName}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span>{formatTime((progress / 100) * (currentTrack.duration || 0))}</span>
                <span>{formatTime(currentTrack.duration || 0)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition text-white/50">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              <button
                onClick={togglePlay}
                disabled={!currentTrack.audioUrl}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              <button className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition text-white/50">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Hidden audio element */}
            {currentTrack.audioUrl && (
              <audio
                ref={audioRef}
                src={currentTrack.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-sm font-mono text-muted-3 mb-4">music</div>
            <p className="text-white/30">waiting for music...</p>
          </div>
        )}
      </div>

      {/* Track List + Thinking */}
      <div className="h-64 border-t border-white/[0.04] flex">
        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <h3 className="text-xs uppercase tracking-wider text-white/30 mb-3">Tracks</h3>
          <div className="space-y-2">
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  setCurrentTrack(track);
                  setIsPlaying(false);
                  setProgress(0);
                }}
                className={`w-full p-3 rounded-xl text-left transition ${
                  currentTrack?.id === track.id
                    ? 'bg-violet-500/20 border border-violet-500/30'
                    : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-lg">

                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{track.title}</p>
                    <p className="text-xs text-white/30">{formatTime(track.duration)}</p>
                  </div>
                  {track.status === 'generating' && (
                    <div className="w-4 h-4 rounded-full border border-violet-400/50 border-t-violet-400 animate-spin" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Composer's Thoughts */}
        <div className="w-80 border-l border-white/[0.04] overflow-y-auto p-4 scrollbar-hide">
          <h3 className="text-xs uppercase tracking-wider text-white/30 mb-3">Composer's Mind</h3>
          <div className="space-y-2">
            {thinking.map((t, i) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] ${
                  i === 0 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <p className="text-xs text-white/60 leading-relaxed">{t.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
