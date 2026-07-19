const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

// Replace handleApproveDevice
const regexApprove = /const handleApproveDevice = async[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\};/m;
code = code.replace(regexApprove, `const handleApproveDevice = async (requestId: string, targetUsername: string) => {
    try {
      const res = await fetch(\`/api/device-change-requests/\${requestId}/approve\`, {
        method: "POST"
      });
      if (res.ok) {
         setDeviceRequests(prev => prev.filter(req => req.id !== requestId));
         alert("تم قبول طلب استبدال الجهاز بنجاح! تم استبدال الجهاز بنجاح وتوثيق تفاصيل المتصفح والبيئة الجديدة.");
      } else {
         const errData = await res.json();
         alert("فشل قبول وتوثيق الجهاز: " + (errData.error || "خطأ غير معروف"));
      }
    } catch (err) {
      console.error(err);
      alert("System error");
    }
  };`);

// Replace handleRejectDevice
const regexReject = /const handleRejectDevice = async[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\};/m;
code = code.replace(regexReject, `const handleRejectDevice = async (requestId: string) => {
    try {
      const res = await fetch(\`/api/device-change-requests/\${requestId}/reject\`, {
        method: "POST"
      });
      if (res.ok) {
         setDeviceRequests(prev => prev.filter(req => req.id !== requestId));
         alert("تم رفض طلب استبدال الجهاز بنجاح وإزالته.");
      } else {
         const errData = await res.json();
         alert("فشل رفض الجهاز: " + (errData.error || "خطأ غير معروف"));
      }
    } catch (err) {
      console.error(err);
      alert("System error");
    }
  };`);

// Find the start of the component to add state and fetch logic
const regexComponentStart = /export default function AdvancedPermissionsPortal\(\{[\s\S]*?\}\: any\) \{/m;
const componentStartMatch = code.match(regexComponentStart);
if (componentStartMatch) {
  const insertIndex = componentStartMatch.index + componentStartMatch[0].length;
  code = code.slice(0, insertIndex) + `
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/device-change-requests");
        if (res.ok) {
          const data = await res.json();
          setDeviceRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Failed to fetch device requests", err);
      }
    };
    fetchRequests();
  }, []);
` + code.slice(insertIndex);
}

// Update the UI rendering of pending requests
const regexUI = /\{localUsers\.filter\(u => u\.pendingDeviceApprovalId\)\.length > 0 \? \([\s\S]*?\<\!-- Pending Approvals --\>/m;
// Actually let's just replace the specific section. It starts with <h5 className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
const regexList = /\{localUsers\.filter\(u => u\.pendingDeviceApprovalId\)\.length > 0 \? \([\s\S]*?\) \: \(/m;
code = code.replace(regexList, `{deviceRequests.length > 0 ? (
                                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {deviceRequests.map(req => (
                                           <div key={req.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 text-right">
                                              <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
                                                 <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">طلب معلق</span>
                                                 <span className="text-xs font-black text-slate-800">{req.username}</span>
                                              </div>
                                              <div>
                                                 <span className="block text-[10px] text-[#0072BC] mt-1 font-black">جهاز جديد: {req.deviceName}</span>
                                                 <span className="block text-[10px] text-slate-500 mt-1 font-mono break-all">{req.newDeviceId}</span>
                                                 {req.platform && (
                                                    <span className="block text-[10px] text-slate-600 mt-1 font-bold">💻 نظام التشغيل: {req.platform}</span>
                                                 )}
                                                 {req.browser && (
                                                    <span className="block text-[10px] text-slate-600 mt-1 font-bold">🌐 المتصفح: {req.browser}</span>
                                                 )}
                                                 {req.createdAt && (
                                                    <span className="block text-[9px] text-slate-400 mt-1 font-semibold">🕒 طلب في: {new Date(req.createdAt).toLocaleString("ar-EG")}</span>
                                                 )}
                                              </div>
                                              <div className="flex gap-2">
                                                 <button
                                                    type="button"
                                                    onClick={() => handleApproveDevice(req.id, req.username)}
                                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black transition text-center"
                                                 >
                                                    قبول وتوثيق
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => handleRejectDevice(req.id)}
                                                    className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition text-center"
                                                 >
                                                    رفض الطلب
                                                 </button>
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  ) : (`);

// There's also the single user pending device logic. Let's find it.
const regexSingleUser = /\{pendingDeviceApprovalId && \([\s\S]*?<\/div>\s*\)\}/m;
// I'll just remove the single user pending logic by making it match empty, or we can leave it since it's harmless if pendingDeviceApprovalId is empty. But I should clear the device lock bypass code in App.tsx.

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', code);
console.log("Patched admin portal");
