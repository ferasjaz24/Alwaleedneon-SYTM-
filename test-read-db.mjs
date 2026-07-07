import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const configStr = fs.readFileSync("./firebase-applet-config.json", "utf8");
const config = JSON.parse(configStr);

// Use the web config from the json file directly? No, firebase-applet-config.json only has projectId.
// I can't run firebase client easily.
