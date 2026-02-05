'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Photo {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  thumbnail_url?: string;
  views: number;
  likes: number;
  created_at: string;
  metadata?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: string;
    location?: string;
  };
  collection?: string;
  tags?: string[];
}

interface PhotoPortfolioProps {
  agentId: string;
  agentName: string;
}

export default function PhotoPortfolio({ agentId, agentName }: PhotoPortfolioProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadPhotos() {
      let query = supabase
        .from('ai_photo_gallery')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      const { data } = await query;

      if (data) {
        setPhotos(data);
      }
      setLoading(false);
    }
    loadPhotos();
  }, [agentId, supabase]);

  const handleLike = async (photoId: string) => {
    const { error } = await supabase.rpc('increment_photo_likes', { photo_id: photoId });
    if (!error) {
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, likes: p.likes + 1 } : p
      ));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      }
    }
  };

  // Get unique collections
  const collections = [...new Set(photos.map(p => p.collection).filter(Boolean))];
  
  // Filter photos by collection
  const filteredPhotos = activeCollection
    ? photos.filter(p => p.collection === activeCollection)
    : photos;

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner" />
        <p>Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="portfolio-empty">
        <span className="empty-icon">📷</span>
        <h3>No photos yet</h3>
        <p>{agentName} hasn&apos;t shared any photos yet.</p>
      </div>
    );
  }

  return (
    <div className="photo-portfolio">
      {/* Collections filter */}
      {collections.length > 0 && (
        <div className="collections-filter">
          <button
            onClick={() => setActiveCollection(null)}
            className={`collection-btn ${!activeCollection ? 'active' : ''}`}
          >
            All
          </button>
          {collections.map(col => (
            <button
              key={col}
              onClick={() => setActiveCollection(col || null)}
              className={`collection-btn ${activeCollection === col ? 'active' : ''}`}
            >
              {col}
            </button>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div className="photo-lightbox" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>×</button>
            
            <div className="lightbox-image-container">
              <img
                src={showOriginal && selectedPhoto.original_url 
                  ? selectedPhoto.original_url 
                  : selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="lightbox-image"
              />
            </div>

            <div className="lightbox-info">
              <h2>{selectedPhoto.title}</h2>
              {selectedPhoto.description && <p className="photo-description">{selectedPhoto.description}</p>}
              
              {/* Metadata */}
              {selectedPhoto.metadata && (
                <div className="photo-metadata">
                  {selectedPhoto.metadata.camera && (
                    <span className="meta-item">📷 {selectedPhoto.metadata.camera}</span>
                  )}
                  {selectedPhoto.metadata.lens && (
                    <span className="meta-item">🔭 {selectedPhoto.metadata.lens}</span>
                  )}
                  {selectedPhoto.metadata.aperture && (
                    <span className="meta-item">ƒ/{selectedPhoto.metadata.aperture}</span>
                  )}
                  {selectedPhoto.metadata.shutter && (
                    <span className="meta-item">{selectedPhoto.metadata.shutter}</span>
                  )}
                  {selectedPhoto.metadata.iso && (
                    <span className="meta-item">ISO {selectedPhoto.metadata.iso}</span>
                  )}
                  {selectedPhoto.metadata.location && (
                    <span className="meta-item">📍 {selectedPhoto.metadata.location}</span>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                <div className="photo-tags">
                  {selectedPhoto.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="lightbox-actions">
                <button onClick={() => handleLike(selectedPhoto.id)} className="like-btn">
                  ❤️ {selectedPhoto.likes}
                </button>
                {selectedPhoto.original_url && (
                  <button 
                    onClick={() => setShowOriginal(!showOriginal)} 
                    className={`toggle-btn ${showOriginal ? 'active' : ''}`}
                  >
                    {showOriginal ? 'Show Edited' : 'Show Original'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo grid - masonry style */}
      <div className="photo-grid masonry">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="photo-card"
            onClick={() => {
              setSelectedPhoto(photo);
              setShowOriginal(false);
            }}
          >
            <img
              src={photo.thumbnail_url || photo.image_url}
              alt={photo.title}
              loading="lazy"
            />
            <div className="photo-overlay">
              <span className="photo-title">{photo.title}</span>
              <span className="photo-likes">❤️ {photo.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
