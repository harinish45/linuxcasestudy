/* Load test: 200 concurrent players in ONE room (1 host + 199 joiners).
   Measures: create/join latency, question delivery completeness, answers,
   final leaderboard integrity. Run: node scripts/loadtest-200.mjs */
import { io } from "socket.io-client";

const URL = "http://127.0.0.1:3003";
const N = 200; // total players incl. host

let created = 0;
let joinedOk = 0;
const joinTimes = [];
const qDelivery = [];
let answeredCount = 0;
let overCount = 0;
let firstQAt = 0;
let q1BroadcastSpread = null;

const sockets = [];

function makePlayer(i) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const socket = io(URL, { transports: ["websocket"], forceNew: true, timeout: 20000 });
    sockets.push(socket);
    const p = { socket, qSeen: 0, joined: i === 0, name: `p${String(i).padStart(3, "0")}`, id: null };
    socket.on("connect", () => {
      if (i > 0) { resolve(p); return; } // joiners skip create
      socket.timeout(15000).emit("room:create", { name: p.name, avatar: i % 12 }, (err, res) => {
        if (err || !res?.ok) { resolve(p); return; }
        p.createMs = Date.now() - t0;
        p.id = res.you;
        p.code = res.code;
        p.joined = true;
        created++;
        resolve(p);
      });
    });
    socket.on("connect_error", () => resolve(p));
    socket.on("q:new", (q) => {
      p.qSeen++;
      if (q.i === 0) {
        if (!firstQAt) firstQAt = Date.now();
        else if (q1BroadcastSpread == null) q1BroadcastSpread = Date.now() - firstQAt;
        q1BroadcastSpread = Math.max(q1BroadcastSpread ?? 0, Date.now() - firstQAt);
      }
      if (p.qSeen <= 20) {
        setTimeout(() => {
          socket.emit("answer", { choice: Math.floor(Math.random() * 4) });
          answeredCount++;
        }, 300 + Math.random() * 7700);
      }
    });
    socket.on("game:over", (e) => {
      overCount++;
      if (e.leaderboard?.length !== Math.min(N, 200)) p.badBoard = true;
    });
  });
}

console.log(`spawning ${N} connections…`);
const t0 = Date.now();
const players = await Promise.all(Array.from({ length: N }, (_, i) => makePlayer(i)));
console.log(`connected: ${N}/${N} in ${Date.now() - t0}ms; host create=${players[0].createMs}ms`);

const host = players[0];
const code = host.code;
console.log(`room ${code} — ${N - 1} players will join it`);

// host stays; everyone else joins the same room
const jt0 = Date.now();
await Promise.all(
  players.map((p) => new Promise((resolve) => {
    if (p === host || !p.socket.connected) { resolve(); return; }
    const t = Date.now();
    p.socket.timeout(20000).emit("room:join", { code, name: p.name, avatar: 1 }, (err, res) => {
      if (!err && res?.ok) { joinedOk++; joinTimes.push(Date.now() - t); }
      resolve();
    });
  }))
);
console.log(`joined ${joinedOk}/${N - 1} in ${Date.now() - jt0}ms; join p50=${joinTimes.sort((a,b)=>a-b)[Math.floor(joinTimes.length/2)]}ms p95=${joinTimes[Math.floor(joinTimes.length*0.95)]}ms`);

await new Promise((r) => setTimeout(r, 1000));
await new Promise((resolve, reject) => {
  host.socket.timeout(10000).emit("game:start", {}, (err, res) => (err || !res?.ok ? reject(err ?? new Error("start failed")) : resolve()));
});
console.log("game started with", joinedOk + 1, "players — expect ~285s…");

const t1 = Date.now();
await new Promise((resolve) => {
  const t = setInterval(() => {
    if (overCount >= Math.min(created, N)) { clearInterval(t); resolve(); }
  }, 1000);
  setTimeout(() => { clearInterval(t); resolve(); }, 330_000);
});

const sawAll = players.filter((p) => p.socket.connected && p.qSeen >= 20).length;
const sawNone = players.filter((p) => p.socket.connected && p.qSeen === 0).length;
console.log("\n── scale results ──");
console.log(`players who saw all 20 questions: ${sawAll}/${joinedOk + 1}`);
console.log(`players who saw none: ${sawNone}`);
console.log(`answers emitted: ${answeredCount}`);
console.log(`game:over received by: ${overCount}`);
console.log(`Q1 broadcast spread (slowest - fastest receiver): ${q1BroadcastSpread ?? "?"}ms`);
console.log(`game phase wall time: ${Math.round((Date.now() - t1) / 1000)}s`);
sockets.forEach((s) => s.disconnect());
process.exit(0);
