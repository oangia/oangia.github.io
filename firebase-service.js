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

    // Hardcoded project identifiers
    this.defaultConfig = {
      projectId: "freedata-4c235",
      appId: "1:906764667278:web:aa229456f8de0740923cdf"
    };
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

    const trimmed = rawText.trim();

    // If it's passed as a plain API key string (doesn't start with '{' and has no object declarations)
    if (!trimmed.startsWith('{') && !trimmed.includes('firebaseConfig')) {
      return {
        ...this.defaultConfig,
        apiKey: trimmed
      };
    }

    try {
      const evalFn = new Function(`
        let firebaseConfig;
        ${trimmed};
        if (typeof firebaseConfig !== 'undefined') return firebaseConfig;
      `);
      const res = evalFn();
      if (res) return { ...this.defaultConfig, ...res };
    } catch (e) {}

    try {
      const evalFn2 = new Function(`return (${trimmed});`);
      const res = evalFn2();
      if (res) return { ...this.defaultConfig, ...res };
    } catch (e2) {
      try { 
        const parsed = JSON.parse(trimmed);
        return { ...this.defaultConfig, ...parsed };
      } catch (e3) { 
        // Fallback to treating input purely as the apiKey string
        return {
          ...this.defaultConfig,
          apiKey: trimmed
        };
      }
    }
  }

  connect(configInput) {
    try {
      if (this.app) deleteApp(this.app);
      
      // Resolve configuration whether input is a raw API key string, a snippet, or an object
      const resolvedConfig = typeof configInput === 'string' 
        ? this.parseConfig(configInput) 
        : { ...this.defaultConfig, ...configInput };

      if (!resolvedConfig || !resolvedConfig.apiKey) {
        throw new Error("Valid API key is required to connect to Firebase.");
      }

      this.app = initializeApp(resolvedConfig);
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
