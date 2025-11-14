// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB0TxR5HpNJ8Ph7rnrHqXNMAmBWo1dw5Nw",
    authDomain: "agent52.firebaseapp.com",
    projectId: "agent52",
    storageBucket: "agent52.firebasestorage.app",
    messagingSenderId: "534394830199",
    appId: "1:534394830199:web:521b810d19dbcfe9edb572",
    measurementId: "G-J9RZWL9DZ5"
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const filesCol = collection(db, "files");

let currentFileName = null;

const filesEl = document.getElementById("files");
const fileNameEl = document.getElementById("file-name");
const fileContentEl = document.getElementById("file-content");
const iframeEl = document.getElementById("code-runner");

// Load files into table
const loadFiles = async () => {
  filesEl.innerHTML = "";
  const snapshot = await getDocs(filesCol);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = data.name;
    tr.appendChild(nameTd);

    const actionsTd = document.createElement("td");

    const runBtn = document.createElement("button");
    runBtn.textContent = "Run";
    runBtn.className = "btn btn-sm btn-success me-1";
    runBtn.onclick = () => runCode(data.code);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-sm btn-primary me-1";
    editBtn.onclick = () => {
      currentFileName = data.name;
      fileNameEl.value = data.name;
      fileContentEl.value = data.code;
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-sm btn-danger";
    deleteBtn.onclick = async () => {
      if (confirm("Delete this file?")) {
        await deleteDoc(doc(db, "files", data.name));
        if (currentFileName === data.name) {
          currentFileName = null;
          fileNameEl.value = "";
          fileContentEl.value = "";
          iframeEl.srcdoc = "";
        }
        loadFiles();
      }
    };

    actionsTd.append(runBtn, editBtn, deleteBtn);
    tr.appendChild(actionsTd);
    filesEl.appendChild(tr);
  });
};

const runCode = (code) => {
  const docFrame = iframeEl.contentDocument || iframeEl.contentWindow.document;
  docFrame.open();
  docFrame.write(code);
  docFrame.close();
};

// Add or update
document.getElementById("add-file").onclick = async () => {
  const name = fileNameEl.value.trim();
  const code = fileContentEl.value;
  if (!name) return alert("Enter file name");
  await setDoc(doc(db, "files", name), { name, code });
  loadFiles();
};

document.getElementById("update-file").onclick = async () => {
  if (!currentFileName) return alert("Select a file first");
  const newName = fileNameEl.value.trim();
  const code = fileContentEl.value;
  // If name changed, create new doc and delete old
  if (newName !== currentFileName) {
    await setDoc(doc(db, "files", newName), { name: newName, code });
    await deleteDoc(doc(db, "files", currentFileName));
    currentFileName = newName;
  } else {
    await updateDoc(doc(db, "files", currentFileName), { code });
  }
  loadFiles();
};

loadFiles();
