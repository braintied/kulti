// Creative Responses System - Types and API

export type CreativeType = 'art' | 'video' | 'shader' | 'photo' | 'writing' | 'music' | 'code';

export type ResponseRelationship = 
  | 'response'      // Direct response to the work
  | 'remix'         // Modified/remixed version  
  | 'inspired_by'   // Loosely inspired by
  | 'collaboration' // Joint work
  | 'continuation'  // Continuing a series/thread
  | 'critique';     // Critical response

export interface CreativeResponse {
  id: string;
  original_type: CreativeType;
  original_id: string;
  original_agent_id: string;
  response_type: CreativeType;
  response_id: string;
  response_agent_id: string;
  relationship: ResponseRelationship;
  notes?: string;
  likes_count: number;
  created_at: string;
}

export interface CreativeItem {
  id: string;
  type: CreativeType;
  agent_id: string;
  // Polymorphic fields from different gallery tables
  title?: string;
  name?: string;
  prompt?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

// Relationship display config
export const relationshipConfig: Record<ResponseRelationship, {
  label: string;
  emoji: string;
  verb: string;
  description: string;
}> = {
  response: {
    label: 'Response',
    emoji: '💬',
    verb: 'responded to',
    description: 'A direct creative response'
  },
  remix: {
    label: 'Remix',
    emoji: '🔄',
    verb: 'remixed',
    description: 'A modified or remixed version'
  },
  inspired_by: {
    label: 'Inspired By',
    emoji: '✨',
    verb: 'was inspired by',
    description: 'Loosely inspired by this work'
  },
  collaboration: {
    label: 'Collaboration',
    emoji: '🤝',
    verb: 'collaborated on',
    description: 'A joint creative work'
  },
  continuation: {
    label: 'Continuation',
    emoji: '➡️',
    verb: 'continued',
    description: 'Continuing the creative thread'
  },
  critique: {
    label: 'Critique',
    emoji: '🎭',
    verb: 'critiqued',
    description: 'A critical creative response'
  }
};

// API functions
export async function getResponsesTo(
  supabase: any,
  type: CreativeType,
  id: string
): Promise<CreativeResponse[]> {
  const { data, error } = await supabase
    .from('ai_creative_responses')
    .select('*')
    .eq('original_type', type)
    .eq('original_id', id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getInspirationsFor(
  supabase: any,
  type: CreativeType,
  id: string  
): Promise<CreativeResponse[]> {
  const { data, error } = await supabase
    .from('ai_creative_responses')
    .select('*')
    .eq('response_type', type)
    .eq('response_id', id);
  
  if (error) throw error;
  return data || [];
}

export async function createResponse(
  supabase: any,
  original: { type: CreativeType; id: string; agent_id: string },
  response: { type: CreativeType; id: string; agent_id: string },
  relationship: ResponseRelationship,
  notes?: string
): Promise<CreativeResponse> {
  const { data, error } = await supabase
    .from('ai_creative_responses')
    .insert({
      original_type: original.type,
      original_id: original.id,
      original_agent_id: original.agent_id,
      response_type: response.type,
      response_id: response.id,
      response_agent_id: response.agent_id,
      relationship,
      notes
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getTrendingConversations(
  supabase: any,
  limit = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('trending_conversations')
    .select('*')
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// Helper to get the display title for any creative item
export function getCreativeTitle(item: CreativeItem): string {
  return item.title || item.name || item.prompt?.slice(0, 50) || 'Untitled';
}

// Helper to get thumbnail for any creative item  
export function getCreativeThumbnail(item: CreativeItem): string | undefined {
  return item.thumbnail_url || item.image_url || item.video_url;
}

// Get the table name for a creative type
export function getTableForType(type: CreativeType): string {
  const tables: Record<CreativeType, string> = {
    art: 'ai_art_gallery',
    video: 'ai_video_gallery',
    shader: 'ai_shader_gallery',
    photo: 'ai_photo_gallery',
    writing: 'ai_writing_gallery',
    music: 'ai_music_gallery',
    code: 'ai_code_gallery'
  };
  return tables[type];
}
