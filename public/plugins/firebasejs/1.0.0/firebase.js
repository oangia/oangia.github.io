import { app } from "./config.js";
import { Authenticator } from './auth.js';
import { Firestore } from "./firestore.js";

export function getFirestore(auth = null) {
    const firestore = new Firestore(app, auth);
    return firestore;
}

export function getAuthenticator(action, config) {
    const auth = new Authenticator(app, action, config);
    return auth;
}

export function getFirestoreWithAuth(action, config) {
    return getFirestore(getAuthenticator(action, config));
}


