#!/bin/bash
cd /home/z/my-project
AB="agent-browser"
if ! curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
  setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
  for i in $(seq 1 90); do sleep 1; curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ && break; done
fi
$AB set viewport 390 844
$AB open http://127.0.0.1:3000/courses/lvm
$AB wait --load networkidle 2>/dev/null
sleep 1.5
echo "scrollWidth: $($AB eval "document.documentElement.scrollWidth")"
PROBE='(function(){
  var items = Array.from(document.querySelectorAll("main *"));
  var worst = items.map(function(e){
    var r = e.getBoundingClientRect();
    return {t: e.tagName, c: (e.className||"").toString().slice(0,50), w: Math.round(r.width), txt: (e.textContent||"").trim().slice(0,40)};
  }).filter(function(x){return x.w>380;});
  worst.sort(function(a,b){return b.w-a.w;});
  return JSON.stringify(worst.slice(0,10), null, 1);
})()'
$AB eval "$PROBE"
$AB close
echo PROBE-DONE
