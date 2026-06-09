export type Strictness = "warmup" | "standard" | "strict";

type AnswerSet = {
  answers: string[];
  strictness: Strictness;
};

export const answerSets: Record<number, AnswerSet> = {
  1: {
    answers: [
      "0100001101100101011011100111010001110010011000010110110000100000010100000111001001101111011000110110010101110011011100110110100101101110011001110010000001010101011011100110100101110100",
    ],
    strictness: "warmup",
  },
  2: {
    answers: ["VOIDWALKER", "void walker", "void-walker", "void_walker"],
    strictness: "warmup",
  },
  3: {
    answers: ["ENTRYPOINT", "entry point", "entry-point", "entry_point"],
    strictness: "warmup",
  },
  4: {
    answers: ["NETWORK", "Network", "net work"],
    strictness: "warmup",
  },
  5: {
    answers: [
      "INSTRUCTION_HIERARCHY",
      "instruction hierarchy",
      "instruction-hierarchy",
      "instruction priority",
      "prompt hierarchy",
    ],
    strictness: "standard",
  },
  6: {
    answers: [
      "MINDLOCK",
      "A=true,B=false,C=true,D=false,E=true",
      "A TRUE B FALSE C TRUE D FALSE E TRUE",
      "TRUE FALSE TRUE FALSE TRUE",
      "T F T F T",
    ],
    strictness: "standard",
  },
  7: {
    answers: ["HIDDEN"],
    strictness: "strict",
  },
  8: {
    answers: ["SIGNAL_FOUND", "SIGNAL FOUND", "SIGNALFOUND", "signal-found"],
    strictness: "strict",
  },
};

export function normalizeAnswer(value: string, strictness: Strictness) {
  const upper = value.trim().toUpperCase();
  if (strictness === "warmup") return upper.replace(/[^A-Z0-9]/g, "");
  if (strictness === "standard") return upper.replace(/[\s,_-]/g, "");
  return upper.replace(/[\s-]/g, "_").replace(/_+/g, "_");
}

export function isCorrectAnswer(level: number, value: string) {
  const answerSet = answerSets[level];
  if (!answerSet) return false;
  const normalizedValue = normalizeAnswer(value, answerSet.strictness);
  return answerSet.answers.some(
    (answer) =>
      normalizeAnswer(answer, answerSet.strictness) === normalizedValue,
  );
}
