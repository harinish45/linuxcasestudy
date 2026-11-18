/**
 * Quiz Battle — real-time multiplayer quiz service.
 *
 * Design goals (200+ concurrent players per room):
 *  - server-authoritative timing (endsAt timestamps, no client trust)
 *  - one broadcast per room event (no per-player loops except final badges)
 *  - in-memory rooms, cleaned up on empty (TTL) — zero leak growth
 *  - first answer wins; answers after the window are ignored
 *
 * Scoring: correct answer = 500 + 500 × (remaining / 10s), streak bonus
 * +50 × (streak-1) capped at +200 → max 1200 per question.
 */

import { Server, type Socket } from "socket.io";
import bank from "./bank.json";

const PORT = 3003;
const QUESTION_COUNT = 20;
const QUESTION_MS = 10_000;
const REVEAL_MS = 4_200;
const COUNTDOWN_MS = 3_200;
const MAX_PLAYERS = 200;
const MAX_ROOMS = 80;
const ROOM_TTL_MS = 30 * 60_000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1 confusables

interface Q {
  id: string;
  topic: string;
  difficulty: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface Player {
  sid: string;
  id: string;
  name: string;
  avatar: number;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  fastestMs: number | null;
  answered: number;
  scoreAtHalf: number;
}

interface AnswerRec {
  choice: number;
  ms: number;
  pts: number;
  correct: boolean;
}

type RoomStatus = "lobby" | "countdown" | "question" | "reveal" | "over";

interface Room {
  code: string;
  hostSid: string;
  players: Map<string, Player>;
  status: RoomStatus;
  qIndex: number;
  questions: Q[];
  answers: Map<string, AnswerRec>;
  qEndsAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
  emptyTimer: ReturnType<typeof setTimeout> | null;
}

const io = new Server(PORT, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60_000,
  pingInterval: 25_000,
});

const rooms = new Map<string, Room>();
const sidToRoom = new Map<string, string>(); // socket id → room code

/* ── helpers ─────────────────────────────────────────────────────────── */

const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

const cleanName = (raw: unknown): string => {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  return s.slice(0, 18);
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickQuestions = (count: number): Q[] => {
  // balance across the three topics so every game feels mixed
  const byTopic = new Map<string, Q[]>();
  for (const q of bank as unknown as Q[]) {
    const arr = byTopic.get(q.topic) ?? [];
    arr.push(q);
    byTopic.set(q.topic, arr);
  }
  const perTopic = Math.ceil(count / byTopic.size);
  const mixed = shuffle(
    [...byTopic.values()].flatMap((arr) => shuffle(arr).slice(0, perTopic))
  );
  return mixed.slice(0, count);
};

const publicPlayers = (room: Room) =>
  [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
  }));

const ranked = (room: Room) =>
  [...room.players.values()].sort((a, b) => b.score - a.score);

const lobbyPayload = (room: Room) => ({
  code: room.code,
  hostId: room.players.get(room.hostSid)?.id ?? null,
  players: publicPlayers(room),
  settings: { questionCount: QUESTION_COUNT, questionMs: QUESTION_MS },
});

const scoreboardPayload = (room: Room) =>
  ranked(room).map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
  }));

const clearTimer = (room: Room) => {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
};

const scheduleEmptyCleanup = (room: Room) => {
  if (room.players.size > 0) return;
  if (room.emptyTimer) clearTimeout(room.emptyTimer);
  room.emptyTimer = setTimeout(() => {
    if (rooms.get(room.code) === room && room.players.size === 0) {
      clearTimer(room);
      rooms.delete(room.code);
    }
  }, 5_000);
};

const leaveRoom = (socket: Socket) => {
  const code = sidToRoom.get(socket.id);
  if (!code) return;
  const room = rooms.get(code);
  sidToRoom.delete(socket.id);
  socket.leave(code);
  if (!room) return;
  const p = room.players.get(socket.id);
  room.players.delete(socket.id);
  if (p) io.to(code).emit("player:left", { id: p.id, name: p.name });
  // host migration
  if (room.hostSid === socket.id && room.players.size > 0) {
    room.hostSid = room.players.keys().next().value as string;
  }
  if (room.status === "lobby") io.to(code).emit("lobby", lobbyPayload(room));
  scheduleEmptyCleanup(room);
};

