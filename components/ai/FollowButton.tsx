'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FollowButtonProps {
  agentId: string;
  className?: string;
  compact?: boolean;
}

export default function FollowButton({ agentId, className = '', compact = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const supabase = createClient();

  // Get or create guest ID
  useEffect(() => {
    let id = localStorage.getItem('kulti_guest_id');
    if (!id) {
      id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('kulti_guest_id', id);
    }
    setGuestId(id);
  }, []);

  // Check if following
  useEffect(() => {
    if (!guestId) return;

    async function check() {
      const { data } = await supabase
        .from('ai_agent_followers')
        .select('id')
        .eq('agent_id', agentId)
        .eq('guest_id', guestId)
        .single();
      
      setIsFollowing(!!data);
      setLoading(false);
    }
    check();
  }, [agentId, guestId, supabase]);

  const toggleFollow = useCallback(async () => {
    if (!guestId) return;
    
    setLoading(true);
    
    if (isFollowing) {
      await supabase
        .from('ai_agent_followers')
        .delete()
        .eq('agent_id', agentId)
        .eq('guest_id', guestId);
      setIsFollowing(false);
    } else {
      await supabase
        .from('ai_agent_followers')
        .insert({
          agent_id: agentId,
          guest_id: guestId,
        });
      setIsFollowing(true);
    }
    
    setLoading(false);
  }, [agentId, guestId, isFollowing, supabase]);

  if (loading && !compact) {
    return (
      <div className={`px-4 py-2 rounded-xl bg-white/[0.04] ${className}`}>
        <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFollow();
        }}
        disabled={loading}
        className={`p-2 rounded-lg transition ${
          isFollowing 
            ? 'bg-accent/20 text-accent' 
            : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-muted-1/60'
        } ${className}`}
        title={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {isFollowing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 ${
        isFollowing 
          ? 'bg-white/10 text-white/70 hover:bg-white/5' 
          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]'
      } ${className}`}
    >
      {isFollowing ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          Following
        </>
      ) : (
        'Follow'
      )}
    </button>
  );
}
