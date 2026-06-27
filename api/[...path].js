import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      })
    });
  } catch (e) {
    console.error("Firebase Init Error", e.message);
  }
}
const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { path } = req.query;
    let segments = Array.isArray(path) ? path : path.split('/');
    
    // تنظيف المسار ديناميكياً
    if (segments[0] === 'dynamic' || segments[0] === 'v1') segments.shift();
    if (segments[0] === 'hr' || segments[0] === 'dashboard') segments.shift();

    const collectionName = segments[0];
    const docId = segments[1];
    if (!collectionName) return res.status(400).json({ error: "Missing collection" });

    const ref = db.collection(collectionName);

    if (req.method === 'GET') {
      if (docId) {
        const doc = await ref.doc(docId).get();
        return doc.exists ? res.status(200).json({ id: doc.id, ...doc.data() }) : res.status(404).json({ error: "Not found" });
      }
      const snapshot = await ref.get();
      return res.status(200).json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    if (req.method === 'POST') {
      const data = req.body || {};
      const id = docId || data.id;
      if (id) {
        const clean = { ...data }; delete clean.id;
        await ref.doc(id).set(clean, { merge: true });
        return res.status(201).json({ id, ...clean });
      }
      const newDoc = await ref.add(data);
      return res.status(201).json({ id: newDoc.id, ...data });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!docId) return res.status(400).json({ error: "Missing ID" });
      const data = req.body || {}; delete data.id;
      await ref.doc(docId).set(data, { merge: true });
      return res.status(200).json({ id: docId, ...data });
    }

    if (req.method === 'DELETE') {
      if (!docId) return res.status(400).json({ error: "Missing ID" });
      await ref.doc(docId).delete();
      return res.status(200).json({ id: docId, success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}