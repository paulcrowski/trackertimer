import { httpRouter } from 'convex/server';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { auth } from './auth';

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({
  path: '/api/desktop/activity',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const helperKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    if (!helperKey) {
      return new Response('Missing helper key.', { status: 401 });
    }

    let payload: {
      appName?: unknown;
      capturedAt?: unknown;
      domain?: unknown;
      platform?: unknown;
      windowTitle?: unknown;
    };

    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return new Response('Invalid JSON body.', { status: 400 });
    }

    if (typeof payload.appName !== 'string' || typeof payload.platform !== 'string') {
      return new Response('Missing required activity fields.', { status: 400 });
    }

    const result = await ctx.runMutation(internal.tracker.ingestDesktopActivity, {
      appName: payload.appName,
      capturedAt: typeof payload.capturedAt === 'number' ? payload.capturedAt : undefined,
      domain: typeof payload.domain === 'string' ? payload.domain : null,
      helperKey,
      platform: payload.platform,
      windowTitle: typeof payload.windowTitle === 'string' ? payload.windowTitle : null,
    });

    if (!result.accepted) {
      return new Response('Invalid helper key.', { status: 401 });
    }

    return new Response(JSON.stringify({ ok: true, trackingActive: result.trackingActive }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }),
});

http.route({
  path: '/api/desktop/activity/batch',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const helperKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';

    if (!helperKey) {
      return new Response('Missing helper key.', { status: 401 });
    }

    let payload: { activities?: unknown; batchId?: unknown };
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return new Response('Invalid JSON body.', { status: 400 });
    }

    if (
      !Array.isArray(payload.activities) ||
      payload.activities.length === 0 ||
      typeof payload.batchId !== 'string' ||
      payload.batchId.length > 128
    ) {
      return new Response('Missing activity batch.', { status: 400 });
    }
    if (payload.activities.length > 128) {
      return new Response('Activity batch is too large.', { status: 413 });
    }

    const activities = payload.activities.map((activity) => {
      if (!activity || typeof activity !== 'object') return null;
      const candidate = activity as Record<string, unknown>;
      if (typeof candidate.appName !== 'string' || typeof candidate.platform !== 'string') {
        return null;
      }
      return {
        appName: candidate.appName,
        capturedAt: typeof candidate.capturedAt === 'number' ? candidate.capturedAt : undefined,
        domain: typeof candidate.domain === 'string' ? candidate.domain : null,
        platform: candidate.platform,
        windowTitle: typeof candidate.windowTitle === 'string' ? candidate.windowTitle : null,
      };
    });

    if (activities.some((activity) => activity === null)) {
      return new Response('Invalid activity batch.', { status: 400 });
    }

    const result = await ctx.runMutation(internal.tracker.ingestDesktopActivityBatchMutation, {
      activities: activities.filter((activity): activity is NonNullable<typeof activity> =>
        Boolean(activity),
      ),
      batchId: payload.batchId,
      helperKey,
    });

    if (!result.accepted) {
      return new Response('Invalid helper key.', { status: 401 });
    }

    return new Response(JSON.stringify({ ok: true, trackingActive: result.trackingActive }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }),
});

http.route({
  path: '/api/desktop/summary',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const helperKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';
    if (!helperKey) {
      return new Response('Missing helper key.', { status: 401 });
    }

    let payload: {
      blocks?: unknown;
      endedAt?: unknown;
      final?: unknown;
      revision?: unknown;
      sessionId?: unknown;
      startedAt?: unknown;
    };
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return new Response('Invalid JSON body.', { status: 400 });
    }
    if (
      typeof payload.sessionId !== 'string' ||
      payload.sessionId.length === 0 ||
      payload.sessionId.length > 128 ||
      typeof payload.startedAt !== 'number' ||
      typeof payload.endedAt !== 'number' ||
      payload.endedAt < payload.startedAt ||
      typeof payload.revision !== 'number' ||
      !Number.isInteger(payload.revision) ||
      payload.revision < 1 ||
      typeof payload.final !== 'boolean' ||
      !Array.isArray(payload.blocks) ||
      payload.blocks.length > 2048
    ) {
      return new Response('Invalid session summary.', { status: 400 });
    }

    const blocks = payload.blocks.map((block) => {
      if (!block || typeof block !== 'object') return null;
      const candidate = block as Record<string, unknown>;
      if (
        typeof candidate.appName !== 'string' ||
        typeof candidate.capturedAt !== 'number' ||
        typeof candidate.endTime !== 'number' ||
        typeof candidate.durationSeconds !== 'number' ||
        typeof candidate.platform !== 'string' ||
        typeof candidate.startTime !== 'number'
      ) {
        return null;
      }
      return {
        appName: candidate.appName,
        capturedAt: candidate.capturedAt,
        domain: typeof candidate.domain === 'string' ? candidate.domain : null,
        durationSeconds: candidate.durationSeconds,
        endTime: candidate.endTime,
        platform: candidate.platform,
        startTime: candidate.startTime,
        windowTitle: typeof candidate.windowTitle === 'string' ? candidate.windowTitle : null,
      };
    });
    if (blocks.some((block) => block === null)) {
      return new Response('Invalid session summary blocks.', { status: 400 });
    }

    const result = await ctx.runMutation(internal.tracker.ingestDesktopSessionSummary, {
      blocks: blocks.filter((block): block is NonNullable<typeof block> => Boolean(block)),
      endedAt: payload.endedAt,
      final: payload.final,
      helperKey,
      revision: payload.revision,
      sessionId: payload.sessionId,
      startedAt: payload.startedAt,
    });
    if (!result.accepted) {
      return new Response('Invalid helper key.', { status: 401 });
    }
    return new Response(JSON.stringify({ ok: true, revision: result.revision }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }),
});
export default http;
