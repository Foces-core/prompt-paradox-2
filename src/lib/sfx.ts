// Lightweight SFX helper using the Web Audio API.
// Designed for short, generated UI sounds (clicks, chimes, whoosh, thud, swell).
const STORAGE_KEY = "pp_sfx_enabled";

let ctx: AudioContext | null = null;
let outputGain: GainNode | null = null; // main output bus -> destination
let bgmGain: GainNode | null = null; // bus for ambient music (ducked)
let sfxGain: GainNode | null = null; // bus for sound effects
let _enabled = true; // SFX on by default

function ensureContext() {
  if (ctx) return;
  const globalObj = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass =
    globalObj.AudioContext ?? globalObj.webkitAudioContext;
  if (!AudioContextClass) return;
  ctx = new AudioContextClass();

  // very small master output gain (keeps overall level controllable)
  outputGain = ctx.createGain();
  outputGain.gain.value = 1;
  outputGain.connect(ctx.destination);

  // BGM bus (music) — default mix level lower than UI sounds
  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.35;
  bgmGain.connect(outputGain);

  // SFX bus (UI sounds) — controlled by user preference
  sfxGain = ctx.createGain();
  sfxGain.gain.value = _enabled ? 0.8 : 0;
  sfxGain.connect(outputGain);
}

export function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return _enabled;
    return v === "true";
  } catch {
    return _enabled;
  }
}

export function setEnabled(enabled: boolean) {
  _enabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
  if (sfxGain && ctx) {
    sfxGain.gain.setTargetAtTime(enabled ? 0.8 : 0, ctx.currentTime, 0.01);
  }
}

