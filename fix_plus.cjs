const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Fix string concatenations: "something" "something" -> "something" + "something"
code = code.replace(/"\s+"/g, '" + "');
code = code.replace(/'\s+'/g, "' + '");
code = code.replace(/`\s+`/g, "` + `");

// Also cases like  (condition ? "a" : "b") "c" ->  (condition ? "a" : "b") + "c"
// Actually, it's safer to just look at the line numbers in the error output.
