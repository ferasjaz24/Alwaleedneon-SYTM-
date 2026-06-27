import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { collection } = req.query;
    if (!collection) {
      return res.status(400).json({ error: "Collection is required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const snapshot = await db.collection(collection).get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(list);
    }

    if (method === "POST") {
      const body = req.body;
      body.id = body.id || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await db.collection(collection).doc(String(body.id)).set(body);
      return res.status(200).json({ success: true, data: body });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(`Error in api/dynamic/[collection] (${req.query.collection}):`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
