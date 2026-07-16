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
export default http;
