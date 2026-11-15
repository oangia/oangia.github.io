import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, where } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
    }
    _getConfig(config) {
        return {
            projectId: config.projectId || "freedata-4c235",
            appId: config.appId || "1:906764667278:web:aa229456f8de0740923cdf",
            apiKey: config.apiKey
        }
    }
    init(config) {
        this.app = initializeApp(this._getConfig(config));
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
