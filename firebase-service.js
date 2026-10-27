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
    this.unsubscribeFolders = null;
    this.isLiveMode = false;
    
    this.notesCollection = "posts";
    this.foldersCollection = "folders";
    this.filesCollection = "files";
    this.chunksCollection = "file_chunks";
    
    this.cachedNotes = [];
    this.cachedFolders = [];
    this.cachedFiles = [];
    
    this.onNotesChangeCallback = null;
    this.onFoldersChangeCallback = null;
    this.onFilesChangeCallback = null;
    this.onStatusChangeCallback = null;
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

  init(onNotesChange, onFoldersChange, onFilesChange, onStatusChange) {
    this.onNotesChangeCallback = onNotesChange;
    this.onFoldersChangeCallback = onFoldersChange;
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
    if (this.unsubscribeFolders) this.unsubscribeFolders();
    if (this.unsubscribeFiles) this.unsubscribeFiles();
    if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);

    if (!localStorage.getItem("demo_notes")) {
      localStorage.setItem("demo_notes", JSON.stringify([
        { id: "note-1", title: "Project Roadmap", category: "Work", content: "Standard text note item.", createdAt: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem("demo_folders")) {
      localStorage.setItem("demo_folders", JSON.stringify([
        { id: "folder-1", name: "Images & Photos", parentId: "root", createdAt: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem("demo_files")) {
      localStorage.setItem("demo_files", JSON.stringify([]));
    }
    if (!localStorage.getItem("demo_chunks")) {
      localStorage.setItem("demo_chunks", JSON.stringify([]));
    }

    this.readLocalNotes();
    this.readLocalFolders();
    this.readLocalFiles();
  }

  subscribeAll() {
    if (!this.db || !this.isLiveMode) return;

    // Notes
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

    // Folders
    const qFolders = query(collection(this.db, this.foldersCollection), orderBy("createdAt", "asc"));
    if (this.unsubscribeFolders) this.unsubscribeFolders();
    this.unsubscribeFolders = onSnapshot(qFolders, (snapshot) => {
      this.cachedFolders = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      if (this.onFoldersChangeCallback) this.onFoldersChangeCallback(this.cachedFolders);
    });

    // Files
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
    this.cachedNotes = (raw ? JSON.parse(raw) : []).map(i => ({ ...i, formattedDate: new Date(i.createdAt).toLocaleString() }));
    if (this.onNotesChangeCallback) this.onNotesChangeCallback(this.cachedNotes);
  }

  readLocalFolders() {
    const raw = localStorage.getItem("demo_folders");
    this.cachedFolders = raw ? JSON.parse(raw) : [];
    if (this.onFoldersChangeCallback) this.onFoldersChangeCallback(this.cachedFolders);
  }

  readLocalFiles() {
    const raw = localStorage.getItem("demo_files");
    this.cachedFiles = (raw ? JSON.parse(raw) : []).map(i => ({ ...i, formattedDate: new Date(i.createdAt).toLocaleString() }));
    if (this.onFilesChangeCallback) this.onFilesChangeCallback(this.cachedFiles);
  }

  // Notes CRUD
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

  async deleteNote(id) {
    if (this.isLiveMode && this.db) {
      return await deleteDoc(doc(this.db, this.notesCollection, id));
    } else {
      let items = JSON.parse(localStorage.getItem("demo_notes") || "[]");
      items = items.filter(i => i.id !== id);
      localStorage.setItem("demo_notes", JSON.stringify(items));
      this.readLocalNotes();
    }
  }

  // Folder Management
  async createFolder(name, parentId = "root") {
    if (this.isLiveMode && this.db) {
      return await addDoc(collection(this.db, this.foldersCollection), { name, parentId, createdAt: serverTimestamp() });
    } else {
      const folders = JSON.parse(localStorage.getItem("demo_folders") || "[]");
      const newFolder = { id: "folder-" + Date.now(), name, parentId, createdAt: new Date().toISOString() };
      folders.push(newFolder);
      localStorage.setItem("demo_folders", JSON.stringify(folders));
      this.readLocalFolders();
      return newFolder;
    }
  }

  async deleteFolder(folderId) {
    if (this.isLiveMode && this.db) {
      await deleteDoc(doc(this.db, this.foldersCollection, folderId));
    } else {
      let folders = JSON.parse(localStorage.getItem("demo_folders") || "[]");
      folders = folders.filter(f => f.id !== folderId);
      localStorage.setItem("demo_folders", JSON.stringify(folders));
      this.readLocalFolders();
    }
  }

  // Chunked File Upload with Thumbnail
  async uploadFileInChunks(fileTitle, category, folderId, base64Data, thumbnailBase64 = "") {
    const CHUNK_SIZE = 700000; // ~700KB chunks
    const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
    const fileId = "file_" + Date.now();

    if (this.isLiveMode && this.db) {
      await addDoc(collection(this.db, this.filesCollection), {
        fileId,
        title: fileTitle,
        category,
        folderId,
        totalParts,
        thumbnail: thumbnailBase64,
        createdAt: serverTimestamp()
      });

      for (let i = 0; i < totalParts; i++) {
        const chunkData = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await addDoc(collection(this.db, this.chunksCollection), {
          fileId,
          partIndex: i,
          chunkData
        });
      }
    } else {
      const files = JSON.parse(localStorage.getItem("demo_files") || "[]");
      const chunks = JSON.parse(localStorage.getItem("demo_chunks") || "[]");

      const meta = {
        id: fileId,
        fileId,
        title: fileTitle,
        category,
        folderId,
        totalParts,
        thumbnail: thumbnailBase64,
        createdAt: new Date().toISOString()
      };
      files.unshift(meta);
      localStorage.setItem("demo_files", JSON.stringify(files));

      for (let i = 0; i < totalParts; i++) {
        chunks.push({
          fileId,
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
      chunksList = querySnapshot.docs.map(d => d.data());
    } else {
      const chunks = JSON.parse(localStorage.getItem("demo_chunks") || "[]");
      chunksList = chunks.filter(c => c.fileId === fileId);
    }
    chunksList.sort((a, b) => a.partIndex - b.partIndex);
    return chunksList.map(c => c.chunkData).join("");
  }

  async deleteFile(id, fileId) {
    if (this.isLiveMode && this.db) {
      await deleteDoc(doc(this.db, this.filesCollection, id));
      const q = query(collection(this.db, this.chunksCollection), where("fileId", "==", fileId));
      const querySnapshot = await getDocs(q);
      await Promise.all(querySnapshot.docs.map(d => deleteDoc(d.ref)));
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
    const exportData = { notes: this.cachedNotes, folders: this.cachedFolders, files: this.cachedFiles };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `firebase_file_manager_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
