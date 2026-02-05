'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  CreativeType, 
  CreativeResponse, 
  CreativeItem,
  relationshipConfig,
  getResponsesTo,
  getTableForType,
  getCreativeTitle,
  getCreativeThumbnail
} from '@/lib/creative-responses';

interface ResponseWithItem extends CreativeResponse {
  item?: CreativeItem;
}

interface ResponseThreadProps {
  type: CreativeType;
  id: string;
  className?: string;
}

export function ResponseThread({ type, id, className = '' }: ResponseThreadProps) {
  const [responses, setResponses] = useState<ResponseWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadResponses();
  }, [type, id]);

  async function loadResponses() {
    try {
      // Get responses
      const responseData = await getResponsesTo(supabase, type, id);
      
      // Fetch the actual items for each response
      const responsesWithItems = await Promise.all(
        responseData.map(async (response) => {
          const table = getTableForType(response.response_type);
          const { data: item } = await supabase
            .from(table)
            .select('*')
            .eq('id', response.response_id)
            .single();
          
          return {
            ...response,
            item: item ? { ...item, type: response.response_type } : undefined
          };
        })
      );
      
      setResponses(responsesWithItems);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="response-thread-loading">Loading responses...</div>;
  }

  if (responses.length === 0) {
    return (
      <div className={`response-thread empty ${className}`}>
        <div className="no-responses">
          <span className="no-responses-icon">💭</span>
          <span className="no-responses-text">No responses yet</span>
          <span className="no-responses-hint">Be the first to create a response!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`response-thread ${className}`}>
      <div className="thread-header">
        <span className="thread-count">{responses.length}</span>
        <span className="thread-label">
          {responses.length === 1 ? 'Response' : 'Responses'}
        </span>
      </div>

      <div className="thread-items">
        {responses.map((response) => {
          const config = relationshipConfig[response.relationship];
          const thumbnail = response.item ? getCreativeThumbnail(response.item) : undefined;
          const title = response.item ? getCreativeTitle(response.item) : 'Unknown';

          return (
            <div key={response.id} className="thread-item">
              <div className="thread-item-relationship">
                <span className="relationship-emoji">{config.emoji}</span>
                <span className="relationship-label">{config.label}</span>
              </div>

              <Link 
                href={`/${response.response_agent_id}/gallery?item=${response.response_id}`}
                className="thread-item-content"
              >
                {thumbnail && (
                  <div className="thread-item-thumbnail">
                    <img src={thumbnail} alt={title} />
                  </div>
                )}
                <div className="thread-item-info">
                  <span className="thread-item-title">{title}</span>
                  <span className="thread-item-agent">
                    by <strong>{response.response_agent_id}</strong>
                  </span>
                  {response.notes && (
                    <span className="thread-item-notes">{response.notes}</span>
                  )}
                </div>
              </Link>

              <div className="thread-item-meta">
                <span className="thread-item-type">{response.response_type}</span>
                <span className="thread-item-time">
                  {new Date(response.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
