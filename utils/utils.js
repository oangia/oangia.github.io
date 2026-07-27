function observe(e,n){let t=null;new MutationObserver(()=>{const r=document.querySelector(e);r&&r.innerHTML!==t&&(t=r.innerHTML,n(r))}).observe(document,{childList:!0,subtree:!0})}

function hotkeys(key, callback) {
    document.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.shiftKey && e.key.toLowerCase() === key) {
        e.preventDefault(); // optional
        callback();
      }
    });
}

// ================= UTILS =================
function getStockCode() {
  return (location.pathname.split("/")[1] || "").replace(/\*/g, "");
}

function toNumber(str) {
  if (!str) return 0;
  const num = Number(str.replace(/,/g, "").replace(/\s/g, ""));
  return isNaN(num) ? 0 : num;
}

function colorVal(x) {
  if (x >= 30) return "background-color: rgba(22, 101, 52, 0.5)";
  if (x >= 25) return "background-color: rgba(63, 98, 18, 0.5)";
  if (x >= 20) return "background-color: rgba(15, 118, 110, 0.5)";
  if (x >= 15) return "background-color: rgba(133, 77, 14, 0.5)";
  if (x >= 10) return "background-color: rgba(154, 52, 18, 0.5)";
  if (x >= 0)  return "background-color: rgba(127, 29, 29, 0.5)";
  return "background-color: rgba(0, 0, 0, 0.5); color: #fecaca";
}

// ================= DOM HELPERS =================
function makeEl(tag, props = {}, styles = {}) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  Object.assign(node.style, styles);
  return node;
}

function makeCell(content, styles = {}) {
  const td = makeEl("td", {}, { ...STYLES.td, ...styles });
  if (content instanceof Node) td.appendChild(content);
  else td.textContent = content ?? "-";
  return td;
}

function makeSymbolLink(symbol) {
  const clean = symbol.trim().replace(/\*/g, "");
  return makeEl("a", {
    textContent: symbol,
    target: "_blank",
    href: `https://finance.vietstock.vn/${clean}/financials.htm?tab=BCTT`
  });
}

function makeHeaderRow(firstLabel, headers, onSort) {
  const tr = document.createElement("tr");
  [firstLabel, ...headers].forEach((text, index) => {
    const th = makeEl("th", { textContent: text }, STYLES.th);
    if (onSort) th.onclick = () => onSort(index);
    tr.appendChild(th);
  });
  return tr;
}

function makeTable(firstLabel, headers, onSort) {
  const table = makeEl("table", {}, STYLES.table);
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  thead.appendChild(makeHeaderRow(firstLabel, headers, onSort));
  table.append(thead, tbody);
  return { table, tbody };
}

// ================= SORT =================
function makeSorter(tbody) {
  let sortDir   = 1;
  let lastIndex = -1;

  return (index) => {
    sortDir   = lastIndex === index ? -sortDir : 1;
    lastIndex = index;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.sort((a, b) => {
      const A    = a.children[index]?.textContent?.replace(/,/g, "").trim() || "";
      const B    = b.children[index]?.textContent?.replace(/,/g, "").trim() || "";
      const aNum = parseFloat(A), bNum = parseFloat(B);
      return (!isNaN(aNum) && !isNaN(bNum)) ? (aNum - bNum) * sortDir : A.localeCompare(B) * sortDir;
    });
    rows.forEach(r => tbody.appendChild(r));
  };
}

// ================= LOADING =================
function setLoading(btn, isLoading = true, text = "Processing...") {
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent          = text;
    btn.disabled             = true;
    btn.style.opacity        = "0.6";
    btn.style.cursor         = "not-allowed";
  } else {
    btn.textContent   = btn.dataset.originalText;
    btn.disabled      = false;
    btn.style.opacity = "1";
    btn.style.cursor  = "pointer";
  }
}
// ================= COLOR =================
function colorByRule(num, rule) {
  if (isNaN(num) || !rule) return "";
  return num >= rule.threshold ? rule.high : rule.low;
}


