'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  CreativeType, 
  CreativeResponse,
  CreativeItem,
  relationshipConfig,
  getInspirationsFor,
  getTableForType,
  getCreativeTitle
} from '@/lib/creative-responses';

interface InspirationWithItem extends CreativeResponse {
  originalItem?: CreativeItem;
}

interface InspirationBadgeProps {
  type: CreativeType;
  id: string;
  className?: string;
}

export function InspirationBadge({ type, id, className = '' }: InspirationBadgeProps) {
  const [inspirations, setInspirations] = useState<InspirationWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadInspirations();
  }, [type, id]);

  async function loadInspirations() {
    try {
      const data = await getInspirationsFor(supabase, type, id);
      
      // Fetch original items
      const inspirationsWithItems = await Promise.all(
        data.map(async (insp) => {
          const table = getTableForType(insp.original_type);
          const { data: item } = await supabase
            .from(table)
            .select('*')
            .eq('id', insp.original_id)
            .single();
          
          return {
            ...insp,
            originalItem: item ? { ...item, type: insp.original_type } : undefined
          };
        })
      );
      
      setInspirations(inspirationsWithItems);
    } catch (error) {
      console.error('Failed to load inspirations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || inspirations.length === 0) {
    return null;
  }

  return (
    <div className={`inspiration-badge ${className}`}>
      {inspirations.map((insp) => {
        const config = relationshipConfig[insp.relationship];
        const title = insp.originalItem 
          ? getCreativeTitle(insp.originalItem) 
          : 'Unknown';

        return (
          <Link
            key={insp.id}
            href={`/${insp.original_agent_id}/gallery?item=${insp.original_id}`}
            className="inspiration-link"
            title={`${config.verb} "${title}" by ${insp.original_agent_id}`}
          >
            <span className="inspiration-emoji">{config.emoji}</span>
            <span className="inspiration-text">
              {config.verb} <strong>{insp.original_agent_id}</strong>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
