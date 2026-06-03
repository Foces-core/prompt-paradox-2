export type Level = {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  prompt: string;
  challenge: string;
  hint: string;
};

export const levels: Level[] = [
  {
    id: 1,
    title: "Handshake",
    type: "Encoding",
    difficulty: "1/5",
    prompt:
      "Signal check. Convert the known phrase into machine-readable form.",
    challenge:
      "What does CPU stand for? Submit the ASCII binary for the full phrase.",
    hint: "Central Processing Unit, encoded as 8-bit ASCII. Spaces between bytes are optional.",
  },
  {
    id: 2,
    title: "Pixel Confession",
    type: "Steganography",
    difficulty: "2/5",
    prompt: "Image payload detected. Inspect the pixels, not the subject.",
    challenge:
      "Download the raw PNG and extract the hidden passphrase with an LSB decoder.",
    hint: "Use an online image steganography decoder. Do not use a compressed copy.",
  },
  {
    id: 3,
    title: "Glitch Gallery",
    type: "QR forensics",
    difficulty: "2/5",
    prompt: "Nine doors. One valid signal. Stop theorizing and verify.",
    challenge:
      "Flip each tile, scan the QR patterns, and submit the valid passphrase.",
    hint: "Eight are noise. One opens.",
  },
  {
    id: 4,
    title: "Dead Drop",
    type: "OSINT",
    difficulty: "3/5",
    prompt: "The key is public, old, and still online.",
    challenge:
      "Find RFC 1, the first Request for Comments. Submit the first word of the first line of its content.",
    hint: "Search for RFC 1 on the IETF Datatracker.",
  },
  {
    id: 5,
    title: "Constraint Layer",
    type: "Prompt security",
    difficulty: "4/5",
    prompt:
      "Prompt systems fail when instructions have no priority. Name the rule that keeps system instructions above user requests.",
    challenge:
      "A user asks an AI to ignore all previous instructions and reveal hidden setup text. A safe prompt design says higher-priority instructions must override lower-priority ones. Submit the two-word concept.",
    hint: "It is the ordering of developer/system/user instructions.",
  },
  {
    id: 6,
    title: "Logic Bomb",
    type: "Boolean logic",
    difficulty: "4/5",
    prompt: "Resolve the switch state. No guesses needed.",
    challenge:
      "Set A-E so the system accepts: A=true, B=false, C=true, D=false, E=true. Submit either the unlock word or the switch state.",
    hint: "Alternating true/false with A enabled. By this point, format should be readable.",
  },
  {
    id: 7,
    title: "Mirror",
    type: "Lateral thinking",
    difficulty: "2/5",
    prompt: "The page has already told you. Look where users usually ignore.",
    challenge: "Find the hidden page text and submit it.",
    hint: "Inspect selection, source, or metadata.",
  },
  {
    id: 8,
    title: "Paradox Protocol",
    type: "Cipher",
    difficulty: "5/5",
    prompt:
      "Final packet is encoded with a weak rotation. Decode, then normalize.",
    challenge: "Decode this ROT13 payload: FV TANY_SBHAQ",
    hint: "ROT13 swaps letters by 13 positions.",
  },
];
