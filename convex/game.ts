import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isCorrectAnswer } from "./answers";

const MAX_LEVEL = 8;

function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === "1";
}

async function getEvent(ctx: any) {
  return (await ctx.db.query("event").first()) ?? null;
}

function publicParticipant(participant: {
  _id: string;
  name: string;
  college: string;
  email: string;
  currentLevel: number;
  completedLevels: number[];
  hintsUsed: number[];
  startTime: number;
  finishTime?: number;
}) {
  return {
    id: participant._id,
    name: participant.name,
    college: participant.college,
    email: participant.email,
    currentLevel: participant.currentLevel,
    completedLevels: participant.completedLevels,
    hintsUsed: participant.hintsUsed,
    startTime: participant.startTime,
    finishTime: participant.finishTime,
  };
}

export const eventState = query({
  args: {},
  handler: async (ctx) => {
    if (isMaintenanceMode()) return { started: false };
    const event = await getEvent(ctx);
    return { started: event?.started ?? true };
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    if (isMaintenanceMode()) return [];
    const participants = await ctx.db.query("participants").collect();
    return participants
      .map((participant) => ({
        id: participant._id,
        name: participant.name,
        college: participant.college,
        level: participant.completedLevels.length,
        hints: participant.hintsUsed.length,
        startTime: participant.startTime,
        finishTime: participant.finishTime,
      }))
      .sort((a, b) => {
        const levelDelta = b.level - a.level;
        if (levelDelta) return levelDelta;
        return (
          (a.finishTime ?? Number.MAX_SAFE_INTEGER) -
          (b.finishTime ?? Number.MAX_SAFE_INTEGER)
        );
      })
      .slice(0, 100);
  },
});

export const participant = query({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) return null;
    const participant = await ctx.db.get(args.participantId);
    return participant ? publicParticipant(participant) : null;
  },
});

export const register = mutation({
  args: { name: v.string(), college: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) throw new Error("Event backend stopped.");
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) return publicParticipant(existing);

    const participantId = await ctx.db.insert("participants", {
      name: args.name.trim(),
      college: args.college.trim(),
      email,
      currentLevel: 1,
      completedLevels: [],
      hintsUsed: [],
      attemptCounts: {},
      levelTimestamps: {},
      startTime: Date.now(),
      level5Status: "none",
    });
    const participant = await ctx.db.get(participantId);
    if (!participant) throw new Error("Registration failed.");
    return publicParticipant(participant);
  },
});

export const useHint = mutation({
  args: { participantId: v.id("participants"), level: v.number() },
  handler: async (ctx, args) => {
    if (isMaintenanceMode())
      return { ok: false, message: "Event backend stopped." };
    const participant = await ctx.db.get(args.participantId);
    if (!participant) return { ok: false, message: "Participant not found." };
    if (!participant.hintsUsed.includes(args.level)) {
      await ctx.db.patch(args.participantId, {
        hintsUsed: [...participant.hintsUsed, args.level],
      });
    }
    return { ok: true };
  },
});

export const submitAnswer = mutation({
  args: {
    participantId: v.id("participants"),
    level: v.number(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) {
      return { ok: false, message: "Event backend stopped." };
    }

    const event = await getEvent(ctx);
    if (event && !event.started) {
      return { ok: false, message: "Event paused by admin." };
    }

    const participant = await ctx.db.get(args.participantId);
    if (!participant) return { ok: false, message: "Participant not found." };
    if (participant.currentLevel !== args.level) {
      return { ok: false, message: "Wrong level." };
    }

    const attemptCounts = {
      ...participant.attemptCounts,
      [String(args.level)]:
        (participant.attemptCounts[String(args.level)] ?? 0) + 1,
    };

    if (!isCorrectAnswer(args.level, args.answer)) {
      await ctx.db.patch(args.participantId, { attemptCounts });
      return { ok: false, message: "Rejected. Check format, then retry." };
    }

    const completedLevels = Array.from(
      new Set([...participant.completedLevels, args.level]),
    );
    const nextLevel = Math.min(args.level + 1, MAX_LEVEL);

    await ctx.db.patch(args.participantId, {
      attemptCounts,
      completedLevels,
      currentLevel: nextLevel,
      finishTime:
        args.level === MAX_LEVEL ? Date.now() : participant.finishTime,
      levelTimestamps: {
        ...participant.levelTimestamps,
        [String(args.level)]: Date.now(),
      },
    });

    return {
      ok: true,
      message:
        args.level === MAX_LEVEL
          ? "Final signal accepted. Winner lock pending."
          : "Accepted. Next trial unlocked.",
    };
  },
});

export const setEventStarted = mutation({
  args: { adminKey: v.string(), started: v.boolean() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_KEY || args.adminKey !== process.env.ADMIN_KEY) {
      throw new Error("Admin key rejected.");
    }

    const existing = await getEvent(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, {
        started: args.started,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("event", {
        started: args.started,
        updatedAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

export const getCardImage = mutation({
  args: { participantId: v.id("participants"), cardIndex: v.number() },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) throw new Error("Event backend stopped.");
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found.");

    await ctx.db.insert("qrRequests", {
      participantId: args.participantId,
      cardIndex: args.cardIndex,
      requestedAt: Date.now(),
    });

    if (args.cardIndex === 4) {
      return {
        url: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ENTRYPOINT",
        isReal: true,
      };
    } else {
      const noise = Math.random().toString(36).substring(2, 10).toUpperCase();
      return {
        url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GLITCH_NOISE_${args.cardIndex}_${noise}`,
        isReal: false,
      };
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitLevel5 = mutation({
  args: {
    participantId: v.id("participants"),
    prompt: v.string(),
    screenshotId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) throw new Error("Event backend stopped.");
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found.");

    const submissionId = await ctx.db.insert("level5Submissions", {
      participantId: args.participantId,
      prompt: args.prompt,
      screenshotId: args.screenshotId as any,
      submittedAt: Date.now(),
      status: "pending",
    });

    await ctx.db.patch(args.participantId, {
      level5Status: "pending",
    });

    return { ok: true, submissionId };
  },
});

export const getPendingSubmissions = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_KEY || args.adminKey !== process.env.ADMIN_KEY) {
      throw new Error("Admin key rejected.");
    }
    const submissions = await ctx.db
      .query("level5Submissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const result = [];
    for (const sub of submissions) {
      const part = await ctx.db.get(sub.participantId);
      let screenshotUrl = null;
      if (sub.screenshotId) {
        screenshotUrl = await ctx.storage.getUrl(sub.screenshotId);
      }
      result.push({
        id: sub._id,
        participantName: part?.name ?? "Unknown",
        participantCollege: part?.college ?? "Unknown",
        prompt: sub.prompt,
        screenshotUrl,
        submittedAt: sub.submittedAt,
      });
    }
    return result;
  },
});

export const reviewLevel5 = mutation({
  args: {
    adminKey: v.string(),
    submissionId: v.id("level5Submissions"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_KEY || args.adminKey !== process.env.ADMIN_KEY) {
      throw new Error("Admin key rejected.");
    }
    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new Error("Submission not found.");

    await ctx.db.patch(args.submissionId, {
      status: args.status,
      reviewedAt: Date.now(),
    });

    const participant = await ctx.db.get(sub.participantId);
    if (participant) {
      const patchData: any = {
        level5Status: args.status,
      };
      if (args.status === "approved") {
        patchData.currentLevel = 6;
        if (!participant.completedLevels.includes(5)) {
          patchData.completedLevels = [...participant.completedLevels, 5];
        }
      }
      await ctx.db.patch(sub.participantId, patchData);
    }
    return { ok: true };
  },
});
