import { makeFunctionReference } from "convex/server";

export type PublicParticipant = {
  id: string;
  name: string;
  college: string;
  email: string;
  currentLevel: number;
  completedLevels: number[];
  hintsUsed: number[];
  startTime: number;
  finishTime?: number;
  level5Status?: "none" | "pending" | "approved" | "rejected";
};

export type LeaderboardRank = {
  id: string;
  name: string;
  college: string;
  level: number;
  hints: number;
  startTime: number;
  finishTime?: number;
  level5Status?: "none" | "pending" | "approved" | "rejected";
};

export type AdminLeaderboardRow = LeaderboardRank & {
  email: string;
  completedLevels: number[];
  hintsUsed: number[];
  currentLevel: number;
  level5Status?: "none" | "pending" | "approved" | "rejected";
};

export const gameApi = {
  eventState: makeFunctionReference<
    "query",
    Record<string, never>,
    {
      started: boolean;
      winnerParticipantId?: string;
      winnerSelectedAt?: number;
      serverNow: number;
    }
  >("game:eventState"),
  checkAdminKey: makeFunctionReference<
    "query",
    { adminKey: string },
    boolean
  >("game:checkAdminKey"),
  leaderboard: makeFunctionReference<
    "query",
    Record<string, never>,
    LeaderboardRank[]
  >("game:leaderboard"),
  adminLeaderboard: makeFunctionReference<
    "query",
    { adminKey: string },
    AdminLeaderboardRow[]
  >("game:adminLeaderboard"),
  participant: makeFunctionReference<
    "query",
    { participantId: string },
    PublicParticipant | null
  >("game:participant"),
  register: makeFunctionReference<
    "mutation",
    { name: string; college: string; email: string; botToken?: string },
    PublicParticipant
  >("game:register"),
  useHint: makeFunctionReference<
    "mutation",
    { participantId: string; level: number },
    { ok: boolean; message?: string }
  >("game:useHint"),
  submitAnswer: makeFunctionReference<
    "mutation",
    { participantId: string; level: number; answer: string; botToken?: string },
    { ok: boolean; message: string; nextLevel?: number }
  >("game:submitAnswer"),
  setEventStarted: makeFunctionReference<
    "mutation",
    { adminKey: string; started: boolean },
    { ok: boolean }
  >("game:setEventStarted"),
  getCardImage: makeFunctionReference<
    "mutation",
    { participantId: string; cardIndex: number },
    { url: string; isReal: boolean }
  >("game:getCardImage"),
  generateUploadUrl: makeFunctionReference<
    "mutation",
    Record<string, never>,
    string
  >("game:generateUploadUrl"),
  submitLevel5: makeFunctionReference<
    "mutation",
    { participantId: string; prompt: string; screenshotId?: string; botToken?: string },
    { ok: boolean; submissionId: string; nextLevel: number }
  >("game:submitLevel5"),
  getPendingSubmissions: makeFunctionReference<
    "query",
    { adminKey: string },
    Array<{
      id: string;
      participantId: string;
      participantName: string;
      participantCollege: string;
      participantEmail: string;
      participantCurrentLevel: number;
      participantLevel5Status: string;
      participantCompletedLevels: number[];
      participantHintsUsed: number[];
      participantStartTime: number;
      participantFinishTime: number | null;
      prompt: string;
      screenshotUrl: string | null;
      submittedAt: number;
    }>
  >("game:getPendingSubmissions"),
  getFinalistProofs: makeFunctionReference<
    "query",
    { adminKey: string },
    Array<{
      id: string;
      participantId: string;
      participantName: string;
      participantCollege: string;
      participantEmail: string;
      participantCurrentLevel: number;
      participantLevel5Status: string;
      participantCompletedLevels: number[];
      participantHintsUsed: number[];
      participantStartTime: number;
      participantFinishTime: number | null;
      prompt: string;
      screenshotUrl: string | null;
      submittedAt: number;
      status: "pending" | "approved" | "rejected";
      reviewedAt: number | null;
    }>
  >("game:getFinalistProofs"),
  reviewLevel5: makeFunctionReference<
    "mutation",
    { adminKey: string; submissionId: string; status: "approved" | "rejected" },
    { ok: boolean }
  >("game:reviewLevel5"),
  setWinnerParticipant: makeFunctionReference<
    "mutation",
    { adminKey: string; participantId: string },
    { ok: boolean }
  >("game:setWinnerParticipant"),
  triggerHoneypot: makeFunctionReference<
    "mutation",
    { participantId: string },
    { ok: boolean }
  >("game:triggerHoneypot"),
};