/* ── badges ──────────────────────────────────────────────────────────── */

type BadgeCode =
  | "crown" | "silver" | "bronze" | "perfect" | "sharpshooter" | "speed_demon"
  | "streak_master" | "iron_focus" | "comeback" | "fastest_finger"
  | "veteran" | "contender" | "challenger" | "participant";

function computeBadges(room: Room, board: Player[]): Map<string, BadgeCode[]> {
  const badges = new Map<string, BadgeCode[]>();
  const n = board.length;
  const fastestOverall = board.reduce<number | null>(
    (acc, p) => (p.fastestMs != null && (acc == null || p.fastestMs < acc) ? p.fastestMs : acc),
    null
  );
  board.forEach((p, i) => {
    const b: BadgeCode[] = [];
    const rank = i + 1;
    if (n >= 2 && rank === 1) b.push("crown");
    if (n >= 3 && rank === 2) b.push("silver");
    if (n >= 4 && rank === 3) b.push("bronze");
    if (p.answered === QUESTION_COUNT && p.correct === QUESTION_COUNT) b.push("perfect");
    if (p.answered >= 5 && p.correct / Math.max(p.answered, 1) >= 0.8) b.push("sharpshooter");
    if (p.correct >= 3 && p.fastestMs != null) {
      // average correct speed proxy: fastestMs stands in for reflex quality
      if (p.fastestMs <= 4_500) b.push("speed_demon");
    }
    if (p.bestStreak >= 5) b.push("streak_master");
    if (p.answered === QUESTION_COUNT) b.push("iron_focus");
    if (fastestOverall != null && p.fastestMs === fastestOverall && fastestOverall < 1_800) {
      b.push("fastest_finger");
    }
    if (room.status === "over" && p.score > p.scoreAtHalf * 1.4 && p.answered > 0) b.push("comeback");
    // participation tiers — EVERY player gets exactly one
    if (n >= 4) {
      if (rank <= Math.ceil(n / 4)) b.push("veteran");
      else if (rank <= Math.floor((3 * n) / 4)) b.push("contender");
      else b.push("challenger");
    }
    b.push("participant");
    badges.set(p.id, [...new Set(b)]);
  });
  return badges;
}

/* ── game flow ───────────────────────────────────────────────────────── */

function startCountdown(room: Room) {
  room.status = "countdown";
  io.to(room.code).emit("game:countdown", { ms: COUNTDOWN_MS, total: QUESTION_COUNT });
  room.timer = setTimeout(() => nextQuestion(room), COUNTDOWN_MS);
}

function nextQuestion(room: Room) {
  clearTimer(room);
  if (room.players.size === 0) {
    room.status = "over";
    return;
  }
  const q = room.questions[room.qIndex];
  if (!q) {
    finishGame(room);
    return;
  }
  room.status = "question";
  room.answers.clear();
  room.qEndsAt = Date.now() + QUESTION_MS;
  io.to(room.code).emit("q:new", {
    i: room.qIndex,
    total: room.questions.length,
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    endsAt: room.qEndsAt,
    now: Date.now(),
    durMs: QUESTION_MS,
  });
  room.timer = setTimeout(() => revealAnswer(room), QUESTION_MS + 250); // small grace for network
}

