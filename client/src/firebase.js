import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASRUEMENT_ID
};

// --- ¡AQUÍ ESTÁ EL ARREGLO! ---
// Añadimos 'export' para que otros archivos puedan importar 'app'
export const app = initializeApp(firebaseConfig);

// Tus otras exportaciones siguen funcionando igual
export const db = getFirestore(app);
export const auth = getAuth(app);