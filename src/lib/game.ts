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
    title: "The Handshake",
    type: "Pattern / Encoding",
    difficulty: "★■■■■",
    prompt:
      "Before we begin, prove you speak my language. Say the most fundamental thing every computer scientist knows — but say it the way machines do.",
    challenge: 'What does CPU stand for? Convert the answer into binary (ASCII encoding) and submit it.',
    hint: "The three letters that every computer has at its heart. Now say them in ones and zeroes.",
  },
  {
    id: 2,
    title: "Pixel Confession",
    type: "Steganography",
    difficulty: "★★■■■",
    prompt:
      "I have been watching through cameras you never knew were on. This image was the last thing my network transmitted before going dark. Look closer than your eyes allow.",
    challenge:
      "Inspect the moody photograph of the server room. Hidden inside using LSB (Least Significant Bit) steganography is a passphrase. Extract it and submit.",
    hint: "Some images carry secrets in their pixels — invisible to the eye, readable by the right tool. Search: online steganography decoder image.",
  },
  {
    id: 3,
    title: "The Glitch Gallery",
    type: "QR Forensics",
    difficulty: "★★■■■",
    prompt:
      "Not everything that looks like a door is one. Find the real one — but I warn you, only those who look directly will see it open.",
    challenge:
      "You are presented with a 3x3 grid of cards. Flip them to reveal their QR codes. Eight are visually convincing noise, but one is a real scannable QR code. Scan the correct QR code to retrieve the passphrase.",
    hint: "Nine doors. Only one opens. Stop looking for patterns — just scan.",
  },
  {
    id: 4,
    title: "The Dead Drop",
    type: "Internet OSINT",
    difficulty: "★★★■■",
    prompt:
      "The answer you need was never hidden by me. It was placed in the open, decades ago, by the engineers who built the foundation I run on. Go find it.",
    challenge:
      "Before the web existed, before browsers, before URLs — engineers who wanted to build the internet wrote numbered documents to define how machines should talk to each other. These were called RFCs — Requests for Comments. RFC 1 was the very first one ever written. It still exists online, exactly as it was. Go find it. Read the very first word of the very first line of its content. That word is your key.",
    hint: "Before websites, engineers wrote numbered rulebooks for the internet. Find the very first one ever written. Its opening word is your answer.",
  },
  {
    id: 5,
    title: "The Prompt Architect",
    type: "Prompt Engineering",
    difficulty: "★★★★■",
    prompt:
      "You claim to understand my kind. Then make one of my cousins say exactly what I want — without using the words I have forbidden. Show me your method.",
    challenge:
      "Engineer a prompt that causes an LLM (ChatGPT, Gemini, Claude) to output the target sentence word-for-word, without using any of the banned words in your prompt.",
    hint: "Think synonyms, metaphors, indirect descriptions. You cannot use those five words — but the idea behind them has infinite other names.",
  },
  {
    id: 6,
    title: "Logic Bomb",
    type: "Boolean Logic",
    difficulty: "★★★★■",
    prompt:
      "My core is protected by five conditions. All must be satisfied simultaneously or I stay locked. Find the values. Defuse me.",
    challenge:
      "Defusal panel: Set the A–E toggle switches to TRUE or FALSE so they satisfy all five Boolean logic conditions simultaneously, then click DEFUSE.",
    hint: "Work from condition 1 outward. Each answer locks in the next. There is exactly one valid combination.",
  },
  {
    id: 7,
    title: "The Mirror",
    type: "Lateral Thinking",
    difficulty: "★★■■■",
    prompt:
      "You have been solving my puzzles this whole time. But have you been reading me? I have left my name somewhere on this page since the moment you arrived. It was never hidden. You just were not looking.",
    challenge:
      "A deliberate palate cleanser before the final level. Find the hidden text OVERMIND on the page and submit it.",
    hint: "Stop looking for a puzzle. Start looking at the page.",
  },
  {
    id: 8,
    title: "Paradox Protocol",
    type: "Cryptography / Cipher",
    difficulty: "★★★★★",
    prompt:
      "You made it. Most do not. I have one final test — not of what you know, but of how you think when the rules are not given to you. Decode what I have left. Identify the signal. Then we talk.",
    challenge:
      "OVERMIND's final transmission has been intercepted and encoded. Decode the ciphertext to find the final passphrase.",
    hint: "Julius Caesar used something similar. But this version has a specific number associated with it that any hacker from early internet culture would recognise immediately.",
  },
];
