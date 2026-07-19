const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Approve pending device[\s\S]*?(?=\s*app\.put\("\/api\/users\/:username")/m;
const match = code.match(regex);
if (match) {
  code = code.replace(regex, `// Get pending device requests
  app.get("/api/device-change-requests", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "device_change_requests"));
      const requests = snap.docs.map(doc => doc.data());
      return res.json({ success: true, requests });
    } catch (err: any) {
      console.error("[API_DEVICE_REQUESTS] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Approve pending device
  app.post("/api/device-change-requests/:id/approve", async (req, res) => {
    const { id } = req.params;
    try {
      const requestRef = doc(db, "device_change_requests", id);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) {
        return res.status(404).json({ error: "Request not found" });
      }
      const requestData = requestSnap.data() || {};
      const username = requestData.username;

      let userRef = doc(db, "users", username);
      let userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        userRef = doc(db, "users", username.toUpperCase());
        userSnap = await getDoc(userRef);
      }
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userData = userSnap.data() || {};

      userData.boundDeviceId = requestData.newDeviceId || "";
      userData.boundDeviceName = requestData.deviceName || "";
      userData.boundDeviceOS = requestData.platform || "";
      userData.boundDeviceBrowser = requestData.browser || "";
      userData.boundDeviceAt = new Date().toISOString();

      await setDoc(userRef, { 
        boundDeviceId: userData.boundDeviceId, 
        boundDeviceName: userData.boundDeviceName,
        boundDeviceOS: userData.boundDeviceOS,
        boundDeviceBrowser: userData.boundDeviceBrowser,
        boundDeviceAt: userData.boundDeviceAt
      }, { merge: true });
      saveLocalDoc("users", username, userData);

      // Delete the request
      await deleteDoc(requestRef);
      
      return res.json({ success: true, message: "Device approved successfully" });
    } catch (err: any) {
      console.error("[API_APPROVE_DEVICE] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Reject pending device
  app.post("/api/device-change-requests/:id/reject", async (req, res) => {
    const { id } = req.params;
    try {
      const requestRef = doc(db, "device_change_requests", id);
      await deleteDoc(requestRef);
      return res.json({ success: true, message: "Device request rejected and removed" });
    } catch (err: any) {
      console.error("[API_REJECT_DEVICE] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
`);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Match not found!");
}
