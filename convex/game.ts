import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isCorrectAnswer } from "./answers";

const MAX_LEVEL = 8;
const MAX_PENDING_SUBMISSIONS = 50;
const DEMO_ADMIN_KEY = "overmind";

function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === "1";
}

function getAdminSecret() {
  return process.env.ADMIN_KEY?.trim() || DEMO_ADMIN_KEY;
}

function isValidAdminKey(adminKey: string) {
  return adminKey.trim() === getAdminSecret();
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type LeaderboardRow = {
  id: string;
  name: string;
  college: string;
  level: number;
  hints: number;
  startTime: number;
  finishTime?: number;
  level5Status?: "none" | "pending" | "approved" | "rejected";
};

type AdminLeaderboardRow = LeaderboardRow & {
  email: string;
  completedLevels: number[];
  hintsUsed: number[];
  currentLevel: number;
  level5Status?: "none" | "pending" | "approved" | "rejected";
};

function compareLeaderboardRows(a: LeaderboardRow, b: LeaderboardRow) {
  const levelDelta = b.level - a.level;
  if (levelDelta) return levelDelta;

  const aFinish = a.finishTime ?? Number.MAX_SAFE_INTEGER;
  const bFinish = b.finishTime ?? Number.MAX_SAFE_INTEGER;
  if (aFinish !== bFinish) return aFinish - bFinish;

  const hintDelta = a.hints - b.hints;
  if (hintDelta) return hintDelta;

  return a.startTime - b.startTime;
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
  level5Status?: "none" | "pending" | "approved" | "rejected";
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
    level5Status: participant.level5Status,
  };
}

export const eventState = query({
  args: {},
  handler: async (ctx) => {
    if (isMaintenanceMode()) return { started: false };
    const event = await getEvent(ctx);
    return {
      started: event?.started ?? true,
      winnerParticipantId: event?.winnerParticipantId,
    };
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    if (isMaintenanceMode()) return [];
    const participants: LeaderboardRow[] = (
      await ctx.db.query("participants").collect()
    ).map((participant) => ({
      id: participant._id,
      name: participant.name,
      college: participant.college,
      level: participant.completedLevels.length,
      hints: participant.hintsUsed.length,
      startTime: participant.startTime,
      finishTime: participant.finishTime,
      level5Status: participant.level5Status ?? "none",
    }));

    return participants.sort(compareLeaderboardRows).slice(0, 100);
  },
});

