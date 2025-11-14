console.log("Log");
// Step 1: Create log box (start in <html>)
window.__logBox__ = document.createElement("div");
window.__logBox__.id = "__video_log_box__";
window.__logBox__.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  word-wrap: break-word;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999999;
  padding: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  user-select: text;
  pointer-events: auto;
  display:none;
`;
// Step 2: Ctrl+Shift+Q toggles visibility
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === "KeyQ") {
    if (document.getElementById("__video_log_box__") == undefined && document.body != undefined) {
      document.body.appendChild(window.__logBox__);
    }
    window.__logBox__.style.display = window.__logBox__.style.display == "none" ? "block" : "none";
  }
});
function isVideo(url) {
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mov', '.flv', '.avi', '.ts'];
    const cleanUrl = url.split('?');
    return videoExtensions.some(ext => cleanUrl[0].endsWith(ext));
}

// Step 3: Message handling
let requests = [];
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "log-request") {
    //console.log(message);
    if (isVideo(message.details.url.toLowerCase())) {
      appendLogEntry(message.details);
    }
  }
});

function appendLogEntry(details) {
  const entry = document.createElement("div");
  entry.innerHTML = `[${details.method}] ${details.url}`;
  window.__logBox__.appendChild(entry);
}

function downloadFile(url, filename) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "blob"; // we want the raw file data

  xhr.onload = function () {
    if (xhr.status === 200) {
      const urlBlob = URL.createObjectURL(xhr.response);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlBlob);
    } else {
      console.error("Download failed with status:", xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error("Download error");
  };

  xhr.send();
}
