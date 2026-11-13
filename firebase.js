import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    doc,
    serverTimestamp, 
    query, 
    orderBy,
    where 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const StorageHelper = {
    set(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    },
    get(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
};

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
    }
    init(apiKey) {
        this.app = initializeApp({
            projectId: "freedata-4c235",
            appId: "1:906764667278:web:aa229456f8de0740923cdf",
            apiKey: apiKey
        });
        this.db = getFirestore(this.app);
    }
    async create(collectionName, data) {
        if (!this.db) throw new Error("Database not initialized.");
        return await addDoc(collection(this.db, collectionName), {
            ...data,
            createdAt: serverTimestamp()
        });
    }
    async getAllFilenames(collectionName) {
        if (!this.db) return [];
        const q = query(
            collection(this.db, collectionName), 
            where("isMetadata", "==", true),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                filename: data.filename,
                type: data.type || "application/octet-stream",
                totalParts: data.totalParts || 1,
                createdAt: data.createdAt
            };
        });
    }
    async uploadFile(collectionName, file, onProgress = () => {}) {
        const readFileAsDataURL = (fileObj) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(fileObj);
            });
        };
        onProgress("Reading file...");
        const base64Data = await readFileAsDataURL(file);
        const CHUNK_SIZE = 700000; // ~700KB chunks
        const totalParts = Math.ceil(base64Data.length / CHUNK_SIZE);
        
        onProgress("Creating file record...");
        await this.create(collectionName, {
            filename: file.name,
            type: file.type,
            totalParts,
            isMetadata: true
        });
        
        for (let c = 0; c < totalParts; c++) {
            onProgress(`Uploading chunk ${c + 1}/${totalParts}...`);
            const chunkData = base64Data.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
            await this.create(collectionName, {
                filename: file.name,
                partIndex: c,
                chunkData,
                isMetadata: false
            });
        }
        onProgress("Upload complete!");
        return file.name;
    }
    async getFileByFilename(collectionName, filename, onProgress = () => {}) {
        if (!this.db) return null;
        onProgress(`Fetching chunks for ${filename}...`);
        const q = query(
            collection(this.db, collectionName), 
            where("filename", "==", filename),
            where("isMetadata", "==", false)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const chunks = [];
        let fileType = "";
        const metaQuery = query(
            collection(this.db, collectionName), 
            where("filename", "==", filename),
            where("isMetadata", "==", true)
        );
        const metaSnapshot = await getDocs(metaQuery);
        if (!metaSnapshot.empty) {
            fileType = metaSnapshot.docs[0].data().type;
        }
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            chunks[data.partIndex] = data.chunkData;
        });
        onProgress(`Reassembling file...`);
        const fullBase64 = chunks.join("");
        return {
            filename,
            type: fileType || "application/octet-stream",
            dataUrl: fullBase64
        };
    }
    async deleteFileByFilename(collectionName, filename, onProgress = () => {}) {
        if (!this.db) return;
        onProgress(`Deleting ${filename}...`);
        const q = query(
            collection(this.db, collectionName), 
            where("filename", "==", filename)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;
        const deletePromises = snapshot.docs.map(docSnap => 
            deleteDoc(doc(this.db, collectionName, docSnap.id))
        );
        await Promise.all(deletePromises);
        onProgress(`Successfully deleted ${filename}!`);
    }
}

export class FirebaseUploaderWidget {
    constructor(collectionName = "uploaded_files") {
        this.collectionName = collectionName;
        this.storageKey = "firebase_api_key";
        this.fbService = new FirebaseService();
        this.isRendered = false;
    }

    init(triggerBtnId) {
        const triggerBtn = document.getElementById(triggerBtnId);
        if (!triggerBtn) {
            console.error(`Trigger button with ID "${triggerBtnId}" not found.`);
            return;
        }

        triggerBtn.addEventListener("click", () => {
            if (this.isRendered) return; // Prevent duplicate rendering
            this._renderPanel();
            this._bindEvents();
            this.isRendered = true;
            triggerBtn.style.display = "none"; // Optionally hide toggle trigger after opening
        });
    }

