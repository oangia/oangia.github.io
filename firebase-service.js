import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where,
  orderBy 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export class FirebaseService {
  constructor(cookieName = "firebase_config_cookie") {
    this.cookieName = cookieName;
    this.app = null;
    this.db = null;
    this.unsubscribeMap = {};
    this.isLiveMode = false;
  }

  setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Strict`;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  eraseCookie(name) {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }

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
      const evalFn2 = new Function(`return (${rawText});`);
      return evalFn2();
    } catch (e2) {
      try { return JSON.parse(rawText); } catch (e3) { return null; }
    }
  }

  connect(config) {
    try {
      if (this.app) deleteApp(this.app);
      this.app = initializeApp(config);
      this.db = getFirestore(this.app);
      this.isLiveMode = true;
      return true;
    } catch (err) {
      console.error("Firebase connect failed:", err);
      this.isLiveMode = false;
      return false;
    }
  }

  // Generic Realtime Listener for any collection
  subscribe(collectionName, callback) {
    if (!this.db || !this.isLiveMode) return;
    
    if (this.unsubscribeMap[collectionName]) {
      this.unsubscribeMap[collectionName]();
    }

    const q = query(collection(this.db, collectionName), orderBy("createdAt", "desc"));
    this.unsubscribeMap[collectionName] = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let formattedDate = "Just now";
        if (data && data.createdAt && typeof data.createdAt.toDate === "function") {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }
        return { id: docSnap.id, ...data, formattedDate };
      });
      callback(items);
    });
  }

  // On-Demand Fetch Methods
  async getAll(collectionName) {
    if (this.isLiveMode && this.db) {
      const q = query(collection(this.db, collectionName), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } else {
      return this.getLocal(collectionName);
    }
  }

  async getById(collectionName, id) {
    if (this.isLiveMode && this.db) {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } else {
      const items = this.getLocal(collectionName);
      return items.find(i => i.id === id) || null;
    }
  }

  async getByField(collectionName, fieldName, value) {
    if (this.isLiveMode && this.db) {
      const q = query(collection(this.db, collectionName), where(fieldName, "==", value));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } else {
      const items = this.getLocal(collectionName);
      return items.filter(i => i[fieldName] === value);
    }
  }

  // Generic CRUD
  async create(collectionName, data) {
    if (this.isLiveMode && this.db) {
      return await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
    } else {
      const key = `demo_${collectionName}`;
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      const newItem = { 
        id: "local-" + Date.now(), 
        ...data, 
        createdAt: new Date().toISOString(),
        formattedDate: new Date().toLocaleString()
      };
      items.unshift(newItem);
      localStorage.setItem(key, JSON.stringify(items));
      return newItem;
    }
  }

  async update(collectionName, id, updatedFields) {
    if (this.isLiveMode && this.db) {
      return await updateDoc(doc(this.db, collectionName, id), updatedFields);
    } else {
      const key = `demo_${collectionName}`;
      let items = JSON.parse(localStorage.getItem(key) || "[]");
      items = items.map(i => i.id === id ? { ...i, ...updatedFields } : i);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  async delete(collectionName, id) {
    if (this.isLiveMode && this.db) {
      return await deleteDoc(doc(this.db, collectionName, id));
    } else {
      const key = `demo_${collectionName}`;
      let items = JSON.parse(localStorage.getItem(key) || "[]");
      items = items.filter(i => i.id !== id);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  getLocal(collectionName) {
    const key = `demo_${collectionName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }
}
