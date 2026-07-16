import { Cache, StockAPI, listen } from './utils/background.js';

import { initializeApp } from "./firebase/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "./firebase/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB0TxR5HpNJ8Ph7rnrHqXNMAmBWo1dw5Nw",
    authDomain: "agent52.firebaseapp.com",
    projectId: "agent52",
    storageBucket: "agent52.firebasestorage.app",
    messagingSenderId: "534394830199",
    appId: "1:534394830199:web:521b810d19dbcfe9edb572",
    measurementId: "G-J9RZWL9DZ5"
  };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchAll() {
  const colRef = collection(db, "stocks");
  const snap = await getDocs(colRef);

  const data = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return data;
}

async function upsertStock(db, id, data) {
  const ref = doc(db, "stocks", id);
  await setDoc(ref, data, { merge: true });
}

const cache = new Cache(7 * 24 * 60 * 60 * 1000);
const api = new StockAPI();

async function getStocks({ force = false } = {}) {
  if (!force) {
    const cached = await cache.get("stocks");
    if (cached) {
      return { ok: true, data: cached, cached: true };
    }
  }

  const data = await fetchAll();
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
      const data = await upsertStock(db, msg.code, msg.payload);
      return { ok: true, data };
  }
});

//listen('TRACK_REQUEST');
