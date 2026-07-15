import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { normalizeIntervalMs, postSample } from '../scripts/desktop-helper.mjs';

test('desktop helper posts the expected authenticated activity payload', async () => {
  const requests: Array<{ authorization: string | undefined; body: string }> = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      requests.push({
        authorization: request.headers.authorization,
        body,
      });
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end('{"ok":true}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    await postSample(
      {
        appName: 'Codex',
        capturedAt: 1_700_000_000_000,
        domain: null,
        platform: 'macos',
        windowTitle: null,
      },
      {
        helperKey: 'local-test-key',
        ingestUrl: `http://127.0.0.1:${address.port}/api/desktop/activity`,
      },
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.authorization, 'Bearer local-test-key');
  assert.deepEqual(JSON.parse(requests[0]?.body ?? '{}'), {
    appName: 'Codex',
    capturedAt: 1_700_000_000_000,
    domain: null,
    platform: 'macos',
    windowTitle: null,
  });
});

test('desktop helper surfaces non-success ingest responses', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(401);
    response.end('Invalid helper key.');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  await assert.rejects(
    postSample(
      { appName: 'Codex', domain: null, platform: 'macos', windowTitle: null },
      {
        helperKey: 'bad-key',
        ingestUrl: `http://127.0.0.1:${address.port}/api/desktop/activity`,
      },
    ),
    /HTTP 401: Invalid helper key\./,
  );

  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test('desktop helper accepts only bounded polling intervals', () => {
  assert.equal(normalizeIntervalMs(1000), 1000);
  assert.equal(normalizeIntervalMs('2500'), 2500);
  assert.equal(normalizeIntervalMs(0), null);
  assert.equal(normalizeIntervalMs(10 * 60 * 1000 + 1), null);
  assert.equal(normalizeIntervalMs(Number.NaN), null);
});
