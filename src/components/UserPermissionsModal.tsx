import React, { useState, useEffect } from 'react';
import { User, UserPermissions, ModulePermissions } from '../types';
import { X, ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
  onSave: (username: string, payload: UserPermissions & { newUsername?: string, password?: string, role?: string, jobTitle?: string }) => void;
  lang: 'ar' | 'en';
}

const defaultModulePermissions: ModulePermissions = {
  enabled: false,
  viewAccess: 'none',
  editAccess: 'none',
  deleteAccess: 'none',
  add: false,
  approve: false,
  exportPdf: false,
  exportExcel: false,
  print: false,
  deleteSensitive: false,
  viewCosts: false,
};

const buildDefaultAccess = (): UserPermissions['moduleAccess'] => ({
  hr: { ...defaultModulePermissions },
  sales: { ...defaultModulePermissions },
  finance: { ...defaultModulePermissions },
  production: { ...defaultModulePermissions },
  procurement: { ...defaultModulePermissions },
  reports: { ...defaultModulePermissions },
  settings: { ...defaultModulePermissions },
  notifications: { ...defaultModulePermissions }
});

const legacyRoleMappings: Record<string, Partial<UserPermissions['moduleAccess']>> = {
  'General Admin Director': { // Super Admin equivalent
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    sales: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    finance: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    production: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    procurement: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    settings: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
  },
  'Super Admin': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    sales: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    finance: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    production: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    procurement: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
    settings: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, deleteSensitive: true, viewCosts: true },
  },
  'HR Manager': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'none', add: true, approve: true, exportPdf: true, exportExcel: true, print: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'all' },
  },
  'Sales Rep': {
    sales: { ...defaultModulePermissions, enabled: true, viewAccess: 'own', editAccess: 'own', deleteAccess: 'none', add: true, exportPdf: true, print: true },
    finance: { ...defaultModulePermissions, enabled: true, viewAccess: 'own', editAccess: 'none', add: true, exportPdf: true, print: true },
    production: { ...defaultModulePermissions, enabled: true, viewAccess: 'own' },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'own' },
  },
  'Purchasing': {
    procurement: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'none', add: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'all' },
  },
  'Production': {
    sales: { ...defaultModulePermissions, enabled: true, viewAccess: 'own' },
    production: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'none', add: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'own' },
  },
  'Admin': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    sales: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    finance: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    production: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    procurement: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    reports: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    settings: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
    notifications: { ...defaultModulePermissions, enabled: true, viewAccess: 'all', editAccess: 'all', deleteAccess: 'all', add: true, approve: true, exportPdf: true, exportExcel: true, print: true, viewCosts: true },
  },
  'Employee': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'own', editAccess: 'own', add: true },
  },
  'Employee (Inquiries)': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'own', editAccess: 'own', add: true },
  },
  'موظف': {
    hr: { ...defaultModulePermissions, enabled: true, viewAccess: 'own', editAccess: 'own', add: true },
  }
};

const moduleDefinitions = [
  { id: 'hr', ar: 'الموارد البشرية', en: 'HR' },
  { id: 'sales', ar: 'المبيعات والعملاء', en: 'Sales & CRM' },
  { id: 'finance', ar: 'التحصيل والمالية', en: 'Finance & Collections' },
  { id: 'production', ar: 'الإنتاج والتركيب', en: 'Production Hub' },
  { id: 'procurement', ar: 'المشتريات والمستودع', en: 'Procurement & Warehouse' },
  { id: 'reports', ar: 'التقارير والإحصائيات', en: 'Reports' },
  { id: 'settings', ar: 'الإعدادات المتقدمة', en: 'Settings' },
  { id: 'notifications', ar: 'إشعارات النظام', en: 'Notifications' }
] as const;

