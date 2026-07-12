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
  desktopHelperActivities: defineTable({
    appName: v.string(),
    capturedAt: v.number(),
    domain: v.union(v.string(), v.null()),
    helperId: v.optional(v.id('desktopHelpers')),
    platform: v.string(),
    userId: v.id('users'),
    windowTitle: v.union(v.string(), v.null()),
  }).index('by_user_and_capturedAt', ['userId', 'capturedAt']),
  activeSessions: defineTable({
    description: v.string(),
    pausedAt: v.optional(v.union(v.number(), v.null())),
    pauseRanges: v.optional(
      v.array(
        v.object({
          endTime: v.union(v.number(), v.null()),
          startTime: v.number(),
        }),
      ),
    ),
    pausedSeconds: v.optional(v.number()),
    projectName: v.optional(v.union(v.string(), v.null())),
    startTime: v.number(),
    userId: v.id('users'),
    category: v.string(),
  }).index('by_user', ['userId']),
  sessions: defineTable({
    category: v.string(),
    date: v.string(),
    description: v.string(),
    duration: v.number(),
    projectName: v.optional(v.union(v.string(), v.null())),
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
    autoPauseEnabled: v.optional(v.boolean()),
    autoPauseMinutes: v.optional(v.number()),
    dailyGoalHours: v.optional(v.number()),
    desktopTrackingEnabled: v.optional(v.boolean()),
    desktopTrackingManualPause: v.optional(v.boolean()),
    desktopTrackingPausedUntil: v.optional(v.union(v.number(), v.null())),
    focusMode: v.optional(v.boolean()),
    privateDomainsText: v.optional(v.string()),
    stopSoundEnabled: v.optional(v.boolean()),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
});
