class Validator{static isEmpty(t){return!t||!t.trim()}static isEmail(t){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)}static minLength(t,r){return t.trim().length>=r}static maxLength(t,r){return t.trim().length<=r}static isNumber(t){return/^\d+$/.test(t.trim())}static isStrongPassword(t){return/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/.test(t)}static match(t,r){return t===r}static isPhone(t){return/^\d{8,15}$/.test(t.trim())}static isUsername(t){return/^[a-zA-Z0-9_]{3,20}$/.test(t.trim())}static inRange(t,r,s){return Number(t)>=r&&Number(t)<=s}}
class Message{static el=null;static timeout=null;static create(){if(this.el)return;const t=document.createElement("div");t.className="message-floating",Object.assign(t.style,{position:"fixed",top:"20px",right:"20px",zIndex:9999,minWidth:"200px",padding:"12px 16px",borderRadius:"6px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",opacity:0,transition:"opacity 0.3s"});const e=document.createElement("span");e.innerHTML="&times;",Object.assign(e.style,{marginLeft:"12px",fontWeight:"bold",cursor:"pointer"}),e.addEventListener("click",(()=>this.hide())),t.appendChild(e),document.body.appendChild(t),this.el=t}static show(t,e="info",s=3e3){this.create(),this.el.firstChild&&this.el.firstChild!==this.el.lastChild&&this.el.removeChild(this.el.firstChild);const i=document.createElement("span");switch(i.textContent=t,this.el.insertBefore(i,this.el.lastChild),e){case"success":this.el.style.backgroundColor="#28a745";break;case"error":this.el.style.backgroundColor="#dc3545";break;case"warning":this.el.style.backgroundColor="#ffc107",this.el.style.color="#000";break;default:this.el.style.backgroundColor="#17a2b8"}this.el.style.display="flex",requestAnimationFrame((()=>this.el.style.opacity=1)),clearTimeout(this.timeout),this.timeout=setTimeout((()=>this.hide()),s)}static hide(){this.el&&(this.el.style.opacity=0,setTimeout((()=>this.el&&(this.el.style.display="none")),300))}static success(t,e=3e3){this.show(t,"success",e)}static error(t,e=3e3){this.show(t,"error",e)}static warning(t,e=3e3){this.show(t,"warning",e)}static info(t,e=3e3){this.show(t,"info",e)}}
class FormDetector{constructor(){this.fields={},this.detect()}isEmail(s){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}isUsername(s){return/^[a-zA-Z0-9_]{3,20}$/.test(s)}isPassword(s){return s.length>=6||/[!@#$%^&*()\-_=+{};:,<.>]/.test(s)}isPhone(s){return/^\+?\d{8,15}$/.test(s.replace(/\s+/g,""))}detect(){this.fields={};document.querySelectorAll("input").forEach((s=>{const e=(s.value||"").trim();if(!e)return;const t=(s.name||s.id||"").toLowerCase()||e;let i="other";this.isEmail(e)?i="email":this.isPhone(e)?i="phone":this.isPassword(e)?i="password":this.isUsername(e)&&(i="username");const r=t||i;this.fields[r]?Array.isArray(this.fields[r])?this.fields[r].push(e):this.fields[r]=[this.fields[r],e]:this.fields[r]=e}))}get(s){return this.fields[s]||null}getAll(){return this.fields}}
class Loading {
  static start() {
    if (document.getElementById('loading-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999'
    });

    const ripple = document.createElement('div');
    ripple.className = 'ripple-loader';

    overlay.appendChild(ripple);
    document.body.appendChild(overlay);

    // Inject CSS only once
    if (!document.getElementById('loading-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'loading-style';
      styleEl.innerHTML = `
        .ripple-loader {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .ripple-loader::before,
        .ripple-loader::after {
          content: "";
          position: absolute;
          border: 4px solid #10a37f;
          border-radius: 50%;
          width: 100%;
          height: 100%;
          animation: ripple 1.5s infinite ease-out;
        }

        .ripple-loader::after {
          animation-delay: 0.75s;
        }

        @keyframes ripple {
          0% {
            transform: scale(0.2);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }

  static end() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
  }
}

// logs
//let panel=null;const buffer=[],originalLog=console.log;function addMessage(e){const n=document.createElement("div");n.textContent=e,panel.appendChild(n),panel.scrollTop=panel.scrollHeight}function initPanel(){panel=document.createElement("div"),panel.id="console-viewer",panel.style.position="fixed",panel.style.left="0",panel.style.right="0",panel.style.bottom="0",panel.style.maxHeight="30vh",panel.style.overflowY="auto",panel.style.background="#111",panel.style.color="#0f0",panel.style.fontFamily="monospace",panel.style.fontSize="14px",panel.style.padding="8px",panel.style.borderTop="2px solid #333",panel.style.zIndex="99999",document.body.appendChild(panel),buffer.forEach(addMessage),buffer.length=0}console.log=function(...e){originalLog.apply(console,e);const n=e.map((e=>"object"==typeof e?JSON.stringify(e):String(e))).join(" ");panel?addMessage(n):buffer.push(n)},"complete"===document.readyState||"interactive"===document.readyState?initPanel():document.addEventListener("DOMContentLoaded",initPanel);
