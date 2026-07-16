import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
  desktopHelpers: defineTable({
    // helperKey is optional for backwards-compatible lazy migration. New keys
    // are stored only as helperKeyHash and the plaintext field is removed when
    // a legacy helper sends its next sample.
    helperKey: v.optional(v.string()),
    helperKeyHash: v.optional(v.string()),
    lastAppName: v.union(v.string(), v.null()),
    lastDomain: v.union(v.string(), v.null()),
    lastSeenAt: v.union(v.number(), v.null()),
    lastWindowTitle: v.union(v.string(), v.null()),
    platform: v.string(),
    userId: v.id('users'),
  })
    .index('by_user', ['userId'])
    .index('by_helperKey', ['helperKey'])
    .index('by_helperKeyHash', ['helperKeyHash']),
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
    splitGroupId: v.optional(v.string()),
    startTime: v.string(),
    stopTime: v.string(),
    userId: v.id('users'),
    whatIsDone: v.string(),
  }).index('by_user', ['userId']),
  trackingRules: defineTable({
    category: v.optional(v.union(v.string(), v.null())),
    kind: v.optional(v.union(v.literal('work'), v.literal('private'), v.literal('distraction'))),
    matchAppName: v.union(v.string(), v.null()),
    matchDomain: v.union(v.string(), v.null()),
    projectName: v.string(),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
  trackerPreferences: defineTable({
    autoPauseEnabled: v.optional(v.boolean()),
    autoPauseMinutes: v.optional(v.number()),
    autoSplitMode: v.optional(
      v.union(v.literal('private-distraction'), v.literal('all-contexts'), v.literal('never')),
    ),
    desktopPrivacyLevel: v.optional(
      v.union(v.literal('low'), v.literal('standard'), v.literal('high')),
    ),
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
