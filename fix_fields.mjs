import fs from 'fs';

let content = fs.readFileSync('src/components/UserPermissionsModal.tsx', 'utf8');

content = content.replace(
  `onSave: (username: string, payload: UserPermissions & { newUsername?: string, password?: string }) => void;`,
  `onSave: (username: string, payload: UserPermissions & { newUsername?: string, password?: string, role?: string, jobTitle?: string }) => void;`
);

content = content.replace(
  `const [editUsername, setEditUsername] = useState(user.username || '');
  const [editPassword, setEditPassword] = useState(user.password || '');`,
  `const [editUsername, setEditUsername] = useState(user.username || '');
  const [editPassword, setEditPassword] = useState(user.password || '');
  const [editRole, setEditRole] = useState(user.role || '');
  const [editJobTitle, setEditJobTitle] = useState(user.jobTitle || '');`
);

const uiReplace = `            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'الدور والصلاحية (Role)' : 'Role'}
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 text-sm"
              >
                 <option value="Employee (Inquiries)">{lang === "ar" ? "موظف (استعلام فقط)" : "Employee (Inquiries)"}</option>
                 <option value="Sales Rep">{lang === "ar" ? "مندوب مبيعات" : "Sales Rep"}</option>
                 <option value="HR Manager">{lang === "ar" ? "مدير موارد بشرية" : "HR Manager"}</option>
                 <option value="Purchasing">{lang === "ar" ? "مسؤول مشتريات" : "Purchasing"}</option>
                 <option value="Production">{lang === "ar" ? "مسؤول إنتاج" : "Production"}</option>
                 <option value="Admin">{lang === "ar" ? "مدير نظام" : "Admin"}</option>
                 <option value="General Admin Director">{lang === "ar" ? "المدير العام (صلاحيات كاملة)" : "General Director"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
              </label>
              <input
                type="text"
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded flex items-center gap-1 font-bold">`;

content = content.replace(
  `            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded flex items-center gap-1 font-bold">`,
  uiReplace
);

content = content.replace(
  `onSave(user.username, { 
                moduleAccess: permissions, 
                newUsername: editUsername, 
                password: editPassword 
              });`,
  `onSave(user.username, { 
                moduleAccess: permissions, 
                newUsername: editUsername, 
                password: editPassword,
                role: editRole,
                jobTitle: editJobTitle
              });`
);

fs.writeFileSync('src/components/UserPermissionsModal.tsx', content, 'utf8');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  `const { newUsername, password, ...rest } = payload as any;
                   handleUpdateUser(username, { 
                     ...(newUsername && { newUsername }),
                     ...(password && { password }),
                     permissions: rest 
                   });`,
  `const { newUsername, password, role, jobTitle, ...rest } = payload as any;
                   handleUpdateUser(username, { 
                     ...(newUsername && { newUsername }),
                     ...(password && { password }),
                     ...(role && { role }),
                     ...(jobTitle && { jobTitle }),
                     permissions: rest 
                   });`
);
fs.writeFileSync('src/App.tsx', appContent, 'utf8');
