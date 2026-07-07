import fs from 'fs';

try {
  const fetchRes = await fetch("http://localhost:3000/api/revenues/REV-TEST-999?force=true", {
    method: "DELETE",
  });
  console.log(await fetchRes.json());
} catch (e) {
  console.error("Test failed:", e.message);
}
