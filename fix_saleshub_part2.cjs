const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/const \[expandedClientId, setExpandedClientId\] = useState<string \| null>\(null\);/g, `const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const [noDataToast, setNoDataToast] = useState(false);
  const [showNationalAddress, setShowNationalAddress] = useState(false);
  
  // Country Search state
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const showNoDataPopup = () => {
    setNoDataToast(true);
    setTimeout(() => setNoDataToast(false), 3000);
  };
`);

// Updating file/ai parse handlers to trigger toast
c = c.replace(/alert\('Imported functionality active\.'\);/g, `showNoDataPopup();
    if(fileInputRef.current) fileInputRef.current.value = '';`);

c = c.replace(/alert\('AI Parsing Error'\);/g, `showNoDataPopup();`);
c = c.replace(/alert\(lang === 'ar' \? 'جاري التحليل بالذكاء الاصطناعي\.\.\.' : 'AI parsing underway\.\.\.'\);/, `// alert removed, parsing in bg`);

fs.writeFileSync(f, c, 'utf8');
