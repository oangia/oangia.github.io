export class FirebaseService {
  constructor(app) {
    this.db = app.firestore();
  }

  async getAll(collectionName, orderByField = 'createdAt', orderDirection = 'desc') {
    try {
      const snapshot = await this.db
        .collection(collectionName)
        .orderBy(orderByField, orderDirection)
        .get();
      
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  }

  async getOne(collectionName, id) {
    try {
      const doc = await this.db.collection(collectionName).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      throw new Error('Document not found');
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  async create(collectionName, data) {
    try {
      const docRef = await this.db.collection(collectionName).add({
        ...data,
        createdAt: Date.now()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async update(collectionName, id, data) {
    try {
      await this.db.collection(collectionName).doc(id).update({
        ...data,
        updatedAt: Date.now()
      });
      return { id, ...data };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async delete(collectionName, id) {
    try {
      await this.db.collection(collectionName).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
}
