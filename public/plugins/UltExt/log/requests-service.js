chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (details.tabId === -1) return; // skip if not tied to a tab
    console.log(details);
    if (details.url.includes("activeview_etx")) {
      return { cancel: true }; // block the request
    }
    chrome.tabs.sendMessage(details.tabId, {
      type: "log-request",
      details: details
    });
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
