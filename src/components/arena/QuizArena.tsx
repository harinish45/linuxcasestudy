"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Trophy,
  Crown,
  Medal,
  Award,
  Target,
  Crosshair,
  Zap,
  Flame,
  TrendingUp,
  MousePointerClick,
  Shield,
  Star,
  Heart,
  Users,
  Rocket,
  Brain,
  Ghost,
  Bug,
  Anchor,
  Compass,
  Copy,
  Check,
  LogOut,
  Play,
  Timer,
  ChevronRight,
} from "lucide-react";
import Reveal from "@/components/Reveal";

/* ── identity & avatars ─────────────────────────────────────────────── */

const AVATARS = [
  { icon: Rocket, color: "#d97757" },
  { icon: Brain, color: "#6a9bcc" },
  { icon: Zap, color: "#c6613f" },
  { icon: Shield, color: "#788c5d" },
  { icon: Flame, color: "#b3391b" },
  { icon: Star, color: "#c6613f" },
  { icon: Crown, color: "#d97757" },
  { icon: Ghost, color: "#6a9bcc" },
  { icon: Bug, color: "#788c5d" },
  { icon: Anchor, color: "#73726c" },
  { icon: Swords, color: "#b3391b" },
  { icon: Compass, color: "#788c5d" },
] as const;

function Avatar({ index, size = 34 }: { index: number; size?: number }) {
  const a = AVATARS[Math.max(0, Math.min(index, AVATARS.length - 1))];
  const Icon = a.icon;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `${a.color}18`, color: a.color }}
    >
      <Icon style={{ width: size * 0.52, height: size * 0.52 }} />
    </span>
  );
}

/* ── badges ─────────────────────────────────────────────────────────── */

type BadgeCode =
  | "crown" | "silver" | "bronze" | "perfect" | "sharpshooter" | "speed_demon"
  | "streak_master" | "iron_focus" | "comeback" | "fastest_finger"
  | "veteran" | "contender" | "challenger" | "participant";

const BADGES: Record<BadgeCode, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  crown: { label: "Champion", desc: "Finished #1", icon: <Crown className="h-4 w-4" />, color: "#d97757" },
  silver: { label: "Runner-up", desc: "Finished #2", icon: <Medal className="h-4 w-4" />, color: "#73726c" },
  bronze: { label: "Third place", desc: "Finished #3", icon: <Medal className="h-4 w-4" />, color: "#c6613f" },
  perfect: { label: "Perfect Round", desc: "All 20 correct", icon: <Target className="h-4 w-4" />, color: "#788c5d" },
  sharpshooter: { label: "Sharpshooter", desc: "80%+ accuracy", icon: <Crosshair className="h-4 w-4" />, color: "#6a9bcc" },
  speed_demon: { label: "Speed Demon", desc: "Lightning-fast answers", icon: <Zap className="h-4 w-4" />, color: "#c6613f" },
  streak_master: { label: "Streak Master", desc: "5+ correct in a row", icon: <Flame className="h-4 w-4" />, color: "#b3391b" },
  iron_focus: { label: "Iron Focus", desc: "Answered every question", icon: <Shield className="h-4 w-4" />, color: "#73726c" },
  comeback: { label: "Comeback Kid", desc: "Owned the second half", icon: <TrendingUp className="h-4 w-4" />, color: "#788c5d" },
  fastest_finger: { label: "Fastest Finger", desc: "Single fastest correct answer", icon: <MousePointerClick className="h-4 w-4" />, color: "#d97757" },
  veteran: { label: "Veteran", desc: "Top quarter of the room", icon: <Award className="h-4 w-4" />, color: "#6a9bcc" },
  contender: { label: "Contender", desc: "Held the middle ground", icon: <Star className="h-4 w-4" />, color: "#c6613f" },
  challenger: { label: "Challenger", desc: "Fought to the last second", icon: <Heart className="h-4 w-4" />, color: "#b3391b" },
  participant: { label: "Participant", desc: "Showed up and played", icon: <Users className="h-4 w-4" />, color: "#73726c" },
};

