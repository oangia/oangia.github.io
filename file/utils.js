const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals))} ${["B", "KB", "MB", "GB"][i]}`;
};

// Escape HTML entities to prevent XSS attacks
const escapeHtml = str => String(str || "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
}[char] || char));

// File extension & type helpers
const getExtension = filename => filename.includes(".") ? filename.split(".").pop().toLowerCase() : "file";
const isType = (filename, types) => types.includes(getExtension(filename));

const isImage = filename => isType(filename, ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);
const isVideo = filename => isType(filename, ["mp4", "webm", "mov", "avi", "mkv", "ogg"]);
const isAudio = filename => isType(filename, ["mp3", "wav", "ogg", "m4a", "flac", "aac"]);
const isText  = filename => isType(filename, ["txt", "md", "json", "js", "ts", "html", "css", "xml", "csv", "log", "py", "sql", "yml", "yaml"]);
const isHtml  = filename => /\.(html|htm)$/i.test(filename);

// Compute SHA-256 hash for a string or binary data
async function computeSha256(data) {
    const encoder = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Show toast notification banner
function showToast(message, type = "info", duration = 4000) {
    let container = document.getElementById("toastContainer");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = typeof Theme !== "undefined" && Theme.getToastContainerClasses 
            ? Theme.getToastContainerClasses() 
            : "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    
    if (typeof Theme !== "undefined" && Theme.getToastClasses && Theme.getToastHTML) {
        toast.className = Theme.getToastClasses(type);
        toast.innerHTML = Theme.getToastHTML(message, type);
    } else {
        const themes = {
            success: { border: "border-emerald-800", text: "text-emerald-100", icon: "fa-circle-check text-emerald-400", bar: "border-l-emerald-500" },
            error:   { border: "border-rose-800", text: "text-rose-100", icon: "fa-circle-exclamation text-rose-400", bar: "border-l-rose-500" },
            warning: { border: "border-amber-800", text: "text-amber-100", icon: "fa-triangle-exclamation text-amber-400", bar: "border-l-amber-500" },
            info:    { border: "border-slate-700", text: "text-slate-100", icon: "fa-circle-info text-sky-400", bar: "border-l-sky-500" }
        }[type] || themes.info;

        toast.className = `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl bg-slate-900/90 backdrop-blur-md border-l-4 ${themes.border} ${themes.text} ${themes.bar} transform transition-all duration-300 translate-x-12 opacity-0 text-xs font-medium`;
        toast.innerHTML = `
            <div class="flex items-center"><i class="fa-solid ${themes.icon} text-base mr-3"></i><span>${escapeHtml(message)}</span></div>
            <button onclick="this.parentElement.remove()" class="ml-4 text-slate-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
        `;
    }

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-x-12", "opacity-0"));

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add("translate-x-12", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Update connection indicator dot and text status
function updateConnectionStatus(isConnected, statusText) {
    const statusDot = document.getElementById("statusDot");
    const statusLabel = document.getElementById("statusText");

    if (statusLabel && statusDot) {
        statusLabel.textContent = statusText;
        statusDot.className = typeof Theme !== "undefined" && Theme.getStatusDotClasses 
            ? Theme.getStatusDotClasses(isConnected)
            : (isConnected === true ? "w-2 h-2 rounded-full bg-emerald-500" : isConnected === false ? "w-2 h-2 rounded-full bg-rose-500" : "w-2 h-2 rounded-full bg-amber-400 animate-pulse");
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
