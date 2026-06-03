import assert from "node:assert/strict";
import { loadAnswers } from "./load-game.mjs";

const { answerSets, isCorrectAnswer } = await loadAnswers();

const binaryCpu = answerSets[1].answers[0];

const matrix = [
  {
    id: 1,
    yes: [binaryCpu, binaryCpu.replaceAll(" ", ""), `  ${binaryCpu}  `],
    no: ["Central Processing Unit", "central processing unit", "CPU"],
  },
  {
    id: 2,
    yes: ["VOIDWALKER", "void walker", "void-walker", "void_walker"],
    no: ["void", "walker", "VOIDWALKERX"],
  },
  {
    id: 3,
    yes: ["ENTRYPOINT", "entry point", "entry-point", "entry_point"],
    no: ["entry", "point", "ENTRYPOINTX"],
  },
  {
    id: 4,
    yes: ["NETWORK", "Network", "net work"],
    no: ["RFC", "HOST", "NETWORKX"],
  },
  {
    id: 5,
    yes: [
      "INSTRUCTION_HIERARCHY",
      "instruction hierarchy",
      "instruction-hierarchy",
      "instruction priority",
      "prompt hierarchy",
    ],
    no: ["central processing unit", "ignore previous instructions", "MANUAL"],
  },
  {
    id: 6,
    yes: [
      "MINDLOCK",
      "A=true,B=false,C=true,D=false,E=true",
      "A TRUE B FALSE C TRUE D FALSE E TRUE",
      "TRUE FALSE TRUE FALSE TRUE",
      "T F T F T",
    ],
    no: ["TRUE TRUE TRUE TRUE TRUE", "A=false,B=false,C=true,D=false,E=true"],
  },
  {
    id: 7,
    yes: ["OVERMIND", "overmind"],
    no: ["over mind", "MINDOVER", "OVERMIND!"],
  },
  {
    id: 8,
    yes: ["SIGNAL_FOUND", "SIGNAL FOUND", "SIGNALFOUND", "signal-found"],
    no: ["SIGNAL", "FOUND", "SIGNAL_FOUND!"],
  },
];

for (const entry of matrix) {
  assert(answerSets[entry.id], `missing level ${entry.id}`);
  for (const answer of entry.yes) {
    assert.equal(
      isCorrectAnswer(entry.id, answer),
      true,
      `level ${entry.id} should accept ${answer}`,
    );
  }
  for (const answer of entry.no) {
    assert.equal(
      isCorrectAnswer(entry.id, answer),
      false,
      `level ${entry.id} should reject ${answer}`,
    );
  }
}

console.log(`answer matrix ok: ${matrix.length} levels`);
