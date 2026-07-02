import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,
  activeSessions: defineTable({
    userId: v.id('users'),
    startTime: v.number(),
    category: v.string(),
    description: v.string(),
  }).index('by_user', ['userId']),
  sessions: defineTable({
    userId: v.id('users'),
    date: v.string(),
    startTime: v.string(),
    stopTime: v.string(),
    duration: v.number(),
    category: v.string(),
    description: v.string(),
    whatIsDone: v.string(),
  }).index('by_user', ['userId']),
  trackerPreferences: defineTable({
    userId: v.id('users'),
    dailyGoalHours: v.number(),
    focusMode: v.boolean(),
    stopSoundEnabled: v.boolean(),
  }).index('by_user', ['userId']),
});
