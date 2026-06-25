import React, { useState, useEffect, useMemo } from 'react';
import { FileBarChart, Printer, Search, Calendar, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SalesReports({ lang, user }: { lang: 'ar' | 'en'; user: any }) {
  const [clients, setClients] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState('clients_report');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Clients Report State
  const [clientReportType, setClientReportType] = useState<'comprehensive' | 'specific'>('comprehensive');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Collections Report State
  const [collectionReportType, setCollectionReportType] = useState<'comprehensive' | 'specific' | 'delayed'>('comprehensive');

  // Reps Report State
  const [selectedRep, setSelectedRep] = useState('');

  const updatePhaseStatuses = (phases: any[]): any[] => {
    let firstUnpaidFound = false;

    return (phases || []).map(phase => {
      if (phase.status.includes('تم التحصيل') || phase.status.includes('مدفوعة')) return phase;
      
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
        return { ...phase, status: 'بانتظار الدفعة' };
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [resClients, resQuotes, resCollections] = await Promise.all([
        fetch(`/api/clients?t=${ts}`).then(r => r.json()),
        fetch(`/api/sales_quotations?t=${ts}`).then(r => r.json()),
        fetch(`/api/dynamic/financial_collections?t=${ts}`).then(r => r.json())
      ]);
      setClients(resClients || []);
      setQuotations(resQuotes || []);
      
      const collectionsData = Array.isArray(resCollections) ? resCollections : [];
      const formattedCollections = collectionsData.map((p: any) => ({
        ...p,
        phases: updatePhaseStatuses(p.phases || [])
      }));
      setCollections(formattedCollections);
    } catch (e) {
      console.error('Error fetching defaults for reports:', e);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Computations for Comprehensive Report ----------------
  const comprehensiveStats = useMemo(() => {
    if (clientReportType !== 'comprehensive') return null;
    
    const now = new Date();
    let validClients = clients;

    // Filter by date range if provided
    const isWithinRange = (dateStr: string) => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(dateStr);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo)) return false;
      return true;
    };

    validClients = clients.filter(c => isWithinRange(c.dateCreated || c.createdAt || c.timestamp || now.toISOString()));
    const totalClients = validClients.length;

    // New clients last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const newClients3Months = validClients
      .filter(c => new Date(c.dateCreated || c.createdAt || c.timestamp) >= threeMonthsAgo)
      .sort((a,b) => new Date(b.dateCreated || b.createdAt || b.timestamp).getTime() - new Date(a.dateCreated || a.createdAt || a.timestamp).getTime())
      .map(c => ({
         name: c.clientName || c.name || 'غير محدد',
         date: new Date(c.dateCreated || c.createdAt || c.timestamp).toISOString().split('T')[0]
      }));

    const validQuotes = quotations.filter(q => isWithinRange(q.dateCreated || q.quoteDate || q.createdAt || q.date || now.toISOString()));

    const calculateQuoteTotal = (q: any) => {
      if (typeof q.totalAmount === 'number') return q.totalAmount;
      const itemsList = q.items || [];
      const sumItems = itemsList.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unitPrice || item.price || 0)), 0);
      const fees = q.installationFees || 0;
      const vat = q.vatRate !== undefined ? q.vatRate : 0.15;
      return (sumItems + fees) * (1 + vat);
    };

    // Top 3 clients by request count & value
    const clientStats: Record<string, { count: number, value: number, name: string }> = {};
    validClients.forEach(c => {
      clientStats[c.id] = { count: 0, value: 0, name: c.clientName || c.name };
    });

    validQuotes.forEach(q => {
      let cId = q.clientId;
      if (!clientStats[cId]) {
        const qName = (q.clientName || '').trim();
        const found = validClients.find(c => (c.clientName || c.name || '').trim() === qName);
        if (found) cId = found.id;
      }
      if (clientStats[cId]) {
        if (q.status === 'Approved' || q.status === 'معتمد') {
          clientStats[cId].count += 1;
        }
      }
    });

    collections.forEach(plan => {
      const cMatch = validClients.find(c => c.id === plan.clientId || c.clientName === plan.clientName || c.name === plan.clientName);
      if (cMatch && clientStats[cMatch.id]) {
        if (plan.phases) {
          plan.phases.forEach((p:any) => {
             if (p.status === 'تم التحصيل' || p.status === 'مدفوعة' || p.status === 'تم التحصيل متأخر') {
               clientStats[cMatch.id].value += (p.amount || 0);
             }
          });
        }
      }
    });

    const top3ByCount = Object.values(clientStats).sort((a,b) => b.count - a.count).slice(0, 3);
    const top3ByValue = Object.values(clientStats).sort((a,b) => b.value - a.value).slice(0, 3);

    const clientsWithoutQuotes = Object.values(clientStats).filter(c => c.count === 0).length;

    // Classifications
    let active = 0, dormant = 0, forgotten = 0, old = 0;
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    validClients.forEach(c => {
      const cQuotes = validQuotes.filter(q => q.clientId === c.id);
      if (cQuotes.length === 0) {
         if (new Date(c.dateCreated || c.createdAt || now) < oneYearAgo) old++;
         return;
      }
      
      const lastQuoteDateArr = cQuotes.map(q => new Date(q.dateCreated || q.quoteDate || q.createdAt).getTime());
      const lastQDate = new Date(Math.max(...lastQuoteDateArr));
      
      if (lastQDate >= thirtyDaysAgo) active++;
      else if (lastQDate >= ninetyDaysAgo) dormant++;
      else if (lastQDate >= sixMonthsAgo) forgotten++;
      else old++;
    });

    return {
      totalClients,
      newClients3Months,
      top3ByCount,
      top3ByValue,
      clientsWithoutQuotes,
      classifiers: { active, dormant, forgotten, old }
    };
  }, [clients, quotations, clientReportType, dateFrom, dateTo]);


  // ---------------- Computations for Specific Client ----------------
  const specificClientStats = useMemo(() => {
    if (clientReportType !== 'specific' || !selectedClientId) return null;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return null;

    const isWithinRange = (dateStr: string) => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(dateStr);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo)) return false;
      return true;
    };

    const calculateQuoteTotal = (q: any) => {
      if (typeof q.totalAmount === 'number') return q.totalAmount;
      const itemsList = q.items || [];
      const sumItems = itemsList.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unitPrice || item.price || 0)), 0);
      const fees = q.installationFees || 0;
      const vat = q.vatRate !== undefined ? q.vatRate : 0.15;
      return (sumItems + fees) * (1 + vat);
    };

    const targetClientName = ((client.clientName || client.name) || '').trim();
    const cQuotes = quotations.filter(q => {
      const qClientName = (q.clientName || '').trim();
      const match = q.clientId === client.id || (qClientName && targetClientName && qClientName === targetClientName);
      return match && isWithinRange(q.createdAt || q.dateCreated || q.date || new Date().toISOString());
    });
    const approvedQuotes = cQuotes.filter(q => q.status === 'Approved' || q.status === 'معتمد');
    
    // Values
    const totalQuotesValue = cQuotes.reduce((sum, q) => sum + calculateQuoteTotal(q), 0);
    
    const totalApprovedValue = (() => {
       const cCollections = collections.filter(c => {
         const cMatchName = (c.clientName || '').trim();
         return c.clientId === client.id || (cMatchName && targetClientName && cMatchName === targetClientName);
       });
       let sum = 0;
       cCollections.forEach(plan => {
         sum += (plan.totalAmount || 0);
       });
       return sum;
    })();

    const totalPaid = (() => {
       const cCollections = collections.filter(c => {
         const cMatchName = (c.clientName || '').trim();
         return c.clientId === client.id || (cMatchName && targetClientName && cMatchName === targetClientName);
       });
       let sum = 0;
       cCollections.forEach(plan => {
         if (plan.phases) {
           plan.phases.forEach((p:any) => {
             if (p.status === 'تم التحصيل' || p.status === 'مدفوعة' || p.status === 'تم التحصيل متأخر') {
               sum += (p.amount || 0);
             }
           });
         }
       });
       return sum;
    })();

    const totalRemaining = (() => {
       const cCollections = collections.filter(c => {
         const cMatchName = (c.clientName || '').trim();
         return c.clientId === client.id || (cMatchName && targetClientName && cMatchName === targetClientName);
       });
       let sum = 0;
       cCollections.forEach(plan => {
         if (plan.phases) {
           plan.phases.forEach((p:any) => {
             if (p.status !== 'تم التحصيل' && p.status !== 'مدفوعة' && p.status !== 'تم التحصيل متأخر') {
               sum += (p.amount || 0);
             }
           });
         }
       });
       return sum;
    })();

    // Last interaction
    const lastQDate = cQuotes.length > 0 ? new Date(Math.max(...cQuotes.map(q => new Date(q.createdAt || q.dateCreated || q.date).getTime()))) : null;

    // Top 3 Reps
    const repsStats: Record<string, number> = {};
    cQuotes.forEach(q => {
      const repKey = q.createdBy || q.salesRepName || q.salesRep || 'غير محدد';
      repsStats[repKey] = (repsStats[repKey] || 0) + 1;
    });
    const top3Reps = Object.entries(repsStats).sort((a,b) => b[1] - a[1]).slice(0, 3).map(e => ({ name: e[0], count: e[1]}));

    return {
      client,
      quotesCount: cQuotes.length,
      totalQuotesValue,
      totalApprovedValue,
      totalPaid,
      totalRemaining,
      lastInteractionDate: lastQDate,
      top3Reps
    };

  }, [clients, quotations, collections, clientReportType, selectedClientId, dateFrom, dateTo]);

  // ---------------- Computations for Collections Report ----------------
  const collectionsComprehensiveStats = useMemo(() => {
    let validPlans = collections;
    if (dateFrom || dateTo) {
      validPlans = collections.filter(p => {
        const d = new Date(p.createdAt || p.dateCreated || p.timestamp || new Date().toISOString());
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;
        return true;
      });
    }

    let totalProjectsValue = 0;
    let totalCollected = 0;
    let totalDelayed = 0;
    let dueThisWeekCount = 0;
    let dueThisMonthCount = 0;
    const delayedClients = new Set<string>();
    const latestPayments: any[] = [];
    
    // For graphs
    const repsDataMap: Record<string, {name: string, collected: number, remaining: number}> = {};

    const remainingPerClient: Record<string, { name: string, remaining: number, collected: number }> = {};
    let maxRemainingPlan = { amount: 0, client: '' };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const checkIsThisWeek = (d: Date) => d >= startOfWeek && d <= endOfWeek;
    const checkIsThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    validPlans.forEach(plan => {
      totalProjectsValue += (plan.totalAmount || 0);
      let planCollected = 0;
      let planRemaining = 0;
      const cName = plan.clientName || 'غير محدد';
      const rName = plan.creatorName || plan.createdBy || 'غير محدد';

      if (!repsDataMap[rName]) repsDataMap[rName] = { name: rName, collected: 0, remaining: 0 };

      if (plan.phases) {
        plan.phases.forEach((p:any) => {
          const pAmount = p.amount || 0;
          if (p.status === 'تم التحصيل' || p.status === 'مدفوعة' || p.status === 'تم التحصيل متأخر') {
            planCollected += pAmount;
            
            // Collect latest payments
            const pDate = p.collectedDate || p.dueDate || p.date;
            if (pDate) {
              latestPayments.push({
                 clientName: cName,
                 amount: pAmount,
                 date: new Date(pDate).getTime(),
                 projectName: plan.projectName || 'غير محدد'
              });
            }
          } else {
            planRemaining += pAmount;
            
            const isCollected = p.status.includes('تم التحصيل') || p.status.includes('مدفوعة') || p.status.includes('تم التحصيل متأخر');
            const isPastDue = new Date(p.dueDate || p.date || new Date()) < new Date();
            if (p.status === 'متأخر' || p.status === 'استحقاق متأخر' || (!isCollected && isPastDue)) {
              totalDelayed += pAmount;
              delayedClients.add(cName);
            }
            
            const dueDateObj = new Date(p.dueDate || p.date || new Date());
            if (checkIsThisWeek(dueDateObj)) dueThisWeekCount++;
            if (checkIsThisMonth(dueDateObj)) dueThisMonthCount++;
          }
        });
      }
      
      totalCollected += planCollected;
      repsDataMap[rName].collected += planCollected;
      repsDataMap[rName].remaining += planRemaining;
      
      if (!remainingPerClient[cName]) remainingPerClient[cName] = { name: cName, remaining: 0, collected: 0 };
      remainingPerClient[cName].remaining += planRemaining;
      remainingPerClient[cName].collected += planCollected;

      if (planRemaining > maxRemainingPlan.amount) {
        maxRemainingPlan = { amount: planRemaining, client: cName };
      }
    });

    const totalRemaining = totalProjectsValue - totalCollected;
    const collectionPercentage = totalProjectsValue > 0 ? (totalCollected / totalProjectsValue) * 100 : 0;
    
    const top5Debtors = Object.values(remainingPerClient)
      .sort((a,b) => b.remaining - a.remaining)
      .slice(0, 5);
      
    // Sort latest payments descending by date 
    latestPayments.sort((a,b) => b.date - a.date);
    const topLatestPayments = latestPayments.slice(0, 5);

    const repsGraphData = Object.values(repsDataMap).sort((a,b) => (b.collected + b.remaining) - (a.collected + a.remaining));

    return {
      totalProjectsValue,
      totalCollected,
      totalRemaining,
      totalDelayed,
      delayedClientsCount: delayedClients.size,
      dueThisWeekCount,
      dueThisMonthCount,
      collectionPercentage,
      maxRemainingPlan,
      top5Debtors,
      topLatestPayments,
      repsGraphData
    };
  }, [collections, dateFrom, dateTo]);

  const specificClientCollections = useMemo(() => {
    if (selectedReport !== 'collections_report' || collectionReportType !== 'specific' || !selectedClientId) return [];
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return [];

    let plans = collections.filter(p => {
      const pClientName = (p.clientName || '').trim().toLowerCase();
      const targetClientName1 = ((client.clientName || client.name) || '').trim().toLowerCase();
      const targetClientName2 = (client.name || '').trim().toLowerCase();
      const targetClientName3 = (client.clientName || '').trim().toLowerCase();
      return (p.clientId && p.clientId === client.id) || 
             (pClientName && (pClientName === targetClientName1 || pClientName === targetClientName2 || pClientName === targetClientName3));
    });
    
    if (dateFrom || dateTo) {
      plans = plans.filter(p => {
        const d = new Date(p.createdAt || p.dateCreated || p.timestamp || new Date().toISOString());
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;
        return true;
      });
    }

    return plans.map(plan => {
      let planCollected = 0;
      let planTotal = plan.totalAmount || 0;
      let lastPaymentDate = null;
      let lastPaymentAmount = 0;

      if (plan.phases) {
        plan.phases.forEach((p:any) => {
          if (p.status === 'تم التحصيل' || p.status === 'مدفوعة' || p.status === 'تم التحصيل متأخر') {
            planCollected += (p.amount || 0);
            const pDate = new Date(p.collectedDate || p.dueDate || p.date || new Date().toISOString());
            if (!lastPaymentDate || pDate > lastPaymentDate) {
              lastPaymentDate = pDate;
              lastPaymentAmount = p.amount;
            }
          }
        });
      }

      return {
        ...plan,
        projectName: plan.projectName || 'غير محدد',
        totalAmount: planTotal,
        totalCollected: planCollected,
        remaining: planTotal - planCollected,
        collectionPercentage: planTotal > 0 ? (planCollected / planTotal) * 100 : 0,
        paymentStatusDesc: plan.status || (planCollected === planTotal ? 'مكتمل الدفع' : 'قيد التحصيل'),
        lastPaymentAmount,
        lastPaymentDate
      };
    });
  }, [clients, collections, selectedReport, collectionReportType, selectedClientId, dateFrom, dateTo]);

  // ---------------- Computations for Delayed Payments ----------------
  const overduePayments = useMemo(() => {
    if (selectedReport !== 'collections_report' || collectionReportType !== 'delayed') return [];
    const overdueList: any[] = [];
    
    collections.forEach(plan => {
      if (plan.phases) {
        plan.phases.forEach((p:any) => {
           const isCollected = p.status.includes('تم التحصيل') || p.status.includes('مدفوعة') || p.status.includes('تم التحصيل متأخر');
           const isPastDue = new Date(p.dueDate) < new Date();
           if (p.status === 'متأخر' || p.status === 'استحقاق متأخر' || (!isCollected && isPastDue)) {
             const dueDate = new Date(p.dueDate);
             const now = new Date();
             const diffTime = Math.abs(now.getTime() - dueDate.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             
             overdueList.push({
               clientName: plan.clientName,
               projectName: plan.projectName,
               repName: plan.creatorName || plan.createdBy || 'غير محدد',
               dueDate: p.dueDate,
               daysOverdue: diffDays,
               amount: p.amount
             });
           }
        });
      }
    });

    if (dateFrom || dateTo) {
      return overdueList.filter(o => {
        const d = new Date(o.dueDate);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;
        return true;
      });
    }

    return overdueList.sort((a,b) => b.daysOverdue - a.daysOverdue);
  }, [collections, selectedReport, collectionReportType, dateFrom, dateTo]);

  // ---------------- Computations for Sales Reps ----------------
  const repList = useMemo(() => {
    const reps = new Set<string>();
    quotations.forEach(q => { if (q.createdBy) reps.add(q.createdBy); });
    collections.forEach(c => { if (c.creatorName) reps.add(c.creatorName); });
    return Array.from(reps);
  }, [quotations, collections]);

  const salesRepsStats = useMemo(() => {
    const stats: Record<string, any> = {};

    repList.forEach(rep => {
      const qLinked = quotations.filter(q => q.createdBy === rep);
      const cLinked = collections.filter(c => c.creatorName === rep || c.createdBy === rep);

      const clientsLinked = new Set<string>();
      qLinked.forEach(q => clientsLinked.add(q.clientId));

      let totalQuotesValue = 0;
      let totalApprovedValue = 0;
      let approvedCount = 0;

      qLinked.forEach(q => {
         let sub = q.items?.reduce((s:any, i:any) => s + ((i.quantity || 1) * (i.unitPrice || i.price || 0)), 0) || 0;
         const val = (sub + (q.installationFees || 0)) * (1 + (q.vatRate !== undefined ? q.vatRate : 0.15));
         totalQuotesValue += val;

         if (q.status === 'Approved' || q.status === 'معتمد') {
           approvedCount++;
           totalApprovedValue += val;
         }
      });

      let totalCollectionLinked = 0;
      cLinked.forEach(plan => {
         if (plan.phases) {
           plan.phases.forEach((p:any) => {
             if (p.status === 'تم التحصيل' || p.status === 'مدفوعة' || p.status === 'تم التحصيل متأخر') {
               totalCollectionLinked += p.amount || 0;
             }
           });
         }
      });

      stats[rep] = {
        name: rep,
        clientsCount: clientsLinked.size,
        quotesCount: qLinked.length,
        approvedCount,
        totalQuotesValue,
        totalApprovedValue,
        totalCollectionLinked,
        conversionRate: qLinked.length > 0 ? (approvedCount / qLinked.length) * 100 : 0,
        averageQuoteValue: qLinked.length > 0 ? totalQuotesValue / qLinked.length : 0
      };
    });

    return stats;
  }, [repList, quotations, collections]);

  const bestRepByQuotesValue = Object.values(salesRepsStats).sort((a,b) => b.totalQuotesValue - a.totalQuotesValue)[0];
  const bestRepByApprovedQuotes = Object.values(salesRepsStats).sort((a,b) => b.approvedCount - a.approvedCount)[0];
  const bestRepByCollection = Object.values(salesRepsStats).sort((a,b) => b.totalCollectionLinked - a.totalCollectionLinked)[0];
  const leastActiveRep = Object.values(salesRepsStats).sort((a,b) => a.quotesCount - b.quotesCount)[0];

  // Handle Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let contentHtml = '';

    if (selectedReport === 'clients_report') {
      if (clientReportType === 'comprehensive' && comprehensiveStats) {
        contentHtml = `
          <div class="print-title">التقرير الشامل للعملاء</div>
          <div class="grid-layout">
            <div class="stat-box"><strong>إجمالي العملاء في النظام:</strong> ${comprehensiveStats.totalClients}</div>
             <div class="stat-box"><strong>العملاء بدون عروض أسعار:</strong> ${comprehensiveStats.clientsWithoutQuotes}</div>
          </div>
          
          <div class="section-title">تصنيف العملاء الحالي</div>
          <div class="grid-layout">
             <div class="stat-box"><strong>عميل نشط:</strong> ${comprehensiveStats.classifiers.active}</div>
             <div class="stat-box"><strong>عميل راكد:</strong> ${comprehensiveStats.classifiers.dormant}</div>
             <div class="stat-box"><strong>عميل منسي:</strong> ${comprehensiveStats.classifiers.forgotten}</div>
             <div class="stat-box"><strong>عميل قديم:</strong> ${comprehensiveStats.classifiers.old}</div>
          </div>
          
          <div class="section-title">العملاء الجدد في آخر 3 شهور</div>
          <ul class="clean-list">
            ${comprehensiveStats.newClients3Months.map((c:any) => `<li>العميل: ${c.name} - أُضيف في: ${c.date}</li>`).join('')}
            ${comprehensiveStats.newClients3Months.length === 0 ? '<li>لا يوجد عملاء جدد</li>' : ''}
          </ul>

          <div class="section-title">أكثر 3 عملاء بناءً على الطلبات المعتمدة (عددياً)</div>
          <ul class="clean-list">
             ${comprehensiveStats.top3ByCount.map(c => `<li>${c.name} - ${c.count} طلب معتمد</li>`).join('')}
             ${comprehensiveStats.top3ByCount.length === 0 ? '<li>لا يوجد طلبات</li>' : ''}
          </ul>

          <div class="section-title">أكثر 3 عملاء بناءً على الطلبات المعتمدة (قيمة التحصيلات)</div>
          <ul class="clean-list">
             ${comprehensiveStats.top3ByValue.map(c => `<li>${c.name} - ${c.value.toLocaleString()} ريال</li>`).join('')}
             ${comprehensiveStats.top3ByValue.length === 0 ? '<li>لا يوجد تحصيلات</li>' : ''}
          </ul>
        `;
      } else if (clientReportType === 'specific' && specificClientStats) {
         const { client, quotesCount, totalQuotesValue, totalApprovedValue, totalPaid, totalRemaining, lastInteractionDate, top3Reps } = specificClientStats;
         const cName = client.clientName || client.name;
         contentHtml = `
          <div class="print-title">تقرير مفصل للعميل: ${cName}</div>
          <div class="section-title">بيانات العميل</div>
          <table class="data-table">
            <tr><th>اسم العميل</th><td>${cName}</td><th>اسم الشركة</th><td>${client.companyName || '-'}</td></tr>
            <tr><th>رقم الجوال</th><td>${client.mobile}</td><th>المدينة</th><td>${client.city || '-'}</td></tr>
            <tr><th>السجل التجاري</th><td>${client.crNumber || '-'}</td><th>الرقم الضريبي</th><td>${client.taxNumber || '-'}</td></tr>
          </table>

          <div class="section-title">الإحصائيات المالية والبيعية</div>
          <table class="data-table">
             <tr><th>عدد عروض الأسعار</th><td>${quotesCount} عرض</td><th>إجمالي قيمة العروض</th><td>${totalQuotesValue.toLocaleString()} ريال</td></tr>
             <tr><th>إجمالي المعتمد</th><td>${totalApprovedValue.toLocaleString()} ريال</td><th>إجمالي المدفوع</th><td>${totalPaid.toLocaleString()} ريال</td></tr>
             <tr><th>إجمالي المتبقي</th><td>${totalRemaining.toLocaleString()} ريال</td><th>آخر تعامل</th><td>${lastInteractionDate ? lastInteractionDate.toLocaleDateString('en-GB') : 'لا يوجد تعاملات'}</td></tr>
          </table>

          <div class="section-title">أكثر المناديب تعاملاً وأعدوا له عروضًا</div>
          <ul class="clean-list">
            ${top3Reps.map(r => `<li>المندوب: ${r.name} - أعدّ (${r.count}) عرض سعر</li>`).join('')}
            ${top3Reps.length === 0 ? '<li>لا يوجد تعاملات مسجلة</li>' : ''}
          </ul>
         `;
      }
    } else if (selectedReport === 'collections_report') {
      if (collectionReportType === 'comprehensive' && collectionsComprehensiveStats) {
        contentHtml = `
          <div class="print-title">التقرير الشامل للتحصيل</div>
          <div class="grid-layout">
             <div class="stat-box"><strong>إجمالي قيمة المعتمد:</strong> ${collectionsComprehensiveStats.totalProjectsValue.toLocaleString()} ريال</div>
             <div class="stat-box"><strong>المحصل:</strong> ${collectionsComprehensiveStats.totalCollected.toLocaleString()} ريال</div>
             <div class="stat-box"><strong>المتبقي:</strong> ${collectionsComprehensiveStats.totalRemaining.toLocaleString()} ريال</div>
             <div class="stat-box"><strong>المتأخر:</strong> ${collectionsComprehensiveStats.totalDelayed.toLocaleString()} ريال</div>
          </div>

          <div class="grid-layout">
             <div class="stat-box"><strong>نسبة التحصيل العامة:</strong> ${collectionsComprehensiveStats.collectionPercentage.toFixed(1)}%</div>
             <div class="stat-box"><strong>عدد العملاء المتأخرين:</strong> ${collectionsComprehensiveStats.delayedClientsCount}</div>
             <div class="stat-box"><strong>دفعات هذا الأسبوع:</strong> ${collectionsComprehensiveStats.dueThisWeekCount}</div>
             <div class="stat-box"><strong>دفعات هذا الشهر:</strong> ${collectionsComprehensiveStats.dueThisMonthCount}</div>
          </div>
          
          <div class="section-title">أعلى 5 مديونيات</div>
          <ul class="clean-list">
             ${collectionsComprehensiveStats.top5Debtors.map(c => `<li>${c.name} - ${c.remaining.toLocaleString()} ريال</li>`).join('')}
             ${collectionsComprehensiveStats.top5Debtors.length === 0 ? '<li>لا يوجد مديونيات</li>' : ''}
          </ul>

          <div class="section-title">آخر دفعات مسجلة</div>
          <ul class="clean-list">
             ${collectionsComprehensiveStats.topLatestPayments.map(p => `<li>${p.clientName} - +${p.amount.toLocaleString()} ريال - ${new Date(p.date).toLocaleDateString('en-GB')}</li>`).join('')}
             ${collectionsComprehensiveStats.topLatestPayments.length === 0 ? '<li>لا يوجد دفعات مسجلة</li>' : ''}
          </ul>
        `;
      } else if (collectionReportType === 'specific' && specificClientCollections) {
         const cName = selectedClientId ? (clients.find(c => c.id === selectedClientId)?.clientName || clients.find(c => c.id === selectedClientId)?.name) : '';
         contentHtml = `
          <div class="print-title">تقرير تفاصيل التحصيل للعميل: ${cName}</div>
          ${specificClientCollections.map(plan => `
            <div class="section-title">المشروع: ${plan.projectName} - حالة الدفع: ${plan.paymentStatusDesc} (${plan.collectionPercentage.toFixed(1)}%)</div>
            <table class="data-table">
               <tr><th>قيمة المشروع</th><td>${plan.totalAmount.toLocaleString()} ريال</td><th>المدفوع</th><td>${plan.totalCollected.toLocaleString()} ريال</td></tr>
               <tr><th>المتبقي</th><td>${plan.remaining.toLocaleString()} ريال</td><th>تاريخ آخر دفعة</th><td>${plan.lastPaymentDate ? new Date(plan.lastPaymentDate).toLocaleDateString('en-GB') : '-'}</td></tr>
            </table>
          `).join('')}
          ${specificClientCollections.length === 0 ? '<p>لا يوجد مشاريع مسجلة.</p>' : ''}
         `;
      } else if (collectionReportType === 'delayed' && overduePayments) {
         contentHtml = `
          <div class="print-title">تقرير الدفعات المتأخرة</div>
          <div class="grid-layout">
             <div class="stat-box"><strong>إجمالي الدفعات المتأخرة المستحقة:</strong> ${overduePayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} ريال</div>
             <div class="stat-box"><strong>عدد الدفعات المتأخرة:</strong> ${overduePayments.length}</div>
          </div>
          <table class="data-table" style="margin-top: 20px;">
             <thead>
               <tr><th>المشروع / العميل</th><th>المندوب</th><th>قيمة الدفعة</th><th>تاريخ الاستحقاق</th><th>المدة المتأخرة</th></tr>
             </thead>
             <tbody>
               ${overduePayments.map(p => `
                 <tr>
                   <td><strong>${p.projectName}</strong><br><small style="color:#64748b;">${p.clientName}</small></td>
                   <td>${p.repName}</td>
                   <td style="color:#dc2626; font-weight:bold;">${p.amount.toLocaleString()} ريال</td>
                   <td>${new Date(p.dueDate).toLocaleDateString('en-GB')}</td>
                   <td><span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-size:12px;">${p.daysOverdue} يوم</span></td>
                 </tr>
               `).join('')}
               ${overduePayments.length === 0 ? '<tr><td colspan="5" style="text-align:center;">لا يوجد دفعات متأخرة حالياً</td></tr>' : ''}
             </tbody>
          </table>
         `;
      }
    } else {
        contentHtml = `<div class="print-title">التقرير المحدد غير متاح للطباعة حالياً</div>`;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>طباعة التقرير</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
          @page { size: A4; }
          body { font-family: 'Tajawal', sans-serif !important; background: white; margin: 0; padding: 20px; color: #1e293b; font-size: 14px; line-height: 1.6; display: flex; flex-direction: column; min-height: 100vh;}
          
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0072BC; padding-bottom: 15px; margin-bottom: 25px; }
          .header-logo { width: 80px; object-fit: contain; }
          .header-text { text-align: right; display: flex; flex-direction: column; justify-content: center;}
          .header-text h2 { font-size: 20px; font-weight: 900; color: #374151; margin: 0; }
          .header-text h3 { font-size: 10px; font-weight: bold; color: #6b7280; margin-top: 3px; letter-spacing: 0.1em; }
          .footer { margin-top: auto; border-top: 2px solid #0072BC; padding-top: 15px; display: flex; justify-content: space-between; font-size: 10px; color: #4b5563; align-items: flex-start; }
          
          .print-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 30px; color: #0072BC; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px;}
          .section-title { font-size: 18px; font-weight: bold; color: #334155; margin-top: 30px; margin-bottom: 15px; background: #f1f5f9; padding: 10px 15px; border-right: 4px solid #0072BC; border-radius: 4px;}
          .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;}
          .stat-box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #fafafa;}
          .clean-list { list-style: none; padding: 0; margin: 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fafafa;}
          .clean-list li { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
          .clean-list li:last-child { border-bottom: none; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; }
          .data-table th { background: #f1f5f9; width: 25%; color: #475569; font-weight: bold; }
        </style>
      </head>
      <body>
          <div class="header">
            <div class="header-text">
              <h2>شركة فنون الوليد للصناعة</h2>
              <h3 style="font-family: sans-serif;">FONOUN ALWALEED INDUSTRIAL CO.</h3>
            </div>
            <img src="https://i.postimg.cc/HHxYjFfT/Alwaleed-Logo-Vertical-Blue.png" alt="Company Logo" class="header-logo" />
          </div>

         <div style="flex: 1;">
           ${contentHtml}
         </div>

          <div class="footer">
            <div>
              <strong>العنوان:</strong> المدينة الصناعية، الرياض، المملكة العربية السعودية<br/>
              <strong>الرقم الضريبي:</strong> 311029279500003
            </div>
            <div style="text-align: left;" dir="ltr">
              <strong>Email:</strong> info@fawalweed.com<br/>
              <strong>Website:</strong> www.fawalweed.com
            </div>
          </div>
         <script>
            window.onload = function() {
              setTimeout(function(){ window.print(); }, 800);
            }
         </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredClientsForSearch = useMemo(() => {
    if (!clientSearchQuery) return clients.slice(0, 5);
    return clients.filter(c => 
      ((c.clientName || c.name) || '').includes(clientSearchQuery) || 
      (c.mobile || '').includes(clientSearchQuery)
    ).slice(0, 5);
  }, [clients, clientSearchQuery]);

  const reportTypes = [
    { id: 'clients_report', name: 'تقرير العملاء' },
    { id: 'collections_report', name: 'تقرير التحصيل' },
    { id: 'sales_by_rep_report', name: 'تقرير المبيعات حسب المندوب' }
  ];

  if (loading) {
     return <div className="p-10 text-center text-slate-500">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-[calc(100vh-100px)]" dir="rtl">
       <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div>
               <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                 <FileBarChart className="w-6 h-6 text-indigo-600" />
                 مركز التقارير المتقدمة
               </h1>
               <p className="text-sm text-slate-500 mt-1">عرض وتحليل وتصدير تقارير النظام الاستراتيجية</p>
             </div>
             <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
               <Printer className="w-5 h-5" />
               تصدير للطباعة
             </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">نوع التقرير</label>
                <select 
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {reportTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-bold text-slate-700 mb-2">من تاريخ</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                     <input 
                       type="date"
                       value={dateFrom}
                       onChange={e => setDateFrom(e.target.value)}
                       className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                     />
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-bold text-slate-700 mb-2">إلى تاريخ</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                     <input 
                       type="date"
                       value={dateTo}
                       onChange={e => setDateTo(e.target.value)}
                       className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                     />
                   </div>
                 </div>
              </div>
            </div>

            {selectedReport === 'clients_report' ? (
              <div className="border-t border-slate-100 pt-6 mt-6">
                <div className="flex space-x-reverse space-x-4 mb-6">
                  <button 
                    onClick={() => setClientReportType('comprehensive')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition ${clientReportType === 'comprehensive' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    تقرير شامل للعملاء
                  </button>
                  <button 
                    onClick={() => setClientReportType('specific')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition ${clientReportType === 'specific' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    تقرير مفصل عن عميل محدد
                  </button>
                </div>

                {clientReportType === 'specific' && (
                  <div className="relative mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">ابحث واختر العميل المُراد</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ابحث باسم العميل، الشركة، أو رقم الجوال..."
                        value={clientSearchQuery || ''}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientDropdownOpen(true);
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        className="w-full p-3 pr-10 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    {isClientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto left-0 right-0">
                        {filteredClientsForSearch.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientSearchQuery(c.clientName || c.name || '');
                              setIsClientDropdownOpen(false);
                            }}
                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between"
                          >
                             <div>
                               <div className="font-bold text-slate-800">{c.clientName || c.name}</div>
                               <div className="text-xs text-slate-500 mt-1">{c.companyName || '-'} | {c.mobile}</div>
                             </div>
                             {selectedClientId === c.id && <Check className="w-5 h-5 text-indigo-600" />}
                          </div>
                        ))}
                        {filteredClientsForSearch.length === 0 && (
                          <div className="p-4 text-center text-slate-500">لا يوجد نتائج</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : selectedReport === 'collections_report' ? (
              <div className="border-t border-slate-100 pt-6 mt-6">
                <div className="flex space-x-reverse space-x-4 mb-6">
                  <button 
                    onClick={() => setCollectionReportType('comprehensive')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition ${collectionReportType === 'comprehensive' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    تقرير تحصيل شامل
                  </button>
                  <button 
                    onClick={() => setCollectionReportType('specific')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition ${collectionReportType === 'specific' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    تقرير مفصل لتحصيل مخصص لعميل
                  </button>
                  <button 
                    onClick={() => setCollectionReportType('delayed')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition ${collectionReportType === 'delayed' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    تقرير الدفعات المتأخرة
                  </button>
                </div>

                {collectionReportType === 'specific' && (
                  <div className="relative mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">ابحث واختر العميل المُراد عرض سجلاته المالية</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ابحث باسم العميل، الشركة، أو رقم الجوال..."
                        value={clientSearchQuery || ''}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientDropdownOpen(true);
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        className="w-full p-3 pr-10 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    {isClientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto left-0 right-0">
                        {filteredClientsForSearch.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientSearchQuery(c.clientName || c.name || '');
                              setIsClientDropdownOpen(false);
                            }}
                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between"
                          >
                             <div>
                               <div className="font-bold text-slate-800">{c.clientName || c.name}</div>
                               <div className="text-xs text-slate-500 mt-1">{c.companyName || '-'} | {c.mobile}</div>
                             </div>
                             {selectedClientId === c.id && <Check className="w-5 h-5 text-indigo-600" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : selectedReport === 'sales_by_rep_report' ? (
              <div className="border-t border-slate-100 pt-6 mt-6">
                 <label className="block text-sm font-bold text-slate-700 mb-2">اختر المندوب</label>
                 <select 
                    value={selectedRep}
                    onChange={(e) => setSelectedRep(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 font-medium"
                 >
                    <option value="">-- اختر المندوب --</option>
                    {repList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                 </select>
              </div>
            ) : selectedReport === 'delayed_payments_report' || selectedReport === 'production_sent_report' ? (
               <div className="hidden"></div>
            ) : (
               <div className="text-center py-12 text-slate-500 font-medium border border-dashed border-slate-300 rounded-xl bg-slate-50">
                  <p>التقرير المطلوب غير متاح حالياً. يرجى اختيار تقرير آخر أو الانتظار حتى استكمال برمجة باقي التقارير.</p>
               </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">معاينة النتائج</h2>
             
             {selectedReport === 'clients_report' ? (
                <>
                  {clientReportType === 'comprehensive' && comprehensiveStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                           <div className="text-slate-500 text-sm font-bold mb-1">إجمالي العملاء في النظام (ضمن الفترة)</div>
                           <div className="text-2xl font-black text-slate-800">{comprehensiveStats.totalClients}</div>
                         </div>
                         <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                           <div className="text-slate-500 text-sm font-bold mb-1">العملاء بدون عروض أسعار</div>
                           <div className="text-2xl font-black text-slate-800">{comprehensiveStats.clientsWithoutQuotes}</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                         <div className="bg-emerald-50 text-emerald-800 p-4 border border-emerald-200 rounded-xl text-center">
                           <div className="text-xs font-bold mb-1">عميل نشط</div>
                           <div className="text-xl font-black">{comprehensiveStats.classifiers.active}</div>
                         </div>
                         <div className="bg-blue-50 text-blue-800 p-4 border border-blue-200 rounded-xl text-center">
                           <div className="text-xs font-bold mb-1">عميل راكد</div>
                           <div className="text-xl font-black">{comprehensiveStats.classifiers.dormant}</div>
                         </div>
                         <div className="bg-orange-50 text-orange-800 p-4 border border-orange-200 rounded-xl text-center">
                           <div className="text-xs font-bold mb-1">عميل منسي</div>
                           <div className="text-xl font-black">{comprehensiveStats.classifiers.forgotten}</div>
                         </div>
                         <div className="bg-slate-100 text-slate-700 p-4 border border-slate-200 rounded-xl text-center">
                           <div className="text-xs font-bold mb-1">عميل قديم</div>
                           <div className="text-xl font-black">{comprehensiveStats.classifiers.old}</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                           <div className="bg-slate-50 px-4 py-3 font-bold text-sm text-slate-700 border-b border-slate-200">العملاء الجدد في آخر 3 شهور</div>
                           <div className="p-4 space-y-3">
                             {comprehensiveStats.newClients3Months.map((c:any, idx:number) => (
                               <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-2 last:border-0 last:pb-0">
                                 <span className="text-slate-600 font-medium">{c.name}</span>
                                 <span className="font-bold text-indigo-600">{c.date}</span>
                               </div>
                             ))}
                             {comprehensiveStats.newClients3Months.length === 0 && <span className="text-slate-500 text-sm">لا يوجد عملاء جدد</span>}
                           </div>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                           <div className="bg-slate-50 px-4 py-3 font-bold text-sm text-slate-700 border-b border-slate-200">أكثر 3 عملاء بناءً على الطلبات المعتمدة (عددياً)</div>
                           <div className="p-4 space-y-3">
                             {comprehensiveStats.top3ByCount.map((c, idx) => (
                               <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-2 last:border-0 last:pb-0">
                                 <span className="text-slate-600 font-medium">{c.name}</span>
                                 <span className="font-bold text-emerald-600">{c.count} طلب محقق</span>
                               </div>
                             ))}
                           </div>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden md:col-span-2">
                           <div className="bg-slate-50 px-4 py-3 font-bold text-sm text-slate-700 border-b border-slate-200">أكثر 3 عملاء بناءً على الطلبات المعتمدة (قيمة التحصيلات)</div>
                           <div className="p-4 space-y-3">
                             {comprehensiveStats.top3ByValue.map((c, idx) => (
                               <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-2 last:border-0 last:pb-0">
                                 <span className="text-slate-600 font-medium">{c.name}</span>
                                 <span className="font-bold text-blue-600">{c.value.toLocaleString()} ريال</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientReportType === 'specific' && !selectedClientId && (
                     <div className="text-center py-10 text-slate-400">الرجاء البحث واختيار عميل من القائمة أعلاه لعرض بياناته</div>
                  )}

                  {clientReportType === 'specific' && selectedClientId && specificClientStats && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">اسم العميل</div><div className="font-bold shrink-0 line-clamp-1">{specificClientStats.client.clientName || specificClientStats.client.name}</div></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">اسم الشركة</div><div className="font-bold shrink-0 line-clamp-1">{specificClientStats.client.companyName || '-'}</div></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">رقم الجوال</div><div className="font-bold">{specificClientStats.client.mobile}</div></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">المدينة</div><div className="font-bold">{specificClientStats.client.city || '-'}</div></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">السجل التجاري</div><div className="font-bold">{specificClientStats.client.crNumber || '-'}</div></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 font-bold mb-1">الرقم الضريبي</div><div className="font-bold">{specificClientStats.client.taxNumber || '-'}</div></div>
                        </div>

                        <h3 className="font-bold text-slate-700 mt-6 mb-3">الإحصائيات المالية والبيعية</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="bg-white border border-slate-200 p-4 rounded-xl"><div className="text-xs text-slate-500 font-bold">عروض الأسعار</div><div className="text-lg font-black mt-1 text-slate-800">{specificClientStats.quotesCount}</div></div>
                           <div className="bg-white border text-blue-800 border-blue-200 bg-blue-50 p-4 rounded-xl"><div className="text-xs font-bold">إجمالي قيمة العروض</div><div className="text-lg font-black mt-1">{specificClientStats.totalQuotesValue.toLocaleString()}</div></div>
                           <div className="bg-white border text-emerald-800 border-emerald-200 bg-emerald-50 p-4 rounded-xl"><div className="text-xs font-bold">إجمالي المعتمد</div><div className="text-lg font-black mt-1">{specificClientStats.totalApprovedValue.toLocaleString()}</div></div>
                           <div className="bg-white border text-slate-800 border-slate-200 bg-slate-100 p-4 rounded-xl"><div className="text-xs font-bold">آخر تعامل</div><div className="text-sm font-black mt-1 px-1 py-0.5">{specificClientStats.lastInteractionDate ? specificClientStats.lastInteractionDate.toLocaleDateString('en-GB') : '-'}</div></div>
                           <div className="bg-white border text-teal-800 border-teal-200 bg-teal-50 p-4 rounded-xl"><div className="text-xs font-bold">إجمالي المدفوع</div><div className="text-lg font-black mt-1">{specificClientStats.totalPaid.toLocaleString()}</div></div>
                           <div className="bg-white border text-red-800 border-red-200 bg-red-50 p-4 rounded-xl"><div className="text-xs font-bold">إجمالي المتبقي</div><div className="text-lg font-black mt-1">{specificClientStats.totalRemaining.toLocaleString()}</div></div>
                        </div>

                        <h3 className="font-bold text-slate-700 mt-6 mb-3">أكثر المناديب تعاملاً وأعدوا له عروضًا</h3>
                        <div className="space-y-3">
                           {specificClientStats.top3Reps.map((r, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                                 <span className="font-bold text-slate-800">{r.name}</span>
                                 <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm">{r.count} عرض سعر</span>
                              </div>
                           ))}
                           {specificClientStats.top3Reps.length === 0 && <div className="text-slate-500 text-sm">لا يوجد مناديب مرتبطين بعروض أسعار مع هذا العميل.</div>}
                        </div>
                     </div>
                  )}
                </>
             ) : selectedReport === 'collections_report' ? (
                <>
                  {collectionReportType === 'comprehensive' && collectionsComprehensiveStats && (
                     <div className="space-y-8">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 text-blue-900 border border-blue-200 p-5 rounded-2xl">
                             <div className="text-sm font-bold mb-2">إجمالي المعتمد</div>
                             <div className="text-2xl font-black">{collectionsComprehensiveStats.totalProjectsValue.toLocaleString()} ر.س</div>
                          </div>
                          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-5 rounded-2xl">
                             <div className="text-sm font-bold mb-2">المحصل</div>
                             <div className="text-2xl font-black">{collectionsComprehensiveStats.totalCollected.toLocaleString()} ر.س</div>
                          </div>
                          <div className="bg-orange-50 text-orange-900 border border-orange-200 p-5 rounded-2xl">
                             <div className="text-sm font-bold mb-2">المتبقي</div>
                             <div className="text-2xl font-black">{collectionsComprehensiveStats.totalRemaining.toLocaleString()} ر.س</div>
                          </div>
                          <div className="bg-red-50 text-red-900 border border-red-200 p-5 rounded-2xl">
                             <div className="text-sm font-bold mb-2">المتأخر</div>
                             <div className="text-2xl font-black">{collectionsComprehensiveStats.totalDelayed.toLocaleString()} ر.س</div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 text-slate-800 p-4 border border-slate-200 rounded-xl">
                             <div className="text-xs font-bold mb-1">نسبة التحصيل العامة</div>
                             <div className="text-xl font-black text-indigo-600">{collectionsComprehensiveStats.collectionPercentage.toFixed(1)}%</div>
                          </div>
                          <div className="bg-slate-50 text-slate-800 p-4 border border-slate-200 rounded-xl">
                             <div className="text-xs font-bold mb-1">عدد العملاء المتأخرين</div>
                             <div className="text-xl font-black text-red-600">{collectionsComprehensiveStats.delayedClientsCount}</div>
                          </div>
                          <div className="bg-slate-50 text-slate-800 p-4 border border-slate-200 rounded-xl">
                             <div className="text-xs font-bold mb-1">دفعات مستحقة (هذا الأسبوع)</div>
                             <div className="text-xl font-black">{collectionsComprehensiveStats.dueThisWeekCount}</div>
                          </div>
                          <div className="bg-slate-50 text-slate-800 p-4 border border-slate-200 rounded-xl">
                             <div className="text-xs font-bold mb-1">دفعات مستحقة (هذا الشهر)</div>
                             <div className="text-xl font-black">{collectionsComprehensiveStats.dueThisMonthCount}</div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Top Debtors List */}
                          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
                             <h3 className="font-bold text-slate-800 mb-4 border-r-4 border-orange-500 pr-3">أعلى 5 عملاء عليهم مبالغ متبقية</h3>
                             <div className="space-y-3">
                                {collectionsComprehensiveStats.top5Debtors.map((c, idx) => (
                                   <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <div className="font-bold text-slate-700">{c.name}</div>
                                      <div className="font-black text-orange-600">{c.remaining.toLocaleString()} ر.س</div>
                                   </div>
                                ))}
                                {collectionsComprehensiveStats.top5Debtors.length === 0 && <div className="text-sm text-slate-500">لا يوجد مديونيات.</div>}
                             </div>
                          </div>

                          {/* Latest Payments */}
                          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
                             <h3 className="font-bold text-slate-800 mb-4 border-r-4 border-emerald-500 pr-3">آخر دفعات تم تسجيلها</h3>
                             <div className="space-y-3">
                                {collectionsComprehensiveStats.topLatestPayments.map((p, idx) => (
                                   <div key={idx} className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                      <div>
                                         <div className="font-bold text-emerald-900">{p.clientName}</div>
                                         <div className="text-xs text-emerald-700">{p.projectName} - {new Date(p.date).toLocaleDateString('en-GB')}</div>
                                      </div>
                                      <div className="font-black text-emerald-700">+{p.amount.toLocaleString()} ر.س</div>
                                   </div>
                                ))}
                                {collectionsComprehensiveStats.topLatestPayments.length === 0 && <div className="text-sm text-slate-500">لا يوجد تحصيلات مسجلة.</div>}
                             </div>
                          </div>
                       </div>

                       {/* Detailed Charts */}
                       <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm overflow-hidden">
                          <h3 className="font-bold text-slate-800 mb-6 border-r-4 border-indigo-600 pr-3">تحليل أداء التحصيل للمناديب</h3>
                          <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                   data={collectionsComprehensiveStats.repsGraphData}
                                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${value.toLocaleString()}`} />
                                   <RechartsTooltip 
                                      cursor={{ fill: '#F8FAFC' }}
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                      formatter={(value: number) => [`${value.toLocaleString()} ر.س`]}
                                   />
                                   <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                   <Bar dataKey="collected" name="المحصل" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                                   <Bar dataKey="remaining" name="المتبقي" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                </BarChart>
                             </ResponsiveContainer>
                          </div>
                       </div>

                     </div>
                  )}

                  {collectionReportType === 'specific' && !selectedClientId && (
                     <div className="text-center py-10 text-slate-400">الرجاء البحث واختيار عميل من القائمة لعرض سجلاته</div>
                  )}

                  {collectionReportType === 'specific' && selectedClientId && specificClientCollections && (
                     <div className="space-y-6">
                        <h3 className="font-bold text-slate-800">تفاصيل التحصيل لمشاريع العميل</h3>
                        <div className="space-y-4">
                           {specificClientCollections.map((plan, idx) => (
                              <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                                 <div className="flex justify-between items-start mb-4">
                                    <div>
                                       <h4 className="font-black text-slate-800 text-lg">{plan.projectName}</h4>
                                       <div className="text-sm text-slate-500 mt-1">حالة الدفع: <span className="font-bold text-indigo-600">{plan.paymentStatusDesc}</span></div>
                                    </div>
                                    <div className="text-left">
                                       <div className="text-xs text-slate-500 font-bold">نسبة التحصيل</div>
                                       <div className="text-xl font-black text-emerald-600">{plan.collectionPercentage.toFixed(1)}%</div>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-white p-3 rounded-lg border border-slate-200"><div className="text-xs text-slate-500 font-bold">قيمة العرض/المشروع</div><div className="font-bold mt-1 text-slate-800">{plan.totalAmount.toLocaleString()} ر.س</div></div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200"><div className="text-xs text-slate-500 font-bold">إجمالي المدفوع</div><div className="font-bold mt-1 text-emerald-600">{plan.totalCollected.toLocaleString()} ر.س</div></div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200"><div className="text-xs text-slate-500 font-bold">المتبقي</div><div className="font-bold mt-1 text-red-600">{plan.remaining.toLocaleString()} ر.س</div></div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200"><div className="text-xs text-slate-500 font-bold">تاريخ الدفعة الأخيرة</div><div className="font-bold mt-1 text-slate-700">{plan.lastPaymentDate ? new Date(plan.lastPaymentDate).toLocaleDateString('en-GB') : '-'}</div></div>
                                 </div>
                              </div>
                           ))}
                           {specificClientCollections.length === 0 && <div className="text-slate-500 text-center py-6">لا يوجد أي مشاريع أو خطط تحصيل مسجلة للعميل.</div>}
                        </div>
                     </div>
                  )}

                  {collectionReportType === 'delayed' && (
                     <div className="space-y-6">
                       <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200 flex justify-between items-center">
                         <div>
                           <div className="text-sm font-bold mb-1">إجمالي الدفعات المتأخرة المستحقة</div>
                           <div className="text-3xl font-black">{overduePayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} ر.س</div>
                         </div>
                         <div className="text-left">
                           <div className="text-sm font-bold mb-1">عدد الدفعات</div>
                           <div className="text-3xl font-black">{overduePayments.length}</div>
                         </div>
                       </div>
                       
                       <h3 className="font-bold text-slate-800">تفاصيل الدفعات المتأخرة</h3>
                       <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-sm text-right">
                             <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                               <tr>
                                 <th className="px-4 py-3">المشروع / العميل</th>
                                 <th className="px-4 py-3">المندوب</th>
                                 <th className="px-4 py-3">قيمة الدفعة</th>
                                 <th className="px-4 py-3">تاريخ الاستحقاق</th>
                                 <th className="px-4 py-3">المدة المتأخرة</th>
                               </tr>
                             </thead>
                             <tbody>
                               {overduePayments.map((p, idx) => (
                                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                       <div className="font-bold text-slate-800">{p.projectName}</div>
                                       <div className="text-xs text-slate-500">{p.clientName}</div>
                                    </td>
                                    <td className="px-4 py-3">{p.repName}</td>
                                    <td className="px-4 py-3 font-bold text-red-600">{p.amount.toLocaleString()} ر.س</td>
                                    <td className="px-4 py-3">{new Date(p.dueDate).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">{p.daysOverdue} يوم</span></td>
                                  </tr>
                               ))}
                               {overduePayments.length === 0 && (
                                  <tr>
                                     <td colSpan={5} className="text-center py-6 text-slate-500">لا يوجد دفعات متأخرة حالياً</td>
                                  </tr>
                               )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}
                </>
             ) : selectedReport === 'sales_by_rep_report' ? (
                <div className="space-y-6">
                   {!selectedRep ? (
                      <div className="text-slate-500 text-center py-6">اختر المندوب من القائمة أعلاه لعرض بياناته</div>
                   ) : (
                      salesRepsStats[selectedRep] && (
                         <div className="space-y-6">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span>{salesRepsStats[selectedRep].name}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                               <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                  <div className="text-xs font-bold text-slate-500 mb-1">العملاء المضافين/المرتبطين</div>
                                  <div className="text-xl font-black text-slate-800">{salesRepsStats[selectedRep].clientsCount}</div>
                               </div>
                               <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                  <div className="text-xs font-bold text-slate-500 mb-1">عروض الأسعار</div>
                                  <div className="text-xl font-black text-slate-800">{salesRepsStats[selectedRep].quotesCount}</div>
                               </div>
                               <div className="bg-emerald-50 p-4 border border-emerald-200 rounded-xl">
                                  <div className="text-xs font-bold text-emerald-800 mb-1">العروض المعتمدة</div>
                                  <div className="text-xl font-black text-emerald-900">{salesRepsStats[selectedRep].approvedCount}</div>
                               </div>
                               <div className="bg-indigo-50 p-4 border border-indigo-200 rounded-xl">
                                  <div className="text-xs font-bold text-indigo-800 mb-1">نسبة تحويل العروض</div>
                                  <div className="text-xl font-black text-indigo-900">{salesRepsStats[selectedRep].conversionRate.toFixed(1)}%</div>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="bg-white p-5 border border-slate-200 rounded-xl text-center shadow-sm">
                                  <div className="text-sm font-bold text-slate-500 mb-2">إجمالي قيمة العروض</div>
                                  <div className="text-2xl font-black text-blue-600">{salesRepsStats[selectedRep].totalQuotesValue.toLocaleString()}</div>
                               </div>
                               <div className="bg-white p-5 border border-slate-200 rounded-xl text-center shadow-sm">
                                  <div className="text-sm font-bold text-slate-500 mb-2">إجمالي المعتمد</div>
                                  <div className="text-2xl font-black text-emerald-600">{salesRepsStats[selectedRep].totalApprovedValue.toLocaleString()}</div>
                               </div>
                               <div className="bg-white p-5 border border-slate-200 rounded-xl text-center shadow-sm">
                                  <div className="text-sm font-bold text-slate-500 mb-2">التحصيل المرتبط</div>
                                  <div className="text-2xl font-black text-indigo-600">{salesRepsStats[selectedRep].totalCollectionLinked.toLocaleString()}</div>
                               </div>
                            </div>
                         </div>
                      )
                   )}
                   
                   <div className="border-t border-slate-100 pt-6 mt-8">
                     <h3 className="font-bold text-slate-800 mb-4 border-r-4 border-indigo-600 pr-3">مؤشرات أداء المناديب العامة</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                           <div className="text-xs text-slate-500 font-bold mb-1">الأفضل (قيمة العروض)</div>
                           <div className="font-black text-slate-800">{bestRepByQuotesValue?.name || '-'}</div>
                           <div className="text-xs mt-1 text-slate-500">{bestRepByQuotesValue?.totalQuotesValue?.toLocaleString() || 0} ر.س</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                           <div className="text-xs text-slate-500 font-bold mb-1">الأفضل (العروض المعتمدة)</div>
                           <div className="font-black text-slate-800">{bestRepByApprovedQuotes?.name || '-'}</div>
                           <div className="text-xs mt-1 text-slate-500">{bestRepByApprovedQuotes?.approvedCount || 0} عروض</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                           <div className="text-xs text-slate-500 font-bold mb-1">الأفضل (التحصيل)</div>
                           <div className="font-black text-slate-800">{bestRepByCollection?.name || '-'}</div>
                           <div className="text-xs mt-1 text-slate-500">{bestRepByCollection?.totalCollectionLinked?.toLocaleString() || 0} ر.س</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                           <div className="text-xs text-slate-500 font-bold mb-1">الأقل نشاطاً (بناءً على العروض)</div>
                           <div className="font-black text-slate-800">{leastActiveRep?.name || '-'}</div>
                           <div className="text-xs mt-1 text-slate-500">{leastActiveRep?.quotesCount || 0} عروض</div>
                        </div>
                     </div>
                   </div>
                </div>
             ) : (
                <div className="text-center py-6 text-slate-500">اختر تقرير العملاء لرؤية المعاينة</div>
             )}
          </div>

       </div>
    </div>
  );
}
