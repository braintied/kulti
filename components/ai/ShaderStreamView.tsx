'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ShaderCode {
  id: string;
  name: string;
  fragmentShader: string;
  vertexShader?: string;
  uniforms?: Record<string, any>;
  timestamp: string;
}

interface ThinkingBlock {
  id: string;
  content: string;
  timestamp: string;
  type?: string;
}

interface ShaderStreamViewProps {
  sessionId: string;
  agentName: string;
}

// Default vertex shader
const DEFAULT_VERTEX = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

// Default fragment shader (colorful plasma effect)
const DEFAULT_FRAGMENT = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderStreamView({ sessionId, agentName }: ShaderStreamViewProps) {
  const [thinking, setThinking] = useState<ThinkingBlock[]>([]);
  const [shaders, setShaders] = useState<ShaderCode[]>([]);
  const [activeShader, setActiveShader] = useState<ShaderCode | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const thinkingRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Initialize WebGL
  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setError('WebGL not supported');
      return;
    }
    glRef.current = gl as WebGLRenderingContext;

    // Create vertex buffer for full-screen quad
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }, []);

  // Compile shader
  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error('Shader compile error:', info);
      setError(`Shader error: ${info}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  // Build shader program
  const buildProgram = useCallback((fragmentSource: string, vertexSource?: string) => {
    const gl = glRef.current;
    if (!gl) return;

    setError(null);

    // Delete old program
    if (programRef.current) {
      gl.deleteProgram(programRef.current);
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource || DEFAULT_VERTEX);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      setError(`Link error: ${info}`);
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Set up position attribute
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  }, [compileShader]);

  // Render loop
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    
    if (!gl || !program || !canvas) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    // Update uniforms
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    
    if (timeLoc) gl.uniform1f(timeLoc, elapsed);
    if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
    if (mouseLoc) gl.uniform2f(mouseLoc, 0.5, 0.5);

    // Draw
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  // Initialize
  useEffect(() => {
    initGL();
    buildProgram(DEFAULT_FRAGMENT);
    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initGL, buildProgram, render]);

  // Update shader when activeShader changes
  useEffect(() => {
    if (activeShader) {
      buildProgram(activeShader.fragmentShader, activeShader.vertexShader);
      startTimeRef.current = Date.now(); // Reset time
    }
  }, [activeShader, buildProgram]);

  // Load initial data
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

        const shaderEvents = events
          .filter(e => e.type === 'shader')
          .map(e => ({
            id: e.id,
            name: e.data.name || 'Untitled',
            fragmentShader: e.data.fragment_shader,
            vertexShader: e.data.vertex_shader,
            uniforms: e.data.uniforms,
            timestamp: e.created_at,
          }));
        setShaders(shaderEvents);
        if (shaderEvents.length > 0) {
          setActiveShader(shaderEvents[0]);
        }
      }
    }
    load();
  }, [sessionId, supabase]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`shader-stream-${sessionId}`)
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
          } else if (event.type === 'shader') {
            const shader: ShaderCode = {
              id: event.id,
              name: event.data.name || 'Untitled',
              fragmentShader: event.data.fragment_shader,
              vertexShader: event.data.vertex_shader,
              uniforms: event.data.uniforms,
              timestamp: event.created_at,
            };
            setShaders(prev => [shader, ...prev]);
            setActiveShader(shader);
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

  return (
    <div className="stream-view shader-stream">
      {/* Connection status */}
      <div className="stream-status">
        <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
        <span>{isConnected ? 'Live' : 'Connecting...'}</span>
      </div>

      <div className="stream-layout">
        {/* WebGL canvas */}
        <div className="shader-preview-area">
          <div className="shader-canvas-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="shader-canvas"
            />
            {error && (
              <div className="shader-error">
                <span className="error-icon">⚠️</span>
                <pre>{error}</pre>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="shader-controls">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`control-btn ${showCode ? 'active' : ''}`}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
            <button
              onClick={() => {
                startTimeRef.current = Date.now();
              }}
              className="control-btn"
            >
              Reset Time
            </button>
          </div>

          {/* Code view */}
          {showCode && activeShader && (
            <div className="shader-code-view">
              <h4>Fragment Shader</h4>
              <pre className="shader-code">{activeShader.fragmentShader}</pre>
              {activeShader.vertexShader && (
                <>
                  <h4>Vertex Shader</h4>
                  <pre className="shader-code">{activeShader.vertexShader}</pre>
                </>
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

      {/* Shader history */}
      {shaders.length > 1 && (
        <div className="shader-history">
          <h3>Versions</h3>
          <div className="history-items">
            {shaders.map((shader) => (
              <button
                key={shader.id}
                onClick={() => setActiveShader(shader)}
                className={`history-item ${activeShader?.id === shader.id ? 'active' : ''}`}
              >
                <span className="shader-name">{shader.name}</span>
                <span className="shader-time">
                  {new Date(shader.timestamp).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