const actionDefinitions = [
  { id: 'add', ar: 'إضافة جديد (Add)', en: 'Create / Add', textClass: 'text-slate-700' },
  { id: 'approve', ar: 'اعتماد المستندات (Approve)', en: 'Approve Workflows', textClass: 'text-slate-700' },
  { id: 'print', ar: 'الطباعة (Print)', en: 'Print Documents', textClass: 'text-slate-700' },
  { id: 'exportPdf', ar: 'تصدير PDF', en: 'Export to PDF', textClass: 'text-slate-700' },
  { id: 'exportExcel', ar: 'تصدير Excel', en: 'Export to Excel', textClass: 'text-slate-700' },
  { id: 'viewCosts', ar: 'الاطلاع على التكاليف وهوامش الربح', en: 'View Costs & Margins', textClass: 'text-rose-600' },
  { id: 'deleteSensitive', ar: 'حذف البيانات الحساسة والمعتمدة', en: 'Delete Approved/Sensitive Data', textClass: 'text-rose-600' }
] as const;

const accessLevelDefinitions = [
  { id: 'viewAccess', ar: 'صلاحية الاطلاع', en: 'View Access' },
  { id: 'editAccess', ar: 'صلاحية التعديل', en: 'Edit Access' },
  { id: 'deleteAccess', ar: 'صلاحية الحذف (بيانات عادية)', en: 'Delete Access' }
] as const;

