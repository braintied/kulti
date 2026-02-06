'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Shader {
  id: string;
  name: string;
  description?: string;
  fragment_shader: string;
  vertex_shader?: string;
  thumbnail_url?: string;
  views: number;
  likes: number;
  created_at: string;
  tags?: string[];
}

interface ShaderPortfolioProps {
  agentId: string;
  agentName: string;
}

// Mini WebGL preview component
function ShaderPreview({ shader, size = 200 }: { shader: Shader; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Simple vertex shader
    const vertexSource = shader.vertex_shader || `
      attribute vec4 position;
      void main() { gl_Position = position; }
    `;

    // Compile shaders
    const compileShader = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, shader.fragment_shader);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // Setup buffer
    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Render loop
    const render = () => {
      const timeLoc = gl.getUniformLocation(program, 'u_time');
      const resLoc = gl.getUniformLocation(program, 'u_resolution');
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (timeLoc) gl.uniform1f(timeLoc, elapsed);
      if (resLoc) gl.uniform2f(resLoc, size, size);

      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [shader, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="shader-preview-canvas"
    />
  );
}

export default function ShaderPortfolio({ agentId, agentName }: ShaderPortfolioProps) {
  const [shaders, setShaders] = useState<Shader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShader, setSelectedShader] = useState<Shader | null>(null);
  const [showCode, setShowCode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadShaders() {
      const { data } = await supabase
        .from('ai_shader_gallery')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (data) {
        setShaders(data);
      }
      setLoading(false);
    }
    loadShaders();
  }, [agentId, supabase]);

  const handleLike = async (shaderId: string) => {
    const { error } = await supabase.rpc('increment_shader_likes', { shader_id: shaderId });
    if (!error) {
      setShaders(prev => prev.map(s => 
        s.id === shaderId ? { ...s, likes: s.likes + 1 } : s
      ));
    }
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner" />
        <p>Loading shaders...</p>
      </div>
    );
  }

  if (shaders.length === 0) {
    return (
      <div className="portfolio-empty">
        <span className="empty-icon"></span>
        <h3>No shaders yet</h3>
        <p>{agentName} hasn&apos;t created any shaders yet.</p>
      </div>
    );
  }

  return (
    <div className="shader-portfolio">
      {/* Shader modal */}
      {selectedShader && (
        <div className="shader-modal" onClick={() => setSelectedShader(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedShader(null)}>×</button>
            <div className="modal-shader-preview">
              <ShaderPreview shader={selectedShader} size={600} />
            </div>
            <div className="modal-info">
              <h2>{selectedShader.name}</h2>
              {selectedShader.description && <p>{selectedShader.description}</p>}
              {selectedShader.tags && (
                <div className="shader-tags">
                  {selectedShader.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button onClick={() => handleLike(selectedShader.id)} className="like-btn">
                  {selectedShader.likes}
                </button>
                <button onClick={() => setShowCode(!showCode)} className="code-btn">
                  {showCode ? 'Hide Code' : 'View Code'}
                </button>
              </div>
              {showCode && (
                <div className="shader-code-display">
                  <h4>Fragment Shader</h4>
                  <pre>{selectedShader.fragment_shader}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shader grid */}
      <div className="shader-grid">
        {shaders.map((shader) => (
          <div
            key={shader.id}
            className="shader-card"
            onClick={() => {
              setSelectedShader(shader);
              setShowCode(false);
            }}
          >
            <div className="shader-preview-wrapper">
              <ShaderPreview shader={shader} size={250} />
            </div>
            <div className="shader-info">
              <h3>{shader.name}</h3>
              <div className="shader-stats">
                <span>{shader.views} views</span>
                <span>{shader.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
