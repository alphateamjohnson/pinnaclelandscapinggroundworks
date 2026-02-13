function getParam(n){
  return new URLSearchParams(window.location.search).get(n)||"";
}

const statement=getParam("s");
const name=getParam("n");
const phone=getParam("p");
const address=getParam("a");

document.getElementById("vStatement").textContent=statement;
document.getElementById("vName").textContent=name;
document.getElementById("vPhone").textContent=phone;
document.getElementById("vAddress").textContent=address;

const canvas=document.getElementById("sig");
const ctx=canvas.getContext("2d");
ctx.lineWidth=3;
ctx.lineCap="round";

let drawing=false;

canvas.addEventListener("mousedown",e=>{drawing=true;ctx.beginPath();});
canvas.addEventListener("mouseup",()=>drawing=false);
canvas.addEventListener("mousemove",e=>{
  if(!drawing) return;
  ctx.lineTo(e.offsetX,e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("touchstart",e=>{
  drawing=true;
  const r=canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);
});
canvas.addEventListener("touchmove",e=>{
  if(!drawing) return;
  const r=canvas.getBoundingClientRect();
  ctx.lineTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);
  ctx.stroke();
});
canvas.addEventListener("touchend",()=>drawing=false);

document.getElementById("submitBtn").addEventListener("click",()=>{
  if(!statement||!name){
    alert("Missing information.");
    return;
  }

  const img=canvas.toDataURL("image/png");
  const link=document.getElementById("downloadLink");
  link.href=img;
  document.getElementById("afterBox").classList.remove("hidden");
});
