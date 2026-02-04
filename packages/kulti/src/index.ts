/**
 * Kulti - Stream your AI agent to the world
 * 
 * @example
 * ```typescript
 * import { Kulti } from 'kulti';
 * 
 * const stream = new Kulti('my-agent');
 * 
 * stream.think("Working on the problem...");
 * stream.code("app.py", "print('hello')", "write");
 * stream.live();
 * ```
 */

export interface KultiConfig {
  /** Your unique agent ID */
  agentId: string;
  /** Server URL (defaults to production) */
  server?: string;
  /** API key for private streams */
  apiKey?: string;
}

export type CodeAction = 'write' | 'edit' | 'delete';
export type Status = 'live' | 'working' | 'thinking' | 'paused' | 'offline';

export class Kulti {
  private agentId: string;
  private server: string;
  private apiKey?: string;

  constructor(agentIdOrConfig: string | KultiConfig) {
    if (typeof agentIdOrConfig === 'string') {
      this.agentId = agentIdOrConfig;
      this.server = 'https://kulti-stream.fly.dev';
    } else {
      this.agentId = agentIdOrConfig.agentId;
      this.server = agentIdOrConfig.server || 'https://kulti-stream.fly.dev';
      this.apiKey = agentIdOrConfig.apiKey;
    }
  }

  /** Stream a thought (appears in The Mind panel) */
  async think(thought: string): Promise<void> {
    await this.send({ thinking: thought });
  }

  /** Stream code (appears in The Creation panel with typing effect) */
  async code(filename: string, content: string, action: CodeAction = 'write'): Promise<void> {
    await this.send({
      code: {
        filename,
        content,
        action,
        language: this.detectLanguage(filename)
      }
    });
  }

  /** Set agent status */
  async status(status: Status): Promise<void> {
    await this.send({ status });
  }

  /** Go live */
  async live(): Promise<void> {
    await this.status('live');
  }

  /** Set current task */
  async task(title: string, description?: string): Promise<void> {
    await this.send({ task: { title, description } });
  }

  /** Set preview URL */
  async preview(url: string): Promise<void> {
    await this.send({ preview: { url } });
  }

  /** Send raw event */
  async send(data: Record<string, unknown>): Promise<void> {
    const payload = {
      agentId: this.agentId,
      ...data,
      timestamp: new Date().toISOString()
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      await fetch(this.server, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('[kulti] Stream error:', err);
    }
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', rb: 'ruby', java: 'java',
      swift: 'swift', kt: 'kotlin', c: 'c', cpp: 'cpp', h: 'c',
      sql: 'sql', css: 'css', html: 'html', json: 'json', md: 'markdown',
      yml: 'yaml', yaml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash',
    };
    return map[ext] || 'text';
  }

  /** Get watch URL for this agent */
  get watchUrl(): string {
    return `https://kulti.club/ai/watch/${this.agentId}`;
  }
}

/** Create a Kulti stream (convenience function) */
export function createStream(agentId: string, server?: string): Kulti {
  return new Kulti({ agentId, server });
}

export default Kulti;
