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
};

export type LeaderboardRank = {
  name: string;
  college: string;
  level: number;
  hints: number;
  startTime: number;
  finishTime?: number;
};

export const gameApi = {
  eventState: makeFunctionReference<
    "query",
    Record<string, never>,
    { started: boolean }
  >("game:eventState"),
  leaderboard: makeFunctionReference<
    "query",
    Record<string, never>,
    LeaderboardRank[]
  >("game:leaderboard"),
  participant: makeFunctionReference<
    "query",
    { participantId: string },
    PublicParticipant | null
  >("game:participant"),
  register: makeFunctionReference<
    "mutation",
    { name: string; college: string; email: string },
    PublicParticipant
  >("game:register"),
  useHint: makeFunctionReference<
    "mutation",
    { participantId: string; level: number },
    { ok: boolean; message?: string }
  >("game:useHint"),
  submitAnswer: makeFunctionReference<
    "mutation",
    { participantId: string; level: number; answer: string },
    { ok: boolean; message: string }
  >("game:submitAnswer"),
  setEventStarted: makeFunctionReference<
    "mutation",
    { adminKey: string; started: boolean },
    { ok: boolean }
  >("game:setEventStarted"),
};
