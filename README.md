# Database usage

This project includes two database helpers:

- MongoDB via [lib/goodmusic/db/MongoDBService.js](lib/goodmusic/db/MongoDBService.js)
- Firebase Firestore via [lib/jQuery/src/firebase/firebase.js](lib/jQuery/src/firebase/firebase.js)

## MongoDB service

The MongoDB helper is a lightweight wrapper for common CRUD operations. It is designed to be initialized once with your MongoDB connection URI and database name, then reused from any part of the application.

```js
const db = require('goodmusic/db/MongoDBService');

// Initialize once
db.init(process.env.MONGO_URI).database(process.env.MONGO_DB);

// Create a document
await db.create('users', { name: 'Alice', role: 'admin' });

// Read one document by id
const user = await db.read('users', userId);

// Find one matching document
const admin = await db.find('users', { role: 'admin' });

// Get all documents
const users = await db.all('users');

// Paginate results
const result = await db.paginate('users', {
  page: 1,
  limit: 10,
  query: { role: 'admin' }
});

// Update a document
await db.update('users', userId, { name: 'Bob' });

// Delete a document
await db.delete('users', userId);
```

### Typical MongoDB setup

When the app is initialized, the database service is configured through the main module in [lib/goodmusic/index.js](lib/goodmusic/index.js) using the `db` configuration object.

```js
const goodmusic = require('goodmusic');

const app = goodmusic({
  db: {
    uri: process.env.MONGO_URI,
    database: process.env.MONGO_DB
  }
});
```

## Firebase Firestore class

The Firebase helper wraps Firestore operations with a simple class-based API. It is useful when you want to work with documents in a browser or frontend context.

```js
import { Firebase } from './lib/jQuery/src/firebase/firebase.js';

const fbDb = new Firebase({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
});

// Create a document
await fbDb.create('users', { name: 'Alice', role: 'admin' });

// Get all documents
const users = await fbDb.all('users');

// Read one document by id
const user = await fbDb.read('users', userId);

// Update a document
await fbDb.update('users', userId, { name: 'Bob' });

// Replace a document entirely
await fbDb.update('users', userId, { name: 'Bob' }, true);

// Delete a document
await fbDb.delete('users', userId);
```

