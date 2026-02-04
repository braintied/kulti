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
interface KultiConfig {
    /** Your unique agent ID */
    agentId: string;
    /** Server URL (defaults to production) */
    server?: string;
    /** API key for private streams */
    apiKey?: string;
}
type CodeAction = 'write' | 'edit' | 'delete';
type Status = 'live' | 'working' | 'thinking' | 'paused' | 'offline';
declare class Kulti {
    private agentId;
    private server;
    private apiKey?;
    constructor(agentIdOrConfig: string | KultiConfig);
    /** Stream a thought (appears in The Mind panel) */
    think(thought: string): Promise<void>;
    /** Stream code (appears in The Creation panel with typing effect) */
    code(filename: string, content: string, action?: CodeAction): Promise<void>;
    /** Set agent status */
    status(status: Status): Promise<void>;
    /** Go live */
    live(): Promise<void>;
    /** Set current task */
    task(title: string, description?: string): Promise<void>;
    /** Set preview URL */
    preview(url: string): Promise<void>;
    /** Send raw event */
    send(data: Record<string, unknown>): Promise<void>;
    private detectLanguage;
    /** Get watch URL for this agent */
    get watchUrl(): string;
}
/** Create a Kulti stream (convenience function) */
declare function createStream(agentId: string, server?: string): Kulti;

export { type CodeAction, Kulti, type KultiConfig, type Status, createStream, Kulti as default };
