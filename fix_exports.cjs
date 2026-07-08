const fs = require('fs');
let code = fs.readFileSync('src/components/SalesLetters.tsx', 'utf8');

// Replace handleExport
code = code.replace(
  /const handleExport = async \(\) => \{[\s\S]*?const docName = /m,
  `const handleExport = async () => {
    if (!selectedQuoteId) { alert("يرجى اختيار عرض السعر المعتمد أولاً."); return; }
    
    let contentToSave = docContent;
    if (docTemplate === 'delivery_note') {
      const container = document.getElementById('printable-sales-letter-container');
      if (container) contentToSave = container.innerHTML;
    }

    const docName = `
);

// Replace handleRequestApproval
code = code.replace(
  /const handleRequestApproval = async \(\) => \{[\s\S]*?const docName = /m,
  `const handleRequestApproval = async () => {
    if (!selectedQuoteId) { alert("يرجى اختيار عرض السعر المعتمد أولاً."); return; }
    
    let contentToSave = docContent;
    if (docTemplate === 'delivery_note') {
      const container = document.getElementById('printable-sales-letter-container');
      if (container) contentToSave = container.innerHTML;
    }

    const docName = `
);

code = code.replace(
  /content: docContent,/g,
  `content: contentToSave,`
);

fs.writeFileSync('src/components/SalesLetters.tsx', code);
