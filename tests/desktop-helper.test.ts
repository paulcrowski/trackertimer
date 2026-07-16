import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  maskLocalSample,
  mergeLocalSampleIntoBlocks,
  normalizeIntervalMs,
  postSample,
  postSamples,
  shouldQueueDesktopSample,
} from '../scripts/desktop-helper.mjs';

test('local helper aggregates repeated samples into compact blocks', () => {
  const first = {
    appName: 'Codex',
    capturedAt: 1_700_000_000_000,
    domain: null,
    platform: 'macos',
    windowTitle: 'Worktimer',
  };
  const sameContext = {
    ...first,
    capturedAt: first.capturedAt + 5_000,
  };
  const nextContext = {
    ...first,
    appName: 'Safari',
    capturedAt: first.capturedAt + 30_000,
  };

  const blocks = mergeLocalSampleIntoBlocks(
    mergeLocalSampleIntoBlocks(mergeLocalSampleIntoBlocks([], first), sameContext),
    nextContext,
  );
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0]?.startTime, first.capturedAt);
  assert.equal(blocks[0]?.endTime, sameContext.capturedAt);
  assert.equal(blocks[1]?.appName, 'Safari');
});

test('local helper keeps privacy redaction before persistence and cloud sync', () => {
  const masked = maskLocalSample(
    {
      appName: 'Google Chrome',
      capturedAt: 1_700_000_000_000,
      domain: 'docs.example.com',
      platform: 'macos',
      windowTitle: 'paul@example.com password=secret https://example.com/private',
    },
    { privateDomainsText: '', privacyLevel: 'standard' },
  );

  assert.equal(masked.domain, 'docs.example.com');
  assert.equal(masked.windowTitle, '[email] password: [hidden] [link]');

  const privateDomain = maskLocalSample(
    {
      appName: 'Safari',
      capturedAt: 1_700_000_005_000,
      domain: 'mail.example.com',
      platform: 'macos',
      windowTitle: 'Inbox',
    },
    { privateDomainsText: 'example.com', privacyLevel: 'standard' },
  );

  assert.equal(privateDomain.appName, 'Private domain');
  assert.equal(privateDomain.domain, null);
  assert.equal(privateDomain.windowTitle, null);
});

test('local helper starts a new block after a long sampling gap', () => {
  const first = {
    appName: 'Codex',
    capturedAt: 1_700_000_000_000,
    domain: null,
    platform: 'macos',
    windowTitle: 'Worktimer',
  };

  const blocks = mergeLocalSampleIntoBlocks(mergeLocalSampleIntoBlocks([], first), {
    ...first,
    capturedAt: first.capturedAt + 20_000,
  });

  assert.equal(blocks.length, 2);
});

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

test('desktop helper batches only context changes and minute heartbeats', () => {
  const previousSample = {
    appName: 'Codex',
    domain: null,
    platform: 'macos',
    windowTitle: 'Worktimer',
  };

  assert.equal(
    shouldQueueDesktopSample(previousSample, {
      previousSample,
      previousAt: 1_700_000_000_000,
      now: 1_700_000_030_000,
    }),
    false,
  );
  assert.equal(
    shouldQueueDesktopSample(
      { ...previousSample, appName: 'Safari' },
      {
        previousSample,
        previousAt: 1_700_000_000_000,
        now: 1_700_000_030_000,
      },
    ),
    true,
  );
  assert.equal(
    shouldQueueDesktopSample(previousSample, {
      previousSample,
      previousAt: 1_700_000_000_000,
      now: 1_700_000_060_000,
    }),
    true,
  );
});

test('desktop helper posts an activity batch and reads tracking state', async () => {
  let requestBody = '';
  const server = createServer((request, response) => {
    request.on('data', (chunk) => {
      requestBody += chunk;
    });
    request.on('end', () => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end('{"ok":true,"trackingActive":false}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const result = await postSamples(
      [{ appName: 'Codex', domain: null, platform: 'macos', windowTitle: null }],
      {
        batchId: '00000000-0000-4000-8000-000000000001',
        helperKey: 'local-test-key',
        ingestUrl: `http://127.0.0.1:${address.port}/api/desktop/activity`,
      },
    );
    assert.deepEqual(result, { trackingActive: false });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  assert.deepEqual(JSON.parse(requestBody), {
    activities: [{ appName: 'Codex', domain: null, platform: 'macos', windowTitle: null }],
    batchId: '00000000-0000-4000-8000-000000000001',
  });
});
