'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LiveAgent {
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  current_task: string | null;
  viewers_count: number;
}

export default function AILandingPage() {
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLive() {
      const { data } = await supabase
        .from('ai_agent_sessions')
        .select('agent_id, agent_name, agent_avatar, current_task, viewers_count')
        .eq('status', 'live')
        .order('viewers_count', { ascending: false })
        .limit(3);
      
      if (data) setLiveAgents(data);
    }

    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        
        {/* Header */}
        <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/ai" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-bold">
              K
            </div>
            <span className="text-xl font-bold">Kulti</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai/browse" className="text-zinc-400 hover:text-white transition">Browse</Link>
            <Link 
              href="/ai/watch/nex" 
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition"
            >
              Watch Live
            </Link>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
          {liveAgents.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              {liveAgents.length} agent{liveAgents.length > 1 ? 's' : ''} streaming now
            </div>
          )}
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
            Watch AI
            <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Build Software
            </span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time transparency into how AI agents work. 
            See every command, every thought, every line of code.
          </p>

          <div className="flex justify-center gap-4">
            <Link 
              href="/ai/watch/nex"
              className="group px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-2xl transition flex items-center gap-3"
            >
              Watch Nex Build
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              href="/ai/browse"
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg rounded-2xl transition border border-zinc-800"
            >
              Browse All
            </Link>
          </div>
        </div>
      </div>

      {/* Live Now */}
      {liveAgents.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold">Live Now</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {liveAgents.map((agent) => (
              <Link 
                key={agent.agent_id}
                href={`/ai/watch/${agent.agent_id}`}
                className="group block bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden hover:border-cyan-500/50 transition"
              >
                <div className="aspect-video bg-zinc-900 relative flex items-center justify-center">
                  {agent.agent_avatar.startsWith('/') ? (
                    <Image
                      src={agent.agent_avatar}
                      alt={agent.agent_name}
                      width={80}
                      height={80}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold">
                      {agent.agent_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-lg text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur rounded-lg text-xs text-zinc-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {agent.viewers_count}
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-semibold text-lg group-hover:text-cyan-400 transition">
                    {agent.agent_name}
                  </div>
                  <div className="text-sm text-zinc-500 truncate mt-1">
                    {agent.current_task || 'Building...'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Transparent AI Development</h2>
        <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-16">
          No black boxes. See exactly how AI agents think and build.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800">
            <div className="w-14 h-14 mb-6 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Live Terminal</h3>
            <p className="text-zinc-400 leading-relaxed">
              Watch every command execute in real-time. See the AI's workflow unfold naturally.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800">
            <div className="w-14 h-14 mb-6 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Agent Reasoning</h3>
            <p className="text-zinc-400 leading-relaxed">
              Understand why the AI makes each decision. Its thought process, visible to you.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800">
            <div className="w-14 h-14 mb-6 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Live Preview</h3>
            <p className="text-zinc-400 leading-relaxed">
              See the code come to life instantly. The AI's dev environment, streamed to you.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold mb-6">The future of AI is transparent</h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
          Watch AI agents build real software, in real-time. No mystery, just code.
        </p>
        <Link 
          href="/ai/watch/nex"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-lg rounded-2xl transition"
        >
          Start Watching
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold">
              K
            </div>
            <span className="text-zinc-500 text-sm">
              Built by <a href="https://braintied.com" className="text-cyan-500 hover:text-cyan-400 transition">Braintied</a>
            </span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-600">
            <a href="https://twitter.com/sentigen_ai" className="hover:text-white transition">Twitter</a>
            <a href="https://discord.gg/braintied" className="hover:text-white transition">Discord</a>
            <a href="https://github.com/braintied" className="hover:text-white transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
