import fs from "fs";

const data = JSON.parse(fs.readFileSync("users_emps_dump.json", "utf-8"));

function searchObj(obj: any, path: string = "") {
  if (!obj) return;
  if (typeof obj === "string") {
    if (obj.toUpperCase().includes("GASEM")) {
      console.log(`Matched string at [${path}]: "${obj}"`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => searchObj(item, `${path}[${idx}]`));
  } else if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key.toUpperCase().includes("GASEM")) {
        console.log(`Matched key at [${path}]: "${key}"`);
      }
      searchObj(obj[key], `${path}.${key}`);
    }
  }
}

searchObj(data);
console.log("JSON search complete!");
