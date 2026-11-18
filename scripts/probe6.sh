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
  // measure min-content of a subtree: clone into a 0-width container and read scrollWidth
  function minContent(el){
    var d = document.createElement("div");
    d.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;overflow:visible;visibility:hidden;";
    var c = el.cloneNode(true);
    c.style.cssText = "width:auto;max-width:none;position:static;";
    d.appendChild(c);
    document.body.appendChild(d);
    var w = c.scrollWidth;
    document.body.removeChild(d);
    return w;
  }
  var content = document.querySelector(".lg\\:col-span-7 .surface");
  var tabbar = content.querySelector("[role=tablist]");
  var body = tabbar.nextElementSibling;
  var out = [];
  out.push("surface=" + minContent(content) + " tabbar=" + minContent(tabbar) + " body=" + minContent(body));
  Array.from(body.children).forEach(function(ch, i){
    out.push("child" + i + "(" + (ch.className||"motion").toString().slice(0,26) + ")=" + minContent(ch));
  });
  // drill into widest child subtree
  return out.join(" | ");
})()'
$AB close
echo PROBE6-DONE
