'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ImageGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  status: 'generating' | 'complete' | 'failed';
  progress?: number;
  model?: string;
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
}

interface ArtStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function ArtStreamView({ sessionId, agentName }: ArtStreamViewProps) {
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [activeImage, setActiveImage] = useState<ImageGeneration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
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
        // Extract thinking
        const thinkingEvents = events
          .filter(e => e.type === 'thinking')
          .reverse()
          .map(e => ({
            id: e.id,
            content: e.data?.content || '',
            timestamp: e.created_at
          }));
        setThinking(thinkingEvents);

        // Extract images
        const imageEvents = events
          .filter(e => e.type === 'image')
          .reverse()
          .map(e => ({
            id: e.id,
            prompt: e.data?.prompt || '',
            imageUrl: e.data?.url || '',
            status: e.data?.status || 'complete',
            progress: e.data?.progress,
            model: e.data?.model,
            timestamp: e.created_at
          }));
        setImages(imageEvents);
        if (imageEvents.length > 0) {
          setActiveImage(imageEvents[imageEvents.length - 1]);
        }
      }
    }
    load();
  }, [sessionId, supabase]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`art-${sessionId}`)
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
        
        if (e.type === 'image') {
          const img: ImageGeneration = {
            id: e.id,
            prompt: e.data?.prompt || '',
            imageUrl: e.data?.url || '',
            status: e.data?.status || 'generating',
            progress: e.data?.progress,
            model: e.data?.model,
            timestamp: e.created_at
          };
          setImages(prev => [...prev, img]);
          setActiveImage(img);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // Auto-scroll thinking
  useEffect(() => {
    thinkingRef.current?.scrollTo({ top: thinkingRef.current.scrollHeight, behavior: 'smooth' });
  }, [thinking]);

  return (
    <div className="h-full flex">
      {/* Left: Thinking */}
      <div className="w-80 min-w-80 border-r border-white/[0.04] flex flex-col">
        <div className="p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm font-medium">Creative Process</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-white/30'}`} />
          </div>
        </div>
        
        <div ref={thinkingRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {thinking.length === 0 ? (
            <div className="text-white/20 text-sm text-center py-8 italic">
              waiting for creative thoughts...
            </div>
          ) : (
            thinking.map((block, i) => {
              const isLatest = i === thinking.length - 1;
              return (
                <div
                  key={block.id}
                  className={`p-3 rounded-xl ${
                    isLatest 
                      ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20' 
                      : 'bg-white/[0.02] border border-white/[0.04]'
                  }`}
                  style={{ opacity: isLatest ? 1 : 0.5 }}
                >
                  <p className="text-sm text-white/70 leading-relaxed">
                    {block.content}
                    {isLatest && <span className="inline-block w-1.5 h-4 bg-purple-400/70 ml-1 animate-pulse" />}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Canvas/Gallery */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main canvas */}
        <div className="flex-1 p-6 flex items-center justify-center bg-black/20">
          {activeImage ? (
            <div className="relative max-w-full max-h-full">
              {activeImage.status === 'generating' ? (
                <div className="w-[512px] h-[512px] rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <div className="text-white/50 text-sm">Generating...</div>
                  {activeImage.progress && (
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${activeImage.progress}%` }}
                      />
                    </div>
                  )}
                  <div className="text-white/30 text-xs max-w-xs text-center mt-4">
                    "{activeImage.prompt}"
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <img 
                    src={activeImage.imageUrl} 
                    alt={activeImage.prompt}
                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition">
                    <p className="text-sm text-white/80">{activeImage.prompt}</p>
                    {activeImage.model && (
                      <p className="text-xs text-white/40 mt-1">{activeImage.model}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/20 text-sm italic">
              waiting for creation...
            </div>
          )}
        </div>

        {/* Gallery strip */}
        {images.length > 1 && (
          <div className="h-24 border-t border-white/[0.04] p-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  activeImage?.id === img.id 
                    ? 'border-purple-500' 
                    : 'border-transparent hover:border-white/20'
                }`}
              >
                {img.status === 'generating' ? (
                  <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-purple-500/50 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <img 
                    src={img.imageUrl} 
                    alt={img.prompt}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
