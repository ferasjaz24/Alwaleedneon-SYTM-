import { db } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const snapshot = await db.collection("sales_quotations").get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(list);
    }

    if (method === "POST") {
      const q = req.body;
      q.id = q.id || `SQ-${Date.now()}`;
      await db.collection("sales_quotations").doc(q.id).set(q);
      return res.status(200).json({ success: true, item: q });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/sales_quotations:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
