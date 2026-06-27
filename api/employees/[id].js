import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID is required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection("employees").doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Employee profile not found." });
      }
      return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    }

    if (method === "PUT" || method === "POST") {
      const docRef = db.collection("employees").doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Employee profile not found." });
      }
      await docRef.set(req.body, { merge: true });
      return res.status(200).json({ success: true, employee: { ...docSnap.data(), ...req.body } });
    }

    if (method === "DELETE") {
      await db.collection("employees").doc(id).delete();
      return res.status(200).json({
        success: true,
        message: "Employee profile deleted successfully.",
      });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/employees/[id]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
