import { db } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query; // This is the oldUsername
    if (!id) {
      return res.status(400).json({ error: "Username is required." });
    }

    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection("users").doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "User not found." });
      }
      return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    }

    if (method === "PUT" || method === "POST") {
      const oldUsername = id;
      const data = req.body;

      if (data.newUsername && data.newUsername !== oldUsername) {
        const newUsername = data.newUsername;
        const oldDocRef = db.collection("users").doc(oldUsername);
        const oldDocSnap = await oldDocRef.get();

        if (!oldDocSnap.exists) {
          return res.status(404).json({ error: "User not found" });
        }

        const newDocSnap = await db.collection("users").doc(newUsername).get();
        if (newDocSnap.exists) {
          return res.status(400).json({ error: "اسم المستخدم موجود مسبقاً (Username already exists)" });
        }

        const userData = oldDocSnap.data();
        const updatedUserData = {
          ...userData,
          ...data,
          username: newUsername
        };
        delete updatedUserData.newUsername;

        // Create new user doc
        await db.collection("users").doc(newUsername).set(updatedUserData);
        // Delete old user doc
        await oldDocRef.delete();

        // Cascade updates for known fields across known collections
        const collectionsWithUsername = [
          "projects", "customers", "installation_requests", "installation_orders", 
          "maintenance_tickets", "salaries", "cash_movements", "warehouse_items",
          "sales_quotations", "clients", "vacations", "deductions", "activity_logs", "production_orders"
        ];

        for (const col of collectionsWithUsername) {
          try {
            const snapshot = await db.collection(col).get();
            const targetFields = ["createdBy", "approvedBy", "statusUpdatedBy", "assignedBy"];
            
            for (const doc of snapshot.docs) {
              const d = doc.data();
              let wasModified = false;
              const updatedDoc = { ...d };

              for (const f of targetFields) {
                if (updatedDoc[f] === oldUsername) {
                  updatedDoc[f] = newUsername;
                  wasModified = true;
                }
              }

              if (wasModified) {
                await db.collection(col).doc(doc.id).set(updatedDoc, { merge: true });
              }
            }
          } catch (colErr) {
            console.error(`Error cascading to ${col}:`, colErr);
          }
        }

        return res.status(200).json({ success: true, user: updatedUserData });
      } else {
        const updateData = { ...data };
        delete updateData.newUsername;

        await db.collection("users").doc(oldUsername).set(updateData, { merge: true });
        return res.status(200).json({ success: true, user: updateData });
      }
    }

    if (method === "DELETE") {
      await db.collection("users").doc(id).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api/users/[id]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
