#!/bin/bash
cd /home/z/my-project
AB="agent-browser"
if ! curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
  setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
  for i in $(seq 1 90); do sleep 1; curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ && break; done
fi
$AB set viewport 1440 900
$AB open http://127.0.0.1:3000/courses/lvm
$AB wait --load networkidle 2>/dev/null
sleep 1.5
$AB eval "localStorage.removeItem('clu-progress-v1'); 'reset'"
$AB reload
$AB wait --load networkidle 2>/dev/null
sleep 1.5
echo "tick lesson 1..."
$AB eval '(Array.from(document.querySelectorAll("button[aria-pressed]")).filter(function(b){var l=b.getAttribute("aria-label")||"";return l.indexOf("Mark ")===0})[0]).click(); "ok"'
sleep 0.6
echo "store now: $($AB storage local clu-progress-v1 | head -c 220)"
$AB reload
for i in 1 2 3 4 5 6 7 8; do
  R=$($AB eval '(document.body.innerText.match(/\d+ of 13 lessons done/)?.[0] || "pending") + " | m1=" + (document.body.innerText.match(/1\/3 · ~8m/)?.[0] || "?")')
  echo "poll$i: $R"
  case "$R" in pending*) sleep 0.5;; *) break;; esac
done
$AB screenshot /home/z/my-project/shots/08-tick-persisted.png
# untick to leave clean state
$AB eval '(Array.from(document.querySelectorAll("button[aria-pressed]")).filter(function(b){var l=b.getAttribute("aria-label")||"";return l.indexOf("Mark ")===0})[0]).click(); "ok"'
sleep 0.4
echo "final store: $($AB storage local clu-progress-v1 | head -c 220)"
$AB close
echo E2E-DONE
