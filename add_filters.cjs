const fs = require('fs');
const path = require('path');

const applyFilterstoSelfService = () => {
    let filepath = path.join(__dirname, 'src/components/hr/HrSelfServiceTab.tsx');
    let content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes('setInquirySortOrder')) {
        content = content.replace(
            "const [hrNotes, setHrNotes] = useState('');\n  const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');",
            "const [hrNotes, setHrNotes] = useState('');\n  const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');\n  // Filter and config\n  const [inquirySortOrder, setInquirySortOrder] = useState<'desc' | 'asc'>('desc');\n  const [inquiryDateFilter, setInquiryDateFilter] = useState('');\n  const [inquiryNameFilter, setInquiryNameFilter] = useState('');"
        );

        let searchRegex = /const filteredInquiries = inquiries\.filter\(i => \{[\s\S]*?\}\);/;
        let newFilters = `const filteredInquiries = inquiries.filter(i => {
    if (isEmployeeRole) {
      if (i.empId !== boundEmployeeId) return false;
    }
    if (inquiryNameFilter && !i.name?.toLowerCase().includes(inquiryNameFilter.toLowerCase())) return false;
    if (inquiryDateFilter && !i.dateCreated?.includes(inquiryDateFilter)) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.dateCreated || 0).getTime();
    const timeB = new Date(b.dateCreated || 0).getTime();
    return inquirySortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });`;
        if(searchRegex.test(content)) {
            content = content.replace(searchRegex, newFilters);
        } else {
            console.log("Could NOT find filteredInquiries in HrSelfServiceTab!");
        }

        let insertUI = `{/* IF NOT EMPLOYEE ROLE (HR ADMIN PORTAL VIEW) */}
            {!isEmployeeRole ? (
              <div className="space-y-4">
                {/* Advanced Filters */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600" dir="rtl">
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'بحث باسم الموظف:' : 'Search by Name:'}</label>
                    <input 
                      type="text" 
                      value={inquiryNameFilter}
                      onChange={e => setInquiryNameFilter(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب اسم الموظف...' : 'Enter name...'}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'بحث بالتاريخ:' : 'Search by Date:'}</label>
                    <input 
                      type="date" 
                      value={inquiryDateFilter}
                      onChange={e => setInquiryDateFilter(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">{lang === 'ar' ? 'ترتيب حسب (الأحدث/الأقدم):' : 'Sort By:'}</label>
                    <select 
                      value={inquirySortOrder}
                      onChange={(e: any) => setInquirySortOrder(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="desc">{lang === 'ar' ? 'من الأحدث إلى الأقدم' : 'Newest to Oldest'}</option>
                      <option value="asc">{lang === 'ar' ? 'من الأقدم إلى الأحدث' : 'Oldest to Newest'}</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">`;

        content = content.replace(/\{\/\* IF NOT EMPLOYEE ROLE \(HR ADMIN PORTAL VIEW\) \*\/\}\s*\{!isEmployeeRole \? \(\s*<div className="overflow-x-auto">/, insertUI);
        content = content.replace(/<\/table>\s*<\/div>\s*\)\s*:\s*null/g, "</table>\n              </div>\n              </div>\n            ) : null");

        fs.writeFileSync(filepath, content, 'utf8');
        console.log("Updated HrSelfService");
    }
}

const applyFilterstoDashboard = () => {
    let filepath = path.join(__dirname, 'src/components/hr/HrDashboardTab.tsx');
    let content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes('setInquiryDashSort')) {
        content = content.replace(
            "const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');",
            "const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');\n  const [inquiryDashSort, setInquiryDashSort] = useState<'desc' | 'asc'>('desc');\n  const [inquiryDashDate, setInquiryDashDate] = useState('');\n  const [inquiryDashName, setInquiryDashName] = useState('');"
        );

        let filteredDashSearchStr = `const filteredPendingInquiries = inquiriesList.filter(i => {
    let m = i.status === 'PENDING';
    if (!m) return false;
    if (inquiryDashName && !i.name?.toLowerCase().includes(inquiryDashName.toLowerCase())) return false;
    if (inquiryDashDate && !i.dateCreated?.includes(inquiryDashDate)) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.dateCreated || 0).getTime();
    const timeB = new Date(b.dateCreated || 0).getTime();
    return inquiryDashSort === 'desc' ? timeB - timeA : timeA - timeB;
  });`;

        content = content.replace("const handleAnswerInquiry =", filteredDashSearchStr + "\n\n  const handleAnswerInquiry =");

        let filterUIRegex = /<h5 className="text-\[11px\] font-black text-slate-600 bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100">\s*💬 \{lang === 'ar' \? 'طلبات الاستعلام والأوراق المرفوعة' : 'Inquiries & Paper Claims Queue'\}\s*<\/h5>/;
        
        let newFilterUI = `<h5 className="text-[11px] font-black text-slate-600 bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100">
              💬 {lang === 'ar' ? 'طلبات الاستعلام والأوراق المرفوعة' : 'Inquiries & Paper Claims Queue'}
            </h5>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 space-y-2 text-xs font-bold text-slate-600" dir="rtl">
              <div>
                <input 
                  type="text" 
                  value={inquiryDashName}
                  onChange={e => setInquiryDashName(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث باسم المستعلم...' : 'Search employee name...'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={inquiryDashDate}
                  onChange={e => setInquiryDashDate(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <select 
                  value={inquiryDashSort}
                  onChange={(e: any) => setInquiryDashSort(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="desc">{lang === 'ar' ? 'الأحدث أولاً' : 'Newest First'}</option>
                  <option value="asc">{lang === 'ar' ? 'الأقدم أولاً' : 'Oldest First'}</option>
                </select>
              </div>
            </div>`;

        content = content.replace(filterUIRegex, newFilterUI);
        content = content.replace(/inquiriesList\.filter\(i => i\.status === 'PENDING'\)\.length/g, "filteredPendingInquiries.length");
        content = content.replace(/inquiriesList\.filter\(i => i\.status === 'PENDING'\)\.map/g, "filteredPendingInquiries.map");

        fs.writeFileSync(filepath, content, 'utf8');
        console.log("Updated HrDashboardTab");
    }
}

applyFilterstoSelfService();
applyFilterstoDashboard();
