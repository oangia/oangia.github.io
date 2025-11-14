let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener("mouseup", (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0) {
    chrome.runtime.sendMessage({
      type: "translate",
      text: selection,
      mouseX: lastMouseX,
      mouseY: lastMouseY
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "showTranslation") {
    showPopup(message.original, message.translated, message.mouseX, message.mouseY);
  }
});

let popupEl = null;

function showPopup(original, translated, x, y) {
  // Remove existing popup and outside click listener
  if (popupEl) {
    popupEl.remove();
    document.removeEventListener("click", handleOutsideClick, true);
  }

  popupEl = document.createElement("div");
  popupEl.id = "translate-popup";
  popupEl.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 6px;">${original}</div>
    <div>${translated}</div>
  `;

  Object.assign(popupEl.style, {
    position: "fixed",
    left: `${x + 10}px`,
    top: `${y + 10}px`,
    maxWidth: "300px",
    background: "#1e1e1e",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 0 12px rgba(255,255,255,0.3)",
    zIndex: "999999",
    fontSize: "14px"
  });

  document.body.appendChild(popupEl);

  // Delay ensures we don't immediately trigger the listener
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick, true);
  }, 0);
}

function handleOutsideClick(event) {
  if (popupEl && !popupEl.contains(event.target)) {
    popupEl.remove();
    popupEl = null;
    document.removeEventListener("click", handleOutsideClick, true);
  }
}

