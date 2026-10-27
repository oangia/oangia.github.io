import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export class FirebaseService {
  constructor(cookieName = "firebase_config_cookie") {
    this.cookieName = cookieName;
    this.app = null;
    this.db = null;
    this.unsubscribe = null;
    this.isLiveMode = false;
    this.collectionName = "posts";
    this.cachedItems = [];
    this.onDataChangeCallback = null;
    this.onStatusChangeCallback = null;
  }

  // Cookie Helpers
  setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Strict`; }  getCookie(name) { const nameEQ = name + "="; const ca = document.cookie.split(';'); for (let i = 0; i < ca.length; i++) { let c = ca[i].trim(); if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length)); } return null; }  eraseCookie(name) { document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }

  // Parse Raw Config text without strict checking
  parseConfig(rawText) {
    if (!rawText || !rawText.trim()) return null;
    try {
      const evalFn = new Function(`
        let firebaseConfig;
        ${rawText};
        if (typeof firebaseConfig !== 'undefined') return firebaseConfig;
      `);
      const res = evalFn();
      if (res) return res;
    } catch (e) {}

    try {
      const evalFn2 = new Function(`return (${rawText});`); return evalFn2(); } catch (e2) { try { return JSON.parse(rawText); } catch (e3) { return null; } } }  // Initialize Connection or Local Fallback init(onDataChange, onStatusChange) { this.onDataChangeCallback = onDataChange; this.onStatusChangeCallback = onStatusChange;  const savedConfigStr = this.getCookie(this.cookieName); if (savedConfigStr) { const configObj = this.parseConfig(savedConfigStr); if (configObj) { this.connect(configObj); return savedConfigStr; } }  this.startLocalMode(); return null; }  connect(config) { try { if (this.app) deleteApp(this.app); this.app = initializeApp(config); this.db = getFirestore(this.app); this.isLiveMode = true;  if (this.onStatusChangeCallback) this.onStatusChangeCallback(true); this.subscribe(); } catch (err) { console.error("Firebase connect failed:", err); if (this.onStatusChangeCallback) this.onStatusChangeCallback(false, err.message); this.startLocalMode(); } }  startLocalMode() { this.isLiveMode = false; if (this.unsubscribe) this.unsubscribe(); if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);  if (!localStorage.getItem("demo_crud_items")) { const mock = [ { id: "demo-1", title: "Welcome to Notes App", category: "General", content: "Click the + New Note button above to add notes inside a popup modal. You can backup your data using the Backup button anytime!", createdAt: new Date().toISOString() } ]; localStorage.setItem("demo_crud_items", JSON.stringify(mock)); } this.readLocal(); }  subscribe() { if (!this.db \vert{}\vert{} !this.isLiveMode) return; const q = query(collection(this.db, this.collectionName), orderBy("createdAt", "desc"));  if (this.unsubscribe) this.unsubscribe();  this.unsubscribe = onSnapshot(q, (snapshot) => { this.cachedItems = snapshot.docs.map(docSnap => { const data = docSnap.data(); let formattedDate = "Just now"; if (data.createdAt && data.createdAt.toDate) { formattedDate = data.createdAt.toDate().toLocaleString(); } return { id: docSnap.id, ...data, formattedDate }; }); if (this.onDataChangeCallback) this.onDataChangeCallback(this.cachedItems); }); }  readLocal() { const raw = localStorage.getItem("demo_crud_items"); const items = raw ? JSON.parse(raw) : []; this.cachedItems = items.map(item => ({ ...item, formattedDate: new Date(item.createdAt).toLocaleString() })); if (this.onDataChangeCallback) this.onDataChangeCallback(this.cachedItems); }  // CRUD Operations async create(item) { if (this.isLiveMode && this.db) { return await addDoc(collection(this.db, this.collectionName), { ...item, createdAt: serverTimestamp() }); } else { const items = JSON.parse(localStorage.getItem("demo_crud_items") \vert{}\vert{} "[]"); const newItem = { id: "local-" + Date.now(), ...item, createdAt: new Date().toISOString() }; items.unshift(newItem); localStorage.setItem("demo_crud_items", JSON.stringify(items)); this.readLocal(); return newItem; } }  async update(id, updatedFields) { if (this.isLiveMode && this.db) { const ref = doc(this.db, this.collectionName, id); return await updateDoc(ref, updatedFields); } else { let items = JSON.parse(localStorage.getItem("demo_crud_items") \vert{}\vert{} "[]"); items = items.map(item => item.id === id ? { ...item, ...updatedFields } : item); localStorage.setItem("demo_crud_items", JSON.stringify(items)); this.readLocal(); } }  async delete(id) { if (this.isLiveMode && this.db) { return await deleteDoc(doc(this.db, this.collectionName, id)); } else { let items = JSON.parse(localStorage.getItem("demo_crud_items") \vert{}\vert{} "[]"); items = items.filter(item => item.id !== id); localStorage.setItem("demo_crud_items", JSON.stringify(items)); this.readLocal(); } }  // Export / Backup Helper downloadBackup() { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.cachedItems, null, 2)); const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", `firebase_notes_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
