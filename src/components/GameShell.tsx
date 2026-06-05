"use client";

import { useMemo, useState } from "react";
import { useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, Eye, Lock, ShieldCheck, Trophy } from "lucide-react";
import { clsx } from "clsx";
import { gameApi, type PublicParticipant } from "~/lib/convexApi";
import { levels, type Level } from "~/lib/game";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Player = PublicParticipant;
type RegistrationPlayer = Pick<Player, "name" | "college" | "email">;

const sampleRanks = [
  { name: "Asha Nair", college: "CEC", level: 6, time: "28:14", hints: 1 },
  { name: "Ritvik Menon", college: "MEC", level: 5, time: "31:02", hints: 0 },
  { name: "Nila Thomas", college: "TKM", level: 4, time: "26:48", hints: 2 },
];

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function GameShell() {
  const register = useMutation(gameApi.register);
  const submitAttempt = useMutation(gameApi.submitAnswer);
  const saveHint = useMutation(gameApi.useHint);
  const setEventStarted = useMutation(gameApi.setEventStarted);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const answerRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("Ready.");
  const [view, setView] = useState<"game" | "board" | "admin">("game");
  const participant = useQuery(
    gameApi.participant,
    participantId ? { participantId } : "skip",
  );
  const boardRanks = useQuery(gameApi.leaderboard);
  const event = useQuery(gameApi.eventState);

  const player = participant;
  const eventStarted = event?.started ?? true;
  const levelId = player?.currentLevel ?? 1;

  const level = levels[levelId - 1] ?? levels[0]!;

  const ranks = useMemo(() => {
    if (!boardRanks) return sampleRanks;
    return boardRanks.map((rank) => ({
      name: rank.name,
      college: rank.college,
      level: rank.level,
      time: rank.finishTime ? "done" : "live",
      hints: rank.hints,
    }));
  }, [boardRanks]);

  async function submitAnswer() {
    if (!participantId) return;
    const submittedAnswer = answerRef.current?.value ?? "";
    const result = await submitAttempt({
      participantId,
      level: level.id,
      answer: submittedAnswer,
    });
    setMessage(result.message);
    if (result.ok && answerRef.current) answerRef.current.value = "";
  }

  async function registerPlayer(nextPlayer: RegistrationPlayer) {
    const registered = await register(nextPlayer);
    setParticipantId(registered.id);
    setMessage("Ready.");
  }

  async function showHint() {
    if (!participantId) return;
    await saveHint({ participantId, level: level.id });
  }

  async function toggleEvent(adminKey: string, started: boolean) {
    try {
      await setEventStarted({ adminKey, started });
      setMessage(
        started ? "Event resumed by admin." : "Event paused by admin.",
      );
    } catch {
      setMessage("Admin key rejected.");
    }
  }

  if (!participantId || !player) {
    return <Registration onRegister={registerPlayer} />;
  }

  return (
    <main className="min-h-screen bg-[#080910] text-[#f2f7ff]">
      <div className="scanline pointer-events-none fixed inset-0 opacity-60" />
      <header className="sticky top-0 z-10 border-b border-cyan-300/15 bg-[#080910]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs tracking-[0.35em] text-cyan-300 uppercase">
              Prompt Paradox 2.0
            </p>
            <h1 className="font-mono text-xl font-semibold">Signal Trials</h1>
          </div>
          <nav className="flex gap-2">
            <NavButton
              active={view === "game"}
              onClick={() => setView("game")}
              label="Game"
            />
            <NavButton
              active={view === "board"}
              onClick={() => setView("board")}
              label="Board"
            />
            <NavButton
              active={view === "admin"}
              onClick={() => setView("admin")}
              label="Admin"
            />
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[280px_1fr]">
        <aside className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/55">Candidate</p>
          <h2 className="mt-1 text-lg font-semibold">{player.name}</h2>
          <p className="text-sm text-cyan-200/75">{player.college}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Metric icon={<Clock size={16} />} label="Elapsed" value="live" />
            <Metric
              icon={<Trophy size={16} />}
              label="Level"
              value={`${levelId}/${levels.length}`}
            />
          </div>
          <div className="mt-5 space-y-2">
            {levels.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  "flex items-center gap-2 border px-3 py-2 text-sm",
                  item.id === levelId
                    ? "border-cyan-300/60 bg-cyan-300/10"
                    : item.id < levelId
                      ? "border-emerald-300/30 text-emerald-200"
                      : "border-white/10 text-white/45",
                )}
              >
                {item.id < levelId ? (
                  <Check size={15} />
                ) : item.id === levelId ? (
                  <Eye size={15} />
                ) : (
                  <Lock size={15} />
                )}
                <span>
                  {item.id}. {item.title}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {view === "game" && (
          <GamePanel
            level={level}
            answerRef={answerRef}
            message={message}
            hintUsed={player.hintsUsed.includes(level.id)}
            onHint={showHint}
            onSubmit={submitAnswer}
          />
        )}
        {view === "board" && <Leaderboard ranks={ranks} />}
        {view === "admin" && (
          <AdminPanel
            eventStarted={eventStarted}
            message={message}
            setEventStarted={(started, adminKey) =>
              toggleEvent(adminKey, started)
            }
          />
        )}
      </section>
    </main>
  );
}

