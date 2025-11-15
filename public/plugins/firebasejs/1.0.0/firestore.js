import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export class Firestore {
  constructor(app) {
    this.db = getFirestore(app);
  }

  async getAll(collectionName, orderByField = 'createdAt', orderDirection = 'desc') {
    try {
      const q = query(
        collection(this.db, collectionName),
        orderBy(orderByField, orderDirection)
      );

      const snapshot = await getDocs(q);
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

  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: Date.now(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async update(collectionName, id, data) {
    try {
      const ref = doc(this.db, collectionName, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: Date.now(),
      });
      return { id, ...data };
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
