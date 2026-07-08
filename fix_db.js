import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function fix() {
  const snap = await getDocs(collection(db, 'employee-docs'));
  let wCount = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.employeeName && data.employeeName.includes('الوليد')) {
      wCount++;
      if (wCount === 2) { // the second one
        console.log('Found second Alwaleed, changing to SignX', data.id);
        await setDoc(doc(db, 'employee-docs', d.id), { ...data, employeeName: 'SignX / ساين إكس', employeeId: 'SIGNX-01' }, { merge: true });
      }
    }
  }
  console.log('Fixed count:', wCount);
  process.exit(0);
}
fix();
