let fs = require("fs");
let c = fs.readFileSync("update_print.cjs", "utf8");
c = c.replace(/formattedTermsText = formattedTermsText\.replace\(\/\\n\/g, '<br\/>'\);/g, "formattedTermsText = formattedTermsText.replace(/\\\\n/g, '<br/>');");
c = c.replace(/formattedTermsText\.replace\(\/\\n\/g, '<br\/>'\);/g, "formattedTermsText.replace(/\\\\n/g, '<br/>');");
let lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('formattedTermsText = formattedTermsText.replace(/')) {
       if (lines[i+1] && lines[i+1].includes('/g, \'<br/>\');')) {
          lines[i] = "       formattedTermsText = formattedTermsText.replace(/\\\\n/g, '<br/>');";
          lines[i+1] = "";
       }
   }
}
fs.writeFileSync("update_print.cjs", lines.filter(v => v !== "").join('\n'));
