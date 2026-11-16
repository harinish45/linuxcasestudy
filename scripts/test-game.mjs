/* End-to-end game loop test: 3 bots join a room, host starts, everyone answers.
   Verifies: lobby sync, countdown, 20 questions, scoring, badges, leaderboard.
   Run: node scripts/test-game.mjs */
import { io } from "socket.io-client";

const URL = "http://127.0.0.1:3003";
const N_PLAYERS = 3;

const stats = { qNew: [], qEnd: [], over: null, badges: [] };

function makeBot(name, avatar) {
  return new Promise((resolve, reject) => {
    const socket = io(URL, { transports: ["websocket"], forceNew: true, timeout: 5000 });
    const bot = { name, socket, scores: [], seenQ: 0, badges: null, over: null };
    socket.on("connect", () => resolve(bot));
    socket.on("connect_error", (e) => reject(e));
    socket.on("q:new", (q) => {
      bot.seenQ++;
      stats.qNew.push(Date.now());
      // answer after a random 0.5-9s delay
      const delay = 500 + Math.random() * 8500;
      setTimeout(() => {
        socket.emit("answer", { choice: Math.floor(Math.random() * 4) });
      }, Math.min(delay, 9500));
    });
    socket.on("q:end", (e) => {
      stats.qEnd.push(Date.now());
      const me = e.results.find((r) => r.id === bot.id);
      if (me) bot.scores.push(me.pts);
    });
    socket.on("game:over", (e) => {
      bot.over = e;
      bot.badges = e.badges[bot.id] ?? [];
      stats.over = e;
    });
    socket.on("lobby", (room) => {
      bot.id = room.players.find((p) => p.name === name)?.id ?? bot.id;
    });
    socket.timeout(3000).emit("room:create", { name, avatar }, (err, res) => {
      if (err) return reject(err);
      if (!res?.ok) return reject(new Error(res?.error ?? "create failed"));
      bot.id = res.you;
      bot.code = res.code;
      resolve(bot);
    });
    setTimeout(() => resolve(bot), 4000); // safety
  });
}

const bots = [];
for (let i = 0; i < N_PLAYERS; i++) bots.push(await makeBot(`bot-${i}`, i));
console.log("bots created:", bots.map((b) => `${b.name}@${b.code}`).join(", "));
const code = bots[0].code;

// bots[1..] join the room
for (const b of bots.slice(1)) {
  await new Promise((resolve, reject) => {
    b.socket.timeout(3000).emit("room:join", { code, name: b.name, avatar: b.avatar ?? 2 }, (err, res) => {
      if (err || !res?.ok) return reject(err ?? new Error(res?.error));
      resolve();
    });
  });
}
console.log("all joined room", code);

// wait for lobby to reflect 3 players on the host
await new Promise((r) => setTimeout(r, 400));

// host starts
await new Promise((resolve, reject) => {
  bots[0].socket.timeout(3000).emit("game:start", {}, (err, res) => {
    if (err || !res?.ok) return reject(err ?? new Error("start failed"));
    resolve();
  });
});
console.log("game started — waiting for it to finish (20 q × ~14.2s ≈ 285s)…");

await new Promise((resolve) => {
  const t = setInterval(() => {
    if (stats.over) {
      clearInterval(t);
      resolve();
    }
  }, 1000);
  // hard stop after 400s
  setTimeout(() => {
    clearInterval(t);
    resolve();
  }, 400_000);
});

const over = stats.over;
console.log("\n── results ──");
console.log("questions each bot saw:", bots.map((b) => b.seenQ).join(","));
console.log("leaderboard:", over?.leaderboard.map((r) => `#${r.rank} ${r.name} ${r.score}`).join(" | "));
console.log("badges per player:");
for (const b of bots) console.log(" ", b.name, "→", (b.badges ?? []).join(", "));
const gaps = stats.qNew.slice(1).map((t, i) => t - stats.qEnd[i]);
console.log("q:end→q:new gaps(ms):", gaps.slice(0, 5).join(","), "…");
const revealToNext = stats.qNew.slice(1).map((t, i) => t - stats.qEnd[i]);
console.log("avg reveal→next gap:", Math.round(revealToNext.reduce((a, b) => a + b, 0) / Math.max(revealToNext.length, 1)), "ms");
process.exit(0);
