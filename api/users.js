import { db } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const snapshot = await db.collection("users").get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(list);
    }

    if (method === "POST") {
      const newUser = req.body;
      if (!newUser.username) {
        return res.status(400).json({ error: "Username is required." });
      }
      await db.collection("users").doc(newUser.username).set(newUser);
      return res.status(200).json({ success: true, user: newUser });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/users:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
