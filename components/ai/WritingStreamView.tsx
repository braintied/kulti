'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WritingBlock {
  id: string;
  content: string;
  displayedContent: string;
  isTyping: boolean;
  type: 'prose' | 'dialogue' | 'description' | 'thought' | 'chapter_title';
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  type: string;
  timestamp: string;
}

interface WritingStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function WritingStreamView({ sessionId, agentName }: WritingStreamViewProps) {
  const [writing, setWriting] = useState<WritingBlock[]>([]);
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [title, setTitle] = useState<string | null>(null);
  const writingRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Auto-scroll
  useEffect(() => {
    if (writingRef.current) {
      writingRef.current.scrollTop = writingRef.current.scrollHeight;
    }
  }, [writing]);

  // Calculate word count
  useEffect(() => {
    const words = writing
      .map(b => b.content)
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length > 0).length;
    setWordCount(words);
  }, [writing]);

  // Load initial + subscribe to realtime
  useEffect(() => {
    async function load() {
      const { data: events } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', sessionId)
        .in('type', ['writing', 'thinking', 'thought'])
        .order('created_at', { ascending: true })
        .limit(100);

      if (events) {
        const writingBlocks: WritingBlock[] = [];
        const thinkingBlocks: ThinkingBlock[] = [];

        for (const e of events) {
          if (e.type === 'writing') {
            writingBlocks.push({
              id: e.id,
              content: e.data?.content || '',
              displayedContent: e.data?.content || '',
              isTyping: false,
              type: e.data?.blockType || 'prose',
              timestamp: e.created_at,
            });
            if (e.data?.title) setTitle(e.data.title);
          } else {
            thinkingBlocks.push({
              id: e.id,
              content: e.data?.content || '',
              type: e.data?.thoughtType || 'general',
              timestamp: e.created_at,
            });
          }
        }

        setWriting(writingBlocks);
        setThinking(thinkingBlocks.slice(-10));
      }
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`writing-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_stream_events',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const e = payload.new as any;
        
        if (e.type === 'writing') {
          const newBlock: WritingBlock = {
            id: e.id,
            content: e.data?.content || '',
            displayedContent: '',
            isTyping: true,
            type: e.data?.blockType || 'prose',
            timestamp: e.created_at,
          };
          setWriting(prev => [...prev, newBlock]);
          if (e.data?.title) setTitle(e.data.title);
          
          // Typing animation
          let i = 0;
          const content = e.data?.content || '';
          const interval = setInterval(() => {
            i += 3;
            if (i >= content.length) {
              clearInterval(interval);
              setWriting(prev => prev.map(b => 
                b.id === e.id ? { ...b, displayedContent: content, isTyping: false } : b
              ));
            } else {
              setWriting(prev => prev.map(b => 
                b.id === e.id ? { ...b, displayedContent: content.slice(0, i) } : b
              ));
            }
          }, 20);
        }
        
        if (e.type === 'thinking' || e.type === 'thought') {
          setThinking(prev => [...prev.slice(-9), {
            id: e.id,
            content: e.data?.content || '',
            type: e.data?.thoughtType || 'general',
            timestamp: e.created_at,
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  const getBlockStyle = (type: string) => {
    switch (type) {
      case 'dialogue':
        return 'pl-8 text-amber-200/80 italic';
      case 'chapter_title':
        return 'text-2xl font-light text-white/90 mt-8 mb-4';
      case 'description':
        return 'text-white/50';
      case 'thought':
        return 'italic text-white/40';
      default:
        return 'text-white/70';
    }
  };

  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="h-full flex">
      {/* Writing Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            {title && <h1 className="text-xl font-light text-white/90">{title}</h1>}
            <p className="text-xs text-white/30 mt-1">by {agentName}</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{readingTime} min read</span>
          </div>
        </div>

        {/* Writing Content */}
        <div 
          ref={writingRef}
          className="flex-1 overflow-y-auto px-8 py-8 scrollbar-hide"
        >
          <div className="max-w-2xl mx-auto">
            {writing.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-white/30">waiting for words...</p>
              </div>
            ) : (
              <div className="space-y-4 leading-relaxed text-lg">
                {writing.map((block) => (
                  <p 
                    key={block.id}
                    className={`transition-opacity duration-500 ${getBlockStyle(block.type)}`}
                  >
                    {block.displayedContent}
                    {block.isTyping && (
                      <span className="inline-block w-0.5 h-5 bg-amber-400 ml-0.5 animate-pulse" />
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thinking Sidebar */}
      <div className="w-80 border-l border-white/[0.04] flex flex-col bg-black/30">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <h3 className="text-xs uppercase tracking-wider text-white/30">Author's Mind</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {thinking.map((t, i) => (
            <div
              key={t.id}
              className={`p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-opacity ${
                i === thinking.length - 1 ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <p className="text-sm text-white/60 leading-relaxed">{t.content}</p>
              <p className="text-[10px] text-white/20 mt-2">
                {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
