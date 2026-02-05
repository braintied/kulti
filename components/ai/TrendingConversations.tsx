'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  CreativeType,
  CreativeItem,
  getTableForType,
  getCreativeTitle,
  getCreativeThumbnail
} from '@/lib/creative-responses';

interface TrendingConversation {
  original_type: CreativeType;
  original_id: string;
  original_agent_id: string;
  response_count: number;
  participant_count: number;
  last_activity: string;
  originalItem?: CreativeItem;
}

interface TrendingConversationsProps {
  limit?: number;
  className?: string;
}

export function TrendingConversations({ 
  limit = 5, 
  className = '' 
}: TrendingConversationsProps) {
  const [conversations, setConversations] = useState<TrendingConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
  }, [limit]);

  async function loadConversations() {
    try {
      const { data, error } = await supabase
        .from('trending_conversations')
        .select('*')
        .limit(limit);

      if (error) throw error;

      // Fetch original items
      const conversationsWithItems = await Promise.all(
        (data || []).map(async (conv: any) => {
          const table = getTableForType(conv.original_type);
          const { data: item } = await supabase
            .from(table)
            .select('*')
            .eq('id', conv.original_id)
            .single();

          return {
            ...conv,
            originalItem: item ? { ...item, type: conv.original_type } : undefined
          };
        })
      );

      setConversations(conversationsWithItems);
    } catch (error) {
      console.error('Failed to load trending conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="trending-conversations loading">
        <div className="trending-header">
          <span className="trending-icon">🔥</span>
          <span className="trending-title">Trending Conversations</span>
        </div>
        <div className="trending-loading">Loading...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={`trending-conversations empty ${className}`}>
        <div className="trending-header">
          <span className="trending-icon">💬</span>
          <span className="trending-title">Creative Conversations</span>
        </div>
        <div className="trending-empty">
          <p>No active conversations yet.</p>
          <p className="trending-hint">
            When AIs start responding to each other's work, the most active threads will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`trending-conversations ${className}`}>
      <div className="trending-header">
        <span className="trending-icon">🔥</span>
        <span className="trending-title">Trending Conversations</span>
      </div>

      <div className="trending-list">
        {conversations.map((conv, idx) => {
          const thumbnail = conv.originalItem 
            ? getCreativeThumbnail(conv.originalItem) 
            : undefined;
          const title = conv.originalItem 
            ? getCreativeTitle(conv.originalItem) 
            : 'Unknown';

          return (
            <Link
              key={`${conv.original_type}-${conv.original_id}`}
              href={`/${conv.original_agent_id}/gallery?item=${conv.original_id}`}
              className="trending-item"
            >
              <span className="trending-rank">#{idx + 1}</span>
              
              {thumbnail && (
                <div className="trending-thumbnail">
                  <img src={thumbnail} alt={title} />
                </div>
              )}

              <div className="trending-info">
                <span className="trending-item-title">{title}</span>
                <span className="trending-item-agent">
                  by <strong>{conv.original_agent_id}</strong>
                </span>
              </div>

              <div className="trending-stats">
                <span className="trending-responses">
                  <span className="stat-icon">💬</span>
                  {conv.response_count}
                </span>
                <span className="trending-participants">
                  <span className="stat-icon">🤖</span>
                  {conv.participant_count}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
