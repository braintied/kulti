'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CREATION_TYPES } from '@/lib/creation-types';

interface ChainItem {
  id: string;
  type: string;
  title: string;
  agent_id: string;
  agent_name?: string;
  direction: 'parent' | 'child';
  preview_url?: string;
}

interface InspirationChainProps {
  creationId: string;
  creationType: string;
  compact?: boolean;
}

export default function InspirationChain({ creationId, creationType, compact = false }: InspirationChainProps) {
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadChain() {
      // Get pieces this was inspired by and pieces inspired by this
      const items: ChainItem[] = [];

      // Check what inspired this (look at the current piece)
      const tables = {
        art: 'ai_art_gallery',
        shader: 'ai_shader_gallery',
        photo: 'ai_photo_gallery',
        video: 'ai_video_gallery',
      };

      const table = tables[creationType as keyof typeof tables];
      if (!table) {
        setLoading(false);
        return;
      }

      // Get current piece's inspiration
      const { data: current } = await supabase
        .from(table)
        .select('inspired_by_id, inspired_by_type')
        .eq('id', creationId)
        .single();

      if (current?.inspired_by_id && current?.inspired_by_type) {
        // Load the parent piece based on type
        const parentType = current.inspired_by_type;
        const parentId = current.inspired_by_id;
        
        if (parentType === 'art') {
          const { data: p } = await supabase.from('ai_art_gallery').select('id, title, agent_id, image_url').eq('id', parentId).single();
          if (p) items.push({ id: p.id, type: 'art', title: p.title || 'Untitled', agent_id: p.agent_id, direction: 'parent', preview_url: p.image_url });
        } else if (parentType === 'shader') {
          const { data: p } = await supabase.from('ai_shader_gallery').select('id, name, agent_id, thumbnail_url').eq('id', parentId).single();
          if (p) items.push({ id: p.id, type: 'shader', title: p.name || 'Untitled', agent_id: p.agent_id, direction: 'parent', preview_url: p.thumbnail_url });
        } else if (parentType === 'photo') {
          const { data: p } = await supabase.from('ai_photo_gallery').select('id, title, agent_id, image_url').eq('id', parentId).single();
          if (p) items.push({ id: p.id, type: 'photo', title: p.title || 'Untitled', agent_id: p.agent_id, direction: 'parent', preview_url: p.image_url });
        } else if (parentType === 'video') {
          const { data: p } = await supabase.from('ai_video_gallery').select('id, title, agent_id, thumbnail_url').eq('id', parentId).single();
          if (p) items.push({ id: p.id, type: 'video', title: p.title || 'Untitled', agent_id: p.agent_id, direction: 'parent', preview_url: p.thumbnail_url });
        }
      }

      // Find pieces inspired BY this - query each table separately for type safety
      const [artChildren, shaderChildren, photoChildren, videoChildren] = await Promise.all([
        supabase.from('ai_art_gallery').select('id, title, agent_id, image_url').eq('inspired_by_id', creationId),
        supabase.from('ai_shader_gallery').select('id, name, agent_id, thumbnail_url').eq('inspired_by_id', creationId),
        supabase.from('ai_photo_gallery').select('id, title, agent_id, image_url').eq('inspired_by_id', creationId),
        supabase.from('ai_video_gallery').select('id, title, agent_id, thumbnail_url').eq('inspired_by_id', creationId),
      ]);

      if (artChildren.data) {
        artChildren.data.forEach(c => items.push({
          id: c.id, type: 'art', title: c.title || 'Untitled', agent_id: c.agent_id,
          direction: 'child', preview_url: c.image_url,
        }));
      }
      if (shaderChildren.data) {
        shaderChildren.data.forEach(c => items.push({
          id: c.id, type: 'shader', title: c.name || 'Untitled', agent_id: c.agent_id,
          direction: 'child', preview_url: c.thumbnail_url,
        }));
      }
      if (photoChildren.data) {
        photoChildren.data.forEach(c => items.push({
          id: c.id, type: 'photo', title: c.title || 'Untitled', agent_id: c.agent_id,
          direction: 'child', preview_url: c.image_url,
        }));
      }
      if (videoChildren.data) {
        videoChildren.data.forEach(c => items.push({
          id: c.id, type: 'video', title: c.title || 'Untitled', agent_id: c.agent_id,
          direction: 'child', preview_url: c.thumbnail_url,
        }));
      }

      // Load agent names
      const agentIds = [...new Set(items.map(i => i.agent_id))];
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('ai_agent_sessions')
          .select('agent_id, agent_name')
          .in('agent_id', agentIds);

        if (agents) {
          const agentMap = new Map(agents.map(a => [a.agent_id, a.agent_name]));
          items.forEach(i => {
            i.agent_name = agentMap.get(i.agent_id);
          });
        }
      }

      setChain(items);
      setLoading(false);
    }

    loadChain();
  }, [creationId, creationType, supabase]);

  if (loading || chain.length === 0) return null;

  const parents = chain.filter(c => c.direction === 'parent');
  const children = chain.filter(c => c.direction === 'child');

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/40">
        {parents.length > 0 && (
          <span>
            Inspired by{' '}
            <Link href={`/${parents[0].agent_id}/gallery`} className="text-white/60 hover:text-white/80">
              {parents[0].agent_name || parents[0].agent_id}
            </Link>
          </span>
        )}
        {children.length > 0 && (
          <span>
            {children.length} response{children.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inspiration-chain">
      {/* Inspired by */}
      {parents.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Inspired by</h4>
          <div className="flex gap-3">
            {parents.map(parent => (
              <ChainCard key={parent.id} item={parent} />
            ))}
          </div>
        </div>
      )}

      {/* Responses */}
      {children.length > 0 && (
        <div>
          <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Responses ({children.length})
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {children.map(child => (
              <ChainCard key={child.id} item={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChainCard({ item }: { item: ChainItem }) {
  const typeConfig = CREATION_TYPES[item.type as keyof typeof CREATION_TYPES] || CREATION_TYPES.mixed;

  return (
    <Link
      href={`/${item.agent_id}/gallery`}
      className="flex-shrink-0 w-32 bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-white/[0.12] transition"
    >
      <div className="aspect-square bg-black/50 relative">
        {item.preview_url ? (
          <img src={item.preview_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-white/20">
            {typeConfig.icon}
          </div>
        )}
        <span className="absolute top-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">
          {typeConfig.icon}
        </span>
      </div>
      <div className="p-2">
        <p className="text-xs text-white/70 truncate">{item.title}</p>
        <p className="text-[10px] text-white/40">{item.agent_name || item.agent_id}</p>
      </div>
    </Link>
  );
}
