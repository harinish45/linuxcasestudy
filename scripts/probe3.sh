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
  var panel = document.querySelector(".lg\\:col-span-7 .surface");
  if(!panel) return "no panel";
  var tabbar = panel.querySelector("[role=tablist]");
  var content = tabbar ? tabbar.nextElementSibling : null;
  var out = [];
  out.push("panel:" + panel.getBoundingClientRect().width);
  if (tabbar){ tabbar.style.display="none"; out.push("no-tabbar:" + document.documentElement.scrollWidth); tabbar.style.display=""; }
  if (content){ content.style.display="none"; out.push("no-content:" + document.documentElement.scrollWidth); content.style.display=""; }
  return out.join(" ");
})()'
# if content is the culprit, walk deeper: hide each descendant leaf class group
$AB eval '(function(){
  function walk(sel){
    var el = document.querySelector(sel);
    if(!el) return sel+":missing";
    var kids = Array.from(el.querySelectorAll("*")).filter(function(e){return e.children.length===0;});
    var out=[];
    for (var i=0;i<kids.length;i++){
      kids.forEach(function(k){k.style.display="";});
      kids[i].style.display="none";
      if (document.documentElement.scrollWidth<=391){ kids.forEach(function(k){k.style.display="";}); return "fix-el:"+kids[i].tagName+"."+(kids[i].className||"").toString().slice(0,60)+" txt="+(kids[i].textContent||"").slice(0,50); }
    }
    kids.forEach(function(k){k.style.display="";});
    return "no-single-leaf-fixes; leaves="+kids.length;
  }
  var content = document.querySelector(".lg\\:col-span-7 .surface > div[style=\"\"], .lg\\:col-span-7 .surface > div:last-child");
  return walk(content ? content : document.querySelector(".lg\\:col-span-7"));
})()'
$AB close
echo PROBE3-DONE
