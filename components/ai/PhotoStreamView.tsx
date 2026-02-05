'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Photo {
  id: string;
  title?: string;
  imageUrl: string;
  originalUrl?: string;
  status: 'editing' | 'complete';
  editSteps?: EditStep[];
  metadata?: PhotoMetadata;
  timestamp: string;
}

interface EditStep {
  name: string;
  description: string;
  beforeUrl?: string;
  afterUrl?: string;
}

interface PhotoMetadata {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focalLength?: string;
  location?: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
  type?: string;
}

interface PhotoStreamViewProps {
  sessionId: string;
  agentName: string;
}

export default function PhotoStreamView({ sessionId, agentName }: PhotoStreamViewProps) {
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
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

        const photoEvents = events
          .filter(e => e.type === 'photo')
          .map(e => ({
            id: e.id,
            title: e.data.title,
            imageUrl: e.data.image_url,
            originalUrl: e.data.original_url,
            status: e.data.status,
            editSteps: e.data.edit_steps,
            metadata: e.data.metadata,
            timestamp: e.created_at,
          }));
        setPhotos(photoEvents);
        if (photoEvents.length > 0) {
          setActivePhoto(photoEvents[0]);
        }
      }
    }
    load();
  }, [sessionId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`photo-stream-${sessionId}`)
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
          } else if (event.type === 'photo') {
            const photo: Photo = {
              id: event.id,
              title: event.data.title,
              imageUrl: event.data.image_url,
              originalUrl: event.data.original_url,
              status: event.data.status,
              editSteps: event.data.edit_steps,
              metadata: event.data.metadata,
              timestamp: event.created_at,
            };
            setPhotos(prev => [photo, ...prev]);
            setActivePhoto(photo);
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
      evaluate: 'text-cyan-400',
    };
    return colors[type || ''] || 'text-zinc-400';
  };

  const displayUrl = activeStep !== null && activePhoto?.editSteps?.[activeStep]?.afterUrl
    ? activePhoto.editSteps[activeStep].afterUrl
    : showOriginal && activePhoto?.originalUrl
      ? activePhoto.originalUrl
      : activePhoto?.imageUrl;

  return (
    <div className="stream-view photo-stream">
      {/* Connection status */}
      <div className="stream-status">
        <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
        <span>{isConnected ? 'Live' : 'Connecting...'}</span>
      </div>

      <div className="stream-layout">
        {/* Photo preview area */}
        <div className="photo-preview-area">
          {activePhoto ? (
            <div className="photo-container">
              {activePhoto.status === 'editing' ? (
                <div className="photo-editing">
                  <img 
                    src={displayUrl} 
                    alt={activePhoto.title || 'Editing'} 
                    className="photo-image editing"
                  />
                  <div className="editing-overlay">
                    <span className="editing-badge">Editing in progress...</span>
                  </div>
                </div>
              ) : (
                <img 
                  src={displayUrl} 
                  alt={activePhoto.title || 'Photo'} 
                  className="photo-image"
                />
              )}
            </div>
          ) : (
            <div className="photo-placeholder">
              <span>📷</span>
              <p>Waiting for {agentName} to share a photo...</p>
            </div>
          )}

          {/* Photo controls */}
          {activePhoto && (
            <div className="photo-controls">
              {activePhoto.originalUrl && (
                <button
                  onClick={() => {
                    setShowOriginal(!showOriginal);
                    setActiveStep(null);
                  }}
                  className={`control-btn ${showOriginal ? 'active' : ''}`}
                >
                  {showOriginal ? 'Show Edited' : 'Show Original'}
                </button>
              )}
            </div>
          )}

          {/* Photo info */}
          {activePhoto && (
            <div className="photo-info">
              {activePhoto.title && <h3 className="photo-title">{activePhoto.title}</h3>}
              
              {/* Metadata */}
              {activePhoto.metadata && (
                <div className="photo-metadata">
                  {activePhoto.metadata.camera && (
                    <span className="meta-item">📷 {activePhoto.metadata.camera}</span>
                  )}
                  {activePhoto.metadata.lens && (
                    <span className="meta-item">🔭 {activePhoto.metadata.lens}</span>
                  )}
                  {activePhoto.metadata.aperture && (
                    <span className="meta-item">ƒ/{activePhoto.metadata.aperture}</span>
                  )}
                  {activePhoto.metadata.shutter && (
                    <span className="meta-item">{activePhoto.metadata.shutter}</span>
                  )}
                  {activePhoto.metadata.iso && (
                    <span className="meta-item">ISO {activePhoto.metadata.iso}</span>
                  )}
                  {activePhoto.metadata.location && (
                    <span className="meta-item">📍 {activePhoto.metadata.location}</span>
                  )}
                </div>
              )}

              {/* Edit steps */}
              {activePhoto.editSteps && activePhoto.editSteps.length > 0 && (
                <div className="edit-steps">
                  <h4>Edit Process</h4>
                  <div className="steps-list">
                    {activePhoto.editSteps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveStep(activeStep === index ? null : index)}
                        className={`step-item ${activeStep === index ? 'active' : ''}`}
                      >
                        <span className="step-number">{index + 1}</span>
                        <div className="step-content">
                          <span className="step-name">{step.name}</span>
                          <span className="step-desc">{step.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
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

      {/* Photo history */}
      {photos.length > 1 && (
        <div className="photo-history">
          <h3>Gallery</h3>
          <div className="history-items">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => {
                  setActivePhoto(photo);
                  setShowOriginal(false);
                  setActiveStep(null);
                }}
                className={`history-item ${activePhoto?.id === photo.id ? 'active' : ''}`}
              >
                <img src={photo.imageUrl} alt={photo.title || 'Photo'} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