function safeCtx() {
  if (!ctx) ensureContext();
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

// Shared audio helpers
export function getAudioContext(): AudioContext | null {
  ensureContext();
  return ctx;
}

export function getBgmGain(): GainNode | null {
  ensureContext();
  return bgmGain;
}

export function connectToBgm(node: AudioNode) {
  ensureContext();
  if (!bgmGain) return null;
  try {
    return node.connect(bgmGain);
  } catch {
    return null;
  }
}

export function duckBgm(
  amount = 0.28,
  attack = 0.01,
  hold = 0.16,
  release = 0.12,
) {
  const audioCtx = safeCtx();
  if (!audioCtx || !bgmGain) return;
  try {
    const now = audioCtx.currentTime;
    const cur = bgmGain.gain.value;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(cur, now);
    bgmGain.gain.linearRampToValueAtTime(cur * amount, now + attack);
    bgmGain.gain.linearRampToValueAtTime(cur, now + attack + hold + release);
  } catch {
    // ignore scheduling errors
  }
}

function playOsc(opts: {
  freq: number;
  type?: OscillatorType;
  duration?: number;
  amp?: number;
  detune?: number;
  attack?: number;
  release?: number;
  filter?: { type?: BiquadFilterType; freq?: number; q?: number } | null;
}) {
  if (!_enabled) return;
  const audioCtx = safeCtx();
  if (!audioCtx || !sfxGain) return;
  const {
    freq,
    type = "sine",
    duration = 0.2,
    amp = 0.08,
    detune = 0,
    attack = 0.005,
    release = 0.2,
    filter = null,
  } = opts;

  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;

  let node: AudioNode = osc;
  if (filter) {
    const f = audioCtx.createBiquadFilter();
    f.type = filter.type ?? "lowpass";
    if (filter.freq) f.frequency.value = filter.freq;
    if (filter.q) f.Q.value = filter.q;
    node.connect(f);
    node = f;
  }

  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  node.connect(gain).connect(sfxGain);

  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(amp, t + attack);
  gain.gain.linearRampToValueAtTime(0, t + duration + release);

  osc.start(t);
  osc.stop(t + duration + release + 0.05);
}

function playNoise(opts: {
  duration?: number;
  amp?: number;
  attack?: number;
  release?: number;
  filter?: { type?: BiquadFilterType; freq?: number; q?: number } | null;
}) {
  if (!_enabled) return;
  const audioCtx = safeCtx();
  if (!audioCtx || !sfxGain) return;
  const duration = opts.duration ?? 0.3;
  const buffer = audioCtx.createBuffer(
    1,
    Math.floor(audioCtx.sampleRate * duration),
    audioCtx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  let node: AudioNode = src;
  if (opts.filter) {
    const f = audioCtx.createBiquadFilter();
    f.type = opts.filter.type ?? "highpass";
    if (opts.filter.freq) f.frequency.value = opts.filter.freq;
    if (opts.filter.q) f.Q.value = opts.filter.q;
    node.connect(f);
    node = f;
  }

  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  node.connect(gain).connect(sfxGain);

  const t = audioCtx.currentTime;
  const attack = opts.attack ?? 0.01;
  const release = opts.release ?? 0.2;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(opts.amp ?? 0.08, t + attack);
  gain.gain.linearRampToValueAtTime(0, t + duration + release);

  src.start(t);
  src.stop(t + duration + release + 0.05);
}

// Exported convenience SFX
export function playClick() {
  if (_enabled) duckBgm();
  playOsc({
    freq: 1400,
    type: "square",
    duration: 0.06,
    amp: 0.06,
    attack: 0.001,
    release: 0.04,
  });
}

export function playSuccess() {
  if (_enabled) duckBgm();
  // layered bell
  playOsc({
    freq: 880,
    type: "sine",
    duration: 0.5,
    amp: 0.06,
    attack: 0.002,
    release: 0.6,
    detune: -6,
  });
  setTimeout(
    () =>
      playOsc({
        freq: 1320,
        type: "sine",
        duration: 0.6,
        amp: 0.035,
        attack: 0.01,
        release: 0.7,
      }),
    30,
  );
  setTimeout(
    () =>
      playOsc({
        freq: 1760,
        type: "sine",
        duration: 0.7,
        amp: 0.02,
        attack: 0.02,
        release: 0.8,
      }),
    60,
  );
}

export function playError() {
  if (_enabled) duckBgm();
  playOsc({
    freq: 120,
    type: "sine",
    duration: 0.18,
    amp: 0.12,
    attack: 0.001,
    release: 0.14,
    filter: { type: "lowpass", freq: 500 },
  });
}

export function playHint() {
  if (_enabled) duckBgm();
  playNoise({
    duration: 0.18,
    amp: 0.08,
    attack: 0.01,
    release: 0.28,
    filter: { type: "highpass", freq: 800 },
  });
  setTimeout(
    () =>
      playOsc({
        freq: 1200,
        type: "sine",
        duration: 0.26,
        amp: 0.04,
        attack: 0.005,
        release: 0.28,
      }),
    40,
  );
}

export function playLevelComplete() {
  if (_enabled) duckBgm();
  playOsc({
    freq: 196,
    type: "sawtooth",
    duration: 1.0,
    amp: 0.06,
    attack: 0.02,
    release: 0.8,
  });
  setTimeout(
    () =>
      playOsc({
        freq: 880,
        type: "sine",
        duration: 1.4,
        amp: 0.04,
        attack: 0.05,
        release: 1.1,
      }),
    120,
  );
}

export function playFinalReveal() {
  if (_enabled) duckBgm();
  playOsc({
    freq: 60,
    type: "sine",
    duration: 0.26,
    amp: 0.18,
    attack: 0.001,
    release: 0.3,
    filter: { type: "lowpass", freq: 400 },
  });
  setTimeout(
    () =>
      playNoise({
        duration: 0.9,
        amp: 0.06,
        attack: 0.02,
        release: 0.7,
        filter: { type: "highpass", freq: 2000 },
      }),
    80,
  );
  setTimeout(
    () =>
      playOsc({
        freq: 440,
        type: "sine",
        duration: 1.8,
        amp: 0.09,
        attack: 0.05,
        release: 1.6,
      }),
    220,
  );
}

export function playUi() {
  if (_enabled) duckBgm();
  playOsc({
    freq: 600,
    type: "triangle",
    duration: 0.12,
    amp: 0.05,
    attack: 0.002,
    release: 0.08,
  });
}

export function playPowerOn() {
  if (_enabled) duckBgm();
  // short rising chirp + light noise to evoke power-on
  playOsc({
    freq: 180,
    type: "sine",
    duration: 0.06,
    amp: 0.06,
    attack: 0.001,
    release: 0.08,
  });
  setTimeout(
    () =>
      playOsc({
        freq: 520,
        type: "sine",
        duration: 0.28,
        amp: 0.08,
        attack: 0.01,
        release: 0.28,
        detune: -12,
      }),
    60,
  );
  setTimeout(
    () =>
      playNoise({
        duration: 0.18,
        amp: 0.04,
        attack: 0.005,
        release: 0.2,
        filter: { type: "highpass", freq: 1000 },
      }),
    80,
  );
}

export function playPowerOff() {
  if (_enabled) duckBgm();
  // descending tone + soft thud/noise for power-off
  playOsc({
    freq: 520,
    type: "sine",
    duration: 0.06,
    amp: 0.08,
    attack: 0.001,
    release: 0.08,
  });
  setTimeout(
    () =>
      playOsc({
        freq: 220,
        type: "sine",
        duration: 0.28,
        amp: 0.06,
        attack: 0.01,
        release: 0.28,
        filter: { type: "lowpass", freq: 800 },
      }),
    30,
  );
  setTimeout(
    () =>
      playNoise({
        duration: 0.22,
        amp: 0.06,
        attack: 0.01,
        release: 0.25,
        filter: { type: "lowpass", freq: 600 },
      }),
    40,
  );
}

const sfx = {
  isEnabled,
  setEnabled,
  playClick,
  playSuccess,
  playError,
  playHint,
  playLevelComplete,
  playFinalReveal,
  playPowerOn,
  playPowerOff,
  playUi,
};

export default sfx;
