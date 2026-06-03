import assert from "node:assert/strict";
import { loadAnswers, loadGame } from "./load-game.mjs";

const { levels } = await loadGame();
const { answerSets, isCorrectAnswer } = await loadAnswers();

function submit(state, value) {
  const level = levels[state.levelId - 1];
  assert(level, `missing level ${state.levelId}`);

  if (!state.eventStarted) {
    return { ...state, message: "Event paused by admin." };
  }

  if (!isCorrectAnswer(level.id, value)) {
    return { ...state, message: "Rejected. Check format, then retry." };
  }

  return {
    ...state,
    answer: "",
    levelId: Math.min(state.levelId + 1, levels.length),
    message:
      state.levelId === levels.length
        ? "Final signal accepted. Winner lock pending."
        : "Accepted. Next trial unlocked.",
  };
}

function applyHint(state, levelId) {
  return state.hints.includes(levelId)
    ? state
    : { ...state, hints: [...state.hints, levelId] };
}

function ranksFor(player, completed, hints) {
  return [
    { name: player.name, college: player.college, level: completed, hints },
    { name: "Asha Nair", college: "CEC", level: 6, hints: 1 },
    { name: "Ritvik Menon", college: "MEC", level: 5, hints: 0 },
  ].sort((a, b) => b.level - a.level);
}

let state = {
  answer: "",
  eventStarted: false,
  hints: [],
  levelId: 1,
  message: "Awaiting signal.",
};

state = submit(state, answerSets[1].answers[0]);
assert.equal(state.levelId, 1, "paused event must not advance level");
assert.equal(state.message, "Event paused by admin.");

state = { ...state, eventStarted: true };
state = submit(state, "Central Processing Unit");
assert.equal(state.levelId, 1, "level 1 must reject phrase format");

state = submit(state, answerSets[1].answers[0]);
assert.equal(state.levelId, 2, "level 1 binary should advance");

state = { ...state, levelId: 5 };
state = submit(state, "instruction hierarchy");
assert.equal(state.levelId, 6, "level 5 should auto-score without admin");

state = { ...state, levelId: 8 };
state = submit(state, "SIGNAL_FOUND");
assert.equal(state.levelId, 8, "final level must not advance past max");
state = submit(state, "SIGNAL_FOUND");
assert.equal(state.levelId, 8, "double final submit stays bounded");

state = applyHint(state, 8);
state = applyHint(state, 8);
assert.deepEqual(state.hints, [8], "hint click should be idempotent");

const ranks = ranksFor(
  { name: "Tester", college: "DX" },
  levels.length,
  state.hints.length,
);
assert.equal(ranks[0].name, "Tester", "leaderboard should sort by level desc");

console.log("state/race checks ok");
