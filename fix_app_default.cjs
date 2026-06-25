const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/App.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/const \[activeSalesSubTab, setActiveSalesSubTab\] = useState\('sales_dashboard'\);/g, "const [activeSalesSubTab, setActiveSalesSubTab] = useState('sales_crm');");

fs.writeFileSync(f, c, 'utf8');
