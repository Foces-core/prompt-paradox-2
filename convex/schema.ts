import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  event: defineTable({
    started: v.boolean(),
    winnerParticipantId: v.optional(v.id("participants")),
    updatedAt: v.number(),
  }),
  participants: defineTable({
    name: v.string(),
    college: v.string(),
    email: v.string(),
    currentLevel: v.number(),
    completedLevels: v.array(v.number()),
    hintsUsed: v.array(v.number()),
    attemptCounts: v.record(v.string(), v.number()),
    levelTimestamps: v.record(v.string(), v.number()),
    startTime: v.number(),
    finishTime: v.optional(v.number()),
    level5Status: v.union(
      v.literal("none"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    isAdmin: v.optional(v.boolean()),
  }).index("by_email", ["email"]),
  level5Submissions: defineTable({
    participantId: v.id("participants"),
    prompt: v.string(),
    screenshotId: v.optional(v.id("_storage")),
    submittedAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
  qrRequests: defineTable({
    participantId: v.id("participants"),
    cardIndex: v.number(),
    requestedAt: v.number(),
  }).index("by_participant_card", ["participantId", "cardIndex"]),
});
