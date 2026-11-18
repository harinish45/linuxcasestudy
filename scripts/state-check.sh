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
echo "store: $($AB storage local clu-progress-v1 | head -c 300)"
echo "ui summary: $($AB eval 'document.body.innerText.match(/\d+ of 13 lessons done/)?.[0] || "MISSING"')"
echo "module header labels: $($AB eval 'Array.from(document.querySelectorAll(".surface button .font-mono")).map(function(e){return e.textContent}).filter(function(t){return t && t.indexOf("/")>=0}).join(", ")')"
echo "checked lessons: $($AB eval 'document.querySelectorAll("button[aria-pressed=true]").length')"
echo "--- clean reload hydration poll ---"
$AB eval "localStorage.removeItem('clu-progress-v1'); 'reset'"
$AB reload
for i in 1 2 3 4 5 6 7 8 9 10; do
  R=$($AB eval '(document.body.innerText.match(/\d+ of 13 lessons done/)?.[0] || "pending") + "@" + Math.round(performance.now())')
  echo "poll$i: $R"
  case "$R" in pending*) sleep 0.5;; *) break;; esac
done
$AB close
echo STATE-DONE