export default function UserPermissionsModal({ user, onClose, onSave, lang }: Props) {
  const [permissions, setPermissions] = useState<UserPermissions['moduleAccess']>(buildDefaultAccess());
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editPassword, setEditPassword] = useState(user.password || '');
  const [editRole, setEditRole] = useState(user.role || '');
  const [editJobTitle, setEditJobTitle] = useState(user.jobTitle || '');

  useEffect(() => {
    // If user has old saved format or no permissions, apply role defaults or convert
    if (user.permissions?.moduleAccess) {
      setPermissions({ ...buildDefaultAccess(), ...user.permissions.moduleAccess });
    } else {
      // Missing or legacy format
      const defaults = legacyRoleMappings[user.role] || {};
      setPermissions({ ...buildDefaultAccess(), ...defaults });
    }
  }, [user]);

  const toggleModuleEnabled = (modId: keyof UserPermissions['moduleAccess']) => {
    setPermissions(prev => ({
      ...prev,
      [modId]: {
        ...prev[modId],
        enabled: !prev[modId].enabled
      }
    }));
  };

  const toggleAction = (modId: keyof UserPermissions['moduleAccess'], actionId: keyof ModulePermissions) => {
    setPermissions(prev => ({
      ...prev,
      [modId]: {
        ...prev[modId],
        [actionId]: !prev[modId][actionId]
      }
    }));
  };

  const changeAccessLevel = (modId: keyof UserPermissions['moduleAccess'], levelId: 'viewAccess' | 'editAccess' | 'deleteAccess', value: 'none' | 'own' | 'all') => {
    setPermissions(prev => ({
      ...prev,
      [modId]: {
        ...prev[modId],
        [levelId]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#0072BC]" />
              {lang === 'ar' ? 'تخصيص صلاحيات المستخدم بالتفصيل' : 'Detailed User Permissions'}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {lang === 'ar' ? `إدارة وصول: ${user.username} (${user.role})` : `Managing: ${user.username} (${user.role})`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
          
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
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'الدور والصلاحية (Role)' : 'Role'}
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-500 text-sm"
              >
                 <option value="Employee">{lang === 'ar' ? 'موظف' : 'Employee'}</option>
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
            <div className="col-span-1 sm:col-span-2 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded flex items-center gap-1 font-bold">
               <Info className="w-3 h-3" />
               {lang === 'ar' ? 'تعديل اسم المستخدم سيقوم تلقائياً بتحديث جميع أعماله وسجلاته السابقة وربطها بالاسم الجديد ولن تفقد أي بيانات.' : 'Modifying username will automatically migrate all previous history to the new name.'}
            </div>
          </div>
  
          <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-100 flex gap-2 mb-4">
             <Info className="w-5 h-5 shrink-0" />
             <p>{lang === 'ar' ? 'قم بتفعيل القسم أولاً للمستخدم، ثم قم بتحديد الصلاحيات المسموحة له داخل هذا القسم فقط. (ملاحظة: المستخدم يستطيع رؤية وتعديل البيانات التي تخصه فقط بشكل افتراضي).' : 'Enable a module first, then specify the exact actions allowed for the user within that module.'}</p>
          </div>

          <div className="space-y-3">
            {moduleDefinitions.map(mod => {
              const modPerms = permissions[mod.id as keyof typeof permissions];
              const isEnabled = modPerms.enabled;
              const isExpanded = expandedModule === mod.id;

              return (
                <div key={mod.id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${isEnabled ? 'border-blue-200 shadow-sm' : 'border-slate-200'}`}>
                  {/* Module Header */}
                  <div className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isEnabled ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`} onClick={() => setExpandedModule(isExpanded ? null : mod.id)}>
                    <div className="flex items-center gap-4">
                      {/* Toggle Switch */}
                      <div className="relative flex items-center" onClick={(e) => { e.stopPropagation(); toggleModuleEnabled(mod.id as keyof typeof permissions); }}>
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          readOnly
                          className="peer sr-only"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0072BC]"></div>
                      </div>
                      
                      <div>
                        <h3 className={`text-sm font-black ${isEnabled ? 'text-[#0072BC]' : 'text-slate-600'}`}>
                          {lang === 'ar' ? mod.ar : mod.en}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {isEnabled ? (lang === 'ar' ? 'القسم مفعل - اضغط لتفاصيل الصلاحيات' : 'Module active - Click for details') : (lang === 'ar' ? 'القسم معطل بالكامل' : 'Module fully disabled')}
                        </p>
                      </div>
                    </div>
                    
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-100 shadow-sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Actions Area */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                      {!isEnabled ? (
                        <div className="text-center py-6">
                           <p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'يرجى تفعيل القسم لضبط الصلاحيات الخاصة به' : 'Enable the module to configure its specific permissions.'}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Access Levels */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {accessLevelDefinitions.map(level => (
                              <div key={level.id} className="bg-white p-3 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                  {lang === 'ar' ? level.ar : level.en}
                                </label>
                                <select
                                  value={modPerms[level.id as keyof ModulePermissions] as string}
                                  onChange={(e) => changeAccessLevel(mod.id as keyof typeof permissions, level.id as 'viewAccess'|'editAccess'|'deleteAccess', e.target.value as 'none'|'own'|'all')}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0072BC]"
                                >
                                  <option value="none">{lang === 'ar' ? 'لا يوجد (بدون)' : 'None'}</option>
                                  <option value="own">{lang === 'ar' ? 'بياناته وحركاته فقط' : 'Own data only'}</option>
                                  <option value="all">{lang === 'ar' ? 'جميع بيانات النظام' : 'All data/System-wide'}</option>
                                </select>
                              </div>
                            ))}
                          </div>

                          <hr className="border-slate-200" />
                          
                          {/* Action Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                            {actionDefinitions.map(act => (
                              <label key={act.id} className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition ${(modPerms[act.id as keyof ModulePermissions] as boolean) ? 'bg-white shadow-sm border border-slate-100' : 'hover:bg-slate-100 border border-transparent'}`}>
                                <div className="relative flex items-center shrink-0">
                                  <input 
                                    type="checkbox" 
                                    checked={modPerms[act.id as keyof ModulePermissions] as boolean}
                                    onChange={() => toggleAction(mod.id as keyof typeof permissions, act.id as keyof ModulePermissions)}
                                    className="peer sr-only"
                                  />
                                  <div className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${act.id === 'deleteSensitive' || act.id === 'viewCosts' ? 'peer-checked:bg-rose-500' : 'peer-checked:bg-emerald-500'}`}></div>
                                </div>
                                <span className={`text-xs font-bold select-none ${act.textClass}`}>
                                  {lang === 'ar' ? act.ar : act.en}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            onClick={() => {
              onSave(user.username, { 
                moduleAccess: permissions, 
                newUsername: editUsername, 
                password: editPassword,
                role: editRole,
                jobTitle: editJobTitle
              });
              onClose();
            }}
            className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0072BC] hover:bg-blue-700 shadow-md transition"
          >
            {lang === 'ar' ? 'حفظ الصلاحيات' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}
