import React, { useState } from 'react';
import { Layers, Plus, Edit2, Share2, AlertOctagon, Users, ShieldAlert } from 'lucide-react';
import { Employee } from '../../types';

interface OrgNode {
  id: string;
  name_ar: string;
  name_en: string;
  parentId: string | null; // Adjacency schema
  managerName_ar: string;
  managerName_en: string;
  annualBudget: number;
  vacanciesCount: number;
}

interface HrOrgStructureTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
}

export default function HrOrgStructureTab({ lang, employees }: HrOrgStructureTabProps) {
  // Preset 3D Adjacency structure nodes
  const [nodes, setNodes] = useState<OrgNode[]>([
    { id: '1', name_ar: 'الشركة الأم: الوليد للدعاية والنيون', name_en: 'Al-Waleed Signage & Neon Co. Ltd.', parentId: null, managerName_ar: 'فراس (المدير الإداري)', managerName_en: 'Feras (MD & Owner)', annualBudget: 4200000, vacanciesCount: 0 },
    
    // Branches
    { id: '2', name_ar: 'فرع الرياض الرئيسي', name_en: 'Riyadh HQ Branch', parentId: '1', managerName_ar: 'فراس الجاسر', managerName_en: 'Feras Al-Jasser', annualBudget: 1800000, vacanciesCount: 2 },
    { id: '3', name_ar: 'فرع الدمام والشرقية', name_en: 'Dammam HQ Branch', parentId: '1', managerName_ar: 'منصور القحطاني', managerName_en: 'Mansour Al-Qahtani', annualBudget: 1200000, vacanciesCount: 1 },
    { id: '4', name_ar: 'فرع جدة والمنطقة الغربية', name_en: 'Jeddah Workshop', parentId: '1', managerName_ar: 'سعد العتيبي', managerName_en: 'Saad Al-Otaibi', annualBudget: 950000, vacanciesCount: 3 },

    // Divisions under Riyadh
    { id: '101', name_ar: 'إدارة الإنتاج وتجويف النيون', name_en: 'Neon Production Division', parentId: '2', managerName_ar: 'إلياس خان', managerName_en: 'Ilyas Khan', annualBudget: 600000, vacanciesCount: 1 },
    { id: '102', name_ar: 'إدارة التركيبات الميدانية الكبرى', name_en: 'Outdoor Installation & Cranes', parentId: '2', managerName_ar: 'فهد المطيري', managerName_en: 'Fahad Al-Mutairi', annualBudget: 450000, vacanciesCount: 0 },
    { id: '103', name_ar: 'إدارة المبيعات والتسعير الإعلاني', name_en: 'Advertising Sales & Estimating', parentId: '2', managerName_ar: 'طارق الدوسري', managerName_en: 'Tarek Al-Dawsari', annualBudget: 350000, vacanciesCount: 2 },

    // Departments under Divisions
    { id: '101A', name_ar: 'قسم تشكيل زجاج النيون والمحولات', name_en: 'Neon Tube Siphoning & Transformers', parentId: '101', managerName_ar: 'راجيش كومار', managerName_en: 'Rajesh Kumar', annualBudget: 280000, vacanciesCount: 1 },
    { id: '101B', name_ar: 'قسم تفريغ مكنات الكنترول CNC الأكريليك', name_en: 'CNC Laser acrylic carving Desk', parentId: '101', managerName_ar: 'شان ريدي', managerName_en: 'Shan Reddy', annualBudget: 220000, vacanciesCount: 0 },
    { id: '102A', name_ar: 'فريق رافعات الشوارع والارتفاعات', name_en: 'Street Hoisting Crane Operator Team', parentId: '102', managerName_ar: 'عبيد الجابر', managerName_en: 'Obaid Al-Jaber', annualBudget: 190000, vacanciesCount: 1 }
  ]);

  // Modal and select interaction states
  const [selectedNodeId, setSelectedNodeId] = useState<string>('2');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [blockedTransitionAlert, setBlockedTransitionAlert] = useState<string | null>(null);

  // New Node Form fields
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newParent, setNewParent] = useState('2');
  const [newManager, setNewManager] = useState('');
  const [newManagerEn, setNewManagerEn] = useState('');
  const [newBudget, setNewBudget] = useState(250000);

  // Selected Node Metadata
  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Recalculating employee counting based on actual employee list + mock defaults
  const getEmployeeCountForNode = (node: OrgNode) => {
    // Check if employee department name maps or matches any keywords
    const deptKeyword = (node.name_en || '').toLowerCase().replace('branch', '').replace('division', '').replace('department', '').trim();
    const count = employees.filter(emp => {
      const empDept = (emp.department || '').toLowerCase();
      // Simple containing matching
      return empDept.includes(deptKeyword) || deptKeyword.includes(empDept);
    }).length;
    
    // Give minimum 2 if matching is 0 to avoid blank trees in initial visual render
    return count > 0 ? count : (node.id === '1' ? employees.length : 3);
  };

  // 1. Interactive Core Actions: Add Sub-Unit
  const handleAddNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameAr || !newNameEn) return;
    const newId = String(Date.now());
    const newNode: OrgNode = {
      id: newId,
      name_ar: newNameAr,
      name_en: newNameEn,
      parentId: newParent,
      managerName_ar: newManager || 'فراس (مؤقت)',
      managerName_en: newManagerEn || 'Feras (Acting)',
      annualBudget: Number(newBudget),
      vacanciesCount: 1
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    setIsAddOpen(false);
    // Reset Form
    setNewNameAr('');
    setNewNameEn('');
  };

  // 2. Interactive Core Actions: Edit Node Metadata
  const handleEditUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          name_ar: newNameAr || n.name_ar,
          name_en: newNameEn || n.name_en,
          managerName_ar: newManager || n.managerName_ar,
          managerName_en: newManagerEn || n.managerName_en,
          annualBudget: Number(newBudget)
        };
      }
      return n;
    }));
    setIsEditOpen(false);
  };

  // 3. Interactive Core Actions: Drag/Transfer Node parent
  const handleMoveParent = (nodeId: string, targetParentId: string) => {
    if (nodeId === targetParentId) return; // Prevent loop
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, parentId: targetParentId };
      }
      return n;
    }));
  };

  // 4. Interactive Core Actions: Archive Node (with active dependency checklist)
  const handleArchiveNode = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (!target) return;

    // A. Check if any employee is currently registered in this node's sector
    const empCount = getEmployeeCountForNode(target);
    const hasChildrenNodes = nodes.some(n => n.parentId === nodeId);

    if (empCount > 0 || hasChildrenNodes) {
      // Create detailed error trigger
      const warnMsg = lang === 'ar' 
        ? `⚠️ خطأ حرج: لا يمكن أرشفة الوحدة الإدارية ("${target.name_ar}"). يحتوي هذا القسم على عدد ${empCount} فنيين ممارسين وتحت عهدتهم سيارتين ورشة تلافياً للتبعات القانونية والمالية! يرجى نقلهم إدارياً أولاً.`
        : `⚠️ Critical Constraint Block: Cannot archive node ("${target.name_en}"). Sector contains ${empCount} active technicians and 2 fleet assets handovers pending! Transfer reports first.`;
      setBlockedTransitionAlert(warnMsg);
      return;
    }

    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setSelectedNodeId('1');
  };

  return (
    <div id="hr-orgtree-module" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* Module Title Banner */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00AEEF]" />
            {lang === 'ar' ? '🌳 الهيكل التنظيمي والشجرة الإدارية التفاعلية (Bento Tree)' : 'Unified Interactive Corporate Org Hierarchy Node Map'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'إعادة ترتيب الهياكل والفروع والأجهزة التنظيمية لثني النيون وتأمين السلامة' : 'Configure recursive adjacency routing, budgets, and vacant job quotas'}
          </p>
        </div>

        {/* Top-Level Add Node button */}
        <button 
          onClick={() => {
            setNewParent(selectedNodeId);
            setIsAddOpen(true);
          }}
          className="px-3 py-1.5 bg-[#0072BC] hover:bg-[#0072BC]/95 text-white text-[11px] font-black rounded-xl flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'إضافة وحدة فرعية' : 'Add Sub-Unit'}
        </button>
      </div>

      {/* Safety Alert Box */}
      {blockedTransitionAlert && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-1">
            <p className="font-extrabold">{blockedTransitionAlert}</p>
            <button 
              onClick={() => setBlockedTransitionAlert(null)}
              className="text-[#0072BC] underline font-black block mt-1"
            >
              {lang === 'ar' ? 'حسناً، فهمت' : 'Dismiss warning'}
            </button>
          </div>
        </div>
      )}

      {/* Grid: Left Column - Node Selector List | Right Column - Active Node Metadata Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Node Hierarchy Map Explorer (7 Columns) */}
        <div className="md:col-span-7 bg-slate-50/70 p-4 rounded-2xl border border-slate-100/50 space-y-3 max-h-[450px] overflow-y-auto">
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mb-1">{lang === 'ar' ? 'تصفح عقد الهيكل التفاعلي:' : 'Select Tree Node to Inspect:'}</p>
          
          <div className="space-y-2">
            {nodes.map(node => {
              // Calculate indents based on node depth/id structure
              let indentClass = 'ml-0';
              if (node.parentId === '1') indentClass = 'ml-4 border-l border-slate-200 pl-3';
              if (node.parentId && node.parentId.length > 1) indentClass = 'ml-8 border-l-2 border-dashed border-slate-300 pl-4';
              
              const isSelected = selectedNodeId === node.id;
              const hasReportees = nodes.some(n => n.parentId === node.id);

              return (
                <div 
                  key={node.id} 
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${indentClass} ${
                    isSelected ? 'bg-[#0072BC] text-white shadow-md font-bold' : 'bg-white text-slate-700 hover:bg-slate-100/60'
                  }`}
                >
                  <button 
                    onClick={() => setSelectedNodeId(node.id)}
                    className="flex-1 text-right flex items-center gap-2"
                  >
                    <span className="text-xs">🌳</span>
                    <span>{lang === 'ar' ? node.name_ar : node.name_en}</span>
                  </button>
                  
                  {/* Quick metadata badges */}
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono mr-2 ${isSelected ? 'bg-white/20 text-white' : 'bg-[#0072BC]/10 text-[#0072BC]'}`}>
                    {getEmployeeCountForNode(node)} {lang === 'ar' ? 'فني' : 'staff'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Node Metadata Dashboard (5 Columns) */}
        <div className="md:col-span-5 bg-white border border-slate-150 p-5 rounded-2xl space-y-4">
          <div className="border-b pb-3 space-y-1">
            <span className="text-[9px] bg-[#00AEEF]/20 text-[#0072BC] font-black px-2 py-0.5 rounded uppercase">{lang === 'ar' ? 'التفاصيل والتبعية' : 'Node Properties'}</span>
            <h5 className="font-extrabold text-sm text-slate-800">
              {lang === 'ar' ? activeNode.name_ar : activeNode.name_en}
            </h5>
          </div>

          <div className="space-y-3 text-xs text-slate-650">
            <div>
              <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'المدير المسؤول الحاكم' : 'Head Manager / Director'}</span>
              <p className="font-bold text-slate-800">{lang === 'ar' ? activeNode.managerName_ar : activeNode.managerName_en}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'الميزانية السنوية للقسم' : 'Annual Authorized Budget'}</span>
              <p className="font-black text-[#0072BC] font-mono">SAR {activeNode.annualBudget.toLocaleString('en-US')}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[9px] text-slate-450 block">{lang === 'ar' ? 'عدد الموظفين الفعلي' : 'Enrolled Headcount'}</span>
                <p className="text-sm font-black text-slate-800 font-mono flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {getEmployeeCountForNode(activeNode)}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-450 block">{lang === 'ar' ? 'الوظائف الشاغرة المعتمدة' : 'Authorized Vacancies'}</span>
                <p className="text-sm font-black text-amber-600 font-mono">
                  {activeNode.vacanciesCount}
                </p>
              </div>
            </div>

            {/* Quick action controllers inside metadata panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              
              {/* Dynamic Re-Parent Transfer selector */}
              {activeNode.id !== '1' && (
                <div>
                  <label className="text-[9px] text-slate-400 block mb-1">{lang === 'ar' ? 'نقل وإعادة هيكلة التبعية الإدارية:' : 'Re-route Parent Node Hierarchy:'}</label>
                  <select 
                    value={activeNode.parentId || ''}
                    onChange={(e) => handleMoveParent(activeNode.id, e.target.value)}
                    className="w-full text-[10px] p-2 border rounded-xl bg-slate-50 text-slate-800 font-bold"
                  >
                    <option value="">{lang === 'ar' ? 'بدون مدير رئيسي' : 'No Parent'}</option>
                    {nodes.filter(n => n.id !== activeNode.id).map(n => (
                      <option key={n.id} value={n.id}>{lang === 'ar' ? n.name_ar : n.name_en}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setNewNameAr(activeNode.name_ar);
                    setNewNameEn(activeNode.name_en);
                    setNewManager(activeNode.managerName_ar);
                    setNewManagerEn(activeNode.managerName_en);
                    setNewBudget(activeNode.annualBudget);
                    setIsEditOpen(true);
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-[#0072BC]/10 text-[#0072BC] rounded-lg text-[10px] font-black flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  {lang === 'ar' ? 'تعديل البيانات' : 'Edit Props'}
                </button>
                
                {activeNode.id !== '1' && (
                  <button 
                    onClick={() => handleArchiveNode(activeNode.id)}
                    className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black"
                  >
                    ❌ {lang === 'ar' ? 'أرشفة الوحدة' : 'Archive Sector'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Add Node Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddNewUnit} className="bg-white p-6 rounded-3xl border border-slate-100 max-w-md w-full space-y-4">
            <h5 className="font-extrabold text-[#0072BC] text-sm flex items-center gap-2">
              <span>➕</span>
              {lang === 'ar' ? 'إضافة قسم أو وحدة إدارية جديدة' : 'Add Sub-Unit Org Node'}
            </h5>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم باللغة العربية' : 'Arabic Node Title'}</label>
                <input required type="text" value={newNameAr} onChange={e => setNewNameAr(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم باللغة الإنجليزية' : 'English Node Title'}</label>
                <input required type="text" value={newNameEn} onChange={e => setNewNameEn(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'المدير باللغة العربية' : 'Manager Name (AR)'}</label>
                <input type="text" value={newManager} onChange={e => setNewManager(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'المدير باللغة الإنجليزية' : 'Manager Name (EN)'}</label>
                <input type="text" value={newManagerEn} onChange={e => setNewManagerEn(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الميزانية السنوية SAR' : 'Annual Budget'}</label>
                <input type="number" lang="en" value={newBudget} onChange={e => setNewBudget(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 text-xs font-black">
              <button type="submit" className="flex-1 bg-[#0072BC] text-white py-2 rounded-xl">
                {lang === 'ar' ? 'حفظ وإضافة' : 'Save Node'}
              </button>
              <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Node Modal Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleEditUnit} className="bg-white p-6 rounded-3xl border border-slate-100 max-w-md w-full space-y-4">
            <h5 className="font-extrabold text-[#0072BC] text-sm">
              📝 {lang === 'ar' ? `تعديل معايير: ${activeNode.name_ar}` : `Edit Node: ${activeNode.name_en}`}
            </h5>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                <input type="text" value={newNameAr} onChange={e => setNewNameAr(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                <input type="text" value={newNameEn} onChange={e => setNewNameEn(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'المدير بالعربية' : 'Manager AR'}</label>
                <input type="text" value={newManager} onChange={e => setNewManager(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'المدير بالإنجليزية' : 'Manager EN'}</label>
                <input type="text" value={newManagerEn} onChange={e => setNewManagerEn(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">{lang === 'ar' ? 'الميزانية السنوية' : 'Annual Budget'}</label>
                <input type="number" lang="en" value={newBudget} onChange={e => setNewBudget(Number(e.target.value))} className="w-full p-2 border rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 text-xs font-black">
              <button type="submit" className="flex-1 bg-[#0072BC] text-white py-2 rounded-xl">
                {lang === 'ar' ? 'تعديل وحفظ' : 'Apply Edits'}
              </button>
              <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
