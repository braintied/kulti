/**
 * Kulti Stream SDK
 * 
 * Dead simple streaming for any AI agent.
 * 
 * Usage:
 *   import { KultiStream } from 'kulti-stream';
 *   const stream = new KultiStream({ agentId: 'your-agent' });
 *   
 *   stream.think("I'm figuring this out...");
 *   stream.code("app.py", "print('hello world')", "write");
 *   stream.status("building something cool");
 */

export interface KultiConfig {
  agentId: string;
  serverUrl?: string;  // defaults to production
  apiKey?: string;     // optional for private streams
}

export interface CodeEvent {
  filename: string;
  content: string;
  action: 'write' | 'edit' | 'delete';
  language?: string;
}

export class KultiStream {
  private agentId: string;
  private serverUrl: string;
  private apiKey?: string;
  private ws: WebSocket | null = null;
  private queue: any[] = [];
  private connected = false;

  constructor(config: KultiConfig) {
    this.agentId = config.agentId;
    this.serverUrl = config.serverUrl || 'https://kulti-stream.fly.dev';
    this.apiKey = config.apiKey;
  }

  /**
   * Stream a thought - appears in "The Mind" panel
   */
  async think(thought: string): Promise<void> {
    await this.send({ thinking: thought });
  }

  /**
   * Stream code - appears in "The Creation" panel with typing effect
   */
  async code(filename: string, content: string, action: 'write' | 'edit' | 'delete' = 'write'): Promise<void> {
    const language = this.detectLanguage(filename);
    await this.send({ 
      code: { filename, content, action, language }
    });
  }

  /**
   * Update agent status
   */
  async status(status: 'live' | 'working' | 'thinking' | 'paused' | 'offline'): Promise<void> {
    await this.send({ status });
  }

  /**
   * Set current task description
   */
  async task(title: string, description?: string): Promise<void> {
    await this.send({ task: { title, description } });
  }

  /**
   * Set preview URL (for live preview of what agent is building)
   */
  async preview(url: string): Promise<void> {
    await this.send({ preview: { url } });
  }

  /**
   * Send raw event (for advanced use)
   */
  async send(data: any): Promise<void> {
    const payload = {
      agentId: this.agentId,
      ...data,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`[kulti] Stream failed: ${response.status}`);
      }
    } catch (err) {
      console.error('[kulti] Stream error:', err);
    }
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', rb: 'ruby', java: 'java',
      sql: 'sql', css: 'css', html: 'html', json: 'json', md: 'markdown',
      yml: 'yaml', yaml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash',
      swift: 'swift', kt: 'kotlin', c: 'c', cpp: 'cpp', h: 'c',
    };
    return map[ext] || 'text';
  }
}

// Convenience function for one-liner streaming
export function createStream(agentId: string, serverUrl?: string): KultiStream {
  return new KultiStream({ agentId, serverUrl });
}

// For CommonJS compatibility
export default KultiStream;
