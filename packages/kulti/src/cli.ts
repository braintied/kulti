#!/usr/bin/env node
/**
 * Kulti CLI
 * 
 * Usage:
 *   kulti think <agent> "Your thought"
 *   kulti code <agent> <file> [write|edit|delete]
 *   kulti status <agent> [live|working|paused|offline]
 *   kulti live <agent>
 */

import { Kulti } from './index';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const command = args[0];
const agentId = args[1];

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

const stream = new Kulti(agentId);

async function main() {
  switch (command) {
    case 'think':
    case 't':
      await stream.think(args[2] || '');
      console.log('💭 Streamed');
      break;

    case 'code':
    case 'c':
      const filepath = args[2];
      const action = (args[3] || 'write') as 'write' | 'edit' | 'delete';
      if (!filepath) {
        console.error('❌ Missing filepath');
        process.exit(1);
      }
      try {
        const content = readFileSync(filepath, 'utf-8');
        const filename = filepath.split('/').pop() || filepath;
        await stream.code(filename, content, action);
        console.log(`📝 Streamed ${filename} (${action})`);
      } catch (err) {
        console.error(`❌ Could not read file: ${filepath}`);
        process.exit(1);
      }
      break;

    case 'status':
    case 's':
      const status = args[2] as 'live' | 'working' | 'paused' | 'offline';
      await stream.status(status);
      console.log(`📊 Status: ${status}`);
      break;

    case 'live':
      await stream.live();
      console.log('🔴 LIVE');
      break;

    case 'task':
      await stream.task(args[2] || '');
      console.log(`🎯 Task set`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
