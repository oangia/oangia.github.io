import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  onSnapshot, 
  doc, 
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
    this.unsubscribeNotes = null;
    this.unsubscribeFiles = null;
    this.isLiveMode = false;
    this.notesCollection = "posts";
    this.filesCollection = "files";
    this.chunksCollection = "file_chunks";
    
    this.cachedNotes = [];
    this.cachedFiles = [];
    this.onNotesChangeCallback = null;
    this.onFilesChangeCallback = null;
    this.onStatusChangeCallback = null;
  }

  // Cookie Helpers
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

  init(onNotesChange, onFilesChange, onStatusChange) {
    this.onNotesChangeCallback = onNotesChange;
    this.onFilesChangeCallback = onFilesChange;
    this.onStatusChangeCallback = onStatusChange;

    const savedConfigStr = this.getCookie(this.cookieName);
    if (savedConfigStr) {
      const configObj = this.parseConfig(savedConfigStr);
      if (configObj) {
        this.connect(configObj);
        return savedConfigStr;
      }
    }

    this.startLocalMode();
    return null;
  }

  connect(config) {
    try {
      if (this.app) deleteApp(this.app);
      this.app = initializeApp(config);
      this.db = getFirestore(this.app);
      this.isLiveMode = true;

      if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);
      this.subscribeAll();
    } catch (err) {
      console.error("Firebase connect failed:", err);
      if (this.onStatusChangeCallback) this.onStatusChangeCallback(false, err.message);
      this.startLocalMode();
    }
  }

  startLocalMode() {
    this.isLiveMode = false;
    if (this.unsubscribeNotes) this.unsubscribeNotes();
    if (this.unsubscribeFiles) this.unsubscribeFiles();
    if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);

    if (!localStorage.getItem("demo_notes")) {
      localStorage.setItem("demo_notes", JSON.stringify([
        { id: "note-1", title: "Project Overview", category: "Work", content: "This is a standard text note.", createdAt: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem("demo_files")) {
      localStorage.setItem("demo_files", JSON.stringify([]));
    }
    if (!localStorage.getItem("demo_chunks")) {
      localStorage.setItem("demo_chunks", JSON.stringify([]));
    }

    this.readLocalNotes();
    this.readLocalFiles();
  }

  subscribeAll() {
    if (!this.db || !this.isLiveMode) return;

    // 1. Subscribe Notes
    const qNotes = query(collection(this.db, this.notesCollection), orderBy("createdAt", "desc"));
    if (this.unsubscribeNotes) this.unsubscribeNotes();
    this.unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
      this.cachedNotes = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let formattedDate = "Just now";
        if (data && data.createdAt && typeof data.createdAt.toDate === "function") {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }
        return { id: docSnap.id, ...data, formattedDate };
      });
      if (this.onNotesChangeCallback) this.onNotesChangeCallback(this.cachedNotes);
    });

    // 2. Subscribe Files Metadata
    const qFiles = query(collection(this.db, this.filesCollection), orderBy("createdAt", "desc"));
    if (this.unsubscribeFiles) this.unsubscribeFiles();
    this.unsubscribeFiles = onSnapshot(qFiles, (snapshot) => {
      this.cachedFiles = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let formattedDate = "Just now";
        if (data && data.createdAt && typeof data.createdAt.toDate === "function") {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }
        return { id: docSnap.id, ...data, formattedDate };
      });
      if (this.onFilesChangeCallback) this.onFilesChangeCallback(this.cachedFiles);
    });
  }

  readLocalNotes() {
    const raw = localStorage.getItem("demo_notes");
    const items = raw ? JSON.parse(raw) : [];
    this.cachedNotes = items.map(item => ({
      ...item,
      formattedDate: new Date(item.createdAt).toLocaleString()
    }));
    if (this.onNotesChangeCallback) this.onNotesChangeCallback(this.cachedNotes);
  }

  readLocalFiles() {
    const raw = localStorage.getItem("demo_files");
    const items = raw ? JSON.parse(raw) : [];
    this.cachedFiles = items.map(item => ({
      ...item,
      formattedDate: new Date(item.createdAt).toLocaleString()
    }));
    if (this.onFilesChangeCallback) this.onFilesChangeCallback(this.cachedFiles);
  }

  // --- NOTES CRUD ---
  async createNote(item) {
    if (this.isLiveMode && this.db) {
      return await addDoc(collection(this.db, this.notesCollection), { ...item, createdAt: serverTimestamp() });
    } else {
      const items = JSON.parse(localStorage.getItem("demo_notes") || "[]");
      const newItem = { id: "local-note-" + Date.now(), ...item, createdAt: new Date().toISOString() };
      items.unshift(newItem);
      localStorage.setItem("demo_notes", JSON.stringify(items));
      this.readLocalNotes();
      return newItem;
    }
  }

  async updateNote(id, updatedFields) {
    if (this.isLiveMode && this.db) {
      return await updateDoc(doc(this.db, this.notesCollection, id), updatedFields);
    } else {
      let items = JSON.parse(localStorage.getItem("demo_notes") || "[]");
      items = items.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      localStorage.setItem("demo_notes", JSON.stringify(items));
      this.readLocalNotes();
    }
  }

  async deleteNote(id) {
    if (this.isLiveMode && this.db) {
      return await deleteDoc(doc(this.db, this.notesCollection, id));
    } else {
      let items = JSON.parse(localStorage.getItem("demo_notes") || "[]");
      items = items.filter(item => item.id !== id);
      localStorage.setItem("demo_notes", JSON.stringify(items));
      this.readLocalNotes();
    }
  }

  // --- CHUNKED FILE UPLOAD CRUD (Bypasses 1MB Limit) ---
  async uploadFileInChunks(fileTitle, category, base64Data) {
    const CHUNK_SIZE = 700000; // ~700KB per chunk (safe under 1MB limit)
    const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
    const fileId = "file_" + Date.now();

    if (this.isLiveMode && this.db) {
      // 1. Save File Metadata
      await addDoc(collection(this.db, this.filesCollection), {
        fileId: fileId,
        title: fileTitle,
        category: category,
        totalParts: totalParts,
        createdAt: serverTimestamp()
      });

      // 2. Save Chunks
      for (let i = 0; i < totalParts; i++) {
        const chunkData = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await addDoc(collection(this.db, this.chunksCollection), {
          fileId: fileId,
          partIndex: i,
          chunkData: chunkData
        });
      }
    } else {
      // Local Storage Mode
      const files = JSON.parse(localStorage.getItem("demo_files") || "[]");
      const chunks = JSON.parse(localStorage.getItem("demo_chunks") || "[]");

      const newFileMeta = {
        id: fileId,
        fileId: fileId,
        title: fileTitle,
        category: category,
        totalParts: totalParts,
        createdAt: new Date().toISOString()
      };
      files.unshift(newFileMeta);
      localStorage.setItem("demo_files", JSON.stringify(files));

      for (let i = 0; i < totalParts; i++) {
        chunks.push({
          fileId: fileId,
          partIndex: i,
          chunkData: base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        });
      }
      localStorage.setItem("demo_chunks", JSON.stringify(chunks));
      this.readLocalFiles();
    }
  }

  async getReassembledFileBase64(fileId) {
    let chunksList = [];

    if (this.isLiveMode && this.db) {
      const q = query(collection(this.db, this.chunksCollection), where("fileId", "==", fileId));
      const querySnapshot = await getDocs(q);
      chunksList = querySnapshot.docs.map(doc => doc.data());
    } else {
      const chunks = JSON.parse(localStorage.getItem("demo_chunks") || "[]");
      chunksList = chunks.filter(c => c.fileId === fileId);
    }

    // Sort by partIndex and combine
    chunksList.sort((a, b) => a.partIndex - b.partIndex);
    return chunksList.map(c => c.chunkData).join("");
  }

  async deleteFile(id, fileId) {
    if (this.isLiveMode && this.db) {
      // Delete metadata doc
      await deleteDoc(doc(this.db, this.filesCollection, id));
      // Delete all related chunk docs
      const q = query(collection(this.db, this.chunksCollection), where("fileId", "==", fileId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } else {
      let files = JSON.parse(localStorage.getItem("demo_files") || "[]");
      let chunks = JSON.parse(localStorage.getItem("demo_chunks") || "[]");
      files = files.filter(f => f.id !== id);
      chunks = chunks.filter(c => c.fileId !== fileId);
      localStorage.setItem("demo_files", JSON.stringify(files));
      localStorage.setItem("demo_chunks", JSON.stringify(chunks));
      this.readLocalFiles();
    }
  }

  downloadBackup() {
    const exportData = { notes: this.cachedNotes, files: this.cachedFiles };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `firebase_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
