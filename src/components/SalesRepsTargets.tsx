import React, { useState, useEffect } from 'react';
import { User, Quotation, Employee } from '../types';
import { Trash2, Search, PlusCircle, Printer, Target, TrendingUp, DollarSign, Activity, Users, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid, Legend } from 'recharts';
import { sharedPrintHeader, sharedPrintFooter } from '../utils/PrintShared';

interface Props {
  lang: 'ar' | 'en';
  user: User;
}

export default function SalesRepsTargets({ lang, user }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [salesRepsList, setSalesRepsList] = useState<string[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState<string>('');
  
  // Date state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
  
  const [isAddRepModalOpen, setIsAddRepModalOpen] = useState(false);
  const [repSearch, setRepSearch] = useState('');
  
  const [manualTargetInput, setManualTargetInput] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const ts = Date.now();
    try {
      const [empRes, usersRes, repsRes, targetsRes, quoRes, collRes, clientsRes] = await Promise.all([
        fetch(`/api/employees?t=${ts}`),
        fetch(`/api/users?t=${ts}`),
        fetch(`/api/dynamic/sales_reps_list?t=${ts}`),
        fetch(`/api/dynamic/sales_targets?t=${ts}`),
        fetch(`/api/sales_quotations?t=${ts}`),
        fetch(`/api/dynamic/financial_collections?t=${ts}`),
        fetch(`/api/clients?t=${ts}`)
      ]);
      
      const empData = await empRes.json();
      setEmployees(empData || []);
      
      const usersData = await usersRes.json();
      setSystemUsers(usersData || []);
      
      const repsData = await repsRes.json();
      setSalesRepsList(repsData.map((r: any) => r.id));
      
      setMonthlyTargets(await targetsRes.json());
      setQuotations(await quoRes.json());
      setCollections(await collRes.json());
      setClients(await clientsRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getRepDisplayName = (username: string) => {
    const sysUser = systemUsers.find(u => u.username === username);
    if (sysUser && sysUser.empId) {
       const emp = employees.find(e => e.id === sysUser.empId);
       if (emp) return `${emp.arabicName} (${username})`;
    }
    return username;
  };

  const currentTargetRecord = monthlyTargets.find(t => t.empId === selectedRep && t.month === selectedMonth);
  const targetAmount = currentTargetRecord ? currentTargetRecord.targetAmount : 0;

  useEffect(() => {
    setManualTargetInput(targetAmount ? targetAmount.toString() : '');
  }, [targetAmount, selectedRep, selectedMonth]);

  const addSalesRep = async (username: string) => {
    if (salesRepsList.includes(username)) return;
    try {
      const newRep = { id: username };
      await fetch('/api/dynamic/sales_reps_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRep)
      });
      setSalesRepsList([...salesRepsList, username]);
      setIsAddRepModalOpen(false);
    } catch(e) {
      console.error(e);
    }
  };

  const removeSalesRep = async (username: string) => {
    try {
      await fetch(`/api/dynamic/sales_reps_list/${username}`, { method: 'DELETE' });
      setSalesRepsList(salesRepsList.filter(id => id !== username));
      if (selectedRep === username) setSelectedRep('');
    } catch (e) {
      console.error(e);
    }
  };

  const updateTarget = async () => {
    if (!selectedRep || !selectedMonth) return;
    const val = parseFloat(manualTargetInput) || 0;
    const recId = `${selectedRep}_${selectedMonth}`;
    const payload = { id: recId, empId: selectedRep, month: selectedMonth, targetAmount: val };
    
    try {
      if (currentTargetRecord) {
        await fetch(`/api/dynamic/sales_targets/${recId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/dynamic/sales_targets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setMonthlyTargets(prev => {
        const others = prev.filter(p => p.id !== recId);
        return [...others, payload];
      });
      alert('تم تحديث الهدف بنجاح');
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics calculation
  const repName = getRepDisplayName(selectedRep);
  const sysUserRecord = systemUsers.find(u => u.username === selectedRep);
  const realArabicName = (sysUserRecord?.empId && employees.find(e => e.id === sysUserRecord.empId)?.arabicName) || selectedRep;
  
  // A helper to match the user name. We check both the username and the arabic name if it exists.
  const isQuoteOrClientByRep = (createdBy: string | undefined, repUsername: string, repArabicName: string) => {
    if (!createdBy) return false;
    return createdBy === repUsername || createdBy === repArabicName || createdBy === repName;
  };

  // Clients added this month
  const currentMonthClients = clients.filter(c => {
    if (!isQuoteOrClientByRep(c.createdBy || c.salesRepName, selectedRep, realArabicName)) return false;
    const d = c.dateCreated || '';
    return d.startsWith(selectedMonth);
  });
  const newClientsAddedCount = currentMonthClients.length;

  // Quotes this month
  const prevMonth = new Date(selectedMonth + '-01T00:00:00');
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const prev2Month = new Date(selectedMonth + '-01T00:00:00');
  prev2Month.setMonth(prev2Month.getMonth() - 2);
  const prev2MonthStr = `${prev2Month.getFullYear()}-${String(prev2Month.getMonth() + 1).padStart(2, '0')}`;

  const calculateQuoteTotal = (q: any) => {
    if (q.proposedPrice || q.totalValue) return parseFloat(q.proposedPrice || q.totalValue || '0') || 0;
    const items = q.items || [];
    const subtotal = items.reduce((sum: number, it: any) => sum + ((it.quantity || 0) * (it.unitPrice || 0) * (1 - (it.discountPct || 0)/100)), 0);
    return subtotal * 1.15;
  };

  const getMonthStats = (monthStr: string) => {
    const monthQuotes = quotations.filter(q => {
      if (!isQuoteOrClientByRep(q.createdBy || q.salesRepName || q.sales_rep_name || q.approvedBy, selectedRep, realArabicName)) return false;
      const d = q.dateCreated || q.date_created || '';
      return d.startsWith(monthStr);
    });

    const approved = monthQuotes.filter(q => q.status === 'معتمد' || q.status === 'Approved');
    const draftCount = monthQuotes.filter(q => q.status === 'مسودة' || q.status === 'Draft' || !q.status).length;
    
    // total quotes value
    const totalQuotesValue = monthQuotes.reduce((sum, q) => sum + calculateQuoteTotal(q), 0);
    const approvedQuotesValue = approved.reduce((sum, q) => sum + calculateQuoteTotal(q), 0);

    let collected = 0;
    const allRepQuotes = quotations.filter(q => isQuoteOrClientByRep(q.createdBy || q.salesRepName || q.sales_rep_name || q.approvedBy, selectedRep, realArabicName));
    const allRepQuotesNumbers = allRepQuotes.map(q => q.quotationNumber || q.id || q.quotationNo);
    const relevantCollections = collections.filter(c => allRepQuotesNumbers.includes(c.quotationNumber));
    
    relevantCollections.forEach(plan => {
      if (plan.phases) {
        plan.phases.forEach((ph: any) => {
          const phAmount = parseFloat(ph.amount || '0') || 0;
          const isCollected = ph.status ? ph.status.includes('تم التحصيل') : ph.isCollected;
          const colDate = ph.collectedDate || '';
          if (isCollected && colDate.startsWith(monthStr)) {
             collected += phAmount;
          }
        });
      }
    });

    return { 
      quotes: monthQuotes, 
      approvedCount: approved.length, 
      draftCount, 
      totalCount: monthQuotes.length,
      totalQuotesValue,
      approvedQuotesValue,
      collected 
    };
  };

  const currentStats = getMonthStats(selectedMonth);
  const prevStats = getMonthStats(prevMonthStr);
  const prev2Stats = getMonthStats(prev2MonthStr);

  const currentMonthQuotes = currentStats.quotes;
  const prevMonthQuotes = prevStats.quotes;

  const totalQuotesCount = currentStats.totalCount;
  let newClientQuotesCount = 0;
  let oldClientQuotesCount = 0;

  currentMonthQuotes.forEach(q => {
    // Check if we have previous quotes globally for this client before this month
    const previousQuotesList = quotations.filter(prevQ => {
      if ((prevQ.clientId || prevQ.clientName) !== (q.clientId || q.clientName)) return false;
      const prevD = prevQ.dateCreated || prevQ.date_created || '';
      return prevD < selectedMonth;
    });

    if (previousQuotesList.length > 0) {
      oldClientQuotesCount++;
    } else {
      newClientQuotesCount++;
    }
  });

  const percentageNewClientsQuotes = totalQuotesCount ? Math.round((newClientQuotesCount / totalQuotesCount) * 100) : 0;
  const percentageOldClientsQuotes = totalQuotesCount ? 100 - percentageNewClientsQuotes : 0;

  const totalQuotesValue = currentStats.totalQuotesValue;
  
  const draftQuotesCount = currentStats.draftCount;
  const approvedQuotesCount = currentStats.approvedCount;
  const conversionRate = totalQuotesCount ? Math.round((approvedQuotesCount / totalQuotesCount) * 100) : 0;

  // Collections accumulation logic
  let targetForCollection = 0;
  let totalCollectedThisMonth = 0;
  let delayedCollectionsCount = 0;

  // All quotes belonging to this rep
  const allRepQuotes = quotations.filter(q => isQuoteOrClientByRep(q.createdBy || q.salesRepName || q.sales_rep_name || q.approvedBy, selectedRep, realArabicName));
  const allRepQuotesNumbers = allRepQuotes.map(q => q.quotationNumber || q.id || q.quotationNo);

  const relevantCollections = collections.filter(c => allRepQuotesNumbers.includes(c.quotationNumber));
  
  relevantCollections.forEach(plan => {
    if (plan.phases) {
      plan.phases.forEach((ph: any) => {
        const phAmount = parseFloat(ph.amount || '0') || 0;
        const isCollected = ph.status ? ph.status.includes('تم التحصيل') : ph.isCollected;
        const isDelayed = ph.status === 'متأخر';
        const colDate = ph.collectedDate || '';
        const dueDate = ph.dueDate || '';

        // Collected in current month
        if (isCollected && colDate.startsWith(selectedMonth)) {
            totalCollectedThisMonth += phAmount;
            targetForCollection += phAmount;
        } else if (!isCollected) {
            // Include due payments this month OR previously accumulated unpaid
            if (dueDate <= `${selectedMonth}-31` || dueDate.startsWith(selectedMonth)) {
                targetForCollection += phAmount;
            }
        }

        if (isDelayed) {
            delayedCollectionsCount++;
        }
      });
    }
  });

  // --- Daily Trends for Selected Month ---
  const parts = selectedMonth.split('-');
  const daysInMonthNum = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
  const dailyData = Array.from({length: daysInMonthNum}, (_, i) => {
    const dayNum = i + 1;
    const dayStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
    
    // Approved Sales (معتمد) value for this day
    const dayApproved = currentMonthQuotes.filter(q => 
       (q.status === 'معتمد' || q.status === 'Approved') && 
       (q.dateCreated || q.date_created || q.createdAt || q.date || '').startsWith(dayStr)
    );
    const approvedValue = dayApproved.reduce((sum, q) => sum + calculateQuoteTotal(q), 0);
    
    // Quotes (total) for this day
    const dayQuotes = currentMonthQuotes.filter(q => 
       (q.dateCreated || q.date_created || q.createdAt || q.date || '').startsWith(dayStr)
    );
    const quotesValue = dayQuotes.reduce((sum, q) => sum + calculateQuoteTotal(q), 0);

    // Collections for this day
    let collectedValue = 0;
    relevantCollections.forEach(plan => {
      if (plan.phases) {
        plan.phases.forEach((ph: any) => {
          const phAmount = parseFloat(ph.amount || '0') || 0;
          const isCollected = ph.status ? ph.status.includes('تم التحصيل') : ph.isCollected;
          const colDate = ph.collectedDate || '';
          if (isCollected && colDate.startsWith(dayStr)) {
             collectedValue += phAmount;
          }
        });
      }
    });

    return {
      name: String(dayNum),
      "المبيعات المعتمدة": approvedValue,
      "عروض الأسعار الكلية": quotesValue,
      "التحصيلات النقدية": collectedValue
    };
  });

  const approvedQuotesValue = currentStats.approvedQuotesValue;
  const collectionStrength = targetForCollection > 0 ? Math.round((totalCollectedThisMonth / targetForCollection) * 100) : 0;
  const targetAchievementRate = targetAmount ? Math.round((approvedQuotesValue / targetAmount) * 100) : 0;
  
  const amountAboveTarget = Math.max(0, approvedQuotesValue - targetAmount);
  const commissionValue = targetAmount > 0 ? amountAboveTarget * 0.025 : 0;

  const handlePrint = () => {
    const maxDailyApproved = Math.max(...dailyData.map(d => d['المبيعات المعتمدة'] || 0), 1);
    const dailyChartHTML = dailyData.map(d => {
      const val = d['المبيعات المعتمدة'] || 0;
      const heightPercent = maxDailyApproved > 0 ? ((val / maxDailyApproved) * 100).toFixed(1) : '0';
      return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 80px; flex: 1;">
          <div style="font-size: 7px; color: #4f46e5; margin-bottom: 2px; font-weight: bold; transform: rotate(-45deg); height: 15px;">${val > 0 ? val.toLocaleString() : ''}</div>
          <div style="background-color: #6366f1; width: 8px; border-radius: 2px 2px 0 0; height: ${heightPercent}%;"></div>
          <div style="font-size: 6px; color: #64748b; margin-top: 2px;">${d.name}</div>
        </div>
      `;
    }).join('');

    const pWindow = window.open('', '_blank');
    if (pWindow) {
      pWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>مؤشرات أداء وتشغيل المندوب</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
              @page { size: A4; margin: 20mm; }
              body { font-family: 'Tajawal', sans-serif !important; background: white; padding: 0; color: #1e293b; font-size: 12px; margin: 0; box-sizing: border-box; }
              .stat-box { border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 8px; background: #f8fafc; }
              .stat-box-label { color: #64748b; margin-bottom: 2px; font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .stat-box-value { font-size: 14px; font-weight: 900; color: #0f172a; white-space: nowrap; }
              .ai-report { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 11px; white-space: pre-wrap; line-height: 1.5; color: #1e293b; font-weight: 500; overflow-y: hidden; }
              .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px; }
          </style>
        </head>
        <body style="height: 100vh; display: flex; flex-direction: column;">
          
          ${sharedPrintHeader}

          <h1 class="text-xl font-black mb-3 text-center text-slate-800">تقرير مؤشرات أداء وتشغيل: ${repName} - <span class="text-slate-500 text-base font-bold">عن شهر: ${selectedMonth}</span></h1>
          
          <h2 class="section-title">مؤشرات المبيعات والعمولات</h2>
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="stat-box"><div class="stat-box-label">الهدف المالي</div><div class="stat-box-value">${targetAmount.toLocaleString()} ريال</div></div>
            <div class="stat-box"><div class="stat-box-label">المحصل المعتمد</div><div class="stat-box-value text-indigo-700">${approvedQuotesValue.toLocaleString()} ريال</div></div>
            <div class="stat-box"><div class="stat-box-label">تحقيق الهدف</div><div class="stat-box-value ${targetAchievementRate >= 100 ? 'text-emerald-600' : 'text-blue-600'}">${targetAchievementRate}% مقفل</div></div>
            <div class="stat-box"><div class="stat-box-label">عمولة إضافية</div><div class="stat-box-value text-orange-600">${commissionValue.toLocaleString()} ريال</div></div>
          </div>

          <h2 class="section-title">مؤشرات تشغيلية وتقييم العروض</h2>
          <div class="grid grid-cols-5 gap-2 mb-4">
            <div class="stat-box"><div class="stat-box-label">العروض الصادرة</div><div class="stat-box-value text-indigo-600">${totalQuotesCount}</div></div>
            <div class="stat-box"><div class="stat-box-label">تم الاعتماد</div><div class="stat-box-value text-emerald-600">${approvedQuotesCount}</div></div>
            <div class="stat-box"><div class="stat-box-label">قيد التفاوض (مسودة)</div><div class="stat-box-value text-amber-600">${draftQuotesCount}</div></div>
            <div class="stat-box"><div class="stat-box-label">نسبة التحويل</div><div class="stat-box-value text-slate-800">${conversionRate}%</div></div>
            <div class="stat-box"><div class="stat-box-label">القيمة التقديرية</div><div class="stat-box-value">${totalQuotesValue.toLocaleString()}</div></div>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <h2 class="section-title !text-emerald-700 !border-emerald-100">مؤشرات طبيعة العملاء للمندوب</h2>
              <div class="grid grid-cols-2 gap-2">
                <div class="stat-box"><div class="stat-box-label">عروض لعملاء جدد</div><div class="stat-box-value text-emerald-600">${newClientQuotesCount} <span class="text-[10px] font-normal text-slate-500">(${percentageNewClientsQuotes}%)</span></div></div>
                <div class="stat-box"><div class="stat-box-label">عروض لعملاء قدامى</div><div class="stat-box-value text-blue-600">${oldClientQuotesCount} <span class="text-[10px] font-normal text-slate-500">(${percentageOldClientsQuotes}%)</span></div></div>
              </div>
            </div>
            <div>
               <h2 class="section-title !text-red-700 !border-red-100">مؤشرات المديونيات وقوة التحصيل</h2>
               <div class="grid grid-cols-2 gap-2">
                 <div class="stat-box"><div class="stat-box-label">الهدف المطلوب تحصيله</div><div class="stat-box-value text-slate-700">${targetForCollection.toLocaleString()}</div></div>
                 <div class="stat-box border-emerald-200 bg-emerald-50"><div class="stat-box-label text-emerald-800">قوة وفاعلية التحصيل</div><div class="stat-box-value font-black text-indigo-700">${collectionStrength}%</div></div>
               </div>
               <div class="text-center mt-1 font-bold text-[10px] text-red-600">يوجد عدد (${delayedCollectionsCount}) دفعات متأخرة بالجدولة</div>
            </div>
          </div>

          <h2 class="section-title">مقارنة الأداء - آخر 3 أشهر</h2>
          <table class="w-full text-sm text-right align-middle mb-4" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; font-weight: bold;">
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">المؤشر</th>
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${prev2MonthStr}</th>
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${prevMonthStr}</th>
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #1e293b;">${selectedMonth} (الحالي)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; font-weight: bold; color: #334155;">المبيعات المعتمدة (ر.س)</td>
                <td style="padding: 8px; text-align: center; color: #64748b;">${prev2Stats.approvedQuotesValue.toLocaleString()}</td>
                <td style="padding: 8px; text-align: center; color: #475569;">${prevStats.approvedQuotesValue.toLocaleString()}</td>
                <td style="padding: 8px; text-align: center; color: #047857; font-weight: 900; background-color: #ecfdf5;">${currentStats.approvedQuotesValue.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; font-weight: bold; color: #334155;">التحصيلات النقدية (ر.س)</td>
                <td style="padding: 8px; text-align: center; color: #64748b;">${prev2Stats.collected.toLocaleString()}</td>
                <td style="padding: 8px; text-align: center; color: #475569;">${prevStats.collected.toLocaleString()}</td>
                <td style="padding: 8px; text-align: center; color: #1d4ed8; font-weight: 900; background-color: #eff6ff;">${currentStats.collected.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #334155;">عروض الأسعار المعتمدة (عدد)</td>
                <td style="padding: 8px; text-align: center; color: #64748b;">${prev2Stats.approvedCount}</td>
                <td style="padding: 8px; text-align: center; color: #475569;">${prevStats.approvedCount}</td>
                <td style="padding: 8px; text-align: center; color: #4338ca; font-weight: 900; background-color: #eef2ff;">${currentStats.approvedCount}</td>
              </tr>
            </tbody>
          </table>

          <h2 class="section-title">مؤشر المبيعات المعتمدة اليومية (خلال الشهر)</h2>
          <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 100px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
            ${dailyChartHTML}
          </div>

          ${sharedPrintFooter}

          <script>
            window.onload = function() {
              setTimeout(function(){ window.print(); }, 1500);
            }
          </script>
        </body>
        </html>
      `);
      pWindow.document.close();
    }
  };

  const filteredReps = systemUsers.filter(u => salesRepsList.includes(u.username));
  const otherUsers = systemUsers.filter(u => {
    if (salesRepsList.includes(u.username)) return false;
    const dispName = getRepDisplayName(u.username).toLowerCase();
    return dispName.includes(repSearch.toLowerCase()) || u.username.toLowerCase().includes(repSearch.toLowerCase());
  });

  if (loading) {
    return <div className="p-12 text-center text-slate-500">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-600" />
            المندوبين والأهداف
          </h2>
          <p className="text-slate-500 mt-1 text-sm">متابعة دقيقة لمؤشرات أداء مناديب المبيعات والأهداف الشهرية</p>
        </div>
        <div className="flex gap-3 items-center">
           {selectedRep && (
             <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm font-bold shadow-lg shadow-slate-200">
               <Printer className="w-4 h-4" />
               طباعة التقرير
             </button>
           )}
           <button onClick={() => setIsAddRepModalOpen(true)} className="bg-[#0072BC] hover:bg-[#005A96] text-white px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-100">
             <PlusCircle className="w-4 h-4" />
             إضافة مندوب للتصنيف
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <label className="block mb-2 text-slate-700 font-bold">اختيار المندوب</label>
          <div className="relative">
             <select 
               value={selectedRep} 
               onChange={(e) => setSelectedRep(e.target.value)} 
               className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-100 bg-slate-50"
             >
               <option value="">-- اختر المندوب من القائمة --</option>
               {filteredReps.map(rep => (
                 <option key={rep.username} value={rep.username}>{getRepDisplayName(rep.username)}</option>
               ))}
             </select>
             <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
          {selectedRep && (
            <button onClick={() => removeSalesRep(selectedRep)} className="text-red-500 text-xs mt-2 flex items-center gap-1 hover:text-red-600">
              <Trash2 className="w-3 h-3" /> إزالة المندوب من تصنيف المبيعات
            </button>
          )}
        </div>
        <div>
          <label className="block mb-2 text-slate-700 font-bold">الشهر ميلادي</label>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-100 bg-slate-50"
          />
        </div>
      </div>

      {selectedRep && (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                 <DollarSign className="w-5 h-5 text-indigo-500" />
                 إعدادات الهدف الشهري
              </span>
              <div className="flex gap-2">
                 <input 
                   type="number" 
                   value={manualTargetInput}
                   onChange={e => setManualTargetInput(e.target.value)}
                   placeholder="أدخل مبلغ التارجت..." 
                   className="border px-3 py-1.5 rounded-lg text-sm w-48 text-left" dir="ltr"
                 />
                 <button onClick={updateTarget} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-100 transition font-bold">حفظ</button>
              </div>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-slate-100 text-slate-600">
                   <Target className="w-5 h-5" />
                 </div>
                 <span className="text-slate-500 text-xs font-bold mb-1">الهدف الشهري</span>
                 <h4 className="text-2xl font-black text-slate-800">{targetAmount.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
               </div>

               <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-emerald-100 text-emerald-600">
                   <CheckCircle className="w-5 h-5" />
                 </div>
                 <span className="text-emerald-700 text-xs font-bold mb-1">المبيعات المعتمدة (المحققة)</span>
                 <h4 className="text-2xl font-black text-emerald-900">{approvedQuotesValue.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
               </div>

               <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                 <div className="w-16 h-16 rounded-full border-[5px] border-blue-500 text-blue-700 flex items-center justify-center mb-3 font-black text-lg bg-white">
                   {targetAchievementRate}%
                 </div>
                 <span className="text-blue-700 text-xs font-bold mb-1">نسبة تحقيق الهدف</span>
                 <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden mt-1"><div className="bg-blue-600 h-full" style={{width: `${Math.min(100, targetAchievementRate)}%`}}></div></div>
               </div>

               <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-orange-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-orange-100 text-orange-500">
                   <DollarSign className="w-5 h-5" />
                 </div>
                 <span className="text-orange-700 text-xs font-bold mb-1">العمولة المستحقة (2.5%)</span>
                 <h4 className="text-2xl font-black text-orange-900">{commissionValue.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
                 <p className="text-[9px] text-orange-600 mt-1">تستحق للمبالغ المحققة فوق التارجت فقط</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
               <h3 className="text-lg font-bold text-slate-800 border-b pb-4 flex items-center gap-2 mb-2">
                 <Activity className="w-5 h-5 text-indigo-500" />
                 مؤشرات الحركة التشغيلية للعروض
               </h3>
               
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <div>
                   <p className="text-slate-500 text-xs mb-1">زيارة وعروض لعملاء جدد هذا الشهر</p>
                   <p className="text-lg font-bold text-slate-800">{newClientQuotesCount} عميل جديد</p>
                 </div>
                 <Users className="w-6 h-6 text-slate-300" />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                   <p className="text-amber-700 text-xs mb-1 font-bold">عروض كمسودة (قيد التفاوض)</p>
                   <p className="text-lg font-black text-amber-800">{draftQuotesCount} عرض</p>
                 </div>
                 <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                   <p className="text-emerald-700 text-xs mb-1 font-bold">عروض أسعار معتمدة</p>
                   <p className="text-lg font-black text-emerald-800">{approvedQuotesCount} عرض</p>
                 </div>
               </div>

               <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                 <div>
                   <p className="text-indigo-700 text-xs mb-1 font-bold">نسبة تحويل عروض السعر لاعتماد</p>
                   <p className="text-lg font-black text-indigo-800">{conversionRate}% تحويل ناجح</p>
                 </div>
                 <TrendingUp className="w-6 h-6 text-indigo-300" />
               </div>

               <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                 <p className="text-slate-500 text-xs mb-3 text-center">توزيع المشاريع وفتح فرص حسب حالة العميل</p>
                 <div className="flex justify-around items-center">
                   <div className="text-center">
                     <div className="w-14 h-14 rounded-full border-[4px] border-indigo-500 flex items-center justify-center text-slate-800 font-bold mb-2 mx-auto">
                        {percentageNewClientsQuotes}%
                     </div>
                     <span className="text-xs text-slate-600 font-bold block">عملاء جدد تماماً</span>
                   </div>
                   <div className="text-center">
                     <div className="w-14 h-14 rounded-full border-[4px] border-slate-300 flex items-center justify-center text-slate-800 font-bold mb-2 mx-auto">
                        {percentageOldClientsQuotes}%
                     </div>
                     <span className="text-xs text-slate-600 font-bold block">عملاء قدامى مكررين</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                 <h3 className="text-lg font-bold text-slate-800 border-b pb-4 flex items-center gap-2 mb-6">
                   <DollarSign className="w-5 h-5 text-indigo-500" />
                   مؤشرات التحصيل
                 </h3>
                 <div className="flex flex-col items-center">
                   <div className="w-32 h-32 rounded-full border-8 border-emerald-100 relative flex items-center justify-center mb-4 box-border border-b-emerald-500" style={{ transform: `rotate(${(collectionStrength / 100) * 180}deg)`}}>
                     <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: `rotate(-${(collectionStrength / 100) * 180}deg)`}}>
                       <span className="text-3xl font-black text-emerald-600">{collectionStrength}%</span>
                       <span className="text-[10px] text-emerald-700">قوة التحصيل</span>
                     </div>
                   </div>
                   
                   <div className="w-full grid grid-cols-2 gap-4 mt-4">
                     <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <p className="text-[10px] text-slate-500 mb-1">المبلغ المحصل</p>
                        <p className="font-bold text-emerald-600">{totalCollectedThisMonth.toLocaleString()} ر.س</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <p className="text-[10px] text-slate-500 mb-1">المستحق الدفتري الشامل عليه</p>
                        <p className="font-bold text-slate-700">{targetForCollection.toLocaleString()} ر.س</p>
                     </div>
                     <div className="col-span-2 bg-red-50 p-3 rounded-lg flex items-center justify-between border border-red-100">
                       <span className="text-xs text-red-700 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> دفعات متأخرة بالتحصيل بالجدولة</span>
                       <span className="font-bold text-red-700 px-3 py-1 bg-red-100 rounded-full">{delayedCollectionsCount} دفعة متأخرة</span>
                     </div>
                   </div>
                 </div>
              </div>

            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 relative z-10 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  مقارنة الأداء - آخر 3 أشهر
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right align-middle">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold">
                        <th className="p-3 border-b rounded-tr-lg">المؤشر</th>
                        <th className="p-3 border-b text-center">{prev2MonthStr}</th>
                        <th className="p-3 border-b text-center">{prevMonthStr}</th>
                        <th className="p-3 border-b text-center">{selectedMonth} (الحالي)</th>
                        <th className="p-3 border-b text-center rounded-tl-lg w-32">مسار الأداء (Trend)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* المبيعات المعتمدة */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-700">المبيعات المعتمدة (ر.س)</td>
                        <td className="p-3 text-center text-slate-500 font-mono">{prev2Stats.approvedQuotesValue.toLocaleString()}</td>
                        <td className="p-3 text-center text-slate-600 font-bold font-mono group">
                          {prevStats.approvedQuotesValue.toLocaleString()}
                          {(() => {
                             const p = prev2Stats.approvedQuotesValue;
                             const c = prevStats.approvedQuotesValue;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 text-center text-emerald-700 font-black font-mono bg-emerald-50/30">
                          {currentStats.approvedQuotesValue.toLocaleString()}
                          {(() => {
                             const p = prevStats.approvedQuotesValue;
                             const c = currentStats.approvedQuotesValue;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 bg-slate-50/50">
                          <div className="h-10 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[
                                { name: 'M1', value: prev2Stats.approvedQuotesValue },
                                { name: 'M2', value: prevStats.approvedQuotesValue },
                                { name: 'M3', value: currentStats.approvedQuotesValue }
                              ]}>
                                <Line type="monotone" dataKey="value" stroke={currentStats.approvedQuotesValue >= prevStats.approvedQuotesValue ? "#10b981" : "#ef4444"} strokeWidth={3} dot={{r:3}} isAnimationActive={false} />
                                <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
                                <Tooltip contentStyle={{fontSize:'10px', padding:'2px', borderRadius:'4px'}} labelStyle={{display:'none'}} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>

                      {/* التحصيلات */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-700">التحصيلات النقدية (ر.س)</td>
                        <td className="p-3 text-center text-slate-500 font-mono">{prev2Stats.collected.toLocaleString()}</td>
                        <td className="p-3 text-center text-slate-600 font-bold font-mono group">
                          {prevStats.collected.toLocaleString()}
                          {(() => {
                             const p = prev2Stats.collected;
                             const c = prevStats.collected;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 text-center text-blue-700 font-black font-mono bg-blue-50/30">
                          {currentStats.collected.toLocaleString()}
                          {(() => {
                             const p = prevStats.collected;
                             const c = currentStats.collected;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 bg-slate-50/50">
                          <div className="h-10 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[
                                { name: 'M1', value: prev2Stats.collected },
                                { name: 'M2', value: prevStats.collected },
                                { name: 'M3', value: currentStats.collected }
                              ]}>
                                <Line type="monotone" dataKey="value" stroke={currentStats.collected >= prevStats.collected ? "#3b82f6" : "#ef4444"} strokeWidth={3} dot={{r:3}} isAnimationActive={false} />
                                <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
                                <Tooltip contentStyle={{fontSize:'10px', padding:'2px', borderRadius:'4px'}} labelStyle={{display:'none'}} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>

                      {/* إجمالي العروض */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-700">عروض الأسعار المعتمدة (عدد)</td>
                        <td className="p-3 text-center text-slate-500 font-mono">{prev2Stats.approvedCount}</td>
                        <td className="p-3 text-center text-slate-600 font-bold font-mono group">
                          {prevStats.approvedCount}
                          {(() => {
                             const p = prev2Stats.approvedCount;
                             const c = prevStats.approvedCount;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 text-center text-indigo-700 font-black font-mono bg-indigo-50/30">
                          {currentStats.approvedCount}
                          {(() => {
                             const p = prevStats.approvedCount;
                             const c = currentStats.approvedCount;
                             const diff = p ? ((c - p) / p) * 100 : (c ? 100 : 0);
                             if (diff === 0) return null;
                             return <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${diff > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>{diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%</div>;
                          })()}
                        </td>
                        <td className="p-3 bg-slate-50/50">
                          <div className="h-10 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[
                                { name: 'M1', value: prev2Stats.approvedCount },
                                { name: 'M2', value: prevStats.approvedCount },
                                { name: 'M3', value: currentStats.approvedCount }
                              ]}>
                                <Line type="monotone" dataKey="value" stroke={currentStats.approvedCount >= prevStats.approvedCount ? "#6366f1" : "#ef4444"} strokeWidth={3} dot={{r:3}} isAnimationActive={false} />
                                <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                                <Tooltip contentStyle={{fontSize:'10px', padding:'2px', borderRadius:'4px'}} labelStyle={{display:'none'}} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-4 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  مؤشر الأداء اليومي خلال ({selectedMonth})
                </h3>
                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(value) => value > 0 ? (value / 1000) + 'k' : '0'} />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}} />
                      <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                      <Line type="monotone" dataKey="المبيعات المعتمدة" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="التحصيلات النقدية" stroke="#3b82f6" strokeWidth={3} dot={{r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="عروض الأسعار الكلية" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </>
      )}

      {isAddRepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0072BC]" />
                ترشيح موظف كمندوب مبيعات
              </h3>
              <button onClick={() => setIsAddRepModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2 text-xl font-bold">×</button>
            </div>
            
            <div className="p-6 border-b border-t border-slate-100 sticky top-0 bg-white">
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="ابحث بالاسم عن الموظف..." 
                  value={repSearch}
                  onChange={e => setRepSearch(e.target.value)}
                  className="w-full p-3 pr-10 border rounded-xl text-sm outline-none focus:border-indigo-400 bg-slate-50"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>
            
            <div className="overflow-y-auto p-2" style={{ maxHeight: '400px' }}>
               {otherUsers.length === 0 ? (
                 <div className="p-8 text-center text-slate-400">لا يوجد مستخدمين متطابقين للبحث.</div>
               ) : (
                 otherUsers.map(sysUser => (
                   <div key={sysUser.username} className="flex justify-between items-center p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 rounded-xl transition">
                     <div>
                       <p className="font-bold text-slate-800 text-sm">{getRepDisplayName(sysUser.username)}</p>
                       <p className="text-[10px] text-slate-500">{sysUser.role || 'مستخدم نظام'}</p>
                     </div>
                     <button onClick={() => addSalesRep(sysUser.username)} className="text-sm bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition shadow-sm border border-indigo-100">
                       إضافة لقائمة المناديب
                     </button>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ensure Sparkles is imported correctly above!
