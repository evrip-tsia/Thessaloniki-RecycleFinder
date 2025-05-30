import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDrDg-tBZweTtVGrRGmvWdmIrMLc46Vn54",
  authDomain: "thessaloniki-recyclefinder.firebaseapp.com",
  projectId: "thessaloniki-recyclefinder",
  storageBucket: "thessaloniki-recyclefinder.firebasestorage.app",
  messagingSenderId: "108191133894",
  appId: "1:108191133894:web:eebc8ccfe2d8c59a5a27c7",
};

let app;
let db;

const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(
    `CRITICAL: Firebase initialization with hardcoded config skipped. Missing required config keys: ${missingKeys.join(', ')}.`
  );

} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully with hardcoded config.");
    } else {
      app = getApp();
      console.log("Existing Firebase app retrieved, using hardcoded config context.");
    }
    db = getFirestore(app);
    console.log("Firestore database instance obtained successfully with hardcoded config.");
  } catch (error: any) {
    console.error("CRITICAL: Error initializing Firebase app or Firestore with hardcoded config:", error.message ? error.message : error, error);
    
  }
}

export { db, app };
