class Validator{static isEmpty(e){return!e||!e.trim()}static isEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}static minLength(e,r){return e.trim().length>=r}static maxLength(e,r){return e.trim().length<=r}static isNumber(e){return/^\d+$/.test(e.trim())}static isStrongPassword(e){return/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/.test(e)}static match(e,r){return e===r}static isPhone(e){return/^\d{8,15}$/.test(e.trim())}static isUsername(e){return/^[a-zA-Z0-9_]{3,20}$/.test(e.trim())}static inRange(e,r,t){return Number(e)>=r&&Number(e)<=t}static validate(e,r,t,s={}){const a=t.split("|");for(let t of a){let a;switch(t.includes(":")&&([t,a]=t.split(":"),isNaN(a)||(a=Number(a))),t){case"required":if(this.isEmpty(r))return Message.error(`${e} is required.`,5e3),!1;break;case"string":if("string"!=typeof r)return Message.error(`${e} must be a string.`,5e3),!1;break;case"email":if(!this.isEmail(r))return Message.error(`${e} must be a valid email address.`,5e3),!1;break;case"between":if(!a)break;const[t,i]=a.toString().split(",").map(Number);if(!this.minLength(r,t)||!this.maxLength(r,i))return Message.error(`${e} must be between ${t} and ${i} characters.`,5e3),!1;break;case"min":if(!this.minLength(r,a))return Message.error(`${e} must be at least ${a} characters.`,5e3),!1;break;case"max":if(!this.maxLength(r,a))return Message.error(`${e} must be at most ${a} characters.`,5e3),!1;break;case"strongPassword":if(!this.isStrongPassword(r))return Message.error(`${e} must include uppercase, lowercase, number, and special character.`,5e3),!1;break;case"username":if(!this.isUsername(r))return Message.error(`${e} can only contain letters, numbers, and underscores.`,5e3),!1;break;case"phone":if(!this.isPhone(r))return Message.error(`${e} must be a valid phone number.`,5e3),!1;break;case"match":if(!this.match(r,s[a]))return Message.error(`${e} must match ${a}.`,5e3),!1;break;case"inRange":if(!a)break;const[n,m]=a.toString().split(",").map(Number);if(!this.inRange(r,n,m))return Message.error(`${e} must be between ${n} and ${m}.`,5e3),!1;break;case"isNumber":if(!this.isNumber(r))return Message.error(`${e} must be a number.`,5e3),!1}}return!0}}
class Message{static container=null;static createContainer(){if(this.container)return;const e=document.createElement("div");Object.assign(e.style,{position:"fixed",top:"20px",right:"20px",zIndex:9999,display:"flex",flexDirection:"column",gap:"8px",pointerEvents:"none"}),document.body.appendChild(e),this.container=e}static getClassStyles(e){const t={purple:{borderColor:"#694D9F",background:"#694D9F",color:"#fff"},info:{borderColor:"#B4E1E4",background:"#81c7e1",color:"#fff"},danger:{borderColor:"#B63E5A",background:"#E26868",color:"#fff"},warning:{borderColor:"#F3F3EB",background:"#E9CEAC",color:"#fff"},success:{borderColor:"#19B99A",background:"#20A286",color:"#fff"}};return t[e]||t.info}static show(e,t="info",o=5e3){this.createContainer();const s=document.createElement("div");Object.assign(s.style,this.getClassStyles(t)),s.innerHTML=e,Object.assign(s.style,{padding:"10px 16px",cursor:"pointer",borderRadius:"5px",opacity:0,pointerEvents:"auto",transition:"opacity 0.3s ease"}),s.addEventListener("click",(()=>this.hide(s))),this.container.appendChild(s),requestAnimationFrame((()=>{s.style.opacity=1})),setTimeout((()=>this.hide(s)),o)}static hide(e){e.style.opacity=0,setTimeout((()=>e.remove()),300)}static success(e,t=5e3){this.show(e,"success",t)}static error(e,t=5e3){this.show(e,"danger",t)}static warning(e,t=5e3){this.show(e,"warning",t)}static info(e,t=5e3){this.show(e,"info",t)}static purple(e,t=5e3){this.show(e,"purple",t)}}
class FormDetector{constructor(){this.fields={},this.detect()}isEmail(s){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}isUsername(s){return/^[a-zA-Z0-9_]{3,20}$/.test(s)}isPassword(s){return s.length>=6||/[!@#$%^&*()\-_=+{};:,<.>]/.test(s)}isPhone(s){return/^\+?\d{8,15}$/.test(s.replace(/\s+/g,""))}detect(){this.fields={};document.querySelectorAll("input").forEach((s=>{const e=(s.value||"").trim();if(!e)return;const t=(s.name||s.id||"").toLowerCase()||e;let i="other";this.isEmail(e)?i="email":this.isPhone(e)?i="phone":this.isPassword(e)?i="password":this.isUsername(e)&&(i="username");const r=t||i;this.fields[r]?Array.isArray(this.fields[r])?this.fields[r].push(e):this.fields[r]=[this.fields[r],e]:this.fields[r]=e}))}get(s){return this.fields[s]||null}getAll(){return this.fields}}
class Url{static get(a){return new URLSearchParams(window.location.search).get(a)}static has(a){return new URLSearchParams(window.location.search).has(a)}static getAll(){return Object.fromEntries(new URLSearchParams(window.location.search))}}
class Loading{static start(){if(document.getElementById("loading-overlay"))return;const n=document.createElement("div");n.id="loading-overlay",Object.assign(n.style,{position:"fixed",top:"0",left:"0",width:"100%",height:"100%",backgroundColor:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:"9999"});const e=document.createElement("div");if(e.className="ripple-loader",n.appendChild(e),document.body.appendChild(n),!document.getElementById("loading-style")){const n=document.createElement("style");n.id="loading-style",n.innerHTML='\n        .ripple-loader {\n          position: relative;\n          width: 80px;\n          height: 80px;\n        }\n\n        /* First ripple: green */\n        .ripple-loader::before {\n          content: "";\n          position: absolute;\n          border: 4px solid #10a37f;\n          border-radius: 50%;\n          width: 100%;\n          height: 100%;\n          top: 0;\n          left: 0;\n          animation: ripple 1s infinite ease-out;\n        }\n\n        /* Second ripple: red, hidden initially */\n        .ripple-loader::after {\n          content: "";\n          position: absolute;\n          border: 4px solid #d20962;\n          border-radius: 50%;\n          width: 100%;\n          height: 100%;\n          top: 0;\n          left: 0;\n          opacity: 0; /* hide initially */\n          animation: ripple 1s infinite ease-out;\n          animation-delay: 0.5s; /* staggered start */\n        }\n\n        @keyframes ripple {\n          0% {\n            transform: scale(0.2);\n            opacity: 1;\n          }\n          100% {\n            transform: scale(1.8);\n            opacity: 0;\n          }\n        }\n      ',document.head.appendChild(n)}}static end(){const n=document.getElementById("loading-overlay");n&&n.remove()}}
async function loading(action = '') {
  if (action == '') {
    Loading.start();
  } else if (typeof action == 'string') {
    Loading.end();
  }
  if (typeof action === "function") {
    try {
      loading();
      await action()
    } catch (err) {
      console.log(err);
    } finally {
      loading('e');
    }
  }
}
class BlogEditor{constructor(t){if(this.container=document.getElementById(t),!this.container)throw new Error("Container not found");this.container.style="padding:5px",this.init()}init(){const t=document.createElement("div");t.className="toolbar",this.container.appendChild(t),this.toolbar=t;const e=document.createElement("div");e.id="editor",e.contentEditable=!0,e.innerHTML="",e.style.minHeight="300px",e.style.border="1px solid #ccc",e.style.padding="10px",e.style.borderRadius="4px",e.style.overflowY="auto",this.container.appendChild(e),this.editor=e;const i=document.createElement("textarea");i.id="html-view",i.style.minHeight="300px",i.style.width="100%",i.style.display="none",i.style.fontFamily="monospace",i.style.whiteSpace="pre-wrap",i.style.border="1px solid #ccc",i.style.borderRadius="4px",i.style.padding="10px",this.container.appendChild(i),this.htmlView=i;const n=document.createElement("style");n.innerHTML="\n        .toolbar { margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }\n        .toolbar button { padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; cursor: pointer; display: flex; align-items: center; justify-content: center; }\n        .toolbar button:hover { background: #e0e0e0; }\n        .toolbar svg { width: 16px; height: 16px; fill: #333; }\n        .toolbar .separator { margin: 0 4px; color: #888; user-select: none; }\n      ",document.head.appendChild(n),this.pluginGroups=[[BoldPlugin,ItalicPlugin,UnderlinePlugin,TextColorPlugin,BgColorPlugin],[AlignLeftPlugin,AlignCenterPlugin,AlignRightPlugin,AlignJustifyPlugin],[UnorderedListPlugin,OrderedListPlugin],[LinkPlugin,ImagePlugin],[HTMLViewPlugin]],this.pluginGroups.forEach(((t,e)=>{if(t.forEach((t=>(new t).init(this))),e<this.pluginGroups.length-1){const t=document.createElement("span");t.className="separator",t.innerText="|",this.toolbar.appendChild(t)}}))}format(t,e=null){document.execCommand(t,!1,e)}toggleView(){"none"!==this.editor.style.display?(this.htmlView.value=this.editor.innerHTML,this.editor.style.display="none",this.htmlView.style.display="block"):(this.editor.innerHTML=this.htmlView.value,this.htmlView.style.display="none",this.editor.style.display="block")}getContent(){return"none"!==this.editor.style.display?this.editor.innerHTML:this.htmlView.value}}class Plugin{init(t){}createButton(t,e,i){const n=document.createElement("button");n.type="button",n.innerHTML=e,n.addEventListener("click",i),t.toolbar.appendChild(n)}}class TextColorPlugin extends Plugin{init(t){const e=document.createElement("input");e.type="color",e.title="Text Color",e.style.width="28px",e.style.height="28px",e.style.padding="0",e.style.border="1px solid #ccc",e.style.borderRadius="4px",e.addEventListener("input",(e=>{t.format("foreColor",e.target.value)})),t.toolbar.appendChild(e)}}class BgColorPlugin extends Plugin{init(t){const e=document.createElement("input");e.type="color",e.title="Background Color",e.style.width="28px",e.style.height="28px",e.style.padding="0",e.style.border="1px solid #ccc",e.style.borderRadius="4px",e.addEventListener("input",(e=>{t.format("hiliteColor",e.target.value)})),t.toolbar.appendChild(e)}}class BoldPlugin extends Plugin{init(t){this.createButton(t,"<b>B</b>",(()=>t.format("bold")))}}class ItalicPlugin extends Plugin{init(t){this.createButton(t,"<i>I</i>",(()=>t.format("italic")))}}class UnderlinePlugin extends Plugin{init(t){this.createButton(t,"<u>U</u>",(()=>t.format("underline")))}}class AlignLeftPlugin extends Plugin{init(t){this.createButton(t,'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="3" y="20" width="12" height="2"/></svg>',(()=>t.format("justifyLeft")))}}class AlignCenterPlugin extends Plugin{init(t){this.createButton(t,'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="6" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="6" y="20" width="12" height="2"/></svg>',(()=>t.format("justifyCenter")))}}class AlignRightPlugin extends Plugin{init(t){this.createButton(t,'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="9" y="10" width="12" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="9" y="20" width="12" height="2"/></svg>',(()=>t.format("justifyRight")))}}class AlignJustifyPlugin extends Plugin{init(t){this.createButton(t,'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2"/><rect x="3" y="10" width="18" height="2"/><rect x="3" y="15" width="18" height="2"/><rect x="3" y="20" width="18" height="2"/></svg>',(()=>t.format("justifyFull")))}}class UnorderedListPlugin extends Plugin{init(t){this.createButton(t,"&bull; List",(()=>t.format("insertUnorderedList")))}}class OrderedListPlugin extends Plugin{init(t){this.createButton(t,"1. List",(()=>t.format("insertOrderedList")))}}class LinkPlugin extends Plugin{init(t){this.createButton(t,"Link",(()=>{const e=prompt("Enter link URL");e&&t.format("createLink",e)}))}}class ImagePlugin extends Plugin{init(t){this.createButton(t,"Image",(()=>{const e=prompt("Enter image URL");e&&t.format("insertImage",e)}))}}class HTMLViewPlugin extends Plugin{init(t){this.createButton(t,"HTML View",(()=>t.toggleView()))}}
class ApiHandler{constructor(e){this.baseUrl=e,this.privateKey=null,this.publicKey=null}async generateKeyPair(){const e=await crypto.subtle.generateKey({name:"RSA-OAEP",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},!0,["encrypt","decrypt"]);this.privateKey=e.privateKey,this.publicKey=e.publicKey}async exportPublicKey(){const e=await crypto.subtle.exportKey("spki",this.publicKey);return btoa(String.fromCharCode(...new Uint8Array(e)))}async decryptResponse(e){const t=Uint8Array.from(atob(e),(e=>e.charCodeAt(0))),a=await crypto.subtle.decrypt({name:"RSA-OAEP"},this.privateKey,t);return JSON.parse((new TextDecoder).decode(a))}async post(e){await this.generateKeyPair();const t=await this.exportPublicKey(),a=await fetch(this.baseUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,pub:t})}),i=await a.json(),r=await this.decryptResponse(i.f),s=await this.decryptResponse(i.i);return this.privateKey=null,this.publicKey=null,{formulas:r.fomulas,i:s.ip}}}// logs
class ConsoleViewer{static panel=null;static buffer=[];static originalLog=console.log;static override(){console.log=(...e)=>{ConsoleViewer.originalLog.apply(console,e);const o=e.map((e=>"object"==typeof e?JSON.stringify(e):String(e))).join(" ");ConsoleViewer.buffer.push(o),ConsoleViewer.updatePanel()}}static init(){ConsoleViewer.panel||(ConsoleViewer.panel=document.createElement("div"),ConsoleViewer.panel.id="console-viewer",ConsoleViewer.panel.style.position="fixed",ConsoleViewer.panel.style.left="0",ConsoleViewer.panel.style.right="0",ConsoleViewer.panel.style.bottom="0",ConsoleViewer.panel.style.maxHeight="30vh",ConsoleViewer.panel.style.overflowY="auto",ConsoleViewer.panel.style.background="#111",ConsoleViewer.panel.style.color="#0f0",ConsoleViewer.panel.style.fontFamily="monospace",ConsoleViewer.panel.style.fontSize="14px",ConsoleViewer.panel.style.padding="8px",ConsoleViewer.panel.style.borderTop="2px solid #333",ConsoleViewer.panel.style.zIndex="99999",document.body.appendChild(ConsoleViewer.panel),ConsoleViewer.updatePanel())}static updatePanel(){if(ConsoleViewer.panel){ConsoleViewer.panel.innerHTML="";for(const e of ConsoleViewer.buffer){const o=document.createElement("div");o.textContent=e,ConsoleViewer.panel.appendChild(o)}ConsoleViewer.panel.scrollTop=ConsoleViewer.panel.scrollHeight}}static setup(){ConsoleViewer.override(),"complete"===document.readyState||"interactive"===document.readyState?ConsoleViewer.init():document.addEventListener("DOMContentLoaded",(()=>ConsoleViewer.init()))}}
class IEvent{static onClick(t,e){document.addEventListener("click",(c=>{c.target.id===t&&(c.preventDefault?.(),e(c))}))}}
class Dom{
  id(_id) {
    return document.getElementById(_id).value.trim();
  }
}
const dom = new Dom();
if (Url.has("debug")) {
  ConsoleViewer.setup();
}
//md5
!function(n){"use strict";function d(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function f(n,t,r,e,o,u){return d((u=d(d(t,n),d(e,u)))<<o|u>>>32-o,r)}function l(n,t,r,e,o,u,c){return f(t&r|~t&e,n,t,o,u,c)}function g(n,t,r,e,o,u,c){return f(t&e|r&~e,n,t,o,u,c)}function v(n,t,r,e,o,u,c){return f(t^r^e,n,t,o,u,c)}function m(n,t,r,e,o,u,c){return f(r^(t|~e),n,t,o,u,c)}function c(n,t){var r,e,o,u;n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;for(var c=1732584193,f=-271733879,i=-1732584194,a=271733878,h=0;h<n.length;h+=16)c=l(r=c,e=f,o=i,u=a,n[h],7,-680876936),a=l(a,c,f,i,n[h+1],12,-389564586),i=l(i,a,c,f,n[h+2],17,606105819),f=l(f,i,a,c,n[h+3],22,-1044525330),c=l(c,f,i,a,n[h+4],7,-176418897),a=l(a,c,f,i,n[h+5],12,1200080426),i=l(i,a,c,f,n[h+6],17,-1473231341),f=l(f,i,a,c,n[h+7],22,-45705983),c=l(c,f,i,a,n[h+8],7,1770035416),a=l(a,c,f,i,n[h+9],12,-1958414417),i=l(i,a,c,f,n[h+10],17,-42063),f=l(f,i,a,c,n[h+11],22,-1990404162),c=l(c,f,i,a,n[h+12],7,1804603682),a=l(a,c,f,i,n[h+13],12,-40341101),i=l(i,a,c,f,n[h+14],17,-1502002290),c=g(c,f=l(f,i,a,c,n[h+15],22,1236535329),i,a,n[h+1],5,-165796510),a=g(a,c,f,i,n[h+6],9,-1069501632),i=g(i,a,c,f,n[h+11],14,643717713),f=g(f,i,a,c,n[h],20,-373897302),c=g(c,f,i,a,n[h+5],5,-701558691),a=g(a,c,f,i,n[h+10],9,38016083),i=g(i,a,c,f,n[h+15],14,-660478335),f=g(f,i,a,c,n[h+4],20,-405537848),c=g(c,f,i,a,n[h+9],5,568446438),a=g(a,c,f,i,n[h+14],9,-1019803690),i=g(i,a,c,f,n[h+3],14,-187363961),f=g(f,i,a,c,n[h+8],20,1163531501),c=g(c,f,i,a,n[h+13],5,-1444681467),a=g(a,c,f,i,n[h+2],9,-51403784),i=g(i,a,c,f,n[h+7],14,1735328473),c=v(c,f=g(f,i,a,c,n[h+12],20,-1926607734),i,a,n[h+5],4,-378558),a=v(a,c,f,i,n[h+8],11,-2022574463),i=v(i,a,c,f,n[h+11],16,1839030562),f=v(f,i,a,c,n[h+14],23,-35309556),c=v(c,f,i,a,n[h+1],4,-1530992060),a=v(a,c,f,i,n[h+4],11,1272893353),i=v(i,a,c,f,n[h+7],16,-155497632),f=v(f,i,a,c,n[h+10],23,-1094730640),c=v(c,f,i,a,n[h+13],4,681279174),a=v(a,c,f,i,n[h],11,-358537222),i=v(i,a,c,f,n[h+3],16,-722521979),f=v(f,i,a,c,n[h+6],23,76029189),c=v(c,f,i,a,n[h+9],4,-640364487),a=v(a,c,f,i,n[h+12],11,-421815835),i=v(i,a,c,f,n[h+15],16,530742520),c=m(c,f=v(f,i,a,c,n[h+2],23,-995338651),i,a,n[h],6,-198630844),a=m(a,c,f,i,n[h+7],10,1126891415),i=m(i,a,c,f,n[h+14],15,-1416354905),f=m(f,i,a,c,n[h+5],21,-57434055),c=m(c,f,i,a,n[h+12],6,1700485571),a=m(a,c,f,i,n[h+3],10,-1894986606),i=m(i,a,c,f,n[h+10],15,-1051523),f=m(f,i,a,c,n[h+1],21,-2054922799),c=m(c,f,i,a,n[h+8],6,1873313359),a=m(a,c,f,i,n[h+15],10,-30611744),i=m(i,a,c,f,n[h+6],15,-1560198380),f=m(f,i,a,c,n[h+13],21,1309151649),c=m(c,f,i,a,n[h+4],6,-145523070),a=m(a,c,f,i,n[h+11],10,-1120210379),i=m(i,a,c,f,n[h+2],15,718787259),f=m(f,i,a,c,n[h+9],21,-343485551),c=d(c,r),f=d(f,e),i=d(i,o),a=d(a,u);return[c,f,i,a]}function i(n){for(var t="",r=32*n.length,e=0;e<r;e+=8)t+=String.fromCharCode(n[e>>5]>>>e%32&255);return t}function a(n){var t=[];for(t[(n.length>>2)-1]=void 0,e=0;e<t.length;e+=1)t[e]=0;for(var r=8*n.length,e=0;e<r;e+=8)t[e>>5]|=(255&n.charCodeAt(e/8))<<e%32;return t}function e(n){for(var t,r="0123456789abcdef",e="",o=0;o<n.length;o+=1)t=n.charCodeAt(o),e+=r.charAt(t>>>4&15)+r.charAt(15&t);return e}function r(n){return unescape(encodeURIComponent(n))}function o(n){return i(c(a(n=r(n)),8*n.length))}function u(n,t){return function(n,t){var r,e=a(n),o=[],u=[];for(o[15]=u[15]=void 0,16<e.length&&(e=c(e,8*n.length)),r=0;r<16;r+=1)o[r]=909522486^e[r],u[r]=1549556828^e[r];return t=c(o.concat(a(t)),512+8*t.length),i(c(u.concat(t),640))}(r(n),r(t))}function t(n,t,r){return t?r?u(t,n):e(u(t,n)):r?o(n):e(o(n))}"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:n.md5=t}(this);

function formatNumber(num) {
  return num?.toLocaleString() || "0";
}

function formatDuration(seconds) {
  if (!seconds) return "N/A";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return (h ? h + "h " : "") + (m ? m + "m " : "") + s + "s";
}

class TextAnalyzer{constructor(){this.weakVerbsSet=new Set(["is","are","was","were","be","been","being","am","has","have","had"]),this.adjectiveSuffixes=/(?:able|ible|al|ful|ic|ical|ive|less|ous|ious|eous|ent|ant|ary)$/i,this.nominalizationPatterns=/(?:tion|sion|ment|ness|ity|ance|ence)$/i}normalizeText(e){return e.normalize?e.normalize("NFC"):e}splitSentences(e){return e.split(/[.!?…]+\s+|\n+/g).map((e=>e.trim())).filter((e=>e.length>0))}splitWords(e){return(e=(e=e.normalize("NFC")).replace(/[\u00A0\u200B\t\n\r]+/g," ")).match(/\b[\p{L}\p{N}]+(?:[''\-][\p{L}\p{N}]+)*\b/gu)||[]}countLetters(e){const t=e.match(/[a-zA-Z]/g);return t?t.length:0}countCharsWithSpaces(e){return e.length}countCharsWithoutSpaces(e){return e.replace(/\s/g,"").length}getAverageWordLength(e){return e.length?e.reduce(((e,t)=>e+t.length),0)/e.length:0}getLongestWord(e){if(!e.length)return{word:"",length:0};const t=e.reduce(((e,t)=>t.length>e.length?t:e),"");return{word:t,length:t.length}}toNFDLower(e){try{return e.normalize("NFD").toLowerCase()}catch{return e.toLowerCase()}}syllablesInWord(e){let t=e.toLowerCase().replace(/[^a-z]/g,"");if(["reliable"].includes(t))return 4;if(t.length<=3)return 1;let n=0,s=t;s.match(/le$/)&&n++,s.match(/(ted|ded)$/)&&n++,s.match(/(thm|thms)$/)&&n++,s.match(/(ses|zes|ches|shes|ges|ces)$/)&&n++,s.includes("rial")&&n++,s.includes("creat")&&n++,s=s.replace(/(e|ed|es)$/i,"");n+=(s.match(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g)||[]).length,s=s.replace(/aa|ae|ai|ao|au|ay|ea|ee|ei|eo|eu|ey|ia|ie|ii|io|iu|iy|oa|oe|oi|oo|ou|oy|ua|ue|ui|uo|uu|uy|ya|ye|yi|yo|yu|yy/g,"");return n+=(s.match(/[aeiouy]/g)||[]).length,n>0?n:1}countAdverbs(e){return e.filter((e=>/ly$/.test(e.toLowerCase())&&e.length>4)).length}countWeakVerbs(e){return e.filter((e=>this.weakVerbsSet.has(e.toLowerCase()))).length}countPassiveVoice(e){const t=e.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi);return t?t.length:0}countHardAdjectives(e){return e.filter((e=>this.syllablesInWord(e)>=3&&this.adjectiveSuffixes.test(e.toLowerCase()))).length}#e(e){return e.filter((e=>this.nominalizationPatterns.test(e.toLowerCase())&&e.length>5)).length}#t(e){const t={};e.forEach((e=>{const n=e.toLowerCase();t[n]=(t[n]||0)+1}));return{unique:e.filter((e=>1===t[e.toLowerCase()])).length,repeat:e.length-new Set(e.map((e=>e.toLowerCase()))).size}}#n(e){return{short:e.filter((e=>this.splitWords(e).length<=10)).length,medium:e.filter((e=>{const t=this.splitWords(e).length;return t>10&&t<21})).length,long:e.filter((e=>this.splitWords(e).length>=21)).length}}analyze(e){const t=this.normalizeText(e),n=this.splitSentences(t),s=this.splitWords(t),r=this.countLetters(t),i=this.countCharsWithSpaces(t),o=this.countCharsWithoutSpaces(t),a=this.getAverageWordLength(s),l=this.getLongestWord(s),h=s.map((e=>this.syllablesInWord(e))),u=h.reduce(((e,t)=>e+t),0),c=this.#n(n),g=e.split(/\n\s*\n/).filter((e=>e.trim().length>0)),d=g.map((e=>this.splitWords(e).length));return{difficulty:{hardWords:h.filter((e=>e>=3)).length,longSentences:c.long,adverbs:this.countAdverbs(s),hardAdjectives:this.countHardAdjectives(s),nominals:this.#e(s),passiveWords:this.countPassiveVoice(t),weakVerbs:this.countWeakVerbs(s)},character:{totalWords:s.length,avgWordLength:Math.round(a),longestWord:l.word,longestWordLength:l.length,charsWithSpaces:i,charsWithoutSpaces:o,lettersAZ:r,alphaNumeric:r},sentences:{total:n.length,lineCount:0,totalLines:n.length,avgLength:n.length?Math.round(s.length/n.length):0,activeVoice:n.length-this.countPassiveVoice(t),passiveVoice:this.countPassiveVoice(t),short:c.short,medium:c.medium,long:c.long},paragraphs:{count:g.length,shortest:d.length?Math.min(...d):0,longest:d.length?Math.max(...d):0},words:{easy:h.filter((e=>e<3)).length,hard:h.filter((e=>e>=3)).length,compound:0,cardinal:0,properNoun:0,abbreviated:0,unique:this.#t(s).unique,repeat:this.#t(s).repeat},syllables:{total:u,avgPerWord:parseFloat((u/s.length).toFixed(2)),oneSyl:h.filter((e=>1===e)).length,twoSyl:h.filter((e=>2===e)).length,threeSyl:h.filter((e=>3===e)).length,fourSyl:h.filter((e=>4===e)).length,fiveSyl:h.filter((e=>5===e)).length,sixSyl:h.filter((e=>6===e)).length,sevenPlusSyl:h.filter((e=>e>=7)).length}}}}
class ReadabilityEngine {
  calcARI(t) {
      const c = t.character.charsWithoutSpaces,
          a = t.character.totalWords;
      return c / a * 4.71 + a / t.sentences.total * .5 - 21.43
  }
  calcFRE(t) {
      const c = t.character.totalWords;
      return 206.835 - c / t.sentences.total * 1.015 - t.syllables.total / c * 84.6
  }
  calcGFI(t) {
      const c = t.character.totalWords;
      return .4 * (c / (t.sentences.total + t.words.compound) + t.words.hard / c * 100)
  }
  calcFK(t) {
      const c = t.character.totalWords;
      return c / t.sentences.total * .39 + t.syllables.total / c * 11.8 - 15.59
  }
  calcCLI(t) {
      const c = t.character.lettersAZ,
          a = t.character.totalWords;
      return .0588 * (c / a * 100) - .296 * (t.sentences.total / a * 100) - 15.8
  }
  calcSMOG(t) {
      const c = t.sentences.total,
          a = t.words.hard;
      return 1.043 * Math.sqrt(a * (30 / c) + 3.1291)
  }
  calcLinsearWrite(t) {
      const c = t.sentences.total,
          a = t.words.compound,
          s = (1 * (t.words.easy - 3) + 3 * t.words.hard) / (c + a);
      return s > 20 ? s / 2 : (s - 2) / 2
  }
  calcForcast(t) {
      const c = t.character.totalWords;
      return 20 - t.syllables.oneSyl / c * 150 / 10
  }
  calculate(t) {
      return [
          this.calcARI(t),
          this.calcFRE(t),
          this.calcGFI(t),
          this.calcFK(t),
          this.calcCLI(t),
          this.calcSMOG(t),
          this.calcLinsearWrite(t),
          this.calcForcast(t)
      ]
  }
}

class ReadabilityLookup {
  constructor() {
    this.GRADE_LEVEL = [
      { min: -Infinity, max: 0.99, grade: "Kindergarten", level: "Extremely Easy", ages: "5–6 yrs" },
      { min: 1, max: 1.99, grade: "1st Grade", level: "Extremely Easy", ages: "6–7 yrs" },
      { min: 2, max: 2.99, grade: "2nd Grade", level: "Very Easy", ages: "7–8 yrs" },
      { min: 3, max: 3.99, grade: "3rd Grade", level: "Very Easy", ages: "8–9 yrs" },
      { min: 4, max: 4.99, grade: "4th Grade", level: "Easy", ages: "9–10 yrs" },
      { min: 5, max: 5.99, grade: "5th Grade", level: "Fairly Easy", ages: "10–11 yrs" },
      { min: 6, max: 6.99, grade: "6th Grade", level: "Fairly Easy", ages: "11–12 yrs" },
      { min: 7, max: 7.99, grade: "7th Grade", level: "Average", ages: "12–13 yrs" },
      { min: 8, max: 8.99, grade: "8th Grade", level: "Average", ages: "13–14 yrs" },
      { min: 9, max: 9.99, grade: "9th Grade", level: "Slightly Difficult", ages: "14–15 yrs" },
      { min: 10, max: 10.99, grade: "10th Grade", level: "Somewhat Difficult", ages: "15–16 yrs" },
      { min: 11, max: 11.99, grade: "11th Grade", level: "Fairly Difficult", ages: "16–17 yrs" },
      { min: 12, max: 12.99, grade: "12th Grade", level: "Difficult", ages: "17–18 yrs" },
      { min: 13, max: Infinity, grade: "College", level: "Very Difficult", ages: "18–22 yrs" }
    ];

    this.READING_SCALE = [
      { min: 140, max: 200, grade: "Kindergarten", level: "Extremely Easy", ages: "5–6 yrs", gradeRange: 0 },
      { min: 130, max: 139, grade: "1st Grade", level: "Very Easy", ages: "6–7 yrs", gradeRange: 1 },
      { min: 120, max: 129, grade: "2nd Grade", level: "Very Easy", ages: "7–8 yrs", gradeRange: 2 },
      { min: 110, max: 119, grade: "3rd Grade", level: "Very Easy", ages: "8–9 yrs", gradeRange: 3 },
      { min: 100, max: 109, grade: "4th Grade", level: "Very Easy", ages: "9–10 yrs", gradeRange: 4 },
      { min: 90,  max: 99,  grade: "5th Grade", level: "Very Easy", ages: "10–11 yrs", gradeRange: 5 },
      { min: 80,  max: 89,  grade: "6th Grade", level: "Easy", ages: "11–12 yrs", gradeRange: 6 },
      { min: 70,  max: 79,  grade: "7th Grade", level: "Fairly Easy", ages: "12–13 yrs", gradeRange: 7 },
      { min: 60,  max: 69,  grade: "8th & 9th Grade", level: "Standard", ages: "13–15 yrs", gradeRange: 8.5 },
      { min: 50,  max: 59,  grade: "10–12th Grade", level: "Fairly Difficult", ages: "15–18 yrs", gradeRange: 11 },
      { min: 30,  max: 49,  grade: "College", level: "Difficult", ages: "18+ yrs", gradeRange: 13.5 },
      { min: 0,   max: 29,  grade: "Professional", level: "Very Difficult", ages: "18+ yrs", gradeRange: 14.5 }
    ];
  }

  interpolate(start, end, t) {
    const s = this.hexToRgb(start);
    const e = this.hexToRgb(end);
  
    const r = Math.round(s.r + (e.r - s.r) * t);
    const g = Math.round(s.g + (e.g - s.g) * t);
    const b = Math.round(s.b + (e.b - s.b) * t);
  
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  }

  getColor(gradeRange) {
    let g = Number(gradeRange);
    if (isNaN(g) || g < 0) g = 0;

    if (g < 6) return this.interpolate('#7DCEA0', '#48C9B0', g / 5);   // lighter greens
    if (g < 10) return this.interpolate('#F9E79F', '#F4D03F', (g - 6) / 3); // lighter yellows
    if (g < 13) return this.interpolate('#F5B041', '#EB984E', (g - 10) / 2); // softer oranges
    return '#EC7063'; // lighter red
  }

  lookupScore(score, data, table, formulaName) {
    const info = table.find(row => score >= row.min && score <= row.max) || {};
    info.color = this.getColor(info.gradeRange ?? score);

    let formulaHTML;
    switch (formulaName) {
      case 'Automated Readability Index':
        formulaHTML = `<b>ARI</b> = (4.71 * ( <span class="data">${data.character.charsWithoutSpaces}</span> characters / <span class="data">${data.character.totalWords}</span> words)) + (0.5 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) - 21.43 = ${score}`;
        break;
      case 'Flesch Reading Ease':
        formulaHTML = `<b>FRE</b> = 206.835 - (1.015 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) - (84.6 * <span class="data">${data.syllables.total}</span> syllables / <span class="data">${data.character.totalWords}</span> words) = ${score}`;
        break;
      case 'Gunning Fog Index':
        formulaHTML = `<b>GFI</b> = (0.4 * (<span class="data">${data.character.totalWords}</span> words / (<span class="data">${data.sentences.total}</span> sentences + <span class="data">0</span> compound sentences)) + 100 * (<span class="data">${data.words.hard}</span> FOG hard words / <span class="data">${data.character.totalWords}</span> words)) = ${score}`;
        break;
      case 'Flesch-Kincaid Grade Level':
        formulaHTML = `<b>FK</b> = (0.39 * (<span class="data">${data.character.totalWords}</span> words / <span class="data">${data.sentences.total}</span> sentences)) + (11.8 * (<span class="data">${data.syllables.total}</span> syllables / <span class="data">${data.character.totalWords}</span> words)) - 15.59 = ${score}`;
        break;
      case 'Coleman-Liau Readability Index':
        formulaHTML = `<b>CLI</b> = (0.0588 * (<span class="data">${data.character.lettersAZ}</span> letters / <span class="data">${data.character.totalWords}</span> words) * 100) - (0.296 * (<span class="data">${data.sentences.total}</span> sentences / <span class="data">${data.character.totalWords}</span> words) * 100) - 15.8 = ${score}`;
        break;
      case 'The SMOG Index':
        formulaHTML = `<b>SMOG</b> = 1.043 * Sqrt((<span class="data">${data.words.hard}</span> hard words * (30 / <span class="data">${data.sentences.total}</span> sentences)) + 3.1291) = ${score}`;
        break;
      case 'Linsear Write Grade Level Formula':
        formulaHTML = `<b>Linsear</b> = (((<span class="data">${data.words.easy}</span> easy words - <span class="data">3</span> ignored words) * 1) + (<span class="data">${data.words.hard}</span> hard words * 3)) / (<span class="data">${data.sentences.total}</span> sentences + <span class="data">0</span> compound sentences) / 2 = ${score}`;
        break;
      case 'FORCAST Readability Formula':
        formulaHTML = `<b>FORCAST</b> = 20 - ((<span class="data">${data.syllables.oneSyl}</span> 1-syllable words * 150) / (<span class="data">${data.character.totalWords}</span> words * 10)) = ${score}`;
        break;
      default:
        formulaHTML = ``;
    }

    return {
      name: formulaName,
      ...info,
      formulaHTML,
      score
    };
  }

  lookupARI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Automated Readability Index'); }
  lookupFRE(score, data) { return this.lookupScore(score, data, this.READING_SCALE, 'Flesch Reading Ease'); }
  lookupGFI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Gunning Fog Index'); }
  lookupFK(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Flesch-Kincaid Grade Level'); }
  lookupCLI(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Coleman-Liau Readability Index'); }
  lookupSMOG(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'The SMOG Index'); }
  lookupLinsear(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'Linsear Write Grade Level Formula'); }
  lookupFORCAST(score, data) { return this.lookupScore(score, data, this.GRADE_LEVEL, 'FORCAST Readability Formula'); }

  calculateAverage(results, data) {
    let total = 0;
    results.forEach(item => {
      total += item.gradeRange !== undefined ? Number(item.gradeRange) : Number(item.score);
    });
    const avg = total / results.length;
    return this.lookupScore(avg, data, this.GRADE_LEVEL, 'The Average');
  }

  calculate(text, readability) {
    const data = (new TextAnalyzer()).analyze(text);
    const results = [
      this.lookupARI(readability[0], data),
      this.lookupFRE(Math.ceil(readability[1]), data),
      this.lookupGFI(readability[2], data),
      this.lookupFK(readability[3], data),
      this.lookupCLI(readability[4], data),
      this.lookupSMOG(readability[5], data),
      this.lookupLinsear(readability[6], data),
      this.lookupFORCAST(readability[7], data)
    ];
    const consensus = this.calculateAverage(results, data);
    results.unshift(consensus);
    return results;
  }
}

function showResults(outputId, results) {
  const output = document.getElementById(outputId);
  output.innerHTML = '';
  
  results.forEach(res => {
    const div = document.createElement('div');
    div.className = 'col-md-12 bg-body-secondary border rounded p-3 mb-3';
    if (res.name === "The Average") {
      div.className += ' formula';
      div.style.setProperty('border-color', res.color, 'important');
      div.style.setProperty('border-width', '3px', 'important');
    } else {
      div.style.borderColor = res.color;
      div.style.borderWidth = '2px';
    }
    div.innerHTML = formatResult(res);
    output.appendChild(div);
  });
}
function formatResult(res, matchHTML='') {
  return `
  <h3 class="fs-6 mb-2 text-center"><b>${res.name}</b></h3>
  <div class="score-box px-3 py-2 rounded mb-2 fs-6">
  <div>Score: <b style="color:${res.color};">${parseFloat(res.score).toFixed(2)}</b></div>
  <div>Reading Difficulty: <b style="color:${res.color};">${res.level}</b></div>
  <div>Grade Level: <b style="color:${res.color};">${res.grade}</b></div>
  <div>Age Range: <b>${res.ages}</b></div>
  <div>${res.formulaHTML}</div>
  </div>
  ${matchHTML}
  `;
}