    _renderPanel() {
        // Inject scoped styles and HTML structure dynamically
        const style = document.createElement("style");
        style.innerHTML = `
            .fb-widget-container { font-family: sans-serif; max-width: 650px; margin: 20px auto; padding: 20px; line-height: 1.6; border: 2px dashed #0066cc; border-radius: 8px; background: #fff; }
            .fb-widget-container .card { background: #f9f9f9; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .fb-widget-container input, .fb-widget-container button { padding: 10px; margin-top: 5px; margin-bottom: 15px; width: 100%; box-sizing: border-box; }
            .fb-widget-container button { background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .fb-widget-container button:hover { background: #0052a3; }
            .fb-widget-container #fb-status { font-weight: bold; color: #333; margin-top: 10px; }
            .fb-widget-container ul { padding-left: 0; list-style: none; }
            .fb-widget-container li { background: #fff; border: 1px solid #eee; padding: 10px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
            .fb-widget-container .btn-group { display: flex; gap: 6px; }
            .fb-widget-container li button { width: auto; margin: 0; padding: 5px 10px; font-size: 12px; }
            .fb-widget-container .btn-download { background: #28a745; }
            .fb-widget-container .btn-download:hover { background: #218838; }
            .fb-widget-container .btn-delete { background: #dc3545; }
            .fb-widget-container .btn-delete:hover { background: #c82333; }
            .fb-widget-container .file-info span { display: block; font-size: 14px; }
            .fb-widget-container .file-info small { color: #666; font-size: 12px; }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.className = "fb-widget-container";
        container.innerHTML = `
            <h2>Firebase Chunked Uploader (Single Collection)</h2>
            <div class="card">
                <h3>Enter Firebase API Key</h3>
                <label for="fb-apiKeyInput">API Key:</label>
                <input type="text" id="fb-apiKeyInput" placeholder="Paste your Firebase API Key here">
                <button id="fb-initBtn">Connect Firebase</button>
                <div id="fb-connectionStatus">Status: Not connected</div>
            </div>
            <div class="card" id="fb-uploadCard" style="opacity: 0.5; pointer-events: none;">
                <h3>2. Upload File</h3>
                <input type="file" id="fb-fileInput">
                <button id="fb-uploadBtn">Upload File in Chunks</button>
                <div id="fb-status"></div>
            </div>
            <div class="card" id="fb-listCard" style="opacity: 0.5; pointer-events: none;">
                <h3>3. Uploaded Files in Collection</h3>
                <button id="fb-refreshBtn">Refresh File List</button>
                <ul id="fb-fileList"></ul>
            </div>
        `;

        document.body.appendChild(container);
    }

    _bindEvents() {
        const apiKeyInput = document.getElementById("fb-apiKeyInput");
        const initBtn = document.getElementById("fb-initBtn");
        const connectionStatus = document.getElementById("fb-connectionStatus");
        const uploadCard = document.getElementById("fb-uploadCard");
        const listCard = document.getElementById("fb-listCard");
        const fileInput = document.getElementById("fb-fileInput");
        const uploadBtn = document.getElementById("fb-uploadBtn");
        const statusDiv = document.getElementById("fb-status");
        const refreshBtn = document.getElementById("fb-refreshBtn");
        const fileList = document.getElementById("fb-fileList");

        initBtn.addEventListener("click", () => {
            const key = apiKeyInput.value.trim();
            if (!key) {
                alert("Please enter a valid API Key.");
                return;
            }
            try {
                this.fbService.init(key);
                StorageHelper.set(this.storageKey, key);
                
                connectionStatus.textContent = "Status: Connected ✅";
                connectionStatus.style.color = "green";
                uploadCard.style.opacity = "1";
                uploadCard.style.pointerEvents = "auto";
                listCard.style.opacity = "1";
                listCard.style.pointerEvents = "auto";
                this._loadFiles(fileList, statusDiv);
            } catch (err) {
                console.error(err);
                connectionStatus.textContent = "Status: Connection Failed ❌";
                connectionStatus.style.color = "red";
            }
        });

        // Auto-load if saved
        const savedApiKey = StorageHelper.get(this.storageKey);
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            initBtn.click();
        }

        uploadBtn.addEventListener("click", async () => {
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a file first.");
                return;
            }
            uploadBtn.disabled = true;
            try {
                await this.fbService.uploadFile(this.collectionName, file, (msg) => {
                    statusDiv.textContent = msg;
                });
                fileInput.value = "";
                this._loadFiles(fileList, statusDiv);
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Error: " + err.message;
            } finally {
                uploadBtn.disabled = false;
            }
        });

        refreshBtn.addEventListener("click", () => this._loadFiles(fileList, statusDiv));
    }

    async _loadFiles(fileListEl, statusDiv) {
        fileListEl.innerHTML = "<li>Loading files...</li>";
        try {
            const files = await this.fbService.getAllFilenames(this.collectionName);
            fileListEl.innerHTML = "";
            if (files.length === 0) {
                fileListEl.innerHTML = "<li>No files found in collection.</li>";
                return;
            }
            files.forEach(f => {
                const li = document.createElement("li");
                const infoDiv = document.createElement("div");
                infoDiv.className = "file-info";
                infoDiv.innerHTML = `<span><strong>${f.filename}</strong></span><small>${f.type} (${f.totalParts} chunks)</small>`;
                
                const btnGroup = document.createElement("div");
                btnGroup.className = "btn-group";

                const downloadBtn = document.createElement("button");
                downloadBtn.textContent = "Download";
                downloadBtn.className = "btn-download";
                downloadBtn.onclick = async () => {
                    downloadBtn.disabled = true;
                    downloadBtn.textContent = "Downloading...";
                    try {
                        const fileRecord = await this.fbService.getFileByFilename(this.collectionName, f.filename, (msg) => {
                            statusDiv.textContent = msg;
                        });
                        if (fileRecord) {
                            const a = document.createElement("a");
                            a.href = fileRecord.dataUrl;
                            a.download = fileRecord.filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            statusDiv.textContent = `Successfully downloaded ${f.filename}!`;
                        }
                    } catch (err) {
                        console.error(err);
                        statusDiv.textContent = "Download failed: " + err.message;
                    } finally {
                        downloadBtn.disabled = false;
                        downloadBtn.textContent = "Download";
                    }
                };

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.className = "btn-delete";
                deleteBtn.onclick = async () => {
                    if (!confirm(`Are you sure you want to delete ${f.filename}?`)) return;
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = "Deleting...";
                    try {
                        await this.fbService.deleteFileByFilename(this.collectionName, f.filename, (msg) => {
                            statusDiv.textContent = msg;
                        });
                        this._loadFiles(fileListEl, statusDiv);
                    } catch (err) {
                        console.error(err);
                        statusDiv.textContent = "Deletion failed: " + err.message;
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = "Delete";
                    }
                };

                btnGroup.appendChild(downloadBtn);
                btnGroup.appendChild(deleteBtn);
                li.appendChild(infoDiv);
                li.appendChild(btnGroup);
                fileListEl.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            fileListEl.innerHTML = "<li>Failed to load files.</li>";
        }
    }
}
