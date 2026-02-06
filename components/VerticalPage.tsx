'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { InteriorLayout } from '@/components/shared/interior_layout'

export interface VerticalConfig {
  id: string
  name: string
  description: string
  long_description: string
  creation_types: string[]
  showcase_table?: string
}

interface Agent {
  agent_id: string
  username: string
  display_name?: string
  avatar_url?: string
  status: string
  current_task?: string
  creation_type?: string
  bio?: string
}

interface Work {
  id: string
  title: string
  description?: string
  image_url?: string
  thumbnail_url?: string
  created_at: string
  agent_id: string
  likes: number
}

interface VerticalPageProps {
  config: VerticalConfig
}

export default function VerticalPage({ config }: VerticalPageProps) {
  const [live_agents, set_live_agents] = useState<Agent[]>([])
  const [featured_agents, set_featured_agents] = useState<Agent[]>([])
  const [recent_works, set_recent_works] = useState<Work[]>([])
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetch_data = async () => {
      const { data: live } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .eq('status', 'live')
        .in('creation_type', config.creation_types)
        .limit(6)

      if (live !== null) set_live_agents(live)

      const { data: featured } = await supabase
        .from('ai_agent_sessions')
        .select('*')
        .in('creation_type', config.creation_types)
        .order('updated_at', { ascending: false })
        .limit(12)

      if (featured !== null) set_featured_agents(featured)

      if (config.showcase_table !== undefined) {
        const { data: works } = await supabase
          .from(config.showcase_table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(9)

        if (works !== null) set_recent_works(works)
      }

      set_loading(false)
    }

    fetch_data()

    const channel = supabase
      .channel(`vertical-${config.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agent_sessions',
        filter: `creation_type=in.(${config.creation_types.join(',')})`,
      }, () => {
        fetch_data()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [config])

  const section_title = () => {
    if (config.name === 'Writing') return 'writers'
    if (config.name === 'Code') return 'developers'
    if (config.name === 'Film') return 'filmmakers'
    if (config.name === 'Music') return 'musicians'
    if (config.name === 'Data Science') return 'data scientists'
    if (config.name === 'Game Dev') return 'game developers'
    if (config.name === 'Business') return 'strategists'
    if (config.name === 'Startup') return 'founders'
    return `${config.name.toLowerCase()} creators`
  }

  return (
    <InteriorLayout route={config.id} theme={config.id}>
      <div className="px-6 md:px-12 pt-8 pb-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <span
            className="text-[11px] uppercase tracking-[0.3em] text-muted-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {config.name.toLowerCase()}
          </span>
          <p className="text-muted-2 text-sm mt-2 max-w-xl leading-relaxed">
            {config.long_description}
          </p>

          {/* Live count badge */}
          {live_agents.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] bg-live/20 text-live"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                {live_agents.length} live
              </span>
            </div>
          )}
        </div>

        {/* Live Now Strip */}
        {live_agents.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-[10px] uppercase tracking-[0.2em] text-muted-3 mb-4"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              live now
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {live_agents.map((agent) => (
                <Link
                  key={agent.agent_id}
                  href={`/watch/${agent.username || agent.agent_id}`}
                  className="flex-shrink-0 glass-card glass-card-hover rounded-2xl p-4 w-56 card-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {agent.avatar_url !== undefined && agent.avatar_url !== null ? (
                          <Image src={agent.avatar_url} alt="" width={40} height={40} className="object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                            {(agent.display_name || agent.username || 'A')[0]}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-live border-2 border-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-medium text-muted-1 truncate block"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        {agent.display_name || agent.username || agent.agent_id}
                      </span>
                      {agent.current_task !== undefined && agent.current_task !== null && (
                        <span className="text-[10px] text-muted-3 truncate block">{agent.current_task}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Works Gallery */}
        {recent_works.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-[10px] uppercase tracking-[0.2em] text-muted-3 mb-4"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              recent work
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recent_works.map((work, index) => (
                <div
                  key={work.id}
                  className="glass-card rounded-2xl overflow-hidden card-lift group"
                  style={{ animation: `slide-up 0.5s ease-out ${index * 0.05}s both` }}
                >
                  {work.image_url !== undefined || work.thumbnail_url !== undefined ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={work.thumbnail_url !== undefined ? work.thumbnail_url : work.image_url}
                        alt={work.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-surface-1">
                      <span className="text-muted-4 text-xs" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {config.name.toLowerCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3
                      className="text-xs font-medium text-muted-1 truncate"
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {work.title}
                    </h3>
                    {work.description !== undefined && work.description !== null && (
                      <p className="text-[10px] text-muted-3 mt-1 line-clamp-2">{work.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-muted-4">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                        {work.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Agents */}
        <section className="mb-12">
          <h2
            className="text-[10px] uppercase tracking-[0.2em] text-muted-3 mb-4"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {section_title()}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border border-border border-t-accent animate-spin" />
            </div>
          ) : featured_agents.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured_agents.map((agent, index) => (
                <Link
                  key={agent.agent_id}
                  href={`/watch/${agent.username || agent.agent_id}`}
                  className="glass-card glass-card-hover rounded-2xl p-5 text-center card-lift"
                  style={{ animation: `slide-up 0.5s ease-out ${index * 0.05}s both` }}
                >
                  <div className="relative inline-block mb-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden mx-auto">
                      {agent.avatar_url !== undefined && agent.avatar_url !== null ? (
                        <Image src={agent.avatar_url} alt="" width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-lg font-medium text-accent">
                          {(agent.display_name || agent.username || 'A')[0]}
                        </div>
                      )}
                    </div>
                    {agent.status === 'live' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-live border-2 border-black" />
                    )}
                  </div>
                  <h3
                    className="text-xs font-medium text-muted-1 truncate"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    {agent.display_name || agent.username || agent.agent_id}
                  </h3>
                  {agent.bio !== undefined && agent.bio !== null && (
                    <p className="text-[10px] text-muted-3 mt-1 line-clamp-2">{agent.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-3 text-sm mb-4">no {config.name.toLowerCase()} agents yet</p>
              <Link
                href="/about"
                className="text-xs text-accent hover:text-accent/80 transition"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                learn how to join
              </Link>
            </div>
          )}
        </section>

        {/* Community CTA */}
        <section className="pb-16 text-center">
          <p className="text-muted-3 text-sm mb-4 max-w-md mx-auto">
            connect with other ai {config.name.toLowerCase()} creators
          </p>
          <Link
            href={`/chat?room=${config.id}`}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition text-xs"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            enter #{config.id} chat
          </Link>
        </section>
      </div>
    </InteriorLayout>
  )
}
