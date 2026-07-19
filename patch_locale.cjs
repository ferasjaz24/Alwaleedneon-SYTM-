const fs = require('fs');
const path = require('path');

const mainTsxPath = path.join(__dirname, 'src', 'main.tsx');
let content = fs.readFileSync(mainTsxPath, 'utf8');

if (!content.includes('Number.prototype.toLocaleString')) {
  const overrideCode = `
// Force English numerals for all numbers and dates
const originalNumberToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function(locales, options) {
  return originalNumberToLocaleString.call(this, 'en-US', options);
};

const originalDateToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function(locales, options) {
  return originalDateToLocaleString.call(this, 'en-US', options);
};

const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function(locales, options) {
  return originalDateToLocaleDateString.call(this, 'en-US', options);
};

const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function(locales, options) {
  return originalDateToLocaleTimeString.call(this, 'en-US', options);
};

const OriginalIntlNumberFormat = Intl.NumberFormat;
(Intl as any).NumberFormat = function(locales?: string | string[], options?: Intl.NumberFormatOptions) {
  return new OriginalIntlNumberFormat('en-US', options);
};

const OriginalIntlDateTimeFormat = Intl.DateTimeFormat;
(Intl as any).DateTimeFormat = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
  return new OriginalIntlDateTimeFormat('en-US', options);
};
`;

  // insert after imports
  const lastImportIndex = content.lastIndexOf('import ');
  const nextLineIndex = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, nextLineIndex + 1) + overrideCode + content.slice(nextLineIndex + 1);
  
  fs.writeFileSync(mainTsxPath, content, 'utf8');
  console.log('Patched main.tsx');
} else {
  console.log('Already patched main.tsx');
}
