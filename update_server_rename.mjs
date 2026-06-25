import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const updatedPutRoute = `  app.put("/api/users/:username", async (req, res) => {
    const oldUsername = req.params.username;
    const data = req.body;

    try {
      if (data.newUsername && data.newUsername !== oldUsername) {
        // Handle Rename
        const newUsername = data.newUsername;
        const oldDocRef = doc(db, "users", oldUsername);
        const oldDocSnap = await getDoc(oldDocRef);
        
        if (!oldDocSnap.exists()) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const newDocSnap = await getDoc(doc(db, "users", newUsername));
        if (newDocSnap.exists()) {
          return res.status(400).json({ error: "اسم المستخدم موجود مسبقاً (Username already exists)" });
        }

        const userData = oldDocSnap.data();
        const updatedUserData = {
          ...userData,
          ...data,
          username: newUsername
        };
        delete updatedUserData.newUsername; // clean up payload

        // 1. Create new user doc
        await setDoc(doc(db, "users", newUsername), updatedUserData);
        // 2. Delete old user doc
        await deleteDoc(oldDocRef);

        // 3. Cascade updates for known fields across known collections
        const collectionsWithUsername = [
          "projects", "customers", "installation_requests", "installation_orders", 
          "maintenance_tickets", "salaries", "cash_movements", "warehouse_items"
        ];
        
        // Let's sweep collections and update string fields safely
        for (const col of collectionsWithUsername) {
          const docs = await getCollectionDocs(col);
          for (const d of docs) {
            let wasModified = false;
            let updatedDoc = { ...d };
            
            // Typical fields that store username
            const targetFields = ["createdBy", "approvedBy", "statusUpdatedBy", "assignedBy"];
            
            for (const f of targetFields) {
              if (updatedDoc[f] === oldUsername) {
                updatedDoc[f] = newUsername;
                wasModified = true;
              }
            }
            // Array fields like assignedTeam could contain username?
            // "assignedTeam" is sometimes an array of employees, wait is it username? usually employee ids.

            if (wasModified) {
               await setDoc(doc(db, col, d.id), updatedDoc);
            }
          }
        }
        
        return res.json({ success: true, user: updatedUserData });
      } else {
        // Normal update without rename
        const updateData = { ...data };
        delete updateData.newUsername;
        
        await setDoc(doc(db, "users", oldUsername), updateData, { merge: true });
        return res.json({ success: true, user: updateData });
      }
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || "Failed to update user" });
    }
  });`;


content = content.replace(
  /app\.put\(".*?\/api\/users\/:username"[\s\S]*?res\.json\(\{ success: true, user: req\.body \}\);\s*\}\);/,
  updatedPutRoute
);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('server.ts updated');
