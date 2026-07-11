import React from 'react';

export const DocumentHeader = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0072BC', paddingBottom: '16px', marginBottom: '16px', userSelect: 'none', direction: 'ltr' }}>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#374151', margin: 0, fontFamily: "'EnglishNumbersOnly', 'GE SS Two', 'Gotham Pro', sans-serif" }} dir="rtl">
        شركة فنون الوليد للصناعة
      </h2>
      <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '4px 0 0 0', letterSpacing: '0.1em', fontFamily: "'EnglishNumbersOnly', 'Gotham Pro', sans-serif" }}>
        FONOUN ALWALEED INDUSTRIAL CO.
      </h3>
    </div>
    <div style={{ textAlign: 'right' }}>
      <img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerPolicy="no-referrer" alt="Fonoun Alwaleed Logo" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
    </div>
  </div>
);

export const DocumentFooter = () => (
  <div style={{ marginTop: 'auto', borderTop: '2px solid #0072BC', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', color: '#4b5563', userSelect: 'none', direction: 'ltr', minHeight: '60px' }}>
    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>T:</span> +966 13 833 4115 | <span style={{ fontWeight: 'bold', color: '#0072BC' }}>E:</span> info@alwaleedneon.com</p>
      <p style={{margin:0}}><span style={{ fontWeight: 'bold', color: '#0072BC' }}>Factory:</span> Dallah Industrial District, Dammam 32445, Saudi Arabia.</p>
    </div>
    <div style={{ textAlign: 'right', lineHeight: '1.6' }}>
      <p style={{margin:0}}>www.alwaleedneon.com</p>
      <p style={{margin:0, fontWeight: 'bold', color: '#0072BC'}}>شركة فنون الوليد للصناعة</p>
    </div>
  </div>
);