function Registration({
  onRegister,
}: {
  onRegister: (player: RegistrationPlayer) => Promise<void>;
}) {
  async function submit(formData: FormData) {
    const player = {
      name: formString(formData, "name"),
      college: formString(formData, "college"),
      email: formString(formData, "email"),
    };
    if (player.name && player.college && player.email) await onRegister(player);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#080910] px-4 text-[#f2f7ff]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        className="w-full max-w-md border border-cyan-300/25 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/40"
      >
        <p className="text-xs tracking-[0.35em] text-cyan-300 uppercase">
          Signal Trials
        </p>
        <h1 className="mt-3 font-mono text-3xl font-semibold">
          Prompt Paradox 2.0
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Register, solve eight puzzles, and climb the live board. Clean event
          flow.
        </p>
        <div className="mt-6 space-y-3">
          <Input name="name" placeholder="Full name" />
          <Input name="college" placeholder="College / institution" />
          <Input name="email" type="email" placeholder="Email" />
        </div>
        <button className="mt-5 w-full border border-cyan-300 bg-cyan-300 px-4 py-3 font-semibold text-[#081016] hover:bg-cyan-200">
          Start
        </button>
      </form>
    </main>
  );
}

function GamePanel(props: {
  level: Level;
  answerRef: React.RefObject<HTMLInputElement | null>;
  message: string;
  hintUsed: boolean;
  onHint: () => Promise<void>;
  onSubmit: () => Promise<void>;
}) {
  const { level } = props;
  return (
    <section className="border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-300">
            Level {level.id} / {level.type} / {level.difficulty}
          </p>
          <h2 className="mt-1 font-mono text-3xl font-semibold">
            {level.title}
          </h2>
        </div>
        <button
          onClick={() => void props.onHint()}
          className="border border-white/15 px-3 py-2 text-sm text-white/70 hover:border-cyan-300 hover:text-cyan-200"
        >
          {props.hintUsed ? "Hint shown" : "Use hint"}
        </button>
      </div>
      <p className="mt-5 border-l-2 border-cyan-300/70 pl-4 font-mono text-cyan-100">
        {level.prompt}
      </p>
      <div className="mt-5 bg-black/30 p-4 text-white/80">
        {level.challenge}
      </div>
      {props.hintUsed && (
        <p className="mt-3 text-sm text-amber-200">{level.hint}</p>
      )}
      {level.id === 2 && (
        <div className="mt-5 border border-cyan-300/20 bg-[#05070c] p-4">
          <div className="grid aspect-video place-items-center border border-dashed border-cyan-300/25 text-sm text-cyan-200/70">
            Puzzle asset slot: place the steg file at /public/puzzles/level2.png
          </div>
          <a
            className="mt-3 inline-block text-sm text-cyan-200 underline"
            href={`${basePath}/puzzles/level2.png`}
            download
          >
            Download raw puzzle image
          </a>
        </div>
      )}
      {level.id === 3 && <QrGrid />}
      <div className="mt-5 flex gap-2">
        <input
          ref={props.answerRef}
          onKeyDown={(event) => {
            if (event.key === "Enter") void props.onSubmit();
          }}
          className="min-w-0 flex-1 border border-white/15 bg-black/40 px-3 py-3 font-mono outline-none focus:border-cyan-300"
          placeholder="Submit answer"
        />
        <button
          onClick={() => void props.onSubmit()}
          className="border border-cyan-300 bg-cyan-300 px-5 font-semibold text-[#081016] hover:bg-cyan-200"
        >
          Verify
        </button>
      </div>
      <p className="mt-4 text-sm text-cyan-100/75">{props.message}</p>
    </section>
  );
}

