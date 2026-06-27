import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID is required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection("materials_warehouse").doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Material not found." });
      }
      return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    }

    if (method === "PUT" || method === "POST") {
      const docRef = db.collection("materials_warehouse").doc(id);
      await docRef.set(req.body, { merge: true });
      const docSnap = await docRef.get();
      return res.status(200).json({ success: true, item: { id, ...docSnap.data() } });
    }

    if (method === "DELETE") {
      await db.collection("materials_warehouse").doc(id).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/materials_warehouse/[id]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