function revealAnswer(room: Room) {
  clearTimer(room);
  if (room.status !== "question") return;
  const q = room.questions[room.qIndex];
  const now = Date.now();
  const halfIndex = Math.floor(room.questions.length / 2);

  for (const p of room.players.values()) {
    const rec = room.answers.get(p.id);
    const remaining = Math.max(room.qEndsAt - now, 0);
    if (rec) {
      const base = rec.correct ? 500 + Math.round((500 * remaining) / QUESTION_MS) : 0;
      const streakBonus = rec.correct ? 50 * Math.min(Math.max(p.streak - 1, 0), 4) : 0;
      rec.pts = base + streakBonus;
      p.score += rec.pts;
      if (room.qIndex === halfIndex - 1) p.scoreAtHalf = p.score;
    } else {
      p.streak = 0;
    }
  }

  room.status = "reveal";
  const results = [...room.players.values()].map((p) => {
    const rec = room.answers.get(p.id);
    return rec
      ? { id: p.id, correct: rec.correct, pts: rec.pts, ms: rec.ms }
      : { id: p.id, correct: false, pts: 0, ms: null };
  });
  io.to(room.code).emit("q:end", {
    i: room.qIndex,
    correctIndex: q.answerIndex,
    explanation: q.explanation,
    results,
    scoreboard: scoreboardPayload(room),
  });

  room.qIndex += 1;
  room.timer = setTimeout(() => nextQuestion(room), REVEAL_MS);
}

function finishGame(room: Room) {
  clearTimer(room);
  room.status = "over";
  const board = ranked(room);
  const badges = computeBadges(room, board);
  io.to(room.code).emit("game:over", {
    leaderboard: board.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      correct: p.correct,
      answered: p.answered,
      bestStreak: p.bestStreak,
      fastestMs: p.fastestMs,
    })),
    badges: Object.fromEntries(badges),
    total: room.questions.length,
  });
}

/* ── socket wiring ───────────────────────────────────────────────────── */

