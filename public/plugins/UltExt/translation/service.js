function isValidSelection(text) {
  // Trim and basic length
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 200) return false;

  // Reject if mostly non-word characters
  const letters = trimmed.match(/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g) || [];
  const letterRatio = letters.length / trimmed.length;
  if (letterRatio < 0.9) return false;

  // Reject if it's mostly symbols, numbers, or code
  const isWeird = /^[^a-zA-Z\u00C0-\u024F]+$/.test(trimmed);
  if (isWeird) return false;

  // Looks valid
  return true;
}
function formatData(data) {
  let html = '';
  if (data.sentences) {
    html += `<i>${data.sentences.map(s=>s.src_translit).join(" ")}</i> `;
    html += `(<button id="play-audio" style="margin-bottom:6px;">🔈</button>)<br/>`;
    html += `<strong>Translation:</strong><div>${data.sentences.map(s => s.trans).join(" ")}</div>`;
    
  }

  if (data.dict) {
    html += '<br />';
    html += `<strong>Dictionary:</strong>`;
    data.dict.forEach(entry => {
      html += `<div><em>${entry.pos}</em>: ${entry.terms.join(", ")}</div>`;
    });
  }

  if (data.definitions) {
    html += "<br />";
    html += `<strong>Definitions:</strong>`;
    data.definitions.forEach(def => {
      html += `<div><em>${def.pos}</em>`;
      def.entry.forEach(e => {
        html += `<div>- ${e.gloss}</div>`;
      });
      html += `</div>`;
    });
    
  }

  if (data.examples) {
    html += "<br />";
    html += `<strong>Examples:</strong>`;
    data.examples.forEach(e => {
      html += `<div>"${e.example}" → "${e.translation}"</div>`;
    });
  }
  
  return html;
}
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "translate" && message.text && isValidSelection(message.text)) {
    const query = encodeURIComponent(message.text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&dt=bd&dt=rm&dj=1&q=${query}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const html = formatData(data);
      // Combine translated sentences

      chrome.tabs.sendMessage(sender.tab.id, {
        type: "showTranslation",
        original: message.text,
        translated: html,
        mouseX: message.mouseX,
        mouseY: message.mouseY
      });
    } catch (e) {
      console.error("Translation error:", e);
    }
  }
});

      
