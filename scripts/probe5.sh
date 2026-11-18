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
$AB eval '(function(){
  var content = document.querySelector(".lg\\:col-span-7 .surface > div:nth-child(2)");
  var top0 = content.children[0];
  var info = {cls: top0.className, w: Math.round(top0.getBoundingClientRect().width), sw: top0.scrollWidth};
  var lines = [];
  function dump(el, depth){
    Array.from(el.children).forEach(function(c){
      var r = c.getBoundingClientRect();
      lines.push("  ".repeat(depth) + c.tagName + " cls=" + (c.className||"").toString().slice(0,40) + " w=" + Math.round(r.width) + " sw=" + c.scrollWidth + " ws=" + getComputedStyle(c).whiteSpace + " txt=" + (c.textContent||"").trim().slice(0,30));
      if (depth < 2) dump(c, depth+1);
    });
  }
  dump(top0, 0);
  // live test: force shrink
  top0.style.minWidth = "0";
  var after = document.documentElement.scrollWidth;
  return JSON.stringify({top0: info, afterMinW0: after, tree: lines.slice(0, 12)});
})()'
$AB close
echo PROBE5-DONE
