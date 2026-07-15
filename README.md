# Database usage

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

