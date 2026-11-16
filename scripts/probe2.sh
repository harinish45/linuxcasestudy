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
echo "base scrollWidth: $($AB eval "document.documentElement.scrollWidth")"
# hide left column (VisualCard) -> measure
echo "no visualcard: $($AB eval 'document.querySelector(".lg\\:col-span-5").style.display="none"; document.documentElement.scrollWidth')"
# restore, hide right column (TabPanel)
$AB eval 'document.querySelector(".lg\\:col-span-5").style.display=""; document.querySelector(".lg\\:col-span-7").style.display="none"' > /dev/null
echo "no tabpanel: $($AB eval 'document.documentElement.scrollWidth')"
$AB eval 'document.querySelector(".lg\\:col-span-7").style.display=""' > /dev/null
# restore; hide kicker in visualcard
$AB eval 'document.querySelectorAll(".kicker")[0] && (document.querySelectorAll(".kicker")[0].style.display="none"); document.documentElement.scrollWidth' > /dev/null
echo "no first kicker: $($AB eval 'document.documentElement.scrollWidth')"
$AB eval 'document.querySelectorAll(".kicker")[0] && (document.querySelectorAll(".kicker")[0].style.display="")' > /dev/null
# hide each direct child of LvmVisual root (flex flex-col gap-5)
$AB eval '(function(){
  var root = document.querySelector(".flex.flex-col.gap-5");
  if(!root) return "no root";
  var out = [];
  var kids = Array.from(root.children);
  for (var i=0;i<kids.length;i++){
    kids.forEach(function(k){k.style.display="";});
    kids[i].style.display="none";
    out.push(i+":"+document.documentElement.scrollWidth);
  }
  kids.forEach(function(k){k.style.display="";});
  return out.join(" ");
})()'
$AB close
echo PROBE2-DONE
