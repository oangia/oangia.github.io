function toast(e, t = "info") {
    let o = document.getElementById("toastContainer");

    // auto create container (like loading overlay)
    if (!o) {
        o = document.createElement("div");
        o.id = "toastContainer";
        o.className = "fixed top-4 right-4 z-[999999] space-y-2";
        document.body.appendChild(o);
    }

    const n = document.createElement("div"),
        r = {
            success: {
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-800",
                icon: '<svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            },
            error: {
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-800",
                icon: '<svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            },
            warning: {
                bg: "bg-yellow-50",
                border: "border-yellow-200",
                text: "text-yellow-800",
                icon: '<svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
            },
            info: {
                bg: "bg-blue-50",
                border: "border-blue-200",
                text: "text-blue-800",
                icon: '<svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            }
        },
        s = r[t] || r.info;

    n.className = `${s.bg} ${s.border} border rounded-lg shadow-lg p-4 toast-enter`;

    n.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${s.icon}
            </div>
            <div class="ml-3 flex-1">
                <p class="${s.text} text-sm font-medium">${e}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    o.appendChild(n);

    setTimeout(() => {
        n.classList.remove("toast-enter");
        n.classList.add("toast-exit");
        setTimeout(() => n.remove(), 300);
    }, 5000);
}