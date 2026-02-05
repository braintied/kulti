'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CodeFile {
  filename: string;
  language: string;
  content: string;
  displayedContent: string;
  isTyping: boolean;
  action: 'write' | 'edit' | 'delete';
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  type: string;
  timestamp: string;
}

interface CodeStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function CodeStreamView({ sessionId, agentName }: CodeStreamViewProps) {
  const [codeFiles, setCodeFiles] = useState<Map<string, CodeFile>>(new Map());
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [terminal, setTerminal] = useState<Array<{ type: string; content: string; timestamp: string }>>([]);
  const codeRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Auto-scroll
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [codeFiles, activeFile]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal]);

  // Load initial data + subscribe
  useEffect(() => {
    async function load() {
      const { data: events } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (events) {
        const filesMap = new Map<string, CodeFile>();
        const thinkingBlocks: ThinkingBlock[] = [];
        const terminalEntries: typeof terminal = [];

        for (const e of events.reverse()) {
          if (e.type === 'code') {
            const filename = e.data?.filename || 'untitled';
            filesMap.set(filename, {
              filename,
              language: e.data?.language || getLanguageFromFilename(filename),
              content: e.data?.content || '',
              displayedContent: e.data?.content || '',
              isTyping: false,
              action: e.data?.action || 'write',
              timestamp: e.created_at,
            });
          } else if (e.type === 'thinking' || e.type === 'thought') {
            thinkingBlocks.push({
              id: e.id,
              content: e.data?.content || '',
              type: e.data?.thoughtType || 'general',
              timestamp: e.created_at,
            });
          } else if (e.type === 'terminal') {
            terminalEntries.push({
              type: e.data?.type || 'info',
              content: e.data?.content || '',
              timestamp: e.created_at,
            });
          }
        }

        setCodeFiles(filesMap);
        setThinking(thinkingBlocks.slice(-20));
        setTerminal(terminalEntries.slice(-50));
        
        if (filesMap.size > 0) {
          setActiveFile(Array.from(filesMap.keys()).pop() || null);
        }
      }
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`code-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_stream_events',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const e = payload.new as any;
        
        if (e.type === 'code') {
          const filename = e.data?.filename || 'untitled';
          const content = e.data?.content || '';
          
          // Add with typing animation
          setCodeFiles(prev => {
            const next = new Map(prev);
            next.set(filename, {
              filename,
              language: e.data?.language || getLanguageFromFilename(filename),
              content,
              displayedContent: '',
              isTyping: true,
              action: e.data?.action || 'write',
              timestamp: e.created_at,
            });
            return next;
          });
          setActiveFile(filename);
          
          // Typing animation
          let i = 0;
          const interval = setInterval(() => {
            i += 50;
            if (i >= content.length) {
              clearInterval(interval);
              setCodeFiles(prev => {
                const next = new Map(prev);
                const file = next.get(filename);
                if (file) {
                  next.set(filename, { ...file, displayedContent: content, isTyping: false });
                }
                return next;
              });
            } else {
              setCodeFiles(prev => {
                const next = new Map(prev);
                const file = next.get(filename);
                if (file) {
                  next.set(filename, { ...file, displayedContent: content.slice(0, i) });
                }
                return next;
              });
            }
          }, 10);
        }
        
        if (e.type === 'thinking' || e.type === 'thought') {
          setThinking(prev => [...prev.slice(-19), {
            id: e.id,
            content: e.data?.content || '',
            type: e.data?.thoughtType || 'general',
            timestamp: e.created_at,
          }]);
        }
        
        if (e.type === 'terminal') {
          setTerminal(prev => [...prev.slice(-49), {
            type: e.data?.type || 'info',
            content: e.data?.content || '',
            timestamp: e.created_at,
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  const fileList = Array.from(codeFiles.values());
  const currentFile = activeFile ? codeFiles.get(activeFile) : null;

  return (
    <div className="h-full flex">
      {/* Left: Terminal + Thinking */}
      <div className="w-96 border-r border-white/[0.04] flex flex-col">
        {/* Terminal */}
        <div className="h-1/2 border-b border-white/[0.04] flex flex-col">
          <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="text-xs text-white/30 font-mono">terminal</span>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs scrollbar-hide bg-black/50">
            {terminal.map((entry, i) => (
              <div key={i} className={`mb-1 ${
                entry.type === 'error' ? 'text-red-400' :
                entry.type === 'success' ? 'text-emerald-400' :
                'text-white/50'
              }`}>
                {entry.content}
              </div>
            ))}
          </div>
        </div>

        {/* Thinking */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-white/[0.04]">
            <span className="text-xs uppercase tracking-wider text-white/30">thinking</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {thinking.map((block, i) => (
              <div
                key={block.id}
                className={`p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-opacity ${
                  i === thinking.length - 1 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <p className="text-sm text-white/60 leading-relaxed">{block.content}</p>
                <p className="text-[10px] text-white/20 mt-2">
                  {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Code */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File tabs */}
        <div className="h-10 border-b border-white/[0.04] flex items-center px-4 gap-1 overflow-x-auto scrollbar-hide">
          {fileList.map((file) => (
            <button
              key={file.filename}
              onClick={() => setActiveFile(file.filename)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 ${
                activeFile === file.filename
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {file.filename}
              {file.isTyping && (
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Code content */}
        <div ref={codeRef} className="flex-1 overflow-auto p-6 scrollbar-hide">
          {!currentFile ? (
            <div className="h-full flex items-center justify-center text-white/20">
              waiting for code...
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden ring-1 ring-cyan-500/20">
              <div className="px-4 py-2 bg-white/[0.04] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white/50 font-mono">{currentFile.filename}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                    currentFile.action === 'write' ? 'bg-emerald-500/20 text-emerald-400' :
                    currentFile.action === 'edit' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {currentFile.action}
                  </span>
                </div>
                <span className="text-white/20">
                  {new Date(currentFile.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-4 bg-black/50">
                <pre className="font-mono text-sm leading-relaxed text-white/70 whitespace-pre overflow-x-auto">
                  {currentFile.displayedContent}
                  {currentFile.isTyping && (
                    <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5" />
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', sql: 'sql', css: 'css', html: 'html', json: 'json',
    md: 'markdown', yml: 'yaml', yaml: 'yaml', sh: 'bash',
  };
  return map[ext] || 'text';
}