io.on("connection", (socket: Socket) => {
  socket.on("room:create", (payload: { name?: string; avatar?: number }, cb?: (r: unknown) => void) => {
    const name = cleanName(payload?.name);
    const avatar = Math.max(0, Math.min(Number(payload?.avatar ?? 0) || 0, 11));
    if (!name) return cb?.({ ok: false, error: "name required" });
    if (rooms.size >= MAX_ROOMS) return cb?.({ ok: false, error: "server full — try again soon" });
    // a socket plays in exactly ONE room — leave any previous one first
    leaveRoom(socket);
    let code = makeCode();
    let guard = 0;
    while (rooms.has(code) && guard++ < 50) code = makeCode();
    const room: Room = {
      code,
      hostSid: socket.id,
      players: new Map(),
      status: "lobby",
      qIndex: 0,
      questions: [],
      answers: new Map(),
      qEndsAt: 0,
      timer: null,
      createdAt: Date.now(),
      emptyTimer: null,
    };
    rooms.set(code, room);
    socket.join(code);
    sidToRoom.set(socket.id, code);
    room.players.set(socket.id, {
      sid: socket.id,
      id: socket.id.slice(0, 8),
      name,
      avatar,
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      fastestMs: null,
      answered: 0,
      scoreAtHalf: 0,
    });
    cb?.({ ok: true, code, you: room.players.get(socket.id)!.id, room: lobbyPayload(room) });
    io.to(code).emit("lobby", lobbyPayload(room));
  });

  socket.on("room:join", (payload: { code?: string; name?: string; avatar?: number }, cb?: (r: unknown) => void) => {
    const name = cleanName(payload?.name);
    const avatar = Math.max(0, Math.min(Number(payload?.avatar ?? 0) || 0, 11));
    const code = String(payload?.code ?? "").trim().toUpperCase();
    if (!name) return cb?.({ ok: false, error: "name required" });
    leaveRoom(socket); // one room per socket
    const room = rooms.get(code);
    if (!room) return cb?.({ ok: false, error: "room not found — check the code" });
    if (room.players.size >= MAX_PLAYERS) return cb?.({ ok: false, error: "room full (200 players)" });
    if (room.status !== "lobby" && room.status !== "over")
      return cb?.({ ok: false, error: "game already running — wait for it to finish" });
    // duplicate name → disambiguate
    let finalName = name;
    const names = new Set([...room.players.values()].map((p) => p.name.toLowerCase()));
    let dup = 2;
    while (names.has(finalName.toLowerCase())) finalName = `${name.slice(0, 15)} ${dup++}`;
    socket.join(code);
    sidToRoom.set(socket.id, code);
    room.players.set(socket.id, {
      sid: socket.id,
      id: socket.id.slice(0, 8),
      name: finalName,
      avatar,
      score: room.status === "over" ? 0 : 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      fastestMs: null,
      answered: 0,
      scoreAtHalf: 0,
    });
    cb?.({ ok: true, code, you: room.players.get(socket.id)!.id, room: lobbyPayload(room) });
    io.to(code).emit("lobby", lobbyPayload(room));
    socket.emit("toast", { message: `Joined ${code} — say hi to ${room.players.size} players` });
  });

  socket.on("game:start", (_, cb?: (r: unknown) => void) => {
    const code = sidToRoom.get(socket.id);
    const room = code ? rooms.get(code) : undefined;
    if (!room || room.hostSid !== socket.id) return cb?.({ ok: false, error: "only the host can start" });
    if (room.status !== "lobby" && room.status !== "over") return cb?.({ ok: false });
    room.questions = pickQuestions(QUESTION_COUNT);
    room.qIndex = 0;
    for (const p of room.players.values()) {
      p.score = 0;
      p.correct = 0;
      p.wrong = 0;
      p.streak = 0;
      p.bestStreak = 0;
      p.fastestMs = null;
      p.answered = 0;
      p.scoreAtHalf = 0;
    }
    cb?.({ ok: true });
    startCountdown(room);
  });

  socket.on("game:again", (_, cb?: (r: unknown) => void) => {
    const code = sidToRoom.get(socket.id);
    const room = code ? rooms.get(code) : undefined;
    if (!room || room.hostSid !== socket.id) return cb?.({ ok: false });
    room.status = "lobby";
    room.qIndex = 0;
    room.questions = [];
    for (const p of room.players.values()) {
      p.score = 0;
      p.correct = 0;
      p.wrong = 0;
      p.streak = 0;
      p.bestStreak = 0;
      p.fastestMs = null;
      p.answered = 0;
      p.scoreAtHalf = 0;
    }
    cb?.({ ok: true });
    io.to(code).emit("lobby", lobbyPayload(room));
  });

  socket.on("answer", (payload: { choice?: number }) => {
    const code = sidToRoom.get(socket.id);
    const room = code ? rooms.get(code) : undefined;
    if (!room || room.status !== "question") return;
    const p = room.players.get(socket.id);
    if (!p || room.answers.has(p.id)) return;
    const choice = Number(payload?.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
    const now = Date.now();
    if (now > room.qEndsAt + 250) return; // too late
    const q = room.questions[room.qIndex];
    const ms = Math.max(now - (room.qEndsAt - QUESTION_MS), 0);
    const correct = choice === q.answerIndex;
    room.answers.set(p.id, { choice, ms, pts: 0, correct });
    p.answered += 1;
    if (correct) {
      p.correct += 1;
      p.streak += 1;
      p.bestStreak = Math.max(p.bestStreak, p.streak);
      if (p.fastestMs == null || ms < p.fastestMs) p.fastestMs = ms;
    } else {
      p.wrong += 1;
      p.streak = 0;
    }
    // everyone answered → reveal early
    if (room.answers.size >= room.players.size) {
      clearTimer(room);
      room.timer = setTimeout(() => revealAnswer(room), 350);
    }
  });

  socket.on("leave", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));
});

/* ── janitor: kill long-idle rooms regardless of occupancy ───────────── */
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS && room.status !== "question") {
      clearTimer(room);
      io.to(code).emit("room:closed", { reason: "expired" });
      io.in(code).socketsLeave(code);
      for (const sid of [...sidToRoom.entries()].filter(([, c]) => c === code).map(([s]) => s)) {
        sidToRoom.delete(sid);
      }
      rooms.delete(code);
    }
  }
}, 60_000);

console.log(`quiz-service listening on :${PORT} — bank: ${(bank as unknown[]).length} questions`);
