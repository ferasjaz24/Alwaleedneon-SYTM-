const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace standard try-catch fallback pattern. 
// A lot of api routes have this:
// try { ... } catch(err) { console.warn("...fallback...", err); <fallback logic> }
// We can just keep the body of the catch block and remove the console.warn.

/* Strategy: Replace the entire try block and the catch header and console.warn with just the fallback logic. */
let r = /try\s*{[\s\S]*?} catch \([^)]+\) {\s*console\.warn\("[^"]*fallback[^"]*", err\);\s*([\s\S]*?)\n[ \t]*}/g;
content = content.replace(r, (match, fallbackBlock) => {
   return fallbackBlock;
});

r = /try\s*{[\s\S]*?} catch \([^)]+\) {\s*console\.warn\("Supabase[^"]*", err\);\s*([\s\S]*?)\n[ \t]*}/g;
content = content.replace(r, (match, fallbackBlock) => {
   return fallbackBlock;
});

// Remove supabase specific properties and functions.
content = content.replace(/let supabaseActive = false;\nlet supabaseError = "";\n/g, '');
content = content.replace(/supabaseActive(,|:)?[ \t]*([a-zA-Z\d]*)/g, '');
content = content.replace(/supabaseError(,|:)?[ \t]*([a-zA-Z\d]*)/g, '');
content = content.replace(/supabaseUrl: SUPABASE_URL \? `\$\{SUPABASE_URL\.substring\(0, 15\)\}\.\.\.` : null/g, '');


fs.writeFileSync('server.ts', content);
