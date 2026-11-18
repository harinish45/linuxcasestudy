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
  var card = document.querySelectorAll(".lg\\:col-span-7 .surface .surface")[0];
  if (!card) return "no card";
  var out = [];
  Array.from(card.children).forEach(function(ch){
    out.push("card-child " + ch.tagName + "[" + (ch.className||"").toString().slice(0,30) + "]=" + minContent(ch));
  });
  // header button children
  var btn = card.querySelector("button");
  Array.from(btn.children).forEach(function(ch){
    out.push("btn-child " + ch.tagName + "[" + (ch.className||"").toString().slice(0,36) + "]=" + minContent(ch));
  });
  // lesson rows: first lesson row internals
  var row = card.querySelector("ul li > div");
  if (row) Array.from(row.children).forEach(function(ch){
    out.push("row-child " + ch.tagName + "[" + (ch.className||"").toString().slice(0,36) + "]=" + minContent(ch));
  });
  return out.join(" | ");
})()'
$AB close
echo PROBE8-DONE
