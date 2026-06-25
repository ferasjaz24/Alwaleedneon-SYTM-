const fs = require('fs');
const path = require('path');

const updateInquiries = () => {
    // 1. Employee inquiry submit to explicitly set status = 'PENDING'
    let hrSelfPath = path.join(__dirname, 'src/components/hr/HrSelfServiceTab.tsx');
    let hrSelfContent = fs.readFileSync(hrSelfPath, 'utf8');

    hrSelfContent = hrSelfContent.replace(
        "details: inquiryDetails\n    };",
        "details: inquiryDetails,\n      status: 'PENDING'\n    };"
    );

    hrSelfContent = hrSelfContent.replace(
        "const [hrNotes, setHrNotes] = useState('');",
        "const [hrNotes, setHrNotes] = useState('');\n  const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');"
    );

    // Replace the resolving inline form in HrSelfServiceTab (line ~550)
    let regexFormSelf = /<form onSubmit=\{handleResolveInquiry\} className="flex gap-2 w-full mt-2">[\s\S]*?<\/form>/;
    let newFormSelf = `<form onSubmit={(e) => {
                e.preventDefault();
                let finalNote = hrNotes;
                if (hrReplyType === 'VISIT_HR') finalNote = lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office for this inquiry';
                else if (hrReplyType === 'DOCUMENT_LINK') finalNote = (lang === 'ar' ? 'رد عن طريق ارسال رابط مستند: ' : 'Document link: ') + hrReplyLink;
                else if (hrReplyType === 'SENT_EMAIL') finalNote = lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email';
                
                if (!resolvingId || !finalNote) return;
                fetch(\`/api/inquiries/\${resolvingId}\`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'RESOLVED', hrNotes: finalNote })
                }).then(res => {
                  if(res.ok) {
                    setResolvingId(null);
                    setHrNotes('');
                    setHrReplyLink('');
                    // @ts-ignore
                    fetchInquiriesAndLeaves();
                  }
                });
              }} className="flex flex-col gap-2 w-full mt-2 bg-slate-50 p-2 rounded-xl border">
                <select 
                  value={hrReplyType} 
                  onChange={e => setHrReplyType(e.target.value)}
                  className="w-full p-1.5 border rounded-lg text-[10px]"
                >
                  <option value="CUSTOM">{lang === 'ar' ? 'رد مخصص نصي' : 'Custom text reply'}</option>
                  <option value="VISIT_HR">{lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office'}</option>
                  <option value="DOCUMENT_LINK">{lang === 'ar' ? 'رد عن طريق ارسال رابط مستند' : 'Respond with a document link'}</option>
                  <option value="SENT_EMAIL">{lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email'}</option>
                </select>
                
                {hrReplyType === 'DOCUMENT_LINK' && (
                  <input 
                    type="url" 
                    value={hrReplyLink}
                    onChange={e => setHrReplyLink(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-[10px]"
                    placeholder={lang === 'ar' ? 'أدخل رابط المستند هنا (يبدأ بـ http://)...' : 'Enter document URL...'}
                    required
                  />
                )}
                {hrReplyType === 'CUSTOM' && (
                  <input 
                    type="text" 
                    value={hrNotes}
                    onChange={e => setHrNotes(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-[10px]"
                    placeholder={lang === 'ar' ? 'إدخال الرد الإداري...' : 'Append HR notes here...'}
                    required
                  />
                )}
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px]">
                    {lang === 'ar' ? 'تأكيد وإرسال الرد' : 'Submit Response'}
                  </button>
                  <button type="button" onClick={() => setResolvingId(null)} className="px-3 py-1.5 bg-slate-200 rounded-lg text-[10px]">
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>`;
    hrSelfContent = hrSelfContent.replace(regexFormSelf, newFormSelf);

    // Replace the URL rendering
    let regexRenderLink = /\{item\.hrNotes\.includes\('http'\) \? \([\s\S]*?\) : \(/;
    let newRenderLink = `{item.hrNotes.includes('http') ? (
                                        <>
                                          <p>{item.hrNotes.split('http')[0]}</p>
                                          <a 
                                            href={'http' + item.hrNotes.split('http').slice(1).join('http')} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 p-1.5 px-3 bg-[#0072BC] text-white rounded text-[10px] font-black hover:brightness-105"
                                          >
                                            📥 {lang === 'ar' ? 'فتح المرفق وإظهاره' : 'Open document'}
                                          </a>
                                        </>
                                      ) : (`;
    hrSelfContent = hrSelfContent.replace(regexRenderLink, newRenderLink);
    
    fs.writeFileSync(hrSelfPath, hrSelfContent, 'utf8');

    // 2. HrDashboardTab.tsx
    let hrDashPath = path.join(__dirname, 'src/components/hr/HrDashboardTab.tsx');
    let hrDashContent = fs.readFileSync(hrDashPath, 'utf8');

    hrDashContent = hrDashContent.replace(
        "const [hrReplyNote, setHrReplyNote] = useState('');",
        "const [hrReplyNote, setHrReplyNote] = useState('');\n  const [hrReplyType, setHrReplyType] = useState('CUSTOM');\n  const [hrReplyLink, setHrReplyLink] = useState('');"
    );

    let handleAnswerRegex = /const handleAnswerInquiry = async \(id: string, empName: string\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?\}[\s\S]*?\};/;
    let newHandleAnswer = `const handleAnswerInquiry = async (id: string, empName: string) => {
    let finalNote = hrReplyNote;
    if (hrReplyType === 'VISIT_HR') finalNote = lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office for this inquiry';
    else if (hrReplyType === 'DOCUMENT_LINK') finalNote = (lang === 'ar' ? 'رد عن طريق ارسال رابط مستند: ' : 'Document link: ') + hrReplyLink;
    else if (hrReplyType === 'SENT_EMAIL') finalNote = lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email';

    if (!finalNote) return;
    try {
      const res = await fetch(\`/api/inquiries/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', hrNotes: finalNote })
      });
      if (res.ok) {
        // @ts-ignore
        addLog(
          \`الرد الفوري على طلب استعلام الموظف '\${empName}'\`,
          \`Sent inquiry response to '\${empName}'\`
        );
        setAnsweringInquiryId(null);
        setHrReplyNote('');
        setHrReplyLink('');
        // @ts-ignore
        fetchQueueData();
      }
    } catch (err) {
      console.error(err);
    }
  };`;
    hrDashContent = hrDashContent.replace(handleAnswerRegex, newHandleAnswer);

    // Replace the dashboard answering form block explicitly
    let dashContentBlockOld = `{answeringInquiryId && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-right" dir="rtl">
            <h5 className="font-extrabold text-xs text-[#0072BC]">💬 {lang === 'ar' ? 'صياغة الرد الرسمي وإرساله لصفحة استعلام الموظف:' : 'Compose Response for Employee Portal:'}</h5>
            <div>
              <textarea 
                value={hrReplyNote}
                onChange={(e) => setHrReplyNote(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرد التفصيلي هنا (الرد ينعكس فوراً للموظف في صفحة الاستعلامات)...' : 'Write details (updates candidate portal live)...'}
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs h-20 leading-relaxed font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const item = inquiriesList.find(i => i.id === answeringInquiryId);
                  if (item) handleAnswerInquiry(answeringInquiryId, item.name);
                }}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[10px] font-black hover:bg-sky-700 transition"
              >
                {lang === 'ar' ? 'إرسال الرد والإغلاق' : 'Send & Resolve'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setAnsweringInquiryId(null);
                  setHrReplyNote('');
                }}
                className="px-3 py-2 bg-slate-200 rounded-xl text-[10px] text-slate-700"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}`;

    let dashContentBlockNew = `{answeringInquiryId && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-right" dir="rtl">
            <h5 className="font-extrabold text-xs text-[#0072BC]">💬 {lang === 'ar' ? 'صياغة الرد الرسمي وإرساله لصفحة استعلام الموظف:' : 'Compose Response:'}</h5>
            
            <select 
              value={hrReplyType} 
              onChange={e => setHrReplyType(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs font-bold"
            >
               <option value="CUSTOM">{lang === 'ar' ? 'رد مخصص نصي' : 'Custom text reply'}</option>
               <option value="VISIT_HR">{lang === 'ar' ? 'يرجى الاستعلام من مكتب الموارد البشرية' : 'Please visit HR office'}</option>
               <option value="DOCUMENT_LINK">{lang === 'ar' ? 'رد عن طريق ارسال رابط مستند' : 'Respond with a document link'}</option>
               <option value="SENT_EMAIL">{lang === 'ar' ? 'تم الارسال عبر الايميل' : 'Sent via email'}</option>
            </select>

            {hrReplyType === 'DOCUMENT_LINK' && (
              <div>
                <input 
                  type="url" 
                  value={hrReplyLink}
                  onChange={e => setHrReplyLink(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder={lang === 'ar' ? 'أدخل رابط المستند هنا...' : 'Enter document URL...'}
                  required
                />
              </div>
            )}
            
            {hrReplyType === 'CUSTOM' && (
            <div>
              <textarea 
                value={hrReplyNote}
                onChange={(e) => setHrReplyNote(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرد التفصيلي هنا (الرد ينعكس فوراً للموظف في صفحة الاستعلامات)...' : 'Write details...'}
                required
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs h-20 leading-relaxed font-bold"
              />
            </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const item = inquiriesList.find(i => i.id === answeringInquiryId);
                  if (item) handleAnswerInquiry(answeringInquiryId, item.name);
                }}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[10px] font-black hover:bg-sky-700 transition"
              >
                {lang === 'ar' ? 'إرسال الرد والإغلاق' : 'Send & Resolve'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setAnsweringInquiryId(null);
                  setHrReplyNote('');
                  setHrReplyLink('');
                }}
                className="px-3 py-2 bg-slate-200 rounded-xl text-[10px] text-slate-700"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}`;

    hrDashContent = hrDashContent.replace(dashContentBlockOld, dashContentBlockNew);

    fs.writeFileSync(hrDashPath, hrDashContent, 'utf8');
    console.log('Fixed HrDashboardTab and HrSelfServiceTab');
}

updateInquiries();
