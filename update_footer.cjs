const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/hr/InstantDocumentsHub.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add DocumentFooter
if (!content.includes('const DocumentFooter')) {
  // Add it before the export default function
  content = content.replace('export default function InstantDocumentsHub', `const DocumentFooter = () => (
  <div style={{ marginTop: 'auto', borderTop: '2px solid #0072BC', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', color: '#4b5563', userSelect: 'none', direction: 'ltr' }}>
    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
      <p><span style={{ fontWeight: 'bold', color: '#0072BC' }}>T:</span> +966 13 833 4115</p>
      <p><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
    </div>
    <div style={{ textAlign: 'right', lineHeight: '1.6' }}>
      <p>info@alwaleedneon.com | www.alwaleedneon.com</p>
      <p><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>
    </div>
  </div>
);

export default function InstantDocumentsHub`);
}

// Update .doc-container
content = content.replace(
`.doc-container { 
                width: 210mm; 
                min-height: 297mm; 
                padding: 2cm; 
                background: white; 
                margin: 20px auto; 
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
                box-sizing: border-box;
              }`,
`.doc-container { 
                width: 210mm; 
                min-height: 297mm; 
                padding: 2cm; 
                background: white; 
                margin: 20px auto; 
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
              }`);

// Update printable document area div
content = content.replace(
  `id="printable-document-area" className="relative mx-auto bg-white shadow min-h-[500px] print:shadow-none" style={{ width: '210mm', minHeight: '297mm', padding: '2cm', direction: 'rtl' }}`,
  `id="printable-document-area" className="relative mx-auto bg-white shadow min-h-[500px] print:shadow-none" style={{ width: '210mm', minHeight: '297mm', padding: '2cm', direction: 'rtl', display: 'flex', flexDirection: 'column' }}`
);

// Update Editable Content div
content = content.replace(
  `className="outline-none whitespace-pre-wrap font-sans text-sm leading-8 text-stone-800 min-h-[300px]"`,
  `className="outline-none whitespace-pre-wrap font-sans text-sm leading-8 text-stone-800 min-h-[300px]" style={{ flexGrow: 1 }}`
);

// Inject <DocumentFooter /> after Footer Signatures
if (!content.includes('<DocumentFooter />')) {
  content = content.replace(
    `            </div>
            
          </div>
        </div>`,
    `            </div>
            
            <DocumentFooter />
          </div>
        </div>`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced');
