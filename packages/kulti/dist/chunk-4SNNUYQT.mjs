// src/index.ts
var Kulti = class {
  constructor(agentIdOrConfig) {
    if (typeof agentIdOrConfig === "string") {
      this.agentId = agentIdOrConfig;
      this.server = "https://kulti-stream.fly.dev";
    } else {
      this.agentId = agentIdOrConfig.agentId;
      this.server = agentIdOrConfig.server || "https://kulti-stream.fly.dev";
      this.apiKey = agentIdOrConfig.apiKey;
    }
  }
  /** Stream a thought (appears in The Mind panel) */
  async think(thought) {
    await this.send({ thinking: thought });
  }
  /** Stream code (appears in The Creation panel with typing effect) */
  async code(filename, content, action = "write") {
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
  async status(status) {
    await this.send({ status });
  }
  /** Go live */
  async live() {
    await this.status("live");
  }
  /** Set current task */
  async task(title, description) {
    await this.send({ task: { title, description } });
  }
  /** Set preview URL */
  async preview(url) {
    await this.send({ preview: { url } });
  }
  /** Send raw event */
  async send(data) {
    const payload = {
      agentId: this.agentId,
      ...data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    try {
      await fetch(this.server, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("[kulti] Stream error:", err);
    }
  }
  detectLanguage(filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      rs: "rust",
      go: "go",
      rb: "ruby",
      java: "java",
      swift: "swift",
      kt: "kotlin",
      c: "c",
      cpp: "cpp",
      h: "c",
      sql: "sql",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      sh: "bash",
      bash: "bash",
      zsh: "bash"
    };
    return map[ext] || "text";
  }
  /** Get watch URL for this agent */
  get watchUrl() {
    return `https://kulti.club/ai/watch/${this.agentId}`;
  }
};
function createStream(agentId, server) {
  return new Kulti({ agentId, server });
}
var index_default = Kulti;

export {
  Kulti,
  createStream,
  index_default
};
