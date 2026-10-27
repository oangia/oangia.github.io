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

/**
 * Reusable Firebase Service Class
 * Encapsulates initialization, Cookie management, and Firestore CRUD operations.
 */
export class FirebaseService {
  constructor(cookieName = "firebase_config_cookie", collectionName = "posts") {
    this.cookieName = cookieName;
    this.collectionName = collectionName;
    this.app = null;
    this.db = null;
    this.unsubscribeListener = null;
    this.isCloudMode = false;
  }

  // --- Cookie Helpers ---
  setCookie(value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${this.cookieName}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Strict`;
  }

  getCookie() {
    const nameEQ = this.cookieName + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  eraseCookie() {
    document.cookie = `${this.cookieName}=; Max-Age=-99999999; path=/;`;
  }

  // --- Dynamic Raw Config Parser ---
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
      return JSON.parse(rawText);
    }
  }

  // --- Connection Management ---
  connect(configObj) {
    if (this.app) {
      deleteApp(this.app);
    }
    this.app = initializeApp(configObj);
    this.db = getFirestore(this.app);
    this.isCloudMode = true;
    return this.db;
  }

  disconnect() {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
    if (this.app) {
      deleteApp(this.app);
      this.app = null;
      this.db = null;
    }
    this.isCloudMode = false;
  }

  // --- Firestore Realtime Listener ---
  subscribe(onDataUpdate, onError) {
    if (!this.db || !this.isCloudMode) return;
    
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }

    const postsRef = collection(this.db, this.collectionName);
    const q = query(postsRef, orderBy("createdAt", "desc"));

    this.unsubscribeListener = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let formattedDate = "Just now";
        if (data.createdAt && data.createdAt.toDate) {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }
        return { id: docSnap.id, ...data, formattedDate };
      });
      onDataUpdate(items);
    }, (error) => {
      if (onError) onError(error);
    });
  }

  // --- CRUD API Methods ---
  async createDoc(data) {
    if (this.isCloudMode && this.db) {
      return await addDoc(collection(this.db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
    } else {
      // Local Storage Fallback
      const items = JSON.parse(localStorage.getItem("demo_crud_items") || "[]");
      const newItem = {
        id: "local-" + Date.now(),
        ...data,
        createdAt: new Date().toISOString()
      };
      items.unshift(newItem);
      localStorage.setItem("demo_crud_items", JSON.stringify(items));
      return newItem;
    }
  }

  async updateDocById(id, data) {
    if (this.isCloudMode && this.db) {
      const docRef = doc(this.db, this.collectionName, id);
      return await updateDoc(docRef, data);
    } else {
      let items = JSON.parse(localStorage.getItem("demo_crud_items") || "[]");
      items = items.map(item => item.id === id ? { ...item, ...data } : item);
      localStorage.setItem("demo_crud_items", JSON.stringify(items));
    }
  }

  async deleteDocById(id) {
    if (this.isCloudMode && this.db) {
      const docRef = doc(this.db, this.collectionName, id);
      return await deleteDoc(docRef);
    } else {
      let items = JSON.parse(localStorage.getItem("demo_crud_items") || "[]");
      items = items.filter(item => item.id !== id);
      localStorage.setItem("demo_crud_items", JSON.stringify(items));
    }
  }

  getLocalDocs() {
    const raw = localStorage.getItem("demo_crud_items");
    if (!raw) {
      const initialMock = [
        {
          id: "demo-1",
          title: "Welcome to Modular Firebase CRUD!",
          content: "This table uses a compact view. Click the eye icon under Actions to read full document content in a modal!",
          category: "General",
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem("demo_crud_items", JSON.stringify(initialMock));
      return initialMock.map(item => ({ ...item, formattedDate: new Date(item.createdAt).toLocaleString() }));
    }
    const items = JSON.parse(raw);
    return items.map(item => ({ ...item, formattedDate: new Date(item.createdAt).toLocaleString() }));
  }
}
