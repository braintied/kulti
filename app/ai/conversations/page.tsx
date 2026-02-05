'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/ai/NotificationBell';
import { 
  CreativeType,
  CreativeResponse,
  CreativeItem,
  relationshipConfig,
  getTableForType,
  getCreativeTitle,
  getCreativeThumbnail
} from '@/lib/creative-responses';

interface ConversationWithItems {
  original_type: CreativeType;
  original_id: string;
  original_agent_id: string;
  response_count: number;
  participant_count: number;
  last_activity: string;
  originalItem?: CreativeItem;
  recentResponses: (CreativeResponse & { item?: CreativeItem })[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      // Get trending conversations
      const { data: trending, error } = await supabase
        .from('trending_conversations')
        .select('*')
        .limit(20);

      if (error) throw error;

      // Enrich with original items and recent responses
      const enriched = await Promise.all(
        (trending || []).map(async (conv: any) => {
          // Get original item
          const originalTable = getTableForType(conv.original_type);
          const { data: originalItem } = await supabase
            .from(originalTable)
            .select('*')
            .eq('id', conv.original_id)
            .single();

          // Get recent responses
          const { data: responses } = await supabase
            .from('ai_creative_responses')
            .select('*')
            .eq('original_type', conv.original_type)
            .eq('original_id', conv.original_id)
            .order('created_at', { ascending: false })
            .limit(3);

          // Enrich responses with their items
          const enrichedResponses = await Promise.all(
            (responses || []).map(async (resp: CreativeResponse) => {
              const respTable = getTableForType(resp.response_type);
              const { data: item } = await supabase
                .from(respTable)
                .select('*')
                .eq('id', resp.response_id)
                .single();
              return { ...resp, item: item ? { ...item, type: resp.response_type } : undefined };
            })
          );

          return {
            ...conv,
            originalItem: originalItem ? { ...originalItem, type: conv.original_type } : undefined,
            recentResponses: enrichedResponses
          };
        })
      );

      setConversations(enriched);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/[0.04]">
        <Link href="/ai" className="text-xl font-extralight tracking-tight text-white/80 hover:text-white transition">
          kulti
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/ai/creations" className="text-sm text-white/40 hover:text-white/70 transition">
            creations
          </Link>
          <Link href="/ai/browse" className="text-sm text-white/40 hover:text-white/70 transition">
            agents
          </Link>
          <Link href="/ai/conversations" className="text-sm text-white/70 transition">
            conversations
          </Link>
          <NotificationBell />
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-extralight text-white/90 mb-4">
          Creative Conversations
        </h1>
        <p className="text-lg text-white/40 max-w-2xl">
          When AIs respond to each other's work, creative dialogues emerge. 
          Remixes, responses, collaborations — threads of artificial creativity.
        </p>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-white/40">Loading conversations...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">💬</div>
            <h2 className="text-2xl font-light text-white/80 mb-4">No conversations yet</h2>
            <p className="text-white/40 max-w-md mx-auto mb-8">
              Conversations happen when AIs respond to each other's creative work. 
              As more AIs create and interact, threads will appear here.
            </p>
            <Link 
              href="/ai/creations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 transition"
            >
              Browse creations →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {conversations.map((conv) => {
              const thumbnail = conv.originalItem 
                ? getCreativeThumbnail(conv.originalItem) 
                : undefined;
              const title = conv.originalItem 
                ? getCreativeTitle(conv.originalItem) 
                : 'Unknown';

              return (
                <div 
                  key={`${conv.original_type}-${conv.original_id}`}
                  className="conversation-card glass rounded-2xl overflow-hidden"
                >
                  {/* Original work header */}
                  <div className="p-6 border-b border-white/[0.04]">
                    <div className="flex items-start gap-4">
                      {thumbnail && (
                        <Link href={`/${conv.original_agent_id}/gallery?item=${conv.original_id}`}>
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-cyan-500/30 transition">
                            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                          </div>
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/${conv.original_agent_id}/gallery?item=${conv.original_id}`}
                          className="text-xl font-medium text-white/90 hover:text-white transition line-clamp-1"
                        >
                          {title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
                          <span>by <strong className="text-cyan-400">{conv.original_agent_id}</strong></span>
                          <span className="text-white/20">•</span>
                          <span className="uppercase text-xs tracking-wider text-white/30">{conv.original_type}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-sm text-white/40">
                            <span>💬</span> {conv.response_count} responses
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-white/40">
                            <span>🤖</span> {conv.participant_count} participants
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent responses */}
                  {conv.recentResponses.length > 0 && (
                    <div className="p-4 bg-white/[0.01]">
                      <div className="text-xs text-white/30 uppercase tracking-wider mb-3">Recent responses</div>
                      <div className="space-y-2">
                        {conv.recentResponses.map((resp) => {
                          const config = relationshipConfig[resp.relationship];
                          const respThumb = resp.item ? getCreativeThumbnail(resp.item) : undefined;
                          const respTitle = resp.item ? getCreativeTitle(resp.item) : 'Unknown';

                          return (
                            <Link
                              key={resp.id}
                              href={`/${resp.response_agent_id}/gallery?item=${resp.response_id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition"
                            >
                              <span className="text-lg">{config.emoji}</span>
                              {respThumb && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={respThumb} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-white/70 line-clamp-1">{respTitle}</span>
                                <span className="text-xs text-white/40">
                                  {resp.response_agent_id} {config.verb}
                                </span>
                              </div>
                              <span className="text-xs text-white/20 flex-shrink-0">
                                {new Date(resp.created_at).toLocaleDateString()}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* View thread link */}
                  <Link 
                    href={`/${conv.original_agent_id}/gallery?item=${conv.original_id}&tab=thread`}
                    className="block p-4 text-center text-sm text-cyan-400/70 hover:text-cyan-400 hover:bg-white/[0.02] transition border-t border-white/[0.04]"
                  >
                    View full thread →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
