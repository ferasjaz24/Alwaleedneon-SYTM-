const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

for (const [key, value] of Object.entries(pkg.devDependencies)) {
  if (!key.startsWith('@types') && !key.startsWith('@firebase')) {
    pkg.dependencies[key] = value;
    delete pkg.devDependencies[key];
  }
}

for (const key of Object.keys(pkg.devDependencies)) {
  if (pkg.dependencies[key]) {
    delete pkg.devDependencies[key];
  }
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Fixed package.json');
