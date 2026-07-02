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

    await ctx.runMutation(internal.tracker.ingestDesktopActivity, {
      appName: payload.appName,
      capturedAt: typeof payload.capturedAt === 'number' ? payload.capturedAt : undefined,
      domain: typeof payload.domain === 'string' ? payload.domain : null,
      helperKey,
      platform: payload.platform,
      windowTitle: typeof payload.windowTitle === 'string' ? payload.windowTitle : null,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }),
});
export default http;
