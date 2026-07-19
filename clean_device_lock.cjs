const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We will remove the device lock logic entirely.
// Find the block starting with "if (true || isDeveloper || openAnywhere || !isLockEnabled)"
// and replace it with a simple success path.

const startDeviceBlock = code.indexOf('if (true || isDeveloper || openAnywhere || !isLockEnabled) {');
if (startDeviceBlock !== -1) {
  // We need to carefully remove the if/else structure and keep only the success flow.
  // Actually, I can just replace the whole device lock logic with simple assignment.
  console.log("Found device block. Applying clean up...");
}

// Instead of complex AST, let's just use regex or string replacement for the specific blocks.
code = code.replace(
  /if \(true \|\| isDeveloper \|\| openAnywhere \|\| !isLockEnabled\) \{[\s\S]*?\/\/ Check for concurrent session if concurrent block is enabled/m,
  `
      // DEVICE LOCK AND BINDING HAVE BEEN COMPLETELY REMOVED BY USER REQUEST
      // The system no longer blocks any device or requires approval.
      
      // Auto-update the device info just for logging/tracking purposes, but never block.
      userData.boundDeviceId = devId;
      userData.boundDeviceName = devName;
      userData.boundDeviceOS = req.body.devOS || "";
      userData.boundDeviceBrowser = req.body.devBrowser || "";
      userData.boundDeviceType = req.body.devType || "";
      userData.boundHardwareId = hardwareId;
      userData.boundDeviceAt = new Date().toISOString();
      
      await setDoc(userDocRef, { 
         boundDeviceId: devId, 
         boundDeviceName: devName,
         boundDeviceOS: req.body.devOS || "",
         boundDeviceBrowser: req.body.devBrowser || "",
         boundDeviceType: req.body.devType || "",
         boundHardwareId: hardwareId,
         boundDeviceAt: new Date().toISOString()
      }, { merge: true });
      saveLocalDoc("users", actualDocId, userData);

      // Check for concurrent session if concurrent block is enabled`
);

code = code.replace(
  /const sessionToken = "SESS-" \+ Math\.random\(\)\.toString\(36\)\.substring\(2, 15\) \+ "-" \+ Date\.now\(\)\.toString\(36\);\n\s*if \(false && !isDeveloper && userData\.blockConcurrentLogins === true\) \{ \/\/ BYPASSED CONCURRENT LOGINS[\s\S]*?\/\/ Successful login/m,
  `const sessionToken = "SESS-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
      
      // CONCURRENT LOGINS BLOCK COMPLETELY REMOVED BY USER REQUEST
      userData.activeSessionToken = sessionToken;
      userData.lastActiveAt = new Date().toISOString();
      await setDoc(userDocRef, { 
         activeSessionToken: sessionToken, 
         lastActiveAt: userData.lastActiveAt 
       }, { merge: true });
      saveLocalDoc("users", actualDocId, userData);

      // Successful login`
);

fs.writeFileSync('server.ts', code);
console.log("Device and concurrent locks completely removed.");
