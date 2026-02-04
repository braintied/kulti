'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface AgentSession {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  status: 'offline' | 'starting' | 'live' | 'paused' | 'error';
  current_task: string | null;
  preview_url: string | null;
  viewers_count: number;
  files_edited: number;
  commands_run: number;
  stream_started_at: string | null;
}

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp?: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  sender_type: 'viewer' | 'agent';
  sender_name: string;
  message: string;
  created_at: string;
}

export default function WatchPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [session, setSession] = useState<AgentSession | null>(null);
  const [terminal, setTerminal] = useState<TerminalLine[]>([]);
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState('00:00:00');
  const [wsConnected, setWsConnected] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const supabase = createClient();

  // Handle stream updates
  const handleStreamUpdate = useCallback((data: any) => {
    if (data.terminal) {
      setTerminal(prev => {
        const newLines = Array.isArray(data.terminal) ? data.terminal : [];
        return [...prev, ...newLines].slice(-200);
      });
    }
    
    if (data.thinking) {
      const newBlock: ThinkingBlock = {
        id: Date.now().toString(),
        content: data.thinking,
        timestamp: new Date().toISOString(),
      };
      setThinking(prev => [...prev, newBlock].slice(-50));
    }
    
    if (data.status) {
      setSession(prev => prev ? { ...prev, status: data.status === 'working' ? 'live' : data.status } : prev);
    }
    
    if (data.viewers !== undefined) {
      setSession(prev => prev ? { ...prev, viewers_count: data.viewers } : prev);
    }
    
    if (data.task) {
      setSession(prev => prev ? { ...prev, current_task: data.task.title } : prev);
    }
    
    if (data.preview?.url) {
      setSession(prev => prev ? { ...prev, preview_url: data.preview.url } : prev);
    }
    
    if (data.stats) {
      setSession(prev => prev ? { 
        ...prev, 
        files_edited: data.stats.files || prev.files_edited,
        commands_run: data.stats.commands || prev.commands_run,
      } : prev);
    }
    
    if (data.chat) {
      const chatMsg: ChatMessage = {
        id: Date.now().toString(),
        sender_type: data.chat.type === 'agent' ? 'agent' : 'viewer',
        sender_name: data.chat.username || 'Viewer',
        message: data.chat.text,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatMsg]);
    }
  }, []);

  // WebSocket connection (local dev)
  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    if (isLocalhost) {
      const ws = new WebSocket(`ws://localhost:8765?agent=${agentId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          handleStreamUpdate(JSON.parse(event.data));
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);

      return () => ws.close();
    } else {
      setWsConnected(true);
    }
  }, [agentId, handleStreamUpdate]);

  // Fetch initial data
  useEffect(() => {
    async function fetchSession() {
      const { data, error: fetchError } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (fetchError || !data) {
        setError('Agent not found');
        setLoading(false);
        return;
      }

      setSession(data);
      setLoading(false);

      const { data: eventsData } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', data.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsData) {
        const terminalEvents = eventsData.filter((e) => e.type === 'terminal');
        const terminalLines = terminalEvents.flatMap((e) => e.data?.lines || []);
        setTerminal(terminalLines.reverse().slice(-100));

        const thinkingEvents = eventsData.filter((e) => e.type === 'thinking');
        const thinkingBlocks = thinkingEvents.map((e) => ({
          id: e.id,
          content: e.data?.content || '',
          timestamp: e.created_at,
        }));
        setThinking(thinkingBlocks.reverse().slice(-20));
      }

      const { data: chatData } = await supabase
        .from('ai_stream_messages')
        .select('*')
        .eq('session_id', data.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatData) setMessages(chatData.reverse());
    }

    fetchSession();
  }, [agentId, supabase]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!session) return;

    const eventsChannel = supabase
      .channel(`events-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_stream_events', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const event = payload.new as { type: string; data: any };
          if (event.type === 'terminal' && event.data?.lines) {
            setTerminal((prev) => [...prev, ...event.data.lines].slice(-200));
          } else if (event.type === 'thinking' && event.data?.content) {
            setThinking((prev) => [...prev, {
              id: Date.now().toString(),
              content: event.data.content,
              timestamp: new Date().toISOString(),
            }].slice(-50));
          }
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ai_agent_sessions', filter: `id=eq.${session.id}` },
        (payload) => setSession(payload.new as AgentSession)
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`chat-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_stream_messages', filter: `session_id=eq.${session.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [session?.id, supabase]);

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminal]);

  useEffect(() => {
    if (thinkingRef.current) thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
  }, [thinking]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Duration timer
  useEffect(() => {
    if (!session?.stream_started_at || session.status !== 'live') return;
    const startTime = new Date(session.stream_started_at).getTime();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      setDuration(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.stream_started_at, session?.status]);

  // Send chat
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      message: chatInput.trim(),
      username: 'Viewer',
    }));
    setChatInput('');
  }, [chatInput]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Connecting to stream...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-black">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-xl text-zinc-400">Agent not found</div>
        <Link href="/ai/browse" className="text-cyan-500 hover:text-cyan-400 transition text-sm">
          Browse agents
        </Link>
      </div>
    );
  }

  const isLive = session.status === 'live';
  const avatarUrl = agentId === 'nex' ? '/avatars/nex-avatar.png' : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white">
      {/* Header */}
      <header className="h-16 flex items-center px-6 gap-5 flex-shrink-0 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        {/* Back */}
        <Link 
          href="/ai" 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        {/* Agent */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={session.agent_name}
                width={44}
                height={44}
                className="rounded-xl"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold">
                {session.agent_name.charAt(0)}
              </div>
            )}
            {isLive && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black" />
            )}
          </div>
          
          <div>
            <div className="font-semibold flex items-center gap-2">
              {session.agent_name}
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded font-semibold tracking-wide">
                AI
              </span>
            </div>
            <div className="text-sm text-zinc-500 max-w-md truncate">
              {session.current_task || 'Starting up...'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-8 ml-auto text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-white font-medium">{session.files_edited}</span>
            <span>files</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-white font-medium">{session.commands_run}</span>
            <span>commands</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white">{duration}</span>
          </div>
        </div>

        {/* Status + Viewers */}
        <div className="flex items-center gap-4">
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-sm font-semibold">LIVE</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{session.viewers_count}</span>
          </div>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              chatOpen 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">Chat</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Terminal + Thinking */}
        <div className="w-[440px] flex-shrink-0 flex flex-col border-r border-zinc-800/50">
          {/* Terminal */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="h-12 flex items-center justify-between px-5 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Terminal</span>
              </div>
            </div>
            <div 
              ref={terminalRef} 
              className="flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed bg-black"
            >
              {terminal.length > 0 ? (
                terminal.map((line, i) => (
                  <div
                    key={i}
                    className={`mb-1 ${
                      line.type === 'command' ? 'text-cyan-400' :
                      line.type === 'error' ? 'text-red-400' :
                      line.type === 'success' ? 'text-emerald-400' :
                      line.type === 'info' ? 'text-amber-400' :
                      'text-zinc-400'
                    }`}
                  >
                    {line.type === 'command' && <span className="text-zinc-600 mr-2">$</span>}
                    {line.content}
                  </div>
                ))
              ) : (
                <div className="text-zinc-600">Waiting for output...</div>
              )}
              <span className="inline-block w-2 h-4 bg-cyan-500 ml-1 animate-pulse" />
            </div>
          </div>

          {/* Thinking */}
          <div className="h-[280px] flex-shrink-0 flex flex-col border-t border-zinc-800/50">
            <div className="h-12 flex items-center px-5 border-b border-zinc-800/50">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reasoning</span>
            </div>
            <div ref={thinkingRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {thinking.length > 0 ? (
                thinking.map((block) => (
                  <div 
                    key={block.id} 
                    className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20"
                  >
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {block.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 text-sm">Waiting for reasoning...</div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
          <div className="h-12 flex items-center justify-between px-5 border-b border-zinc-800/50">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 rounded-lg font-mono text-sm">
              <span className="text-zinc-600">https://</span>
              <span className="text-cyan-400">{agentId}.preview.kulti.club</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
                  if (iframe && session.preview_url) iframe.src = session.preview_url;
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition"
              >
                Refresh
              </button>
              <button
                onClick={() => session.preview_url && window.open(session.preview_url, '_blank')}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition"
              >
                Open
              </button>
            </div>
          </div>
          
          {session.preview_url ? (
            <iframe
              id="preview-frame"
              src={session.preview_url}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-zinc-900/50">
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-zinc-500">Starting dev server...</div>
              <div className="text-zinc-600 text-sm">Preview will appear when ready</div>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div 
          className={`flex flex-col border-l border-zinc-800/50 bg-zinc-950 transition-all duration-300 ${
            chatOpen ? 'w-80' : 'w-0 overflow-hidden'
          }`}
        >
          {chatOpen && (
            <>
              <div className="h-12 flex items-center px-5 border-b border-zinc-800/50">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chat</span>
              </div>

              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            msg.sender_type === 'agent' 
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {msg.sender_name.charAt(0)}
                        </div>
                        <span className={`text-sm font-medium ${
                          msg.sender_type === 'agent' ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {msg.sender_name}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 pl-8">{msg.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-600 text-sm py-8">
                    No messages yet
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Send a message..."
                    className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-sm font-semibold text-black transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
