const fs = require('fs');
let code = fs.readFileSync('src/components/SalesLetters.tsx', 'utf8');

// First, we need to import DeliveryNoteBuilder
if (!code.includes("import DeliveryNoteBuilder")) {
  code = code.replace(
    "import RichTextToolbar from './RichTextToolbar';",
    "import RichTextToolbar from './RichTextToolbar';\nimport DeliveryNoteBuilder from './sales/DeliveryNoteBuilder';"
  );
}

// Next we replace the preview frame contents conditionally
const startReplace = `        {/* Editable Preview Frame */}
        <div className="bg-slate-200 p-2 md:p-8 rounded-3xl -mx-4 md:mx-0 shadow-inner overflow-hidden print:bg-transparent print:shadow-none print:p-0 print:m-0 print:overflow-visible">`;

const endReplace = `          </div>
        </div>`; // After page2 rendering

const newContent = `        {/* Editable Preview Frame */}
        <div className="bg-slate-200 p-2 md:p-8 rounded-3xl -mx-4 md:mx-0 shadow-inner overflow-hidden print:bg-transparent print:shadow-none print:p-0 print:m-0 print:overflow-visible">
          {docTemplate === 'delivery_note' ? (
            <DeliveryNoteBuilder quoteId={selectedQuoteId} quotes={quotes} clients={clients} user={user} onSaveDraft={(c) => { setDocContent(c); handleExport(); }} />
          ) : (
            <>
              <p className="text-center text-[10px] text-slate-400 mb-2 print:hidden font-bold">معاينة قابلة للتعديل - انقر على النص للتعديل وإضافة بنودك مباشرة قبل الطباعة</p>
              <div className="max-w-[210mm] mx-auto print:hidden">
                <RichTextToolbar />
                
                {/* AI Professional Translation Bar */}
                <div className="bg-white border-t border-slate-100 p-3 flex flex-wrap items-center justify-between gap-2 rounded-b-xl mb-4 shadow-sm text-right" dir="rtl">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    ✨ {lang === 'ar' ? 'ترجمة الخطاب الفورية (Gemini AI):' : 'Instant AI Translation (Gemini):'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTranslateLetter("ar")}
                      disabled={isTranslating}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTranslating ? 'جاري الترجمة...' : 'ترجمة إلى العربية 🇸🇦'}
                    </button>
                    <button
                      onClick={() => handleTranslateLetter("en")}
                      disabled={isTranslating}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTranslating ? 'Translating...' : 'Translate to English 🇬🇧'}
                    </button>
                  </div>
                </div>
              </div>

              <div id="printable-sales-letter-container">
                <div id="printable-sales-letter" className="relative mx-auto bg-white shadow print:shadow-none print:m-0 overflow-hidden" style={{ width: '210mm', height: '297mm', padding: '3cm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Formal Header */}
                  <DocumentHeader />

                  {/* Editable Content */}
                  <div 
                    contentEditable 
                    suppressContentEditableWarning
                    className="outline-none whitespace-pre-wrap font-sans text-sm leading-7 text-stone-800" style={{ flexGrow: 1 }}
                    onBlur={(e) => setDocContent(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: docContent }}
                  />

                  {/* Footer Signatures - hidden for Sales Rep on active design unless approved */}
                  {user?.role !== 'Sales Rep' && (
                    <div className="flex flex-col items-center justify-center relative z-10 pointer-events-none" style={{ marginTop: '-4rem', marginBottom: '-2rem' }} contentEditable={false}>
                      <p className="text-slate-500 font-bold mb-1 text-sm bg-white/70 px-2 rounded">ختم شركة الوليد</p>
                      <img src="https://i.postimg.cc/kXNd2vcT/Whats-App-Image-2026-02-26-at-3-36-23-PM.png" alt="ختم الشركة" className="w-28 h-auto object-contain opacity-90 mix-blend-multiply" />
                    </div>
                  )}
                  
                  <div className="mt-auto relative z-0">
                    <DocumentFooter />
                  </div>
                </div>

                {docCategory === 'financial' && (
                  <div id="printable-sales-letter-page2" className="page-break relative mx-auto mt-8 bg-white shadow print:shadow-none print:m-0 overflow-hidden" style={{ width: '210mm', height: '297mm', padding: '3cm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', pageBreakBefore: 'always' }}>
                    <DocumentHeader />
                    <div className="flex-grow flex flex-col items-center justify-center pt-10">
                      <h2 className="text-xl font-bold text-slate-800 mb-8 border-b-2 border-indigo-500 pb-2">البيانات البنكية لشركة فنون الوليد للصناعة</h2>
                      <img src="https://i.postimg.cc/yNbMMQ1V/Whats-App-Image-2026-06-17-at-11-47-06-AM.jpg" alt="البيانات البنكية" className="w-full max-w-lg h-auto shadow-sm rounded-xl border border-slate-200" />
                    </div>
                    <DocumentFooter />
                  </div>
                )}
              </div>
            </>
          )}
        </div>`;

const parts = code.split(startReplace);
if (parts.length > 1) {
  const parts2 = parts[1].split(endReplace);
  if (parts2.length > 1) {
    parts2.shift(); // remove the part we want to replace
    code = parts[0] + newContent + parts2.join(endReplace);
  }
}

fs.writeFileSync('src/components/SalesLetters.tsx', code);
