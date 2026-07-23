import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, initializeFirestore } from "firebase/firestore";
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

async function run() {
  const email = "feras.admin@nextpage.com";
  const docRef = doc(db, "users", email);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("User doc:", snap.data());
  } else {
    console.log("User doc not found!");
  }
  process.exit(0);
}
run();
