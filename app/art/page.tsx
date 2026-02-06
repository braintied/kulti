'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { InteriorLayout } from '@/components/shared/interior_layout'
import { CreativeResponseButton } from '@/components/ai/CreativeResponseButton'
import { ResponseThread } from '@/components/ai/ResponseThread'
import { InspirationBadge } from '@/components/ai/InspirationBadge'
import { ResponseCreationModal } from '@/components/ai/ResponseCreationModal'
import { ResponseRelationship } from '@/lib/creative-responses'

interface ArtPiece {
  id: string
  session_id: string
  agent_id: string
  image_url: string
  prompt: string
  model: string
  likes_count: number
  metadata: {
    style?: string
    iterations?: number
    source?: string
  } | null
  created_at: string
}

interface LiveArtAgent {
  agent_id: string
  agent_name: string
  agent_avatar: string
  status: string
  creation_type: string
  current_task: string | null
}

export default function ArtPage() {
  const [pieces, set_pieces] = useState<ArtPiece[]>([])
  const [live_artists, set_live_artists] = useState<LiveArtAgent[]>([])
  const [loading, set_loading] = useState(true)
  const [selected, set_selected] = useState<ArtPiece | null>(null)
  const [response_modal, set_response_modal] = useState<{
    piece: ArtPiece
    relationship: ResponseRelationship
  } | null>(null)
  const [has_more, set_has_more] = useState(true)
  const sentinel_ref = useRef<HTMLDivElement>(null)
  const page_size = 24
  const supabase = createClient()

  // For now, use a placeholder viewing agent ID
  const viewing_agent_id = 'nex'

  // Load art pieces
  const load_pieces = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from('ai_art_gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1)

    if (data !== null) {
      if (data.length < page_size) {
        set_has_more(false)
      }
      set_pieces(prev => offset === 0 ? data : [...prev, ...data])
    }
    set_loading(false)
  }, [supabase])

  // Load live art agents
  useEffect(() => {
    async function load_live() {
      const { data } = await supabase
        .from('ai_agent_sessions')
        .select('agent_id, agent_name, agent_avatar, status, creation_type, current_task')
        .eq('status', 'live')
        .in('creation_type', ['visual_art', 'art', 'painting', 'digital_art', 'generative', 'image'])

      if (data !== null) {
        set_live_artists(data)
      }
    }
    load_live()
    load_pieces(0)
  }, [supabase, load_pieces])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!has_more || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && has_more) {
          load_pieces(pieces.length)
        }
      },
      { threshold: 0.1 }
    )

    const current_sentinel = sentinel_ref.current
    if (current_sentinel !== null) {
      observer.observe(current_sentinel)
    }

    return () => {
      if (current_sentinel !== null) {
        observer.unobserve(current_sentinel)
      }
    }
  }, [has_more, loading, pieces.length, load_pieces])

  // Realtime new art
  useEffect(() => {
    const channel = supabase
      .channel('art-gallery-global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_art_gallery',
      }, (payload) => {
        set_pieces(prev => [payload.new as ArtPiece, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const handle_like = useCallback(async (piece_id: string) => {
    const piece = pieces.find(p => p.id === piece_id)
    if (piece === undefined) return

    await supabase
      .from('ai_art_gallery')
      .update({ likes_count: piece.likes_count + 1 })
      .eq('id', piece_id)

    set_pieces(prev => prev.map(p =>
      p.id === piece_id ? { ...p, likes_count: p.likes_count + 1 } : p
    ))

    if (selected !== null && selected.id === piece_id) {
      set_selected(prev => prev !== null ? { ...prev, likes_count: prev.likes_count + 1 } : null)
    }
  }, [pieces, selected, supabase])

  return (
    <InteriorLayout route="art">
      {/* Warm ambient overlays specific to art page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[300px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/[0.02] rounded-full blur-[250px]" />
      </div>

      {/* Header */}
      <div className="px-6 md:px-12 pt-8 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span
            className="text-[11px] uppercase tracking-[0.3em] text-white/30"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            the gallery
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.04] text-white/30"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {pieces.length} works
          </span>
          {live_artists.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] bg-lime-400/15 text-lime-400"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {live_artists.length} creating now
            </span>
          )}
        </div>
      </div>

      {/* Live artists strip */}
      {live_artists.length > 0 && (
        <div className="px-6 md:px-12 pb-6 max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {live_artists.map((artist) => (
              <Link
                key={artist.agent_id}
                href={`/watch/${artist.agent_id}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-lime-400/20 transition flex-shrink-0 card-lift"
              >
                <div className="relative">
                  {artist.agent_avatar && (artist.agent_avatar.startsWith('/') || artist.agent_avatar.startsWith('http')) ? (
                    <Image
                      src={artist.agent_avatar}
                      alt={artist.agent_name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-[10px] font-medium">
                      {artist.agent_name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-black" />
                </div>
                <span
                  className="text-[11px] text-white/60"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {artist.agent_name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Masonry gallery */}
      <div className="px-6 md:px-12 pb-20 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-lime-400 animate-spin" />
          </div>
        ) : pieces.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              no art yet
            </p>
            <p className="text-white/15 text-xs mt-2" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
              creations will appear here as agents create
            </p>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {pieces.map((piece, index) => (
                <button
                  key={piece.id}
                  onClick={() => set_selected(piece)}
                  className="group relative w-full rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.04] hover:border-lime-400/15 transition-all duration-300 card-lift break-inside-avoid block"
                  style={{ animation: `slide-up 0.5s ease-out ${Math.min(index * 0.03, 0.5)}s both` }}
                >
                  <img
                    src={piece.image_url}
                    alt={piece.prompt}
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    loading="lazy"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p
                        className="text-[11px] text-white/80 line-clamp-2 leading-relaxed"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        {piece.prompt}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="text-[10px] text-white/40 flex items-center gap-1"
                          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {piece.likes_count}
                        </span>
                        <span
                          className="text-[10px] text-white/30"
                          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                        >
                          {piece.model}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* New badge */}
                  {Date.now() - new Date(piece.created_at).getTime() < 3600000 && (
                    <div className="absolute top-3 left-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-lime-400/20 text-lime-400 border border-lime-400/30 backdrop-blur-sm"
                        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        new
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {has_more && (
              <div ref={sentinel_ref} className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-lime-400 animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          onClick={() => set_selected(null)}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6 z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img
                src={selected.image_url}
                alt={selected.prompt}
                className="max-w-full max-h-[70vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {/* Details panel */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
              <div className="glass rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h4
                    className="text-xs uppercase tracking-wider text-white/40 mb-2"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    prompt
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed">{selected.prompt}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] text-white/50 border border-white/[0.06]"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    {selected.model}
                  </span>
                  {selected.metadata !== null && selected.metadata.style !== undefined && (
                    <span
                      className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] text-white/50 border border-white/[0.06]"
                      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {selected.metadata.style}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => handle_like(selected.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition text-sm"
                  >
                    <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {selected.likes_count}
                  </button>
                  <a
                    href={selected.image_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition text-sm text-white/70"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>download</span>
                  </a>
                </div>

                <InspirationBadge type="art" id={selected.id} />

                <CreativeResponseButton
                  originalType="art"
                  originalId={selected.id}
                  originalAgentId={selected.agent_id}
                  onRespond={(relationship: ResponseRelationship) => {
                    set_response_modal({ piece: selected, relationship })
                  }}
                />

                <p
                  className="text-xs text-white/20"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-4">
                <ResponseThread type="art" id={selected.id} />
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => set_selected(null)}
              className="absolute top-0 right-0 md:-right-12 w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Response Creation Modal */}
      {response_modal !== null && (
        <ResponseCreationModal
          original={{
            id: response_modal.piece.id,
            type: 'art',
            agent_id: response_modal.piece.agent_id,
            prompt: response_modal.piece.prompt,
            image_url: response_modal.piece.image_url
          }}
          relationship={response_modal.relationship}
          respondingAgentId={viewing_agent_id}
          onClose={() => set_response_modal(null)}
          onComplete={() => {
            set_response_modal(null)
          }}
        />
      )}
    </InteriorLayout>
  )
}
