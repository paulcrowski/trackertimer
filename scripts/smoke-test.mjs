#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';

const port = Number(process.env.SMOKE_PORT ?? 4179);
const child = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

try {
  await waitForServer(`http://127.0.0.1:${port}/`);
  const root = await fetch(`http://127.0.0.1:${port}/`);
  const html = await root.text();
  if (!root.ok || !html.includes('worktimer')) {
    throw new Error(`Root smoke check failed with HTTP ${root.status}.`);
  }

  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  if (!asset) {
    throw new Error('Root page does not reference a JavaScript entrypoint.');
  }
  const assetResponse = await fetch(new URL(asset, `http://127.0.0.1:${port}/`));
  if (!assetResponse.ok) {
    throw new Error(`JavaScript asset smoke check failed with HTTP ${assetResponse.status}.`);
  }

  console.log(`Local smoke passed: / and ${asset} responded successfully.`);
} finally {
  child.kill('SIGTERM');
}

async function waitForServer(url) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Timed out waiting for ${url}.`);
}
