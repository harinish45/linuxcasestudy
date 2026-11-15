/** Minimal fuzzy matcher: returns a score (higher = better) or -1 when no match. */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 1000 - t.indexOf(q) * 2;

  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak += 1;
      score += 5 + streak * 2;
      qi += 1;
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : -1;
}
