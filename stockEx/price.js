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

// ================= MAIN =================
async function renderStockTable(el) {
  // extract data
  //const data = extractTableData(2, {symbol: 1, ref: 2, price: 2});
  const data = extractTableData(2, {symbol: 0, ref: 1, price: 11});
  // create table
  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  const p = makeEl("h3", {}, {textAlign: "center", color: "teal"});
  p.append('High ROE and keep consistent ROE on incremental Equity at mispriced');
  scrollBox.appendChild(p);
  const headers = ["Symbol", "Value", "Trimmed P/B"];
  const {table, tbody} = makeTable(headers[0], headers.slice(1), makeSorter(null));
  const sorter = makeSorter(tbody);
  table.style.margin = "0 auto";
  table.querySelector("thead tr").querySelectorAll("th").forEach((th, i) => {
    th.onclick = () => sorter(i);
  });

  data.forEach(r => {
    const clean = r.symbol.trim().replace(/\*/g, "").split("\n")[0];
    const tr = document.createElement("tr");
    tr.id = "_" + clean;

    [makeSymbolLink(clean), r.price || r.ref, "-"].forEach(content => {
      tr.appendChild(makeCell(content));
    });
    tbody.appendChild(tr);
  });

  scrollBox.appendChild(table);

  ui.setContent(scrollBox);
  // Fetch and populate
  browser.runtime.sendMessage({ type: "FETCH_STOCKS" }, ({ data }) => {
    console.log("THIS IS THE RESPONSE:", data);
    const businesses = data.map(stock => new Business(stock));
    businesses.forEach(business => {
        
        
        const tr = tbody.querySelector("#_" + business.code);
        if (! tr) return;
        if (business.roe.weighted_average() < 4.52) {
            tr.style.display = "none";
        }
        const price = toNumber(tr.children[1].textContent) * 1000;
        console.log(price, business.bvps);
        const pb = price / business.bvps;
        const pbNum = pb.toFixed(2);
        const isUndervalued = pb / business.pb.trimmed_average(3) < 0.5;

        const tdTrimmed = tr.children[2];
        const numTrimmed = Number(business.pb.trimmed_average(3));
        tdTrimmed.innerHTML = isNaN(numTrimmed) ? "-" : (pb / numTrimmed).toFixed(2);
        console.log(business.code, (pb / numTrimmed).toFixed(2));

        if (pb / business.pb.trimmed_average(3) >= 1) {
            tr.children[2].innerHTML = `<span style="color:magenta;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else if (pb / business.pb.trimmed_average(3) >= 0.66) {
            tr.children[2].innerHTML = `<span style="color:yellow;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else {
            tr.children[2].innerHTML = `<span style="color:#00c853;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        }

        tr.addEventListener("mouseenter", (e) => {
            // PB Data
            const min = business.pb.min();
            const max = business.pb.max();
            const med = business.pb.median();
            const avg = business.pb.average();
            const tAvg = business.pb.trimmed_average(3);
            const wAvg = business.pb.weighted_average();

            // PE Data
            const peMin = business.roe.min();
            const peMax = business.roe.max();
            const peMed = business.roe.median();
            const peAvg = business.roe.average();
            const peTAvg = business.roe.trimmed_average(3);
            const peWAvg = business.roe.weighted_average();
    
            // Updated helper to handle any metric
            const ratio = (current, target, threshold = 0.66) => {
              const v = current / target;
              return `<td style="padding:4px; color:${v <= threshold ? 'green' : 'inherit'}">${v.toFixed(2)}</td>`;
            };

            ui.tooltip.innerHTML = `
            <table style="border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #ccc">
                  <th style="padding:4px"></th>
                  <th style="padding:4px">Curr</th>
                  <th style="padding:4px">Min</th>
                  <th style="padding:4px">Max</th>
                  <th style="padding:4px">Med</th>
                  <th style="padding:4px">Avg</th>
                  <th style="padding:4px">tAvg</th>
                  <th style="padding:4px">wAvg</th>
                </tr>
              </thead>
              <tbody>
                <!-- P/B SECTION -->
                <tr>
                  <td style="padding:4px"><b>P/B</b></td>
                  <td style="padding:4px">${pbNum}</td>
                  <td style="padding:4px">${min.toFixed(2)}</td>
                  <td style="padding:4px">${max.toFixed(2)}</td>
                  <td style="padding:4px">${med.toFixed(2)}</td>
                  <td style="padding:4px">${avg.toFixed(2)}</td>
                  <td style="padding:4px">${tAvg.toFixed(2)}</td>
                  <td style="padding:4px">${wAvg.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee">
                  <td style="padding:4px; font-size: 0.8em; color: #666">PB %</td>
                  <td style="padding:4px"></td>
                  ${ratio(pbNum, min, 1)}
                  ${ratio(pbNum, max, 0)}
                  ${ratio(pbNum, med)}
                  ${ratio(pbNum, avg)}
                  ${ratio(pbNum, tAvg)}
                  ${ratio(pbNum, wAvg)}
                </tr>
                <!-- P/E SECTION -->
                <tr>
                  <td style="padding:4px"><b>ROE</b></td>
                  <td style="padding:4px"></td>
                  <td style="padding:4px">${peMin.toFixed(2)}</td>
                  <td style="padding:4px">${peMax.toFixed(2)}</td>
                  <td style="padding:4px">${peMed.toFixed(2)}</td>
                  <td style="padding:4px">${peAvg.toFixed(2)}</td>
                  <td style="padding:4px">${peTAvg.toFixed(2)}</td>
                  <td style="padding:4px">${peWAvg.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            `;
            ui.tooltip.style.display = "block";
        });
        
      });
      ui.renderContent();
  });
  
  
}
