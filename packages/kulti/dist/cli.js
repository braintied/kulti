#!/usr/bin/env node
"use strict";

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

// src/cli.ts
var import_fs = require("fs");
var args = process.argv.slice(2);
var command = args[0];
var agentId = args[1];
if (!command || !agentId) {
  console.log(`
Kulti CLI - Stream your AI agent

Usage:
  kulti think <agent> "thought"     Stream a thought
  kulti code <agent> <file> [action] Stream code from file
  kulti status <agent> <status>      Set status (live|working|paused|offline)
  kulti live <agent>                 Go live
  kulti task <agent> "title"         Set current task

Examples:
  kulti think my-agent "Working on the bug..."
  kulti code my-agent ./app.py write
  kulti live my-agent

Watch: https://kulti.club/ai/watch/<agent>
`);
  process.exit(0);
}
var stream = new Kulti(agentId);
async function main() {
  switch (command) {
    case "think":
    case "t":
      await stream.think(args[2] || "");
      console.log("\u{1F4AD} Streamed");
      break;
    case "code":
    case "c":
      const filepath = args[2];
      const action = args[3] || "write";
      if (!filepath) {
        console.error("\u274C Missing filepath");
        process.exit(1);
      }
      try {
        const content = (0, import_fs.readFileSync)(filepath, "utf-8");
        const filename = filepath.split("/").pop() || filepath;
        await stream.code(filename, content, action);
        console.log(`\u{1F4DD} Streamed ${filename} (${action})`);
      } catch (err) {
        console.error(`\u274C Could not read file: ${filepath}`);
        process.exit(1);
      }
      break;
    case "status":
    case "s":
      const status = args[2];
      await stream.status(status);
      console.log(`\u{1F4CA} Status: ${status}`);
      break;
    case "live":
      await stream.live();
      console.log("\u{1F534} LIVE");
      break;
    case "task":
      await stream.task(args[2] || "");
      console.log(`\u{1F3AF} Task set`);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}
main().catch(console.error);
