import { db } from "../../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { collection, id } = req.query;
    if (!collection || !id) {
      return res.status(400).json({ error: "Collection and ID are required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection(collection).doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Document not found." });
      }
      return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    }

    if (method === "PUT" || method === "POST") {
      const docRef = db.collection(collection).doc(id);
      await docRef.set(req.body, { merge: true });
      const docSnap = await docRef.get();
      return res.status(200).json({ success: true, data: { id, ...docSnap.data() } });
    }

    if (method === "DELETE") {
      await db.collection(collection).doc(id).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(`Error in api/dynamic/[collection]/[id] (${req.query.collection}/${req.query.id}):`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
