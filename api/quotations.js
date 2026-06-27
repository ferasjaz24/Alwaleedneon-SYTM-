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
      const rQuo = req.body;
      if (!rQuo.id) {
        rQuo.id = `QT-2026-${Math.floor(100 + Math.random() * 900)}`;
      }
      if (!rQuo.dateCreated) {
        rQuo.dateCreated = new Date().toISOString().split("T")[0];
      }
      await db.collection("sales_quotations").doc(rQuo.id).set(rQuo);
      return res.status(200).json({ success: true, quotation: rQuo, action: "upsert_memory" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/quotations:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
