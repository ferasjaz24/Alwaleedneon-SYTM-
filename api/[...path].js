import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";

// الإعدادات تسحب القيم تلقائياً من المتغيرات اللي أنت حاطها في Vercel
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // حل مشكلة الحظر CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { path } = req.query;
    let segments = Array.isArray(path) ? path : path.split('/');
    
    // تنظيف روابط النظام تلقائياً للتعرف على الجداول
    if (segments[0] === 'dynamic' || segments[0] === 'v1') segments.shift();
    if (segments[0] === 'hr' || segments[0] === 'dashboard') segments.shift();

    const collectionName = segments[0];
    const docId = segments[1];

    if (!collectionName) return res.status(400).json({ error: "Missing collection" });
    const ref = collection(db, collectionName);

    // 1. جلب البيانات (GET)
    if (req.method === 'GET') {
      if (docId) {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        return docSnap.exists() ? res.status(200).json({ id: docSnap.id, ...docSnap.data() }) : res.status(404).json({ error: "Not found" });
      }
      const querySnap = await getDocs(ref);
      return res.status(200).json(querySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // 2. إضافة بيانات (POST)
    if (req.method === 'POST') {
      const body = req.body || {};
      const id = docId || body.id;
      if (id) {
        const clean = { ...body }; delete clean.id;
        await setDoc(doc(db, collectionName, id), clean, { merge: true });
        return res.status(201).json({ id, ...clean });
      }
      const newDoc = await addDoc(ref, body);
      return res.status(201).json({ id: newDoc.id, ...body });
    }

    // 3. تعديل بيانات (PUT)
    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!docId) return res.status(400).json({ error: "Missing ID" });
      const body = req.body || {}; delete body.id;
      await setDoc(doc(db, collectionName, docId), body, { merge: true });
      return res.status(200).json({ id: docId, ...body });
    }

    // 4. حذف بيانات (DELETE)
    if (req.method === 'DELETE') {
      if (!docId) return res.status(400).json({ error: "Missing ID" });
      await deleteDoc(doc(db, collectionName, docId));
      return res.status(200).json({ id: docId, success: true });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}