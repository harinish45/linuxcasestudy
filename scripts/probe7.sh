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
  function minContent(el){
    var c = el.cloneNode(true);
    var d = document.createElement("div");
    d.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;";
    c.style.cssText = "width:min-content;max-width:none;min-width:0;position:static;display:" + getComputedStyle(el).display + ";";
    d.appendChild(c);
    document.body.appendChild(d);
    var w = Math.ceil(c.getBoundingClientRect().width);
    document.body.removeChild(d);
    return w;
  }
  // walk down the widest-min-content path from the right column
  var el = document.querySelector(".lg\\:col-span-7");
  var path = [];
  for (var depth = 0; depth < 7 && el; depth++) {
    path.push(el.tagName + "[" + (el.className||"").toString().slice(0,34) + "]=" + minContent(el));
    var kids = Array.from(el.children).map(function(k){ return {k: k, m: minContent(k)}; });
    if (!kids.length) break;
    kids.sort(function(a,b){ return b.m - a.m; });
    el = kids[0].k;
  }
  return path.join("  ->  ");
})()'
$AB close
echo PROBE7-DONE
