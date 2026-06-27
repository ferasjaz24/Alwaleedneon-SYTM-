import { db } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const snapshot = await db.collection("materials_warehouse").get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(list);
    }

    if (method === "POST") {
      const newItem = req.body;
      newItem.id = newItem.id || `MAT-${Date.now()}`;
      await db.collection("materials_warehouse").doc(newItem.id).set(newItem);
      return res.status(200).json({ success: true, item: newItem });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/materials_warehouse:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
