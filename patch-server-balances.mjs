import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('server.ts', [
  [
    `        if (line.accountName === "الصندوق") {`,
    `        if (line.accountType === "Cash" || line.accountName === "الصندوق") {`
  ],
  [
    `        } else if (line.accountName === "البنك") {`,
    `        } else if (line.accountType === "Bank" || line.accountName === "البنك") {`
  ]
]);

