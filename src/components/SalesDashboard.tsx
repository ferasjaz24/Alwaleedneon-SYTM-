import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  CheckCircle2,
  Factory,
  DollarSign,
  AlertCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus,
  FileSpreadsheet,
  ShieldAlert,
  Zap,
  Layers,
  RefreshCw,
} from "lucide-react";
import { getAdvancedPermissionScope } from "../lib/permissions";

interface SalesDashboardProps {
  lang: "ar" | "en";
  user: any;
  setActiveSubTab: (tab: string) => void;
}

export default function SalesDashboard({
  lang,
  user,
  setActiveSubTab,
}: SalesDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [productionRequests, setProductionRequests] = useState<any[]>([]);
  const [lettersLogs, setLettersLogs] = useState<any[]>([]);

  // Selected Month & Year Filter
  const currentYear = new Date().getFullYear(); // 2026
  const currentMonth = new Date().getMonth(); // 5 = June
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const monthsArabic = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const monthsEnglish = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Fetch all database records
  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [resClients, resQuotes, resCollections, resReqs, resLetterLogs] =
        await Promise.all([
          fetch(`/api/clients?t=${ts}`),
          fetch(`/api/sales_quotations?t=${ts}`),
          fetch(`/api/dynamic/financial_collections?t=${ts}`),
          fetch(`/api/dynamic/sales_production_requests?t=${ts}`),
          fetch(`/api/dynamic/sales_letters_logs?t=${ts}`).catch(() => null),
        ]);

      let clientsData =
        resClients && resClients.ok ? await resClients.json() : [];
      let quotesData = resQuotes && resQuotes.ok ? await resQuotes.json() : [];
      let collectionsData =
        resCollections && resCollections.ok ? await resCollections.json() : [];
      let reqsData = resReqs && resReqs.ok ? await resReqs.json() : [];
      let letterLogsData =
        resLetterLogs && resLetterLogs.ok ? await resLetterLogs.json() : [];

      // Apply advanced scope checks for each sub-module
      const clientsScope = getAdvancedPermissionScope(user, 'sales', 'clients', 'view_clients');
      if (clientsScope === 'own') {
        clientsData = clientsData.filter((c: any) => c.createdBy?.toLowerCase() === user?.username?.toLowerCase());
      } else if (clientsScope === 'none') {
        clientsData = [];
      }

      const quotesScope = getAdvancedPermissionScope(user, 'sales', 'quotations', 'view_quotes');
      if (quotesScope === 'own') {
        quotesData = quotesData.filter((q: any) => q.createdBy?.toLowerCase() === user?.username?.toLowerCase());
      } else if (quotesScope === 'none') {
        quotesData = [];
      }

      const collectionsScope = getAdvancedPermissionScope(user, 'sales', 'collections', 'view_collections');
      if (collectionsScope === 'own') {
        collectionsData = collectionsData.filter((col: any) => 
          col.createdBy?.toLowerCase() === user?.username?.toLowerCase() ||
          col.creatorName?.toLowerCase() === user?.username?.toLowerCase()
        );
      } else if (collectionsScope === 'none') {
        collectionsData = [];
      }

      const reqsScope = getAdvancedPermissionScope(user, 'sales', 'production_requests', 'view_requests');
      if (reqsScope === 'own') {
        reqsData = reqsData.filter(
          (r: any) =>
            r.createdBy?.toLowerCase() === user?.username?.toLowerCase() ||
            quotesData.some((q: any) => q.quotationNumber === r.quotationNumber)
        );
      } else if (reqsScope === 'none') {
        reqsData = [];
      }

      const lettersScope = getAdvancedPermissionScope(user, 'sales', 'letters', 'view_letters');
      if (lettersScope === 'own') {
        letterLogsData = letterLogsData.filter(
          (l: any) =>
            l.exportedBy?.toLowerCase() === user?.username?.toLowerCase() ||
            quotesData.some((q: any) => q.quotationNumber === l.quotationNumber)
        );
      } else if (lettersScope === 'none') {
        letterLogsData = [];
      }

      setClients(clientsData);
      setQuotations(quotesData);
      setCollections(collectionsData);
      setProductionRequests(reqsData);
      setLettersLogs(letterLogsData);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to calculate a quotation total (with discount and 15% VAT)
  const calculateQuotationValue = (q: any) => {
    if (!q || !q.items || !Array.isArray(q.items)) return 0;
    let subtotal = 0;
    q.items.forEach((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const disk = Number(item.discountPct) || 0;
      const lineTotal = qty * price * (1 - disk / 100);
      subtotal += lineTotal;
    });
    return subtotal * 1.15;
  };

  // ---------------- FILTER DATA BY MONTH AND YEAR ----------------

  // Helper matching selected month & year
  const isSelectedPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  };

  // Helper matching previous month & year
  const isPreviousPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth === -1) {
      prevMonth = 11;
      prevYear = selectedYear - 1;
    }
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  };

  // Custom filter of matching items
  const currentQuotes = useMemo(() => {
    return quotations.filter((q) =>
      isSelectedPeriod(q.date || q.dateCreated || q.createdAt || q.quoteDate || q.lastUpdated),
    );
  }, [quotations, selectedMonth, selectedYear]);

  const prevQuotes = useMemo(() => {
    return quotations.filter((q) =>
      isPreviousPeriod(q.date || q.dateCreated || q.createdAt || q.quoteDate || q.lastUpdated),
    );
  }, [quotations, selectedMonth, selectedYear]);

  const currentProductionRequests = useMemo(() => {
    return productionRequests.filter((req) => isSelectedPeriod(req.createdAt));
  }, [productionRequests, selectedMonth, selectedYear]);

  // --- computation of variables for Cards ---

  // CARD 1: EXPLOURED QUOTATIONS TOTAL VALUE
  const card1Stats = useMemo(() => {
    let currentTotal = 0;
    currentQuotes.forEach((q) => {
      currentTotal += calculateQuotationValue(q);
    });

    let prevTotal = 0;
    prevQuotes.forEach((q) => {
      prevTotal += calculateQuotationValue(q);
    });

    let percentageChange = 0;
    if (prevTotal > 0) {
      percentageChange = Math.round(
        ((currentTotal - prevTotal) / prevTotal) * 100,
      );
    } else if (currentTotal > 0) {
      percentageChange = 100;
    }

    return {
      value: currentTotal,
      count: currentQuotes.length,
      change: percentageChange,
    };
  }, [currentQuotes, prevQuotes]);

  // CARD 2: APPROVED QUOTATIONS
  const card2Stats = useMemo(() => {
    const approvedQuotes = currentQuotes.filter((q) => q.status === "معتمد");
    let totalValue = 0;
    approvedQuotes.forEach((q) => {
      totalValue += calculateQuotationValue(q);
    });

    const approvalRate =
      currentQuotes.length > 0
        ? Math.round((approvedQuotes.length / currentQuotes.length) * 100)
        : 0;

    return {
      count: approvedQuotes.length,
      value: totalValue,
      rate: approvalRate,
    };
  }, [currentQuotes]);

  // CARD 3: SENT TO PRODUCTION
  const card3Stats = useMemo(() => {
    // A quotation is considered sent to production if there exists a matching request
    const sentCount = currentProductionRequests.length;

    // Find matching quote values
    let totalValue = 0;
    currentProductionRequests.forEach((req) => {
      const linkedQuote = quotations.find(
        (q) =>
          q.id === req.quoteId || q.quotationNumber === req.quotationNumber,
      );
      if (linkedQuote) {
        totalValue += calculateQuotationValue(linkedQuote);
      }
    });

    const approvedCount = currentQuotes.filter(
      (q) => q.status === "معتمد",
    ).length;
    const conversionRate =
      approvedCount > 0 ? Math.round((sentCount / approvedCount) * 100) : 0;

    return {
      count: sentCount,
      value: totalValue,
      rate: conversionRate,
    };
  }, [currentProductionRequests, currentQuotes, quotations]);

  // CARD 4: FINANCIAL COLLECTIONS
  const card4Stats = useMemo(() => {
    let collectedSum = 0;
    let remainingSum = 0;

    collections.forEach((plan) => {
      if (plan.phases && Array.isArray(plan.phases)) {
        plan.phases.forEach((ph: any) => {
          const amt = Number(ph.amount) || 0;
          const isCollectedStatus =
            ph.status?.includes("تم التحصيل") ||
            ph.status?.includes("مدفوعة") || ph.isCollected;

          const phaseDate = ph.collectedDate || ph.dueDate || plan.date || plan.createdAt || plan.lastUpdated;
          
          if (isSelectedPeriod(phaseDate)) {
            if (isCollectedStatus) {
              collectedSum += amt;
            } else {
              remainingSum += amt;
            }
          }
        });
      }
    });

    // Rate calculation: match user standard
    const approvedQuotesVal = card2Stats.value;
    const rate =
      approvedQuotesVal > 0
        ? Math.round((collectedSum / approvedQuotesVal) * 100)
        : collectedSum + remainingSum > 0
          ? Math.round((collectedSum / (collectedSum + remainingSum)) * 100)
          : 0;

    return {
      collected: collectedSum,
      remaining: remainingSum,
      rate: Math.min(rate, 100),
    };
  }, [collections, selectedMonth, selectedYear, card2Stats.value]);

  // CARD 5: OVERDUE PAYMENTS
  const card5Stats = useMemo(() => {
    let overdueCount = 0;
    let overdueSum = 0;
    const clientDelays: Record<string, number> = {};

    collections.forEach((plan) => {
      if (plan.phases && Array.isArray(plan.phases)) {
        plan.phases.forEach((ph: any) => {
          const isOverdueStatus = ph.status?.includes("متأخر");
          const phaseDate = ph.collectedDate || ph.dueDate || plan.date || plan.createdAt || plan.lastUpdated;
          
          if (isOverdueStatus && isSelectedPeriod(phaseDate)) {
            const amt = Number(ph.amount) || 0;
            overdueCount++;
            overdueSum += amt;

            const cName = plan.clientName || "غير معروف";
            clientDelays[cName] = (clientDelays[cName] || 0) + amt;
          }
        });
      }
    });

    // Find highest delayed client
    let highestClient = lang === "ar" ? "لا يوجد" : "None";
    let highestAmt = 0;
    Object.entries(clientDelays).forEach(([cName, amt]) => {
      if (amt > highestAmt) {
        highestAmt = amt;
        highestClient = cName;
      }
    });

    return {
      count: overdueCount,
      amount: overdueSum,
      topClient: highestClient,
    };
  }, [collections, selectedMonth, selectedYear, lang]);

  // CARD 6: CLIENTS PERFORMANCE
  const card6Stats = useMemo(() => {
    // New clients in month
    const newClients = clients.filter((c) =>
      isSelectedPeriod(c.createdAt || c.dateCreated),
    ).length;

    // Clients with quotes in month
    const clientsWithQuotes = new Set(currentQuotes.map((q) => q.clientName));

    // Top client by Quotes value
    const clientQuoteSums: Record<string, number> = {};
    currentQuotes.forEach((q) => {
      const cName = q.clientName || "غير معروف";
      clientQuoteSums[cName] =
        (clientQuoteSums[cName] || 0) + calculateQuotationValue(q);
    });

    let topClient = lang === "ar" ? "لا يوجد" : "None";
    let topVal = 0;
    Object.entries(clientQuoteSums).forEach(([cName, val]) => {
      if (val > topVal) {
        topVal = val;
        topClient = cName;
      }
    });

    return {
      newCount: newClients,
      activeQuotesClients: clientsWithQuotes.size,
      bestClientName: topClient,
      bestClientVal: topVal,
    };
  }, [clients, currentQuotes, selectedMonth, selectedYear, lang]);

  // ---------------- CHART 1: DONUT DISTRIBUTION OF STATUSES ----------------
  const quoteStatusDonutData = useMemo(() => {
    let drafts = 0;
    let active = 0;
    let approved = 0;
    let inProduction = 0;

    currentQuotes.forEach((q) => {
      // Find if has production request
      const sentToProd = productionRequests.some(
        (req) =>
          req.quoteId === q.id || req.quotationNumber === q.quotationNumber,
      );
      if (sentToProd) {
        inProduction++;
      } else if (q.status === "معتمد") {
        approved++;
      } else if (q.status === "نشط") {
        active++;
      } else {
        drafts++;
      }
    });

    const total = currentQuotes.length || 1;

    return [
      {
        name: lang === "ar" ? "مسودة" : "Draft",
        value: drafts,
        pct: Math.round((drafts / total) * 100),
        color: "#94a3b8",
      },
      {
        name: lang === "ar" ? "نشط" : "Active",
        value: active,
        pct: Math.round((active / total) * 100),
        color: "#f59e0b",
      },
      {
        name: lang === "ar" ? "معتمد" : "Approved",
        value: approved,
        pct: Math.round((approved / total) * 100),
        color: "#10b981",
      },
      {
        name: lang === "ar" ? "مرسل للإنتاج" : "In Production",
        value: inProduction,
        pct: Math.round((inProduction / total) * 100),
        color: "#8b5cf6",
      },
    ].filter((item) => item.value > 0);
  }, [currentQuotes, productionRequests, lang]);

  // ---------------- CHART 2: BAR CHART OF SALES & COLLECTIONS ----------------
  const comparisonBarData = useMemo(() => {
    return [
      {
        name: lang === "ar" ? "البيانات المالية للشهر" : "Financial Variables",
        [lang === "ar" ? "قيمة العروض المعتمدة" : "Approved Quote Value"]:
          card2Stats.value,
        [lang === "ar" ? "إجمالي المحصل" : "Collected Amount"]:
          card4Stats.collected,
        [lang === "ar" ? "إجمالي المتبقي" : "Outstanding Remaining"]:
          card4Stats.remaining,
      },
    ];
  }, [card2Stats.value, card4Stats, lang]);

  // ---------------- INDEX 6: TOP SALES REPRESENTATIVES ----------------
  const topSalesReps = useMemo(() => {
    const representatives: Record<
      string,
      {
        name: string;
        count: number;
        approvedCount: number;
        approvedVal: number;
        collected: number;
      }
    > = {};

    currentQuotes.forEach((q) => {
      const rep =
        q.salesRepName ||
        q.createdBy ||
        (lang === "ar" ? "غير محدد" : "Unassigned");
      if (!representatives[rep]) {
        representatives[rep] = {
          name: rep,
          count: 0,
          approvedCount: 0,
          approvedVal: 0,
          collected: 0,
        };
      }
      representatives[rep].count++;
      const val = calculateQuotationValue(q);
      if (q.status === "معتمد") {
        representatives[rep].approvedCount++;
        representatives[rep].approvedVal += val;
      }
    });

    // Check collected payments per representative
    collections.forEach((plan) => {
      const rep =
        plan.creatorName ||
        plan.createdBy ||
        (lang === "ar" ? "غير محدد" : "Unassigned");
      if (plan.phases && Array.isArray(plan.phases)) {
        plan.phases.forEach((ph: any) => {
          const amt = Number(ph.amount) || 0;
          const isCollected =
            ph.status.includes("تم التحصيل") || ph.status.includes("مدفوعة");
          const matchesPeriod =
            ph.collectedDate && isSelectedPeriod(ph.collectedDate);

          if (isCollected && matchesPeriod) {
            if (!representatives[rep]) {
              representatives[rep] = {
                name: rep,
                count: 0,
                approvedCount: 0,
                approvedVal: 0,
                collected: 0,
              };
            }
            representatives[rep].collected += amt;
          }
        });
      }
    });

    const arr = Object.values(representatives);
    return arr.sort((a, b) => b.approvedVal - a.approvedVal);
  }, [currentQuotes, collections, selectedMonth, selectedYear, lang]);

  // ---------------- INDEX 7: TOP CLIENTS ----------------
  const topFiveClientsByRemaining = useMemo(() => {
    const clientsData: Record<
      string,
      {
        name: string;
        quotesCount: number;
        totalVal: number;
        approvedVal: number;
        paid: number;
        remaining: number;
      }
    > = {};

    // First scan current quotations
    currentQuotes.forEach((q) => {
      const targetName = q.clientName || "عميل غير معروف";
      if (!clientsData[targetName]) {
        clientsData[targetName] = {
          name: targetName,
          quotesCount: 0,
          totalVal: 0,
          approvedVal: 0,
          paid: 0,
          remaining: 0,
        };
      }
      const val = calculateQuotationValue(q);
      clientsData[targetName].quotesCount++;
      clientsData[targetName].totalVal += val;
      if (q.status === "معتمد") {
        clientsData[targetName].approvedVal += val;
        clientsData[targetName].remaining += val; // will adjust by actual payments below
      }
    });

    // Connect with payment phases
    collections.forEach((plan) => {
      const targetName = plan.clientName || "عميل غير معروف";
      if (plan.phases && Array.isArray(plan.phases)) {
        plan.phases.forEach((ph: any) => {
          const amt = Number(ph.amount) || 0;
          const isCollected =
            ph.status.includes("تم التحصيل") || ph.status.includes("مدفوعة");

          if (!clientsData[targetName]) {
            clientsData[targetName] = {
              name: targetName,
              quotesCount: 0,
              totalVal: 0,
              approvedVal: 0,
              paid: 0,
              remaining: 0,
            };
          }

          if (isCollected) {
            clientsData[targetName].paid += amt;
          } else {
            clientsData[targetName].remaining += amt;
          }
        });
      }
    });

    const list = Object.values(clientsData).sort(
      (a, b) => b.totalVal - a.totalVal,
    );
    return list.slice(0, 5);
  }, [currentQuotes, collections]);

  // ---------------- INDEX 8: ALERTS LOGIC (MAX 5 ALERTS) ----------------
  const salesAlerts = useMemo(() => {
    const alerts: { text: string; type: "warning" | "error" | "info" }[] = [];

    // 1. Overdue payments check
    if (card5Stats.count > 0) {
      alerts.push({
        text:
          lang === "ar"
            ? `⚠️ توجد عدد ${card5Stats.count} دفعة متأخرة مستحقة هذا الشهر بقيمة إجمالية ${card5Stats.amount.toLocaleString()} ريال.`
            : `⚠️ There are ${card5Stats.count} overdue payments this month amounting to ${card5Stats.amount.toLocaleString()} SAR.`,
        type: "error",
      });
    }

    // 2. Active quotes not approved for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const staleActiveQuote = quotations.find((q) => {
      if (q.status !== "نشط") return false;
      const created = new Date(q.dateCreated || q.quoteDate);
      return created < sevenDaysAgo;
    });
    if (staleActiveQuote) {
      alerts.push({
        text:
          lang === "ar"
            ? `⏳ يوجد عروض أسعار نشطة لم يتم اعتمادها منذ أكثر من 7 أيام (أحدثها: ${staleActiveQuote.quotationNumber} للعميل ${staleActiveQuote.clientName}).`
            : `⏳ Active quotes awaiting approval for over 7 days (e.g., ${staleActiveQuote.quotationNumber} for client ${staleActiveQuote.clientName}).`,
        type: "warning",
      });
    }

    // 3. Approved quotes not sent to production
    const approvedNotSent = currentQuotes.filter((q) => {
      if (q.status !== "معتمد") return false;
      const hasReq = productionRequests.some(
        (req) =>
          req.quoteId === q.id || req.quotationNumber === q.quotationNumber,
      );
      return !hasReq;
    });
    if (approvedNotSent.length > 0) {
      alerts.push({
        text:
          lang === "ar"
            ? `⚙️ يوجد عدد ${approvedNotSent.length} عرض معتمد للمؤسسة لم يتم إرسال طلب إنتاج له حتى الآن.`
            : `⚙️ ${approvedNotSent.length} approved quotes have not been sent as production requests yet.`,
        type: "info",
      });
    }

    // 4. Sent to production with missing first payment
    const productionWithNoFirstPayment = currentProductionRequests.filter(
      (req) => {
        const plan = collections.find(
          (p) =>
            p.quotationNumber === req.quotationNumber || p.id === req.quoteId,
        );
        if (!plan || !plan.phases || plan.phases.length === 0) return true;
        const firstPhase = plan.phases[0];
        const isCollected =
          firstPhase.status.includes("تم التحصيل") ||
          firstPhase.status.includes("مدفوعة");
        return !isCollected;
      },
    );
    if (productionWithNoFirstPayment.length > 0) {
      alerts.push({
        text:
          lang === "ar"
            ? `🚨 يوجد عدد ${productionWithNoFirstPayment.length} علاقة مشروع إنتاج جاري ولم تسدد الدفعة المقدمة الأولى له.`
            : `🚨 ${productionWithNoFirstPayment.length} production projects are ongoing without securing the first advance payment.`,
        type: "warning",
      });
    }

    // 5. Large outstanding balance client
    const largeOutstanding = topFiveClientsByRemaining.find(
      (c) => c.remaining > 50000,
    );
    if (largeOutstanding) {
      alerts.push({
        text:
          lang === "ar"
            ? `👤 العميل "${largeOutstanding.name}" لديه رصيد متبقي مستحق كبير وهو قدره ${largeOutstanding.remaining.toLocaleString()} ريال.`
            : `👤 Client "${largeOutstanding.name}" has a high outstanding balance of ${largeOutstanding.remaining.toLocaleString()} SAR.`,
        type: "info",
      });
    }

    return alerts.slice(0, 5);
  }, [
    card5Stats,
    quotations,
    currentQuotes,
    productionRequests,
    currentProductionRequests,
    collections,
    topFiveClientsByRemaining,
    lang,
  ]);

  // ---------------- INDEX 9: LATEST ACTIONS (MAX 10 EVENTS) ----------------
  const latestActionsList = useMemo(() => {
    const list: any[] = [];

    // Quotations created
    quotations.forEach((q) => {
      const date = q.dateCreated || q.quoteDate;
      if (date) {
        list.push({
          date: new Date(date),
          user: q.createdBy || (lang === "ar" ? "منسق مبيعات" : "Sales Rep"),
          type: lang === "ar" ? "إنشاء عرض سعر" : "Create Quotation",
          quoteNum: q.quotationNumber || "-",
          client: q.clientName || "---",
          timestamp: new Date(date).getTime(),
        });
      }
    });

    // Quotations approved
    quotations.forEach((q) => {
      if (q.status === "معتمد") {
        const date = q.lastUpdated || q.dateCreated || q.quoteDate;
        if (date) {
          list.push({
            date: new Date(date),
            user:
              q.approvedBy ||
              (lang === "ar" ? "مدير المبيعات" : "Sales Manager"),
            type: lang === "ar" ? "اعتماد عرض سعر" : "Approve Quotation",
            quoteNum: q.quotationNumber || "-",
            client: q.clientName || "---",
            timestamp: new Date(date).getTime(),
          });
        }
      }
    });

    // Production requests sent
    productionRequests.forEach((req) => {
      if (req.createdAt) {
        list.push({
          date: new Date(req.createdAt),
          user:
            req.creatorName ||
            req.createdBy ||
            (lang === "ar" ? "مهندس مبيعات" : "Sales Engineer"),
          type: lang === "ar" ? "إرسال طلب إنتاج" : "Sent Production Request",
          quoteNum: req.quotationNumber || "-",
          client: req.clientName || "---",
          timestamp: new Date(req.createdAt).getTime(),
        });
      }
    });

    // Letters registered
    lettersLogs.forEach((log) => {
      if (log.exportedAt) {
        list.push({
          date: new Date(log.exportedAt),
          user: log.exportedBy || (lang === "ar" ? "محرر الخطابات" : "Writer"),
          type: lang === "ar" ? "إنشاء خطاب" : "Issued Letter",
          quoteNum: log.quotationNumber || "-",
          client: log.clientName || "---",
          timestamp: new Date(log.exportedAt).getTime(),
        });
      }
    });

    // Client edits/creations
    clients.forEach((c) => {
      const date = c.createdAt || c.dateCreated;
      if (date) {
        list.push({
          date: new Date(date),
          user: c.createdBy || (lang === "ar" ? "موظف CRM" : "CRM Officer"),
          type:
            lang === "ar" ? "تعديل بيانات عميل" : "Modify Client Registration",
          quoteNum: "-",
          client: c.clientName || c.name || "---",
          timestamp: new Date(date).getTime(),
        });
      }
    });

    // Collections phase updates
    collections.forEach((plan) => {
      if (plan.phases) {
        plan.phases.forEach((ph: any) => {
          if (
            ph.collectedDate &&
            (ph.status.includes("تم التحصيل") || ph.status.includes("مدفوعة"))
          ) {
            list.push({
              date: new Date(ph.collectedDate),
              user:
                plan.receiptConfirmedBy ||
                plan.creatorName ||
                (lang === "ar" ? "المحصل المالي" : "Treasurer"),
              type:
                lang === "ar"
                  ? "تسجيل دفعة ونقل مرحلة للتحصيل"
                  : "Recorded Payment Transfer",
              quoteNum: plan.quotationNumber || "-",
              client: plan.clientName || "---",
              timestamp: new Date(ph.collectedDate).getTime(),
            });
          }
        });
      }
    });

    // Sort descending by timestamp
    const sorted = list.sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, 10);
  }, [quotations, productionRequests, lettersLogs, clients, collections, lang]);

  // Helper styles based on conversion rate value
  const getProgressColor = (rate: number) => {
    if (rate >= 75)
      return {
        bar: "bg-emerald-500",
        text: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    if (rate >= 40)
      return {
        bar: "bg-amber-500",
        text: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      bar: "bg-rose-500",
      text: "text-rose-700 bg-rose-50 border-rose-200",
    };
  };

  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: lang === "ar" ? monthsArabic[i] : monthsEnglish[i],
    }));
  };

  const getYearOptions = () => {
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">
          {lang === "ar"
            ? "جاري تحميل مؤشرات لوحة المبيعات الحية..."
            : "Loading live sales dashboard indicators..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* HEADER WITH MONTH FILTER & ACTIONS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            {lang === "ar"
              ? "لوحة القيادة والمؤشرات الخاصة بالمبيعات"
              : "Sales Command Center & KPI Panel"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {lang === "ar"
              ? "احصل على الخلاصة الحية لتحركات مبيعات فنون الوليد فوريا."
              : "Get instant, data-backed analytical breakdown of Fonoun Al-Waleed metrics."}
          </p>
        </div>

        {/* PERIOD SELECTOR */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-500">
            {lang === "ar" ? "اختر الشهر والسنـة:" : "Select period:"}
          </span>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border text-sm font-black border-slate-200 rounded-xl px-3 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {getMonthOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border text-sm font-black border-slate-200 rounded-xl px-3 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {getYearOptions().map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUICK SHORTCUT BUTTONS PANEL */}
      <div className="bg-gradient-to-l from-indigo-500 to-indigo-700 p-5 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-300" />
            {lang === "ar"
              ? "شريط العمليات والمخارج السريعة المباشرة"
              : "Dynamic Shortcut Actions Portal"}
          </h2>
          <p className="text-xs text-indigo-100 font-semibold">
            {lang === "ar"
              ? "اختصر خطواتك الإدارية وسرع وتيرة العمل بكبسة زر واحدة"
              : "Execute CRM, Quotation, Letter and Collection tasks instantly."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveSubTab("sales_quotations")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />{" "}
            {lang === "ar" ? "إضافة عرض سعر" : "Add Quote"}
          </button>

          <button
            onClick={() => setActiveSubTab("sales_crm")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />{" "}
            {lang === "ar" ? "إضافة عميل" : "Add Client"}
          </button>

          <button
            onClick={() => setActiveSubTab("sales_collections")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <DollarSign className="w-4 h-4" />{" "}
            {lang === "ar" ? "تسجيل دفعة مالية" : "Register Payment"}
          </button>

          <button
            onClick={() => setActiveSubTab("sales_reports")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <AlertCircle className="w-4 h-4" />{" "}
            {lang === "ar" ? "عرض الدفعات المتأخرة" : "View Overdue"}
          </button>

          <button
            onClick={() => setActiveSubTab("sales_production_requests")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <Factory className="w-4 h-4" />{" "}
            {lang === "ar"
              ? "عرض العروض المرسلة للإنتاج"
              : "Sent to Production"}
          </button>

          <button
            onClick={() => setActiveSubTab("sales_letters")}
            className="bg-white/10 hover:bg-white text-white hover:text-indigo-800 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />{" "}
            {lang === "ar" ? "إنشاء خطاب رسمي" : "Create Letter"}
          </button>
        </div>
      </div>

      {/* DYNAMICAL INDICATORS CARDS (KIDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: TOTAL QUOTE VALUE */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "إجمالي المبيعات"
                  : "Total Sales"}
              </span>
              <h3 className="text-2xl font-black text-slate-800">
                {card1Stats.value.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">ريال</span>
              </h3>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              {lang === "ar"
                ? `عدد العروض: ${card1Stats.count}`
                : `Quotes size: ${card1Stats.count}`}
            </span>
            <span
              className={`flex items-center gap-0.5 ${card1Stats.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {card1Stats.change >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {card1Stats.change >= 0 ? `+` : ""}
              {card1Stats.change}%{" "}
              {lang === "ar" ? "عن الشهر السابق" : "vs last month"}
            </span>
          </div>
        </div>

        {/* CARD 2: APPROVED QUOTES */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "عروض الأسعار المعتمدة"
                  : "Approved Quotations"}
              </span>
              <h3 className="text-2xl font-black text-slate-800">
                {card2Stats.value.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">ريال</span>
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              {lang === "ar"
                ? `عدد العروض المعتمدة: ${card2Stats.count}`
                : `Approved: ${card2Stats.count}`}
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[10px] b-emerald-200">
              {lang === "ar" ? "نسبة الاعتماد" : "Approval rate"}{" "}
              {card2Stats.rate}%
            </span>
          </div>
        </div>

        {/* CARD 3: SENT TO PRODUCTION */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "العروض المرسلة للإنتاج"
                  : "Sent to Production"}
              </span>
              <h3 className="text-2xl font-black text-slate-800">
                {card3Stats.value.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">ريال</span>
              </h3>
            </div>
            <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-2xl">
              <Factory className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              {lang === "ar"
                ? `الطلبات المرسلة: ${card3Stats.count}`
                : `Sent orders: ${card3Stats.count}`}
            </span>
            <span className="text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-lg text-[10px] b-cyan-200">
              {lang === "ar" ? "التحويل للإنتاج" : "To Prod rate"}{" "}
              {card3Stats.rate}%
            </span>
          </div>
        </div>

        {/* CARD 4: FINANCIAL COLLECTIONS STATS */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "المحصل المالي والمتبقي"
                  : "Collections & Balances"}
              </span>
              <h3 className="text-2xl font-black text-emerald-650">
                {card4Stats.collected.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">
                  ريال محصل
                </span>
              </h3>
            </div>
            <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-rose-600">
              {lang === "ar"
                ? `المتبقي: ${card4Stats.remaining.toLocaleString()} ريال`
                : `Outstanding: ${card4Stats.remaining.toLocaleString()}`}
            </span>
            <span className="text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg text-[10px] b-teal-200">
              {lang === "ar" ? "نسبة التحصيل" : "Collection Rate"}{" "}
              {card4Stats.rate}%
            </span>
          </div>
        </div>

        {/* CARD 5: OVERDUE DEBTS */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "المتأخرات"
                  : "Overdue"}
              </span>
              <h3 className="text-2xl font-black text-rose-600">
                {card5Stats.amount.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">
                  ريال متأخر
                </span>
              </h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              {lang === "ar"
                ? `دفعات متأخرة: ${card5Stats.count}`
                : `Overdue phases: ${card5Stats.count}`}
            </span>
            <span
              className="text-rose-700 bg-rose-50 px-2 text-[10px] rounded-lg truncate max-w-[130px]"
              title={card5Stats.topClient}
            >
              {lang === "ar" ? "أعلى عميل: " : "Highest: "}{" "}
              {card5Stats.topClient}
            </span>
          </div>
        </div>

        {/* CARD 6: CLIENTS ENGAGEMENT */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase block">
                {lang === "ar"
                  ? "المتعاملين والعملاء الجدد"
                  : "Client Relations & CRM"}
              </span>
              <h3 className="text-2xl font-black text-indigo-700">
                {card6Stats.newCount}{" "}
                <span className="text-xs font-bold text-slate-400">
                  {lang === "ar" ? "عملاء جدد هذا الشهر" : "new clients"}
                </span>
              </h3>
            </div>
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              {lang === "ar"
                ? `عملاء بالتسعير: ${card6Stats.activeQuotesClients}`
                : `CRM Quotes count: ${card6Stats.activeQuotesClients}`}
            </span>
            <span
              className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-lg text-[10px] truncate max-w-[150px]"
              title={card6Stats.bestClientName}
            >
              {lang === "ar" ? "الأفضل: " : "Best: "}{" "}
              {card6Stats.bestClientName}
            </span>
          </div>
        </div>
      </div>

      {/* TWO CHARTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: BAR CHART FOR SALES AND COLLECTION */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm lg:col-span-7 space-y-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-500" />
            {lang === "ar"
              ? "مقارنة المبيعات المعتمدة والتحصيل المالي الفعلي"
              : "Sales vs Actual Collections Representation"}
          </h3>
          <p className="text-xs text-slate-400">
            {lang === "ar"
              ? "مقارنة إجمالي عروض الأسعار المعتمدة مع التدفق النقدي المحصل والمتبقي للتحصيل."
              : "A visual look matching total sales values with cash in vs outstanding dues."}
          </p>
          <div className="h-72 w-full font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={comparisonBarData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(243, 244, 246, 0.5)" }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey={
                    lang === "ar"
                      ? "قيمة العروض المعتمدة"
                      : "Approved Quote Value"
                  }
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey={lang === "ar" ? "إجمالي المحصل" : "Collected Amount"}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey={
                    lang === "ar" ? "إجمالي المتبقي" : "Outstanding Remaining"
                  }
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: DONUT CHART OF STATUSES */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-indigo-500" />
              {lang === "ar"
                ? "توزيع حالات عروض الأسعار المسجلة"
                : "Status Distribution Breakdown"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ar"
                ? "مسح نسبي شامل لجميع الحالات ومخرجات التسعير للمحيط الزمني المختار."
                : "Relative breakdown of quotes state including transition to production."}
            </p>
          </div>

          {quoteStatusDonutData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-center">
              <div className="h-44 w-44 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quoteStatusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {quoteStatusDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered sum text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {lang === "ar" ? "العروض" : "Quotes"}
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {currentQuotes.length}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-2 flex-1 w-full text-xs font-bold">
                {quoteStatusDonutData.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <span>
                        {item.value} {lang === "ar" ? "عرض" : "quotes"}
                      </span>
                      <span className="text-[10px] text-slate-400 mr-1">
                        ({item.pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 flex-grow text-slate-400">
              <FileText className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-bold">
                {lang === "ar"
                  ? "لا يوجد عروض أسعار مسجلة في هذا الشهر لتوزيعهـا."
                  : "No quotations registered in this selected period."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONVERSION SPEED PROGRESS BARS */}
      <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
          <Activity className="w-5 h-5 text-indigo-500" />
          {lang === "ar"
            ? "تحليل ومؤشرات سرعة تحويل عروض المبيعات"
            : "Quotation Funnel & Target Conversion Indicators"}
        </h3>
        <p className="text-xs text-slate-400">
          {lang === "ar"
            ? "تتبع نسبة انتقال عروض الأسعار من مسودة أو نشط إلى الاعتماد، ومن الاعتماد إلى خطوط التوريد والإنتاج."
            : "Track the structural conversion speed of quotations into client-approved projects and engineering production requests."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Funnel 1: Approval Rate */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">
                {lang === "ar"
                  ? "المرحلة 1: من عرض سعر إلى معتمد وموقع"
                  : "Phase 1: Quote to General Approval"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-black ${getProgressColor(card2Stats.rate).text}`}
              >
                {card2Stats.rate}%
              </span>
            </div>

            {/* Real Progress Bar */}
            <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(card2Stats.rate).bar}`}
                style={{ width: `${card2Stats.rate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>
                {lang === "ar"
                  ? `المتبقي للوصول لهدف 100% هو: ${100 - card2Stats.rate}%`
                  : `Distance: ${100 - card2Stats.rate}%`}
              </span>
              <span>{lang === "ar" ? "المطروح الكلي" : "Total Issued"}</span>
            </div>
          </div>

          {/* Funnel 2: Conversion To Production */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">
                {lang === "ar"
                  ? "المرحلة 2: من عرض معتمد إلى مهام إنتاج ومشاريع"
                  : "Phase 2: Approval to Factory Assignment"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-black ${getProgressColor(card3Stats.rate).text}`}
              >
                {card3Stats.rate}%
              </span>
            </div>

            {/* Real Progress Bar */}
            <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(card3Stats.rate).bar}`}
                style={{ width: `${card3Stats.rate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>
                {lang === "ar"
                  ? `المتبقي للوصول لهدف 100% هو: ${100 - card3Stats.rate}%`
                  : `Distance: ${100 - card3Stats.rate}%`}
              </span>
              <span>{lang === "ar" ? "المعتمد الكلي" : "Total Approved"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMICAL WARNINGS / NOTICES */}
      <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          {lang === "ar"
            ? "نظام التنبيهات الذكية والرصد الفوري للأحداث المترتبة"
            : "Dynamic Critical Sales Alerts & Operational Warnings"}
        </h3>

        {salesAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {salesAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-2.5 font-bold text-xs ${
                  alert.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : alert.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-indigo-50 border-indigo-200 text-indigo-850"
                }`}
              >
                <div className="leading-relaxed leading-5 flex-1">
                  {alert.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              {lang === "ar"
                ? "لا توجد تنبيهات وعوائق عاجلة حالياً بنظام المبيعات والتحصيل للمحيط الزمني المحدد. جميع العمليات تسير بشكل متميز ومؤمن!"
                : "No priority alarms or uncollected dues warnings right now. Excellent pipeline health!"}
            </span>
          </div>
        )}
      </div>

      {/* REPRESENTATIVES AND CLIENTS TABLES */}
      {user?.role !== "Sales Rep" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TABLE 1: REPRESENTATIVES PERFORMANCE */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm lg:col-span-6 space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-500" />
              {lang === "ar"
                ? "جدول تقييم وتصنيف أداء المندوبين"
                : "Sales Representative Target Ledger"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ar"
                ? "ترتيب المناديب تلقائياً من الأفضل أداءً بناءً على القيمة المعتمدة الكلية مع تبيان التحصيل."
                : "Rank of representatives of Fonoun Al-Waleed based on approved sales and real collected cash."}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                    <th className="p-3.5 rounded-r-xl">
                      {lang === "ar" ? "المندوب" : "Rep Name"}
                    </th>
                    <th className="p-3.5 text-center">
                      {lang === "ar" ? "العروض المطروحة" : "Quotes size"}
                    </th>
                    <th className="p-3.5 text-center">
                      {lang === "ar" ? "العروض المعتمدة" : "Approved Size"}
                    </th>
                    <th className="p-3.5">
                      {lang === "ar" ? "القيمة المعتمدة" : "Approved Value"}
                    </th>
                    <th className="p-3.5 rounded-l-xl">
                      {lang === "ar" ? "التحصيل الفعلي" : "Collected Cash"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {topSalesReps.slice(0, 5).map((rep, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 font-black text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 text-[10px] text-indigo-700 font-black rounded-lg">
                          {idx + 1}
                        </span>
                        {rep.name}
                      </td>
                      <td className="p-3.5 text-center text-slate-500">
                        {rep.count}
                      </td>
                      <td className="p-3.5 text-center text-indigo-600 font-black">
                        {rep.approvedCount}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {rep.approvedVal.toLocaleString()} ريال
                      </td>
                      <td className="p-3.5 text-emerald-600 font-black">
                        {rep.collected.toLocaleString()} ريال
                      </td>
                    </tr>
                  ))}
                  {topSalesReps.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-400 font-bold"
                      >
                        {lang === "ar"
                          ? "لا توجد عقود معتمدة أو مناديب نشطين في الفترة الزمنية المختارة."
                          : "No sales records detected in this epoch."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: BEST CLIENTS */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm lg:col-span-6 space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-500" />
              {lang === "ar"
                ? "جدول تقرير أفضل 5 عملاء في الشهر"
                : "Top VIP Client Transactions"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "ar"
                ? "أكثر خمسة عملاء من حيث المطروح والتعامل المالي التراكمي وتتبع الذمم المستحقة."
                : "Ledger of high tier commercial clients with quotations, payment cash index."}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                    <th className="p-3.5 rounded-r-xl">
                      {lang === "ar" ? "اسم العميل" : "Client Name"}
                    </th>
                    <th className="p-3.5 text-center">
                      {lang === "ar" ? "العروض" : "Quotes count"}
                    </th>
                    <th className="p-3.5">
                      {lang === "ar" ? "المطروح" : "Offered value"}
                    </th>
                    <th className="p-3.5">
                      {lang === "ar" ? "المدفوع" : "Paid amount"}
                    </th>
                    <th className="p-3.5 rounded-l-xl">
                      {lang === "ar" ? "المتبقي لـه" : "Remaining dues"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {topFiveClientsByRemaining.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td
                        className="p-3.5 text-slate-800 font-black flex items-center gap-2 max-w-[140px] truncate"
                        title={c.name}
                      >
                        <span className="w-5 h-5 flex items-center justify-center bg-teal-50 text-[10px] text-teal-800 font-black rounded-lg">
                          {idx + 1}
                        </span>
                        {c.name}
                      </td>
                      <td className="p-3.5 text-center text-slate-500">
                        {c.quotesCount}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {c.totalVal.toLocaleString()} ريال
                      </td>
                      <td className="p-3.5 text-teal-600 font-black">
                        {c.paid.toLocaleString()} ريال
                      </td>
                      <td
                        className={`p-3.5 font-black ${c.remaining > 0 ? "text-rose-600" : "text-slate-400"}`}
                      >
                        {c.remaining.toLocaleString()} ريال
                      </td>
                    </tr>
                  ))}
                  {topFiveClientsByRemaining.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-400 font-bold"
                      >
                        {lang === "ar"
                          ? "لا توجد تعاملات عملاء مسجلة في هذا الشهر."
                          : "No dynamic transaction history recorded."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LATEST TRANSACTIONS & EVENTS */}
      {user?.role !== "Sales Rep" && (
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 animate-pulse">
              <Activity className="w-5 h-5 text-indigo-500" />
              {lang === "ar"
                ? "تتبع آخر العمليات المسجلة فورياً (آخر 10 حركات)"
                : "Live Sales Transmission & Action Logs Feed (Last 10 Actions)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "ar"
                ? "مراقبة زمنية رصينة ومباشرة لجميع الإجراءات على عروض الأسعار والخطابات والتحصيلات والعملاء تلقائياً."
                : "Comprehensive live logging audit of core operations spanning all client relationship activities."}
            </p>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-350 font-extrabold border-b border-slate-100">
                  <th className="p-3.5 rounded-r-xl">
                    {lang === "ar" ? "التسجيل الزمني" : "Date Created"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "المستخدم المباشر" : "User Execution"}
                  </th>
                  <th className="p-3.5">
                    {lang === "ar" ? "نوع الإجراء المسجل" : "Logged Action"}
                  </th>
                  <th className="p-3.5 text-center">
                    {lang === "ar" ? "رقم الكوتيشن" : "Reference Code"}
                  </th>
                  <th className="p-3.5 rounded-l-xl">
                    {lang === "ar" ? "العميل المستفيد" : "Customer target"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {latestActionsList.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 text-slate-400 text-[11px] font-mono">
                      {new Date(log.date).toLocaleString("ar-SA", {
                        hour12: true,
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3.5 font-black text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.user}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] bg-slate-50 text-slate-600 border border-slate-100 font-bold ${
                          log.type.includes("اعتماد")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : log.type.includes("دفعة")
                              ? "bg-teal-50 text-teal-700 border-teal-100"
                              : log.type.includes("إنتاج")
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                : log.type.includes("تعديل")
                                  ? "bg-purple-50 text-purple-700 border-purple-100"
                                  : ""
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-500 font-black">
                      {log.quoteNum}
                    </td>
                    <td
                      className="p-3.5 font-black text-slate-800 truncate max-w-[170px]"
                      title={log.client}
                    >
                      {log.client}
                    </td>
                  </tr>
                ))}
                {latestActionsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-400 font-bold"
                    >
                      {lang === "ar"
                        ? "لا يوجد أي عمليات مسجلة بالنظام حتى الآن."
                        : "No audit operations registered in server database."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
