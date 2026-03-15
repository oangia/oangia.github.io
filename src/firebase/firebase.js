import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export class Firebase {

  constructor(config){
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
  }

  /* ---------- Firestore ---------- */

  async add(collectionName, data){
    return await addDoc(collection(this.db, collectionName), data);
  }

  async getAll(collectionName){
    const snapshot = await getDocs(collection(this.db, collectionName));

    const result = [];
    snapshot.forEach(d=>{
      result.push({
        id: d.id,
        ...d.data()
      });
    });

    return result;
  }

  async set(collectionName, id, data){
    return await setDoc(doc(this.db, collectionName, id), data);
  }

  async update(collectionName, id, data){
    return await updateDoc(doc(this.db, collectionName, id), data);
  }

  async delete(collectionName, id){
    return await deleteDoc(doc(this.db, collectionName, id));
  }

}