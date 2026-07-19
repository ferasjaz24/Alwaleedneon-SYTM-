import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Calendar, DollarSign, User as UserIcon, CheckCircle, Clock, AlertTriangle, X, ChevronDown, ChevronUp, FileSpreadsheet, Printer, Info, Download, ShieldCheck, XCircle, AlertCircle } from 'lucide-react';
import { getStatusColors } from '../lib/statusUtils';
import type { User, Employee } from '../types';
import { getAccessLevel, hasPermission, getAdvancedPermissionScope, hasAdvancedPermission } from '../lib/permissions';

interface FCProps {
  lang: string;
  user: User;
}

interface PaymentPhase {
  id: string;
  percentage: number; 
  amount: number;
  stageName: string;
  dueDate: string;
  status: string; // بانتظار الدفعة | اقترب وقت التحصيل | متأخر | تم التحصيل | تم التحصيل متأخر
  collectedDate?: string;
}

interface CollectionPlan {
  id: string;
  quotationNumber: string;
  clientName: string;
  projectName: string;
  totalAmount: number;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  paymentSystem: string;
  status: string; // جاري التحصيل | تم تحصيل جميع الدفعات
  receiptConfirmedBy?: string; // New field for management confirmation
  phases: PaymentPhase[];
}

export default function FinancialCollections({ lang, user }: FCProps) {
  const isOwnerOrAdmin = getAccessLevel(user, 'sales', 'deleteAccess') === 'all';

  // Dynamic granular permission scopes
  const viewScope = getAdvancedPermissionScope(user, 'sales', 'collection', 'view_collection');
  const addPlanScope = getAdvancedPermissionScope(user, 'sales', 'collection', 'add_plan');
  const editPlanScope = getAdvancedPermissionScope(user, 'sales', 'collection', 'edit_plan');
  const addPaymentScope = getAdvancedPermissionScope(user, 'sales', 'collection', 'add_payment');
  const approvePaymentScope = getAdvancedPermissionScope(user, 'sales', 'collection', 'approve_payment');

  const [plans, setPlans] = useState<CollectionPlan[]>([]);
  const [approvedQuotes, setApprovedQuotes] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [sortOrder, setSortOrder] = useState('الأحدث');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [paymentSystem, setPaymentSystem] = useState('');
  const [draftPhases, setDraftPhases] = useState<PaymentPhase[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
  
  // Accordion state
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const togglePlan = (id: string) => {
    setExpandedPlans(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState('');
  const [reportEmployeeNames, setReportEmployeeNames] = useState<string[]>([]);
  const [selectedReportEmployee, setSelectedReportEmployee] = useState('');
  const [reportUserSearch, setReportUserSearch] = useState('');
  const [addNewUserSearch, setAddNewUserSearch] = useState('');
  
  // Search state for quotes
  const [quoteSearch, setQuoteSearch] = useState('');
  
  // To re-render lists easily
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom delete confirmation state with countdown
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    plan: CollectionPlan;
    countdown: number;
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    if (deleteConfirmState && deleteConfirmState.countdown > 0) {
      const timer = setTimeout(() => {
        setDeleteConfirmState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            countdown: prev.countdown - 1
          };
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirmState]);

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    const savedNames = localStorage.getItem('fcReportEmployees');
    if (savedNames) {
      try {
        setReportEmployeeNames(JSON.parse(savedNames));
      } catch (e) {}
    }
  }, []);

  const [dialogConfig, setDialogConfig] = useState<{isOpen: boolean, type: 'alert'|'confirm', message: string, onConfirm?: () => void} | null>(null);

  const showAlert = (message: string) => {
    setDialogConfig({ isOpen: true, type: 'alert', message });
  };
  
  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialogConfig({ isOpen: true, type: 'confirm', message, onConfirm });
  };

  const closeDialog = () => setDialogConfig(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [resPlans, resQuotes, resEmps, resUsers] = await Promise.all([
        fetch(`/api/dynamic/financial_collections?t=${ts}`),
        fetch(`/api/sales_quotations?t=${ts}`),
        fetch(`/api/employees?t=${ts}`),
        fetch(`/api/users?t=${ts}`)
      ]);
      if (resPlans.ok && resQuotes.ok) {
        const plansData = await resPlans.json();
        const quotesData = await resQuotes.json();
        const empsData = resEmps.ok ? await resEmps.json() : [];
        const usersData = resUsers.ok ? await resUsers.json() : [];
        setEmployeesList(empsData);
        setUsersList(usersData);
        
        // Compute active statuses for plans
        let updatedPlans = plansData.map((p: CollectionPlan) => ({
          ...p,
          phases: updatePhaseStatuses(p.phases || [])
        }));

        if (viewScope === 'own') {
          updatedPlans = updatedPlans.filter((p: CollectionPlan) => 
            p.createdBy?.toLowerCase() === user?.username?.toLowerCase() ||
            p.creatorName?.toLowerCase() === user?.username?.toLowerCase()
          );
        } else if (viewScope === 'none') {
          updatedPlans = [];
        }
        
        // If any plan had all collected, set to "تم تحصيل جميع الدفعات"
        updatedPlans.forEach((p: CollectionPlan) => {
          const allCollected = p.phases.every(ph => ph.status.includes('تم التحصيل'));
          if (allCollected && p.status !== 'تم تحصيل جميع الدفعات') {
            p.status = 'تم تحصيل جميع الدفعات';
            // auto save in background
            fetch(`/api/dynamic/financial_collections/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p)
            });
          }
        });

        // Auto-expand ongoing plans
        const ongoingIds = updatedPlans.filter((p: CollectionPlan) => p.status === 'جاري التحصيل').map((p: CollectionPlan) => p.id);
        setExpandedPlans(ongoingIds);

        setPlans(updatedPlans);

        // Filter approved quotes based on quotations permission
        const quotesScope = getAdvancedPermissionScope(user, 'sales', 'quotations', 'view_quotes');
        let visibleQuotes = quotesData.filter((q: any) => q.status === 'معتمد');
        if (quotesScope === 'own') {
          visibleQuotes = visibleQuotes.filter((q: any) => q.createdBy?.toLowerCase() === user?.username?.toLowerCase());
        } else if (quotesScope === 'none') {
          visibleQuotes = [];
        }

        setApprovedQuotes(visibleQuotes);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updatePhaseStatuses = (phases: PaymentPhase[]): PaymentPhase[] => {
    // Only the FIRST unpaid phase gets checked for deadline
    let firstUnpaidFound = false;

    return phases.map(phase => {
      if (phase.status.includes('تم التحصيل')) return phase;
      
      if (!firstUnpaidFound) {
        firstUnpaidFound = true;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(phase.dueDate);
        due.setHours(0,0,0,0);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= -7) {
          return { ...phase, status: 'متأخر' };
        } else if (diffDays >= 0 && diffDays <= 3) {
          return { ...phase, status: 'اقترب وقت التحصيل' };
        } else {
          return { ...phase, status: 'بانتظار الدفعة' };
        }
      } else {
        // any subsequent unpaid phases just remain wait
        return { ...phase, status: 'بانتظار الدفعة' };
      }
    });
  };

  const calculateAmountWithoutTax = (items: any[]) => {
    if (!items || !items.length) return 0;
    return items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice * (1 - (it.discountPct || 0) / 100)), 0);
  };

  const handleSelectQuote = (qid: string) => {
    setSelectedQuoteId(qid);
    setPaymentSystem('');
    setDraftPhases([]);
  };

  const handleEditPlan = (plan: CollectionPlan) => {
    const canEdit = editPlanScope === 'all' || (editPlanScope === 'own' && plan.createdBy?.toLowerCase() === user.username?.toLowerCase());
    setIsReadOnlyModal(!canEdit);

    const q = approvedQuotes.find(qu => qu.quotationNumber === plan.quotationNumber || qu.id === plan.quotationNumber || qu.id === plan.quotationNumber.split(' - ')[0]);
    if (q) setSelectedQuoteId(q.id);
    else setSelectedQuoteId('');

    setPaymentSystem(plan.paymentSystem);
    setDraftPhases([...plan.phases]);
    setEditingPlanId(plan.id);
    setIsModalOpen(true);
  };

  const handleSelectPaymentSystem = (system: string) => {
    setPaymentSystem(system);
    const quote = approvedQuotes.find(q => q.id === selectedQuoteId);
    if (!quote) return;

    const sub = calculateAmountWithoutTax(quote.items);
    const total = sub * 1.15; // with VAT
    
    let parts: number[] = [];
    if (system === '25% 25% 25% 25%') parts = [25, 25, 25, 25];
    else if (system === '50% 50%') parts = [50, 50];
    else if (system === '100%') parts = [100];
    
    if (parts.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const newPhases: PaymentPhase[] = parts.map((pct, idx) => ({
        id: `phase-${Date.now()}-${idx}`,
        percentage: pct,
        amount: parseFloat(((total * pct) / 100).toFixed(2)),
        stageName: `الدفعة رقم ${idx + 1}`,
        dueDate: today,
        status: 'بانتظار الدفعة'
      }));
      setDraftPhases(newPhases);
    } else {
      setDraftPhases([]); // Manual
    }
  };

  const handleAddManualPhase = () => {
    setDraftPhases([...draftPhases, {
       id: `phase-${Date.now()}`,
       percentage: 0,
       amount: 0,
       stageName: '',
       dueDate: new Date().toISOString().split('T')[0],
       status: 'بانتظار الدفعة'
    }]);
  };

  const handleSavePlan = async () => {
    const quote = approvedQuotes.find(q => q.id === selectedQuoteId);
    if (!quote) return showAlert('الرجاء اختيار العرض');

    if (editingPlanId) {
      const plan = plans.find(p => p.id === editingPlanId);
      const canEdit = editPlanScope === 'all' || (editPlanScope === 'own' && plan?.createdBy?.toLowerCase() === user.username?.toLowerCase());
      if (!canEdit) {
        return showAlert('لا تملك صلاحية تعديل هذه الخطة.');
      }
    } else {
      const canAdd = addPlanScope === 'all' || (addPlanScope === 'own' && quote.createdBy?.toLowerCase() === user.username?.toLowerCase());
      if (!canAdd) {
        return showAlert('لا تملك صلاحية إنشاء خطة تحصيل لعرض السعر هذا.');
      }
    }

    if (draftPhases.length === 0) return showAlert('الرجاء تحديد الدفعات');

    // validate total pct
    const totalPct = draftPhases.reduce((s, p) => s + Number(p.percentage), 0);
    if (Math.abs(totalPct - 100) > 0.1) {
       return showAlert(`مجموع النسب يجب أن يساوي 100% (المجموع الحالي ${totalPct}%)`);
    }

    const sub = calculateAmountWithoutTax(quote.items);
    const totalAmount = sub * 1.15;

    const planData: CollectionPlan = {
      id: editingPlanId || `PLAN-${Date.now()}`,
      quotationNumber: quote.quotationNumber || quote.id,
      clientName: quote.clientName || '---',
      projectName: quote.projectName || '---',
      totalAmount,
      createdBy: editingPlanId ? plans.find(p => p.id === editingPlanId)?.createdBy || user.username : user.username,
      creatorName: editingPlanId ? plans.find(p => p.id === editingPlanId)?.creatorName || user.username : user.username,
      createdAt: editingPlanId ? plans.find(p => p.id === editingPlanId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      paymentSystem,
      status: 'جاري التحصيل',
      phases: updatePhaseStatuses(draftPhases)
    };

    try {
      const res = await fetch(editingPlanId ? `/api/dynamic/financial_collections/${editingPlanId}` : '/api/dynamic/financial_collections', {
        method: editingPlanId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingPlanId(null);
        setRefreshKey(k => k + 1);
      }
    } catch (e) {
      console.error(e);
      showAlert('حدث خطأ أثناء الحفظ');
    }
  };

  const executeDeletePlan = async (plan: CollectionPlan) => {
    try {
      const res = await fetch(`/api/dynamic/financial_collections/${plan.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshKey(k => k + 1);
        setDeleteConfirmState(null);
      } else {
        showAlert('حدث خطأ أثناء محاولة حذف الخطة.');
      }
    } catch (e) {
      console.error(e);
      showAlert('حدث خطأ أثناء محاولة حذف الخطة.');
    }
  };

  const handleDeletePlan = async (plan: CollectionPlan) => {
    const username = user?.username?.toLowerCase() || '';
    const roleName = user?.role?.toLowerCase() || '';
    const isHighLevelAdmin = username === 'feras' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management' || roleName.includes('owner');

    const deleteScope = getAccessLevel(user, 'sales', 'deleteAccess');
    const canDelete = isOwnerOrAdmin || deleteScope === 'all' || (deleteScope === 'own' && plan.createdBy?.toLowerCase() === user.username?.toLowerCase()) || isHighLevelAdmin;
    if (!canDelete) {
      showAlert('لا تملك صلاحية الحذف على هذه الخطة.');
      return;
    }

    if (plan.receiptConfirmedBy && !isHighLevelAdmin) {
      showAlert('لا يمكن حذف خطة تحصيل معتمدة ومؤكدة استلامها.');
      return;
    }
    
    // Open the premium countdown confirmation modal
    setDeleteConfirmState({
      plan,
      countdown: 2,
      isOpen: true
    });
  };

  const handleMarkCollected = async (plan: CollectionPlan, phaseId: string) => {
    const canMark = addPaymentScope === 'all' || (addPaymentScope === 'own' && plan.createdBy?.toLowerCase() === user.username?.toLowerCase());
    if (!canMark) {
       showAlert('غير مصرح لك بتسجيل دفعات على هذه الخطة');
       return;
    }

    showConfirm('هل أنت متأكد من انه تم تحصيل الدفعة بشكل كامل؟ لا يمكنك التراجع عن هذا الإجراء إلا بصلاحية الإدارة.', async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      
      const updatedPhases = plan.phases.map(ph => {
        if (ph.id === phaseId && !ph.status.includes('تم التحصيل')) {
           const newStatus = ph.status === 'متأخر' ? 'تم التحصيل متأخر' : 'تم التحصيل';
           return { ...ph, status: newStatus, collectedDate: todayDate };
        }
        return ph;
      });

      const allCollected = updatedPhases.every(ph => ph.status.includes('تم التحصيل'));
      
      const updatedPlan: CollectionPlan = {
        ...plan,
        status: allCollected ? 'تم تحصيل جميع الدفعات' : plan.status,
        phases: updatePhaseStatuses(updatedPhases)
      };

      try {
        const res = await fetch(`/api/dynamic/financial_collections/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPlan)
        });
        if (res.ok) {
          setRefreshKey(k => k + 1);
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleCancelCollection = async (plan: CollectionPlan, phaseId: string) => {
    const canCancel = isOwnerOrAdmin || hasAdvancedPermission(user, 'sales', 'collection', 'unapprove_payment');
    if (!canCancel) {
       showAlert('غير مصرح لك. هذه الصلاحية فقط للمشرفين المخولين أو الإدارة العليا.');
       return;
    }

    showConfirm('تأكيد: هل أنت متأكد من إلغاء تحصيل هذه الدفعة وإعادتها لحالتها السابقة؟', async () => {
      const updatedPhases = plan.phases.map(ph => {
        if (ph.id === phaseId && ph.status.includes('تم التحصيل')) {
           // Revert to wait so updatePhaseStatuses can recalculate correctly
           return { ...ph, status: 'بانتظار الدفعة', collectedDate: undefined };
        }
        return ph;
      });

      // Strip "receiptConfirmedBy" if we are un-completing the whole plan
      const allCollectedNow = updatedPhases.every(ph => ph.status.includes('تم التحصيل'));
      
      // Create baseline
      const baselinePlan: CollectionPlan = {
        ...plan,
        status: allCollectedNow ? 'تم تحصيل جميع الدفعات' : 'جاري التحصيل',
        receiptConfirmedBy: allCollectedNow ? plan.receiptConfirmedBy : undefined,
        phases: updatedPhases
      };

      // Apply exact status logic based on dates using updatePhaseStatuses
      baselinePlan.phases = updatePhaseStatuses(baselinePlan.phases);

      try {
        const res = await fetch(`/api/dynamic/financial_collections/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baselinePlan)
        });
        if (res.ok) {
          setRefreshKey(k => k + 1);
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleConfirmReceipt = async (plan: CollectionPlan) => {
    const canApprove = approvePaymentScope === 'all' || (approvePaymentScope === 'own' && plan.createdBy?.toLowerCase() === user.username?.toLowerCase());
    if (!canApprove) {
       showAlert('غير مصرح لك. هذه الصلاحية فقط للمشرفين المخولين أو الإدارة العليا.');
       return;
    }

    showConfirm('تأكيد استلام الدفعات وإغلاق الخطة للعميل؟', async () => {
      const updatedPlan = { ...plan, receiptConfirmedBy: user.username };

      try {
        const res = await fetch(`/api/dynamic/financial_collections/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPlan)
        });
        if (res.ok) {
          setRefreshKey(k => k + 1);
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const printMonthlyReport = () => {
    if (!reportMonth || !selectedReportEmployee) {
      showAlert('الرجاء تحديد الشهر والموظف');
      return;
    }

    const filtered = plans.filter(p => {
      const pMonth = new Date(p.createdAt).getMonth() + 1;
      return p.creatorName === selectedReportEmployee && String(pMonth) === reportMonth;
    });

    const totalCollected = filtered.reduce((sum, p) => sum + p.phases.filter(ph => ph.status.includes('تم التحصيل')).reduce((s, ph) => s + ph.amount, 0), 0);
    const totalDelayed = filtered.reduce((sum, p) => sum + p.phases.filter(ph => ph.status === 'متأخر').reduce((s, ph) => s + ph.amount, 0), 0);
    const countDelayed = filtered.reduce((sum, p) => sum + p.phases.filter(ph => ph.status === 'متأخر').length, 0);

    const totalPhases = filtered.reduce((sum, p) => sum + p.phases.length, 0);
    const collectedOnTime = filtered.reduce((sum, p) => sum + p.phases.filter(ph => ph.status === 'تم التحصيل').length, 0);
    const collectionPower = totalPhases > 0 ? ((collectedOnTime / totalPhases) * 100).toFixed(1) : 0;

    const win = window.open('', '_blank');
    if (!win) return;

    let html = `
      <html dir="rtl">
        <head>
          <style>
            @import url('https://fonts.cdnfonts.com/css/ge-ss-two');
            @import url('https://fonts.cdnfonts.com/css/gotham-pro');
            * { font-family: 'GE SS Two', 'Gotham Pro', sans-serif !important; }
          </style>
          <title>تقرير التحصيل الشهري - ${selectedReportEmployee}</title>
          <style>
            body { font-family: 'GE SS Two', 'Gotham Pro', 'GE SS Two', 'Gotham Pro', sans-serif; padding: 40px; margin: 0; background: #fff; color: #1e293b; }
            .header-sec { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header-sec h1 { color: #0072BC; font-size: 24px; margin-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .stat-card h3 { color: #64748b; font-size: 14px; margin-bottom: 10px; }
            .stat-card p { color: #0072BC; font-size: 20px; font-weight: bold; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; font-size: 13px; }
            th { background: #f1f5f9; color: #334155; font-weight: bold; }
            tr:nth-child(even) { background: #f8fafc; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
            .status-collected { background: #dcfce7; color: #15803d; }
            .status-delayed { background: #ffe4e6; color: #e11d48; }
            .status-wait { background: #e0f2fe; color: #0369a1; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center;"><img src="https://i.postimg.cc/0jQj3XVc/Alwaleed-Logo-Vertical-Blue.png" referrerpolicy="no-referrer" alt="Fonoun Alwaleed Logo" style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 10px;" /></div>
          <div class="header-sec">
            <h1>تقرير التحصيل الشهري</h1>
            <p><strong>الموظف/المندوب:</strong> ${selectedReportEmployee} &nbsp;|&nbsp; <strong>الشهر:</strong> ${reportMonth}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>إجمالي المحصل</h3>
              <p>${totalCollected.toLocaleString('en-US', {minimumFractionDigits: 2})} ر.س</p>
            </div>
            <div class="stat-card">
              <h3>إجمالي المبالغ المتأخرة</h3>
              <p>${totalDelayed.toLocaleString('en-US', {minimumFractionDigits: 2})} ر.س</p>
            </div>
            <div class="stat-card">
              <h3>عدد الدفعات المتأخرة</h3>
              <p>${countDelayed}</p>
            </div>
            <div class="stat-card">
              <h3>نسبة القوة التحصيلية</h3>
              <p>${collectionPower}%</p>
            </div>
          </div>

          <h2 style="font-size: 18px; color: #334155; margin-bottom: 15px;">تفاصيل خطط التحصيل المضافة</h2>
          <table>
            <thead>
              <tr>
                <th>العميل / المشروع</th>
                <th>رقم العرض</th>
                <th>الدفعة / النسبة</th>
                <th>تاريخ الاستحقاق</th>
                <th>حالة الدفعة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(p => {
      p.phases.forEach((ph, i) => {
        let badgeClass = 'status-wait';
        if (ph.status.includes('تم التحصيل')) badgeClass = 'status-collected';
        if (ph.status.includes('متأخر')) badgeClass = 'status-delayed';

        html += `
          <tr>
            ${i === 0 ? `<td rowspan="${p.phases.length}"><strong>${p.clientName}</strong><br><span style="color:#64748b; font-size:11px;">${p.projectName}</span></td>` : ''}
            ${i === 0 ? `<td rowspan="${p.phases.length}">${p.quotationNumber}</td>` : ''}
            <td>${ph.stageName} (${ph.percentage}%)</td>
            <td>${ph.dueDate}</td>
            <td><span class="status-badge ${badgeClass}">${ph.status}</span></td>
            <td>${ph.amount.toLocaleString('en-US')} ر.س</td>
          </tr>
        `;
      });
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const filteredPlans = plans.filter(p => {
    if (filterMonth && p.createdAt && !p.createdAt.startsWith(filterMonth)) {
      return false;
    }
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!p.clientName?.toLowerCase().includes(term) && 
          !p.quotationNumber?.toLowerCase().includes(term) && 
          !p.creatorName?.toLowerCase().includes(term) &&
          !p.createdBy?.toLowerCase().includes(term)) {
         return false;
      }
    }
    if (statusFilter !== 'الكل') {
       if (statusFilter === 'تم تحصيل جميع الدفعات' && p.status !== 'تم تحصيل جميع الدفعات') return false;
       if (statusFilter !== 'تم تحصيل جميع الدفعات' && p.status === 'تم تحصيل جميع الدفعات') return false;
       
       if (statusFilter !== 'تم تحصيل جميع الدفعات') {
         // Filter if any phase has this status
          const hasStatusPhase = p.phases.some(ph => ph.status === statusFilter || ph.status === statusFilter + " متأخر");
         if (!hasStatusPhase) return false;
       }
    }
    return true;
  }).sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    return sortOrder === 'الأحدث' ? tB - tA : tA - tB;
  });

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-[#0072BC]" />
          قسم التحصيل المالي
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-5 h-5" />
            تصدير تقرير شهري
          </button>
          <button 
            onClick={() => {
              setSelectedQuoteId('');
              setPaymentSystem('');
              setDraftPhases([]);
              setEditingPlanId(null);
              setIsReadOnlyModal(false);
              setIsModalOpen(true);
            }}
            className="bg-[#0072BC] hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            إضافة خطة تحصيل
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث بالعميل، رقم العرض، منشئ الخطة (الموظف أو اليوزر)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-xl font-bold text-sm bg-slate-50 focus:bg-white focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] transition"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full md:w-64 p-2 border rounded-xl font-bold text-sm bg-slate-50 focus:bg-white focus:border-[#0072BC]"
        >
          <option value="الكل">الكل</option>
          <option value="بانتظار الدفعة">بانتظار الدفعة</option>
          <option value="اقترب وقت التحصيل">اقترب وقت التحصيل</option>
          <option value="متأخر">متأخر</option>
          <option value="تم التحصيل">تم التحصيل</option>
          <option value="تم تحصيل جميع الدفعات">تم تحصيل جميع الدفعات</option>
        </select>
        <input 
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="w-full md:w-48 p-2 border rounded-xl font-bold text-sm bg-slate-50 focus:bg-white focus:border-[#0072BC]"
        />
        <select 
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="w-full md:w-48 p-2 border rounded-xl font-bold text-sm bg-slate-50 focus:bg-white focus:border-[#0072BC]"
        >
          <option value="الأحدث">الأحدث</option>
          <option value="الأقدم">الأقدم</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[#0072BC] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
           <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
           <p className="text-slate-500 font-bold">لا توجد خطط تحصيل تطابق معايير البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPlans.map(plan => {
            return (
            <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => togglePlan(plan.id)} className="text-[#0072BC] hover:bg-blue-100 p-1 rounded-full transition mt-1">
                      {expandedPlans.includes(plan.id) ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-black text-[#0072BC] mb-1 flex items-center gap-2 flex-wrap">
                         {plan.quotationNumber} - {plan.projectName}
                         {plan.status === 'تم تحصيل جميع الدفعات' && (
                           <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full text-xs font-bold flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> تم سداد جميع الدفعات
                             {plan.receiptConfirmedBy && ` | تم تأكيد الدفعات بواسطة: ${plan.receiptConfirmedBy}`}
                           </span>
                         )}
                      </h3>
                      <p className="text-slate-600 font-bold text-sm">العميل: {plan.clientName}</p>
                      <p className="text-slate-500 text-xs mt-1">الإجمالي المستحق: {plan.totalAmount.toLocaleString('en-US',{minimumFractionDigits:2})} ر.س</p>
                    </div>
                  </div>
                  <div className="text-left flex flex-col justify-end items-end">
                    <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold mb-2">
                      <UserIcon className="w-3 h-3" /> {plan.creatorName}
                    </span>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {plan.status === 'تم تحصيل جميع الدفعات' && !plan.receiptConfirmedBy && isOwnerOrAdmin && (
                        <button 
                          onClick={() => handleConfirmReceipt(plan)}
                          className="text-emerald-600 bg-emerald-50 hover:text-white hover:bg-emerald-600 p-2 rounded-xl transition flex items-center gap-2 text-xs font-bold border border-emerald-200"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          اعتماد استلام خطة التحصيل والمبالغ
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditPlan(plan)}
                        className="text-amber-600 bg-amber-50 border border-amber-200 hover:text-white hover:bg-amber-600 p-2 rounded-xl transition flex items-center gap-2 text-xs font-bold"
                      >
                        <Search className="w-4 h-4" />
                        تعديل / عرض
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan)}
                        className="text-rose-600 bg-rose-50 border border-rose-200 hover:text-white hover:bg-rose-600 p-2 rounded-xl transition flex items-center gap-2 text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  </div>
               </div>
               
               {expandedPlans.includes(plan.id) && (
               <div className="p-4 overflow-x-auto">
                 <table className="w-full min-w-[700px] text-sm text-right">
                   <thead>
                     <tr className="bg-slate-100 text-slate-600 rounded-lg">
                       <th className="p-3 rounded-r-lg">الدفعة / المرحلة</th>
                       <th className="p-3">النسبة</th>
                       <th className="p-3">المبلغ</th>
                       <th className="p-3">تاريخ الاستحقاق</th>
                       <th className="p-3">حالة الدفعة</th>
                       <th className="p-3 rounded-l-lg text-center">الإجراء</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {plan.phases.map(ph => (
                       <tr key={ph.id} className="hover:bg-slate-50">
                         <td className="p-3 font-bold text-slate-800">{ph.stageName}</td>
                         <td className="p-3 font-bold text-[#0072BC]">{ph.percentage}%</td>
                         <td className="p-3 font-bold text-slate-800">{ph.amount.toLocaleString('en-US')} ر.س</td>
                         <td className="p-3 text-slate-600">{ph.dueDate}</td>
                         <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${getStatusColors(ph.status)}`}>
                              {ph.status.includes('تم التحصيل') ? <CheckCircle className="w-3 h-3" /> : (ph.status === 'متأخر' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />)}
                              {ph.status === 'اقترب وقت التحصيل' ? 'اقترب الموعد' : (ph.status === 'بانتظار الدفعة' ? 'بانتظار الدفعة' : ph.status)}
                              {ph.collectedDate && ` بتاريخ: ${ph.collectedDate}`}
                            </span>
                          </td>
                         <td className="p-3 text-center">
                           {!ph.status.includes('تم التحصيل') ? (
                             <button
                               onClick={() => handleMarkCollected(plan, ph.id)}
                               className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                             >
                               تم التحصيل ✔
                             </button>
                           ) : (
                             isOwnerOrAdmin && (
                               <button
                                 onClick={() => handleCancelCollection(plan, ph.id)}
                                 className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                               >
                                 إلغاء التحصيل <XCircle className="w-3 h-3 inline" />
                               </button>
                             )
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               )}
            </div>
          )})}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-10 pb-24">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl sticky top-0 z-40">
              <h2 className="text-xl font-bold text-[#0072BC] flex items-center gap-2">
                <Plus className="w-6 h-6" /> {editingPlanId ? (isReadOnlyModal ? 'عرض خطة تحصيل' : 'تعديل خطة تحصيل') : 'إضافة خطة تحصيل'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isReadOnlyModal && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-amber-800 font-bold text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>هذه الخطة للعرض فقط. لا تملك صلاحية تعديلها.</span>
              </div>
            )}
            
            <div className="p-6 flex-1 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className={`relative group/quote z-20 ${isReadOnlyModal ? 'pointer-events-none opacity-80' : ''}`} tabIndex={isReadOnlyModal ? -1 : 0}>
                   <label className="block text-sm font-bold text-slate-700 mb-2">عرض السعر المعمد (المعتمد)</label>
                   
                   <div className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus-within:bg-white focus-within:border-[#0072BC] flex justify-between items-center cursor-pointer">
                     <span className="truncate">
                       {selectedQuoteId 
                         ? (() => {
                             const q = approvedQuotes.find(x => x.id === selectedQuoteId);
                             return q ? `${q.quotationNumber} - ${q.clientName}` : 'اختر عرض السعر'
                           })() 
                         : '-- اختر عرض السعر --'}
                     </span>
                     <ChevronDown className="w-4 h-4 text-slate-400" />
                   </div>

                   <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-focus-within/quote:block hover:block z-30 max-h-60 overflow-y-auto">
                     <input
                       type="text"
                       placeholder="البحث برقم العرض أو اسم العميل..."
                       value={quoteSearch}
                       onChange={e => setQuoteSearch(e.target.value)}
                       className="w-full p-2 mb-2 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:border-[#0072BC] text-sm sticky top-0"
                     />
                     
                     <div className="flex flex-col gap-1">
                       {approvedQuotes.filter(q => {
                         if (!quoteSearch) return true;
                         const term = quoteSearch.toLowerCase();
                         return q.quotationNumber?.toLowerCase().includes(term) || (q.clientName && (q.clientName || '').toLowerCase().includes(term)) || q.id?.toLowerCase().includes(term);
                       }).map(q => (
                         <div
                           key={q.id}
                           onClick={() => {
                              handleSelectQuote(q.id);
                              if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                              }
                           }}
                           className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition hover:bg-slate-50 ${selectedQuoteId === q.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                         >
                           {q.quotationNumber} - {q.clientName}
                         </div>
                       ))}
                       {approvedQuotes.filter(q => {
                         if (!quoteSearch) return true;
                         const term = quoteSearch.toLowerCase();
                         return q.quotationNumber?.toLowerCase().includes(term) || (q.clientName && (q.clientName || '').toLowerCase().includes(term)) || q.id?.toLowerCase().includes(term);
                       }).length === 0 && (
                         <div className="p-3 text-center text-sm text-slate-500 font-bold">
                           لا توجد نتائج
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">نظام الدفعات</label>
                   <select 
                     value={paymentSystem}
                     onChange={e => handleSelectPaymentSystem(e.target.value)}
                     disabled={!selectedQuoteId || isReadOnlyModal}
                     className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:bg-white focus:border-[#0072BC] disabled:opacity-50"
                   >
                     <option value="">-- اختر نظام الدفعات --</option>
                     <option value="25% 25% 25% 25%">25% 25% 25% 25%</option>
                     <option value="50% 50%">50% 50%</option>
                     <option value="100%">100%</option>
                   </select>
                 </div>
               </div>

               {selectedQuoteId && paymentSystem && draftPhases.length > 0 && (
                 <div className="border border-slate-200 rounded-2xl overflow-hidden">
                   <div className="bg-[#0072BC]/10 p-3 text-[#0072BC] font-bold text-sm flex justify-between items-center">
                     <span>جدول توزيع الدفعات</span>
                   </div>
                   <div className="p-4 overflow-x-auto">
                     <table className="w-full min-w-[600px] text-sm text-right">
                       <thead>
                         <tr className="border-b border-slate-200">
                           <th className="p-2 pb-3">المرحلة / الدفعة</th>
                           <th className="p-2 pb-3">النسبة %</th>
                           <th className="p-2 pb-3">المبلغ (ر.س)</th>
                           <th className="p-2 pb-3">تاريخ الاستحقاق</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {draftPhases.map((ph, idx) => (
                           <tr key={ph.id}>
                             <td className="p-2">
                               <input 
                                 type="text" 
                                 value={ph.stageName}
                                 onChange={e => {
                                   const newPhases = [...draftPhases];
                                   newPhases[idx].stageName = e.target.value;
                                   setDraftPhases(newPhases);
                                 }}
                                 className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white text-sm font-bold" 
                                 placeholder="مثال: الدفعة الأولى"
                               />
                             </td>
                             <td className="p-2">
                               <input 
                                 type="number" 
                                 value={ph.percentage}
                                 onChange={e => {
                                   const newPhases = [...draftPhases];
                                   const oldPct = newPhases[idx].percentage;
                                   const newPct = parseFloat(e.target.value) || 0;
                                   newPhases[idx].percentage = newPct;
                                   
                                   const diff = oldPct - newPct;
                                   if (diff !== 0 && idx < newPhases.length - 1) {
                                      const nextPct = newPhases[idx + 1].percentage + diff;
                                      newPhases[idx + 1].percentage = Math.max(0, nextPct);
                                   }

                                   const q = approvedQuotes.find(qu => qu.id === selectedQuoteId);
                                   if (q) {
                                     const sub = calculateAmountWithoutTax(q.items);
                                     const total = sub * 1.15;
                                     newPhases[idx].amount = parseFloat(((total * newPhases[idx].percentage) / 100).toFixed(2));
                                     if (diff !== 0 && idx < newPhases.length - 1) {
                                        newPhases[idx + 1].amount = parseFloat(((total * newPhases[idx + 1].percentage) / 100).toFixed(2));
                                     }
                                   }
                                   setDraftPhases(newPhases);
                                 }}
                                 className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white text-sm font-bold" 
                               />
                             </td>
                             <td className="p-2">
                               <input 
                                 type="number" 
                                 readOnly
                                 value={ph.amount}
                                 className="w-full p-2 border rounded-lg bg-slate-100 text-sm font-bold text-slate-500 cursor-not-allowed" 
                               />
                             </td>
                             <td className="p-2">
                               <input 
                                 type="date" 
                                 value={ph.dueDate}
                                 onChange={e => {
                                   const newPhases = [...draftPhases];
                                   newPhases[idx].dueDate = e.target.value;
                                   setDraftPhases(newPhases);
                                 }}
                                 className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white text-sm font-bold" 
                               />
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                {isReadOnlyModal ? 'إغلاق' : 'إلغاء'}
              </button>
              <button 
                onClick={handleSavePlan}
                className={`px-6 py-2.5 rounded-xl font-bold text-white bg-[#0072BC] hover:bg-sky-700 transition flex items-center gap-2 ${isReadOnlyModal ? 'hidden' : ''}`}
              >
                <CheckCircle className="w-5 h-5" /> حفظ وتأكيد الدفعات
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-20 pb-24">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col pt-6 min-h-[400px]">
            <div className="px-6 pb-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-40 rounded-t-3xl">
              <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" /> طباعة تقرير شهري للمندوب
              </h2>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الشهر الميلادي</label>
                <select 
                  className="w-full p-3 border rounded-xl font-bold"
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                >
                  <option value="">-- اختر الشهر --</option>
                  {[
                    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
                  ].map((m, i) => (
                    <option key={i+1} value={i+1}>{i+1} - {m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اختيار الموظف / المندوب</label>
                  <div className="relative group/rep z-20" tabIndex={0}>
                    <div className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus-within:bg-white focus-within:border-emerald-500 flex justify-between items-center cursor-pointer">
                      <span className="truncate">
                        {selectedReportEmployee || '-- اختر الموظف / المندوب --'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-focus-within/rep:block hover:block z-30 max-h-[300px] overflow-y-auto">
                      <input 
                         type="text" 
                         placeholder="بحث في الموظفين المضافين..."
                         className="w-full p-2 mb-2 border rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-emerald-500 sticky top-0 z-10"
                         value={reportUserSearch}
                         onChange={e => setReportUserSearch(e.target.value)}
                      />
                      
                      <div className="flex flex-col gap-1">
                        {[...new Set([...plans.map(p => p.creatorName), ...reportEmployeeNames])].filter(name => {
                           if (!reportUserSearch) return true;
                           return (name || '').toLowerCase().includes(reportUserSearch.toLowerCase());
                        }).map(name => (
                           <div 
                             key={name}
                             onClick={() => {
                               setSelectedReportEmployee(name);
                               if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                             }}
                             className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition hover:bg-slate-50 ${selectedReportEmployee === name ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                           >
                             {name}
                           </div>
                        ))}
                        
                        {[...new Set([...plans.map(p => p.creatorName), ...reportEmployeeNames])].filter(name => {
                           if (!reportUserSearch) return true;
                           return (name || '').toLowerCase().includes(reportUserSearch.toLowerCase());
                        }).length === 0 && (
                           <div className="p-3 text-sm text-slate-500 text-center">لا توجد نتائج</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">إضافة اسم جديد للقائمة</label>
                  <div className="relative group/add z-10" tabIndex={0}>
                    <div className="w-full p-3 border rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 focus-within:bg-white focus-within:border-emerald-500 flex justify-center items-center cursor-pointer transition">
                      <Plus className="w-4 h-4 ml-2" />
                      <span>إضافة اسم جديد للقائمة</span>
                    </div>

                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-focus-within/add:block hover:block z-30 max-h-[300px] overflow-y-auto">
                      <input 
                         type="text" 
                         placeholder="بحث باليوزر أو اسم الموظف في النظام..."
                         className="w-full p-2 mb-2 border rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-emerald-500 sticky top-0 z-10"
                         value={addNewUserSearch}
                         onChange={e => setAddNewUserSearch(e.target.value)}
                      />
                      
                      <div className="flex flex-col gap-1">
                        {employeesList.filter(emp => {
                           const empName = emp.arabicName || emp.englishName;
                           if (!empName) return false;
                           
                           const hasUser = usersList.some(u => u.empId === emp.id);
                           if (!hasUser) return false;
                           
                           const knownNames = [...new Set([...plans.map(p => p.creatorName), ...reportEmployeeNames])];
                           if (knownNames.includes(empName)) return false;

                           if (!addNewUserSearch) return true;
                           return (empName || '').toLowerCase().includes(addNewUserSearch.toLowerCase());
                        }).map(emp => {
                           const empName = emp.arabicName || emp.englishName;
                           
                           return (
                             <div 
                               key={emp.id || empName}
                               onClick={() => {
                                 if (empName) {
                                   const newNames = [...reportEmployeeNames, empName];
                                   setReportEmployeeNames(newNames);
                                   localStorage.setItem('fcReportEmployees', JSON.stringify(newNames));
                                   setSelectedReportEmployee(empName);
                                   setAddNewUserSearch('');
                                 }
                                 if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                               }}
                               className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition hover:bg-slate-50 text-slate-700 flex justify-between items-center`}
                             >
                               <span>{empName}</span>
                               <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">إضافة</span>
                             </div>
                           )
                        })}

                        {employeesList.filter(emp => {
                           const empName = emp.arabicName || emp.englishName;
                           if (!empName) return false;
                           
                           const hasUser = usersList.some(u => u.empId === emp.id);
                           if (!hasUser) return false;

                           const knownNames = [...new Set([...plans.map(p => p.creatorName), ...reportEmployeeNames])];
                           if (knownNames.includes(empName)) return false;
                           if (!addNewUserSearch) return true;
                           return (empName || '').toLowerCase().includes(addNewUserSearch.toLowerCase());
                        }).length === 0 && (
                           <div className="p-3 text-sm text-slate-500 text-center">لا توجد نتائج</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button 
                onClick={printMonthlyReport}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <Printer className="w-5 h-5" /> طباعة وعرض التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation / Alert Modal */}
      {dialogConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                 {dialogConfig.type === 'confirm' ? (
                   <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                     <AlertCircle className="w-8 h-8" />
                   </div>
                 ) : (
                   <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                     <AlertCircle className="w-8 h-8" />
                   </div>
                 )}
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                {dialogConfig.type === 'confirm' ? 'تأكيد الإجراء' : 'تنبيه'}
              </h3>
              <p className="text-slate-600 text-center font-medium leading-relaxed">
                {dialogConfig.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              {dialogConfig.type === 'confirm' ? (
                <>
                  <button
                    onClick={closeDialog}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                      closeDialog();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-sm"
                  >
                    تأكيد
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                >
                  حسناً
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Countdown Delete Confirmation Modal */}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 justify-center flex-col text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">تأكيد الحذف النهائي للتحصيل</h3>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed text-center">
                هل أنت متأكد من حذف خطة التحصيل هذه نهائياً من السجلات؟
                {deleteConfirmState.plan.receiptConfirmedBy && (
                  <span className="block mt-2 text-rose-600 font-extrabold text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    ⚠️ تنبيه: هذه الخطة معتمدة ومؤكدة بواسطة ({deleteConfirmState.plan.receiptConfirmedBy})، ولديك الصلاحية القصوى كمسؤول لإجراء الحذف!
                  </span>
                )}
              </p>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1 text-right" dir="rtl">
                <div><strong>رقم المستند/العرض:</strong> {deleteConfirmState.plan.quotationNumber}</div>
                <div><strong>المشروع:</strong> {deleteConfirmState.plan.projectName}</div>
                <div><strong>العميل:</strong> {deleteConfirmState.plan.clientName}</div>
                <div><strong>المبلغ الإجمالي:</strong> {deleteConfirmState.plan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</div>
              </div>

              {deleteConfirmState.countdown > 0 ? (
                <div className="text-center text-xs font-bold text-amber-600 flex items-center justify-center gap-1.5 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>الرجاء الانتظار {deleteConfirmState.countdown} ثانية لتأكيد الحذف وتفادي الأخطاء...</span>
                </div>
              ) : (
                <div className="text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>تم التحقق! يمكنك الآن الضغط على زر الحذف بأمان.</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setDeleteConfirmState(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition text-sm"
              >
                إلغاء والتراجع
              </button>
              <button
                onClick={() => executeDeletePlan(deleteConfirmState.plan)}
                disabled={deleteConfirmState.countdown > 0}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed transition shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {deleteConfirmState.countdown > 0 ? `تأكيد الحذف (${deleteConfirmState.countdown})` : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