function QrGrid() {
  return (
    <div className="mt-5 grid max-w-md grid-cols-3 gap-3">
      {Array.from({ length: 9 }, (_, index) => (
        <div
          key={index}
          className="group bg-static grid aspect-square place-items-center border border-white/10 text-xs text-white/50 [perspective:800px]"
        >
          <div className="grid h-full w-full place-items-center transition duration-300 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            <span className="[backface-visibility:hidden]">SCAN</span>
            <span className="absolute grid h-full w-full [transform:rotateY(180deg)] place-items-center bg-white text-black [backface-visibility:hidden]">
              {index === 4 ? "REAL QR" : "NOISE"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    <section className="border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-mono text-2xl font-semibold">Leaderboard</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-white/45">
            <tr>
              <th className="py-2">Rank</th>
              <th>Name</th>
              <th>College</th>
              <th>Level</th>
              <th>Time</th>
              <th>Hints</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((rank, index) => (
              <tr
                key={`${rank.name}-${index}`}
                className="border-t border-white/10"
              >
                <td className="py-3">{index + 1}</td>
                <td>{rank.name}</td>
                <td>{rank.college}</td>
                <td>{rank.level}</td>
                <td>{rank.time}</td>
                <td>{rank.hints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminPanel(props: {
  eventStarted: boolean;
  message: string;
  setEventStarted: (value: boolean, adminKey: string) => void;
}) {
  const [adminKey, setAdminKey] = useState("");

  return (
    <section className="border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-semibold">Admin</h2>
          <p className="text-sm text-white/55">
            Event control is server-verified. Level 5 is auto-scored.
          </p>
        </div>
        <button
          onClick={() => props.setEventStarted(!props.eventStarted, adminKey)}
          className="border border-cyan-300/40 px-3 py-2 text-sm text-cyan-100"
        >
          Event {props.eventStarted ? "running" : "paused"}
        </button>
      </div>
      <input
        value={adminKey}
        onChange={(event) => setAdminKey(event.target.value)}
        className="mt-4 w-full border border-white/15 bg-black/40 px-3 py-3 font-mono outline-none focus:border-cyan-300"
        placeholder="Admin key"
        type="password"
      />
      <p className="mt-3 text-sm text-cyan-100/75">{props.message}</p>
      <div className="mt-5 border border-white/10 bg-black/25 p-4">
        <div className="mb-3 flex items-center gap-2 text-cyan-200">
          <ShieldCheck size={18} /> Level 5 Auto-Scoring
        </div>
        <p className="text-sm text-white/55">
          Constraint Layer unlocks from the answer checker, so there is no
          manual approval queue or approval lag.
        </p>
      </div>
    </section>
  );
}

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
        "border px-3 py-2 text-sm",
        active
          ? "border-cyan-300 bg-cyan-300 text-black"
          : "border-white/15 text-white/65 hover:border-cyan-300",
      )}
    >
      {label}
    </button>
  );
}

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
    <div className="border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-cyan-200">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-white/15 bg-black/40 px-3 py-3 outline-none focus:border-cyan-300"
      required
    />
  );
}
