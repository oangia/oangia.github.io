// Escape HTML entities to prevent XSS attacks
const escapeHtml = str => String(str || "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
}[char] || char));
// Show toast notification banner with inline direct HTML/classes (no Theme dependency)
function showToast(message, type = "info", duration = 4000) {
    let container = document.getElementById("toastContainer");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const themes = {
        success: { border: "border-emerald-800", text: "text-emerald-100", icon: "fa-circle-check text-emerald-400", bar: "border-l-emerald-500" },
        error:   { border: "border-rose-800", text: "text-rose-100", icon: "fa-circle-exclamation text-rose-400", bar: "border-l-rose-500" },
        warning: { border: "border-amber-800", text: "text-amber-100", icon: "fa-triangle-exclamation text-amber-400", bar: "border-l-amber-500" },
        info:    { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" }
    }[type] || { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" };

    toast.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${themes.border} ${themes.text} ${themes.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
    toast.innerHTML = `
        <div class="flex items-center"><i class="fa-solid ${themes.icon} text-base mr-3"></i><span>${escapeHtml(message)}</span></div>
        <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-x-12", "opacity-0"));

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add("translate-x-12", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Update connection indicator dot and text status directly via inline HTML/classes
function updateConnectionStatus(isConnected, statusText) {
    const statusDot = document.getElementById("statusDot");
    const statusLabel = document.getElementById("statusText");

    if (statusLabel && statusDot) {
        statusLabel.textContent = statusText;
        statusDot.className = isConnected === true 
            ? "w-2 h-2 rounded-full bg-emerald-500" 
            : isConnected === false 
            ? "w-2 h-2 rounded-full bg-rose-500" 
            : "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
    }
}

function set_bg() {
    if (window.self === window.top) {
      document.body.style.backgroundImage = "linear-gradient(rgba(5, 8, 17, 0.45), rgba(5, 8, 17, 0.7)), url('https://images.unsplash.com/photo-1772511988871-a010197b94ae?auto=format&fit=crop&w=1920&q=80')";
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundColor = "#050811";
    }
}

// Close all open modal windows and reset text editors if active
function closeModals() {
    document.querySelectorAll(".fixed").forEach(modal => {
        if (modal.id !== "toastContainer") {
            modal.classList.add("hidden");
        }
    });

    if (typeof filePreviewManager !== "undefined" && filePreviewManager) {
        filePreviewManager.isTextEditor = false;
    }

    document.getElementById("previewSaveBtn")?.classList.add("hidden");
    document.getElementById("previewCancelEditBtn")?.classList.add("hidden");
}
