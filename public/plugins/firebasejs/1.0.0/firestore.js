import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export class FirebaseService {
  constructor(app) {
    this.db = getFirestore(app);
  }

  // Get all documents
  async getAll(collectionName) {
    try {
      const snapshot = await getDocs(collection(this.db, collectionName));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  }

  async getOne(collectionName, id) {
    try {
      const ref = doc(this.db, collectionName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Document not found");
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Create document with auto ID
  async create(collectionName, data) {
    try {
      const timestamp = Date.now();
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      return { id: docRef.id, ...data, createdAt: timestamp, updatedAt: timestamp };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Create or overwrite document with custom ID
  async createWithId(collectionName, id, data) {
    try {
      const timestamp = Date.now();
      const ref = doc(this.db, collectionName, id);
      await setDoc(ref, {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      return { id, ...data, createdAt: timestamp, updatedAt: timestamp };
    } catch (error) {
      console.error(`Error creating document with ID in ${collectionName}:`, error);
      throw error;
    }
  }

  async update(collectionName, id, data) {
    try {
      const timestamp = Date.now();
      const ref = doc(this.db, collectionName, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: timestamp
      });
      return { id, ...data, updatedAt: timestamp };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async delete(collectionName, id) {
    try {
      const ref = doc(this.db, collectionName, id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Pagination helper
  async paginate(
    collectionName,
    limitCount = 10,
    cursor = null,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  ) {
    try {
      let q = query(
        collection(this.db, collectionName),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );

      if (cursor) {
        q = query(
          collection(this.db, collectionName),
          orderBy(orderByField, orderDirection),
          startAfter(cursor),
          limit(limitCount)
        );
      }

      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;

      return {
        items,
        cursor: lastDoc,
        hasMore: snap.docs.length === limitCount
      };
    } catch (error) {
      console.error(`Error paginating ${collectionName}:`, error);
      throw error;
    }
  }
}
