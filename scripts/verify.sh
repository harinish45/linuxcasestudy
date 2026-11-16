#!/bin/bash
# Verification round 2 — fixed selectors, lesson persistence, mobile overflow.
cd /home/z/my-project
mkdir -p shots
AB="agent-browser"

# ── 1. Ensure dev server ────────────────────────────────────────────────
if ! curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
  echo "starting dev server..."
  setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
  for i in $(seq 1 90); do
    sleep 1
    curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ && break
  done
fi
curl -s -o /dev/null --max-time 30 http://127.0.0.1:3000/ && echo "server: UP" || { echo "server: DOWN"; exit 1; }

$AB set viewport 1440 900
$AB open http://127.0.0.1:3000/
$AB wait --load networkidle 2>/dev/null
$AB eval "localStorage.clear(); sessionStorage.setItem('clu-boot-v1','1'); 'cleared'"
$AB reload
$AB wait --load networkidle 2>/dev/null
sleep 1

# ── 2. Timing: LVM via dashboard row ────────────────────────────────────
echo "=== timing LVM (dashboard row) ==="
$AB eval "window.__t0=Date.now(); 'armed'"
$AB eval "document.querySelector('a[href=\"/courses/lvm\"]').click(); 'clicked'"
$AB wait --url "/courses/lvm"
$AB wait --text "0 of 13"
echo "click→ready ms: $($AB eval "Date.now() - window.__t0")"
$AB screenshot shots/02-lvm-modules.png

# ── 3. Tick a lesson, verify persistence ────────────────────────────────
TICK='Array.from(document.querySelectorAll("button[aria-pressed]")).filter(function(b){var l=b.getAttribute("aria-label")||"";return l.indexOf("Mark ")===0})[0].click(); "ticked"'
$AB eval "$TICK"
sleep 0.5
echo "store: $($AB storage local clu-progress-v1 | head -c 260)"
$AB reload
$AB wait --load networkidle 2>/dev/null
sleep 1
echo "summary after reload: $($AB eval 'document.body.innerText.match(/[01] of 13 lessons done/)?.[0] || "MISSING"')"
$AB screenshot shots/03-lvm-persisted.png

# ── 4. Timing: NFS + Containers via sidebar links ───────────────────────
echo "=== timing NFS (sidebar) ==="
$AB eval "window.__t0=Date.now(); 'armed'"
$AB eval "document.querySelector('aside a[href=\"/courses/nfs\"]').click(); 'clicked'"
$AB wait --url "/courses/nfs"
$AB wait --text "0 of 13"
echo "click→ready ms: $($AB eval "Date.now() - window.__t0")"
$AB screenshot shots/04-nfs.png

echo "=== timing Containers (sidebar) ==="
$AB eval "window.__t0=Date.now(); 'armed'"
$AB eval "document.querySelector('aside a[href=\"/courses/containers\"]').click(); 'clicked'"
$AB wait --url "/courses/containers"
$AB wait --text "0 of 13"
echo "click→ready ms: $($AB eval "Date.now() - window.__t0")"
$AB screenshot shots/05-containers.png

# ── 5. Untick (restore clean state) ─────────────────────────────────────
$AB eval "$TICK"
sleep 0.3

# ── 6. Boot intro with new logo ─────────────────────────────────────────
$AB eval "sessionStorage.removeItem('clu-boot-v1'); 'ok'"
$AB reload
$AB wait --load networkidle 2>/dev/null
sleep 1.4
$AB screenshot shots/06-boot-intro.png
$AB press Escape; $AB press Enter; sleep 0.6

# ── 7. Mobile ────────────────────────────────────────────────────────────
$AB set viewport 390 844
for p in "/" "/practice" "/courses/containers" "/courses/lvm"; do
  $AB open "http://127.0.0.1:3000$p" > /dev/null 2>&1
  $AB wait --load networkidle 2>/dev/null
  sleep 1.5
  echo "mobile $p scrollWidth: $($AB eval "document.documentElement.scrollWidth")"
done
$AB screenshot shots/07-mobile-lvm.png

# ── 8. Errors ────────────────────────────────────────────────────────────
$AB errors > shots/errors.txt 2>&1
echo "=== page errors ==="; cat shots/errors.txt
$AB close
echo "DONE"