export const adminLeaderboard = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) return [];
    if (isMaintenanceMode()) return [];

    const participants: AdminLeaderboardRow[] = (
      await ctx.db.query("participants").collect()
    ).map((participant) => ({
      id: participant._id,
      name: participant.name,
      college: participant.college,
      email: participant.email,
      level: participant.completedLevels.length,
      hints: participant.hintsUsed.length,
      startTime: participant.startTime,
      finishTime: participant.finishTime,
      completedLevels: participant.completedLevels,
      hintsUsed: participant.hintsUsed,
      currentLevel: participant.currentLevel,
      level5Status: participant.level5Status,
    }));

    return participants.sort(compareLeaderboardRows).slice(0, 100);
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
    if (args.level === 5) {
      return { ok: false, message: "Level 5 requires admin review." };
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
      nextLevel,
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
    if (!isValidAdminKey(args.adminKey)) {
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

export const setWinnerParticipant = mutation({
  args: { adminKey: v.string(), participantId: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("Admin key rejected.");
    }

    const event = await getEvent(ctx);
    if (!event) throw new Error("Event record not found.");

    await ctx.db.patch(event._id, {
      winnerParticipantId: args.participantId as any,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const getCardImage = mutation({
  args: { participantId: v.id("participants"), cardIndex: v.number() },
  handler: async (ctx, args) => {
    if (isMaintenanceMode()) throw new Error("Event backend stopped.");
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found.");

    const makeDataUrl = (label: string, accent: string) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
          <rect width="256" height="256" fill="#050805"/>
          <rect x="16" y="16" width="224" height="224" rx="10" fill="#07110a" stroke="${accent}" stroke-width="4"/>
          <rect x="36" y="36" width="44" height="44" fill="none" stroke="${accent}" stroke-width="8"/>
          <rect x="176" y="36" width="44" height="44" fill="none" stroke="${accent}" stroke-width="8"/>
          <rect x="36" y="176" width="44" height="44" fill="none" stroke="${accent}" stroke-width="8"/>
          <path d="M96 40h16v16H96zm24 0h16v16h-16zm24 0h16v16h-16zm24 0h16v16h-16zm-72 24h16v16H96zm48 0h16v16h-16zm24 0h16v16h-16zm-96 24h16v16H72zm24 0h16v16H96zm24 0h16v16h-16zm48 0h16v16h-16zm24 0h16v16h-16z" fill="${accent}"/>
          <path d="M96 104h16v16H96zm24 0h16v16h-16zm24 0h16v16h-16zm48 0h16v16h-16zm-120 24h16v16H72zm48 0h16v16h-16zm24 0h16v16h-16zm48 0h16v16h-16zm-96 24h16v16H96zm24 0h16v16h-16zm48 0h16v16h-16z" fill="${accent}" opacity="0.85"/>
          <text x="128" y="204" text-anchor="middle" font-family="monospace" font-size="18" fill="${accent}">${label}</text>
        </svg>
      `.trim();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    if (args.cardIndex === 4) {
      return {
        url: makeDataUrl("ENTRYPOINT", "#00ff66"),
        isReal: true,
      };
    } else {
      const noise = `GLITCH_${args.cardIndex}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return {
        url: makeDataUrl(noise, "#3bff9d"),
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
    if (participant.currentLevel !== 5) {
      throw new Error("Level 5 is not active.");
    }
    if (participant.level5Status === "pending") {
      throw new Error("Level 5 already pending admin review.");
    }
    if (!isPublicHttpUrl(args.prompt)) {
      throw new Error("Public chat link must be a valid http(s) URL.");
    }

    const submissionId = await ctx.db.insert("level5Submissions", {
      participantId: args.participantId,
      prompt: args.prompt,
      screenshotId: args.screenshotId as any,
      submittedAt: Date.now(),
      status: "approved",
      reviewedAt: Date.now(),
    });

    await ctx.db.patch(args.participantId, {
      level5Status: "approved",
      currentLevel: 6,
      completedLevels: participant.completedLevels.includes(5)
        ? participant.completedLevels
        : [...participant.completedLevels, 5],
    });

    return { ok: true, submissionId, nextLevel: 6 };
  },
});

export const getPendingSubmissions = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      return [];
    }
    try {
      const submissions = await ctx.db
        .query("level5Submissions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(MAX_PENDING_SUBMISSIONS);

      const result = [];
      for (const sub of submissions) {
        try {
          const part = await ctx.db.get(sub.participantId);
          const screenshotUrl = sub.screenshotId
            ? await ctx.storage.getUrl(sub.screenshotId)
            : null;

          result.push({
            id: sub._id,
            participantId: sub.participantId,
            participantName: part?.name ?? "Unknown",
            participantCollege: part?.college ?? "Unknown",
            participantEmail: part?.email ?? "Unknown",
            participantCurrentLevel: part?.currentLevel ?? 0,
            participantLevel5Status: part?.level5Status ?? "none",
            participantCompletedLevels: part?.completedLevels ?? [],
            participantHintsUsed: part?.hintsUsed ?? [],
            participantStartTime: part?.startTime ?? 0,
            participantFinishTime: part?.finishTime ?? null,
            prompt: sub.prompt,
            screenshotUrl,
            submittedAt: sub.submittedAt,
          });
        } catch {
          // Skip a corrupted row rather than taking down the admin screen.
        }
      }

      return result.sort((a, b) => b.submittedAt - a.submittedAt);
    } catch {
      return [];
    }
  },
});

export const getFinalistProofs = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      return [];
    }

    try {
      const submissions = await ctx.db.query("level5Submissions").collect();
      const result = [];

      for (const sub of submissions) {
        try {
          const part = await ctx.db.get(sub.participantId);
          const screenshotUrl = sub.screenshotId
            ? await ctx.storage.getUrl(sub.screenshotId)
            : null;

          result.push({
            id: sub._id,
            participantId: sub.participantId,
            participantName: part?.name ?? "Unknown",
            participantCollege: part?.college ?? "Unknown",
            participantEmail: part?.email ?? "Unknown",
            participantCurrentLevel: part?.currentLevel ?? 0,
            participantLevel5Status: part?.level5Status ?? "none",
            participantCompletedLevels: part?.completedLevels ?? [],
            participantHintsUsed: part?.hintsUsed ?? [],
            participantStartTime: part?.startTime ?? 0,
            participantFinishTime: part?.finishTime ?? null,
            prompt: sub.prompt,
            screenshotUrl,
            submittedAt: sub.submittedAt,
            status: sub.status,
            reviewedAt: sub.reviewedAt ?? null,
          });
        } catch {
          // Skip a corrupted row rather than taking down the admin screen.
        }
      }

      return result.sort((a, b) => b.submittedAt - a.submittedAt);
    } catch {
      return [];
    }
  },
});

export const reviewLevel5 = mutation({
  args: {
    adminKey: v.string(),
    submissionId: v.id("level5Submissions"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    if (!isValidAdminKey(args.adminKey)) {
      throw new Error("Admin key rejected.");
    }
    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new Error("Submission not found.");

    if (args.status === "approved") {
      await ctx.db.patch(args.submissionId, {
        status: "approved",
        reviewedAt: Date.now(),
      });
      return { ok: true };
    }

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
      } else {
        patchData.currentLevel = 5;
        patchData.completedLevels = participant.completedLevels.filter(
          (level) => level !== 5,
        );
      }
      await ctx.db.patch(sub.participantId, patchData);
    }
    return { ok: true };
  },
});
