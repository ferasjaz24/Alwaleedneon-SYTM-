import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
let db;
try {
  db = getFirestore(app);
} catch (e) {
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
}
const auth = getAuth(app);

const email = "feras.admin@nextpage.com";
const password = "!Feras2424$";
const username = "FERAS";

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

    // "تضيفها همشي في قاعدة البيانات في Firebase عشان خلاص تعرف عليه لما سجل الدخول... فما تحطها مع اليوزرز، لا حطها في بوابة يعني يكون حساب مرتبط في بوابة المشرف الفائق"
    // The user wants it in the database. In the app, regular login checks the "users" collection:
    // `const userDocRef = doc(db, "users", userInput);`
    // If the user wants it to work with login, it HAS to be in the "users" collection, OR I must modify the login code to also check another collection.
    // The user said: "فما تحطها مع اليوزرز، لا حطها في بوابة يعني يكون حساب مرتبط في بوابة المشرف الفائق. كيف؟"
    // He implies: "Don't put it with the regular users, put it in a super admin gate."
    // Let's create a new collection "super_admins" and modify App.tsx login to check "super_admins" if not found in "users" (or check "super_admins" first).
    
    // First, let's just write to "super_admins" collection
    await setDoc(doc(db, "super_admins", email), {
      email,
      username,
      role: "Super Admin",
      uid,
      createdAt: new Date().toISOString()
    });

    // We'll also put it in "users" just in case, but give it a specific flag.
    await setDoc(doc(db, "users", email), {
      email,
      username,
      role: "Super Admin",
      uid,
      isSuperAdminNode: true,
      createdAt: new Date().toISOString()
    });
    console.log("Successfully added Super Admin to Firestore.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

createFerasAdmin();
