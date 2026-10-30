export class Toast {
  static ensureDOM() {
    if (document.getElementById("toastContainer")) return;
    const containerHTML = `<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>`;
    document.body.insertAdjacentHTML('beforeend', containerHTML);
  }

  static show(msg, type = "info") {
    Toast.ensureDOM();
    let container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    const bgColors = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-slate-900" };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-medium text-white ${bgColors[type] || bgColors.info} transition-all transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-base"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-y-2", "opacity-0"));
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
