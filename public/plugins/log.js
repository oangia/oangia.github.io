// Create log panel
(function () {
  const panel = document.createElement("div");
  panel.id = "console-viewer";
  panel.style.position = "fixed";
  panel.style.left = "0";
  panel.style.right = "0";
  panel.style.bottom = "0";
  panel.style.maxHeight = "30vh";
  panel.style.overflowY = "auto";
  panel.style.background = "#111";
  panel.style.color = "#0f0";
  panel.style.fontFamily = "monospace";
  panel.style.fontSize = "14px";
  panel.style.padding = "8px";
  panel.style.borderTop = "2px solid #333";
  panel.style.zIndex = "99999";
  document.body.appendChild(panel);

  const originalLog = console.log;

  console.log = function (...args) {
    // Print to real console
    originalLog.apply(console, args);

    // Print to panel
    const msg = args
      .map(a => typeof a === "object" ? JSON.stringify(a) : String(a))
      .join(" ");

    const line = document.createElement("div");
    line.textContent = msg;
    panel.appendChild(line);

    // Auto-scroll
    panel.scrollTop = panel.scrollHeight;
  };
})();

