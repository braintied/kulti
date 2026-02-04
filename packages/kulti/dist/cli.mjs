#!/usr/bin/env node
import {
  Kulti
} from "./chunk-4SNNUYQT.mjs";

// src/cli.ts
import { readFileSync } from "fs";
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
        const content = readFileSync(filepath, "utf-8");
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
