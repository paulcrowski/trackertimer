import { getAuthUserId } from '@convex-dev/auth/server';
import { mutationGeneric, queryGeneric } from 'convex/server';
import { ConvexError, v } from 'convex/values';

const requireUser = async (ctx: Parameters<NonNullable<typeof getAuthUserId>>[0]) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError('Musisz być zalogowany.');
  return userId;
};
const activeFor = (ctx: any, userId: any) => ctx.db.query('activeSessions').withIndex('by_user', (q: any) => q.eq('userId', userId)).unique();
const date = (time: number) => new Date(time).toISOString().slice(0, 10);
const hm = (time: number) => new Date(time).toTimeString().slice(0, 5);

export const bootstrap = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [user, activeSession, sessions] = await Promise.all([ctx.db.get(userId), activeFor(ctx, userId), ctx.db.query('sessions').withIndex('by_user', (q) => q.eq('userId', userId)).order('desc').take(50)]);
    return { user: user ? { name: user.name, email: user.email, image: user.image } : null, activeSession, sessions };
  },
});

export const start = mutationGeneric({
  args: { category: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (await activeFor(ctx, userId)) throw new ConvexError('Masz już aktywną sesję.');
    await ctx.db.insert('activeSessions', { userId, startTime: Date.now(), category: args.category, description: args.description?.trim() || 'Praca nad projektem' });
    return null;
  },
});

export const stop = mutationGeneric({
  args: { whatIsDone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const active = await activeFor(ctx, userId);
    if (!active) throw new ConvexError('Brak aktywnej sesji do zatrzymania.');
    const end = Date.now();
    await ctx.db.insert('sessions', { userId, date: date(active.startTime), startTime: hm(active.startTime), stopTime: hm(end), duration: Math.max(0, Math.floor((end - active.startTime) / 1000)), category: active.category, description: active.description, whatIsDone: args.whatIsDone?.trim() || active.description || 'Zakończona sesja' });
    await ctx.db.delete(active._id);
    return null;
  },
});
