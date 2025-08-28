const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL("dark-mode/css/docs.css");

document.body.appendChild(link);

const link2 = document.createElement("link");
link2.rel = "stylesheet";
link2.type = "text/css";
link2.href = chrome.runtime.getURL("dark-mode/css/dark-normal.css");

document.body.appendChild(link2);
console.log("External CSS file injected.");
document.documentElement.setAttribute("style", `
  --docsafterdark_document_background: var(--secondary-background-color);
  --docsafterdark_document_invert: invert(1) contrast(79.5%) grayscale(100%);
  --docsafterdark_document_border: 1px solid var(--primary-border-color);
  --docsafterdark-accent-hue: 340;
`);

