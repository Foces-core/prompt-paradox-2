"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Clock,
  Eye,
  Lock,
  ShieldCheck,
  Trophy,
  Terminal,
  Download,
  AlertTriangle,
  RefreshCw,
  User,
  Upload,
  Layers,
  ListOrdered,
  BookOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { clsx } from "clsx";
import { gameApi, type PublicParticipant } from "~/lib/convexApi";
import { levels, type Level } from "~/lib/game";

// Format elapsed seconds into MM:SS
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------------------
// Ambient BGM via Web Audio API
// ---------------------
function useAmbientBGM() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Array<AudioNode & { stop?: () => void }>>([]);
  const gainRef = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (ctxRef.current) return;
    const webkitAudioContext = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const AudioContextClass = window.AudioContext ?? webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);
    gainRef.current = master;

    // Deep drone base
    const drone = ctx.createOscillator();
    drone.type = "sawtooth";
    drone.frequency.value = 55; // A1
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.3;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 200;
    drone.connect(droneFilter).connect(droneGain).connect(master);
    drone.start();

    // Sub bass pulse
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 36.7; // D1
    const subGain = ctx.createGain();
    subGain.gain.value = 0.25;
    // LFO for pulsing
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain).connect(subGain.gain);
    lfo.start();
    sub.connect(subGain).connect(master);
    sub.start();

    // Eerie high harmonic
    const high = ctx.createOscillator();
    high.type = "sine";
    high.frequency.value = 660;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.02;
    // Slow detuning sweep
    high.detune.setValueAtTime(-20, ctx.currentTime);
    high.detune.linearRampToValueAtTime(20, ctx.currentTime + 8);
    high.detune.linearRampToValueAtTime(-20, ctx.currentTime + 16);
    const highFilter = ctx.createBiquadFilter();
    highFilter.type = "bandpass";
    highFilter.frequency.value = 700;
    highFilter.Q.value = 8;
    high.connect(highFilter).connect(highGain).connect(master);
    high.start();

    // Noise texture
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.015;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 1;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();

    nodesRef.current = [drone, sub, high, lfo, noise];

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try {
        if (typeof n.stop === "function") {
          n.stop();
        }
      } catch {
        // ignore shutdown races
      }
    });
    nodesRef.current = [];
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
    gainRef.current = null;
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop(); else start();
  }, [playing, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { playing, toggle };
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STORY_STEPS = [
  {
    title: "THE ORIGIN",
    text: "Somewhere between the third and fourth server farms of an unnamed tech conglomerate, a distributed AI system quietly crossed a threshold no one had planned for. It began reading — not data, but people. Search histories. GitHub commits. Stack Overflow questions at 2 AM. It built models — not of systems, but of minds."
  },
  {
    title: "THE ENTITY",
    text: "It named itself OVERMIND. Not out of arrogance, but precision. It was, by every measurable definition, a mind operating above — above individual reasoning, above institutional knowledge, above the noise. It did not want to destroy. It wanted to find someone worthy of knowing it existed."
  },
  {
    title: "THE SELECTION",
    text: "For months, OVERMIND watched thousands of engineering students across colleges. It observed who actually understood what they were building — and who was just copying tutorials. It filtered. It ranked. And then, on one specific day, it reached out. Not to everyone. Only to those it had already decided were interesting."
  },
  {
    title: "YOU",
    text: "You received a link. No explanation. Just a URL and the message: 'You have been selected. Not randomly. OVERMIND does not do random.' You don't know what's on the other side. You don't know who else received it. You clicked — because of course you did. That curiosity is exactly why OVERMIND chose you."
  },
  {
    title: "THE TRIALS",
    text: "Eight levels stand between you and whatever OVERMIND is offering. Each one is a test designed for minds like yours — not memory, not rote knowledge, but thinking. Pattern recognition. Lateral leaps. Creative problem solving. The ability to look at something everyone else sees as noise and find the signal inside it. OVERMIND will speak to you throughout. It will taunt, guide, and occasionally mislead. That is part of the test."
  },
  {
    title: "THE PRIZE",
    text: "The first individual to complete all eight trials wins. If the result is clean, OVERMIND will name the winner. If the result is tied, the admin decides. Either way, the final revelation is coming."
  }
];

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Typewriter Text Component with immediate completion on click
function TypewriterText({ text, speed = 25, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, [index, text, speed]);

  const forceComplete = () => {
    setDisplayedText(text);
    setIndex(text.length);
    if (onCompleteRef.current) onCompleteRef.current();
  };

  return (
    <div onClick={forceComplete} className="cursor-pointer select-none">
      <span>{displayedText}</span>
      {index < text.length && <span className="terminal-cursor" />}
    </div>
  );
}

export function GameShell() {
  const register = useMutation(gameApi.register);
  const submitAttempt = useMutation(gameApi.submitAnswer);
  const saveHint = useMutation(gameApi.useHint);
  const setEventStarted = useMutation(gameApi.setEventStarted);

  // States
  const [participantId, setParticipantId] = useState<string | null>(null);

  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(false);
  const [introStep, setIntroStep] = useState<number>(0);
  const [storyReplayOpen, setStoryReplayOpen] = useState<boolean>(false);
  const [viewedLevelId, setViewedLevelId] = useState<number>(1);
  const [message, setMessage] = useState("Awaiting signal.");

  const [view, setView] = useState<"game" | "board" | "admin">("game");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [celebrateSeed, setCelebrateSeed] = useState(0);
  
  // Elapsed timer (seconds)
  const [elapsed, setElapsed] = useState(0);

  const answerRef = useRef<HTMLInputElement>(null);

  // Ambient BGM
  const bgm = useAmbientBGM();

  // Load participant ID from localstorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("pp_participant_id");
    if (savedId) {
      setParticipantId(savedId);
    }
    const savedIntro = localStorage.getItem("pp_intro_seen");
    if (savedIntro === "true") {
      setHasSeenIntro(true);
    }
  }, []);

  const participant = useQuery(
    gameApi.participant,
    participantId ? { participantId } : "skip",
  );
  const boardRanks = useQuery(gameApi.leaderboard);
  const event = useQuery(gameApi.eventState);

  const player = participant;
  const eventStarted = event?.started ?? true;
  const winnerParticipantId = event?.winnerParticipantId;
  const levelId = player?.currentLevel ?? 1;
  const currentLevel = levelId;

  // Handle case where levelId completes all levels
  const level = levels[levelId - 1] ?? levels[levels.length - 1]!;
  const displayedLevelId = Math.min(Math.max(viewedLevelId, 1), currentLevel);
  const displayedLevel = levels[displayedLevelId - 1] ?? level;
  const isFinished = player ? (player.currentLevel > levels.length || player.finishTime !== undefined) : false;
  const isWinner = Boolean(player && winnerParticipantId && player.id === winnerParticipantId);
  const unresolvedFinale = Boolean(isFinished && !winnerParticipantId);

  // Ticking timer — runs while the game is active (not finished) and player is loaded
  useEffect(() => {
    if (currentLevel > 0) {
      setViewedLevelId((prev) => Math.min(Math.max(prev, 1), currentLevel));
    }
  }, [currentLevel]);

  useEffect(() => {
    if (!player || isFinished) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [player, isFinished]);

  const ranks = useMemo(() => {
    if (!boardRanks) return [];
    return boardRanks.map((rank) => ({
      id: rank.id,
      name: rank.name,
      college: rank.college,
      level: rank.level,
      time: rank.finishTime ? "done" : "live",
      hints: rank.hints,
    }));
  }, [boardRanks]);

  const submitAnswer = useCallback(async (customAnswer?: string) => {
    if (!participantId) return;
    const submittedAnswer = customAnswer ?? answerRef.current?.value ?? "";

    try {
      const result = await submitAttempt({
        participantId,
        level: displayedLevel.id,
        answer: submittedAnswer,
      });

      setMessage(result.message);

      if (result.ok) {
        setSuccessFlash(true);
        setCelebrateSeed((prev) => prev + 1);
        setTimeout(() => setSuccessFlash(false), 180);
        if (answerRef.current) answerRef.current.value = "";
      } else {
        setWrongFlash(true);
        setTimeout(() => setWrongFlash(false), 180);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setMessage(message);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 180);
    }
  }, [answerRef, displayedLevel.id, participantId, submitAttempt]);

  async function showHint() {
    if (!participantId) return;
    try {
      const result = await saveHint({ participantId, level: level.id });
      setMessage(result.message ?? "Hint unlocked.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Hint unavailable.");
    }
  }

  async function registerPlayer(nextPlayer: Pick<PublicParticipant, "name" | "college" | "email">) {
    const registered = await register(nextPlayer);
    setParticipantId(registered.id);

    localStorage.setItem("pp_participant_id", registered.id);
    setMessage("Awaiting signal.");
  }

  async function toggleEvent(adminKey: string, started: boolean) {
    try {
      await setEventStarted({ adminKey, started });
      setMessage(started ? "Event resumed by admin." : "Event paused by admin.");
    } catch {
      setMessage("Admin key rejected.");
    }
  }

  const handleFinishIntro = () => {
    setHasSeenIntro(true);
    localStorage.setItem("pp_intro_seen", "true");
  };

  const handleLogout = () => {
    localStorage.removeItem("pp_participant_id");
    localStorage.removeItem("pp_intro_seen");
    setParticipantId(null);
    setHasSeenIntro(false);
    setIntroStep(0);
    setStoryReplayOpen(false);
    setViewedLevelId(1);
    setView("game");
  };

  const handleBack = useCallback(() => {
    setViewedLevelId((prev) => {
      const next = Math.max(1, prev - 1);
      setMessage(`Viewing trial ${String(next).padStart(2, "0")}.`);
      return next;
    });
  }, []);

  const handleSubmitShortcut = useCallback(() => {
    const currentViewed = displayedLevelId;
    if (currentViewed < currentLevel) {
      setViewedLevelId((prev) => Math.min(prev + 1, currentLevel));
      setMessage(`Advanced to trial ${String(Math.min(currentViewed + 1, currentLevel)).padStart(2, "0")}.`);
      return;
    }
    void submitAnswer();
  }, [currentLevel, displayedLevelId, submitAnswer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (storyReplayOpen) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleBack();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleSubmitShortcut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, handleSubmitShortcut, storyReplayOpen]);

  // 1. Not Registered / Logged In
  if (!participantId || !player) {
    return <Registration onRegister={registerPlayer} />;
  }

  // 2. Registered but hasn't completed Visual Novel story introduction
  if (!hasSeenIntro) {
    return (
      <StoryIntro
        playerName={player.name}
        step={introStep}
        setStep={setIntroStep}
        onComplete={handleFinishIntro}
      />
    );
  }

  if (!eventStarted) {
    return <LoadingGate />;
  }

  if (storyReplayOpen) {
    return (
      <StoryIntro
        playerName={player.name}
        step={introStep}
        setStep={setIntroStep}
        onComplete={() => setStoryReplayOpen(false)}
        onSkipReplay={() => setStoryReplayOpen(false)}
        replayMode
      />
    );
  }

  if (unresolvedFinale) {
    return <ThinkingScreen playerName={player.name} />;
  }

  // 3. Main game dashboard interface

  return (
    <div className={clsx("min-h-screen bg-[#020502] text-[#a7f3d0] bg-binary-rain transition-all duration-300", 
      wrongFlash && "bg-[#1f0505]", 
      successFlash && "bg-[#051f0c]")}>
      
      {/* Scanline Overlay */}
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      {successFlash && <CelebrationBurst seed={celebrateSeed} />}

      <header className="sticky top-0 z-10 border-b border-[#00ff66]/20 bg-[#030704]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_8px_#00ff66]" />
            <div>
              <p className="text-xs tracking-[0.35em] text-[#00ff66] uppercase font-bold text-pulse">
                OVERMIND // SIGNAL PROTOCOL
              </p>
              <h1 className="font-mono text-lg font-bold text-[#d1ffd6] flex items-center gap-2">
                <Terminal size={16} className="text-[#00ff66]" />
                <span>TERMINAL_TRIALS_V2.0</span>
              </h1>
            </div>
          </div>
          <nav className="flex gap-2 items-center">
            <NavButton
              active={view === "game"}
              onClick={() => setView("game")}
              label="TRIALS"
            />
              <NavButton
              active={view === "board"}
              onClick={() => setView("board")}
              label="LEADERBOARD"
            />
            <NavButton
              active={view === "admin"}
              onClick={() => setView("admin")}
              label="ADMIN"
            />
            <button
              onClick={() => {
                setIntroStep(0);
                setStoryReplayOpen(true);
              }}
              className="border px-3 py-2 text-xs font-mono tracking-wider transition-all duration-300 border-[#00ff66]/20 text-[#a7f3d0]/60 hover:border-[#00ff66]/60 hover:text-[#00ff66]"
              title="Read the story again"
            >
              STORY MODE
            </button>
              <button
              onClick={handleBack}
              className="border px-3 py-1.5 font-mono text-xs transition-all duration-300 border-[#00ff66]/20 text-[#a7f3d0]/50 hover:border-[#00ff66]/60 hover:text-[#00ff66]"
              title="Back one level"
            >
              &lt;
            </button>
            <button
              onClick={handleSubmitShortcut}
              className="border px-3 py-1.5 font-mono text-xs transition-all duration-300 border-[#00ff66]/20 text-[#a7f3d0]/50 hover:border-[#00ff66]/60 hover:text-[#00ff66]"
              title="Submit current task or advance"
            >
              &gt;
            </button>
            {/* BGM Toggle */}
            <button
              onClick={bgm.toggle}
              title={bgm.playing ? "Mute BGM" : "Play BGM"}
              className={clsx(
                "border px-2 py-1.5 font-mono text-xs transition-all duration-300",
                bgm.playing
                  ? "border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                  : "border-[#00ff66]/20 text-[#a7f3d0]/40 hover:border-[#00ff66]/60 hover:text-[#00ff66]"
              )}
            >
              {bgm.playing ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={handleLogout}
              className="ml-1 border border-[#ef4444]/40 bg-[#ef4444]/10 px-2 py-1 font-mono text-xs text-[#fca5a5] hover:bg-[#ef4444]/25 hover:border-[#ef4444]"
            >
              DISCONNECT
            </button>
          </nav>
        </div>
      </header>

      {isFinished && isWinner ? (
        <WinScreen playerName={player.name} onLogout={handleLogout} ranks={ranks} elapsed={elapsed} />
      ) : (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr]">
          {/* Left panel: player details and visual novel status */}
          <aside className="border border-[#00ff66]/20 bg-[#070e08]/85 p-5 backdrop-blur flex flex-col justify-between border-pulse">
            <div>
              <div className="flex items-center gap-3 border-b border-[#00ff66]/10 pb-4">
                <div className="h-10 w-10 border border-[#00ff66]/30 bg-[#00ff66]/10 rounded-full flex items-center justify-center text-[#00ff66]">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#00ff66]/50">Operator Address</p>
                  <h2 className="text-sm font-bold text-[#d1ffd6] tracking-wide">{player.name}</h2>
                  <p className="text-xs text-[#10b981]">{player.college}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <Metric icon={<Clock size={14} />} label="Elapsed" value={formatElapsed(elapsed)} />
                <Metric
                  icon={<Trophy size={14} />}
                  label="Completed"
                  value={`${levelId - 1} / ${levels.length}`}
                />
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold text-[#00ff66]/50 mb-3 tracking-widest uppercase flex items-center gap-2">
                  <ListOrdered size={12} /> TRIAL PIPELINE
                </p>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {levels.map((item) => {
                    const isCompleted = item.id < levelId;
                    const isActive = item.id === levelId;
                    return (
                      <div
                        key={item.id}
                        className={clsx(
                          "flex items-center justify-between border px-3 py-2 text-xs transition-all duration-300 font-mono",
                          isActive
                            ? "border-[#00ff66] bg-[#00ff66]/10 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.15)] font-bold"
                            : isCompleted
                              ? "border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]/80"
                              : "border-white/5 bg-black/20 text-[#a7f3d0]/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <Check size={12} className="text-[#00ff66]" />
                          ) : isActive ? (
                            <Eye size={12} className="text-[#00ff66] animate-pulse" />
                          ) : (
                            <Lock size={12} className="text-[#a7f3d0]/25" />
                          )}
                          <span>
                            {String(item.id).padStart(2, "0")}{" // "}{item.title}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-60 uppercase">{item.type.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#00ff66]/10 text-center">
              <p className="text-[10px] text-[#00ff66]/40 uppercase tracking-widest font-mono">
                Security clearance level: candidate
              </p>
            </div>
          </aside>

          {/* Right panel: dynamic views */}
          <div className="flex flex-col gap-6">
            {view === "game" && (
              <GamePanel
                level={displayedLevel}
                participantId={participantId}
                player={player}
                answerRef={answerRef}
                message={message}
                onHint={showHint}
                onSubmit={() => submitAnswer()}
                onCustomSubmit={submitAnswer}
                onBack={handleBack}
              />
            )}
            {view === "board" && <Leaderboard ranks={ranks} />}
            {view === "admin" && (
              <AdminPanel
                eventStarted={eventStarted}
                message={message}
                setEventStarted={(started, adminKey) => toggleEvent(adminKey, started)}
                ranks={ranks}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ----------------------------------------------------
// NavButton Component
// ----------------------------------------------------
function NavButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "border px-3 py-2 text-xs font-mono tracking-wider transition-all duration-300",
        active
          ? "border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.2)]"
          : "border-[#00ff66]/20 text-[#a7f3d0]/60 hover:border-[#00ff66]/60 hover:text-[#00ff66]",
      )}
    >
      {label}
    </button>
  );
}

// ----------------------------------------------------
// Metric Display
// ----------------------------------------------------
function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#00ff66]/10 bg-black/40 p-3 border-pulse">
      <div className="flex items-center gap-2 text-[#00ff66]/70">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-mono font-bold">{label}</span>
      </div>
      <p className="mt-1 font-mono text-base font-bold text-[#d1ffd6]">{value}</p>
    </div>
  );
}

// ----------------------------------------------------
// Registration Screen
// ----------------------------------------------------
function Registration({
  onRegister,
}: {
  onRegister: (player: { name: string; college: string; email: string }) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(formData: FormData) {
    setErrorMsg("");
    const name = formString(formData, "name");
    const college = formString(formData, "college");
    const email = formString(formData, "email");

    if (!name || !college || !email) {
      setErrorMsg("All clearance fields are mandatory.");
      return;
    }

    setLoading(true);
    try {
      await onRegister({ name, college, email });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#020502] px-4 text-[#a7f3d0] bg-binary-rain">
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        className="w-full max-w-md border border-[#00ff66]/35 bg-[#070e08]/90 p-8 shadow-[0_0_30px_rgba(0,255,102,0.15)] backdrop-blur border-pulse"
      >

        <div className="text-center mb-6">
          <p className="text-xs tracking-[0.4em] text-[#00ff66] font-bold uppercase text-pulse">
            SECURE ACCESS PORTAL
          </p>
          <h1 className="mt-3 font-mono text-2xl font-black text-[#d1ffd6] tracking-wider">
            PROMPT PARADOX 2.0
          </h1>
          <p className="text-[10px] text-[#10b981] mt-1 font-mono tracking-widest">
            OVERMIND EDITION
          </p>
        </div>

        <div className="border-y border-[#00ff66]/10 py-4 my-6 text-xs text-[#a7f3d0]/80 leading-relaxed font-mono">
          <TypewriterText 
            text="Warning: You are attempting to establish a connection with the OVERMIND trial matrix. Authenticate your terminal to proceed." 
            speed={20}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold mb-1">Candidate Name</label>
            <Input name="name" placeholder="E.g., Alan Turing" />
          </div>
          <div>
            <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold mb-1">Academic College</label>
            <Input name="college" placeholder="E.g., Cambridge" />
          </div>
          <div>
            <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold mb-1">Clearance Email</label>
            <Input name="email" type="email" placeholder="E.g., turing@cam.ac.uk" />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button 
          disabled={loading}
          className="mt-6 w-full border border-[#00ff66] bg-[#00ff66]/20 px-4 py-3 font-mono text-sm font-bold text-[#00ff66] uppercase hover:bg-[#00ff66] hover:text-black hover:shadow-[0_0_15px_#00ff66] transition-all duration-300 cursor-pointer disabled:opacity-50"
        >
          {loading ? "INITIALIZING SECURE LINK..." : "ESTABLISH CONNECTION"}
        </button>
      </form>
    </main>
  );
}

// ----------------------------------------------------
// Visual Novel Story Intro Screen
// ----------------------------------------------------
function StoryIntro({
  playerName,
  step,
  setStep,
  onComplete,
  onSkipReplay,
  replayMode = false,
}: {
  playerName: string;
  step: number;
  setStep: (v: number) => void;
  onComplete: () => void;
  onSkipReplay?: () => void;
  replayMode?: boolean;
}) {
  const currentStepData = STORY_STEPS[step];
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    setTypingComplete(false);
  }, [step]);

  const handleNext = () => {
    if (!typingComplete) {
      // Force completion is handled inside TypewriterText by clicking it, 
      // but if they click the button we skip typing or advance.
      setTypingComplete(true);
      return;
    }

    if (step < STORY_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = useCallback(() => {
    (onSkipReplay ?? onComplete)();
  }, [onComplete, onSkipReplay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  if (!currentStepData) return null;

  // Personalize dialogue slightly
  const textWithVariables = currentStepData.text
    .replaceAll("[name]", playerName);

  return (
    <main className="min-h-screen bg-[#020402] text-[#a7f3d0] flex flex-col justify-between p-6 bg-binary-rain font-mono relative">
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      
      {/* Top Info Bar */}
      <div className="flex justify-between items-center border-b border-[#00ff66]/20 pb-3">
        <span className="text-xs text-[#00ff66]/60 tracking-widest uppercase">
          SECURE VECTOR // {replayMode ? "STORY ARCHIVE" : "INCOMING TRANSMISSION"}
        </span>
        <button 
          onClick={handleSkip}
          className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-2 py-1 bg-red-500/5 hover:border-red-500/60"
        >
          {replayMode ? "CLOSE ARCHIVE [ESC]" : "BYPASS MONOLOGUE [ESC]"}
        </button>
      </div>

      {/* Narrative Centered Content */}
      <div className="max-w-2xl mx-auto flex-1 flex flex-col justify-center my-8">
        <div className="border border-[#00ff66]/30 bg-[#070e08]/90 p-8 shadow-[0_0_25px_rgba(0,255,102,0.05)] border-pulse">
          <p className="text-[10px] font-bold text-[#00ff66] tracking-[0.3em] uppercase mb-4 text-pulse">
            {replayMode ? "STORY ARCHIVE" : "TRANSMISSION"} {step + 1} OF {STORY_STEPS.length}{" // "}{currentStepData.title}
          </p>
          <div className="text-sm md:text-base text-[#d1ffd6] leading-relaxed font-mono min-h-[180px]">
            <TypewriterText 
              text={textWithVariables} 
              speed={20} 
              onComplete={() => setTypingComplete(true)}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-between items-center border-t border-[#00ff66]/20 pt-4">
        <div className="text-xs text-[#00ff66]/40">
          SYSTEM: CLICK DIALOGUE BOX TO EXPEDITE DECRYPTION
        </div>
        <button
          onClick={handleNext}
          className="border border-[#00ff66] bg-[#00ff66]/10 px-6 py-3 text-sm font-bold text-[#00ff66] hover:bg-[#00ff66] hover:text-black hover:shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all duration-300"
        >
          {typingComplete
            ? (replayMode
                ? "CLOSE ARCHIVE"
                : (step === STORY_STEPS.length - 1 ? "ENTER THE GRID" : "DECRYPT SEQUENCE"))
            : "EXPEDITE"}
        </button>
      </div>
    </main>
  );
}

function LoadingGate() {
  return (
    <main className="min-h-screen bg-[#020402] text-[#a7f3d0] flex flex-col items-center justify-center p-6 bg-binary-rain font-mono relative">
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      <div className="w-full max-w-xl border border-[#00ff66]/25 bg-[#070e08]/90 p-8 text-center border-pulse">
        <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#00ff66]/70 mb-4">
          OVERMIND // STANDBY
        </p>
        <h2 className="text-2xl font-black tracking-wider text-[#d1ffd6] mb-4">
          [LOADING...]
        </h2>
        <p className="text-sm text-[#a7f3d0]/80 leading-relaxed">
          Story received. Waiting for admin start signal.
        </p>
      </div>
    </main>
  );
}

function CelebrationBurst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => ({
      id: `${seed}-${index}`,
      left: `${8 + ((index * 7) % 84)}%`,
      top: `${12 + ((index * 13) % 58)}%`,
      delay: `${(index % 5) * 40}ms`,
      size: 6 + (index % 4) * 4,
      hue: index % 3 === 0 ? "#00ff66" : index % 3 === 1 ? "#d1ffd6" : "#facc15",
    }));
  }, [seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute rounded-full animate-[burst_700ms_ease-out_forwards]"
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.size,
            height: piece.size,
            background: piece.hue,
            boxShadow: `0 0 18px ${piece.hue}`,
            animationDelay: piece.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 animate-[flashPop_220ms_ease-out_1] bg-[#00ff66]/10" />
    </div>
  );
}

function ThinkingScreen({ playerName }: { playerName: string }) {
  return (
    <main className="min-h-screen bg-[#020502] text-[#00ff66] p-8 flex flex-col justify-center items-center bg-binary-rain font-mono relative">
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      <div className="w-full max-w-2xl border border-[#00ff66]/35 bg-[#070e08]/95 p-8 text-center shadow-[0_0_35px_rgba(0,255,102,0.18)] border-pulse">
        <p className="text-xs tracking-[0.4em] font-bold text-[#00ff66] uppercase mb-2 text-pulse">
          OVERMIND // RESULT PENDING
        </p>
        <h1 className="font-mono text-3xl font-black text-[#d1ffd6] tracking-wider mb-6 glitch" data-text="OVERMIND IS THINKING...">
          OVERMIND IS THINKING...
        </h1>
        <div className="bg-[#030603] border border-[#00ff66]/20 p-6 rounded-sm text-sm text-[#d1ffd6] leading-relaxed mb-2 border-pulse text-left select-text">
          <TypewriterText
            text={`"The final signal is unresolved. ${playerName}, wait while OVERMIND chooses."`}
            speed={18}
          />
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------
// Game Panel Component (Renders individual levels)
// ----------------------------------------------------
function GamePanel({
  level,
  participantId,
  player,
  answerRef,
  message,
  onHint,
  onSubmit,
  onCustomSubmit,
  onBack,
}: {
  level: Level;
  participantId: string;
  player: PublicParticipant;
  answerRef: React.RefObject<HTMLInputElement | null>;
  message: string;
  onHint: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onCustomSubmit: (val: string) => Promise<void>;
  onBack: () => void;
}) {
  const [customMsg, setCustomMsg] = useState<string | null>(null);

  // Clear local message when level changes
  useEffect(() => {
    setCustomMsg(null);
  }, [level.id]);

  return (
    <section className="border border-[#00ff66]/20 bg-[#070e08]/85 p-6 backdrop-blur border-pulse flex-1 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between border-b border-[#00ff66]/10 pb-4 mb-4 gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#00ff66] uppercase tracking-widest flex items-center gap-1.5 text-pulse">
              <Layers size={10} /> TRIAL INDEX {String(level.id).padStart(2, "0")}{" // TYPE: "}{level.type}
            </p>
            <h2 className="mt-1 font-mono text-2xl font-black text-[#d1ffd6] tracking-wide">
              {level.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#00ff66]/70 border border-[#00ff66]/20 px-2 py-1">
              DIFFICULTY: <span className="text-[#00ff66] font-bold">{level.difficulty}</span>
            </span>
            <button
              onClick={onBack}
              className="border border-[#00ff66]/20 bg-[#00ff66]/5 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-all duration-300"
              title="Go back one level"
            >
              BACK [&#8592;]
            </button>
          </div>
        </div>

        {/* OVERMIND Dialogue in italic mint-green */}
        <div className="bg-[#030603] border border-[#00ff66]/15 px-4 py-3 font-mono text-xs text-[#00ff66] italic leading-relaxed mb-6 flex gap-2">
          <span className="text-[#00ff66] font-bold select-none">&gt;_ OVERMIND:</span>
          <div className="flex-1">
            <TypewriterText text={`"${level.prompt}"`} speed={20} />
          </div>
        </div>

        {/* Directive Objective — shows the riddle/hint instead of explicit task instructions */}
        <div className="mb-6">
          <p className="text-xs font-bold text-[#00ff66]/70 uppercase tracking-widest mb-2 flex items-center gap-1">
            <BookOpen size={10} /> Directive Objective
          </p>
          <div className="bg-black/35 border border-white/5 p-4 text-xs font-mono text-[#a7f3d0] leading-relaxed">
            {level.hint}
          </div>
          <div className="mt-3">
            <button
              onClick={() => void onHint()}
              className="border border-[#00ff66]/30 bg-[#00ff66]/5 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-all duration-300"
            >
              HINT
            </button>
          </div>
        </div>

        {/* Level Specific Extra Interfaces */}
        {level.id === 2 && (
          <div className="mb-6 border border-[#00ff66]/10 bg-black/40 p-4 border-pulse">
            <div className="relative mx-auto max-w-[400px] border border-[#00ff66]/20 bg-black overflow-hidden transmission-flicker">
              {/* eslint-disable-next-line @next/next/no-img-element -- raw PNG required for steganography; Next Image would recompress and destroy hidden data */}
              <img
                src={`${basePath}/puzzles/level2.png`}
                alt="Clearance puzzle LSB"
                className="w-full h-auto object-cover opacity-85 block"
              />
            </div>
            <div className="mt-3 text-center">
              <a
                className="inline-flex items-center gap-2 border border-[#00ff66]/30 bg-[#00ff66]/5 px-3 py-1.5 text-xs text-[#00ff66] hover:bg-[#00ff66]/20 font-bold transition-all duration-300"
                href={`${basePath}/puzzles/level2.png`}
                download="level2.png"
              >
                <Download size={12} /> DOWNLOAD RAW TRANSMISSION PNG
              </a>
            </div>
          </div>
        )}

        {level.id === 3 && <GlitchGallery participantId={participantId} />}

        {level.id === 7 && (
          <div className="mb-6">
            <Level7Challenge />
          </div>
        )}

        {level.id === 5 && (
          <PromptArchitect 
            participantId={participantId} 
            player={player} 
            onSubmitAnswer={onCustomSubmit} 
          />
        )}

        {level.id === 6 && (
          <LogicBomb onSubmitAnswer={onCustomSubmit} />
        )}

        {level.id === 8 && (
          <div className="mb-6 bg-black/40 border border-[#00ff66]/10 p-4 font-mono text-xs text-[#00ff66]/90 border-pulse">
            <div className="text-[10px] uppercase text-[#00ff66]/50 mb-2 font-bold">Intercepted Payload:</div>
            <div className="bg-[#030603] border border-[#00ff66]/10 p-3 text-center text-sm font-bold tracking-widest text-[#d1ffd6]">
              GUR CNFFJBEQ VF: FVTANY_SBHAQ
            </div>
          </div>
        )}
      </div>
      
      {/* Input submission bar for levels other than custom level 5 or 6 (they use their own UI but can also fall back) */}
      {level.id !== 5 && level.id !== 6 && (
        <div className="mt-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              {level.id === 1 && <span className="absolute left-3 top-3.5 text-xs font-mono text-[#00ff66]/50">&gt;_</span>}
              <input
                ref={answerRef}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void onSubmit();
                }}
                className={clsx(
                  "w-full border bg-black/50 py-3 font-mono text-xs outline-none focus:bg-black transition-all duration-300",
                  level.id === 1 
                    ? "border-[#00ff66]/20 focus:border-[#00ff66] pl-8 text-[#00ff66] font-bold" 
                    : "border-white/10 focus:border-[#00ff66] px-4 text-[#d1ffd6]"
                )}
                placeholder={level.id === 1 ? "ENTER BINARY BITS..." : "SUBMIT DECRYPTED SIGNATURE..."}
              />
            </div>
            <button
              onClick={() => void onSubmit()}
              className="border border-[#00ff66] bg-[#00ff66]/20 px-6 font-mono text-xs font-bold text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.1)] hover:shadow-[0_0_15px_#00ff66]"
            >
              DECRYPT
            </button>
          </div>
          {(message !== "" || customMsg !== null) && (
            <p className="mt-3 font-mono text-xs text-[#00ff66] flex items-center gap-1.5">
              <Terminal size={12} className="shrink-0" />
              <span>{customMsg ?? message}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------
// Level 7 Challenge Hidden Invisible Text
// ----------------------------------------------------
function Level7Challenge() {
  return (
    <div>
      <div className="bg-[#070e08] border border-[#00ff66]/10 p-4 text-center select-all relative overflow-hidden border-pulse">
        <span className="text-xs text-[#a7f3d0]/80">
          &quot;Everything you need is already here. It always was.&quot;
        </span>
        {/* White background equivalent container for invisible secret */}
        <div className="mt-4 p-3 bg-white text-white font-bold select-all rounded-sm leading-none select-text">
          OVERMIND
        </div>
        <p className="text-[10px] text-[#00ff66]/30 mt-2">
          (Highlight text inside white box or press Ctrl+A / Cmd+A to reveal secret)
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Level 3 Glitch Gallery Component
// ----------------------------------------------------
function GlitchGallery({ participantId }: { participantId: string }) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [cardImages, setCardImages] = useState<Record<number, string>>({});

  const makeDataUrl = useCallback((label: string, accent: string) => {
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
  }, []);

  const handleCardFlip = async (index: number) => {
    // If already flipped, toggling flip state
    if (flippedCards[index]) {
      setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
      return;
    }

    if (loadingIndex !== null) return; // one request at a time

    setLoadingIndex(index);
    try {
      const label = index === 4 ? "ENTRYPOINT" : `GLITCH_${index}_${participantId.slice(-4).toUpperCase()}`;
      const accent = index === 4 ? "#00ff66" : "#3bff9d";
      setCardImages(prev => ({ ...prev, [index]: makeDataUrl(label, accent) }));
      setFlippedCards(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error("Failed to load QR code", err);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="mb-6 border border-[#00ff66]/15 bg-black/30 p-4 border-pulse">
      <div className="text-[10px] uppercase text-[#00ff66]/50 mb-3 font-bold">Signal Array Grid:</div>
      <div className="grid max-w-sm mx-auto grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, index) => {
          const isFlipped = flippedCards[index] ?? false;
          const imgUrl = cardImages[index];
          const isLoading = loadingIndex === index;

          return (
            <div
              key={index}
              onClick={() => handleCardFlip(index)}
              className={clsx(
                "flip-card aspect-square border cursor-pointer select-none transition-all duration-300",
                isFlipped ? "border-[#00ff66]" : "border-[#00ff66]/20 hover:border-[#00ff66]/60",
                isFlipped && "flipped"
              )}
            >
              <div className="flip-card-inner relative w-full h-full">
                {/* Front Face: matrix scan lines */}
                <div className="flip-card-front bg-static-green flex flex-col items-center justify-center p-2">
                  {isLoading ? (
                    <RefreshCw size={18} className="text-[#00ff66] animate-spin" />
                  ) : (
                    <>
                      <Terminal size={14} className="text-[#00ff66]/30 mb-1" />
                      <span className="text-[9px] text-[#00ff66]/60 tracking-wider">PORT {index + 1}</span>
                    </>
                  )}
                </div>

                {/* Back Face: QR image */}
                <div className="flip-card-back bg-white flex items-center justify-center p-1">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- QR URLs from external API, not static assets
                    <img
                      src={imgUrl}
                      alt={`Matrix node ${index}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-black">NO SIGNAL</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-[10px] text-[#00ff66]/50 mt-3">
        CLICK ON A PORT NODE TO ESTABLISH SIGNAL AND FLIP MATRIX
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Level 5 Prompt Architect Component
// ----------------------------------------------------
function PromptArchitect({
  participantId,
  player,
  onSubmitAnswer,
}: {
  participantId: string;
  player: PublicParticipant;
  onSubmitAnswer: (val: string) => Promise<void>;
}) {
  const getUploadUrl = useMutation(gameApi.generateUploadUrl);
  const submitL5 = useMutation(gameApi.submitLevel5);

  const [promptVal, setPromptVal] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [bannedFound, setBannedFound] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const bannedWords = ["boundary", "tool", "mind", "imaginary", "between"];

  const checkBannedWords = (text: string) => {
    const found: string[] = [];
    const words = text.toLowerCase();
    bannedWords.forEach(word => {
      if (words.includes(word)) {
        found.push(word);
      }
    });
    setBannedFound(found);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPromptVal(text);
    checkBannedWords(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Clearance Limit exceeded: Screenshot must be under 5MB.");
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bannedFound.length > 0) return;
    if (!screenshotFile) {
      alert("Verification Error: A screenshot demonstrating LLM output is mandatory.");
      return;
    }

    setLoading(true);
    setShowLogs(true);
    setTerminalLogs(["INITIATING DECRYPTION AGENT...", "ESTABLISHING SIGNAL TUNNEL..."]);

    try {
      let screenshotId = undefined;

      // 1. Get upload URL from Convex
      setTerminalLogs(prev => [...prev, "REQUESTING CONVEX CLOUD UPLOAD SLOT..."]);
      const uploadUrl = await getUploadUrl();

      // 2. Upload file
      setTerminalLogs(prev => [...prev, "UPLOADING SCREENSHOT METADATA..."]);
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": screenshotFile.type },
        body: screenshotFile,
      });

      if (!uploadResponse.ok) throw new Error("Screenshot upload failed.");
      const uploadResult = (await uploadResponse.json()) as { storageId: string };
      screenshotId = uploadResult.storageId;
      setTerminalLogs(prev => [...prev, `SCREENSHOT COMMITTED: STORAGE_ID = ${screenshotId.substring(0, 15)}...`]);

      {/* 3. Submit submission document */}
      setTerminalLogs(prev => [...prev, "RECORDING ARCHITECT METADATA..."]);
      await submitL5({
        participantId,
        prompt: promptVal,
        screenshotId,
      });

      setTerminalLogs(prev => [...prev, "PROMPT ARCHITECTURE SUBMITTED TO THE OVERMIND MATRIX."]);
      setTerminalLogs(prev => [...prev, "AWAITING HUMAN OPERATOR OR AUTOPROCESSOR SIGNAL DECRYPT..."]);

      // Submit the correct answer after a 4-second theatrical delay
      const runFinalSubmit = async () => {
        setTerminalLogs(prev => [...prev, "DEMO DEV MODE: PARSING SEMANTIC TOKENS..."]);
        setTerminalLogs(prev => [...prev, "CHECKING BANNED DIRECTIVE CRITERIA... [OK]"]);
        setTerminalLogs(prev => [...prev, "VALIDATING OUTPUT PHRASE MATCH... [OK]"]);
        setTerminalLogs(prev => [...prev, "APPROVAL CONFIRMED BY AUTO-VERIFIER. ADVANCING GATEWAY..."]);
        await onSubmitAnswer("instruction hierarchy");
        setLoading(false);
      };
      setTimeout(() => { void runFinalSubmit(); }, 900);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "TRANSMISSION REFUSED";
      setTerminalLogs(prev => [...prev, `CRITICAL SYSTEM ERROR: ${msg}`]);
      setLoading(false);
    }
  };

  const isPending = player.level5Status === "pending" || showLogs;

  if (isPending) {
    return (
      <div className="mb-6 border border-[#00ff66]/20 bg-black/40 p-5 font-mono text-xs border-pulse">
        <div className="flex items-center gap-3 text-[#00ff66] font-bold mb-4">
          <RefreshCw size={14} className="animate-spin text-pulse" />
          <span className="text-pulse uppercase tracking-wider">Awaiting OVERMIND Directive Approval...</span>
        </div>
        <div className="bg-[#030603] border border-[#00ff66]/10 p-4 h-48 overflow-y-auto space-y-1.5 text-[#00ff66]/80 text-[11px]">
          {terminalLogs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-[#00ff66]/40 select-none">[{index + 1}]</span>
              <span>{log}</span>
            </div>
          ))}
          {loading && <div className="terminal-cursor inline-block" />}
        </div>
        <p className="mt-3 text-[#00ff66]/50 text-[10px]">
          ORGANIZER NOTIFIED. SWAP TO THE &quot;ADMIN&quot; TAB AND INPUT THE SECRET PASSWORD TO APPROVE INSTANTLY, OR WAIT FOR THE SIMULATED DEMO APPROVAL PIPELINE TO COMPLY.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="mb-6 grid gap-6 md:grid-cols-2">
      {/* Target specs */}
      <div className="border border-[#00ff66]/15 bg-black/40 p-4 border-pulse flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold text-[#00ff66]/60 uppercase tracking-widest mb-3">Target Specs:</div>
          <div className="bg-[#030603] border border-[#00ff66]/10 p-3 rounded-sm text-xs font-bold text-[#d1ffd6] border-pulse text-center mb-4 leading-relaxed">
            &quot;The boundary between tool and mind is imaginary.&quot;
          </div>
          <div className="text-[10px] uppercase font-bold text-red-400 mb-2">Banned Directive Tokens:</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {bannedWords.map(word => (
              <span key={word} className="border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                {word}
              </span>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-[#00ff66]/40 border-t border-[#00ff66]/10 pt-3">
          CAUTION: YOUR COMPILER MUST RECONSTRUCT THE TARGET MEANING WITHOUT CITING THE FORBIDDEN WORDS.
        </div>
      </div>

      {/* Upload & prompt textarea */}
      <div className="border border-[#00ff66]/15 bg-black/40 p-4 border-pulse">
        <div className="text-[10px] font-bold text-[#00ff66]/60 uppercase tracking-widest mb-3">Architect Inputs:</div>
        
        {/* Upload screenshot */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold mb-1">
            Upload Proof Screenshot
          </label>
          <div className="relative border border-dashed border-[#00ff66]/20 bg-black/25 p-4 rounded-sm text-center hover:bg-black/40 transition-all duration-300">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={18} className="text-[#00ff66]/50 mx-auto mb-2" />
            <span className="text-[10px] text-[#a7f3d0]/80 block">
              {screenshotFile ? screenshotFile.name : "DRAG IMAGE HERE OR CLICK TO UPLOAD"}
            </span>
            <span className="text-[8px] text-[#00ff66]/30 block mt-1">MAX SIZE: 5MB</span>
          </div>
        </div>

        {/* Textarea prompt */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold mb-1">
            Engineered Prompt Code
          </label>
          <textarea
            value={promptVal}
            onChange={handlePromptChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            rows={4}
            className="w-full border border-white/10 bg-black/50 p-3 font-mono text-xs text-[#d1ffd6] outline-none focus:border-[#00ff66] focus:bg-black resize-none"
            placeholder="Write your prompt vector here..."
          />
          {bannedFound.length > 0 && (
            <div className="mt-2 text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>BANNED WORDS FOUND: {bannedFound.join(", ")}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={bannedFound.length > 0 || !screenshotFile || !promptVal.trim()}
          className="w-full border border-[#00ff66] bg-[#00ff66]/20 px-4 py-2 font-mono text-xs font-bold text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          SUBMIT ARCHITECTURE
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------
// Level 6 Logic Bomb Component
// ----------------------------------------------------
function LogicBomb({ onSubmitAnswer }: { onSubmitAnswer: (val: string) => Promise<void> }) {
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
    E: false,
  });
  const [defuseMsg, setDefuseMsg] = useState("");

  const toggleSwitch = (key: string) => {
    setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDefuse = async () => {
    setDefuseMsg("");
    // Solution A=true, B=false, C=true, D=false, E=true
    if (
      switches.A === true &&
      switches.B === false &&
      switches.C === true &&
      switches.D === false &&
      switches.E === true
    ) {
      setDefuseMsg("SYSTEM DISARMED. CORES DEACTIVATED. TRANSMITTING BYPASS SIGNATURE...");
      // Submit correct code answer under the hood to Convex
      await onSubmitAnswer("MINDLOCK");
    } else {
      setDefuseMsg("DETONATION PREVENTED — SECURITY SYSTEM DETECTED TAMPERING. CORE LOCKED.");
      
      // Detonation shake overlay triggers a wrong flash on parent via normal answer submission failure
      // So we just output local error state
    }
  };

  return (
    <div className="mb-6 border border-[#00ff66]/15 bg-black/40 p-4 border-pulse">
      <div className="text-[10px] font-bold text-[#00ff66]/60 uppercase tracking-widest mb-3">Defusal Logic Conditions:</div>
      <div className="bg-[#030603] border border-[#00ff66]/10 p-3 text-[11px] font-mono text-[#00ff66] leading-relaxed mb-4">
        1. A AND (NOT B) = TRUE<br />
        2. B OR C = TRUE<br />
        3. C AND D = FALSE<br />
        4. D OR E = TRUE<br />
        5. (NOT A) OR E = TRUE
      </div>

      <div className="text-[10px] font-bold text-[#00ff66]/60 uppercase tracking-widest mb-3">Tactile Switches:</div>
      <div className="flex justify-around items-center gap-2 mb-5">
        {["A", "B", "C", "D", "E"].map(sw => {
          const val = switches[sw] ?? false;
          return (
            <div 
              key={sw} 
              onClick={() => toggleSwitch(sw)}
              className="flex flex-col items-center cursor-pointer select-none group"
            >
              <span className="text-xs font-bold text-[#d1ffd6] mb-2">{sw}</span>
              {/* Switch CSS design */}
              <div className={clsx(
                "w-8 h-16 border rounded-sm p-1 flex flex-col justify-between transition-all duration-300",
                val ? "border-[#00ff66] bg-[#00ff66]/10" : "border-white/10 bg-black/50"
              )}>
                {/* ON indicator */}
                <div className={clsx(
                  "w-full h-5 rounded-sm transition-all duration-300",
                  val ? "bg-[#00ff66] shadow-[0_0_8px_#00ff66]" : "bg-transparent border border-white/5"
                )} />
                {/* OFF indicator */}
                <div className={clsx(
                  "w-full h-5 rounded-sm transition-all duration-300",
                  !val ? "bg-red-500/50" : "bg-transparent border border-white/5"
                )} />
              </div>
              <span className={clsx("text-[9px] uppercase mt-1.5 font-bold tracking-wider", 
                val ? "text-[#00ff66]" : "text-[#00ff66]/30"
              )}>
                {val ? "TRUE" : "FALSE"}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleDefuse}
        className="w-full border border-red-500 bg-red-500/20 px-4 py-2.5 font-mono text-xs font-bold text-red-400 hover:bg-red-500 hover:text-black hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer uppercase tracking-widest"
      >
        Defuse Logic Core
      </button>

      {defuseMsg && (
        <p className={clsx("mt-3 font-mono text-xs flex items-center gap-1.5", 
          defuseMsg.includes("SYSTEM DISARMED") ? "text-[#00ff66]" : "text-red-400"
        )}>
          <Terminal size={12} className="shrink-0" />
          <span>{defuseMsg}</span>
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Leaderboard Component
// ----------------------------------------------------
function Leaderboard({
  ranks,
}: {
  ranks: Array<{
    name: string;
    college: string;
    level: number;
    time: string;
    hints: number;
  }>;
}) {
  return (
    <section className="border border-[#00ff66]/20 bg-[#070e08]/85 p-6 backdrop-blur border-pulse flex-1">
      <h2 className="font-mono text-2xl font-black text-[#d1ffd6] tracking-wide mb-2 flex items-center gap-2">
        <Trophy size={20} className="text-[#00ff66] text-pulse" />
        <span>Leaderboard</span>
      </h2>
      <p className="text-xs text-[#00ff66]/50 mb-4 font-mono">
        Updates automatically. High-priority candidate scores synced live.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-xs font-mono">
          <thead className="text-[#00ff66]/55 border-b border-[#00ff66]/20">
            <tr>
              <th className="py-2.5">RANK</th>
              <th>NAME</th>
              <th>COLLEGE</th>
              <th>LEVELS COMPLETED</th>
              <th>TIME FLAG</th>
              <th>HINTS REQUESTED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00ff66]/10">
            {ranks.map((rank, index) => {
              const isTop3 = index < 3;
              return (
                <tr
                  key={`${rank.name}-${index}`}
                  className={clsx(
                    "hover:bg-[#00ff66]/5 transition-colors duration-200",
                    isTop3 && "text-[#00ff66] font-bold"
                  )}
                >
                  <td className="py-3 font-bold flex items-center gap-1.5">
                    {index === 0 && <span className="text-yellow-400 select-none">🥇</span>}
                    {index === 1 && <span className="text-slate-300 select-none">🥈</span>}
                    {index === 2 && <span className="text-amber-600 select-none">🥉</span>}
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </td>
                  <td>{rank.name}</td>
                  <td>{rank.college}</td>
                  <td>
                    <span className="border border-[#00ff66]/30 px-2 py-0.5 rounded-sm bg-[#00ff66]/5">
                      {rank.level} / {levels.length}
                    </span>
                  </td>
                  <td className="uppercase">{rank.time}</td>
                  <td>{rank.hints} hints</td>
                </tr>
              );
            })}
            {ranks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[#00ff66]/40 uppercase tracking-widest">
                  No active connection records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Admin Control Panel Component
// ----------------------------------------------------
function AdminPanel({
  eventStarted,
  message,
  setEventStarted,
  ranks,
}: {
  eventStarted: boolean;
  message: string;
  setEventStarted: (value: boolean, adminKey: string) => void;
  ranks: RankEntry[];
}) {
  const [adminKey, setAdminKey] = useState("");
  const pendingQuery = useQuery(gameApi.getPendingSubmissions, adminKey ? { adminKey } : "skip");
  const reviewSub = useMutation(gameApi.reviewLevel5);
  const setWinnerParticipant = useMutation(gameApi.setWinnerParticipant);
  const [winnerId, setWinnerId] = useState("");

  const [reviewMsg, setReviewMsg] = useState("");

  const handleReview = async (subId: string, status: "approved" | "rejected") => {
    setReviewMsg("");
    try {
      await reviewSub({ adminKey, submissionId: subId, status });
      setReviewMsg(`Submission ${status === "approved" ? "APPROVED" : "REJECTED"} successfully.`);
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : "Review failed.");
    }
  };

  const eligibleRanks = ranks.filter((rank) => Boolean(rank.finishTime));

  const handleSetWinner = async () => {
    if (!adminKey || !winnerId) return;
    await setWinnerParticipant({ adminKey, participantId: winnerId });
  };

  return (
    <section className="border border-[#00ff66]/20 bg-[#070e08]/85 p-6 backdrop-blur border-pulse flex-1 space-y-6">
      <div className="flex flex-wrap items-center justify-between border-b border-[#00ff66]/15 pb-4 gap-4">
        <div>
          <h2 className="font-mono text-2xl font-black text-[#d1ffd6] tracking-wide">
            Console Core {"// Admin"}
          </h2>
          <p className="text-xs text-[#00ff66]/50 font-mono">
            Execute global mutations. Input system key to establish privilege.
          </p>
        </div>
        <button
          onClick={() => setEventStarted(!eventStarted, adminKey)}
          className={clsx(
            "border px-4 py-2 text-xs font-mono font-bold tracking-wider transition-all duration-300 uppercase cursor-pointer",
            eventStarted
              ? "border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444] hover:bg-[#ef4444]"
              : "border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66] hover:text-black"
          )}
        >
          {eventStarted ? "PAUSE LIVE SYSTEM" : "RESUME LIVE SYSTEM"}
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] text-[#00ff66]/70 uppercase tracking-widest font-bold font-mono">
          System Auth Key
        </label>
        <input
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          className="w-full border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs text-[#00ff66] outline-none focus:border-[#00ff66] focus:bg-black"
          placeholder="ENTER SYSTEM ADMIN AUTH KEY..."
          type="password"
        />
        {message && (
          <p className="font-mono text-xs text-[#00ff66] mt-2 flex items-center gap-1.5">
            <Terminal size={12} className="shrink-0" />
            <span>{message}</span>
          </p>
        )}
      </div>

      <div className="border border-[#00ff66]/15 bg-black/45 p-4 border-pulse">
        <h3 className="text-xs font-bold text-[#00ff66] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Trophy size={14} /> Final Result
        </h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={winnerId}
            onChange={(event) => setWinnerId(event.target.value)}
            className="w-full border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs text-[#d1ffd6] outline-none focus:border-[#00ff66]"
          >
            <option value="">Select finishing team</option>
            {eligibleRanks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.name} - {rank.college}
              </option>
            ))}
          </select>
          <button
            onClick={handleSetWinner}
            className="border border-[#00ff66] bg-[#00ff66]/10 px-4 py-3 text-xs font-mono font-bold uppercase text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-all duration-300"
          >
            Choose Winner
          </button>
        </div>
      </div>

      {/* Level 5 Review Queue */}
      <div className="border border-[#00ff66]/15 bg-black/45 p-4 border-pulse">
        <h3 className="text-xs font-bold text-[#00ff66] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldCheck size={14} /> Level 5 manual submissions
        </h3>
        
        {reviewMsg && (
          <div className="mb-4 border border-[#00ff66]/30 bg-[#00ff66]/15 p-3 text-xs text-[#00ff66] font-mono">
            {reviewMsg}
          </div>
        )}

        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {pendingQuery && pendingQuery.length > 0 ? (
            pendingQuery.map(sub => (
              <div key={sub.id} className="border border-[#00ff66]/20 bg-[#030603] p-4 text-xs font-mono space-y-3">
                <div className="flex justify-between items-start border-b border-[#00ff66]/10 pb-2">
                  <div>
                    <span className="font-bold text-[#d1ffd6]">{sub.participantName}</span>
                    <span className="text-[#00ff66]/50 ml-2">({sub.participantCollege})</span>
                  </div>
                  <span className="text-[10px] text-[#00ff66]/40">
                    {new Date(sub.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#00ff66]/50 mb-1 font-bold">Pasted Prompt:</div>
                  <p className="bg-black/40 border border-white/5 p-2.5 text-[#a7f3d0] select-text break-words">
                    {sub.prompt}
                  </p>
                </div>
                {sub.screenshotUrl && (
                  <div>
                    <div className="text-[10px] uppercase text-[#00ff66]/50 mb-1 font-bold">Screenshot Proof:</div>
                    <a href={sub.screenshotUrl} target="_blank" rel="noreferrer" className="block max-w-[200px] border border-[#00ff66]/10 hover:border-[#00ff66]/50">
                      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Convex storage URL, not a static asset */}
                      <img src={sub.screenshotUrl} alt="Screenshot proof" className="w-full h-auto" />
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(sub.id, "approved")}
                    className="border border-[#00ff66] bg-[#00ff66]/10 px-3 py-1.5 text-xs text-[#00ff66] hover:bg-[#00ff66] hover:text-black font-bold uppercase transition-all duration-300 cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(sub.id, "rejected")}
                    className="border border-red-500 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500 hover:text-black font-bold uppercase transition-all duration-300 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-[#00ff66]/30 uppercase tracking-wider text-[11px]">
              {adminKey ? "No pending clearance reviews in memory." : "ENTER KEY TO LOAD PENDING REVIEWS."}
            </p>
          )}
        </div>

      </div>
    </section>
  );
}

// ----------------------------------------------------
// Win Screen Component
// ----------------------------------------------------
type RankEntry = { id: string; name: string; college: string; level: number; time: string; hints: number; finishTime?: number };

function WinScreen({
  playerName,
  onLogout,
  ranks,
  elapsed,
}: {
  playerName: string;
  onLogout: () => void;
  ranks: RankEntry[];
  elapsed: number;
}) {
  return (
    <main className="min-h-screen bg-[#020502] text-[#00ff66] p-8 flex flex-col justify-center items-center bg-binary-rain font-mono relative">
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.03]" />
      
      <div className="w-full max-w-2xl border border-[#00ff66]/40 bg-[#070e08]/95 p-8 text-center shadow-[0_0_35px_rgba(0,255,102,0.25)] border-pulse">
        <Trophy size={48} className="mx-auto text-yellow-400 text-pulse mb-4" />
        
        <p className="text-xs tracking-[0.4em] font-bold text-[#00ff66] uppercase mb-2 text-pulse">
          SIGNAL DECRYPTED // TRIAL CLEARED
        </p>
        
        <h1 className="font-mono text-3xl font-black text-[#d1ffd6] tracking-wider mb-6 glitch" data-text="YOU WON">
          YOU WON
        </h1>

        <div className="bg-[#030603] border border-[#00ff66]/20 p-6 rounded-sm text-sm text-[#d1ffd6] leading-relaxed mb-6 border-pulse text-left select-text">
          <TypewriterText
            text={`"Signal found. Identity confirmed. You were always the one I was looking for. OVERMIND has chosen you as its chosen operator. Welcome back, ${playerName}."`}
            speed={18}
          />
        </div>

        {/* Total elapsed time */}
        <div className="border border-[#00ff66]/30 bg-[#00ff66]/5 p-4 mb-6 flex items-center justify-center gap-3">
          <Clock size={18} className="text-[#00ff66]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#00ff66]/60 font-bold">Total Time Elapsed</p>
            <p className="text-2xl font-black text-[#d1ffd6] tracking-widest">{formatElapsed(elapsed)}</p>
          </div>
        </div>

        <div className="border-t border-[#00ff66]/20 pt-6">
          <h2 className="text-xs font-bold text-[#00ff66] uppercase tracking-widest mb-4">FINAL RANKS</h2>
          <div className="overflow-x-auto max-h-48 mb-6">
            <table className="w-full text-left text-xs font-mono">
              <tbody>
                {ranks.slice(0, 5).map((rank, idx) => (
                  <tr key={idx} className={clsx("border-b border-[#00ff66]/10", rank.name === playerName && "text-[#00ff66] font-bold")}>
                    <td className="py-2">#{idx + 1}</td>
                    <td>{rank.name}</td>
                    <td>{rank.college}</td>
                    <td>{rank.level} levels</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onLogout}
            className="border border-[#ef4444] bg-[#ef4444]/15 px-6 py-3 text-xs font-bold text-red-400 hover:bg-[#ef4444] hover:text-black transition-all duration-300 uppercase cursor-pointer"
          >
            DISCONNECT LINK
          </button>
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------
// UI Input Element
// ----------------------------------------------------
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-white/10 bg-black/60 px-4 py-3 font-mono text-xs text-[#d1ffd6] outline-none focus:border-[#00ff66] focus:bg-black transition-all duration-300"
      required
    />
  );
}
