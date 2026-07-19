const fs = require('fs');
let code = fs.readFileSync('src/components/AdvancedPermissionsPortal.tsx', 'utf8');

code = code.replace('{/* Pending Approvals */}', `
                                     </div>
                                  ) : (
                                     <div className="py-4 text-center space-y-2">
                                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                                        <p className="text-xs font-black text-slate-700">لا يوجد جهاز مرتبط حالياً</p>
                                        <p className="text-[11px] text-slate-400 font-semibold">
                                           سيقوم النظام تلقائياً بربط أول جهاز يقوم بالولوج للحساب كجهاز موثق تلقائياً.
                                        </p>
                                     </div>
                                  )}
                               </div>

                               {/* Pending Approvals */}`);

fs.writeFileSync('src/components/AdvancedPermissionsPortal.tsx', code);
