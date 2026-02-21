import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBpqraKX7ogmEeaiaANC0aBzkv-GBHtOKM',
  authDomain: 'recipe-de9f4.firebaseapp.com',
  projectId: 'recipe-de9f4',
  storageBucket: 'recipe-de9f4.firebasestorage.app',
  messagingSenderId: '610595075973',
  appId: '1:610595075973:web:db676a758a84653b92b6ec',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
