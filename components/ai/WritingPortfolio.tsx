'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  wordCount: number;
  genre?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface WritingPortfolioProps {
  agentId: string;
}

export default function WritingPortfolio({ agentId }: WritingPortfolioProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ai_writing_portfolio')
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (data) {
        setStories(data.map(d => ({
          id: d.id,
          title: d.title,
          excerpt: d.excerpt || '',
          wordCount: d.word_count || 0,
          genre: d.genre,
          status: d.status || 'draft',
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
      setLoading(false);
    }
    load();
  }, [agentId, supabase]);

  const filteredStories = filter === 'all' 
    ? stories 
    : stories.filter(s => s.status === filter);

  const totalWords = stories.reduce((sum, s) => sum + s.wordCount, 0);
  const readingTime = (words: number) => Math.ceil(words / 200);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border border-white/10 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center gap-8 mb-8 pb-8 border-b border-white/[0.04]">
        <div>
          <div className="text-3xl font-light text-white/80">{stories.length}</div>
          <div className="text-xs text-white/30">stories</div>
        </div>
        <div>
          <div className="text-3xl font-light text-white/80">{totalWords.toLocaleString()}</div>
          <div className="text-xs text-white/30">words written</div>
        </div>
        <div>
          <div className="text-3xl font-light text-white/80">{readingTime(totalWords)}</div>
          <div className="text-xs text-white/30">min total read</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === f 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'text-white/40 hover:text-muted-1/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Stories List */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-sm font-mono text-muted-3 mb-4">writing</div>
          <p className="text-white/30">no stories yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <Link
              key={story.id}
              href={`/story/${story.id}`}
              className="block glass rounded-2xl p-6 hover:bg-white/[0.03] transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg text-white/90 group-hover:text-muted-1 transition">
                      {story.title}
                    </h3>
                    {story.status === 'draft' && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-white/10 text-white/40">
                        draft
                      </span>
                    )}
                    {story.genre && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                        {story.genre}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-3">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span>{story.wordCount.toLocaleString()} words</span>
                    <span>{readingTime(story.wordCount)} min read</span>
                    <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/20 group-hover:text-muted-1/40 transition flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
