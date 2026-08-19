import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
const CHROME=["C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"],protocolTimeout:120000});
const p=await b.newPage();
await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.goto("https://moalfarras.space/ar/work",{waitUntil:"networkidle2",timeout:120000});
const r=await p.evaluate(()=>{
  const btn=[...document.querySelectorAll(".fresh-button")].find(e=>(e.innerText||"").includes("عرض التفاصيل"));
  if(!btn) return null;
  const kids=[...btn.children].map(c=>({tag:c.tagName,cls:String(c.className).slice(0,30),w:Math.round(c.getBoundingClientRect().width)}));
  const cs=getComputedStyle(btn,"::before");
  const textNode=[...btn.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join("");
  return {clientW:btn.clientWidth,scrollW:btn.scrollWidth,kids,beforeContent:cs.content,beforeW:cs.width,text:textNode||btn.innerText.trim()};
});
console.log(JSON.stringify(r,null,1));
await b.close();
