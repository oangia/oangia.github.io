import { getFirestore, collection, addDoc, query, where, onSnapshot, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

class ICrud {
  async create(collectionName, data) {}
  async find(collectionName, id) {}
  async list(collectionName) {}
  async query(collectionName, whereIn, whereOut) {}
  async onSnapshot(collectionName, whereIn, whereOut) {}
  async update(collectionName, id, newData) {}
  async delete(collectionName, id) {}
}

export class Firestore extends ICrud {
  constructor(app) {
    super(app);
    this.db = getFirestore(app);
  }
  async create(collectionName, data) {
    await addDoc(collection(this.db, collectionName), data); 
  }

  async find(collectionName, id) {
    const docRef = doc(this.db, collectionName, id);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data(); // returns the document data
    } else {
      return null; // document does not exist
    }
  }
  async list(collectionName) {
    const querySnapshot = await getDocs(collection(this.db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async query(collectionName, whereIn, whereOut) {
    const q = query(collection(this.db, collectionName), where(whereIn, "==", whereOut));
    const snapshot = await getDocs(q);
    return snapshot;
  }

  async onSnapshot(collectionName, whereIn, whereOut) {
    const q = query(collection(this.db,collectionName), where(whereIn,"==", whereOut));
    const snapshot = onSnapshot(q, snapshot=>{
      snapshot.forEach(doc => transactions.push(doc.data()));
      updateUI(transactions);
    });
    return snapshot;
  }

  async update(collectionName, id, newData) {
    const ref = doc(this.db, collectionName, id);
    await updateDoc(ref, newData);
  }

  async delete(collectionName, id) {
    const ref = doc(this.db, collectionName, id);
    await deleteDoc(ref);
  }
}
