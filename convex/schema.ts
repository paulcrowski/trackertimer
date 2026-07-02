import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
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
  trackerPreferences: defineTable({
    autoPauseEnabled: v.boolean(),
    autoPauseMinutes: v.number(),
    dailyGoalHours: v.number(),
    focusMode: v.boolean(),
    stopSoundEnabled: v.boolean(),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
});
