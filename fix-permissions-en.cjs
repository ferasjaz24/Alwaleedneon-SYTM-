const fs = require('fs');
let content = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

// The portal has static Arabic strings inside the configuration object.
// I will just use regex to replace all 'ar' strings with conditional `{lang === 'ar' ? ... : ...}` ?
// Wait, in `PERMISSIONS_STRUCTURE`, it's an object outside the component:
// `ar: 'المحاسبة والمالية'`
// I should add `en: 'Accounting & Finance'` to the objects and use it.

// Let's replace the whole structure with dual language. I will read and replace it in the component.

