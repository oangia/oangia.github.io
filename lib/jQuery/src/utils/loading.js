function loading(show = true) {
    const id = "__loading_overlay__";

    if (show) {
        if (document.getElementById(id)) return;

        const overlay = document.createElement("div");
        overlay.id = id;
        overlay.className =
            "fixed inset-0 flex items-center justify-center bg-black/30 z-[999999]";

        overlay.innerHTML = `
            <div class="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        `;

        document.body.appendChild(overlay);
    } else {
        const overlay = document.getElementById(id);
        if (overlay) overlay.remove();
    }
}