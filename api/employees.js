import { db } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const snapshot = await db.collection("employees").get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(list);
    }

    if (method === "POST") {
      const newEmp = req.body;
      if (!newEmp.arabicName || !newEmp.englishName) {
        return res.status(400).json({ error: "Required fields missing." });
      }
      newEmp.id = newEmp.id || `EMP-${Date.now()}`;
      await db.collection("employees").doc(newEmp.id).set(newEmp);
      return res.status(200).json({ success: true, employee: newEmp });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/employees:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
