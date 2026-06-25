import fs from 'fs';

let content = fs.readFileSync('src/components/UserPermissionsModal.tsx', 'utf8');

if (!content.includes('const [editUsername, setEditUsername]')) {
  // Add state
  content = content.replace(
    'const [expandedModule, setExpandedModule] = useState<string | null>(null);',
    `const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editPassword, setEditPassword] = useState(user.password || '');`
  );

  // Add UI for editing username and password
  const uiAdd = `
          {/* User Details Editing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'اسم المستخدم (لتسجيل الدخول)' : 'Username (Login)'}
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
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
            <div className="col-span-1 sm:col-span-2 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded flex items-center gap-1 font-bold">
               <Info className="w-3 h-3" />
               {lang === 'ar' ? 'تعديل اسم المستخدم سيقوم تلقائياً بتحديث جميع أعماله وسجلاته السابقة وربطها بالاسم الجديد ولن تفقد أي بيانات.' : 'Modifying username will automatically migrate all previous history to the new name.'}
            </div>
          </div>
  `;
  content = content.replace(
    '<div className="p-4 bg-blue-50 text-blue-800',
    uiAdd + '\n          <div className="p-4 bg-blue-50 text-blue-800'
  );

  // Update save
  content = content.replace(
    'onSave(user.username, { moduleAccess: permissions });',
    `onSave(user.username, { 
                moduleAccess: permissions, 
                newUsername: editUsername, 
                password: editPassword 
              });`
  );
  
  fs.writeFileSync('src/components/UserPermissionsModal.tsx', content, 'utf8');
  console.log('updated modal');
}
