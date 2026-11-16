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
$AB eval '(Array.from(document.querySelectorAll("button[aria-pressed]")).filter(function(b){var l=b.getAttribute("aria-label")||"";return l.indexOf("Mark ")===0})[0]).click(); "ok"'
sleep 0.6
$AB reload
$AB wait --load networkidle 2>/dev/null
sleep 2
$AB eval '(function(){
  var pressed = Array.from(document.querySelectorAll("button[aria-pressed=true]")).map(function(b){return b.getAttribute("aria-label");});
  var summary = document.body.innerText.match(/\d+ of \d+ lessons done/)?.[0];
  var labels = Array.from(document.querySelectorAll(".font-mono")).map(function(e){return e.textContent}).filter(function(t){return t && /^\d\/\d/.test(t)});
  return JSON.stringify({summary: summary, pressedCount: pressed.length, pressed: pressed, moduleLabels: labels});
})()'
$AB close
echo DOM-TRUTH-DONE
