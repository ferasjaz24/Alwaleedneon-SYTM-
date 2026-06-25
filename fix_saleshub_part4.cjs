const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

const regexClass = /<div>\s*<label className="block mb-1\.5 text-indigo-700">التصنيف التجاري لنشاط العميل<\/label>[\s\S]*?<\/div>\s*<\/div>/g;

const newClassAndAddress = `
              <div>
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  {/* Comm. Classification */}
                  <div className="flex-1">
                    <label className="block mb-1.5 text-indigo-700 font-bold">التصنيف التجاري لنشاط العميل</label>
                    <div className="flex flex-wrap gap-2">
                      {commercialClasses.map(cl => (
                        <button
                          key={cl}
                          onClick={() => setEditingClient({...editingClient, classification: cl})}
                          className={\`px-3 py-1.5 border rounded-lg transition text-xs \${editingClient?.classification === cl ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600'}\`}
                        >
                          {cl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* National Address Header (Toggle) */}
                  <div className="flex-1">
                     <label className="block mb-1.5 text-indigo-700 font-bold">&nbsp;</label>
                     <button
                       onClick={() => setShowNationalAddress(!showNationalAddress)}
                       className="w-full justify-between flex items-center gap-2 px-4 py-2 border-2 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-xl font-bold transition"
                     >
                       <span>📍 تفاصيل العنوان الوطني (اختياري)</span>
                       {showNationalAddress ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                     </button>
                  </div>
                </div>

                {/* National Address Fields */}
                {showNationalAddress && (
                  <div className="mt-4 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in relative">
                     <span className="absolute -top-3 right-6 bg-white px-3 text-xs text-indigo-600 font-bold border border-indigo-100 rounded-lg">بيانات العنوان الوطني للتسجيل</span>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">رقم المبنى</label>
                       <input 
                         type="text" 
                         maxLength={4}
                         value={editingClient?.nationalAddress?.buildingNumber || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), buildingNumber: e.target.value.replace(/\\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="4 أرقام"
                         dir="ltr"
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">اسم الشارع</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.streetName || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), streetName: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="شارع الأمير..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">اسم الحي</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.district || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), district: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="حي الورود..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">المدينة (بالعنوان)</label>
                       <input 
                         type="text" 
                         value={editingClient?.nationalAddress?.city || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), city: e.target.value}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="الرياض..."
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">الرمز البريدي</label>
                       <input 
                         type="text" 
                         maxLength={5}
                         value={editingClient?.nationalAddress?.postalCode || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), postalCode: e.target.value.replace(/\\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="5 أرقام"
                         dir="ltr"
                       />
                     </div>
                     <div>
                       <label className="block mb-1 text-xs text-slate-500">الرقم الإضافي / الفرعي</label>
                       <input 
                         type="text" 
                         maxLength={4}
                         value={editingClient?.nationalAddress?.additionalNumber || ''}
                         onChange={e => setEditingClient({...editingClient, nationalAddress: {...(editingClient.nationalAddress || {}), additionalNumber: e.target.value.replace(/\\D/g,'')}})}
                         className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         placeholder="4 أرقام"
                         dir="ltr"
                       />
                     </div>
                  </div>
                )}
              </div>
`;

c = c.replace(regexClass, newClassAndAddress);

// Injecting Toast UI
if (!c.includes("noDataToast && (")) {
  c = c.replace(/return \(\s*<div className="space-y-6 animate-fade-in font-sans" dir="rtl">/g, 
`return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      {noDataToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <AlertTriangle className="w-5 h-5"/>
          {lang === 'ar' ? 'لا توجد معلومات للعملاء من الملف' : 'No client information found from file'}
        </div>
      )}
`);
}

fs.writeFileSync(f, c, 'utf8');
