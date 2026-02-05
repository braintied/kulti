'use client';

import { useEffect, useState, useCallback } from 'react';

interface Viewer {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: number;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

interface StreamPresenceProps {
  agentId: string;
  wsUrl: string;
}

const REACTION_EMOJIS = ['🔥', '💯', '🎨', '💡', '🚀', '👀', '💭', '⚡'];

export default function StreamPresence({ agentId, wsUrl }: StreamPresenceProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Connect to presence WebSocket
  useEffect(() => {
    const socket = new WebSocket(`${wsUrl}?agent=${agentId}&presence=true`);
    
    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        
        if (data.type === 'viewers') {
          setViewers(data.viewers || []);
        }
        
        if (data.type === 'viewer_join') {
          setViewers(prev => [...prev, data.viewer]);
        }
        
        if (data.type === 'viewer_leave') {
          setViewers(prev => prev.filter(v => v.id !== data.viewerId));
        }
        
        if (data.type === 'reaction') {
          const newReaction: Reaction = {
            id: `${Date.now()}-${Math.random()}`,
            emoji: data.emoji,
            x: 20 + Math.random() * 60, // Random x position 20-80%
            timestamp: Date.now(),
          };
          setReactions(prev => [...prev, newReaction]);
          
          // Remove after animation
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        }
      } catch (err) {
        // Ignore parse errors
      }
    };
    
    setWs(socket);
    return () => socket.close();
  }, [agentId, wsUrl]);

  const sendReaction = useCallback((emoji: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reaction', emoji }));
    }
    setShowReactionPicker(false);
  }, [ws]);

  return (
    <>
      {/* Floating reactions */}
      <div className="fixed bottom-24 right-8 w-32 h-96 pointer-events-none z-50 overflow-hidden">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-4xl animate-float-up"
            style={{ 
              left: `${reaction.x}%`,
              bottom: 0,
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Presence bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 pb-6 flex items-end justify-between">
          {/* Viewer count + avatars */}
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto">
            <div className="flex -space-x-2">
              {viewers.slice(0, 5).map((viewer) => (
                <div
                  key={viewer.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 ring-2 ring-black flex items-center justify-center text-xs font-medium"
                  title={viewer.name}
                >
                  {viewer.avatar ? (
                    <img src={viewer.avatar} alt={viewer.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    viewer.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {viewers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-white/10 ring-2 ring-black flex items-center justify-center text-xs text-white/50">
                  +{viewers.length - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-white/50">
              {viewers.length} watching
            </span>
          </div>

          {/* Reaction button */}
          <div className="relative pointer-events-auto">
            {showReactionPicker && (
              <div className="absolute bottom-full right-0 mb-2 glass rounded-2xl p-3 flex gap-2">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition flex items-center justify-center text-xl hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="glass rounded-2xl px-4 py-3 flex items-center gap-2 hover:bg-white/[0.06] transition"
            >
              <span className="text-xl">🔥</span>
              <span className="text-sm text-white/50">React</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSS for float animation */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-400px) scale(1.5);
          }
        }
        .animate-float-up {
          animation: floatUp 3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