function BadgeChip({ code, size = "sm" }: { code: BadgeCode; size?: "sm" | "lg" }) {
  const b = BADGES[code];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono ${
        size === "lg" ? "px-3 py-1.5 text-[11px]" : "px-2 py-0.5 text-[9.5px]"
      }`}
      style={{ borderColor: `${b.color}44`, background: `${b.color}12`, color: b.color }}
      title={b.desc}
    >
      {b.icon}
      {b.label}
    </span>
  );
}

/* ── types ──────────────────────────────────────────────────────────── */

type Phase = "entry" | "lobby" | "countdown" | "question" | "reveal" | "over";

interface LobbyPlayer { id: string; name: string; avatar: number; score: number }
interface RoomInfo { code: string; hostId: string | null; players: LobbyPlayer[]; settings: { questionCount: number; questionMs: number } }
interface ScoreRow { rank: number; id: string; name: string; avatar: number; score: number }
interface QState { i: number; total: number; id: string; prompt: string; options: string[]; endsAt: number; durMs: number }
interface QEndPayload {
  i: number; correctIndex: number; explanation: string;
  results: { id: string; correct: boolean; pts: number; ms: number | null }[];
  scoreboard: ScoreRow[];
}
interface LeaderRow { rank: number; id: string; name: string; avatar: number; score: number; correct: number; answered: number; bestStreak: number; fastestMs: number | null }

const IDENT_KEY = "clu-quiz-identity";

export default function QuizArena() {
  const socketRef = useRef<Socket | null>(null);
  const [phase, setPhase] = useState<Phase>("entry");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [youId, setYouId] = useState<string | null>(null);
  const [countdownMs, setCountdownMs] = useState(0);
  const [question, setQuestion] = useState<QState | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [qEnd, setQEnd] = useState<QEndPayload | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[] | null>(null);
  const [badges, setBadges] = useState<Record<string, BadgeCode[]> | null>(null);
  const [copied, setCopied] = useState(false);
  const clockOffset = useRef(0);
  const [, forceTick] = useState(0);

  /* identity persistence */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(IDENT_KEY);
      if (raw) {
        const ident = JSON.parse(raw) as { name?: string; avatar?: number };
        if (ident.name) setName(ident.name);
        if (typeof ident.avatar === "number") setAvatar(ident.avatar);
      }
    } catch {
      /* fresh visitor */
    }
  }, []);

  /* socket lifecycle — one spawn function, reused after resets */
  const resetRef = useRef<(message?: string) => void>(() => {});

  useEffect(() => {
    const spawn = () => {
      const socket = io("/?XTransformPort=3003", {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 900,
        timeout: 10_000,
      });
      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("lobby", (data: RoomInfo) => {
        setRoom(data);
        setPhase((p) => (p === "countdown" || p === "question" || p === "reveal" ? p : "lobby"));
      });
      socket.on("game:countdown", (data: { ms: number }) => {
        setQEnd(null);
        setQuestion(null);
        setPicked(null);
        setCountdownMs(data.ms);
        setPhase("countdown");
      });
      socket.on("q:new", (q: QState & { now: number }) => {
        clockOffset.current = Date.now() - q.now;
        setQuestion({ i: q.i, total: q.total, id: q.id, prompt: q.prompt, options: q.options, endsAt: q.endsAt, durMs: q.durMs });
        setPicked(null);
        setQEnd(null);
        setPhase("question");
      });
      socket.on("q:end", (data: QEndPayload) => {
        setQEnd(data);
        setPhase("reveal");
      });
      socket.on("game:over", (data: { leaderboard: LeaderRow[]; badges: Record<string, BadgeCode[]> }) => {
        setLeaders(data.leaderboard);
        setBadges(data.badges);
        setPhase("over");
      });
      socket.on("room:closed", () => resetRef.current("The room was closed — start a new one."));
      return socket;
    };

    spawn();

    resetRef.current = (message?: string) => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setPhase("entry");
      setRoom(null);
      setQuestion(null);
      setQEnd(null);
      setLeaders(null);
      setBadges(null);
      setError(message ?? null);
      setConnected(false);
      window.setTimeout(() => spawn(), 50);
    };

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const persistIdentity = (n: string, a: number) => {
    try {
      window.localStorage.setItem(IDENT_KEY, JSON.stringify({ name: n, avatar: a }));
    } catch {
      /* private mode */
    }
  };

  const createRoom = () => {
    if (!name.trim() || !socketRef.current) return;
    setBusy(true);
    setError(null);
    persistIdentity(name.trim(), avatar);
    socketRef.current.emit(
      "room:create",
      { name: name.trim(), avatar },
      (res: { ok: boolean; code?: string; you?: string; error?: string }) => {
        setBusy(false);
        if (res.ok && res.code) {
          setYouId(res.you ?? null);
          setPhase("lobby");
        } else setError(res.error ?? "could not create the room");
      }
    );
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!name.trim() || !code || !socketRef.current) return;
    setBusy(true);
    setError(null);
    persistIdentity(name.trim(), avatar);
    socketRef.current.emit(
      "room:join",
      { code, name: name.trim(), avatar },
      (res: { ok: boolean; you?: string; error?: string }) => {
        setBusy(false);
        if (res.ok) {
          setYouId(res.you ?? null);
          setPhase("lobby");
        } else setError(res.error ?? "could not join");
      }
    );
  };

  const startGame = () => socketRef.current?.emit("game:start", {});
  const playAgain = () => socketRef.current?.emit("game:again", {});
  const leave = () => {
    socketRef.current?.emit("leave");
    resetRef.current();
  };

  const answer = (choice: number) => {
    if (phase !== "question" || picked !== null) return;
    setPicked(choice);
    socketRef.current?.emit("answer", { choice });
  };

  const copyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const isHost = room?.hostId != null && room.hostId === youId;
  const myRow = (rows: ScoreRow[]) => rows.find((r) => r.id === youId);
  const remaining = useMemo(() => {
    if (!question) return 0;
    return Math.max(question.endsAt - (Date.now() - clockOffset.current), 0);
  }, [question, phase, countdownMs]);

  const remainingPct = question ? (remaining / question.durMs) * 100 : 0;
  const secondsLeft = Math.ceil(remaining / 1000);

  return (
    <section aria-labelledby="arena-title" className="relative">
      <div className="mx-auto max-w-4xl">
        <Reveal y={6}>
          <p className="kicker mb-3 flex items-center gap-2">
            <Swords className="h-4 w-4 text-terracotta" />
            quiz battle — live multiplayer
          </p>
        </Reveal>
        <Reveal delay={0.05} y={10}>
          <h1 id="arena-title" className="display text-[32px] leading-[1.15] text-foreground md:text-[40px]">
            Everyone joins with a code. Fastest brains win.
          </h1>
        </Reveal>
        <Reveal delay={0.1} y={10}>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">
            Share a room code with up to 200 players. 20 questions, 10 seconds each — answer fast for
            up to 1000 points plus streak bonuses. Full leaderboard and badges for every participant at
            the end.
          </p>
        </Reveal>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {/* ── ENTRY ── */}
            {phase === "entry" && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="surface p-6 md:p-8">
                  <p className="kicker mb-4">pick your fighter — name & avatar</p>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar index={avatar} size={52} />
                      <div className="min-w-0 flex-1">
                        <label htmlFor="player-name" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-text-faint">
                          display name
                        </label>
                        <input
                          id="player-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (joinCode ? joinRoom() : createRoom())}
                          maxLength={18}
                          placeholder="e.g. penguin_42"
                          className="input-field max-w-xs font-mono"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    <div role="radiogroup" aria-label="Choose avatar" className="flex flex-wrap gap-2">
                      {AVATARS.map((a, i) => {
                        const Icon = a.icon;
                        const active = avatar === i;
                        return (
                          <button
                            key={i}
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAvatar(i)}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150 ${
                              active ? "scale-105 border-transparent" : "border-border bg-card hover:bg-secondary"
                            }`}
                            style={active ? { background: `${a.color}1e`, borderColor: a.color, color: a.color } : { color: "var(--muted-foreground)" }}
                            aria-label={`Avatar ${i + 1}`}
                          >
                            <Icon className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* create */}
                      <button
                        onClick={createRoom}
                        disabled={!name.trim() || busy || !connected}
                        className="btn-primary flex-col !items-start !gap-1 !rounded-xl !px-5 !py-4 disabled:opacity-45"
                      >
                        <span className="flex items-center gap-2 text-[15px]">
                          <Swords className="h-4 w-4" />
                          Host a battle
                        </span>
                        <span className="text-[12px] font-normal opacity-85">get a room code to share</span>
                      </button>
                      {/* join */}
                      <div className="rounded-xl border border-input bg-card p-3">
                        <label htmlFor="room-code" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
                          join with code
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="room-code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                            placeholder="ABC123"
                            className="input-field font-mono tracking-[0.3em]"
                            autoComplete="off"
                            spellCheck={false}
                            aria-label="Room code"
                          />
                          <button
                            onClick={joinRoom}
                            disabled={!name.trim() || joinCode.length !== 6 || busy || !connected}
                            className="btn-primary shrink-0 !px-4 disabled:opacity-45"
                          >
                            join
                          </button>
                        </div>
                      </div>
                    </div>

                    {!connected && (
                      <p className="font-mono text-[11.5px] text-text-faint">connecting to the battle server…</p>
                    )}
                    {error && (
                      <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 font-mono text-[12px] text-destructive">
                        {error}
                      </p>
                    )}
                    <p className="font-mono text-[10.5px] text-text-faint">
                      name & avatar are remembered on this device. no account, no password.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── LOBBY ── */}
            {phase === "lobby" && room && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="surface flex flex-col items-center gap-4 p-6 md:p-8">
                  <p className="kicker">room code — share this</p>
                  <button
                    onClick={copyCode}
                    className="group flex items-center gap-4 rounded-2xl border border-terracotta/40 bg-terracotta-soft px-8 py-5 transition-transform duration-150 hover:scale-[1.02]"
                    aria-label={`Copy room code ${room.code}`}
                  >
                    <span className="display text-[40px] leading-none tracking-[0.18em] text-terracotta-deep md:text-[52px]">
                      {room.code}
                    </span>
                    {copied ? <Check className="h-5 w-5 text-sage" /> : <Copy className="h-5 w-5 text-terracotta-deep opacity-60 group-hover:opacity-100" />}
                  </button>
                  <p className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {room.players.length} player{room.players.length === 1 ? "" : "s"} ready · room holds up to 200
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[10.5px] text-text-faint">
                    <span className="chip">20 questions</span>
                    <span className="chip">10s each</span>
                    <span className="chip">≤1000 pts + streak bonus</span>
                    <span className="chip">badges for everyone</span>
                  </div>
                  {isHost ? (
                    <button onClick={startGame} disabled={busy} className="btn-primary !px-8 !py-3 text-[15px]">
                      <Play className="h-4 w-4" />
                      Start the battle
                    </button>
                  ) : (
                    <p className="rounded-lg border border-border bg-secondary px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                      waiting for the host to start…
                    </p>
                  )}
                </div>

                <PlayerGrid players={room.players} youId={youId} hostId={room.hostId} />
                <LeaveRow onLeave={leave} connected={connected} />
              </motion.div>
            )}

            {/* ── COUNTDOWN ── */}
            {phase === "countdown" && room && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="surface flex flex-col items-center gap-6 p-10 md:p-14"
              >
                <p className="kicker">get ready — {room.players.length} players</p>
                <motion.p
                  key={Math.ceil(countdownMs / 1000)}
                  initial={{ scale: 1.25, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="display text-[72px] leading-none text-terracotta-deep"
                >
                  {Math.max(Math.ceil(countdownMs / 1000), 1)}
                </motion.p>
                <div className="progress-track w-64">
                  <div
                    className="progress-fill"
                    style={{ width: `${(countdownMs / 3200) * 100}%`, transition: "width 0.15s linear" }}
                  />
                </div>
                <p className="font-mono text-[12px] text-muted-foreground">20 questions · 10 seconds each · speed = points</p>
              </motion.div>
            )}

            {/* ── QUESTION ── */}
            {phase === "question" && question && (
              <motion.div
                key={`q-${question.i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div className="surface p-6 md:p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-text-faint">
                      question {question.i + 1} / {question.total}
                    </span>
                    <span
                      className="flex items-center gap-1.5 font-mono text-[14px]"
                      style={{ color: secondsLeft <= 3 ? "var(--destructive)" : "var(--terracotta-deep)" }}
                    >
                      <Timer className="h-4 w-4" />
                      {secondsLeft}s
                    </span>
                  </div>
                  <div className="progress-track mb-5 h-2">
                    <div
                      className={`progress-fill ${secondsLeft <= 3 ? "progress-fill-sage" : ""}`}
                      style={{ width: `${remainingPct}%`, transition: "width 0.12s linear" }}
                    />
                  </div>
                  <p className="text-[16.5px] font-medium leading-snug text-foreground md:text-[18px]">
                    {question.prompt}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Answers">
                  {question.options.map((opt, i) => {
                    const isPicked = picked === i;
                    return (
                      <button
                        key={i}
                        role="radio"
                        aria-checked={isPicked}
                        disabled={picked !== null}
                        onClick={() => answer(i)}
                        className={`surface surface-hover flex min-h-[64px] items-center gap-3 !rounded-xl px-4 py-3.5 text-left text-[14px] transition-all duration-150 disabled:cursor-default ${
                          isPicked ? "!border-terracotta bg-terracotta-soft" : ""
                        }`}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[11px]"
                          style={
                            isPicked
                              ? { background: "var(--terracotta)", color: "#fff" }
                              : { background: "var(--secondary)", color: "var(--muted-foreground)" }
                          }
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center font-mono text-[10.5px] text-text-faint">
                  {picked !== null ? "answer locked — points scale with the clock" : "answer fast — faster = more points"}
                </p>
              </motion.div>
            )}

            {/* ── REVEAL ── */}
            {phase === "reveal" && qEnd && room && (
              <motion.div
                key={`reveal-${qEnd.i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                <div className="surface p-6 md:p-8">
                  <p className="kicker mb-3">question {qEnd.i + 1} — the answer</p>
                  {question && (
                    <p className="mb-4 text-[15px] leading-snug text-muted-foreground">
                      {question.prompt}
                    </p>
                  )}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {question?.options.map((opt, i) => {
                      const isAnswer = i === qEnd.correctIndex;
                      const isMine = picked === i;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px]"
                          style={{
                            borderColor: isAnswer ? "rgba(120,140,93,0.5)" : isMine ? "rgba(179,57,27,0.4)" : "var(--border)",
                            background: isAnswer ? "var(--sage-soft)" : isMine ? "rgba(179,57,27,0.06)" : "var(--card)",
                          }}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                          {opt}
                          {isAnswer && <Check className="ml-auto h-4 w-4 shrink-0 text-sage" />}
                        </div>
                      );
                    })}
                  </div>
                  <MyResult qEnd={qEnd} youId={youId} />
                  <p className="mt-4 rounded-lg border border-border bg-secondary/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-text-secondary">
                    {qEnd.explanation}
                  </p>
                </div>

                <div className="surface p-5 md:p-6">
                  <p className="kicker mb-4">standings — top 10</p>
                  <ScoreList rows={qEnd.scoreboard.slice(0, 10)} youId={youId} />
                  {myRow(qEnd.scoreboard) && (myRow(qEnd.scoreboard)!.rank > 10) && (
                    <div className="mt-3 border-t border-border pt-3">
                      <ScoreList rows={[myRow(qEnd.scoreboard)!]} youId={youId} />
                    </div>
                  )}
                  <p className="mt-3 font-mono text-[10.5px] text-text-faint">
                    next question in a moment… {qEnd.i + 1 < question?.total ? "" : "last one!"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── GAME OVER ── */}
            {phase === "over" && leaders && badges && room && (
              <motion.div
                key="over"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
              >
                <div className="surface p-6 md:p-8">
                  <p className="kicker mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-terracotta" />
                    final leaderboard — {leaders.length} player{leaders.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {leaders.slice(0, 3).map((row) => (
                      <div
                        key={row.id}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                          row.id === youId ? "border-terracotta/50 bg-terracotta-soft" : "border-border bg-secondary/40"
                        }`}
                      >
                        <span className="w-8 font-mono text-[16px] font-bold" style={{ color: row.rank === 1 ? "#d97757" : row.rank === 2 ? "#73726c" : "#c6613f" }}>
                          {row.rank === 1 ? "1st" : row.rank === 2 ? "2nd" : "3rd"}
                        </span>
                        <Avatar index={row.avatar} size={38} />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">{row.name}</span>
                        {row.id === youId && (
                          <span className="rounded-full bg-terracotta px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">you</span>
                        )}
                        <span className="font-mono text-[15px] font-semibold text-foreground">{row.score}</span>
                      </div>
                    ))}
                  </div>
                  {leaders.length > 3 && (
                    <div className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
                      {leaders.slice(3).map((row) => (
                        <div
                          key={row.id}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${row.id === youId ? "bg-terracotta-soft" : ""}`}
                        >
                          <span className="w-7 font-mono text-[11px] text-text-faint">{row.rank}.</span>
                          <Avatar index={row.avatar} size={26} />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{row.name}</span>
                          <span className="font-mono text-[12px] text-muted-foreground">{row.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <MyBadges badges={badges[youId ?? ""] ?? []} />

                <div className="surface p-5 md:p-6">
                  <p className="kicker mb-4">badges earned by the room</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {leaders.map((row) => (
                      <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3.5 py-2.5">
                        <Avatar index={row.avatar} size={26} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{row.name}</span>
                        <span className="flex flex-wrap justify-end gap-1">
                          {(badges[row.id] ?? []).slice(0, 4).map((b) => (
                            <BadgeChip key={b} code={b} />
                          ))}
                          {(badges[row.id] ?? []).length > 4 && (
                            <span className="font-mono text-[9.5px] text-text-faint">+{(badges[row.id] ?? []).length - 4}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isHost ? (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={playAgain} className="btn-primary !px-6 !py-3 text-[14px]">
                      <Swords className="h-4 w-4" />
                      Play again — same room
                    </button>
                    <button onClick={leave} className="btn-secondary !px-5 !py-3 text-[14px]">
                      <LogOut className="h-4 w-4" />
                      Leave
                    </button>
                  </div>
                ) : (
                  <p className="rounded-lg border border-border bg-secondary px-4 py-3 text-center font-mono text-[12px] text-muted-foreground">
                    host can start a rematch — or{" "}
                    <button onClick={leave} className="text-terracotta underline underline-offset-2">
                      leave the room
                    </button>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── subcomponents ──────────────────────────────────────────────────── */

function PlayerGrid({ players, youId, hostId }: { players: LobbyPlayer[]; youId: string | null; hostId: string | null }) {
  return (
    <div className="surface p-5 md:p-6">
      <p className="kicker mb-4">in the room</p>
      {players.length === 0 ? (
        <p className="font-mono text-[12px] text-text-faint">nobody here yet…</p>
      ) : (
        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                p.id === youId ? "border-terracotta/50 bg-terracotta-soft" : "border-border bg-secondary/40"
              }`}
            >
              <Avatar index={p.avatar} size={30} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{p.name}</span>
              {p.id === hostId && <Crown className="h-3.5 w-3.5 shrink-0 text-terracotta" />}
              {p.id === youId && (
                <span className="rounded-full bg-terracotta px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-white">you</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreList({ rows, youId }: { rows: ScoreRow[]; youId: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div
          key={r.id}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${r.id === youId ? "border border-terracotta/40 bg-terracotta-soft" : ""}`}
        >
          <span className="w-6 text-right font-mono text-[12px] text-text-faint">{r.rank}</span>
          <Avatar index={r.avatar} size={26} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{r.name}</span>
          {r.id === youId && <span className="font-mono text-[9.5px] uppercase tracking-wider text-terracotta-deep">you</span>}
          <span className="font-mono text-[13px] font-semibold text-foreground">{r.score}</span>
        </div>
      ))}
    </div>
  );
}

function MyResult({ qEnd, youId }: { qEnd: QEndPayload; youId: string | null }) {
  const mine = qEnd.results.find((r) => r.id === youId);
  if (!mine) return null;
  const correctRow = qEnd.scoreboard.find((r) => r.id === youId);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span
        className="flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[12.5px]"
        style={
          mine.correct
            ? { borderColor: "rgba(120,140,93,0.5)", background: "var(--sage-soft)", color: "var(--sage)" }
            : { borderColor: "rgba(179,57,27,0.4)", background: "rgba(179,57,27,0.06)", color: "var(--destructive)" }
        }
      >
        {mine.correct ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        {mine.correct ? `+${mine.pts} points${mine.ms != null ? ` · ${(mine.ms / 1000).toFixed(1)}s` : ""}` : "missed this one"}
      </span>
      {correctRow && (
        <span className="font-mono text-[12px] text-muted-foreground">
          you are #{correctRow.rank} · {correctRow.score} pts
        </span>
      )}
    </div>
  );
}

function MyBadges({ badges }: { badges: BadgeCode[] }) {
  if (badges.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-5 md:p-6"
      style={{ borderColor: "rgba(217,119,87,0.4)", background: "rgba(217,119,87,0.06)" }}
    >
      <p className="kicker mb-4">your badges — {badges.length} earned</p>
      <div className="flex flex-wrap gap-2.5">
        {badges.map((b) => (
          <BadgeChip key={b} code={b} size="lg" />
        ))}
      </div>
    </div>
  );
}

function LeaveRow({ onLeave, connected }: { onLeave: () => void; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="flex items-center gap-2 font-mono text-[11px] text-text-faint">
        <span
          className="led h-2 w-2 rounded-full"
          style={{ background: connected ? "var(--sage)" : "var(--destructive)" }}
        />
        {connected ? "connected to battle server" : "reconnecting…"}
      </span>
      <button onClick={onLeave} className="flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground transition-colors hover:text-destructive">
        <LogOut className="h-3.5 w-3.5" />
        leave
      </button>
    </div>
  );
}
