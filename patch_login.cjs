const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ STEP 1: Authenticate using Firebase Authentication[\s\S]*?\/\/ STEP 2 & 3: Call \/api\/login/m;

const newLoginLogic = `// STEP 1 & 2 & 3 & 4: Fetch user's stored email from Firestore via backend
      const emailRes = await fetch("/api/get-user-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername })
      });
      
      if (!emailRes.ok) {
        let errStr = "اسم المستخدم أو كلمة المرور غير صحيحة.";
        try {
          const errData = await emailRes.json();
          errStr = errData.error || errStr;
        } catch(e) {}
        setLoginError(errStr);
        setButtonLoading("login", false);
        return;
      }
      
      const emailData = await emailRes.json();
      const firebaseEmail = emailData.email;

      // STEP 5: Authenticate using Firebase Authentication with the fetched email
      try {
        await signInWithEmailAndPassword(auth, firebaseEmail, loginPassword);
        console.log("Firebase Auth successful for:", firebaseEmail);
      } catch (authError: any) {
        setLoginError(
          lang === "ar"
            ? "اسم المستخدم أو كلمة المرور غير صحيحة."
            : "Incorrect username or password."
        );
        setButtonLoading("login", false);
        return; // Stop here if Firebase Auth fails
      }

      // STEP 6: Call /api/login to load user doc and perform Device Authorization checks`;

code = code.replace(regex, newLoginLogic);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched login");
