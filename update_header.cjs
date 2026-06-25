const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/hr/InstantDocumentsHub.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add DocumentHeader definition
const documentHeaderCode = `const DocumentHeader = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0072BC', paddingBottom: '16px', marginBottom: '32px', userSelect: 'none', direction: 'ltr' }}>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#374151', margin: 0, fontFamily: '"Tajawal", sans-serif' }} dir="rtl">
        شركة فنون الوليد للصناعة
      </h2>
      <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '4px 0 0 0', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>
        FONOUN ALWALEED INDUSTRIAL CO.
      </h3>
    </div>
    <div style={{ textAlign: 'right' }}>
      <img src="https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small" alt="Fonoun Alwaleed Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
    </div>
  </div>
);

`;

if (!content.includes('const DocumentHeader')) {
  content = content.replace('const DocumentFooter = () => (', documentHeaderCode + 'const DocumentFooter = () => (');
}

// Replace the old Formal Header
const oldHeaderRegex = /\{\/\* Formal Header \*\/\}.*?(?=\{\/\* Editable Content \*\/\})/s;
content = content.replace(oldHeaderRegex, `{/* Formal Header */}\n            <DocumentHeader />\n\n            `);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced header');
