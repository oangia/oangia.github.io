// ================= CONFIG =================
function renderTable({ headers, rows }, config) {
  const { table, tbody } = makeTable("Metric", headers);
  table.style.width = "100%";
  table.style.marginTop = "10px";

  config.forEach(({ key, label, colorRule, title }) => {
      const values = rows.find(r =>
        r.title.trim().toLowerCase() === key
      )?.values ?? [];

      const tr = document.createElement("tr");
      
      tr.appendChild(makeEl("td", { textContent: label }));

      values.forEach((v, i) => {
        const num = parseFloat(
          String(v).replace("%", "").replace(/,/g, "").trim()
        );

        const td = makeEl("td", { textContent: v });
        td.style.textAlign = 'right';
        td.style.padding = "3px 7px";
        if (Array.isArray(title) && title[i] != null) {
          td.title = title[i];
        }

        if (colorRule) {
          td.style.color = colorByRule(num, colorRule);
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  return table;
}

function bank(data) {
    const getRow = (name) => data.rows.find(r => r.title.trim().toLowerCase() === name)?.values ?? [];

    const equity = getRow("capital and reserves");
    const equityGrowthPct = equity.map((v, i, arr) => {
      if (i === 0 || !arr[i - 1]) return "0";
      return (((v - arr[i - 1]) / arr[i - 1]) * 100).toFixed(2);
    });

    const revenue = getRow("net interest income");

    const calcRatio = (numerator, denominator, decimals = 0) =>
      numerator.map((v, i) => {
        const div = Array.isArray(denominator) ? denominator[i] : denominator;
        return div ? ((v / div) * 100).toFixed(decimals) : "0";
      });

    
    return renderTable(data, [
      { key: "capital and reserves", label: "Capital and Reserves"},
      { key: "equity growth", label: "Equity growth (%)", colorRule: { threshold: 0, high: "green", low: "red" }},
      { key: "minority interest margin", label: "Minority interest (%)" },
      { key: "amounts due to the government and the state bank of vietnam margin", label: "Borrow government (%)" },
      {
        key: "deposits and borrowings from other credit institutions margin", label: "Credit (%)"
      },
      { key: "deposits from customers margin", label: "Customers (%)" },
      { key: "derivatives and other financial liabilities margin", label: "Derivatives (%)" },
      { key: "other borrowed funds margin", label: "Other borrowed (%)" },
      { key: "valuable papers issued margin", label: "Valuable papers issued (%)" },
      { key: "other liabilities margin", label: "Other liabilities (%)" },
      
      { key: "cash margin", label: "Cash on hand, gold, silver, gemstones (%)"},
      { key: "balances with and loans to other credit institutions margin", label: "Balances with and loans to other credit institutions (%)"},
      { key: "loans, advances and finance leases to customers margin", label: "Loans, advances and finance leases to customers (%)"},
      { key: "investment securities margin", label: "Investment securities (%)"},
      { key: "fixed assets margin", label: "Fixed assets (%)", colorRule: { threshold: 10, high: "red", low: "white" } },
      
        { key: "net interest income", label: "Net revenue"},
        { key: "operating expenses margin", label: "Operating expenses (%)",
          colorRule: { threshold: 10, high: "red", low: "white" }},
        { key: "operating profit before provision for credit losses", label: "Operating profit before provision for credit losses"},
        {key: "net profit rate", label : "Tax and other cost/expenses (%)",
          colorRule: { threshold: 80, high: "green", low: "red" }}
      ])
}

function cost_structure(data) {
const getRow = (name) => data.rows.find(r => r.title.trim().toLowerCase() === name)?.values ?? [];

const cogs = getRow("cost of goods sold");
return renderTable(data, [
   { key: "cogs margin", label: "Cogs (%)", title: cogs},
   { key: "financial expense margin", label: "Financial expenses (%)",
      colorRule: { threshold: 10, high: "red", low: "white" }},
    { key: "selling expense margin", label: "Selling expenses (%)",
    colorRule: { threshold: 10, high: "red", low: "white"}},
    { key: "g&a expense margin", label: "G&A expenses (%)",
      colorRule: { threshold: 10, high: "red", low: "white" }},
    {key: "net profit rate", label : "Tax and other cost/expenses (%)",
      colorRule: { threshold: 20, high: "red", low: "white" }},
      {
    key: "fixed assets margin", label: "Fixed assets (%)"
  },
  {
    key: "receivables margin", label: "Receivables (%)",
    colorRule: { threshold: 10, high: "red", low: "white" }
  },
  {
    key: "inventories margin", label: "Inventories (%)",
    colorRule: { threshold: 10, high: "red", low: "white" }
  },
  {
    key: "other current assets margin", label: "Other current assets (%)",
    colorRule: { threshold: 10, high: "red", low: "white" }
  },
  {
    key: "investment properties margin", label: "Properties (%)"
  },
  {
    key: "long-term investments margin", label: "Long-term investments (%)"
  }
  ])
}

function non_bank(data) {
return renderTable(data, [
    { key: "owner's equity", label: "Equity"},
  {
    key: "charter capital margin", label: "Charter capital (%)"
  },
  {
    key: "share premium margin", label: "Share premium (%)"
  },
  {
    key: "retained earnings margin", label: "Retained earnings (%)"
  },
  {
    key: "minority interest margin", label: "Minority interest (%)"
  },
  {
    key: "short -term liabilities margin", label: "Short -term liabilities (%)"
  },
  {
    key: "long-term liabilities margin", label: "Long-term liabilities (%)"
  },
  
  
  { key: "cash margin", label: "Cash (%)"},
  { key: "short-term investments margin",                  label: "Short-term investment (%)"
  },
   
    { key: "net revenue", label: "Net revenue"},
    
    { key: "gross profit", label: "Gross profit"},
    
      
    { key: "financial income margin", label: "Financial income (%)",
      colorRule: { threshold: 10, high: "red", low: "white" }},
    { key: "operating profit", label: "Operating profit"},
    { key: "profit after tax for shareholders of the parent company", label: "Net profit"}
  ])
}

function renderFinancialTable(el) {
  // ideal business high return on equity over time, and keep that high return on equity in an increamental capital
  
  // can I understand it
  
  // high return on capital, compound?
  
  // moat, competitive advantage
  
  // how the CEO
  
  // cost structure
  
  // equity 
  
  // profitability
  
  // price / equity / profit
  
  const data = extractStockData(el);
  if (data == null) return;
  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  scrollBox.className = "scroll-box";
  
  // high return on equity, and increase equity
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.maxWidth = "1000px";
  canvas.style.maxHeight = "500px";
  

  const ctx = canvas.getContext("2d");
  
  const getRow = (name) => data.rows.find(r => r.title.trim().toLowerCase() === name)?.values ?? [];


const is_bank = getRow("owner's equity").length == 0;

const calcRatio = (numerator, denominator, decimals = 0, reverse = false) =>
  numerator.map((v, i) => {
    const div = Array.isArray(denominator) ? denominator[i] : denominator;
    return div ? (reverse ? (1 - v/div) * 100 : (v / div) * 100).toFixed(decimals) : "0";
  });
if (is_bank) {
data.rows.push(
      { title: "equity growth", values: equityGrowthPct }, // Kept as variable due to unique look-back logic
      { title: "minority interest margin", values: calcRatio(getRow("minority interest"), equity) },
      
      { title: "other liabilities margin", values: calcRatio(getRow("other liabilities"), equity) },
      { title: "valuable papers issued margin", values: calcRatio(getRow("valuable papers issued"), equity) },
      { title: "other borrowed funds margin", values: calcRatio(getRow("other borrowed funds"), equity) },
      { title: "derivatives and other financial liabilities margin", values: calcRatio(getRow("derivatives and other financial liabilities"), equity) },
      { title: "deposits from customers margin", values: calcRatio(getRow("deposits from customers"), equity) },
      { title: "deposits and borrowings from other credit institutions margin", values: calcRatio(getRow("deposits and borrowings from other credit institutions"), equity) },
      { title: "amounts due to the government and the state bank of vietnam margin", values: calcRatio(getRow("amounts due to the government and the state bank of vietnam"), equity) },
      
      // Income Statement & Performance
      
      // Balance Sheet (Common Size relative to Equity)
      { title: "cash margin", values: calcRatio(getRow("cash on hand, gold, silver, gemstones"), equity) },
      { title: "balances with and loans to other credit institutions margin", values: calcRatio(getRow("balances with and loans to other credit institutions"), equity) },
      { title: "loans, advances and finance leases to customers margin", values: calcRatio(getRow("loans, advances and finance leases to customers"), equity) },
      { title: "investment securities margin", values: calcRatio(getRow("investment securities"), equity) },
      { title: "other current assets margin", values: calcRatio(getRow("other current assets"), equity) },
      { title: "fixed assets margin", values: calcRatio(getRow("fixed assets"), equity) },
      
      { title: "operating expenses margin", values: calcRatio(getRow("operating expenses"), getRow("operating profit before provision for credit losses")) },
      { title: "operating profit margin", values: calcRatio(getRow("operating profit before provision for credit losses"), revenue) },
      { title: "net profit rate", values: calcRatio(getRow("profit after tax for shareholders of the parent company"), getRow("operating profit before provision for credit losses")) }
      
    );
} else {
const equity = getRow("owner's equity");
const revenue = getRow("net revenue");
const grossProfit = getRow("gross profit");
const sga = getRow("selling expenses");
const fe = getRow("financial expenses");
const ga = getRow("general and administrative expenses");

const cogs = getRow("cost of goods sold");
const pbt = getRow("profit before tax");
const npat = getRow("net profit after tax");
const operatingProfit = getRow("operating profit");
const financialIncome = getRow("financial income");
const netProfit = getRow("net profit after tax");
const parentProfit = getRow("profit after tax for shareholders of the parent company");
// 4. Equity Growth (Unique logic due to look-back)
const equityGrowthPct = equity.map((v, i, arr) => {
  if (i === 0 || !arr[i - 1]) return "0";
  return (((v - arr[i - 1]) / arr[i - 1]) * 100).toFixed(2);
});
    data.rows.push(
  // Income Statement & Performance
  { title: "financial expense margin", values: calcRatio(fe, grossProfit) },
  { title: "selling expense margin", values: calcRatio(sga, grossProfit) },
  { title: "g&a expense margin", values: calcRatio(ga, grossProfit) },
  { title: "cogs margin", values: calcRatio(cogs, revenue) },
  { title: "gross profit margin 2", values: calcRatio(grossProfit, revenue) },
  { title: "tax rate", values: calcRatio(pbt.map((v, i) => v - npat[i]), pbt) },
  { title: "equity growth", values: equityGrowthPct }, // Kept as variable due to unique look-back logic
  { title: "financial income margin", values: calcRatio(financialIncome, operatingProfit) },
  { title: "net profit rate", values: calcRatio(parentProfit, operatingProfit, 0, true) },
  { title: "minority interest share", values: calcRatio(netProfit.map((v, i) => v - parentProfit[i]), netProfit) },

  // Balance Sheet (Common Size relative to Equity)
  { title: "cash margin", values: calcRatio(getRow("cash and cash equivalents"), equity) },
  { title: "short-term investments margin", values: calcRatio(getRow("short-term investments"), equity) },
  { title: "receivables margin", values: calcRatio(getRow("short-term receivables"), equity) },
  { title: "inventories margin", values: calcRatio(getRow("inventories"), equity) },
  { title: "other current assets margin", values: calcRatio(getRow("other current assets"), equity) },
  { title: "fixed assets margin", values: calcRatio(getRow("fixed assets"), equity) },
  { title: "investment properties margin", values: calcRatio(getRow("investment properties"), equity) },
  { title: "long-term investments margin", values: calcRatio(getRow("long-term investments"), equity) },
  { title: "short -term liabilities margin", values: calcRatio(getRow("short -term liabilities"), equity) },
  { title: "long-term liabilities margin", values: calcRatio(getRow("long-term liabilities"), equity) },
  { title: "charter capital margin", values: calcRatio(getRow("charter capital"), equity) },
  { title: "share premium margin", values: calcRatio(getRow("share premium"), equity) },
  { title: "retained earnings margin", values: calcRatio(getRow("retained earnings"), equity) },
  { title: "minority interest margin", values: calcRatio(getRow("minority interest"), equity) }
);
}

  new Chart(ctx, {
      data: {
        labels: data.headers,
        datasets: [
          {
            label: "Equity",
            type: "line",
            data: data.rows.find(r => 
              r.title.trim().toLowerCase() === "owner's equity"
            )?.values ?? [],
            yAxisID: "y1",
            borderWidth: 2,
            fill: false,
            tension: 0.1 // Smooths the line slightly
          },
          {
            label: "Revenue",
            type: "line",
            data: data.rows.find(r => 
              r.title.trim().toLowerCase() === "net revenue"
            )?.values ?? [],
            yAxisID: "y1",
            borderWidth: 2,
            fill: false,
            tension: 0.1 // Smooths the line slightly
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { 
          mode: "index", 
          intersect: false 
        },
        scales: {
          // Keep the right axis for Equity
          y1: {
            type: "linear",
            position: "right",
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              // This adds the "Growth" info to the tooltip on hover
              afterLabel: function(context) {
                const index = context.dataIndex;
                const growthRow = data.rows.find(r => 
                  r.title.trim().toLowerCase() === "equity growth"
                );
                const growthValue = growthRow?.values[index];
                
                return growthValue !== undefined ? `Growth: ${growthValue}%` : '';
              }
            }
          }
        }
      }
    });

  scrollBox.appendChild(canvas);
  

scrollBox.append("Cost structure");
scrollBox.appendChild(cost_structure(data));
scrollBox.append("Capital");
scrollBox.appendChild(is_bank ? bank(data) : non_bank(data));
scrollBox.append("Profitability");
scrollBox.appendChild(renderTable(data, [
  { key: "owner's equity", label: "Equity"},
  { key: "equity growth", label: "Equity growth (%)",
    colorRule: { threshold: 0, high: "green", low: "red" }},
  { key: "roe", label: "ROE",
    colorRule: { threshold: 20, high: "green", low: "white" }},
])
);
  /*scrollBox.appendChild(renderTable(data, [
  { key: "owner's equity", label: "Equity"},
  { key: "equity growth", label: "Equity growth (%)",
    colorRule: { threshold: 0, high: "green", low: "red" }},
  {
    key: "charter capital margin", label: "Charter capital (%)"
  },
  {
    key: "retained earnings margin", label: "Retained earnings (%)"
  },
  {
    key: "short -term liabilities margin", label: "Short -term liabilities (%)"
  },
  {
    key: "long-term liabilities margin", label: "Long-term liabilities (%)"
  },
  
  
  { key: "cash margin", label: "Cash (%)"},
  { key: "short-term investments margin",                  label: "Short-term investment (%)"
  },
  {
    key: "other current assets margin", label: "Other assets(%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "investment properties margin", label: "Investment properties (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "long-term investments margin", label: "Long-term investments (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  }
]));
*/

 
  ui.setContent(scrollBox);
}

hotkeys('s', () => {
    const code = getStockCode();
    const tables = getAllTables();
    browser.runtime.sendMessage({ type: "SEND_STOCK", code, payload: {quarters: JSON.stringify([tables[3], tables[5], tables[7]])}});
    alert("Done");
});
hotkeys('d', () => {
    const code = getStockCode();
    const tables = getAllTables();
    browser.runtime.sendMessage({ type: "SEND_STOCK", code, payload: {years: JSON.stringify([tables[3], tables[5], tables[7]])}});
    alert("Done");
});
hotkeys('f', () => {
  browser.runtime.sendMessage({ type: "FETCH_STOCKS", force: true });
  alert("Done");
});
const STYLES = {
  table: {
    minWidth: "600px", borderCollapse: "separate",
    borderSpacing: "0", background: "#121826", color: "#e6e6e6", fontSize: "13px"
  },
  th: {
    padding: "5px", textAlign: "center", borderBottom: "1px solid #2a3548",
    background: "#141a26", position: "sticky", top: "0", zIndex: "5", cursor: "pointer"
  },
  td:         { padding: "5px", textAlign: "center", borderBottom: "1px solid #1f2a3a" },
  scrollBox:  { width: "100%", height: "100%", overflow: "auto" },
  refreshBtn: {
    padding: "6px 10px", background: "#1f2a3a", color: "#fff",
    border: "1px solid #2a3548", cursor: "pointer"
  },
  actionBtn: {
    padding: "8px 12px", background: "#1f2635",
    color: "#e6e6e6", border: "1px solid #2a3548", borderRadius: "6px", cursor: "pointer"
  }
};
//observe("#data-content-table-body", renderStockTable);
observe("#banggia-khop-lenh", renderStockTable);
observe("#div-content-BCTT", renderFinancialTable);
