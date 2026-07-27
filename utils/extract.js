function extractTableData(tableIndex, columnsMap) {
  const table = getAllTables()[tableIndex];
  if (!table) return [];

  return table.rows.map(row => {
    const obj = {};

    for (const [key, colIndex] of Object.entries(columnsMap)) {
      obj[key] = row[colIndex] ?? null;
    }

    return obj;
  });
}

function getAllTables({ mode = "text" } = {}) {
  const getCellContent = cell =>
    mode === "html"
      ? cell.innerHTML.trim()
      : cell.innerText.trim();

  const getRow = tr =>
    Array.from(tr.querySelectorAll("td, th")).map(getCellContent);

  return Array.from(document.body.querySelectorAll("table")).map(table => {
    const headerRow =
      table.querySelector("thead tr") ||
      table.querySelector("tr");

    const headers = headerRow ? getRow(headerRow) : [];

    const bodyRows = table.querySelectorAll("tbody tr");

    const rows = (bodyRows.length
      ? Array.from(bodyRows)
      : Array.from(table.querySelectorAll("tr")).slice(1)
    ).map(getRow);

    return { headers, rows };
  });
}

function getAllLinks() {
  return Array.from(document.body.querySelectorAll("a"))
    .map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }))
    .filter(link => link.href); // remove empty
}

function getAllImageUrls() {
  return Array.from(document.body.querySelectorAll("img"))
    .map(img => img.src)
    .filter(src => src); // remove empty
}

function extractPbs() {
  const tables = getAllTables();
  const pb = tables[7].rows[12].slice(4);
  const bvps = tables[7].rows[8].at(-1);
  return { pb, bvps }
}

function extractStockData(el) {
  const tables = el.querySelectorAll("table");
  if (!tables.length) return null;

  const headers = [...tables[0].querySelectorAll("thead th")]
    .map(th => th.textContent.trim())
    .slice(4);

  const rows = [];

  tables.forEach(table => {
    const trs = table.querySelectorAll("tr[data-row-type='reportnormId']");

    trs.forEach(tr => {
      const tds = [...tr.querySelectorAll("td")].map(td =>
        td.textContent.trim()
      );

      if (tds.length < 4) return;

      rows.push({
        title: tds[0],
        values: tds.slice(4).map(toNumber)
      });
    });
  });
  
  return { headers, rows };
}
