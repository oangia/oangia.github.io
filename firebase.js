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

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
    }
    init(config) {
        this.app = initializeApp({
            projectId: config.projectId || "freedata-4c235",
            appId: config.appId || "1:906764667278:web:aa229456f8de0740923cdf",
            apiKey: config.apiKey
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
            if (this.isRendered) {
                const overlay = document.getElementById("fb-modal-overlay");
                if (overlay) {
                    overlay.classList.remove("hidden");
                    this._checkAndConnect();
                }
                return;
            }
            this._renderPanel();
            this._bindEvents();
            this._checkAndConnect();
            this.isRendered = true;
        });
    }

    _renderPanel() {
        const style = document.createElement("style");
        style.innerHTML = `
            #fb-modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
            #fb-modal-overlay.hidden { display: none !important; }
            .fb-widget-container { font-family: ui-sans-serif, system-ui, sans-serif; width: 100%; max-width: 650px; max-height: 85vh; background: #18181b; color: #f4f4f5; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; overflow: hidden; }
            .fb-widget-header { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: #09090b; }
            .fb-widget-header h2 { font-size: 1rem; font-weight: bold; color: #fff; margin: 0; }
            .fb-widget-actions { display: flex; align-items: center; gap: 0.75rem; }
            .fb-widget-close { background: transparent; border: none; color: #a1a1aa; font-size: 1.2rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
            .fb-widget-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
            .fb-widget-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
            .fb-widget-container .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1rem; }
            .fb-widget-container h3 { font-size: 0.875rem; font-weight: 600; color: #e4e4e7; margin-top: 0; margin-bottom: 0.75rem; }
            #fb-status { font-size: 0.75rem; font-weight: 500; color: #38bdf8; margin-top: 0.5rem; }
            .fb-widget-container ul { padding-left: 0; list-style: none; margin: 0; }
            .fb-widget-container li { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
            .fb-widget-container .btn-group { display: flex; gap: 0.375rem; }
            .fb-widget-container li button { width: auto; margin: 0; padding: 0.25rem 0.5rem; font-size: 0.7rem; border-radius: 0.375rem; border: none; font-weight: 600; cursor: pointer; color: white; }
            .fb-widget-container .btn-download { background: #16a34a; }
            .fb-widget-container .btn-download:hover { background: #15803d; }
            .fb-widget-container .btn-delete { background: #dc2626; }
            .fb-widget-container .btn-delete:hover { background: #b91c1c; }
            .fb-widget-container .file-info span { display: block; font-size: 0.75rem; font-weight: 500; color: #f4f4f5; }
            .fb-widget-container .file-info small { color: #a1a1aa; font-size: 0.7rem; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement("div");
        overlay.id = "fb-modal-overlay";
        overlay.innerHTML = `
            <div class="fb-widget-container">
                <div class="fb-widget-header">
                    <h2>Firebase Storage</h2>
                    <div class="fb-widget-actions">
                        <label class="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1.5">
                            <i class="fa-solid fa-upload"></i>
                            <span id="fb-uploadBtnText">Upload File</span>
                            <input type="file" id="fb-fileInput" class="hidden">
                        </label>
                        <button class="fb-widget-close" id="fb-closeModalBtn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="fb-widget-body">
                    <div id="fb-status" style="margin-bottom: 1rem;"></div>
                    <div class="card" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <h3 style="margin: 0;">Uploaded Files</h3>
                            <button id="fb-refreshBtn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 0.375rem; color: #fff; cursor: pointer;">Refresh</button>
                        </div>
                        <ul id="fb-fileList"></ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    _checkAndConnect() {
        const fileList = document.getElementById("fb-fileList");
        const statusDiv = document.getElementById("fb-status");

        const apiKey = localStorage.getItem("fb_apikey") || localStorage.getItem("firebase_api_key");
        const projectId = localStorage.getItem("fb_projectid") || "freedata-4c235";
        const appId = localStorage.getItem("fb_appid") || "1:906764667278:web:aa229456f8de0740923cdf";

        if (!apiKey) {
            fileList.innerHTML = "<li style='justify-content:center; color:#f87171;'>Firebase API Key missing! Please configure it in Settings.</li>";
            return;
        }

        try {
            this.fbService.init({ apiKey, projectId, appId });
            this._loadFiles(fileList, statusDiv);
        } catch (err) {
            console.error(err);
            fileList.innerHTML = `<li style='justify-content:center; color:#f87171;'>Connection error: ${err.message}</li>`;
        }
    }

    _bindEvents() {
        const overlay = document.getElementById("fb-modal-overlay");
        const closeBtn = document.getElementById("fb-closeModalBtn");
        const fileInput = document.getElementById("fb-fileInput");
        const uploadBtnText = document.getElementById("fb-uploadBtnText");
        const statusDiv = document.getElementById("fb-status");
        const refreshBtn = document.getElementById("fb-refreshBtn");
        const fileList = document.getElementById("fb-fileList");

        closeBtn.addEventListener("click", () => {
            overlay.classList.add("hidden");
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.add("hidden");
            }
        });

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            uploadBtnText.textContent = "Uploading...";
            try {
                await this.fbService.uploadFile(this.collectionName, file, (msg) => {
                    statusDiv.textContent = msg;
                });
                fileInput.value = "";
                statusDiv.textContent = "";
                this._loadFiles(fileList, statusDiv);
            } catch (err) {
                console.error(err);
                statusDiv.textContent = "Error: " + err.message;
            } finally {
                uploadBtnText.textContent = "Upload File";
            }
        });

        refreshBtn.addEventListener("click", () => this._loadFiles(fileList, statusDiv));
    }

    async _loadFiles(fileListEl, statusDiv) {
        fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>Loading files...</li>";
        try {
            const files = await this.fbService.getAllFilenames(this.collectionName);
            fileListEl.innerHTML = "";
            if (files.length === 0) {
                fileListEl.innerHTML = "<li style='justify-content:center; color:#a1a1aa;'>No files found in collection.</li>";
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
            fileListEl.innerHTML = "<li style='justify-content:center; color:#f87171;'>Failed to load files.</li>";
        }
    }
}
