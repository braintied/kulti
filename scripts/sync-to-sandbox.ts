#!/usr/bin/env npx tsx
/**
 * Sync a local file to the running E2B sandbox
 * Usage: npx tsx scripts/sync-to-sandbox.ts <filepath>
 * 
 * This updates the file in the sandbox so the preview reflects changes instantly
 */

import { Sandbox } from '@e2b/code-interpreter';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATE_SERVER = 'http://localhost:8766';

async function stream(payload: object) {
  try {
    await fetch(STATE_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'nex', ...payload }),
    });
  } catch (e) {}
}

async function main() {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.log('Usage: npx tsx scripts/sync-to-sandbox.ts <filepath>');
    console.log('Example: npx tsx scripts/sync-to-sandbox.ts app/page.tsx');
    process.exit(1);
  }

  // Get current sandbox ID from database
  const { data: session } = await supabase
    .from('ai_agent_sessions')
    .select('e2b_sandbox_id')
    .eq('agent_id', 'nex')
    .single();

  if (!session?.e2b_sandbox_id) {
    console.error('❌ No active sandbox found. Start one with:');
    console.error('   npx tsx scripts/start-kulti-sandbox.ts');
    process.exit(1);
  }

  // Connect to existing sandbox
  const sandbox = await Sandbox.connect(session.e2b_sandbox_id, {
    apiKey: process.env.E2B_API_KEY,
  });

  console.log(`📦 Connected to sandbox: ${session.e2b_sandbox_id}`);

  // Read local file
  const localPath = resolve(__dirname, '..', filepath);
  if (!existsSync(localPath)) {
    console.error(`❌ File not found: ${localPath}`);
    process.exit(1);
  }

  const content = readFileSync(localPath, 'utf-8');
  
  // Write to sandbox
  const sandboxPath = `/home/user/kulti/${filepath}`;
  await sandbox.files.write(sandboxPath, content);
  
  console.log(`✅ Synced: ${filepath} -> sandbox`);
  console.log(`   ${content.length} bytes written`);

  // Stream the update
  await stream({
    terminal: [{ type: 'success', content: `Synced to sandbox: ${filepath}` }],
    terminalAppend: true,
  });

  // Also stream the code to Kulti viewers
  await stream({
    code: {
      filename: filepath.split('/').pop(),
      language: getLanguage(filepath),
      content: content,
      action: 'edit',
    },
  });
}

function getLanguage(filepath: string): string {
  const ext = filepath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', sql: 'sql', css: 'css', html: 'html', json: 'json',
  };
  return map[ext] || 'text';
}

main().catch(console.error);
