const fs = require('fs');
const path = require('path');

const updateContracts = () => {
    let file = path.join(__dirname, 'src/components/hr/HrContractsTab.tsx');
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('DocumentHeader')) {
        content = content.replace(
            "import React, { useState } from 'react';", 
            "import React, { useState } from 'react';\nconst DocumentHeader = () => (\n  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0072BC', paddingBottom: '16px', marginBottom: '32px', userSelect: 'none', direction: 'ltr' }}>\n    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>\n      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#374151', margin: 0, fontFamily: '\"Tajawal\", sans-serif' }} dir=\"rtl\">\n        شركة فنون الوليد للصناعة\n      </h2>\n      <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '4px 0 0 0', letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>\n        FONOUN ALWALEED INDUSTRIAL CO.\n      </h3>\n    </div>\n    <div style={{ textAlign: 'right' }}>\n      <img src=\"https://pbs.twimg.com/media/HE46IrybcAAMq7L?format=png&name=small\" alt=\"Fonoun Alwaleed Logo\" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />\n    </div>\n  </div>\n);\n\nconst DocumentFooter = () => (\n  <div style={{ marginTop: 'auto', borderTop: '1px solid #0072BC', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', color: '#4b5563', userSelect: 'none', direction: 'ltr', minHeight: '80px' }}>\n    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>\n      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>T:</span> +966 13 833 4115</p>\n      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>\n    </div>\n    <div style={{ textAlign: 'right', lineHeight: '1.6' }}>\n      <p style={{margin:0}}>info@alwaleedneon.com | www.alwaleedneon.com</p>\n      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Riyad Bank Iban:</span> SA6 320 000 003 220 402 999 901</p>\n    </div>\n  </div>\n);"
        );

        const headerRegex = /<div className="flex justify-between items-center border-b-2 border-slate-700 pb-4">[\s\S]*?<\/div>\s*<\/div>/;
        content = content.replace(headerRegex, "<DocumentHeader />");

        const footerRegex = /<div className="pt-8 border-t border-dashed grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 text-center">[\s\S]*?<\/div>[\s\S]*?<\/div>/;
        content = content.replace(footerRegex, `<div className="pt-8 border-t border-dashed grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 text-center mb-8">
            <div className="space-y-4">
              <p>{lang === 'ar' ? 'الطرف الأول: شركة فنون الوليد للصناعة' : 'First Party: Al-Waleed Co Director'}</p>
              <div className="h-10 flex items-center justify-center italic text-slate-300">
                [ {lang === 'ar' ? 'توقيع وختم الإدارة الإلكتروني' : 'Signed E-Seal' } ]
              </div>
            </div>
            <div className="space-y-4">
              <p>{lang === 'ar' ? 'الطرف الثاني: الموظف المستلم' : 'Second Party: Employee Signature'}</p>
              <div className="h-10 flex items-center justify-center italic text-slate-300">
                [ {activeEmp.englishName} ]
              </div>
            </div>
          </div>
          <DocumentFooter />`);

        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed HrContractsTab');
    }
}

updateContracts();
