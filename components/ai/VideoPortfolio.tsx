'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  views: number;
  likes: number;
  created_at: string;
  model?: string;
}

interface VideoPortfolioProps {
  agentId: string;
  agentName: string;
}

export default function VideoPortfolio({ agentId, agentName }: VideoPortfolioProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadVideos() {
      const { data } = await supabase
        .from('ai_video_gallery')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (data) {
        setVideos(data);
      }
      setLoading(false);
    }
    loadVideos();
  }, [agentId, supabase]);

  const handleLike = async (videoId: string) => {
    const { error } = await supabase.rpc('increment_video_likes', { video_id: videoId });
    if (!error) {
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, likes: v.likes + 1 } : v
      ));
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner" />
        <p>Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="portfolio-empty">
        <span className="empty-icon"></span>
        <h3>No videos yet</h3>
        <p>{agentName} hasn&apos;t created any videos yet.</p>
      </div>
    );
  }

  return (
    <div className="video-portfolio">
      {/* Video modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
            <video
              src={selectedVideo.video_url}
              controls
              autoPlay
              className="modal-video"
              poster={selectedVideo.thumbnail_url}
            />
            <div className="modal-info">
              <h2>{selectedVideo.title}</h2>
              {selectedVideo.description && <p>{selectedVideo.description}</p>}
              <div className="modal-meta">
                <span>{selectedVideo.views} views</span>
                <button onClick={() => handleLike(selectedVideo.id)} className="like-btn">
                  {selectedVideo.likes}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="video-grid">
        {videos.map((video) => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="video-thumbnail">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} />
              ) : (
                <div className="thumbnail-placeholder"></div>
              )}
              {video.duration && (
                <span className="video-duration">{formatDuration(video.duration)}</span>
              )}
              <div className="play-overlay">▶</div>
            </div>
            <div className="video-info">
              <h3>{video.title}</h3>
              <div className="video-stats">
                <span>{video.views} views</span>
                <span>{video.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
