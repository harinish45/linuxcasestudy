/* Assembles the question bank: expands templates, dedups, normalises options,
   slices to exactly N per topic, writes:
     - src/data/bank.json          (full bank for the practice arena)
     - mini-services/quiz-service/bank.json  (quiz-only slim bank for the game)
   Run: node scripts/gen-bank.mjs  (or bun run it) */

import fs from "node:fs";
import path from "node:path";
import { templates as lvmT } from "./bank-lvm.mjs";
import { templates as lvmX, extraTemplates as lvmE, lastTemplates as lvmZ } from "./bank-lvm-extra.mjs";
import { templates as nfsT } from "./bank-nfs.mjs";
import { templates as nfsX } from "./bank-nfs-extra.mjs";
import { templates as nfsY, moreNfs as nfsM } from "./bank-nfs-extra2.mjs";
import { templates as dockerT } from "./bank-docker.mjs";
import { templates as dockerX } from "./bank-docker-extra.mjs";
import { templates as dockerY, lastDocker as dockerZ, finalDocker as dockerF } from "./bank-docker-extra2.mjs";

const PER_TOPIC = 200;
const root = path.resolve(import.meta.dirname, "..");

/* deterministic PRNG so output is stable across runs */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const XP = { easy: 10, medium: 20, hard: 30 };

function build(raw, topic) {
  const out = [];
  const seen = new Set();
  for (const tpl of raw) {
    for (const q of tpl()) {
      const key = `${q.title}::${q.prompt}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let options = q.options;
      let answerIndex = q.answerIndex;
      if (options) {
        // locate the correct text, then build a 4-option set:
        // correct answer + 3 distinct distractors, deterministically shuffled.
        const correct = q._correctText ?? options[answerIndex];
        if (!correct) throw new Error(`No correct option for: ${key}`);
        const pool = [...new Set(options.filter((t) => t !== correct))];
        const rand = mulberry32(hashStr(key));
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const four = [correct, ...pool.slice(0, 3)];
        for (let i = four.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [four[i], four[j]] = [four[j], four[i]];
        }
        options = four;
        answerIndex = four.indexOf(correct);
      }

      out.push({
        id: `${topic}-b${String(out.length + 1).padStart(3, "0")}`,
        topic,
        difficulty: q.difficulty,
        type: q.type,
        title: q.title,
        prompt: q.prompt,
        ...(options ? { options, answerIndex } : {}),
        ...(q.accepted ? { accepted: q.accepted } : {}),
        hint: q.hint,
        explanation: q.explanation,
        practice: q.practice ?? "",
        tag: q.tag ?? topic,
        xp: XP[q.difficulty],
      });
    }
  }
  return out;
}

const topics = {
  lvm: [...lvmT, ...lvmX, ...lvmE, ...lvmZ],
  nfs: [...nfsT, ...nfsX, ...nfsY, ...nfsM],
  docker: [...dockerT, ...dockerX, ...dockerY, ...dockerZ, ...dockerF],
};

const bank = {};
for (const [topic, tpl] of Object.entries(topics)) {
  const all = build(tpl, topic);
  if (all.length < PER_TOPIC) throw new Error(`${topic}: only ${all.length} questions, need ${PER_TOPIC}`);
  bank[topic] = all.slice(0, PER_TOPIC);
}

// interleave difficulty ordering per topic: easy → medium → hard groups stay, but
// shuffle within the whole list so practice feels varied (deterministic).
for (const topic of Object.keys(bank)) {
  const rand = mulberry32(hashStr(topic));
  const arr = bank[topic];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const flat = [...bank.lvm, ...bank.nfs, ...bank.docker];

/* full bank for the app */
fs.writeFileSync(path.join(root, "src/data/bank.json"), JSON.stringify(flat, null, 1));

/* slim quiz-only bank for the game service (MCQ, short prompts) */
const slim = flat
  .filter((q) => q.type === "quiz" && q.prompt.length < 210 && q.options.every((o) => o.length < 130))
  .map((q) => ({
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    answerIndex: q.answerIndex,
    explanation: q.explanation,
  }));
fs.mkdirSync(path.join(root, "mini-services/quiz-service"), { recursive: true });
fs.writeFileSync(path.join(root, "mini-services/quiz-service/bank.json"), JSON.stringify(slim, null, 1));

const stat = (arr) => {
  const byDiff = { easy: 0, medium: 0, hard: 0 };
  const byType = { quiz: 0, command: 0 };
  arr.forEach((q) => {
    byDiff[q.difficulty]++;
    byType[q.type]++;
  });
  return byDiff;
};

console.log("full:", flat.length, "| quiz-only:", slim.length);
for (const t of Object.keys(bank)) console.log(t, bank[t].length, JSON.stringify(stat(bank[t])));
console.log("with practice command:", flat.filter((q) => q.practice).length);
const diffAll = { easy: 0, medium: 0, hard: 0 };
flat.forEach((q) => diffAll[q.difficulty]++);
console.log("difficulty:", JSON.stringify(diffAll));
