import React, { useState } from 'react';
import { 
  Database, GitFork, ShieldAlert, FileCode2, Route, Layers, 
  Settings, Key, History, HelpCircle, ArrowRight, CheckCircle2, ChevronRight,
  ShieldCheck, Info, Sparkles, Copy, Check, Terminal, ExternalLink,
  Package, ShoppingCart, TrendingUp, Users, AlertTriangle, Cpu, ListChecks
} from 'lucide-react';

interface SystemHubProps {
  lang: 'ar' | 'en';
}

export default function SystemArchitectureHub({ lang }: SystemHubProps) {
  const [activePane, setActivePane] = useState<'erd' | 'workflow' | 'bom' | 'rbac' | 'audit' | 'roadmap'>('erd');
  const [copiedText, setCopiedText] = useState(false);

  const sqlDDL = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES
CREATE TABLE roles (
    role_name VARCHAR(50) PRIMARY KEY,
    description TEXT
);

-- 3. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    assigned_role VARCHAR(50) REFERENCES roles(role_name) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 4. EMPLOYEES
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    arabic_name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255) NOT NULL,
    iqama_national_id VARCHAR(15) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id),
    basic_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 5. CLIENTS
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(20) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL
);

-- 6. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    proposed_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending'
);

-- 7. BILL OF MATERIALS (BOM)
CREATE TABLE bill_of_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    estimated_hours DECIMAL(6,2)
);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Glass Header */}
      <div className="glass-panel p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
              {lang === 'ar' ? 'معمارية النظم المتكاملة ERP' : 'ENTERPRISE ERP ARCHITECTURE'}
            </span>
            <h2 className="text-2xl font-black mt-2 text-slate-100 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-blue-400" />
              {lang === 'ar' ? 'سلسلة المعايير الهندسية وحوكمة البيانات' : 'Enterprise Relational Governance Matrix'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">
              {lang === 'ar' 
                ? 'لوحة فنية متكاملة تصف نموذج قواعد البيانات العلائقية، دورة حياة المشروع الفردية كمصدر وحيد للحقيقة، ومخططات الإنتاج والـ BOM مع مصفوفة الصلاحيات (RBAC).'
                : 'Interactive portal showcasing physical entity models, project single source of truth pipelines, bills of materials simulation, and RBAC governance.'}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 font-mono text-[11px] text-blue-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              PG-SQL v16.3
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setActivePane('erd')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'erd' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <Database className="w-4 h-4" />
          {lang === 'ar' ? '1. قاعدة البيانات و ERD' : '1. Relational ERD'}
        </button>
        <button
          onClick={() => setActivePane('workflow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'workflow' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <Route className="w-4 h-4" />
          {lang === 'ar' ? '2. محرك تدفق العمل' : '2. Single Truth Workflow'}
        </button>
        <button
          onClick={() => setActivePane('bom')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'bom' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <Package className="w-4 h-4" />
          {lang === 'ar' ? '3. التصنيع والـ BOM' : '3. Manufacturing & BOM'}
        </button>
        <button
          onClick={() => setActivePane('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'rbac' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <Key className="w-4 h-4" />
          {lang === 'ar' ? '4. مصفوفة الصلاحيات' : '4. RBAC Permissions'}
        </button>
        <button
          onClick={() => setActivePane('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'audit' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <History className="w-4 h-4" />
          {lang === 'ar' ? '5. سجل التدقيق المتكامل' : '5. Audit Logs Ledger'}
        </button>
        <button
          onClick={() => setActivePane('roadmap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activePane === 'roadmap' ? 'bg-[#0072BC] text-white shadow' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
          <ListChecks className="w-4 h-4" />
          {lang === 'ar' ? '6. خارطة الطريق للتبديل' : '6. Migration & Roadmap'}
        </button>
      </div>

      {/* CONTENT PANES */}
      <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-200/60 shadow-sm">
        
        {/* PANE 1: ERD & SCHEMA */}
        {activePane === 'erd' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'معمارية الجداول والروابط العلائقيّة (ERD)' : 'Relational Entity Model and DB Relationships (ERD)'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'تخطيط قاعدة البيانات الكاملة للشركة لضمان المطابقة ووحدة القيود لجميع الأنظمة.' : 'Enterprise entity relationships showing rigorous foreign key links, cascading rules, and soft delete filters.'}
              </p>
            </div>

            {/* SVG Visual ERD Diagram */}
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 border border-slate-200/70 overflow-x-auto">
              <h4 className="text-xs font-black text-slate-500 uppercase mb-4 flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-blue-500" />
                {lang === 'ar' ? 'تخطيط ممرات البيانات والربط العلائقي العالي الدقة' : 'Interactive Visual Entity Relationships Outline'}
              </h4>
              
              {/* Scalable and beautiful SVG of the database ERD with nice styling */}
              <div className="min-w-[800px] flex justify-center py-6">
                <svg width="840" height="340" viewBox="0 0 840 340" className="w-full h-auto">
                  {/* Entity Box: Clients */}
                  <rect x="20" y="40" width="160" height="100" rx="12" fill="#EBF5FF" stroke="#0072BC" strokeWidth="2" />
                  <text x="35" y="65" fill="#003E6C" fontWeight="bold" fontSize="12">clients</text>
                  <text x="35" y="85" fill="#4B5563" fontSize="10">🔑 id : UUID [PK]</text>
                  <text x="35" y="100" fill="#4B5563" fontSize="10">♦ company_name : text</text>
                  <text x="35" y="115" fill="#4B5563" fontSize="10">♦ vat_number : r-only</text>

                  {/* Connect Line: Clients to Quotations */}
                  <path d="M 180 90 L 260 90" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4" />
                  <text x="195" y="80" fill="#0072BC" fontWeight="black" fontSize="11">1 : M</text>

                  {/* Entity Box: Quotations */}
                  <rect x="260" y="40" width="160" height="115" rx="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                  <text x="275" y="65" fill="#78350F" fontWeight="bold" fontSize="12">quotations</text>
                  <text x="275" y="85" fill="#4B5563" fontSize="10">🔑 id : text [PK]</text>
                  <text x="275" y="100" fill="#4B5563" fontSize="10">🔗 client_id : ref [FK]</text>
                  <text x="275" y="115" fill="#4B5563" fontSize="10">♦ status : varchar</text>
                  <text x="275" y="130" fill="#4B5563" fontSize="10">♦ grand_total : decimal</text>

                  {/* Connect Line: Quotations to Projects */}
                  <path d="M 420 90 L 500 90" fill="none" stroke="#9CA3AF" strokeWidth="2" />
                  <text x="435" y="80" fill="#D97706" fontWeight="black" fontSize="11">1 : 1</text>

                  {/* Entity Box: Projects (Core State) */}
                  <rect x="500" y="40" width="160" height="115" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
                  <text x="515" y="65" fill="#064E3B" fontWeight="bold" fontSize="12">projects</text>
                  <text x="515" y="85" fill="#4B5563" fontSize="10">🔑 id : UUID [PK]</text>
                  <text x="515" y="100" fill="#4B5563" fontSize="10">🔗 quotation_id : ref [FK]</text>
                  <text x="515" y="115" fill="#4B5563" fontSize="10">🔗 client_id : ref [FK]</text>
                  <text x="515" y="130" fill="#4B5563" fontSize="10">♦ status : varchar</text>

                  {/* Connect Lines down to BoM and Production */}
                  <path d="M 580 155 L 580 220" fill="none" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M 580 155 L 680 220" fill="none" stroke="#9CA3AF" strokeWidth="2" />
                  <path d="M 580 155 L 480 220" fill="none" stroke="#9CA3AF" strokeWidth="2" />

                  {/* Entity Box: Production Orders */}
                  <rect x="400" y="220" width="140" height="90" rx="12" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" />
                  <text x="415" y="240" fill="#9F1239" fontWeight="bold" fontSize="11">production_orders</text>
                  <text x="415" y="260" fill="#4B5563" fontSize="10">🔑 id : UUID [PK]</text>
                  <text x="415" y="275" fill="#4B5563" fontSize="10">🔗 project_id : FK</text>
                  <text x="415" y="290" fill="#4B5563" fontSize="10">♦ status : Waiting</text>

                  {/* Entity Box: BoM (Manufacturing) */}
                  <rect x="560" y="220" width="140" height="90" rx="12" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="2" />
                  <text x="575" y="240" fill="#5B21B6" fontWeight="bold" fontSize="11">bill_of_materials</text>
                  <text x="575" y="260" fill="#4B5563" fontSize="10">🔑 id : UUID [PK]</text>
                  <text x="575" y="275" fill="#4B5563" fontSize="10">🔗 project_id : FK</text>
                  <text x="575" y="290" fill="#4B5563" fontSize="10">♦ cost_estimate : dec</text>

                  {/* Entity Box: Collections & Milestones */}
                  <rect x="710" y="40" width="120" height="100" rx="12" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
                  <text x="720" y="60" fill="#1E3A8A" fontWeight="bold" fontSize="10">collections</text>
                  <text x="720" y="80" fill="#4B5563" fontSize="9">🔑 id : UUID [PK]</text>
                  <text x="720" y="93" fill="#4B5563" fontSize="9">🔗 project_id : FK</text>
                  <text x="720" y="106" fill="#4B5563" fontSize="9">♦ milestone : text</text>
                  <text x="720" y="119" fill="#4B5563" fontSize="9">♦ Collected : bool</text>

                  {/* Connect Line: Projects to Collections */}
                  <path d="M 660 90 L 710 90" fill="none" stroke="#1D4ED8" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Structured Schema Definition */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 font-mono">
                <span>SQL Schema Source (schema.sql)</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-[#0072BC] hover:bg-[#0072BC]/90 text-white rounded-lg px-2.5 py-1 text-[11px] cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedText ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'إحراز نسخة' : 'Copy Schema')}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-300 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-72 border border-slate-800">
                <code>{sqlDDL}</code>
              </pre>
            </div>
          </div>
        )}

        {/* PANE 2: WORKFLOW ENGINE */}
        {activePane === 'workflow' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'محرك حوكمة مسارات تدفق العمل (Workflow Engine)' : 'Unified Project Lifecycle & State Transitions Engine'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'يتحكم في تدفق المشروع لضمان التكامل المتكامل وعدم تكرار البيانات بين الإدارات المختلفة.' : 'How different transactional milestones lock and sequence each other automatically.'}
              </p>
            </div>

            {/* Workflow Step Tracker Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">STAGE 1</span>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{lang === 'ar' ? '1. العرض المالي' : '1. Costing & Bidding'}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {lang === 'ar' ? 'يقوم المحاسب بدراسة التكاليق (الحديد، النيون، الديد) واعتماد الربحية من المبيعات.' : 'Directly compiles raw material specs (BOQ) with profit target controls.'}
                </p>
                <div className="mt-3 text-[10px] bg-slate-100 rounded-lg p-2 font-mono font-bold text-slate-600">
                  Status: Draft → Submitted → Approved
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">STAGE 2</span>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{lang === 'ar' ? '2. أمر التعميد والتحصيل' : '2. Contract Signoff'}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {lang === 'ar' ? 'تحصيل الدفعة الأولى (50%) يطلق إشارة التفعيل آلياً لقسم الهندسة والإنتاج.' : 'First down-payment trigger securely transfers project status to Active.'}
                </p>
                <div className="mt-3 text-[10px] bg-amber-100 rounded-lg p-2 font-mono font-bold text-amber-700">
                  Status: Pending → Down-paid
                </div>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200/60 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">STAGE 3</span>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{lang === 'ar' ? '3. خط الإنتاج والـ BoM' : '3. Factory Production'}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {lang === 'ar' ? 'بدء سحب المواد (أكريليك، لواتر)، حجز المخزون آلياً وتوزيع فنيي الورشة.' : 'BOM reservation allocates store items. Deficits dispatch Purchase Requests.'}
                </p>
                <div className="mt-3 text-[10px] bg-rose-100 rounded-lg p-2 font-mono font-bold text-rose-700">
                  Status: Waiting → Scheduled → In Process
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200/60 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-md">STAGE 4</span>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{lang === 'ar' ? '4. المطابقة وبلاغات الجودة' : '4. QC Sign-Off'}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {lang === 'ar' ? 'فحص المقاسات، دقة ألوان الفينيل وسلامة التوصيلات الكهربائية لليد.' : 'Verifies AutoCAD standards, vinyl print clarity, insulation load.'}
                </p>
                <div className="mt-3 text-[10px] bg-purple-100 rounded-lg p-2 font-mono font-bold text-purple-700">
                  Status: QC Check → Ready
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">STAGE 5</span>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{lang === 'ar' ? '5. التركيب والإغلاق المالي' : '5. Site Installation'}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {lang === 'ar' ? 'التركيب الميداني بالملقا أو التخصصي، وتحصيل الدفعة الختامية تمهيداً للأرشفة.' : 'Final site validation, crane/hoist coordination, and outstanding collections clearance.'}
                </p>
                <div className="mt-3 text-[10px] bg-emerald-100 rounded-lg p-2 font-mono font-bold text-emerald-700">
                  Status: Installed → Completed → Closed
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-2 border border-slate-800 font-mono">
              <p className="text-blue-400 font-bold">// Workflow Transition State Log Rules:</p>
              <p>&gt; WHEN Project.firstPaymentReceived() == true THEN Project.setStatus(&apos;Planning&apos;) AND createProductionOrder()</p>
              <p>&gt; WHEN Material.deficitDetected() == true THEN createPurchaseRequest() AND sendNotificationTo(&apos;Procurement Manager&apos;)</p>
              <p>&gt; WHEN ProductionOrder.stageSignedOff(&apos;Wiring&apos;) == true THEN dispatchQCInspectorChecklist()</p>
            </div>
          </div>
        )}

        {/* PANE 3: MANUFACTURING & BOM */}
        {activePane === 'bom' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'نظام جداول تفصيل المواد الملتزمة (BoM) والتصنيع' : 'Manufacturing Bill of Materials (BOM) & Inventory Automation'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'دورة حياة المكونات وحجز النيون والأكريليك والمحولات الكهربائية وتحديث المستودع آلياً.' : 'Real-time reservation of acrylic plates, LEDs, transformers, and vinyl layers.'}
              </p>
            </div>

            {/* Bill of Materials Example simulation map */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                {lang === 'ar' ? 'مثال معتمد: لوحة نيون أكريليك مجسمة (Channel Letter Sign)' : 'Assembly Spec: Double-Lit Architectural Signage'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">FACAD MATERIAL</span>
                    <p className="font-extrabold mt-2 text-slate-800">{lang === 'ar' ? 'ألواح أكريليك طراز كوري' : 'Acrylic Plexiglass (Korean)'}</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">{lang === 'ar' ? 'الكمية المطلوبة: 12 لوح' : 'Quantity Required: 12 sheets'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 font-bold">100% Available</span>
                    <span className="text-slate-400">Reserved: 12</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">LIGHTING ENGINE</span>
                    <p className="font-extrabold mt-2 text-slate-800">{lang === 'ar' ? 'وحدات ليد كوري فائق السطوع' : 'LED Module 3-Diode (Seoul Semiconductor)'}</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">{lang === 'ar' ? 'الكمية المطلوبة: 2,500 وحدة' : 'Quantity Required: 2,500 pcs'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-rose-600 font-bold">Deficit: 800 pcs</span>
                    <span className="text-xs font-mono font-black text-rose-500 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5">Auto PR Dispatched</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">POWER COUPLING</span>
                    <p className="font-extrabold mt-2 text-slate-800">{lang === 'ar' ? 'محولات طاقة مقاومة للمياه 150W' : 'Power Transformers IP67'}</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">{lang === 'ar' ? 'الكمية المطلوبة: 18 محول' : 'Quantity Required: 18 units'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 font-bold">100% Available</span>
                    <span className="text-slate-400">Reserved: 18</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">BONDING LAYERS</span>
                    <p className="font-extrabold mt-2 text-slate-800">{lang === 'ar' ? 'رولات فينيل واجهات مقاوم للأشعة' : 'Glossy UV Protection Vinyl Wrap'}</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">{lang === 'ar' ? 'الكمية المطلوبة: 45 متر طولي' : 'Quantity Required: 45 meters'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 font-bold">100% Available</span>
                    <span className="text-slate-400">Reserved: 45</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PANE 4: RBAC PERMISSIONS */}
        {activePane === 'rbac' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'مصفوفة التحكم بالوصول المبنية على الأدوار والمستويات (RBAC)' : 'Granular Role-Based Access Control matrix'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'حوكمة النظام وحصر المشاهدة والتعديل بالصلاحيات الدقيقة مع مراجعة المسؤوليات التنفيذية.' : 'Who can write, delete or approve across corporate sales, HR, factory, collections and archives.'}
              </p>
            </div>

            {/* Bilingual Table Map */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase font-black text-[10px]">
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'الدور الوظيفي' : 'Role Scope'}</th>
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'لوحة القيادة' : 'Dashboard'}</th>
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'إدارة المبيعات' : 'Sales & Costing'}</th>
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'شؤون الموظفين' : 'HRM Directory'}</th>
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'تشغيل الورشة' : 'Factory Floor'}</th>
                    <th className="p-3 border-b border-slate-200">{lang === 'ar' ? 'أمر الإلغاء والحذف' : 'Deletion / Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr>
                    <td className="p-3 border-b font-extrabold text-[#0072BC]">Super Admin (Feras)</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'وصول شامل' : 'All Access'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'إدخال ومراجعة' : 'Read/Write'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'تعديل وأجور' : 'Read/Write'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'حوكمة' : 'Read/Write'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'متاح بالكامل' : 'Allowed'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-extrabold text-slate-800">HR Manager</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'رؤية' : 'Read'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'وصول شامل' : 'Read/Write'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-rose-500">✕ {lang === 'ar' ? 'غير مسموح' : 'Restricted'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-extrabold text-slate-800">Sales Representative</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'رؤية' : 'Read'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'إدخال عروض' : 'Read/Write (No Costing)'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-rose-500">✕ {lang === 'ar' ? 'غير مسموح' : 'Restricted'}</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-extrabold text-slate-800">Production Operator / Tech</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'رؤية' : 'Read'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-slate-400">✕ {lang === 'ar' ? 'محجوب' : 'Hidden'}</td>
                    <td className="p-3 border-b text-emerald-600">✓ {lang === 'ar' ? 'تدوين فقط' : 'Write Logs'}</td>
                    <td className="p-3 border-b text-rose-500">✕ {lang === 'ar' ? 'غير مسموح' : 'Restricted'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANE 5: INTEGRATED AUDIT LOG */}
        {activePane === 'audit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'سجل التدقيق والرقابة الفيدرالي المستمر (System Audit Logs)' : 'Immutable Audit Trails Ledger'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'رصد ومحاذاة كافة الحركات والتغيرات المالية والإدارية بدقة متناهية تفادياً للخلاف القانوني.' : 'Logs tracking every create, update, delete, status change and approval.'}
              </p>
            </div>

            {/* Simulated Live Audit Ledger Stream */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-xs font-mono text-slate-300 font-extrabold uppercase">Audit Trail Active Influx Stream</p>
                </div>
                <span className="text-[10.5px] font-mono text-blue-400">Riyadh Region Server Sync</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 bg-slate-50/50 text-xs">
                
                <div className="py-3 flex flex-col md:flex-row justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black px-1.5 py-0.5 rounded">STATUS_CHANGE</span>
                      <p className="font-extrabold text-slate-800">{lang === 'ar' ? 'تعديل حالة طلب الإنتاج QT-2026-001' : 'Altered production status for QT-2026-001'}</p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 pr-1 font-mono">
                      {lang === 'ar' ? 'القيمة القديمة: "معلق" -> القيمة الجديدة: "قيد التشغيل والإنتاج"' : 'Old value: "Pending" -> New value: "In Production"'}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <p className="font-bold text-slate-600">User: FERAS</p>
                    <p>2026-06-10 08:28</p>
                  </div>
                </div>

                <div className="py-3 flex flex-col md:flex-row justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[9px] font-black px-1.5 py-0.5 rounded">SALARY_CONVERT</span>
                      <p className="font-extrabold text-slate-800">{lang === 'ar' ? 'تعديل الراتب الأساسي للموظف فيصل الحربي' : 'Adjusted basicSalary wage for Faisal Al-Harbi'}</p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 pr-1 font-mono">
                      {lang === 'ar' ? 'الراتب القديم: "7,000 SAR" -> الراتب الجديد: "7,500 SAR"' : 'Old value: "7000 SAR" -> New value: "7500 SAR"'}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <p className="font-bold text-slate-600">User: AL_HR</p>
                    <p>2026-06-09 14:15</p>
                  </div>
                </div>

                <div className="py-3 flex flex-col md:flex-row justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded">CONTRACT_ARCHIVE</span>
                      <p className="font-extrabold text-slate-800">{lang === 'ar' ? 'مزامنة ملفات التصميم مع قسم المبيعات' : 'Synchronized AutoCAD blueprints and design vectors'}</p>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 pr-1 font-mono">
                      {lang === 'ar' ? 'العملية: "تحديث ملف الأوتوكاد ومطابقة الأسعار الكلية"' : 'Action: "Approved elevations layout Muhaidib"' }
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <p className="font-bold text-slate-600">User: AL_SALES</p>
                    <p>2026-06-08 11:42</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PANE 6: ROADMAP & MIGRATION */}
        {activePane === 'roadmap' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'ar' ? 'خطة تفعيل وترحيل نظام الـ ERP الجديد' : 'Step-by-Step Implementation Roadmap & Migration Blueprint'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'الجدول الزمني المعتمد لضمان التحول الكلي الموثق دون تعطل خطوط العمل والإنتاج الحالية.' : 'Detailed sprints and checklists for a risk-free software transition.'}
              </p>
            </div>

            {/* Gantt / Sprint Blocks */}
            <div className="space-y-4 text-xs">
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-[#0072BC] text-white rounded font-bold uppercase text-[9px]">Sprint 1: Schema Setup</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{lang === 'ar' ? 'تحضير مصفوفة قواعد البيانات العلائقية' : 'Relational PostgreSQL Database Migration'}</h4>
                  <p className="text-slate-500 max-w-xl">{lang === 'ar' ? 'بناء الجداول، ربط العلاقات بمفاتيح خارجية متينة، تفعيل الحذف السوفت وتوليد بورتات المزامنة.' : 'Write database triggers and views of relational schemas.'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'مكتمل بنجاح' : 'Ready'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-[#0072BC] text-white rounded font-bold uppercase text-[9px]">Sprint 2: Workflow Engine</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{lang === 'ar' ? 'برمجة محرك مسار المشروع الموحد' : 'Unified State transitions framework'}</h4>
                  <p className="text-slate-500 max-w-xl">{lang === 'ar' ? 'ربط المبيعات والتسعير في كتل كوتيشن، واستيراد المخططات لقسم الإنتاج وتنبيه التحصيل المالي آلياً.' : 'Implement down-payment verification hooks linking quotas and tasks.'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'مكتمل بنجاح' : 'Ready'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-[#0072BC] text-white rounded font-bold uppercase text-[9px]">Sprint 3: Factory Automation</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{lang === 'ar' ? 'سلسلة حوكمة الـ BoM والمستودع والمشتريات' : 'Material and inventory auto-deduction logs'}</h4>
                  <p className="text-slate-500 max-w-xl">{lang === 'ar' ? 'ربط رصيد الأثواب والحديد، وبدء إصدار أوامر الشراء التلقائية للمواد الناقصة بالورشة.' : 'Automatically dispatch emergency PO files for deficit workshop items.'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'مكتمل بنجاح' : 'Ready'}</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
