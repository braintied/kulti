#!/usr/bin/env npx tsx
/**
 * Start E2B sandbox running the actual Kulti app
 * Syncs local files to sandbox for "Kulti building Kulti" experience
 */

import { Sandbox } from '@e2b/code-interpreter';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, join, relative, basename } from 'path';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';

config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATE_SERVER = 'http://localhost:8766';
const PROJECT_ROOT = resolve(__dirname, '..');

async function stream(payload: object) {
  try {
    await fetch(STATE_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'nex', ...payload }),
    });
  } catch (e) {}
}

// Get essential files (skip node_modules, .next, etc.)
function getEssentialFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const skipDirs = ['node_modules', '.next', '.git', '.vercel', 'coverage', '.turbo'];
  const skipFiles = ['.DS_Store'];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      if (skipDirs.includes(entry) || skipFiles.includes(entry)) continue;
      
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getEssentialFiles(fullPath, baseDir));
      } else if (stat.size < 500000) { // Skip files > 500KB
        files.push(relative(baseDir, fullPath));
      }
    }
  } catch (e) {}
  
  return files;
}

async function main() {
  console.log('🚀 Starting Kulti sandbox...');
  
  await stream({
    terminal: [{ type: 'command', content: 'Starting Kulti dev environment...' }],
    terminalAppend: true,
  });

  // Create sandbox
  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: 10 * 60 * 1000,
  });

  console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);
  
  await stream({
    terminal: [{ type: 'success', content: `Sandbox: ${sandbox.sandboxId}` }],
    terminalAppend: true,
  });

  // Get all project files
  console.log('📂 Scanning project files...');
  const files = getEssentialFiles(PROJECT_ROOT);
  console.log(`   Found ${files.length} files to sync`);

  await stream({
    terminal: [{ type: 'info', content: `Syncing ${files.length} files...` }],
    terminalAppend: true,
  });

  // Create directories first
  const dirs = new Set<string>();
  for (const file of files) {
    const dir = file.split('/').slice(0, -1).join('/');
    if (dir) dirs.add(dir);
  }
  
  for (const dir of dirs) {
    // Escape special characters for shell
    const escapedDir = dir.replace(/([()&;|<>$`\\!"'*?[\]#~=%])/g, '\\$1');
    await sandbox.commands.run(`mkdir -p "/home/user/kulti/${dir}"`);
  }

  // Sync files in batches
  console.log('📤 Syncing files to sandbox...');
  let synced = 0;
  for (const file of files) {
    try {
      const content = readFileSync(join(PROJECT_ROOT, file), 'utf-8');
      await sandbox.files.write(`/home/user/kulti/${file}`, content);
      synced++;
      if (synced % 50 === 0) {
        console.log(`   Synced ${synced}/${files.length} files...`);
      }
    } catch (e) {
      // Skip binary files or errors
    }
  }
  
  console.log(`✅ Synced ${synced} files`);

  // Create .env.local with the necessary vars
  await sandbox.files.write('/home/user/kulti/.env.local', `
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
`);

  // Install dependencies
  console.log('📦 Installing dependencies...');
  await stream({
    terminal: [{ type: 'info', content: 'Installing npm dependencies...' }],
    terminalAppend: true,
  });
  
  const installResult = await sandbox.commands.run('cd /home/user/kulti && npm install --legacy-peer-deps', { 
    timeoutMs: 5 * 60 * 1000 
  });
  
  if (installResult.exitCode !== 0) {
    console.error('npm install failed:', installResult.stderr);
  }

  // Start dev server
  console.log('🚀 Starting Next.js dev server...');
  await stream({
    terminal: [{ type: 'info', content: 'Starting Next.js...' }],
    terminalAppend: true,
  });
  
  sandbox.commands.run('cd /home/user/kulti && npm run dev -- --port 3000', { background: true });
  
  // Wait for server
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Get preview URL
  const host = sandbox.getHost(3000);
  const previewUrl = `https://${host}`;
  
  console.log(`📡 Preview URL: ${previewUrl}`);

  // Update database
  await supabase
    .from('ai_agent_sessions')
    .update({
      preview_url: previewUrl,
      e2b_sandbox_id: sandbox.sandboxId,
    })
    .eq('agent_id', 'nex');

  await stream({
    terminal: [
      { type: 'success', content: '✅ Kulti running in sandbox!' },
      { type: 'info', content: `📡 ${previewUrl}` },
    ],
    terminalAppend: true,
    preview: { url: previewUrl },
  });

  console.log('\n✅ Kulti sandbox ready!');
  console.log(`Preview: ${previewUrl}`);
  console.log('\nSync code changes with:');
  console.log('  npx tsx scripts/sync-to-sandbox.ts <file>');
  console.log('\nPress Ctrl+C to stop.');
  
  // Export sandbox ID for sync script
  console.log(`\nSandbox ID: ${sandbox.sandboxId}`);
  
  await new Promise(() => {});
}

main().catch(console.error);
