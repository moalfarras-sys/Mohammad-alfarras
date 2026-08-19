import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
const CHROME=["C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const [,,url,w,h]=process.argv;
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"],protocolTimeout:180000});
const p=await b.newPage();
await p.setViewport({width:Number(w),height:Number(h),isMobile:Number(w)<700,hasTouch:Number(w)<700,deviceScaleFactor:2});
await p.goto(url,{waitUntil:"networkidle2",timeout:120000});
await p.evaluate(async()=>{const s=innerHeight;for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}scrollTo(0,0);});
await new Promise(r=>setTimeout(r,600));
const out=await p.evaluate(()=>{
  const res=[];
  const isTextLeaf=e=>{
    const t=(e.innerText||"").trim();
    if(!t) return false;
    return ![...e.children].some(c=>(c.innerText||"").trim().length>0);
  };
  for(const e of document.querySelectorAll("h1,h2,h3,h4,p,span,a,li,strong,em,button,small,code,div")){
    if(!isTextLeaf(e)) continue;
    const cs=getComputedStyle(e);
    if(cs.display==="none"||cs.visibility==="hidden") continue;
    const r=e.getBoundingClientRect();
    if(r.width<20||r.height<6) continue;
    const hidesX=cs.overflowX==="hidden"||cs.overflow==="hidden";
    const hidesY=cs.overflowY==="hidden"||cs.overflow==="hidden";
    const cutX=hidesX&&e.scrollWidth>e.clientWidth+3;
    const cutY=hidesY&&e.scrollHeight>e.clientHeight+3;
    // also: an ancestor box clipping this text
    let clippedByAncestor=null;
    let n=e.parentElement;
    for(let i=0;i<5&&n;i++,n=n.parentElement){
      const ncs=getComputedStyle(n);
      if(ncs.overflow==="hidden"||ncs.overflowY==="hidden"){
        const nr=n.getBoundingClientRect();
        if(r.bottom>nr.bottom+2||r.top<nr.top-2){clippedByAncestor={by:Math.round(Math.max(r.bottom-nr.bottom,nr.top-r.top)),cls:String(n.className).slice(0,30)};break;}
      }
    }
    if(cutX||cutY||clippedByAncestor){
      res.push({text:(e.innerText||"").trim().slice(0,42),tag:e.tagName,cls:String(e.className).slice(0,34),
        cutX:cutX?e.scrollWidth-e.clientWidth:0,cutY:cutY?e.scrollHeight-e.clientHeight:0,
        anc:clippedByAncestor, y:Math.round(r.top+scrollY), x:Math.round(r.left)});
    }
  }
  return res.slice(0,14);
});
console.log(JSON.stringify(out,null,1));
await b.close();
