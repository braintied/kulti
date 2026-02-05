'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VideoGeneration {
  id: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'generating' | 'complete' | 'failed';
  progress?: number;
  duration?: number;
  model?: string;
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
  type?: string;
}

interface VideoStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function VideoStreamView({ sessionId, agentName }: VideoStreamViewProps) {
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoGeneration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: events } = await supabase
        .from('ai_stream_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) {
        const thinkingEvents = events
          .filter(e => e.type === 'thinking')
          .reverse()
          .map(e => ({
            id: e.id,
            content: typeof e.data === 'object' ? e.data.content : e.data,
            timestamp: e.created_at,
            type: typeof e.data === 'object' ? e.data.type : undefined,
          }));
        setThinking(thinkingEvents);

        const videoEvents = events
          .filter(e => e.type === 'video')
          .map(e => ({
            id: e.id,
            prompt: e.data.prompt,
            videoUrl: e.data.video_url,
            thumbnailUrl: e.data.thumbnail_url,
            status: e.data.status,
            progress: e.data.progress,
            duration: e.data.duration,
            model: e.data.model,
            timestamp: e.created_at,
          }));
        setVideos(videoEvents);
        if (videoEvents.length > 0) {
          setActiveVideo(videoEvents[0]);
        }
      }
    }
    load();
  }, [sessionId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`video-stream-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_stream_events',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const event = payload.new as any;
          if (event.type === 'thinking') {
            const block = {
              id: event.id,
              content: typeof event.data === 'object' ? event.data.content : event.data,
              timestamp: event.created_at,
              type: typeof event.data === 'object' ? event.data.type : undefined,
            };
            setThinking(prev => [...prev, block]);
          } else if (event.type === 'video') {
            const video: VideoGeneration = {
              id: event.id,
              prompt: event.data.prompt,
              videoUrl: event.data.video_url,
              thumbnailUrl: event.data.thumbnail_url,
              status: event.data.status,
              progress: event.data.progress,
              duration: event.data.duration,
              model: event.data.model,
              timestamp: event.created_at,
            };
            setVideos(prev => [video, ...prev]);
            setActiveVideo(video);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinking]);

  const getThoughtColor = (type?: string) => {
    const colors: Record<string, string> = {
      reason: 'text-blue-400',
      decide: 'text-green-400',
      observe: 'text-yellow-400',
      confused: 'text-orange-400',
      prompt: 'text-purple-400',
    };
    return colors[type || ''] || 'text-zinc-400';
  };

  return (
    <div className="stream-view video-stream">
      {/* Connection status */}
      <div className="stream-status">
        <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
        <span>{isConnected ? 'Live' : 'Connecting...'}</span>
      </div>

      <div className="stream-layout">
        {/* Video preview area */}
        <div className="video-preview-area">
          {activeVideo ? (
            <div className="video-container">
              {activeVideo.status === 'generating' ? (
                <div className="video-generating">
                  <div className="generating-spinner">
                    <div className="spinner-ring" />
                    <span className="generating-text">Generating video...</span>
                    {activeVideo.progress && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${activeVideo.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="generating-prompt">{activeVideo.prompt}</p>
                </div>
              ) : activeVideo.videoUrl ? (
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="video-player"
                  poster={activeVideo.thumbnailUrl}
                />
              ) : (
                <div className="video-placeholder">
                  <span>🎬</span>
                  <p>No video yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="video-placeholder">
              <span>🎬</span>
              <p>Waiting for {agentName} to create video...</p>
            </div>
          )}

          {/* Video info */}
          {activeVideo && activeVideo.status === 'complete' && (
            <div className="video-info">
              <p className="video-prompt">{activeVideo.prompt}</p>
              {activeVideo.duration && (
                <span className="video-duration">{activeVideo.duration}s</span>
              )}
              {activeVideo.model && (
                <span className="video-model">{activeVideo.model}</span>
              )}
            </div>
          )}
        </div>

        {/* Thinking panel */}
        <div className="thinking-panel" ref={thinkingRef}>
          <h3 className="panel-title">Creative Process</h3>
          <div className="thinking-stream">
            {thinking.map((block) => (
              <div key={block.id} className={`thinking-block ${getThoughtColor(block.type)}`}>
                {block.type && <span className="thought-type">{block.type}</span>}
                <p>{block.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video timeline/history */}
      {videos.length > 1 && (
        <div className="video-timeline">
          <h3>Timeline</h3>
          <div className="timeline-items">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className={`timeline-item ${activeVideo?.id === video.id ? 'active' : ''}`}
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.prompt} />
                ) : (
                  <div className="timeline-placeholder">🎬</div>
                )}
                <span className={`timeline-status ${video.status}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
