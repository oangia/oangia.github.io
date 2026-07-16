import { initializeApp } from "./firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc,
  updateDoc, deleteDoc } from "./firebase-firestore.js";

export class Firebase {
  constructor(config){
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
  }

  async create(collectionName, data){
    return await addDoc(collection(this.db, collectionName), data);
  }

  async all(collectionName){
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

  async read(collectionName, id) {
    const snapshot = await getDoc(doc(this.db, collectionName, id));
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }

  async update(collectionName, id, data, set = false){
    const docRef = doc(this.db, collectionName, id);

    if (set) {
      return await setDoc(docRef, data);
    }

    return await updateDoc(docRef, data);
  }

  async delete(collectionName, id){
    return await deleteDoc(doc(this.db, collectionName, id));
  }
}
