import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID is required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection("warehouse_items").doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Warehouse item not found." });
      }
      return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    }

    if (method === "PUT" || method === "POST") {
      const docRef = db.collection("warehouse_items").doc(id);
      await docRef.set(req.body, { merge: true });
      const docSnap = await docRef.get();
      return res.status(200).json({ success: true, item: { id, ...docSnap.data() } });
    }

    if (method === "DELETE") {
      await db.collection("warehouse_items").doc(id).delete();
      return res.status(200).json({ success: true, message: "Warehouse item deleted." });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/warehouse_items/[id]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
