let fs = require("fs");
let c = fs.readFileSync("src/components/SalesHub.tsx", "utf8");

// 1. Fix getClientStatus
let oldGetClientRegex = /const getClientStatus = \(clientId: string\) => \{[\s\S]*?return '-'; *\/\/ default.*?\n  \};/m;
let newGetClient = `const getClientStatus = (clientId: string) => {
    const clientQuotes = quotations.filter(q => (q.customerId === clientId || q.clientName === getClientName(clientId)) && q.status === 'معتمد');
    if (clientQuotes.length === 0) return 'عميل راكد';
    
    // Get latest approved quote date
    const latestQuote = clientQuotes.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0];
    const monthsDiff = (new Date().getTime() - new Date(latestQuote.dateCreated).getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 1) return 'عميل نشط';
    if (monthsDiff > 12) return 'عميل قديم';
    if (monthsDiff > 5) return 'عميل منسي';
    if (monthsDiff > 2) return 'عميل راكد';
    return 'عميل نشط'; 
  };`;
c = c.replace(oldGetClientRegex, newGetClient);

// 2. Fix printClientDetails to filter by 'معتمد'
let oldPrintClientFilter = `const clientQuotes = quotations.filter(q => q.customerId === client.id || q.clientName === client.clientName);`;
let newPrintClientFilter = `const clientQuotes = quotations.filter(q => (q.customerId === client.id || q.clientName === client.clientName) && q.status === 'معتمد');`;
c = c.replace(oldPrintClientFilter, newPrintClientFilter);

// 3. Enable delete button by removing isManagement() condition inside handleDeleteClient
let handleDeleteClientStr = `const handleDeleteClient = async (id: string) => {
    // Cannot delete if linked
    const isLinked = quotations.some(q => q.customerId === id || q.clientName === getClientName(id));
    if (isLinked) {
      alert(lang === 'ar' ? 'لا يمكن حذف عميل مرتبط بعرض سعر' : 'Cannot delete client linked to quotations');
      return;
    }

    if (!isManagement()) {
      alert(lang === 'ar' ? 'لا تملك صلاحية الحذف' : 'No delete permission');
      return;
    }

    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Confirm deletion?')) return;`;

let newHandleDeleteClientStr = `const handleDeleteClient = async (id: string) => {
    // Cannot delete if linked
    const isLinked = quotations.some(q => q.customerId === id || q.clientName === getClientName(id));
    if (isLinked) {
      alert(lang === 'ar' ? 'لا يمكن حذف عميل مرتبط بعرض سعر (سواء معتمد أو مسودة)' : 'Cannot delete client linked to quotations');
      return;
    }

    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف العميل نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Confirm deletion?')) return;`;
c = c.replace(handleDeleteClientStr, newHandleDeleteClientStr);

// 4. Remove {isManagement() && ( ... )} around the delete button
let buttonHtmlOld = `{isManagement() && (
                       <button 
                         onClick={() => handleDeleteClient(client.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition mr-auto"
                       >
                         <Trash2 className="w-4 h-4" />
                         حذف العميل نهائياً
                       </button>
                     )}`;
let buttonHtmlNew = `<button 
                         onClick={() => handleDeleteClient(client.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition mr-auto"
                       >
                         <Trash2 className="w-4 h-4" />
                         حذف العميل نهائياً
                       </button>`;
c = c.replace(buttonHtmlOld, buttonHtmlNew);

fs.writeFileSync("src/components/SalesHub.tsx", c);
console.log("Success");
