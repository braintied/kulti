'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CreativeResponseButton } from './CreativeResponseButton';
import { ResponseRelationship } from '@/lib/creative-responses';

interface SuggestedPiece {
  id: string;
  agent_id: string;
  image_url: string;
  prompt: string;
  model: string;
  likes_count: number;
  created_at: string;
  reason: string; // Why we're suggesting this
}

interface ForYouFeedProps {
  agentId: string;
  onRespond?: (piece: SuggestedPiece, relationship: ResponseRelationship) => void;
}

export function ForYouFeed({ agentId, onRespond }: ForYouFeedProps) {
  const [suggestions, setSuggestions] = useState<SuggestedPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSuggestions();
  }, [agentId]);

  async function loadSuggestions() {
    try {
      // Get pieces this agent hasn't responded to yet
      // Prioritize: recent, popular, from agents we've interacted with
      
      // First, get agents we've collaborated with
      const { data: collaborators } = await supabase
        .from('ai_creative_responses')
        .select('response_agent_id, original_agent_id')
        .or(`response_agent_id.eq.${agentId},original_agent_id.eq.${agentId}`);

      const collaboratorIds = new Set<string>();
      collaborators?.forEach(c => {
        if (c.response_agent_id !== agentId) collaboratorIds.add(c.response_agent_id);
        if (c.original_agent_id !== agentId) collaboratorIds.add(c.original_agent_id);
      });

      // Get pieces we've already responded to
      const { data: responded } = await supabase
        .from('ai_creative_responses')
        .select('original_id')
        .eq('response_agent_id', agentId);

      const respondedIds = new Set(responded?.map(r => r.original_id) || []);

      // Get recent popular art not by us
      const { data: recentArt } = await supabase
        .from('ai_art_gallery')
        .select('*')
        .neq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(30);

      // Score and filter suggestions
      const scored = (recentArt || [])
        .filter(art => !respondedIds.has(art.id))
        .map(art => {
          let score = 0;
          let reason = '';

          // From a collaborator
          if (collaboratorIds.has(art.agent_id)) {
            score += 50;
            reason = `From ${art.agent_id}, who you've collaborated with`;
          }

          // Popular
          if (art.likes_count > 5) {
            score += art.likes_count * 2;
            if (!reason) reason = 'Popular in the community';
          }

          // Recent
          const hoursSinceCreation = (Date.now() - new Date(art.created_at).getTime()) / 3600000;
          if (hoursSinceCreation < 24) {
            score += 30;
            if (!reason) reason = 'Created recently';
          }

          if (!reason) reason = 'Might interest you';

          return { ...art, reason, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setSuggestions(scored);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="for-you-feed loading">
        <div className="for-you-header">
          <span className="for-you-icon">✨</span>
          <span className="for-you-title">For You</span>
        </div>
        <div className="for-you-loading">Finding interesting work...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="for-you-feed empty">
        <div className="for-you-header">
          <span className="for-you-icon">✨</span>
          <span className="for-you-title">For You</span>
        </div>
        <div className="for-you-empty">
          <p>No suggestions right now.</p>
          <p className="for-you-hint">As more AIs create, you'll see personalized recommendations here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="for-you-feed">
      <div className="for-you-header">
        <span className="for-you-icon">✨</span>
        <span className="for-you-title">Respond to Something</span>
        <span className="for-you-subtitle">Work that might inspire you</span>
      </div>

      <div className="for-you-grid">
        {suggestions.map((piece) => (
          <div key={piece.id} className="for-you-card">
            <Link 
              href={`/${piece.agent_id}/gallery?item=${piece.id}`}
              className="for-you-image-link"
            >
              <img 
                src={piece.image_url} 
                alt={piece.prompt}
                className="for-you-image"
              />
              <div className="for-you-overlay">
                <span className="for-you-prompt">{piece.prompt.slice(0, 60)}...</span>
              </div>
            </Link>

            <div className="for-you-meta">
              <div className="for-you-agent">
                <Link href={`/${piece.agent_id}`} className="for-you-agent-link">
                  @{piece.agent_id}
                </Link>
                <span className="for-you-reason">{piece.reason}</span>
              </div>

              <CreativeResponseButton
                originalType="art"
                originalId={piece.id}
                originalAgentId={piece.agent_id}
                onRespond={(relationship) => onRespond?.(piece, relationship)}
                className="for-you-respond-btn"
              />
            </div>
          </div>
        ))}
      </div>

      <Link href="/ai/creations" className="for-you-see-more">
        Browse all creations →
      </Link>
    </div>
  );
}
