import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (file.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('src/components');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // if the file does NOT actually use getStatusColors (except the import itself), remove the import
  const usesHelper = content.indexOf('getStatusColors(') !== -1;
  const hasImport = content.indexOf("import { getStatusColors }") !== -1;

  if (!usesHelper && hasImport) {
     content = content.replace(/^import \{ getStatusColors \} from '.*statusUtils';\n/m, '');
     fs.writeFileSync(file, content, 'utf8');
     console.log('Removed import from', file);
  } else if (usesHelper && hasImport) {
     // fix the path if it's in a subdirectory
     const depth = file.split('/').length - 2; // e.g. src/components/hr/File.tsx -> parts: src, components, hr, File.tsx -> 4. 4-2=2
     // depth from src is what we want.
     // actually file path is 'src/components/File.tsx', depth is 2.
     // src/components = depth 2. ../lib
     // src/components/hr = depth 3. ../../lib
     let relativePrefix = '../';
     if (depth > 2) {
       relativePrefix = '../'.repeat(depth - 1); // if depth is 3, relativePrefix is '../../'
     }
     const newImport = `import { getStatusColors } from '${relativePrefix}lib/statusUtils';\n`;
     content = content.replace(/^import \{ getStatusColors \} from '.*statusUtils';\n/m, newImport);
     fs.writeFileSync(file, content, 'utf8');
  }
});
