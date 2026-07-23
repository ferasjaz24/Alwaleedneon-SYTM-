import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, initializeFirestore } from "firebase/firestore";
import fs from "fs";

// Override global fetch to inject origin
const originalFetch = globalThis.fetch;
globalThis.fetch = function (url, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers['Origin'] = 'https://alwaleed-erp.firebaseapp.com';
  options.headers['Referer'] = 'https://alwaleed-erp.firebaseapp.com/';
  return originalFetch(url, options);
};

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const auth = getAuth(app);

const email = "feras.admin@nextpage.com";
const password = "!Feras2424$";
const username = "Ferasadmin";

async function createFerasAdmin() {
  try {
    let uid = "";
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Created auth user:", cred.user.email);
      uid = cred.user.uid;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log("User already exists in Auth. Signing in to get UID...");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      } else {
        throw err;
      }
    }

    const f24UserObj = {
      username: username,
      role: "Super Admin",
      jobTitle: "Owner / GM",
      email: email,
      uid: uid,
      isF24: true,
      dateCreated: new Date().toISOString()
    };

    await setDoc(doc(db, "super_admins", email), f24UserObj);
    await setDoc(doc(db, "users", email), f24UserObj);
    console.log("Successfully added Super Admin to Firestore.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

createFerasAdmin();
