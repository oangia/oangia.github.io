import { Cache, listen } from './utils/background.js';
import { Firebase } from "./firebase/facade.js";

const firebase = new Firebase({
  apiKey: "AIzaSyB0TxR5HpNJ8Ph7rnrHqXNMAmBWo1dw5Nw",
  authDomain: "agent52.firebaseapp.com",
  projectId: "agent52",
  storageBucket: "agent52.firebasestorage.app",
  messagingSenderId: "534394830199",
  appId: "1:534394830199:web:521b810d19dbcfe9edb572",
  measurementId: "G-J9RZWL9DZ5"
});

const cache = new Cache(7 * 24 * 60 * 60 * 1000);
const api = new StockAPI();

async function getStocks({ force = false } = {}) {
  if (!force) {
    const cached = await cache.get("stocks");
    if (cached) {
      return { ok: true, data: cached, cached: true };
    }
  }

  const data = await firebase.all("stocks");
  await cache.set("stocks", data);

  return { ok: true, data, cached: false };
}

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "fetch_script") {
    const resp = await fetch(msg.url);
    const code = await resp.text();
    return { code }; 
  }
  switch (msg.type) {
    case "FETCH_STOCKS":
      return await getStocks({ force: msg.force })
        .catch(err => ({ ok: false, error: err.toString() }));

    case "SEND_STOCK":
      const data = await firebase.update("stocks", msg.code, msg.payload, true, { merge: true });
      return { ok: true, data };
  }
});

//listen('TRACK_REQUEST');
