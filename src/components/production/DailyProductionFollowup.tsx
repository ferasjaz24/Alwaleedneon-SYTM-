import React, { useState, useEffect } from "react";
import { hasAdvancedPermission } from "../../lib/permissions";
import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Box, 
  XCircle, 
  Truck, 
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  User,
  Settings
} from "lucide-react";

interface DailyProductionFollowupProps {
  lang: "ar" | "en";
  user: any;
  activeProjects: any[];
  procurementRequests: any[];
  installationOrders: any[];
  onSelectSubTab?: (id: string) => void;
  onDeleteProject?: (id: string) => Promise<void>;
}

export default function DailyProductionFollowup({
  lang,
  user,
  activeProjects,
  procurementRequests,
  installationOrders,
  onSelectSubTab,
  onDeleteProject
}: DailyProductionFollowupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIssue, setFilterIssue] = useState("all");

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(3);

  // Filter projects (Active only)
  const ongoingProjects = activeProjects.filter(p => p.status !== "مكتمل" && p.status !== "تم التسليم" && p.status !== "ملغى");

  // Calculate stats
  const delayedProjects = ongoingProjects.filter(p => p.delayed || (p.expectedDelivery && new Date(p.expectedDelivery) < new Date()));
  const stoppedProjects = ongoingProjects.filter(p => p.status === "متوقف");
  const waitingMaterials = ongoingProjects.filter(p => {
    const relatedProc = procurementRequests.find(pr => pr.projectId === p.id || pr.quotationNumber === p.quotationNumber);
    return relatedProc && relatedProc.status !== "تم استلام المواد" && relatedProc.status !== "تم الصرف للإنتاج";
  });
  const readyInstall = ongoingProjects.filter(p => p.status === "جاهز للتركيب" || p.status === "في انتظار التركيب");

  // Derived alerts
  const alerts = [];
  if (delayedProjects.length > 0) {
    alerts.push({ text: lang === "ar" ? `يوجد ${delayedProjects.length} مشاريع متأخرة عن الموعد` : `${delayedProjects.length} Delayed projects`, type: 'danger' });
  }
  if (waitingMaterials.length > 0) {
    alerts.push({ text: lang === "ar" ? `يوجد ${waitingMaterials.length} مشاريع تنتظر مواد` : `${waitingMaterials.length} projects pending materials`, type: 'warning' });
  }
  if (stoppedProjects.length > 0) {
    alerts.push({ text: lang === "ar" ? `يوجد ${stoppedProjects.length} مشاريع متوقفة` : `${stoppedProjects.length} stopped projects`, type: 'danger' });
  }

  // Filter logic
  let filteredProjects = ongoingProjects.filter(p => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.projectName && p.projectName.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.quotationNumber && p.quotationNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (filterStatus !== "all") {
    filteredProjects = filteredProjects.filter(p => {
      if (filterStatus === "delayed") return p.delayed || (p.expectedDelivery && new Date(p.expectedDelivery) < new Date());
      if (filterStatus === "stopped") return p.status === "متوقف";
      if (filterStatus === "ready") return p.status === "جاهز للتركيب" || p.status === "في انتظار التركيب";
      return p.status === filterStatus;
    });
  }

  if (filterIssue !== "all") {
    filteredProjects = filteredProjects.filter(p => {
      if (filterIssue === "materials") {
        const relatedProc = procurementRequests.find(pr => pr.projectId === p.id || pr.quotationNumber === p.quotationNumber);
        return relatedProc && relatedProc.status !== "تم استلام المواد" && relatedProc.status !== "تم الصرف للإنتاج";
      }
      return true;
    });
  }

  // Permissions
  const canEdit = hasAdvancedPermission(user, 'production', 'daily_followup', 'edit_daily_followup');
  const canDelete = hasAdvancedPermission(user, 'production', 'daily_followup', 'delete_daily_followup');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteModalOpen && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteModalOpen, deleteCountdown]);

  const handleDeleteConfirm = async () => {
    if (projectToDelete && onDeleteProject && deleteCountdown === 0) {
      await onDeleteProject(projectToDelete.id);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const openDeleteModal = (p: any) => {
    setProjectToDelete(p);
    setDeleteCountdown(3);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-indigo-600" />
          {lang === "ar" ? "متابعة الإنتاج اليومية" : "Daily Production Follow-up"}
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          {lang === "ar" 
            ? "متابعة حية للمشاريع القائمة، والمراحل، والمواد، والمشاكل اليومية للتدخل السريع."
            : "Live tracking of ongoing projects, stages, materials, and daily issues for quick intervention."}
        </p>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => { setFilterStatus("all"); setFilterIssue("all"); }}
          className={`bg-white p-4 rounded-2xl border cursor-pointer transition ${filterStatus === "all" ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-100 hover:border-slate-300"}`}
        >
          <p className="text-xs font-bold text-slate-500 mb-1">{lang === "ar" ? "المشاريع القائمة" : "Ongoing Projects"}</p>
          <h3 className="text-2xl font-black text-slate-800">{ongoingProjects.length}</h3>
        </div>
        
        <div 
          onClick={() => { setFilterStatus("delayed"); setFilterIssue("all"); }}
          className={`bg-white p-4 rounded-2xl border cursor-pointer transition ${filterStatus === "delayed" ? "border-red-500 ring-2 ring-red-100" : "border-red-100 hover:border-red-300"}`}
        >
          <p className="text-xs font-bold text-red-500 mb-1">{lang === "ar" ? "مشاريع متأخرة" : "Delayed Projects"}</p>
          <h3 className="text-2xl font-black text-red-700">{delayedProjects.length}</h3>
        </div>

        <div 
          onClick={() => { setFilterStatus("stopped"); setFilterIssue("all"); }}
          className={`bg-white p-4 rounded-2xl border cursor-pointer transition ${filterStatus === "stopped" ? "border-amber-500 ring-2 ring-amber-100" : "border-amber-100 hover:border-amber-300"}`}
        >
          <p className="text-xs font-bold text-amber-600 mb-1">{lang === "ar" ? "مشاريع متوقفة" : "Stopped Projects"}</p>
          <h3 className="text-2xl font-black text-amber-700">{stoppedProjects.length}</h3>
        </div>

        <div 
          onClick={() => { setFilterIssue("materials"); setFilterStatus("all"); }}
          className={`bg-white p-4 rounded-2xl border cursor-pointer transition ${filterIssue === "materials" ? "border-orange-500 ring-2 ring-orange-100" : "border-orange-100 hover:border-orange-300"}`}
        >
          <p className="text-xs font-bold text-orange-600 mb-1">{lang === "ar" ? "تنتظر مواد" : "Waiting Materials"}</p>
          <h3 className="text-2xl font-black text-orange-700">{waitingMaterials.length}</h3>
        </div>

        <div 
          onClick={() => { setFilterStatus("ready"); setFilterIssue("all"); }}
          className={`bg-white p-4 rounded-2xl border cursor-pointer transition ${filterStatus === "ready" ? "border-emerald-500 ring-2 ring-emerald-100" : "border-emerald-100 hover:border-emerald-300"}`}
        >
          <p className="text-xs font-bold text-emerald-600 mb-1">{lang === "ar" ? "جاهزة للتركيب" : "Ready to Install"}</p>
          <h3 className="text-2xl font-black text-emerald-700">{readyInstall.length}</h3>
        </div>
      </div>

      {/* 3. Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col gap-2">
          <h3 className="text-sm font-black text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {lang === "ar" ? "تنبيهات حرجة للتدخل اليوم" : "Critical Alerts for Today"}
          </h3>
          <div className="flex flex-col gap-1.5">
            {alerts.map((a, i) => (
              <div key={i} className="text-xs font-bold text-red-700 bg-white/50 p-2 rounded-lg border border-red-100">
                • {a.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
          <input 
            type="text"
            placeholder={lang === "ar" ? "بحث عن مشروع، عميل، رقم كوتيشن..." : "Search project, client..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 ${lang === "ar" ? "pr-9 pl-4" : "pl-9 pr-4"} text-xs font-bold focus:outline-none focus:border-indigo-500 transition`}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 outline-none w-full md:w-auto"
          >
            <option value="all">{lang === "ar" ? "جميع الحالات" : "All Statuses"}</option>
            <option value="قيد الإنتاج">{lang === "ar" ? "قيد الإنتاج" : "In Production"}</option>
            <option value="متوقف">{lang === "ar" ? "متوقف" : "Stopped"}</option>
            <option value="جاهز للتركيب">{lang === "ar" ? "جاهز للتركيب" : "Ready for Install"}</option>
            <option value="delayed">{lang === "ar" ? "متأخر فقط" : "Delayed Only"}</option>
          </select>
        </div>
      </div>

      {/* 5. Projects Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">{lang === "ar" ? "المشروع / العميل" : "Project / Client"}</th>
                <th className="p-4">{lang === "ar" ? "تاريخ التسليم" : "Delivery Date"}</th>
                <th className="p-4">{lang === "ar" ? "المرحلة الحالية" : "Current Phase"}</th>
                <th className="p-4">{lang === "ar" ? "نسبة الإنجاز" : "Progress"}</th>
                <th className="p-4">{lang === "ar" ? "حالة المواد" : "Materials Status"}</th>
                <th className="p-4">{lang === "ar" ? "حالة المشروع" : "Project Status"}</th>
                <th className="p-4">{lang === "ar" ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(p => {
                const isDelayed = p.delayed || (p.expectedDelivery && new Date(p.expectedDelivery) < new Date());
                const relatedProc = procurementRequests.find(pr => pr.projectId === p.id || pr.quotationNumber === p.quotationNumber);
                const materialsStatus = relatedProc 
                  ? relatedProc.status 
                  : (lang === "ar" ? "لا يوجد طلب" : "No request");
                  
                const isExpanded = expandedProjectId === p.id;

                  const totalStages = p.pipelineStages?.length || 1;
                  const currentStage = p.currentStageIndex || 0;
                  let calculatedProgress = p.progress || 5;

                  if (
                    p.status === "مكتمل" || 
                    p.status === "تم التسليم" || 
                    p.status === "تم التركيب" || 
                    p.status === "تم التركيب بنجاح" || 
                    p.status === "منتهي"
                  ) {
                    calculatedProgress = 100;
                  } else if (currentStage >= totalStages || (currentStage === totalStages - 1 && p.pipelineStages[currentStage]?.status === "Completed")) {
                    calculatedProgress = 100;
                  } else {
                    calculatedProgress = Math.round((currentStage / totalStages) * 100);
                    if (calculatedProgress === 0 && currentStage > 0) calculatedProgress = 10;
                    if (calculatedProgress === 0) calculatedProgress = 5;
                  }

                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}>
                      <td className="p-4">
                        <p className="font-black text-slate-800 text-sm">{p.projectName}</p>
                        <p className="font-bold text-slate-400 mt-1">{p.clientName} <span className="mx-1">|</span> {p.quotationNumber}</p>
                      </td>
                      <td className="p-4">
                        {p.expectedDelivery ? (
                          <div className={`font-bold ${isDelayed ? 'text-red-600 bg-red-50 px-2 py-1 rounded-lg inline-block' : 'text-slate-600'}`}>
                            {new Date(p.expectedDelivery).toLocaleDateString('ar-SA')}
                          </div>
                        ) : "---"}
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        {p.currentPhase || (p.pipelineStages && p.pipelineStages[p.currentStageIndex]?.stageName) || p.status}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${calculatedProgress}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-600">{calculatedProgress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg font-bold text-[10px] ${relatedProc?.status === 'تم استلام المواد' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                          {materialsStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg font-bold text-[10px] ${
                          p.status === 'متوقف' ? 'bg-red-50 text-red-700' :
                          p.status === 'جاهز للتركيب' ? 'bg-teal-50 text-teal-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                          <ArrowRight className={`w-4 h-4 text-slate-500 ${lang === "ar" ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 border-b border-slate-100 bg-slate-50/50">
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Timeline */}
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                                  <Settings className="w-4 h-4 text-slate-500" />
                                  {lang === "ar" ? "مراحل التصنيع" : "Manufacturing Stages"}
                                </h4>
                                <div className="space-y-4">
                                  {p.pipelineStages && p.pipelineStages.length > 0 ? (
                                    p.pipelineStages.map((st: any, i: number) => {
                                      const isCompleted = st.completedAt;
                                      const isActive = p.currentStageIndex === i;
                                      return (
                                        <div key={i} className="flex gap-4 items-start relative">
                                          {i !== p.pipelineStages.length - 1 && (
                                            <div className={`absolute top-6 ${lang === "ar" ? "right-3.5" : "left-3.5"} w-0.5 h-full ${isCompleted ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                                          )}
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition ${
                                            isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : 
                                            isActive ? "bg-indigo-50 border-indigo-500 text-indigo-600" : 
                                            "bg-slate-50 border-slate-300 text-slate-400"
                                          }`}>
                                            {isCompleted ? "✓" : i + 1}
                                          </div>
                                          <div className="flex-1 pb-4">
                                            <h5 className={`text-xs font-black ${isCompleted ? 'text-emerald-800' : isActive ? 'text-indigo-800' : 'text-slate-500'}`}>
                                              {st.stageName} {isActive && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[9px] mr-2">نشط</span>}
                                            </h5>
                                            {st.description && <p className="text-[10px] font-medium text-slate-500 mt-1">{st.description}</p>}
                                            {isCompleted && st.completedAt && (
                                              <p className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {lang === "ar" ? "أنجزت في:" : "Completed at:"} {new Date(st.completedAt).toLocaleString('ar-SA')}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <div className="text-center py-4 text-slate-400 font-bold text-xs">
                                      {lang === "ar" ? "لا توجد مراحل مسجلة" : "No stages recorded"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Quick Actions & Info */}
                              <div className="space-y-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                  <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4 text-slate-500" />
                                    {lang === "ar" ? "معلومات هامة" : "Important Info"}
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{lang === "ar" ? "المندوب" : "Sales Rep"}</p>
                                      <p className="text-xs font-bold text-slate-700 mt-0.5">{p.salesRep || "---"}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{lang === "ar" ? "المواد" : "Materials"}</p>
                                      <p className="text-xs font-bold text-slate-700 mt-0.5">{materialsStatus}</p>
                                    </div>
                                    {p.stoppedReason && (
                                      <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                        <p className="text-[10px] font-bold text-red-500 uppercase">{lang === "ar" ? "سبب التوقف" : "Stop Reason"}</p>
                                        <p className="text-[11px] font-bold text-red-700 mt-0.5">{p.stoppedReason}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                  <button onClick={() => onSelectSubTab && onSelectSubTab("prod_active_projects")} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition shadow-sm">
                                    {lang === "ar" ? "تحديث سير العمل" : "Update Workflow"}
                                  </button>
                                  {p.status !== "جاهز للتركيب" && canEdit && (
                                    <button className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-black text-xs transition">
                                      {lang === "ar" ? "إضافة ملاحظة سريعة" : "Add Quick Note"}
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button onClick={() => openDeleteModal(p)} className="w-full py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl font-black text-xs transition">
                                      {lang === "ar" ? "حذف المشروع من المتابعة" : "Remove Project"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    {lang === "ar" ? "لا توجد مشاريع تطابق البحث" : "No projects match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">
              {lang === "ar" ? "تأكيد حذف المشروع" : "Confirm Project Removal"}
            </h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-medium">
              {lang === "ar" 
                ? `هل أنت متأكد من رغبتك في حذف المشروع "${projectToDelete.projectName}" من المتابعة اليومية؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to remove project "${projectToDelete.projectName}" from daily follow-up? This cannot be undone.`}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProjectToDelete(null);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteCountdown > 0}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  deleteCountdown > 0 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                }`}
              >
                {deleteCountdown > 0 
                  ? (lang === "ar" ? `انتظر ${deleteCountdown} ثواني...` : `Wait ${deleteCountdown}s...`)
                  : (lang === "ar" ? "نعم، احذف المشروع" : "Yes, Remove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
