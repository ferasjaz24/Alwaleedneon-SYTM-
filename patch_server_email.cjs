const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const getEmailEndpoint = `
  // Get User Email for Firebase Auth
  app.post("/api/get-user-email", async (req, res) => {
    const { username } = req.body;
    try {
      let userDocRef = doc(db, "users", username);
      let userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        userDocRef = doc(db, "users", username.toUpperCase());
        userSnap = await getDoc(userDocRef);
      }
      if (!userSnap.exists()) {
        userDocRef = doc(db, "users", username.toLowerCase());
        userSnap = await getDoc(userDocRef);
      }

      if (!userSnap.exists()) {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        let matchedDoc = null;
        for (const d of snap.docs) {
          if (d.id.toLowerCase() === username.toLowerCase() || (d.data().username && d.data().username.toLowerCase() === username.toLowerCase())) {
            matchedDoc = d;
            break;
          }
        }
        if (!matchedDoc) {
          return res.status(404).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
        }
        userSnap = matchedDoc;
      }

      const userData = userSnap.data() || {};
      if (!userData.email) {
        return res.status(400).json({ error: "خطأ في الإعداد: لا يوجد بريد إلكتروني مرتبط بهذا الحساب. يرجى مراجعة مدير النظام." });
      }

      return res.json({ success: true, email: userData.email });
    } catch (err: any) {
      console.error("[API_GET_USER_EMAIL] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
`;

code = code.replace(/\/\/ Secure Server-Side Login Gateway & Device Control/, getEmailEndpoint + "\n  // Secure Server-Side Login Gateway & Device Control");

fs.writeFileSync('server.ts', code);
console.log("Added /api/get-user-email endpoint");
