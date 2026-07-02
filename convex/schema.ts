import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
  desktopHelpers: defineTable({
    helperKey: v.string(),
    lastAppName: v.union(v.string(), v.null()),
    lastDomain: v.union(v.string(), v.null()),
    lastSeenAt: v.union(v.number(), v.null()),
    lastWindowTitle: v.union(v.string(), v.null()),
    platform: v.string(),
    userId: v.id('users'),
  })
    .index('by_user', ['userId'])
    .index('by_helperKey', ['helperKey']),
  activeSessions: defineTable({
    description: v.string(),
    pausedAt: v.union(v.number(), v.null()),
    pausedSeconds: v.number(),
    projectName: v.union(v.string(), v.null()),
    startTime: v.number(),
    userId: v.id('users'),
    category: v.string(),
  }).index('by_user', ['userId']),
  sessions: defineTable({
    category: v.string(),
    date: v.string(),
    description: v.string(),
    duration: v.number(),
    projectName: v.union(v.string(), v.null()),
    startTime: v.string(),
    stopTime: v.string(),
    userId: v.id('users'),
    whatIsDone: v.string(),
  }).index('by_user', ['userId']),
  trackingRules: defineTable({
    matchAppName: v.union(v.string(), v.null()),
    matchDomain: v.union(v.string(), v.null()),
    projectName: v.string(),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
  trackerPreferences: defineTable({
    autoPauseEnabled: v.boolean(),
    autoPauseMinutes: v.number(),
    dailyGoalHours: v.number(),
    focusMode: v.boolean(),
    stopSoundEnabled: v.boolean(),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
});
