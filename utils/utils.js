function observe(e,n){let t=null;new MutationObserver(()=>{const r=document.querySelector(e);r&&r.innerHTML!==t&&(t=r.innerHTML,n(r))}).observe(document,{childList:!0,subtree:!0})}

// ================= UTILS =================
function toNumber(str) {
  if (!str) return 0;
  const num = Number(str.replace(/,/g, "").replace(/\s/g, ""));
  return isNaN(num) ? 0 : num;
}

// ================= DOM HELPERS =================
function makeEl(tag, props = {}, styles = {}) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  Object.assign(node.style, styles);
  return node;
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

// ================= COLOR =================
function colorByRule(num, rule) {
  if (isNaN(num) || !rule) return "";
  return num >= rule.threshold ? rule.high : rule.low;
}


