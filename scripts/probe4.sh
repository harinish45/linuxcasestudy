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
  if(!content) return "no content div";
  var leaves = Array.from(content.querySelectorAll("*")).filter(function(e){return e.children.length===0;});
  var out = ["leaves:"+leaves.length];
  for (var i=0;i<leaves.length;i++){
    leaves.forEach(function(k){k.style.display="";});
    leaves[i].style.display="none";
    if (document.documentElement.scrollWidth<=391){
      out.push("FIX-> "+leaves[i].tagName+" cls="+(leaves[i].className||"").toString().slice(0,70)+" txt="+(leaves[i].textContent||"").trim().slice(0,60));
      leaves.forEach(function(k){k.style.display="";});
      return out.join(" | ");
    }
  }
  leaves.forEach(function(k){k.style.display="";});
  // no single leaf: try pairwise top-level children of content
  var kids = Array.from(content.children);
  for (var j=0;j<kids.length;j++){
    kids.forEach(function(k){k.style.display="";});
    kids[j].style.display="none";
    out.push("top"+j+"("+(kids[j].className||"").toString().slice(0,30)+"):"+document.documentElement.scrollWidth);
  }
  kids.forEach(function(k){k.style.display="";});
  return out.join(" | ");
})()'
$AB close
echo PROBE4-DONE
