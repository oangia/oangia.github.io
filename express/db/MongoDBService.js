// db/mongo.js
const { MongoClient, ObjectId } = require("mongodb");

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
  }

  init(uri) {
    if (this.client) return this; // already initialized
    this.client = new MongoClient(uri);
    return this;
  }

  database(dbName) {
    this.db = this.client.db(dbName);
  }

  async connect() {
    if (!this.db) {
      if (!this.client) throw new Error("MongoService not initialized");
      await this.client.connect();
    }
  }

  async create(col, data) {
    await this.connect();
    return this.db.collection(col).insertOne(data);
  }

  async read(col, id) {
    await this.connect();
    return this.db.collection(col).findOne({ _id: new ObjectId(id) });
  }

  async find(col, fields) {
    await this.connect();
    return this.db.collection(col).findOne(fields);
  }

  async all(col, query = {}) {
    await this.connect();
    return this.db.collection(col).find(query).toArray();
  }

  async paginate(col, {
    query = {},
    page = 1,
    limit = 10,
    sort = { _id: -1 },
    projection = {}
  } = {}) {
    await this.connect();
  
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);
  
    const skip = (page - 1) * limit;
  
    const collection = this.db.collection(col);
  
    const [data, total] = await Promise.all([
      collection
        .find(query)
        .project(projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);
  
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async update(col, id, data) {
    await this.connect();
    return this.db.collection(col).updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  }

  async delete(col, id) {
    await this.connect();
    return this.db.collection(col).deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = new MongoDBService();