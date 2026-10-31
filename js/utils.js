class AppHeader {
  constructor(config) {
    this.config = {
      icon: "fa-solid fa-database",
      iconBg: "bg-amber-500 text-slate-900",
      statusColor: "amber",
      ...config
    };
  }

  renderHTML() {
    const { title, subtitle, icon, iconBg, status, actionButton } = this.config;

    const colorMap = {
      amber: "bg-amber-500/20 text-amber-300 border-amber-500/30 bg-amber-400",
      emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 bg-emerald-400",
      blue: "bg-blue-500/20 text-blue-300 border-blue-500/30 bg-blue-400",
      purple: "bg-purple-500/20 text-purple-300 border-purple-300/30 bg-purple-400",
    };
    const [badgeBg, badgeText, badgeBorder, dotBg] = (colorMap[status?.color] || colorMap.amber).split(" ");

    return `
      <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-30 w-full">
        <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4 w-full">
          <!-- Logo & Titles -->
          <div class="flex items-center space-x-3">
            <div class="${iconBg} p-2 rounded-xl shadow-md">
              <i class="${icon} text-lg"></i>
            </div>
            <div>
              <h1 id="appTitle" class="text-lg font-bold tracking-tight">${title}</h1>
              <p class="text-[11px] text-slate-400">${subtitle}</p>
            </div>
          </div>

          <!-- Status & Action Button -->
          <div class="flex items-center space-x-3">
            ${status ? `
              <span id="statusBadge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeBg} ${badgeText} border ${badgeBorder}">
                <span id="statusDot" class="w-2 h-2 rounded-full ${dotBg}"></span>
                <span id="statusText">${status.text}</span>
              </span>
            ` : ''}

            ${actionButton ? `
              ${actionButton.href ? `
                <a href="${actionButton.href}" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border border-slate-700">
                  <i class="${actionButton.icon}"></i>
                  <span>${actionButton.text}</span>
                </a>
              ` : `
                <button id="${actionButton.id}" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-2 border border-slate-700">
                  <i class="${actionButton.icon}"></i>
                  <span>${actionButton.text}</span>
                </button>
              `}
            ` : ''}
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Replaces an existing element (or inserts at the top of the body if selector is omitted)
   * @param {string} [selector="body"] - Target element to replace or prepend to
   */
  mount(selector = "body") {
    const target = document.querySelector(selector);
    if (!target) return;

    const template = document.createElement('template');
    template.innerHTML = this.renderHTML().trim();
    const newHeader = template.content.firstChild;

    // If the target is already a <header>, replace it directly. Otherwise, prepend it.
    if (target.tagName === 'HEADER') {
      target.replaceWith(newHeader);
    } else {
      target.insertBefore(newHeader, target.firstChild);
    }
  }
}
class Toast{static ensureDOM(){if(document.getElementById("toastContainer"))return;document.body.insertAdjacentHTML("beforeend",'<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>')}static show(e,t="info"){Toast.ensureDOM();let s=document.getElementById("toastContainer");if(!s)return;const a=document.createElement("div"),o={success:"bg-emerald-600",error:"bg-red-600",info:"bg-slate-900"};a.className=`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${o[t]||o.info} transition-all transform translate-y-2 opacity-0 pointer-events-auto`,a.innerHTML=`<i class="fa-solid fa-circle-info text-base"></i> <span>${e}</span>`,s.appendChild(a),requestAnimationFrame(()=>a.classList.remove("translate-y-2","opacity-0")),setTimeout(()=>{a.classList.add("opacity-0","translate-y-2"),setTimeout(()=>a.remove(),300)},3e3)}static success(e){Toast.show(e,"success")}static error(e){Toast.show(e,"error")}static info(e){Toast.show(e,"info")}}
!function(){if(document.getElementById("fontAwesomeCDN"))return;const e=document.createElement("script");e.src="https://cdn.tailwindcss.com",document.head.appendChild(e)}();
!function(){if(document.getElementById("customScrollbarStyle"))return;const r=document.createElement("style");r.id="customScrollbarStyle",r.innerHTML="\n    .custom-scrollbar::-webkit-scrollbar { width: 6px; }\n    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }\n    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }\n  ",document.head.appendChild(r)}();
!function(){if(document.getElementById("fontAwesomeCDN"))return;const e=document.createElement("link");e.rel="stylesheet",e.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",document.head.appendChild(e)}();
