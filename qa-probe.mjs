import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
const CHROME=["C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"],protocolTimeout:120000});
const p=await b.newPage();
await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
await p.goto("https://moalfarras.space/ar/work",{waitUntil:"networkidle2",timeout:120000});
const r=await p.evaluate(()=>{
  const s=document.querySelector(".work-spotlight-tabs button small");
  if(!s) return {found:false};
  return {found:true,size:getComputedStyle(s).fontSize,
    sheets:[...document.styleSheets].map(x=>x.href?x.href.split("/").pop():"inline").slice(0,8)};
});
console.log(JSON.stringify(r,null,1));
await b.close();
