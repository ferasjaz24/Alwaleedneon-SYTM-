import { getStatusColors } from "../lib/statusUtils";
import { getAccessLevel, getAdvancedPermissionScope } from "../lib/permissions";
import React, { useState, useEffect } from "react";
import ProductionDashboard from "./production/ProductionDashboard";
import DailyProductionFollowup from "./production/DailyProductionFollowup";
import {
  Building2,
  Search,
  Calendar,
  Save,
  Trash2,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Info,
  Eye,
  Download,
  Users,
  Layers,
  AlertCircle,
  FileText,
  Check,
  Truck,
  X,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { Employee, User, Quotation } from "../types";
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from "../utils/PrintShared";

interface ProductionHubProps {
  lang: "ar" | "en";
  user: User;
  employees: Employee[];
  activeSubTab?: string;
  onSelectSubTab?: (id: string) => void;
  quotations: any[];
  onSaveQuotation: (quo: any) => Promise<void>;
  onDeleteQuotation?: (id: string) => Promise<void>;
}

export default function ProductionHub({
  lang,
  user,
  employees,
  activeSubTab = "prod_inbound",
  onSelectSubTab,
  quotations,
}: ProductionHubProps) {
  // Local Database States
  const [inboundRequests, setInboundRequests] = useState<any[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<any[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);

  // Installation records
  const [installationRequests, setInstallationRequests] = useState<any[]>([]);
  const [installationOrders, setInstallationOrders] = useState<any[]>([]);

  const roleStr = user?.role?.toLowerCase() || "";
  const userStr = user?.username?.toLowerCase() || "";
  const isOwnerOrAdmin =
    roleStr.includes("owner") ||
    roleStr.includes("admin") ||
    userStr.includes("feras") ||
    userStr.includes("admin") ||
    userStr.includes("holoul") ||
    roleStr === "super admin" ||
    roleStr.includes("مدير نظام") ||
    roleStr.includes("إدارة") ||
    roleStr.includes("مدير");

  // Collection plans for payments check
  const [collectionPlans, setCollectionPlans] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters (Inbound)
  const [inboundSearchCode, setInboundSearchCode] = useState("");
  const [inboundSearchProject, setInboundSearchProject] = useState("");
  const [inboundRepFilter, setInboundRepFilter] = useState("all");
  const [inboundMonthFilter, setInboundMonthFilter] = useState("all");
  const [inboundPortal, setInboundPortal] = useState<'active' | 'completed'>('active');
  const [inboundSort, setInboundSort] = useState<"newest" | "oldest">("newest");

  // Search/Filters (Orders)
  const [orderSearchNo, setOrderSearchNo] = useState("");
  const [orderSearchQuote, setOrderSearchQuote] = useState("");
  const [orderMonth, setOrderMonth] = useState("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest">("newest");

  // Search/Filters (Active Projects)
  const [activeSearch, setActiveSearch] = useState("");
  const [activeQuoteSearch, setActiveQuoteSearch] = useState("");
  const [activeMonth, setActiveMonth] = useState("all");
  const [activeSort, setActiveSort] = useState<"newest" | "oldest">("newest");

  // Search/Filters (Installation requests & orders)
  const [installSearch, setInstallSearch] = useState("");
  const [installMonth, setInstallMonth] = useState("all");

  // Tab managers
  const [installationPortal, setInstallationPortal] = useState<
    "requests" | "orders"
  >("requests");

  // Popup Management States
  const [selectedInbound, setSelectedInbound] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedInstallReq, setSelectedInstallReq] = useState<any | null>(
    null,
  );

  // Action Modals inside popups
  const [showPOForm, setShowPOForm] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [showDatesForm, setShowDatesForm] = useState(false);
  const [showPathForm, setShowPathForm] = useState(false);
  const [showStartManufacturingModal, setShowStartManufacturingModal] =
    useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showInstallTeamModal, setShowInstallTeamModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showTimelineDetailsModal, setShowTimelineDetailsModal] =
    useState(false);
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);

  // Nested form state - Purchase list inside inbound
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poItemName, setPoItemName] = useState("");
  const [poItemQty, setPoItemQty] = useState(1);
  const [poItemNotes, setPoItemNotes] = useState("");

  // Inline editor states inside the collapsible sent request
  const [inlineItemName, setInlineItemName] = useState("");
  const [inlineItemQty, setInlineItemQty] = useState(1);
  const [inlineItemNotes, setInlineItemNotes] = useState("");

  // Form states - Production Order properties
  const [assignedCrew, setAssignedCrew] = useState<string[]>([]);
  const [tempCrewRows, setTempCrewRows] = useState<any[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bufferDays, setBufferDays] = useState(0);

  // Form states - Tailored Production pipeline stages
  const [stages, setStages] = useState<any[]>([
    {
      name: "تصميم الهيكل الحديدي",
      expectedDate: "",
      requiresPayment: false,
      notes: "",
    },
    {
      name: "بناء الحروف والاكريليك",
      expectedDate: "",
      requiresPayment: false,
      notes: "",
    },
    {
      name: "التمديد الكهربائي والـ LED",
      expectedDate: "",
      requiresPayment: false,
      notes: "",
    },
    {
      name: "اختبار الجودة QC والتشطيب المالي",
      expectedDate: "",
      requiresPayment: false,
      notes: "",
    },
  ]);

  // Form states - hold reason
  const [holdReason, setHoldReason] = useState(
    "غير مطابق لمعايير التصنيع / غير قابل للتصنيع بالمعايير المكتوبة",
  );
  const [holdCustomReason, setHoldCustomReason] = useState("");

  // Form states - Installation location & team
  const [mapsLink, setMapsLink] = useState("");
  const [isPrCollapsibleOpen, setIsPrCollapsibleOpen] = useState(false);

  // Batch selection state
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let timer: any;
    if (
      confirmDialog?.isOpen &&
      confirmDialog.countdown &&
      confirmDialog.countdown > 0
    ) {
      timer = setTimeout(() => {
        setConfirmDialog((prev: any) =>
          prev ? { ...prev, countdown: prev.countdown - 1 } : prev,
        );
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [confirmDialog]);

  useEffect(() => {
    setBulkSelectedIds([]);
  }, [activeSubTab, installationPortal]);

  // Interactive global top warning/success banner
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "err";
    showUndo?: boolean;
    undoPayload?: any;
  } | null>(null);

  const handleAdminDelete = async (
    collection: string,
    id: string,
    name: string,
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === "ar" ? "حذف من النظام" : "Delete from System",
      message:
        lang === "ar"
          ? `هل أنت متأكد تماماً من حذف "${name}" بنهاية لا رجعة فيها؟\nهذا الإجراء متاح للإدارة فقط.`
          : `Are you absolutely sure you want to permanently delete "${name}"?\nThis action is only available to management.`,
      isDestructive: true,
      countdown: 4,
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteRecordInDb(collection, id);
          if (collection === "sales_production_requests") {
            const req = inboundRequests.find((r) => r.id === id);
            const associatedProc = procurementRequests.find(
              (p) =>
                p.projectId === id ||
                p.quotationNumber === req?.quotationNumber,
            );
            if (associatedProc) {
              await deleteRecordInDb(
                "material_purchase_requests",
                associatedProc.id,
              );
            }
          }
          displayToast(
            lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully",
          );
          loadAllData();
        } catch (e: any) {
          console.error(e);
          displayToast(lang === "ar" ? "فشل الحذف" : "Failed to delete", "err");
        }
        setLoading(false);
      },
    });
  };

  const displayToast = (
    msg: string,
    type: "success" | "err" = "success",
    showUndo?: boolean,
    undoPayload?: any,
    duration: number = 3000,
  ) => {
    setToast({ msg, type, showUndo, undoPayload });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const lastPaidStatus = (qNo: string): string => {
    const plan = collectionPlans.find(
      (p) => p.quotationNumber === qNo || p.id === qNo,
    );
    if (!plan || !plan.phases || plan.phases.length === 0)
      return "خطة تحصيل غير مفعلة";
    const lastPhase = plan.phases[plan.phases.length - 1];
    return lastPhase.status || "معلق";
  };

  const getClientPhone = (
    clientName: string,
    qNo?: string,
    clientId?: string,
  ): string => {
    let matchedClient = clients.find(
      (c) =>
        c.clientName === clientName ||
        c.name === clientName ||
        (clientId && c.id === clientId),
    );
    if (!matchedClient && qNo) {
      const matchedQuote = salesQuotations.find(
        (q) => q.quotationNumber === qNo || q.id === qNo,
      );
      if (matchedQuote) {
        matchedClient = clients.find(
          (c) =>
            c.id === matchedQuote.clientId ||
            c.clientName === matchedQuote.clientName,
        );
      }
    }
    return matchedClient
      ? matchedClient.mobile || matchedClient.phone || "---"
      : "---";
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const ts = Date.now();
      const [
        rInbound,
        rProcurement,
        rOrders,
        rProjects,
        rInstallReq,
        rInstallOrd,
        rCollections,
        rSalesQuotes,
        rWarehouse,
        rClients,
      ] = await Promise.all([
        fetch(`/api/dynamic/sales_production_requests?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/material_purchase_requests?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/production_orders?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/production_projects?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/installation_requests?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/installation_orders?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/financial_collections?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/sales_quotations?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/dynamic/materials_warehouse?t=${ts}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/clients?t=${ts}`).then((r) => (r.ok ? r.json() : [])),
      ]);

      setInboundRequests(Array.isArray(rInbound) ? rInbound : []);
      setProcurementRequests(Array.isArray(rProcurement) ? rProcurement : []);
      setProductionOrders(Array.isArray(rOrders) ? rOrders : []);
      setActiveProjects(Array.isArray(rProjects) ? rProjects : []);
      setInstallationRequests(Array.isArray(rInstallReq) ? rInstallReq : []);
      setInstallationOrders(Array.isArray(rInstallOrd) ? rInstallOrd : []);
      setCollectionPlans(Array.isArray(rCollections) ? rCollections : []);
      setSalesQuotations(Array.isArray(rSalesQuotes) ? rSalesQuotes : []);
      setMaterialsList(Array.isArray(rWarehouse) ? rWarehouse : []);
      setClients(Array.isArray(rClients) ? rClients : []);
    } catch (e) {
      console.error("Error loading data in ProductionHub:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeSubTab]);

  const updateRequestInDb = async (
    col: string,
    docId: string,
    payload: any,
  ) => {
    try {
      const res = await fetch(`/api/dynamic/${col}/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const createRecordInDb = async (col: string, record: any) => {
    try {
      const res = await fetch(`/api/dynamic/${col}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteRecordInDb = async (col: string, docId: string) => {
    try {
      const res = await fetch(`/api/dynamic/${col}/${docId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Automated Status Change to 'قيد المراجعة' upon Viewing Details (Requirement)
  const handleViewInboundDetails = async (req: any) => {
    setSelectedInbound(req);
    // Fetch associated quotation items & set baseline purchase items list if available
    const associatedProc = procurementRequests.find(
      (p) =>
        p.projectId === req.id || p.quotationNumber === req.quotationNumber,
    );
    if (associatedProc) {
      setPoItems(associatedProc.items || []);
    } else {
      setPoItems([]);
    }

    if (
      req.status === "في انتظار المراجعة" ||
      req.status === "في انتظار المراجعة "
    ) {
      const updatedStatus = "قيد المراجعة";
      const success = await updateRequestInDb(
        "sales_production_requests",
        req.id,
        {
          status: updatedStatus,
          statusUpdatedAt: new Date().toISOString(),
        },
      );
      if (success) {
        // Sync state
        setInboundRequests((prev) =>
          prev.map((x) =>
            x.id === req.id ? { ...x, status: updatedStatus } : x,
          ),
        );
      }
    }
  };

  // 1. Confirm Receipt: status changes to 'تم استلام الطلب' (Requirement)
  const handleConfirmReceipt = async () => {
    if (!selectedInbound) return;

    const updated = {
      status: "تم استلام الطلب",
      receivedBy: user.username,
      receivedAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
    };

    const success = await updateRequestInDb(
      "sales_production_requests",
      selectedInbound.id,
      updated,
    );
    if (success) {
      displayToast(
        lang === "ar"
          ? "تم تغيير الحالة الى تم استلام الطلب"
          : "Status updated to Request Received",
        "success",
      );
      // Sync State locally
      setInboundRequests((prev) =>
        prev.map((x) =>
          x.id === selectedInbound.id ? { ...x, ...updated } : x,
        ),
      );
      setSelectedInbound({ ...selectedInbound, ...updated });
    }
  };

  const handleBulkConfirmReceipt = async () => {
    if (bulkSelectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of bulkSelectedIds) {
      const updated = {
        status: "تم استلام الطلب",
        receivedBy: user.username,
        receivedAt: new Date().toISOString(),
        statusUpdatedAt: new Date().toISOString(),
      };
      const ok = await updateRequestInDb(
        "sales_production_requests",
        id,
        updated,
      );
      if (ok) {
        count++;
      }
    }
    setLoading(false);
    displayToast(
      lang === "ar"
        ? `تم اعتماد واستلام عدد (${count}) طلبات بنجاح`
        : `Successfully received (${count}) requests`,
    );
    setBulkSelectedIds([]);
    loadAllData();
  };

  const handleBulkStartManufacturing = async () => {
    if (bulkSelectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of bulkSelectedIds) {
      const ord = productionOrders.find((o) => o.id === id);
      if (!ord) continue;

      const sDate = ord.startDate || new Date().toISOString();
      const eDate =
        ord.endDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const projectPayload = {
        id: `PRJ-${Date.now()}-${count}`,
        projectNumber: `PRJ-${String(activeProjects.length + count + 1).padStart(4, "0")}`,
        orderId: ord.id,
        quotationNumber: ord.quotationNumber,
        clientName: ord.clientName,
        projectName: ord.projectName,
        designLink: ord.designLink,
        salesRep: ord.salesRep,
        startDate: sDate,
        endDate: eDate,
        bufferDays: ord.bufferDays || 0,
        assignedTeam: ord.assignedTeam || [],
        pipelineStages: ord.pipelineStages || [
          {
            name: "تصميم الهيكل الحديدي",
            expectedDate: "",
            requiresPayment: false,
            notes: "",
          },
          {
            name: "بناء الحروف والاكريليك",
            expectedDate: "",
            requiresPayment: false,
            notes: "",
          },
          {
            name: "التمديد الكهربائي والـ LED",
            expectedDate: "",
            requiresPayment: false,
            notes: "",
          },
          {
            name: "اختبار الجودة QC والتشطيب المالي",
            expectedDate: "",
            requiresPayment: false,
            notes: "",
          },
        ],
        currentStageIndex: 0,
        startedAt: new Date().toISOString(),
        status: "قيد التنفيذ",
      };

      const created = await createRecordInDb(
        "production_projects",
        projectPayload,
      );
      if (created) {
        await deleteRecordInDb("production_orders", ord.id);
        if (ord.requestId) {
          await updateRequestInDb("sales_production_requests", ord.requestId, {
            status: "قيد التنفيذ",
          });
        }
        count++;
      }
    }
    setLoading(false);
    displayToast(
      lang === "ar"
        ? `تم بدء تصنيع عدد (${count}) مشروع دفعة واحدة بنجاح`
        : `Successfully started manufacturing for (${count}) projects`,
    );
    setBulkSelectedIds([]);
    loadAllData();
  };

  const handleBulkCompleteProjects = async () => {
    if (bulkSelectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of bulkSelectedIds) {
      const prj = activeProjects.find((p) => p.id === id);
      if (!prj) continue;

      const activeInstReq = {
        ...prj,
        id: `INS-${Date.now()}-${count}`,
        orderId: prj.orderId || prj.id,
        projectNumber: prj.projectNumber,
        projectName: prj.projectName,
        clientName: prj.clientName,
        salesRep: prj.salesRep,
        quotationNumber: prj.quotationNumber,
        requestDate: new Date().toISOString(),
        productionEndDate: prj.endDate,
        designLink: prj.designLink,
        assignedTeam: prj.assignedTeam || [],
        installationStatus: "في انتظار تحديد الموقع",
        statusUpdatedBy: user?.username || "النظام",
        statusUpdatedAt: new Date().toISOString(),
        isOrder: false,
      };

      const pushed = await createRecordInDb(
        "installation_requests",
        activeInstReq,
      );
      if (pushed) {
        await updateRequestInDb("production_projects", prj.id, {
          status: "في انتظار التركيب",
          currentStageIndex: prj.pipelineStages
            ? prj.pipelineStages.length - 1
            : 0,
        });
        const realReqId =
          prj.requestId ||
          inboundRequests.find((r) => r.quotationNumber === prj.quotationNumber)
            ?.id;
        if (realReqId) {
          await updateRequestInDb("sales_production_requests", realReqId, {
            status: "في انتظار التركيب",
          });
        }
        count++;
      }
    }
    setLoading(false);
    displayToast(
      lang === "ar"
        ? `تم ترحيل وتغيير حالة (${count}) مشاريع إلى جاهزة للتركيب`
        : `Transferred (${count}) projects to Installation`,
    );
    setBulkSelectedIds([]);
    loadAllData();
  };

  const handleBulkPromoteToInstallOrders = async () => {
    if (bulkSelectedIds.length === 0) return;

    // Check for map link completion first!
    const missingMaps = bulkSelectedIds.some(
      (id) => !installationRequests.find((r) => r.id === id)?.googleMapsLink,
    );
    if (missingMaps) {
      displayToast(
        lang === "ar"
          ? "يوجد طلبات محددة لا تحتوي على رابط موقع (الخريطة). يرجى تعبئتها أولاً."
          : "Some selected items are missing Google Maps links. Please provide them first.",
        "err",
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title:
        lang === "ar" ? "تأكيد التفعيل الجماعي" : "Confirm Bulk Activation",
      message:
        lang === "ar"
          ? `هل أنت متأكد من تفعيل وإنشاء أوامر تركيب لعدد (${bulkSelectedIds.length}) طلب؟`
          : `Are you sure you want to activate installation orders for ${bulkSelectedIds.length} items?`,
      onConfirm: async () => {
        setLoading(true);
        let count = 0;
        for (const id of bulkSelectedIds) {
          const req = installationRequests.find((r) => r.id === id);
          if (!req) continue;

          const ord = {
            ...req,
            id: `INO-${Date.now()}-${count}`,
            isOrder: true,
            orderedAt: new Date().toISOString(),
            installationStatus: "قيد التركيب الميداني",
            statusUpdatedBy: user?.username || "النظام",
            statusUpdatedAt: new Date().toISOString(),
          };

          const added = await createRecordInDb("installation_orders", ord);
          if (added) {
            await deleteRecordInDb("installation_requests", req.id);
            const realReqId =
              req.requestId ||
              inboundRequests.find(
                (r) => r.quotationNumber === req.quotationNumber,
              )?.id;
            if (realReqId) {
              await updateRequestInDb("sales_production_requests", realReqId, {
                status: "في التركيب",
              });
            }

            const matchedProj = activeProjects.find(
              (p) =>
                p.projectNumber === req.projectNumber ||
                p.quotationNumber === req.quotationNumber,
            );
            if (matchedProj) {
              await updateRequestInDb("production_projects", matchedProj.id, {
                status: "في التركيب",
              });
            }
            count++;
          }
        }
        setLoading(false);
        displayToast(
          lang === "ar"
            ? `تم تفعيل عدد (${count}) أوامر تركيب بنجاح`
            : `Activated (${count}) installation orders`,
        );
        setBulkSelectedIds([]);
        loadAllData();
      },
    });
  };

  const handleBulkCompleteInstallOrders = async () => {
    if (bulkSelectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of bulkSelectedIds) {
      const ord = installationOrders.find((o) => o.id === id);
      if (!ord) continue;

      const ok = await updateRequestInDb("installation_orders", ord.id, {
        installationStatus: "تم التركيب والتشغيل",
        statusUpdatedBy: user?.username || "النظام",
        statusUpdatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      if (ok) {
        const realReqId =
          ord.requestId ||
          inboundRequests.find((r) => r.quotationNumber === ord.quotationNumber)
            ?.id;
        if (realReqId) {
          await updateRequestInDb("sales_production_requests", realReqId, {
            status: "تم التركيب والتشغيل",
          });
        }
        const matchedProj = activeProjects.find(
          (p) =>
            p.projectNumber === ord.projectNumber ||
            p.quotationNumber === ord.quotationNumber,
        );
        if (matchedProj) {
          await updateRequestInDb("production_projects", matchedProj.id, {
            status: "تم التركيب والتشغيل",
          });
        }
        count++;
      }
    }
    setLoading(false);
    displayToast(
      lang === "ar"
        ? `تم إنهاء وإغلاق ملفات تركيب عدد (${count}) مشاريع بنجاح`
        : `Successfully completed (${count}) installation orders`,
    );
    setBulkSelectedIds([]);
    loadAllData();
  };

  const handleBulkPrint = () => {
    if (bulkSelectedIds.length === 0) return;
    
    let itemsToPrint: any[] = [];
    let title = "";
    
    if (activeSubTab === "prod_inbound") {
      itemsToPrint = inboundRequests.filter(req => bulkSelectedIds.includes(req.id));
      title = lang === "ar" ? "طلبات الإنتاج الواردة" : "Inbound Production Requests";
    } else if (activeSubTab === "prod_orders") {
      itemsToPrint = productionOrders.filter(ord => bulkSelectedIds.includes(ord.id));
      title = lang === "ar" ? "أوامر التصنيع النشطة" : "Active Production Orders";
    } else if (activeSubTab === "prod_active") {
      itemsToPrint = activeProjects.filter(prj => bulkSelectedIds.includes(prj.id));
      title = lang === "ar" ? "المشاريع قيد الإنتاج" : "Active Projects";
    } else if (activeSubTab === "prod_installation") {
      if (installationPortal === "requests") {
        itemsToPrint = installationRequests.filter(req => bulkSelectedIds.includes(req.id));
        title = lang === "ar" ? "طلبات التجهيز للتركيب" : "Installation Preparation Requests";
      } else {
        itemsToPrint = installationOrders.filter(req => bulkSelectedIds.includes(req.id));
        title = lang === "ar" ? "أوامر التركيب النشطة" : "Active Installation Orders";
      }
    }

    if (itemsToPrint.length === 0) return;

    const itemsWithProcurement = itemsToPrint.map(item => {
      const associatedProc = procurementRequests.find(
        (p) =>
          p.projectId === item.id ||
          p.quotationNumber === item.quotationNumber,
      );
      return { ...item, associatedProc };
    });

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const htmlContent = `
      <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>${title}</title>
          <style>
            ${sharedPrintStyles}
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { text-align: center; color: #0f172a; margin-bottom: 30px; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .item-card { border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
            .item-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; }
            .item-title { font-size: 18px; font-weight: bold; color: #334155; }
            .item-id { font-size: 14px; color: #64748b; font-family: monospace; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 10px; }
            .label { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 14px; color: #0f172a; font-weight: 600; }
            .table-container { margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            table { border-collapse: collapse; width: 100%; text-align: ${lang === 'ar' ? 'right' : 'left'}; font-size: 12px; }
            th { background: #f8fafc; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold; }
            td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            tr:last-child td { border-bottom: none; }
            @media print {
              body { padding: 0; }
              .item-card { border-color: #94a3b8; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${sharedPrintHeader}
          <h1>${title} - ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</h1>
          ${itemsWithProcurement.map(item => `
            <div class="item-card">
              <div class="item-header">
                <div class="item-title">${item.projectName || item.name || 'N/A'}</div>
                <div class="item-id">#${item.requestNumber || item.orderNumber || item.projectNumber || item.id.substring(0, 8).toUpperCase()}</div>
              </div>
              <div class="grid">
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'الحالة' : 'Status'}</div>
                  <div class="value">${item.status || item.installationStatus || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'العميل' : 'Client'}</div>
                  <div class="value">${item.clientName || 'N/A'}</div>
                </div>
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'تاريخ البدء/الإنشاء' : 'Start/Creation Date'}</div>
                  <div class="value">${new Date(item.requestDate || item.createdAt || item.startDate || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                </div>
                ${item.endDate ? `
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'تاريخ الانتهاء المتوقع' : 'Target End Date'}</div>
                  <div class="value">${new Date(item.endDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                </div>` : ''}
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'المندوب' : 'Sales Rep'}</div>
                  <div class="value">${item.salesRep || item.createdBy || 'N/A'}</div>
                </div>
                ${item.quotationNumber ? `
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'رقم عرض السعر' : 'Quotation No.'}</div>
                  <div class="value">${item.quotationNumber}</div>
                </div>` : ''}
                ${item.googleMapsLink ? `
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'رابط الموقع' : 'Location Link'}</div>
                  <div class="value"><a href="${item.googleMapsLink}" target="_blank">${lang === 'ar' ? 'عرض الخريطة' : 'View Map'}</a></div>
                </div>` : ''}
                ${item.orderedAt ? `
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'تاريخ التوجيه للتركيب' : 'Installation Order Date'}</div>
                  <div class="value">${new Date(item.orderedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                </div>` : ''}
                ${item.completedAt ? `
                <div class="field">
                  <div class="label">${lang === 'ar' ? 'تاريخ إتمام التركيب' : 'Installation Completed At'}</div>
                  <div class="value">${new Date(item.completedAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                </div>` : ''}
                ${item.orderedAt && item.completedAt ? (() => {
                  const diffMs = new Date(item.completedAt).getTime() - new Date(item.orderedAt).getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  let durationStr = '';
                  if (lang === 'ar') {
                    if (diffDays > 0) {
                      const remainingHours = diffHours % 24;
                      durationStr = `${diffDays} يوم و ${remainingHours} ساعة`;
                    } else if (diffHours > 0) {
                      const remainingMins = diffMins % 60;
                      durationStr = `${diffHours} ساعة و ${remainingMins} دقيقة`;
                    } else {
                      durationStr = `${diffMins} دقيقة`;
                    }
                  } else {
                    if (diffDays > 0) {
                      const remainingHours = diffHours % 24;
                      durationStr = `${diffDays} days, ${remainingHours} hours`;
                    } else if (diffHours > 0) {
                      const remainingMins = diffMins % 60;
                      durationStr = `${diffHours} hours, ${remainingMins} mins`;
                    } else {
                      durationStr = `${diffMins} mins`;
                    }
                  }
                  
                  return `
                  <div class="field">
                    <div class="label">${lang === 'ar' ? 'الوقت من تحول إلى أمر تركيب إلى أن تم التركيب بنجاح' : 'Time from Conversion to Installation Complete'}</div>
                    <div class="value" style="color: #059669; font-weight: bold;">${durationStr}</div>
                  </div>`;
                })() : ''}
              </div>

              ${item.crew && Array.isArray(item.crew) && item.crew.length > 0 ? `
                <div style="margin-top: 15px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px;">
                  <div class="label" style="font-weight: bold;">${lang === 'ar' ? 'فريق التركيب المكلف بالمهمة' : 'Assigned Installation Team'}</div>
                  <div class="value" style="font-weight: bold; color: #0072BC;">${item.crew.map((c: any) => c.name || c).join('، ')}</div>
                </div>
              ` : ''}

              ${item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0 ? `
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>${lang === 'ar' ? 'المهمة' : 'Task'}</th>
                        <th>${lang === 'ar' ? 'الكمية/الوصف' : 'Qty/Desc'}</th>
                        <th>${lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${item.tasks.map((t: any) => `
                        <tr>
                          <td>${t.description || t.taskName || t.name || '-'}</td>
                          <td>${t.quantity || t.qty || '-'}</td>
                          <td>${t.status || t.isCompleted ? (lang === 'ar' ? 'مكتمل' : 'Completed') : (lang === 'ar' ? 'قيد التنفيذ' : 'Pending')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${item.items && Array.isArray(item.items) && item.items.length > 0 ? `
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>${lang === 'ar' ? 'الصنف' : 'Item'}</th>
                        <th>${lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                        <th>${lang === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${item.items.map((i: any) => `
                        <tr>
                          <td>${i.name || '-'}</td>
                          <td>${i.quantity || i.qty || 1}</td>
                          <td>${i.notes || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
              
              ${item.associatedProc && item.associatedProc.items && item.associatedProc.items.length > 0 ? `
                <div style="margin-top: 15px;">
                  <div class="label">${lang === 'ar' ? 'المواد المطلوبة للمشروع (طلب شراء/صرف)' : 'Requested Materials'}</div>
                </div>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>${lang === 'ar' ? 'الصنف' : 'Item'}</th>
                        <th>${lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                        <th>${lang === 'ar' ? 'حالة الطلب' : 'Status'}</th>
                        <th>${lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${item.associatedProc.items.map((pi: any) => `
                        <tr>
                          <td>${pi.name || '-'}</td>
                          <td>${pi.quantity || pi.qty || 1}</td>
                          <td>${pi.status || item.associatedProc.status || '-'}</td>
                          <td>${pi.notes || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${item.notes || item.reason ? `
                <div class="field" style="margin-top: 15px;">
                  <div class="label">${lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</div>
                  <div class="value" style="font-weight: normal;">${item.notes || item.reason}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
          ${sharedPrintFooter}
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;
    
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    
    // Call print after a small delay to ensure content is loaded
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  const handleCreateProductionOrder = async () => {
    if (!selectedInbound) return;

    // Verify material status once more
    const associatedProc = procurementRequests.find(
      (p) =>
        p.projectId === selectedInbound.id ||
        p.quotationNumber === selectedInbound.quotationNumber,
    );

    const prodOrder = {
      ...selectedInbound,
      id: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber: `ORD-${String(productionOrders.length + 1).padStart(4, "0")}`,
      requestId: selectedInbound.id,
      quotationNumber: selectedInbound.quotationNumber,
      clientName: selectedInbound.clientName,
      projectName: selectedInbound.projectName,
      designLink: selectedInbound.designLink,
      salesRep: selectedInbound.createdBy || "---",
      createdAt: new Date().toISOString(),
      createdBy: user.username,
      materialsState: associatedProc ? associatedProc.status : "غير محدد",
      items: associatedProc ? associatedProc.items : [],
      isStarted: false,
    };

    const success = await createRecordInDb("production_orders", prodOrder);
    if (success) {
      if (
        associatedProc &&
        associatedProc.items &&
        Array.isArray(associatedProc.items)
      ) {
        try {
          const mRes = await fetch("/api/dynamic/materials_warehouse");
          if (mRes.ok) {
            const materials = await mRes.json();
            for (const item of associatedProc.items) {
              const mat = materials.find(
                (m: any) =>
                  m.name === item.itemName ||
                  m.nameAr === item.itemName ||
                  m.nameEn === item.itemName,
              );
              if (mat) {
                const deduction = Number(item.qty || 0);
                const newQty = Math.max(
                  0,
                  Number(mat.currentQty || 0) - deduction,
                );
                await fetch(`/api/dynamic/materials_warehouse/${mat.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentQty: newQty }),
                });
              }
            }
          }
        } catch (e) {
          console.error("Error deducting materials from warehouse:", e);
        }
      }

      // update inbound request status
      await updateRequestInDb("sales_production_requests", selectedInbound.id, {
        status: "أمر إنتاج",
        statusUpdatedAt: new Date().toISOString(),
        productionOrderNumber: prodOrder.orderNumber,
      });
      displayToast(
        lang === "ar"
          ? "تم إنشاء أمر إنتاج وتم خصم المواد المخصصة له من المستودع"
          : "Converted to Production Order & Materials Deducted",
        "success",
        true,
        {
          type: "UNDO_PROD_ORDER",
          prodOrderId: prodOrder.id,
          inboundId: selectedInbound.id,
        },
      );
      loadAllData();
      setSelectedInbound(null);
    }
  };

  // 2. Material Purchase Sourcing inside the popup (Add item to BoM)
  const handleAddPoItem = () => {
    if (!poItemName.trim()) return;
    const item = { itemName: poItemName, qty: poItemQty, notes: poItemNotes };
    setPoItems([...poItems, item]);
    setPoItemName("");
    setPoItemQty(1);
    setPoItemNotes("");
  };

  // Delete item before purchase order is made (Restriction check)
  const handleRemovePoItem = (index: number) => {
    const associatedProc = procurementRequests.find(
      (p) =>
        p.projectId === selectedInbound.id ||
        p.quotationNumber === selectedInbound.quotationNumber,
    );
    if (associatedProc?.isOrder) {
      displayToast(
        lang === "ar"
          ? "🔒 غير مسموح بالحذف! لقد تم إنشاء أمر شراء رسمي لهذه الخامات بالفعل في قسم المشتريات."
          : "🔒 Deletion forbidden. Sourcing purchase order already finalized.",
        "err",
      );
      return;
    }
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  // Send Purchase List to Supplier & Procurement (Requirement)
  const handleSendProcurementRequest = async () => {
    if (poItems.length === 0) {
      displayToast(
        lang === "ar"
          ? "الرجاء إضافة صنف واحد على الأقل."
          : "Please add at least one item.",
        "err",
      );
      return;
    }

    // Check if Procurement already has an order generated
    const associatedProc = procurementRequests.find(
      (p) =>
        p.projectId === selectedInbound.id ||
        p.quotationNumber === selectedInbound.quotationNumber,
    );
    if (associatedProc?.isOrder) {
      displayToast(
        lang === "ar"
          ? "🔒 مغلق! حالة الطلب: تم انشاء امر شراء مواد بواسطة المشرف المعتمد ولا يمكن تعديله."
          : "🔒 Locked. Purchase order finalized.",
        "err",
      );
      return;
    }

    const docPayload = {
      id: associatedProc?.id || `PRQ-${Date.now()}`,
      requestNumber:
        associatedProc?.requestNumber ||
        `PRQ-${String(procurementRequests.length + 1).padStart(4, "0")}`,
      projectId: selectedInbound.id,
      projectName: selectedInbound.projectName,
      quotationNumber: selectedInbound.quotationNumber,
      clientName: selectedInbound.clientName,
      requestedBy: user.username,
      requestedAt: new Date().toISOString(),
      isOrder: false,
      status: "في انتظار المراجعة",
      items: poItems,
      updatesLog: [
        ...(associatedProc?.updatesLog || []),
        {
          user: user.username,
          action: associatedProc
            ? "تحديث قائمة المواد المطلوبة"
            : "إنشاء طلب شراء خامات الإنتاج الأولية",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    let outcome = false;
    if (associatedProc) {
      // Modify
      outcome = await updateRequestInDb(
        "material_purchase_requests",
        associatedProc.id,
        docPayload,
      );
    } else {
      // Create
      outcome = await createRecordInDb(
        "material_purchase_requests",
        docPayload,
      );
    }

    if (outcome) {
      // Append secondary modification log if modified after order creation (business rule requirement)
      if (associatedProc?.isOrder) {
        await updateRequestInDb(
          "material_purchase_requests",
          associatedProc.id,
          {
            updatesLog: [
              ...associatedProc.updatesLog,
              {
                user: user.username,
                action: "تم تعديل طلب الشراء بعد الاعتماد",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        );
      }
      displayToast(
        lang === "ar"
          ? "تم ارسال طلب انشاء شراء مواد بنجاح"
          : "Material purchase request transmitted successfully!",
      );
      loadAllData();
      setShowPOForm(false);
    }
  };

  const handleUpdateProcurementItems = async (updatedItems: any[]) => {
    const associatedProc = procurementRequests.find(
      (p) =>
        p.projectId === selectedInbound.id ||
        p.quotationNumber === selectedInbound.quotationNumber,
    );
    if (!associatedProc) return;
    if (associatedProc.isOrder) {
      displayToast(
        lang === "ar"
          ? "🔒 غير مسموح بالتعديل! لقد تم إنشاء أمر شراء رسمي لهذه الخامات بالفعل."
          : "🔒 Editing forbidden. Purchase order finalized.",
        "err",
      );
      return;
    }

    const docPayload = {
      ...associatedProc,
      items: updatedItems,
      updatedBy: user.username,
      updatedAt: new Date().toISOString(),
      updatesLog: [
        ...(associatedProc.updatesLog || []),
        {
          user: user.username,
          action: "تم تعديل بنود الخامات المطلوبة",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const success = await updateRequestInDb(
      "material_purchase_requests",
      associatedProc.id,
      docPayload,
    );
    if (success) {
      displayToast(
        lang === "ar"
          ? "تم تحديث خامات طلب الشراء بنجاح"
          : "Sourcing list updated successfully!",
      );
      loadAllData();
    }
  };

  // Hold / Restrict Order (Requirement)
  const handleHoldBooking = async () => {
    if (!selectedInbound) return;
    const finalReason =
      holdReason === "سبب آخر" ? holdCustomReason : holdReason;
    if (holdReason === "سبب آخر" && !holdCustomReason.trim()) {
      displayToast(
        lang === "ar"
          ? "الرجاء إدخال السبب الخاص"
          : "Please type reason details.",
        "err",
      );
      return;
    }

    const payload = {
      status: "تم التقييد",
      holdReason: finalReason,
      heldBy: user.username,
      heldAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
    };

    const success = await updateRequestInDb(
      "sales_production_requests",
      selectedInbound.id,
      payload,
    );
    if (success) {
      displayToast(
        lang === "ar"
          ? `تم تقييد الطلب بنجاح: ${finalReason}`
          : `Request restricted successfully!`,
      );
      loadAllData();
      setShowHoldModal(false);
      setSelectedInbound(null);
    }
  };

  // PRODUCTION ORDERS OPERATIONS
  // 1. Set workforce team list
  const handleSaveTeam = async () => {
    if (!selectedOrder) return;
    const finalNames = tempCrewRows.map((r) => r.name).filter(Boolean);

    const payload = {
      assignedTeam: finalNames,
      teamAssignedAt: new Date().toISOString(),
    };
    const ok = await updateRequestInDb(
      "production_orders",
      selectedOrder.id,
      payload,
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? "تم تحديد فريق الإنتاج بنجاح"
          : "Production crew assigned successfully!",
        "success",
        false,
        null,
        3000,
      );
      loadAllData();
      setShowAssignTeam(false);
    }
  };

  const handleSaveInstallTeam = async () => {
    if (!selectedInstallReq) return;
    const isOrder = !!selectedInstallReq.startInstallationTime; // Assuming it's an order if it has started? Wait, the user can do this on request or order. Let's use logic from `installationPortal`.
    // Wait, let's just assume `installation_requests`. The feature mostly lives there. But actually, `selectedInstallReq` has collection either `installation_requests` or `installation_orders`.
    // We can infer collection from whether `selectedInstallReq.installationOrderId` or similar exists. Let's just update `installation_requests`. But what if they view an order and edit team?
    // Let's just do it directly.
    const collection =
      installationPortal === "requests"
        ? "installation_requests"
        : "installation_orders";
    const payload = {
      assignedTeam: assignedCrew,
      teamAssignedAt: new Date().toISOString(),
    };
    const ok = await updateRequestInDb(
      collection,
      selectedInstallReq.id,
      payload,
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? "تم تحديد فريق التركيب بنجاح"
          : "Installation crew assigned successfully!",
      );
      loadAllData();
      setShowInstallTeamModal(false);
    }
  };

  // 2. Set Start / End dates
  const handleSetDates = async () => {
    if (!selectedOrder) return;
    if (!startDate || !endDate) {
      displayToast(
        lang === "ar" ? "الرجاء اختيار التواريخ" : "Dates required",
        "err",
      );
      return;
    }

    const payload = {
      startDate,
      endDate,
      bufferDays,
      isTimelineConfirmed: true,
      datesLockedBy: user.username,
      datesLockedAt: new Date().toISOString(),
    };

    const ok = await updateRequestInDb(
      "production_orders",
      selectedOrder.id,
      payload,
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? `تم تحديد وقت المشروع بنجاح للمشروع رقم ${selectedOrder.orderNumber}`
          : `Project timeline configured successfully for Order ${selectedOrder.orderNumber}`,
        "success",
        false,
        null,
        3000,
      );
      loadAllData();
      setShowDatesForm(false);
    }
  };

  // 3. Set custom production stages flow
  const handleSaveStages = async () => {
    if (!selectedOrder) return;

    const payload = {
      pipelineStages: stages,
      pipelineSetAt: new Date().toISOString(),
      pipelineSetBy: user.username,
    };
    const ok = await updateRequestInDb(
      "production_orders",
      selectedOrder.id,
      payload,
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? `تم إنشاء مسار لخط إنتاج المشروع رقم ${selectedOrder.orderNumber}`
          : `Production pipeline designed successfully for Order ${selectedOrder.orderNumber}`,
        "success",
        false,
        null,
        3000,
      );
      loadAllData();
      setShowPathForm(false);
    }
  };

  // 4. Start Manufacturing -> Move to active projects
  const handleStartManufacturing = async () => {
    if (!selectedOrder) return;
    if (!selectedOrder.startDate) {
      displayToast(
        lang === "ar"
          ? "الرجاء تحديد التواريخ وجدولة المشروع أولاً خطوة إلزامية."
          : "Timeline schedule must be set before commencing manufacturing.",
        "err",
      );
      return;
    }

    // Promote order to active production project
    const projectPayload = {
      ...selectedOrder,
      id: `PRJ-${Date.now()}`,
      projectNumber: `PRJ-${String(activeProjects.length + 1).padStart(4, "0")}`,
      orderId: selectedOrder.id,
      quotationNumber: selectedOrder.quotationNumber,
      clientName: selectedOrder.clientName,
      projectName: selectedOrder.projectName,
      designLink: selectedOrder.designLink,
      salesRep: selectedOrder.salesRep,
      startDate: selectedOrder.startDate,
      endDate: selectedOrder.endDate,
      bufferDays: selectedOrder.bufferDays || 0,
      assignedTeam: selectedOrder.assignedTeam || [],
      pipelineStages: selectedOrder.pipelineStages || stages,
      currentStageIndex: 0,
      startedAt: new Date().toISOString(),
      status: "قيد التنفيذ",
    };

    // Create the Project, delete/archive the production order
    const created = await createRecordInDb(
      "production_projects",
      projectPayload,
    );
    if (created) {
      await deleteRecordInDb("production_orders", selectedOrder.id);

      // Update sales quotation and request statuses to In progress
      await updateRequestInDb(
        "sales_production_requests",
        selectedOrder.requestId,
        { status: "قيد التنفيذ" },
      );

      displayToast(
        lang === "ar"
          ? "تم بدء التصنيع ونقل المشروع بنجاح!"
          : "Manufacturing run started successfully!",
        "success",
        true,
        {
          type: "UNDO_START_MANUFACTURING",
          projectId: projectPayload.id,
          orderPayload: selectedOrder,
        },
        4000,
      );
      loadAllData();
      setSelectedOrder(null);
      setShowStartManufacturingModal(false);
    }
  };

  // ACTIVE PROJECTS PIPELINE PROMOTION
  const handleConfirmPaymentReceipt = async (prj: any, idx: number) => {
    const st = prj.pipelineStages[idx];
    setConfirmDialog({
      isOpen: true,
      title:
        lang === "ar"
          ? "تأكيد استلام الدفعة المبرمة"
          : "Confirm Payment Receipt",
      message:
        lang === "ar"
          ? `هل أنت متأكد من استلام وتأكيد الدفعة المالية لمرحلة (${st.name})؟ سيؤدي ذلك لتخطي شرط العبور فوراً وعقد التدفق للخطوة التالية في سير الإنتاج.`
          : `Are you sure you want to record the financial receipt for stage (${st.name})? This will bypass the path lock condition and allow progress.`,
      onConfirm: async () => {
        const updatedStages = [...prj.pipelineStages];
        updatedStages[idx] = {
          ...updatedStages[idx],
          paymentReceived: true,
        };

        const ok = await updateRequestInDb("production_projects", prj.id, {
          pipelineStages: updatedStages,
        });

        if (ok) {
          setSelectedProject({
            ...prj,
            pipelineStages: updatedStages,
          });

          try {
            const plan = collectionPlans.find(
              (p) =>
                p.quotationNumber === prj.quotationNumber ||
                p.id === prj.quotationNumber,
            );
            if (plan && plan.phases) {
              const todayDate = new Date().toISOString().split("T")[0];
              let marked = false;
              const updatedPhases = plan.phases.map((ph: any) => {
                if (!ph.status.includes("تم التحصيل") && !marked) {
                  marked = true;
                  const newStatus =
                    ph.status === "متأخر" ? "تم التحصيل متأخر" : "تم التحصيل";
                  return { ...ph, status: newStatus, collectedDate: todayDate };
                }
                return ph;
              });
              const allCollected = updatedPhases.every((ph: any) =>
                ph.status.includes("تم التحصيل"),
              );
              const updatedPlan = {
                ...plan,
                status: allCollected ? "تم تحصيل جميع الدفعات" : plan.status,
                phases: updatedPhases,
              };

              await fetch(`/api/dynamic/financial_collections/${plan.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedPlan),
              });
            }
          } catch (e) {
            console.error(e);
          }

          displayToast(
            lang === "ar"
              ? "🪙 تم تعديل وتأكيد استلام الدفعة المبرمة وتخطي شرط العبور بنجاح!"
              : "Payment received successfully and stage unlocked!",
          );
          loadAllData();
        } else {
          displayToast(
            lang === "ar"
              ? "❌ عذراً، فشل تحديث حالة الدفعة"
              : "Failed to update payment status",
            "err",
          );
        }
      },
    });
  };

  // Proceed to next stage
  const handleProceedStage = async (prj: any, idx: number) => {
    const stageName = prj.pipelineStages[idx].name;
    const isFinal = idx === prj.pipelineStages.length - 1;

    setConfirmDialog({
      isOpen: true,
      title: isFinal
        ? lang === "ar"
          ? "تأكيد ترحيل المشروع للتركيب"
          : "Conclude Production & Transfer"
        : lang === "ar"
          ? "تأكيد إكمال مرحلة الإنتاج الحالية"
          : "Confirm Stage Completion",
      message: isFinal
        ? lang === "ar"
          ? `هل صالة الإنتاج جاهزة لإنهاء كافة الأعمال لمشروع (${prj.projectName}) وتحويله الميداني لخطوات التركيب والتشغيل؟`
          : `Are you sure production is completely finished for project (${prj.projectName}) and you want to transfer it to Installations & Field Operations?`
        : lang === "ar"
          ? `هل تم إنهاء وتشغيل كافة بنود البروسيس الحالية (${stageName}) للانتقال للخطوة التالية؟`
          : `Are you sure you have finished all requirements for (${stageName}) and want to move forward?`,
      onConfirm: async () => {
        if (isFinal) {
          const activeInstReq = {
            ...prj,
            id: `INS-${Date.now()}`,
            orderId: prj.orderId || prj.id,
            projectNumber: prj.projectNumber,
            projectName: prj.projectName,
            clientName: prj.clientName,
            salesRep: prj.salesRep,
            quotationNumber: prj.quotationNumber,
            requestDate: new Date().toISOString(),
            productionEndDate: prj.endDate,
            designLink: prj.designLink,
            assignedTeam: prj.assignedTeam || [],
            installationStatus: "جاهز للتركيب",
            isOrder: false,
          };

          const pushed = await createRecordInDb(
            "installation_requests",
            activeInstReq,
          );
          if (pushed) {
            // Update status of the project in production_projects to 'في انتظار التركيب' instead of deleting it!
            await updateRequestInDb("production_projects", prj.id, {
              status: "في انتظار التركيب",
              pipelineStages: prj.pipelineStages.map((st: any) => ({
                ...st,
                status: "Completed",
                completedAt: new Date().toISOString(),
              })),
              currentStageIndex: prj.pipelineStages.length - 1,
            });
            const realReqId =
              prj.requestId ||
              inboundRequests.find(
                (r) => r.quotationNumber === prj.quotationNumber,
              )?.id;
            if (realReqId) {
              await updateRequestInDb("sales_production_requests", realReqId, {
                status: "في انتظار التركيب",
              });
            }

            // Trigger 3 second Undo Toast (Luxurious requirement!)
            displayToast(
              lang === "ar"
                ? 'تم تحويل المشروع وتحديث حالته "في انتظار التركيب"'
                : "Project sent to Installation. Production complete.",
              "success",
              true,
              { prj, instId: activeInstReq.id },
            );

            loadAllData();
            setSelectedProject(null);
            setShowSequenceModal(false);
          }
        } else {
          // Advance to next stage simple
          const updatedStages = [...prj.pipelineStages];
          updatedStages[idx].completedAt = new Date().toISOString();
          updatedStages[idx + 1].status = "Current";

          const ok = await updateRequestInDb("production_projects", prj.id, {
            pipelineStages: updatedStages,
            currentStageIndex: idx + 1,
          });
          if (ok) {
            displayToast(
              lang === "ar"
                ? "تم إنهاء المرحلة والمضي قدماً بنجاح."
                : "Stage concluded!",
            );
            setInboundRequests((prev) =>
              prev.map((x) =>
                x.id === prj.id ? { ...x, pipelineStages: updatedStages, currentStageIndex: idx + 1 } : x,
              ),
            );
            setSelectedProject((prev: any) => prev ? {
              ...prev,
              pipelineStages: updatedStages,
              currentStageIndex: idx + 1
            } : prev);
            loadAllData();
          }
        }
      },
    });
  };

  // Restore/Undo Project completeness (Critical luxurious touch)
  const handleUndoCompletion = async (undoPayload: any) => {
    if (!undoPayload) return;

    if (undoPayload.type === "UNDO_PROD_ORDER") {
      const { prodOrderId, inboundId } = undoPayload;
      await updateRequestInDb("sales_production_requests", inboundId, {
        status: "تم استلام المواد",
        productionOrderNumber: null,
      });
      await deleteRecordInDb("production_orders", prodOrderId);
      displayToast(
        lang === "ar"
          ? "تم التراجع عن أمر الإنتاج وإعادة الطلب للحالة المستلمة والموردة"
          : "Undo completed. Returned to Inbox.",
      );
      loadAllData();
      return;
    }

    if (undoPayload.type === "UNDO_START_MANUFACTURING") {
      const { projectId, orderPayload } = undoPayload;
      await deleteRecordInDb("production_projects", projectId);
      await createRecordInDb("production_orders", orderPayload);
      await updateRequestInDb(
        "sales_production_requests",
        orderPayload.requestId,
        { status: "أمر إنتاج" },
      );
      displayToast(
        lang === "ar"
          ? "تم التراجع وإرجاع الطلب إلى أوامر الإنتاج بنجاح"
          : "Undo completed. Project returned to active production orders.",
      );
      loadAllData();
      return;
    }

    const { prj, instId } = undoPayload;

    const ok = await updateRequestInDb("production_projects", prj.id, {
      status: "قيد التنفيذ",
    });
    if (ok) {
      await deleteRecordInDb("installation_requests", instId);
      displayToast(
        lang === "ar"
          ? "تم التراجع وإرجاع المشروع لخانة التصنيع النشط"
          : "Undo completed. Project returned to workshop.",
      );
      loadAllData();
    }
  };

  // HELPER METRICS COLORS TIMER
  const renderRemainingTimerCard = (
    startDateStr: string,
    endDateStr: string,
    bufferDays: number,
  ) => {
    try {
      const totalDays =
        Math.ceil(
          (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) /
            (1000 * 3600 * 24),
        ) + Number(bufferDays);
      const remainingMs =
        new Date(endDateStr).getTime() +
        bufferDays * 24 * 3600 * 1000 -
        Date.now();
      const remainingDays = Math.ceil(remainingMs / (1000 * 3600 * 24));
      const remainingPercent =
        (remainingMs / (totalDays * 24 * 3600 * 1000)) * 100;

      let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100"; // Green >= 50%
      if (remainingPercent < 50 && remainingPercent >= 20) {
        colorClass = "bg-amber-50 text-amber-700 border-amber-100"; // Yellow
      } else if (remainingPercent < 20 && remainingDays >= 1) {
        colorClass = "bg-orange-50 text-orange-700 border-orange-100"; // Orange
      } else if (remainingDays < 1) {
        colorClass = "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"; // Red
      }

      if (remainingDays < 1) {
        // Counter switching to hours and minutes
        const diffHrs = Math.max(0, Math.floor(remainingMs / (1000 * 3600)));
        const diffMins = Math.max(
          0,
          Math.floor((remainingMs % (1000 * 3600)) / (1000 * 60)),
        );
        return (
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-black font-mono flex items-center gap-1.5 ${colorClass}`}
          >
            <Clock className="w-4 h-4 text-rose-500 animate-spin" />
            <span>
              {diffHrs} {lang === "ar" ? "ساعة" : "Hrs"} : {diffMins}{" "}
              {lang === "ar" ? "دقيقة" : "Mins"}
            </span>
          </div>
        );
      }

      return (
        <span
          className={`px-3 py-1 bg-white font-bold rounded-full text-xs font-mono border ${colorClass}`}
        >
          {remainingDays} {lang === "ar" ? "يوم متبقي" : "Days left"}
        </span>
      );
    } catch {
      return <span className="text-slate-400">---</span>;
    }
  };

  // INSTALLATION ACTIONS
  // 1. Set Location Maps
  const handleSaveInstallLocation = async () => {
    if (!selectedInstallReq) return;
    const ok = await updateRequestInDb(
      "installation_requests",
      selectedInstallReq.id,
      {
        installationStatus: "تم تحديد موقع التركيب",
        statusUpdatedBy: user?.username || "النظام",
        statusUpdatedAt: new Date().toISOString(),
        googleMapsLink: mapsLink,
      },
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? "تم تحديد وثيق موقع التركيب بالخريطة بنجاح"
          : "Coordinates documented!",
      );
      loadAllData();
      setShowLocationModal(false);
      setSelectedInstallReq(null);
    }
  };

  // 2. Set Crew
  const handleSaveInstallCrew = async () => {
    if (!selectedInstallReq) return;
    const ok = await updateRequestInDb(
      "installation_requests",
      selectedInstallReq.id,
      {
        installationStatus: "تم تعيين الفريق الميداني",
        statusUpdatedBy: user?.username || "النظام",
        statusUpdatedAt: new Date().toISOString(),
        assignedTeam: assignedCrew,
      },
    );
    if (ok) {
      displayToast(
        lang === "ar"
          ? "تم تعيين الطاقم وحفظ بيانات العاملين للموقع"
          : "Installation crew assigned!",
      );
      loadAllData();
      setShowInstallTeamModal(false);
      setSelectedInstallReq(null);
    }
  };

  // 3. Promote Request to Installation Order
  const handlePromoteToInstallOrder = async () => {
    if (!selectedInstallReq) return;

    const ord = {
      ...selectedInstallReq,
      id: `INO-${Date.now()}`,
      isOrder: true,
      orderedAt: new Date().toISOString(),
      installationStatus: "قيد التركيب الميداني",
      statusUpdatedBy: user?.username || "النظام",
      statusUpdatedAt: new Date().toISOString(),
    };

    const added = await createRecordInDb("installation_orders", ord);
    if (added) {
      await deleteRecordInDb("installation_requests", selectedInstallReq.id);
      const realReqId =
        selectedInstallReq.requestId ||
        inboundRequests.find(
          (r) => r.quotationNumber === selectedInstallReq.quotationNumber,
        )?.id;
      if (realReqId) {
        await updateRequestInDb("sales_production_requests", realReqId, {
          status: "في التركيب",
        });
      }

      displayToast(
        lang === "ar"
          ? "تم إنشاء أمر التركيب بنجاح وتم تحويل ملف المشروع."
          : "Installation Order activated!",
      );
      setInstallationPortal("orders");
      loadAllData();
      setSelectedInstallReq(null);
    }
  };

  // FETCH COLLECTION ADVANCED DETAILS
  const renderQuotationPaymentDetails = (qNo: string) => {
    const plan = collectionPlans.find(
      (p) => p.quotationNumber === qNo || p.id === qNo,
    );
    if (!plan || !plan.phases || plan.phases.length === 0) {
      return (
        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-100">
          ⚠️ {lang === "ar" ? "خطة التحصيل لم تبرم بعد" : "No Financial Plan"}
        </span>
      );
    }

    const firstPhase = plan.phases[0];
    const isPaid =
      firstPhase.status === "تم التحصيل" ||
      firstPhase.status === "تم التحصيل متأخر";
    return (
      <div className="flex flex-col gap-1">
        <span className="font-extrabold text-[11px] text-slate-800">
          {lang === "ar" ? "الدفعة الأولى حركياً" : "Payment #1"}:{" "}
          {firstPhase.stageName}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[9px] font-black inline-block text-center border ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {isPaid
            ? lang === "ar"
              ? "تم تحصيل الدفعة بنجاح"
              : "Paid"
            : lang === "ar"
              ? "معلق / بانتظار التحصيل"
              : "Pending"}
        </span>
      </div>
    );
  };

  const renderQuotationLastPaymentDetails = (qNo: string) => {
    const plan = collectionPlans.find(
      (p) => p.quotationNumber === qNo || p.id === qNo,
    );
    if (!plan || !plan.phases || plan.phases.length === 0) {
      return <span className="text-slate-400">---</span>;
    }
    const lastPhase = plan.phases[plan.phases.length - 1];
    const isPaid =
      lastPhase.status === "تم التحصيل" ||
      lastPhase.status === "تم التحصيل متأخر";
    return (
      <span
        className={`px-3 py-1 rounded-full border text-[10px] font-black inline-block ${
          isPaid
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}
      >
        {lastPhase.stageName} -{" "}
        {isPaid
          ? lang === "ar"
            ? "تم تسوية الدفعة الأخيرة"
            : "Settled"
          : lang === "ar"
            ? "معلقة للاستلام"
            : "Awaiting last receipt"}
      </span>
    );
  };

  // MONTHS DICTIONARY INDEX FOR FILTER
  const getMonthNumStr = (isoAtStr: string): string => {
    try {
      return String(new Date(isoAtStr).getMonth() + 1);
    } catch {
      return "";
    }
  };

  const getRepList = () => {
    const list = Array.from(
      new Set(inboundRequests.map((r) => r.createdBy || "")),
    );
    return list.filter(Boolean);
  };

  // FILTER LOGIC
  const inboundsViewAccess = getAdvancedPermissionScope(user, "production", "received", "view_received");
  const ordersViewAccess = getAdvancedPermissionScope(user, "production", "orders", "view_orders");
  const projectsViewAccess = getAdvancedPermissionScope(user, "production", "projects", "view_projects");
  const installsViewAccess = getAdvancedPermissionScope(user, "production", "installation", "view_install");

  const filteredInbounds = inboundRequests
    .filter((req) => {
      // Handle Completed vs Active
      const isCompleted = req.status === "تم التركيب بنجاح" || req.status === "تم التركيب والتشغيل";
      if (inboundPortal === "active" && isCompleted) return false;
      if (inboundPortal === "completed" && !isCompleted) return false;

      // Enforcement scope
      if (inboundsViewAccess === "own" && req.createdBy !== user.username)
        return false;

      if (
        inboundSearchCode &&
        !(
          req.requestNumber
            ?.toLowerCase()
            .includes(inboundSearchCode.toLowerCase()) ||
          req.quotationNumber
            ?.toLowerCase()
            .includes(inboundSearchCode.toLowerCase())
        )
      )
        return false;
      if (
        inboundSearchProject &&
        !req.projectName
          ?.toLowerCase()
          .includes(inboundSearchProject.toLowerCase())
      )
        return false;
      if (inboundRepFilter !== "all" && req.createdBy !== inboundRepFilter)
        return false;
      if (inboundMonthFilter !== "all") {
        const numStr = getMonthNumStr(req.createdAt);
        if (numStr !== inboundMonthFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.createdAt).getTime();
      const d2 = new Date(b.createdAt).getTime();
      return inboundSort === "newest" ? d2 - d1 : d1 - d2;
    });

  const filteredOrders = productionOrders
    .filter((req) => {
      // Hide completed
      if (req.status === "تم التركيب بنجاح" || req.status === "تم التركيب والتشغيل") return false;

      // Enforcement scope
      if (ordersViewAccess === "own" && req.createdBy !== user.username)
        return false;

      if (
        orderSearchNo &&
        !req.orderNumber?.toLowerCase().includes(orderSearchNo.toLowerCase())
      )
        return false;
      if (
        orderSearchQuote &&
        !req.quotationNumber
          ?.toLowerCase()
          .includes(orderSearchQuote.toLowerCase())
      )
        return false;
      if (orderMonth !== "all") {
        const numStr = getMonthNumStr(req.createdAt);
        if (numStr !== orderMonth) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.createdAt).getTime();
      const d2 = new Date(b.createdAt).getTime();
      return orderSort === "newest" ? d2 - d1 : d1 - d2;
    });

  const filteredProjects = activeProjects
    .filter((req) => {
      // Hide projects that have already been transferred to Installation
      if (
        req.status === "في انتظار التركيب" ||
        req.status === "في التركيب" ||
        req.status === "تم التركيب بنجاح" ||
        req.status === "تم التركيب والتشغيل"
      ) {
        return false;
      }

      if (projectsViewAccess === "own" && req.createdBy !== user.username)
        return false;

      if (
        activeSearch &&
        !req.projectName?.toLowerCase().includes(activeSearch.toLowerCase())
      )
        return false;
      if (
        activeQuoteSearch &&
        !req.quotationNumber
          ?.toLowerCase()
          .includes(activeQuoteSearch.toLowerCase())
      )
        return false;
      if (activeMonth !== "all") {
        const numStr = getMonthNumStr(req.startedAt);
        if (numStr !== activeMonth) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = new Date(a.startedAt).getTime();
      const d2 = new Date(b.startedAt).getTime();
      return activeSort === "newest" ? d2 - d1 : d1 - d2;
    });

  const filteredInstalls = (
    installationPortal === "requests"
      ? installationRequests
      : installationOrders
  ).filter((req) => {
    // Hide completed
    if (req.installationStatus === "تم التركيب بنجاح" || req.installationStatus === "تم التركيب والتشغيل") return false;

    if (installsViewAccess === "own" && req.createdBy !== user.username)
      return false;

    if (
      installSearch &&
      !req.projectName?.toLowerCase().includes(installSearch.toLowerCase())
    )
      return false;
    if (installMonth !== "all") {
      const numStr = getMonthNumStr(req.requestDate);
      if (numStr !== installMonth) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification with Luxurious Undo Support */}
      {toast && (
        <div
          id="production-top-toast"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4 animate-in slide-in-from-top duration-300"
        >
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <p className="text-xs font-bold leading-normal">{toast.msg}</p>
            </div>
            {toast.showUndo && (
              <button
                onClick={() => handleUndoCompletion(toast.undoPayload)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition"
              >
                ↩️ {lang === "ar" ? "تراجع" : "Undo"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB SECTION */}

      {/* SUB-TAB 0: DASHBOARD */}
      {activeSubTab === "prod_dashboard" && (
        <ProductionDashboard
          lang={lang}
          user={user}
          inboundRequests={inboundRequests}
          productionOrders={productionOrders}
          activeProjects={activeProjects}
          procurementRequests={procurementRequests}
          installationRequests={installationRequests}
          installationOrders={installationOrders}
          onSelectSubTab={onSelectSubTab}
        />
      )}

      {/* SUB-TAB 0.5: DAILY FOLLOWUP */}
      {activeSubTab === "prod_daily_followup" && (
        <DailyProductionFollowup
          lang={lang}
          user={user}
          activeProjects={activeProjects}
          procurementRequests={procurementRequests}
          installationOrders={installationOrders}
          onSelectSubTab={onSelectSubTab}
          onDeleteProject={async (id) => {
            const ok = await deleteRecordInDb("production_projects", id);
            if (ok) {
              loadAllData();
              setToast({ msg: lang === "ar" ? "تم حذف المشروع بنجاح" : "Project deleted successfully", type: "success" });
            } else {
              setToast({ msg: lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting project", type: "err" });
            }
          }}
        />
      )}

      {/* SUB-TAB 1: RECEIVED PRODUCTION REQUESTS */}
      {activeSubTab === "prod_inbound" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-7 h-7 text-[#0072BC]" />
                {lang === "ar"
                  ? "طلبات الإنتاج المستلمة"
                  : "Inbound Production Requests"}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5">
                {lang === "ar"
                  ? "مركز مراقبة ومعاينة الطلبات والاعتمادات المحولة مع كشوف المبيعات للمشروع."
                  : "Simulated workshop control and AutoCAD drawing checklists."}
              </p>
            </div>
            {/* Portal toggle bar */}
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              <button
                onClick={() => setInboundPortal("active")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${
                  inboundPortal === "active"
                    ? "bg-white text-indigo-700 shadow-md"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                📬{" "}
                {lang === "ar"
                  ? "الطلبات النشطة"
                  : "Active Requests"}
              </button>
              <button
                onClick={() => setInboundPortal("completed")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${
                  inboundPortal === "completed"
                    ? "bg-[#059669] text-white shadow-md"
                    : "text-slate-500 hover:text-emerald-600"
                }`}
              >
                ✅{" "}
                {lang === "ar"
                  ? "بوابة المشاريع المنتهية"
                  : "Completed Projects Portal"}
              </button>
            </div>
          </div>

          {/* Search filters block */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "رقم الكوتيشن" : "Quote ID"}
              </label>
              <input
                type="text"
                placeholder="QT-..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white"
                value={inboundSearchCode}
                onChange={(e) => setInboundSearchCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "اسم المشروع" : "Project Name"}
              </label>
              <input
                type="text"
                placeholder={
                  lang === "ar" ? "مثال: مشروع البنك..." : "Search title..."
                }
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white"
                value={inboundSearchProject}
                onChange={(e) => setInboundSearchProject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "المندوب كاتب الطلب" : "Sales Rep"}
              </label>
              <select
                value={inboundRepFilter}
                onChange={(e) => setInboundRepFilter(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white"
              >
                <option value="all">
                  👤 {lang === "ar" ? "جميع المناديب" : "All Reps"}
                </option>
                {getRepList().map((rep) => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "الشهر بالإنجليزية" : "Month"}
              </label>
              <select
                value={inboundMonthFilter}
                onChange={(e) => setInboundMonthFilter(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white"
              >
                <option value="all">
                  📅 {lang === "ar" ? "جميع الشهور" : "All Months"}
                </option>
                <option value="1">1 - January</option>
                <option value="2">2 - February</option>
                <option value="3">3 - March</option>
                <option value="4">4 - April</option>
                <option value="5">5 - May</option>
                <option value="6">6 - June</option>
                <option value="7">7 - July</option>
                <option value="8">8 - August</option>
                <option value="9">9 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "تاريخ التقديم" : "Sorters"}
              </label>
              <select
                value={inboundSort}
                onChange={(e) => setInboundSort(e.target.value as any)}
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none focus:bg-white"
              >
                <option value="newest">
                  📅 {lang === "ar" ? "من قادم للأحدث" : "Newest"}
                </option>
                <option value="oldest">
                  📅 {lang === "ar" ? "من أقدم للأحدث" : "Oldest"}
                </option>
              </select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {bulkSelectedIds.length > 0 && inboundPortal === "active" && (
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-full">
                  {bulkSelectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {lang === "ar"
                    ? "طلبات محددة حالياً للتعميد الجماعي"
                    : "items selected for bulk operations"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkPrint}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة PDF" : "Print PDF"}
                </button>
                <button
                  onClick={handleBulkConfirmReceipt}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  📥{" "}
                  {lang === "ar"
                    ? "تعميد واستلام العناصر المحددة للإنتاج"
                    : "Receive Selected Requests"}
                </button>
                <button
                  onClick={() => setBulkSelectedIds([])}
                  className="px-4 py-2 bg-white text-slate-500 hover:text-slate-700 border rounded-xl font-black text-xs cursor-pointer transition"
                >
                  {lang === "ar" ? "إلغاء التحديد" : "Deselect All"}
                </button>
              </div>
            </div>
          )}

          {/* Elegant Strips list display */}
          <div className="space-y-3.5 flex flex-col">
            {filteredInbounds.map((req) => {
              const isSelected = bulkSelectedIds.includes(req.id);
              return (
                <div
                  key={req.id}
                  className={`bg-white p-4 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-300 shadow-sm"
                      : "border-slate-150 hover:border-slate-250 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 select-none">
                    {inboundPortal === "active" && (
                      <input
                        type="checkbox"
                        id={`chk-inbound-${req.id}`}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setBulkSelectedIds((prev) => [...prev, req.id]);
                          else
                            setBulkSelectedIds((prev) =>
                              prev.filter((id) => id !== req.id),
                            );
                        }}
                        className="w-4 h-4 cursor-pointer accent-indigo-600 rounded shrink-0"
                      />
                    )}
                    <label
                      htmlFor={`chk-inbound-${req.id}`}
                      className={`flex items-center gap-3 w-full ${inboundPortal === "active" ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span className="font-mono font-extrabold text-[10px] bg-slate-100 text-indigo-700 px-2.5 py-1 rounded-lg shrink-0">
                        {req.requestNumber || "PR-REF"}
                      </span>
                      <div className="space-y-0.5 text-right flex-1">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {req.projectName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          {lang === "ar" ? "الكوتيشن:" : "Quote:"}{" "}
                          <span className="text-slate-600 font-mono font-semibold">
                            {req.quotationNumber}
                          </span>
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-[11px] text-slate-500 font-bold bg-slate-50/70 p-2.5 px-4 rounded-xl border border-slate-100 shrink-0">
                    <div>
                      <span className="text-slate-400 block text-[9px]">
                        {lang === "ar" ? "المندوب:" : "Rep:"}
                      </span>
                      <span className="text-[#0072BC] font-extrabold">
                        {req.createdBy}
                      </span>
                    </div>
                    <div className="border-r border-slate-200 h-6 hidden sm:block"></div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">
                        {lang === "ar"
                          ? "تاريخ التسليم المتوقع:"
                          : "Expected Delivery:"}
                      </span>
                      <span className="text-emerald-700 font-extrabold">
                        {req.completionDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-end">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${getStatusColors(req.status)}`}
                    >
                      {req.status}
                    </span>
                    <button
                      onClick={() => handleViewInboundDetails(req)}
                      className="px-4 py-2 bg-slate-100 hover:bg-[#0072BC] text-slate-700 hover:text-white rounded-xl transition font-black text-[10px] cursor-pointer"
                    >
                      🛠️{" "}
                      {lang === "ar"
                        ? "عرض الاعتمادات والتفاصيل"
                        : "Configure Blueprint"}
                    </button>
                    {isOwnerOrAdmin && inboundPortal === "active" && (
                      <button
                        onClick={() =>
                          handleAdminDelete(
                            "sales_production_requests",
                            req.id,
                            req.projectName,
                          )
                        }
                        className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition font-black text-[10px] cursor-pointer"
                        title={
                          lang === "ar" ? "حذف نهائي (إدارة)" : "Admin Delete"
                        }
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredInbounds.length === 0 && (
              <div className="bg-white p-12 text-center text-slate-400 font-bold text-xs rounded-2xl border border-dashed border-slate-200">
                {lang === "ar"
                  ? "لم يعثر على أية طلبات تملك نفس معايير الفلترة."
                  : "No matched items found."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ORDUN PRODUCTION ORDERS */}
      {activeSubTab === "prod_orders" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              {lang === "ar"
                ? "أوامر تصنيع وإنتاج الهياكل واللوحات"
                : "Production Manufacturing Orders"}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">
              {lang === "ar"
                ? "تخطيط، جدولة وإسناد الطاقة الإنتاجية للعمالة وتثبيت مسار توريد المواد."
                : "Track scheduling, technician crew and materials allocation for active runs."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "رقم أمر الإنتاج" : "Order ID"}
              </label>
              <input
                type="text"
                placeholder="ORD-..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={orderSearchNo}
                onChange={(e) => setOrderSearchNo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "رقم الكوتيشن" : "Quote Ref"}
              </label>
              <input
                type="text"
                placeholder="QT-..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={orderSearchQuote}
                onChange={(e) => setOrderSearchQuote(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "حسب الشهر" : "Month"}
              </label>
              <select
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={orderMonth}
                onChange={(e) => setOrderMonth(e.target.value)}
              >
                <option value="all">
                  📅 {lang === "ar" ? "كل الشهور" : "All Months"}
                </option>
                <option value="1">1 - January</option>
                <option value="2">2 - February</option>
                <option value="3">3 - March</option>
                <option value="4">4 - April</option>
                <option value="5">5 - May</option>
                <option value="6">6 - June</option>
                <option value="7">7 - July</option>
                <option value="8">8 - August</option>
                <option value="9">9 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "ترتيب النتائج" : "Sort"}
              </label>
              <select
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={orderSort}
                onChange={(e) => setOrderSort(e.target.value as any)}
              >
                <option value="newest">
                  ⚙️ {lang === "ar" ? "الأحدث أولاً" : "Newest"}
                </option>
                <option value="oldest">
                  ⚙️ {lang === "ar" ? "الأقدم أولاً" : "Oldest"}
                </option>
              </select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {bulkSelectedIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-full">
                  {bulkSelectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {lang === "ar"
                    ? "أوامر تصنيع محددة حالياً للتشغيل الجماعي"
                    : "manufacturing orders selected"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkPrint}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة PDF" : "Print PDF"}
                </button>
                <button
                  onClick={handleBulkStartManufacturing}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🚀{" "}
                  {lang === "ar"
                    ? "بدء تصنيع المحدد دفعة واحدة"
                    : "Bulk Start Manufacturing"}
                </button>
                <button
                  onClick={() => setBulkSelectedIds([])}
                  className="px-4 py-2 bg-white text-slate-500 hover:text-slate-700 border rounded-xl font-black text-xs cursor-pointer transition"
                >
                  {lang === "ar" ? "إلغاء التحديد" : "Deselect All"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 flex flex-col">
            {filteredOrders.map((ord) => {
              const isExpanded = expandedOrderId === ord.id;
              const isSelected = bulkSelectedIds.includes(ord.id);

              // Find matching material procurement request
              const associatedProc = procurementRequests.find(
                (p) =>
                  p.projectId === ord.requestId ||
                  p.quotationNumber === ord.quotationNumber,
              );

              // Find matching quotation items to list inside expanded card
              const matchedQuote =
                salesQuotations.find(
                  (q) => q.quotationNumber === ord.quotationNumber,
                ) ||
                quotations.find(
                  (q) => q.quotationNumber === ord.quotationNumber,
                );

              return (
                <div
                  key={ord.id}
                  className={`bg-white p-5 rounded-2xl border transition flex flex-col space-y-4 w-full ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-300 shadow-sm"
                      : "border-slate-150 hover:border-slate-250 hover:shadow-sm"
                  }`}
                >
                  {/* Top Header - main row which is always visible */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl w-full gap-4">
                    <div className="flex items-center gap-3.5 flex-1 select-none">
                      <input
                        type="checkbox"
                        id={`chk-order-${ord.id}`}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setBulkSelectedIds((prev) => [...prev, ord.id]);
                          else
                            setBulkSelectedIds((prev) =>
                              prev.filter((id) => id !== ord.id),
                            );
                        }}
                        className="w-4 h-4 cursor-pointer accent-indigo-600 rounded shrink-0"
                      />
                      <label
                        htmlFor={`chk-order-${ord.id}`}
                        className="flex items-center gap-3 cursor-pointer w-full text-right"
                      >
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 font-black rounded-lg font-mono shrink-0">
                          {ord.orderNumber}
                        </span>
                        <div className="space-y-0.5 flex-1">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {ord.projectName}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {lang === "ar" ? "منشئ الأمر: " : "Created by: "}{" "}
                            <span className="text-slate-600 font-semibold">
                              {ord.createdBy}
                            </span>{" "}
                            | {lang === "ar" ? "التوجيه: " : "Routing: "}{" "}
                            <span className="text-slate-600 font-mono font-bold">
                              {new Date(ord.createdAt).toLocaleDateString(
                                "ar-SA",
                              )}
                            </span>
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() =>
                            handleAdminDelete(
                              "production_orders",
                              ord.id,
                              ord.projectName,
                            )
                          }
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition font-black text-[10px] cursor-pointer border border-red-100"
                          title={
                            lang === "ar" ? "حذف نهائي (إدارة)" : "Admin Delete"
                          }
                        >
                          🗑️
                        </button>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black bg-white border border-slate-150 px-3 py-1.5 rounded-lg">
                        <span>👥 {ord.assignedTeam?.length || 0} عمال</span>
                        <span className="text-slate-300">|</span>
                        <span>
                          {ord.isTimelineConfirmed ? "📅 مؤرخ" : "⚠️ غير مجدول"}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : ord.id)
                        }
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-[#0072BC] rounded-full transition cursor-pointer shadow-sm shrink-0"
                        title={
                          lang === "ar"
                            ? "إظهار / إخفاء التفاصيل والسهم"
                            : "Toggle details"
                        }
                      >
                        <span
                          className={`block transform transition-transform duration-350 font-bold text-xs ${isExpanded ? "rotate-180" : "rotate-0"}`}
                        >
                          ▲
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible expanded section of details & action buttons */}
                  {isExpanded && (
                    <div
                      className="pt-2 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-3 duration-200 text-right w-full"
                      dir="rtl"
                    >
                      {/* Meta detailed Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl text-[11px] leading-relaxed font-semibold text-slate-600 border border-slate-50">
                        <p>
                          {lang === "ar"
                            ? "رقم الكوتيشن المعتمد:"
                            : "Approved Quote:"}{" "}
                          <strong className="text-slate-900 font-mono block mt-0.5">
                            {ord.quotationNumber}
                          </strong>
                        </p>
                        <p>
                          {lang === "ar"
                            ? "تاريخ استلام الخامات بالمشتريات:"
                            : "Sourcing Receipt Settle Date:"}{" "}
                          <strong className="text-slate-905 block mt-0.5">
                            {associatedProc?.receivedAt
                              ? new Date(
                                  associatedProc.receivedAt,
                                ).toLocaleDateString("ar-SA")
                              : lang === "ar"
                                ? "تم استلام الخامات وتوريدها للورشة"
                                : "Materials received"}
                          </strong>
                        </p>
                      </div>

                      {/* Signage specs requested from the approved quotation */}
                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-black text-slate-500">
                          📋{" "}
                          {lang === "ar"
                            ? "الأصناف الهيكلية والتفاصيل المطلوبة بالطلب:"
                            : "Signage Items Specifications:"}
                        </span>
                        {!matchedQuote ||
                        !matchedQuote.items ||
                        matchedQuote.items.length === 0 ? (
                          <p className="text-slate-400 italic text-[10px] font-bold">
                            {lang === "ar"
                              ? "لم يعثر على بنود كمية مخصصة للطلب."
                              : "No items recorded."}
                          </p>
                        ) : (
                          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white text-[11px]">
                            <table className="w-full text-right text-slate-600">
                              <thead className="bg-slate-50 font-bold text-slate-400">
                                <tr className="border-b">
                                  <th className="p-2">
                                    {lang === "ar" ? "اسم الصنف" : "Item Name"}
                                  </th>
                                  <th className="p-2 text-center">
                                    {lang === "ar" ? "الكمية المطلوبة" : "Qty"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 font-medium">
                                {matchedQuote.items.map(
                                  (it: any, i: number) => (
                                    <tr
                                      key={i}
                                      className="hover:bg-slate-50/50"
                                    >
                                      <td className="p-2 font-bold text-slate-800">
                                        {it.itemName ||
                                          it.itemNameAr ||
                                          it.descriptionAr ||
                                          it.description ||
                                          "---"}
                                      </td>
                                      <td className="p-2 text-center text-slate-500 font-mono font-bold">
                                        {it.quantity || it.qty || 1}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Design Sheet / AutoCAD sheet linkage */}
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                        <span className="font-bold text-slate-500">
                          📐{" "}
                          {lang === "ar"
                            ? "ورقة التصميم الرسمية والرسومات أوتوكاد:"
                            : "Official Design Blueprint:"}
                        </span>
                        {ord.designLink ? (
                          <a
                            href={ord.designLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-indigo-600 hover:bg-[#0072BC] text-white rounded-lg font-black inline-flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {lang === "ar"
                              ? "عرض الرسومات والأوتوكاد"
                              : "Open file"}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic font-bold">
                            {lang === "ar" ? "لا يوجد ملف مرفق" : "No folder"}
                          </span>
                        )}
                      </div>

                      {/* The FOUR action buttons inline in the expanded view! */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t">
                        {/* Button 1: تحديد فريق الإنتاج */}
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setAssignedCrew(ord.assignedTeam || []);
                            setTempCrewRows(
                              (ord.assignedTeam || []).map((name: string) => {
                                const emp = employees.find((e: any) => (e.arabicName || e.englishName || e.name) === name);
                                if (emp) {
                                  return {
                                    name,
                                    nationality: (emp as any).nationality || "سعودي",
                                    role: (emp as any).jobTitle || (emp as any).role || (emp as any).department || "عامل تصنيع",
                                    experience: `${(emp as any).experienceYears || 2} سنة`,
                                    lastProject: "---", // We don't have activeProjects here easily, so just default
                                    isConfirmed: true
                                  };
                                }
                                return { name, isConfirmed: true };
                              }),
                            );
                            setShowAssignTeam(true);
                          }}
                          className={`px-2.5 py-2.5 border rounded-xl transition text-[10px] font-black cursor-pointer inline-flex items-center justify-center gap-1 ${ord.assignedTeam && ord.assignedTeam.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900'}`}
                        >
                          👥{" "}
                          {lang === "ar"
                            ? "تحديد فريق الإنتاج"
                            : "Specify Crew"}
                        </button>

                        {/* Button 2: تحديد وقت بداية وانتهاء المشروع */}
                        {ord.isTimelineConfirmed ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setStartDate(ord.startDate || "");
                              setEndDate(ord.endDate || "");
                              setBufferDays(ord.bufferDays || 0);
                              setShowTimelineDetailsModal(true);
                            }}
                            className="px-2.5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl transition text-[10px] font-black cursor-pointer inline-flex items-center justify-center gap-1 text-center"
                          >
                            ⭐{" "}
                            {lang === "ar"
                              ? `وقت المشروع: ${Math.ceil((new Date(ord.endDate).getTime() - new Date(ord.startDate).getTime()) / (1000 * 3600 * 24)) + Number(ord.bufferDays || 0)} يوم`
                              : "Cushion Days"}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setStartDate(ord.startDate || "");
                              setEndDate(ord.endDate || "");
                              setBufferDays(ord.bufferDays || 0);
                              setShowDatesForm(true);
                            }}
                            className="px-2.5 py-2.5 bg-slate-100 hover:bg-amber-50 border hover:border-amber-200 text-slate-700 hover:text-amber-900 rounded-xl transition text-[10px] font-black cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            📅{" "}
                            {lang === "ar"
                              ? "تحديد وقت المشروع"
                              : "Specify Dates"}
                          </button>
                        )}

                        {/* Button 3: تحديد مسار خط الإنتاج */}
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setStages(
                              ord.pipelineStages || [
                                {
                                  name: "تصميم الهيكل الحديدي",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "بناء الحروف والاكريليك",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "التمديد الكهربائي والـ LED",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "اختبار الجودة QC والتشطيب المالي",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                              ],
                            );
                            setShowPathForm(true);
                          }}
                          className="px-2.5 py-2.5 bg-slate-100 hover:bg-indigo-50 border border-slate-100 text-slate-700 hover:text-indigo-900 rounded-xl transition text-[10px] font-black cursor-pointer inline-flex items-center justify-center gap-1"
                        >
                          ⛓️{" "}
                          {lang === "ar"
                            ? "تحديد مسار الإنتاج"
                            : "Define Pipeline"}
                        </button>

                        {/* Button 4: بدء التصنيع */}
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setStartDate(ord.startDate || "");
                            setEndDate(ord.endDate || "");
                            setBufferDays(ord.bufferDays || 0);
                            setStages(
                              ord.pipelineStages || [
                                {
                                  name: "تصميم الهيكل الحديدي",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "بناء الحروف والاكريليك",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "التمديد الكهربائي والـ LED",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                                {
                                  name: "اختبار الجودة QC والتشطيب المالي",
                                  expectedDate: "",
                                  requiresPayment: false,
                                  notes: "",
                                },
                              ],
                            );
                            setShowStartManufacturingModal(true);
                          }}
                          className="px-2.5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition text-[10px] font-black cursor-pointer inline-flex items-center justify-center gap-1 shadow-md"
                        >
                          🚀 {lang === "ar" ? "بدء التصنيع" : "Start Plant"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="bg-white p-12 text-center text-slate-400 font-bold text-xs rounded-2xl border border-dashed border-slate-200">
                {lang === "ar"
                  ? "لا يوجد أوامر تصنيع قيد التهيئة حالياً."
                  : "No items."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: THE HIGH FIELD MANUFACTURING PROJECTS TIMER SCREEN */}
      {activeSubTab === "prod_active_projects" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-7 h-7 text-emerald-600" />
              {lang === "ar"
                ? "مشاريع القاعة والإنتاج النشطة"
                : "Active Manufacturing Hall"}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">
              {lang === "ar"
                ? "غرفة المتابعة الفورية والتنبيه العريض لمطابقة مواقيت التسليم بالتوقيت الزمني الحقيقي."
                : "Monitor stopwatch metrics and real-time step pipelines."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "بحث عن المشروع" : "Project"}
              </label>
              <input
                type="text"
                placeholder="..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "رقم الكوتيشن" : "Quote ID"}
              </label>
              <input
                type="text"
                placeholder="..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={activeQuoteSearch}
                onChange={(e) => setActiveQuoteSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "تاريخ البدء بالشهر" : "Month"}
              </label>
              <select
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
              >
                <option value="all">
                  📅 {lang === "ar" ? "كل الشهور" : "All Months"}
                </option>
                <option value="1">1 - January</option>
                <option value="2">2 - February</option>
                <option value="3">3 - March</option>
                <option value="4">4 - April</option>
                <option value="5">5 - May</option>
                <option value="6">6 - June</option>
                <option value="7">7 - July</option>
                <option value="8">8 - August</option>
                <option value="9">9 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "الترتيب الزمني" : "Sort"}
              </label>
              <select
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as any)}
              >
                <option value="newest">
                  🕒 {lang === "ar" ? "الأحدث للإنتاج" : "Newest"}
                </option>
                <option value="oldest">
                  🕒 {lang === "ar" ? "الأقدم للإنتاج" : "Oldest"}
                </option>
              </select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {bulkSelectedIds.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-600 text-white font-black px-2.5 py-1 rounded-full">
                  {bulkSelectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {lang === "ar"
                    ? "مشاريع محددة للترحيل الجماعي"
                    : "active projects selected"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkPrint}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة PDF" : "Print PDF"}
                </button>
                <button
                  onClick={handleBulkCompleteProjects}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🚚{" "}
                  {lang === "ar"
                    ? "تحويل المحددين للتركيب الميداني (حالة في انتظار التركيب)"
                    : "Bulk Complete to Installation"}
                </button>
                <button
                  onClick={() => setBulkSelectedIds([])}
                  className="px-4 py-2 bg-white text-slate-500 hover:text-slate-700 border rounded-xl font-black text-xs cursor-pointer transition"
                >
                  {lang === "ar" ? "إلغاء التحديد" : "Deselect All"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 flex flex-col">
            {filteredProjects.map((prj) => {
              const isSelected = bulkSelectedIds.includes(prj.id);
              return (
                <div
                  key={prj.id}
                  className={`bg-white p-5 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full ${
                    isSelected
                      ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                      : "border-slate-150 hover:border-slate-250 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 select-none text-right">
                    <input
                      type="checkbox"
                      id={`chk-proj-${prj.id}`}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked)
                          setBulkSelectedIds((prev) => [...prev, prj.id]);
                        else
                          setBulkSelectedIds((prev) =>
                            prev.filter((id) => id !== prj.id),
                          );
                      }}
                      className="w-4 h-4 cursor-pointer accent-emerald-600 rounded shrink-0"
                    />
                    <label
                      htmlFor={`chk-proj-${prj.id}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer flex-1"
                    >
                      <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 font-black rounded-lg font-mono shrink-0">
                        {prj.projectNumber || "PRJ-REF"}
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-indigo-950 text-sm truncate max-w-xs">
                          {prj.projectName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          {lang === "ar" ? "الكوتيشن المرتبط:" : "Quote:"}{" "}
                          <span className="text-slate-600 font-mono font-bold">
                            {prj.quotationNumber}
                          </span>
                          {prj.status && (
                            <span
                              className={`mr-2 px-2 py-0.5 rounded-full text-[9px] font-black ${getStatusColors(prj.status)}`}
                            >
                              {prj.status}
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Progress bar of current pipeline stage */}
                  {prj.pipelineStages && prj.pipelineStages.length > 0 && (
                    <div className="space-y-1.5 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs min-w-[220px] shrink-0">
                      <div className="flex justify-between text-[10px] font-black gap-4">
                        <span className="text-indigo-600">
                          {lang === "ar"
                            ? "المرحلة النشطة حالياً:"
                            : "Active stage:"}
                        </span>
                        <span className="text-slate-700">
                          {prj.pipelineStages[prj.currentStageIndex]?.name ||
                            "---"}
                        </span>
                      </div>
                      {/* Completion rate percentage indicator */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 transition-all duration-500"
                          style={{
                            width: `${Math.round((prj.currentStageIndex / prj.pipelineStages.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic workdays color calculator indicator */}
                  <div className="shrink-0 flex items-center justify-center">
                    {renderRemainingTimerCard(
                      prj.startDate,
                      prj.endDate,
                      prj.bufferDays || 0,
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => {
                        setSelectedProject(prj);
                        setShowSequenceModal(true);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-[10px] font-black cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
                    >
                      ⛓️{" "}
                      {lang === "ar"
                        ? "تسلسل مراحل الإنتاج"
                        : "Trace Pipeline Run"}
                    </button>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() =>
                          handleAdminDelete(
                            "production_projects",
                            prj.id,
                            prj.projectName,
                          )
                        }
                        className="px-3 py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition font-black text-[10px] cursor-pointer"
                        title={
                          lang === "ar" ? "حذف نهائي (إدارة)" : "Admin Delete"
                        }
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedInbound({ ...prj, isProject: true });
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-[10px] font-black cursor-pointer"
                    >
                      🔍 {lang === "ar" ? "عرض التفاصيل" : "Specs"}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="bg-white p-12 text-center text-slate-400 font-bold text-xs rounded-2xl border border-dashed border-slate-200">
                {lang === "ar"
                  ? "لا توجود مشاريع تصنيع في قاعة الإنتاج النشطة حالياً."
                  : "Floor empty."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: INSTALLATION DEPARTMENT (Two portals inside) */}
      {activeSubTab === "prod_installation" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-7 h-7 text-indigo-700" />
                {lang === "ar"
                  ? "قسم وإدارة التركيـبات والتشغيل الميداني"
                  : "Field Siting & Commissioning"}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5">
                {lang === "ar"
                  ? "محاكاة وإرسال قوافل الفنيين لتركيب اللوحات والمطابقة الموضعية للـ GPS."
                  : "Assign locations, field crew, and finalize commissioning logs."}
              </p>
            </div>

            {/* Portal toggle bar */}
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              <button
                onClick={() => setInstallationPortal("requests")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${
                  installationPortal === "requests"
                    ? "bg-white text-indigo-700 shadow-md"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                📬{" "}
                {lang === "ar"
                  ? "بوابة طلبات التركيب"
                  : "Installation Siting Requests"}
              </button>
              <button
                onClick={() => setInstallationPortal("orders")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${
                  installationPortal === "orders"
                    ? "bg-[#0072BC] text-white shadow-md"
                    : "text-slate-500 hover:text-[#0072BC]"
                }`}
              >
                🚚{" "}
                {lang === "ar"
                  ? "بوابة أوامر التركيب"
                  : "Installation Active Orders"}
              </button>
            </div>
          </div>

          {/* Search bar specifically for installation */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "بحث باسم المشروع" : "Project Name"}
              </label>
              <input
                type="text"
                placeholder="..."
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={installSearch}
                onChange={(e) => setInstallSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-1">
                {lang === "ar" ? "بحث عن طريق الشهر" : "Filter by Month"}
              </label>
              <select
                className="w-full p-2.5 text-xs border rounded-xl font-bold bg-slate-50 outline-none"
                value={installMonth}
                onChange={(e) => setInstallMonth(e.target.value)}
              >
                <option value="all">
                  📅 {lang === "ar" ? "كل الشهور" : "All Months"}
                </option>
                <option value="1">1 - January</option>
                <option value="2">2 - February</option>
                <option value="3">3 - March</option>
                <option value="4">4 - April</option>
                <option value="5">5 - May</option>
                <option value="6">6 - June</option>
                <option value="7">7 - July</option>
                <option value="8">8 - August</option>
                <option value="9">9 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {bulkSelectedIds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-full">
                  {bulkSelectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700 text-right">
                  {lang === "ar"
                    ? `أوامر تركيب محددة جاري تنسيقها`
                    : "installation items selected"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkPrint}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة PDF" : "Print PDF"}
                </button>
                {installationPortal === "requests" ? (
                  <button
                    onClick={handleBulkPromoteToInstallOrders}
                    className="px-4 py-2 bg-[#0072BC] hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                  >
                    🚀{" "}
                    {lang === "ar"
                      ? "تفعيل وإنشاء أوامر تركيب دفعة واحدة للمحددين"
                      : "Bulk Activate Install Orders"}
                  </button>
                ) : (
                  <button
                    onClick={handleBulkCompleteInstallOrders}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer transition shadow"
                  >
                    ✅{" "}
                    {lang === "ar"
                      ? "إنهاء وإغلاق ملف التركيب دفعة واحدة للمحددين"
                      : "Bulk Complete Install Orders"}
                  </button>
                )}
                <button
                  onClick={() => setBulkSelectedIds([])}
                  className="px-4 py-2 bg-white text-slate-500 hover:text-slate-700 border rounded-xl font-black text-xs cursor-pointer transition"
                >
                  {lang === "ar" ? "إلغاء التحديد" : "Deselect All"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 flex flex-col">
            {filteredInstalls.map((req) => {
              const isSelected = bulkSelectedIds.includes(req.id);
              return (
                <div
                  key={req.id}
                  className={`bg-white p-5 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-300 shadow-sm"
                      : "border-slate-150 hover:border-slate-250 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 select-none text-right">
                    <input
                      type="checkbox"
                      id={`chk-install-${req.id}`}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked)
                          setBulkSelectedIds((prev) => [...prev, req.id]);
                        else
                          setBulkSelectedIds((prev) =>
                            prev.filter((id) => id !== req.id),
                          );
                      }}
                      className="w-4 h-4 cursor-pointer accent-indigo-600 rounded shrink-0"
                    />
                    <label
                      htmlFor={`chk-install-${req.id}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer flex-1"
                    >
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 font-black rounded-lg font-mono shrink-0">
                        {req.projectNumber || "PRJ-REF"}
                      </span>
                      <div className="space-y-0.5 text-right flex-1">
                        <h4 className="font-extrabold text-indigo-950 text-sm">
                          {req.projectName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          العميل:{" "}
                          <span className="text-slate-700 font-bold">
                            {req.clientName}
                          </span>{" "}
                          | كوتيشن:{" "}
                          <span className="text-[#0072BC] font-mono font-bold">
                            {req.quotationNumber}
                          </span>
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {(req.statusUpdatedBy || req.confirmedBy) && (
                      <div className="text-[10px] text-slate-400 font-bold text-right px-1">
                        بواسطة: {req.statusUpdatedBy || req.confirmedBy}{" "}
                        {req.statusUpdatedAt || req.completedAt
                          ? ` بتاريخ: ${new Date(req.statusUpdatedAt || req.completedAt).toLocaleDateString("ar-SA")}`
                          : ""}
                      </div>
                    )}
                    {/* Info block */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-600 flex flex-wrap items-center gap-4 lg:gap-6 text-right">
                      <div>
                        <span className="text-slate-400 block text-[9px]">
                          👤 {lang === "ar" ? "المندوب:" : "Rep:"}
                        </span>
                        <strong className="text-slate-700">
                          {req.salesRep || "---"}
                        </strong>
                      </div>
                      <div className="border-r border-slate-200 h-6 hidden sm:block text-slate-200"></div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">
                          📞 {lang === "ar" ? "جوال العميل:" : "Client Phone:"}
                        </span>
                        <strong className="font-mono text-slate-700">
                          {getClientPhone(
                            req.clientName,
                            req.quotationNumber,
                            req.clientId,
                          )}
                        </strong>
                      </div>
                      <div className="border-r border-slate-200 h-6 hidden sm:block text-slate-200"></div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">
                          📅 {lang === "ar" ? "تاريخ التأسيس:" : "Date:"}
                        </span>
                        <strong className="text-slate-700">
                          {req.requestDate
                            ? new Date(req.requestDate).toLocaleDateString(
                                "ar-SA",
                              )
                            : "---"}
                        </strong>
                      </div>
                      {req.googleMapsLink && (
                        <>
                          <div className="border-r border-slate-200 h-6 hidden sm:block text-slate-200"></div>
                          <div className="max-w-[150px] truncate">
                            <span className="text-slate-400 block text-[9px]">
                              📍 الخريطة:
                            </span>
                            <a
                              href={req.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-bold text-indigo-700"
                            >
                              {req.googleMapsLink}
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() =>
                          handleAdminDelete(
                            installationPortal === "orders"
                              ? "installation_orders"
                              : "installation_requests",
                            req.id,
                            req.projectName,
                          )
                        }
                        className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition font-black text-[10px] cursor-pointer"
                        title={
                          lang === "ar" ? "حذف نهائي (إدارة)" : "Admin Delete"
                        }
                      >
                        🗑️
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setSelectedInbound({ ...req, isInstallation: true })
                      }
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-[11px] font-black cursor-pointer shadow-sm focus:outline-none"
                    >
                      👁️ {lang === "ar" ? "عرض التفاصيل" : "View Details"}
                    </button>

                    {installationPortal === "requests" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInstallReq(req);
                            setMapsLink(req.googleMapsLink || "");
                            setShowLocationModal(true);
                          }}
                          className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition text-[11px] font-black cursor-pointer"
                        >
                          📍{" "}
                          {lang === "ar"
                            ? "تحديد موقع التركيب"
                            : "Set Location"}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedInstallReq(req);
                            setAssignedCrew(req.assignedTeam || []);
                            setShowInstallTeamModal(true);
                          }}
                          className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition text-[11px] font-black cursor-pointer"
                        >
                          👥{" "}
                          {lang === "ar" ? "تحديد فريق التركيب" : "Assign Team"}
                        </button>

                        <button
                          onClick={() => {
                            if (!req.googleMapsLink) {
                              displayToast(
                                lang === "ar"
                                  ? "الرجاء إدخال رابط خرائط جوجل قبل إنشاء أمر التركيب."
                                  : "Please provide Google Maps link before creating an order.",
                                "err",
                              );
                              return;
                            }
                            setConfirmDialog({
                              isOpen: true,
                              title:
                                lang === "ar"
                                  ? "تأكيد إنشاء أمر التركيب"
                                  : "Confirm Installation Order",
                              message:
                                lang === "ar"
                                  ? `هل أنت متأكد من تحويل المشروع "${req.projectName}" إلى أمر تركيب ميداني نافذ؟`
                                  : `Are you sure you want to promote "${req.projectName}" to an active field installation order?`,
                              onConfirm: () => {
                                setSelectedInstallReq(req);
                                // Set timeout to let state update before running the handler which relies on `selectedInstallReq`
                                setTimeout(
                                  () => handlePromoteToInstallOrder(),
                                  0,
                                );
                              },
                            });
                          }}
                          className="px-3.5 py-2.5 bg-[#0072BC] hover:bg-blue-700 text-white rounded-xl transition text-[11px] font-black cursor-pointer shadow-md animate-pulse"
                        >
                          🚀{" "}
                          {lang === "ar" ? "إنشاء أمر تركيب" : "Create Order"}
                        </button>
                      </>
                    )}

                    {installationPortal === "orders" && (
                      <>
                        <button
                          onClick={() =>
                            setExpandedOrderId(
                              expandedOrderId === req.id ? null : req.id,
                            )
                          }
                          className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-[#0072BC] rounded-full transition cursor-pointer shadow-sm shrink-0"
                          title={
                            lang === "ar"
                              ? "إظهار / إخفاء التفاصيل"
                              : "Toggle details"
                          }
                        >
                          <span
                            className={`block transform transition-transform duration-350 font-bold text-xs ${expandedOrderId === req.id ? "rotate-180" : "rotate-0"}`}
                          >
                            ▲
                          </span>
                        </button>
                      </>
                    )}
                  </div>

                  {installationPortal === "orders" &&
                    expandedOrderId === req.id && (
                      <div
                        className="pt-2 pb-4 px-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-3 duration-200 text-right w-full bg-slate-50 relative z-0"
                        dir="rtl"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedInstallReq(req);
                              setAssignedCrew(req.assignedTeam || []);
                              setTempCrewRows(
                                (req.assignedTeam || []).map(
                                  (name: string) => ({ name }),
                                ),
                              );
                              setShowInstallTeamModal(true);
                            }}
                            className="px-3 py-2 bg-white hover:bg-indigo-50 border hover:border-indigo-200 text-slate-700 transition font-black text-xs rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                          >
                            👥{" "}
                            {lang === "ar"
                              ? "تحديث فريق التركيب"
                              : "Update Crew"}
                          </button>

                          {req.designLink && (
                            <a
                              href={req.designLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-white hover:bg-blue-50 border hover:border-blue-200 text-blue-700 transition font-black text-xs rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                            >
                              🎨 {lang === "ar" ? "فتح التصميم" : "Open Design"}
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title:
                                  lang === "ar"
                                    ? "تأكيد اكتمال المشروع والتركيب"
                                    : "Confirm Installation Completion",
                                message:
                                  lang === "ar"
                                    ? `هل أنت متأكد من انتهاء التركيب بنجاح لمشروع "${req.projectName}"؟`
                                    : `Are you sure installation is complete for "${req.projectName}"?`,
                                onConfirm: async () => {
                                  const ts = new Date().toISOString();
                                  const uname = user?.username || "الموظف";
                                  const ok = await updateRequestInDb(
                                    "installation_orders",
                                    req.id,
                                    {
                                      installationStatus: "تم التركيب بنجاح",
                                      statusUpdatedBy:
                                        user?.username || "النظام",
                                      statusUpdatedAt: new Date().toISOString(),
                                      completedAt: ts,
                                      confirmedBy: uname,
                                    },
                                  );
                                  if (ok) {
                                    const realReqId =
                                      req.requestId ||
                                      inboundRequests.find(
                                        (r) =>
                                          r.quotationNumber ===
                                          req.quotationNumber,
                                      )?.id;
                                    if (realReqId) {
                                      await updateRequestInDb(
                                        "sales_production_requests",
                                        realReqId,
                                        {
                                          status: "تم التركيب بنجاح",
                                          statusUpdatedAt: ts,
                                          confirmedBy: uname,
                                          completedAt: ts,
                                        },
                                      );
                                    }
                                    const matchedProj = activeProjects.find(
                                      (p) =>
                                        p.projectNumber === req.projectNumber ||
                                        p.quotationNumber ===
                                          req.quotationNumber,
                                    );
                                    if (matchedProj) {
                                      await updateRequestInDb(
                                        "production_projects",
                                        matchedProj.id,
                                        {
                                          status: "تم التركيب بنجاح",
                                          completedAt: ts,
                                        },
                                      );
                                    }
                                    displayToast(
                                      lang === "ar"
                                        ? "تم تحديث حالة التركيب بنجاح"
                                        : "Installation completed successfully!",
                                    );
                                    loadAllData();
                                  }
                                },
                              });
                            }}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition font-black text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
                          >
                            ✅{" "}
                            {lang === "ar"
                              ? "تأكيد اكتمال التركيب"
                              : "Confirm Completion"}
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              );
            })}

            {filteredInstalls.length === 0 && (
              <div className="bg-white p-12 text-center text-slate-400 font-bold text-xs rounded-2xl border border-dashed border-slate-200">
                {lang === "ar"
                  ? "القائمة فارغة في هذه البوابة حالياً."
                  : "Portal empty."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAILS MODAL FOR INBOUND DOCKET */}
      {selectedInbound && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1500] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 leading-relaxed text-right border"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>
                    {selectedInbound.isInstallation
                      ? "🚚"
                      : selectedInbound.isProject
                        ? "⚡"
                        : "📥"}
                  </span>{" "}
                  {selectedInbound.isInstallation
                    ? lang === "ar"
                      ? "تفاصيل طلب التركيب والتشغيل الميداني"
                      : "Installation & Field Operations Details"
                    : selectedInbound.isProject
                      ? lang === "ar"
                        ? "تفاصيل وبيانات المشروع الفني"
                        : "Technical Project Details"
                      : lang === "ar"
                        ? "لوحة معاينة واعتماد كود المبيعات"
                        : "Sales Quote Verification Docket"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedInbound.isInstallation
                    ? lang === "ar"
                      ? "معاينة شروط التشغيل الميداني، وموقع المشروع، وفريق العمل المكلف بالتركيب."
                      : "View field installation parameters, geo-location, and assigned team."
                    : selectedInbound.isProject
                      ? lang === "ar"
                        ? "ملخص مخرجات صالة الإنتاج وتقدم مراحل خط الإنتاج الحالي."
                        : "Production outcomes, current phases and active workflows."
                      : lang === "ar"
                        ? "مخططات الأوتوكاد وشروط خط المشتريات المبرمة وتوريد الخامات ومطابقتها."
                        : "Verify items and terms of corporate quotations."}
                </p>
              </div>
              <button
                onClick={() => setSelectedInbound(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content summary cards */}
            {selectedInbound.isInstallation ? (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600">
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "اسم المشروع:" : "Project Name:"}
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {selectedInbound.projectName}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "اسم العميل الشركة:" : "Client:"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedInbound.clientName}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "📞 رقم جوال العميل:" : "Client Phone:"}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {getClientPhone(
                      selectedInbound.clientName,
                      selectedInbound.quotationNumber,
                      selectedInbound.clientId,
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "رقم الكوتيشن:" : "Quote Number:"}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedInbound.quotationNumber}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar"
                      ? "حالة التركيب الحالية:"
                      : "Current Setup Status:"}
                  </span>
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black inline-block ${getStatusColors(selectedInbound.installationStatus || "معلق الإحداثيات")}`}
                    >
                      📍{" "}
                      {selectedInbound.installationStatus ||
                        (lang === "ar"
                          ? "معلق الإحداثيات"
                          : "Location Pending")}
                    </span>
                    {(selectedInbound.statusUpdatedBy ||
                      selectedInbound.confirmedBy) && (
                      <span className="text-[10px] text-slate-500 font-bold block mt-1">
                        تحديث بواسطة:{" "}
                        {selectedInbound.statusUpdatedBy ||
                          selectedInbound.confirmedBy}{" "}
                        <br />
                        التاريخ:{" "}
                        {selectedInbound.statusUpdatedAt ||
                        selectedInbound.completedAt
                          ? new Date(
                              selectedInbound.statusUpdatedAt ||
                                selectedInbound.completedAt,
                            ).toLocaleDateString("ar-SA")
                          : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "تاريخ التأسيس والطلب:" : "Request Date:"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedInbound.requestDate
                      ? new Date(
                          selectedInbound.requestDate,
                        ).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")
                      : "---"}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "المندوب والمسؤول:" : "Representative:"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedInbound.salesRep || "---"}
                  </span>
                </div>
                {selectedInbound.googleMapsLink && (
                  <div className="col-span-2">
                    <span className="font-extrabold text-slate-400 block mb-0.5">
                      {lang === "ar"
                        ? "موقع التركيب (جوجل مابس):"
                        : "Location Link:"}
                    </span>
                    <a
                      href={selectedInbound.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-800 font-bold underline break-all truncate block"
                    >
                      📍 {selectedInbound.googleMapsLink}
                    </a>
                  </div>
                )}
                {selectedInbound.assignedTeam?.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-extrabold text-slate-400 block mb-0.5">
                      {lang === "ar"
                        ? "فريق العمل المكلف بالتركيب:"
                        : "Assigned Crew:"}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedInbound.assignedTeam.map(
                        (crew: string, cIdx: number) => (
                          <span
                            key={cIdx}
                            className="px-2.5 py-0.5 bg-slate-200 text-slate-800 font-black rounded-full text-[10px]"
                          >
                            👥 {crew}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600">
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "اسم المشروع:" : "Project:"}
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {selectedInbound.projectName}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "اسم العميل الشركة:" : "Client:"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedInbound.clientName}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "رقم الكوتيشن:" : "Quote Number:"}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedInbound.quotationNumber}
                  </span>
                </div>
                <div>
                  {/* Financial collections stage #1 status (Requirement) */}
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar"
                      ? "حالة التحصيل (الدفعة الأولى):"
                      : "Payment #1:"}
                  </span>
                  {renderQuotationPaymentDetails(
                    selectedInbound.quotationNumber,
                  )}
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar"
                      ? "ملفات التصميم المرفقة:"
                      : "Attached Blueprint:"}
                  </span>
                  <a
                    href={selectedInbound.designLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-extrabold rounded-lg inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />{" "}
                    {lang === "ar" ? "عرض الرسومات والأوتوكاد" : "Autocad View"}
                  </a>
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar"
                      ? "طلب شراء المواد:"
                      : "Material Purchase Request:"}
                  </span>
                  {(() => {
                    const associatedProc = procurementRequests.find(
                      (p) =>
                        p.projectId === selectedInbound.id ||
                        p.quotationNumber === selectedInbound.quotationNumber,
                    );
                    if (!associatedProc) {
                      return (
                        <span className="text-slate-400 italic font-bold text-[10px]">
                          {lang === "ar"
                            ? "لا يوجد طلب شراء خامات حتى الآن"
                            : "No purchase request yet"}
                        </span>
                      );
                    }
                    return (
                      <span
                        className={`px-2.5 py-1 rounded-lg font-black text-[10px] inline-block mt-0.5 ${
                          associatedProc.status === "تم استلام المواد"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : associatedProc.status === "تم الطلب من المورد"
                              ? "bg-blue-50 text-blue-800 border border-blue-100"
                              : associatedProc.status === "في انتظار الدفع" ||
                                  associatedProc.status === "في انتظار الدفعة"
                                ? "bg-purple-50 text-purple-800 border border-purple-100"
                                : associatedProc.status === "قيد الطلب"
                                  ? "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                                  : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {associatedProc.isOrder
                          ? lang === "ar"
                            ? " أمر شراء: "
                            : "PO: "
                          : lang === "ar"
                            ? " طلب شراء: "
                            : "PR: "}
                        {associatedProc.status}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <span className="font-extrabold text-slate-400 block mb-0.5">
                    {lang === "ar" ? "الملاحظات المدونة من المندوب:" : "Notes:"}
                  </span>
                  <p className="font-medium text-amber-950 bg-amber-50 p-2 rounded-lg border border-amber-150 inline-block text-[11px]">
                    {selectedInbound.notes || "لا يوجد ملاحظات منسقة"}
                  </p>
                </div>
              </div>
            )}

            {/* Display list of ordered hardware parts and quantity from the quotation (Requirement) */}
            <div className="space-y-2 border border-slate-100 p-3 rounded-2xl text-xs">
              <h4 className="font-extrabold text-[#0072BC] flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {lang === "ar"
                  ? "تفاصيل ومعاينة السعرات والأصناف بالفاتورة:"
                  : "Signage items inside the quotation:"}
              </h4>

              {/* Find and map signage items of this quotation (Requirement) */}
              {(() => {
                const matchedQuote =
                  salesQuotations.find(
                    (q) =>
                      q.quotationNumber === selectedInbound.quotationNumber ||
                      q.id === selectedInbound.quoteId ||
                      q.id === selectedInbound.quotationNumber,
                  ) ||
                  quotations.find(
                    (q) =>
                      q.quotationNumber === selectedInbound.quotationNumber ||
                      q.id === selectedInbound.quoteId ||
                      q.id === selectedInbound.quotationNumber,
                  );
                if (
                  !matchedQuote ||
                  !matchedQuote.items ||
                  matchedQuote.items.length === 0
                ) {
                  return (
                    <p className="text-slate-400 italic font-bold">
                      {lang === "ar"
                        ? "لم يتم العثور على البنود المسعرة كأصناف في قاعدة المبيعات."
                        : "No detailed parts found."}
                    </p>
                  );
                }
                return (
                  <div className="border rounded-xl bg-slate-50/50 overflow-hidden text-[11px] leading-relaxed">
                    <table className="w-full text-right text-slate-700">
                      <thead className="bg-slate-100 font-bold text-slate-500">
                        <tr>
                          <th className="p-2">
                            {lang === "ar" ? "الصنف الهيكلي" : "Signage Item"}
                          </th>
                          <th className="p-2">
                            {lang === "ar"
                              ? "الملاحظات الاضافية"
                              : "Additional Notes"}
                          </th>
                          <th className="p-2 text-center w-24">
                            {lang === "ar" ? "الكمية" : "Qty"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchedQuote.items.map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">
                              {it.itemName || it.itemNameAr || "---"}
                            </td>
                            <td className="p-2 text-slate-600 text-[10px] whitespace-pre-wrap">
                              {it.description ||
                                it.internalNotes ||
                                it.descriptionAr ||
                                "---"}
                            </td>
                            <td className="p-2 text-center font-black text-indigo-700">
                              {it.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* COLLAPSIBLE DETAILS CHEVRON/SECTION TO VIEW/EDIT/DELETE SENT PURCHASE REQUEST (Requirement) */}
            {(() => {
              const associatedProc = procurementRequests.find(
                (p) =>
                  p.projectId === selectedInbound.id ||
                  p.quotationNumber === selectedInbound.quotationNumber,
              );
              if (!associatedProc) return null;

              return (
                <div className="space-y-2 border border-indigo-100 p-4 rounded-2xl text-xs bg-indigo-50/20">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        setIsPrCollapsibleOpen(!isPrCollapsibleOpen)
                      }
                      className="font-extrabold text-indigo-900 flex items-center gap-2 cursor-pointer hover:opacity-80 transition focus:outline-none"
                    >
                      <span>{isPrCollapsibleOpen ? "▼" : "►"}</span>
                      <span>
                        📦{" "}
                        {lang === "ar"
                          ? "عرض طلب شراء المواد ومتابعة بنوده الحالية"
                          : "View Sent Material Purchase Request"}
                      </span>
                    </button>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                      {associatedProc.requestNumber}
                    </span>
                  </div>

                  {isPrCollapsibleOpen && (
                    <div className="pt-3 space-y-3 animate-in fade-in duration-200">
                      {/* Status / History updates logs */}
                      <div className="text-[11px] space-y-1 bg-white p-3 rounded-xl border border-indigo-50">
                        {associatedProc.isOrder ? (
                          <p className="text-emerald-800 font-extrabold">
                            ✅{" "}
                            {lang === "ar"
                              ? `تم انشاء امر شراء مواد رسمي بواسطة (${associatedProc.orderedBy || associatedProc.requestedBy || "إدارة المشتريات"}) وتاريخ ${associatedProc.orderedAt ? new Date(associatedProc.orderedAt).toLocaleDateString("ar-SA") : "---"}`
                              : `Official Purchase Order finalized by (${associatedProc.orderedBy || "Procurement"}) on ${associatedProc.orderedAt ? new Date(associatedProc.orderedAt).toLocaleDateString() : "---"}`}
                          </p>
                        ) : (
                          <p className="text-indigo-800 font-extrabold">
                            ⏳{" "}
                            {lang === "ar"
                              ? "طلب المواد قيد المراجعة والمطابقة في قسم المشتريات"
                              : "Material request is under review by procurement."}
                          </p>
                        )}
                        {associatedProc.updatedBy && (
                          <p className="text-blue-800 font-extrabold text-[10px] border-t border-slate-100 pt-1 mt-1">
                            ✏️{" "}
                            {lang === "ar"
                              ? `تم تعديل طلب الشراء بواسطة (${associatedProc.updatedBy}) وتاريخ ${new Date(associatedProc.updatedAt).toLocaleDateString("ar-SA")}`
                              : `Purchase request amended by (${associatedProc.updatedBy}) on ${new Date(associatedProc.updatedAt).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>

                      {/* Items Table inside Collapsible */}
                      <div className="border border-indigo-50 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-right text-slate-700">
                          <thead className="bg-[#f8fafc] font-bold text-slate-600">
                            <tr>
                              <th className="p-2 text-[11px]">
                                {lang === "ar" ? "الصنف المطلوب" : "Item"}
                              </th>
                              <th className="p-2 text-center text-[11px]">
                                {lang === "ar" ? "الكمية" : "Qty"}
                              </th>
                              <th className="p-2 text-[11px]">
                                {lang === "ar" ? "ملاحظات" : "Remarks"}
                              </th>
                              {!associatedProc.isOrder && (
                                <th className="p-2 text-left text-[11px]">
                                  {lang === "ar" ? "إجراء" : "Action"}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {associatedProc.items?.map((it: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-800">
                                  {it.itemName || it.name || "---"}
                                </td>
                                <td className="p-2 text-center font-bold">
                                  {associatedProc.isOrder ? (
                                    <span>{it.qty}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min={1}
                                      value={it.qty || 1}
                                      onChange={async (e) => {
                                        const val = Math.max(
                                          1,
                                          Number(e.target.value),
                                        );
                                        const updated = [
                                          ...(associatedProc.items || []),
                                        ];
                                        updated[i] = {
                                          ...updated[i],
                                          qty: val,
                                        };
                                        await handleUpdateProcurementItems(
                                          updated,
                                        );
                                      }}
                                      className="w-16 p-1 border text-center rounded-lg font-bold bg-white"
                                    />
                                  )}
                                </td>
                                <td className="p-2 text-slate-500">
                                  {it.notes || "---"}
                                </td>
                                {!associatedProc.isOrder && (
                                  <td className="p-2 text-left">
                                    <button
                                      onClick={async () => {
                                        const updated =
                                          associatedProc.items.filter(
                                            (_: any, idx: number) => idx !== i,
                                          );
                                        await handleUpdateProcurementItems(
                                          updated,
                                        );
                                      }}
                                      className="text-rose-600 hover:text-rose-800 font-extrabold focus:outline-none transition cursor-pointer"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                            {(!associatedProc.items ||
                              associatedProc.items.length === 0) && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-4 text-center text-slate-400 italic"
                                >
                                  {lang === "ar"
                                    ? "لا يوجد أي أصناف في هذا الطلب حالياً."
                                    : "No items."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Item form inside the collapsible section (Only if PR is not finalized into purchase order) */}
                      {!associatedProc.isOrder && (
                        <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 flex flex-col gap-2.5">
                          <p className="font-extrabold text-[#0072BC] text-[11px] mb-1">
                            ➕{" "}
                            {lang === "ar"
                              ? "إضافة صنف إضافي لطلب الشراء الحالي"
                              : "Add custom item to sent request"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <input
                                type="text"
                                list="materials-suggest-list"
                                placeholder={
                                  lang === "ar"
                                    ? "اسم الصنف..."
                                    : "Item description..."
                                }
                                value={inlineItemName}
                                onChange={(e) =>
                                  setInlineItemName(e.target.value)
                                }
                                className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                min={1}
                                placeholder={
                                  lang === "ar" ? "الكمية..." : "Qty..."
                                }
                                value={inlineItemQty}
                                onChange={(e) =>
                                  setInlineItemQty(Number(e.target.value))
                                }
                                className="w-full p-2 border rounded-lg bg-white text-xs font-bold text-center"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={
                                  lang === "ar"
                                    ? "ملاحظات الصنف..."
                                    : "Notes..."
                                }
                                value={inlineItemNotes}
                                onChange={(e) =>
                                  setInlineItemNotes(e.target.value)
                                }
                                className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                              />
                              <button
                                onClick={async () => {
                                  if (!inlineItemName.trim()) {
                                    displayToast(
                                      lang === "ar"
                                        ? "الرجاء إدخال اسم الصنف"
                                        : "Item name required",
                                      "err",
                                    );
                                    return;
                                  }
                                  const newItem = {
                                    itemName: inlineItemName,
                                    qty: inlineItemQty,
                                    notes: inlineItemNotes,
                                  };
                                  const updated = [
                                    ...(associatedProc.items || []),
                                    newItem,
                                  ];
                                  await handleUpdateProcurementItems(updated);
                                  // Clear inline states
                                  setInlineItemName("");
                                  setInlineItemQty(1);
                                  setInlineItemNotes("");
                                }}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-sm shrink-0"
                              >
                                {lang === "ar" ? "إضافة" : "Add"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SOURCING SUB-PANEL: BUILD PURCHASE REQUEST (Requirement) */}
            {showPOForm ? (
              <div className="p-4 bg-slate-50 border-2 border-indigo-200 border-dashed rounded-3xl space-y-4 text-xs animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center bg-indigo-50 p-2.5 rounded-xl border border-indigo-150">
                  <span className="font-extrabold text-indigo-950">
                    📦{" "}
                    {lang === "ar"
                      ? "تحرير وتجهيز قائمة مشتريات المواد والـ BOQ"
                      : "Edit BoM List"}
                  </span>
                  <button
                    onClick={() => setShowPOForm(false)}
                    className="text-slate-400 hover:text-rose-500 transition font-extrabold"
                  >
                    ✕
                  </button>
                </div>

                {/* Autocomplete-like search input of items list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      {lang === "ar" ? "الصنف المطلوب" : "Item Name"}
                    </label>
                    <select
                      value={poItemName}
                      onChange={(e) => setPoItemName(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-white font-bold"
                    >
                      <option value="">
                        {lang === "ar" ? "اختر مادة..." : "Select material..."}
                      </option>
                      {materialsList.map((wi: any, idx: number) => {
                        const nameStr =
                          wi.itemNameAr ||
                          wi.itemNameEn ||
                          wi.itemName ||
                          wi.name ||
                          wi.descriptionAr ||
                          wi.description;
                        return nameStr ? (
                          <option key={wi.id || idx} value={nameStr}>
                            {nameStr}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      {lang === "ar" ? "الكمية المطلوبة" : "Qty"}
                    </label>
                    <input
                      type="number"
                      value={poItemQty}
                      onChange={(e) => setPoItemQty(Number(e.target.value))}
                      className="w-full p-2.5 border rounded-xl bg-white font-mono font-bold"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      {lang === "ar" ? "ملاحظات وتخصيص الفنيين" : "Notes"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={poItemNotes}
                        onChange={(e) => setPoItemNotes(e.target.value)}
                        className="w-full p-2.5 border rounded-xl bg-white font-bold"
                        placeholder="..."
                      />
                      <button
                        onClick={handleAddPoItem}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-black flex items-center justify-center shrink-0"
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Local grid of added materials */}
                <div className="border rounded-2xl overflow-hidden bg-white max-h-40 overflow-y-auto text-[11px]">
                  <table className="w-full text-right text-slate-600 leading-normal">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">
                          {lang === "ar" ? "الصنف" : "Item"}
                        </th>
                        <th className="p-2 text-center">
                          {lang === "ar" ? "الكمية" : "Qty"}
                        </th>
                        <th className="p-2">
                          {lang === "ar" ? "شروط خاصة" : "Remarks"}
                        </th>
                        <th className="p-2 text-left">
                          {lang === "ar" ? "إدارة" : "Manage"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {poItems.map((pi, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-800">
                            {pi.itemName}
                          </td>
                          <td className="p-2 text-center font-mono font-bold">
                            {pi.qty}
                          </td>
                          <td className="p-2 text-slate-400">
                            {pi.notes || "---"}
                          </td>
                          <td className="p-2 text-left">
                            <button
                              onClick={() => handleRemovePoItem(idx)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {poItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-slate-400 font-bold"
                          >
                            {lang === "ar"
                              ? "الرجاء إدراج خامات ومستند الشراء للمشروع."
                              : "Raw materials ledger is currently empty."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={handleSendProcurementRequest}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-[11px] font-black cursor-pointer shadow-md inline-flex items-center gap-1"
                  >
                    🚀{" "}
                    {lang === "ar"
                      ? "إرسال طلب شراء المواد"
                      : "Transmit BoM ledger"}
                  </button>
                  <button
                    onClick={() => setShowPOForm(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-300"
                  >
                    {lang === "ar" ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            ) : selectedInbound.isInstallation ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-150 mr-4 ml-4">
                <div className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-150 px-4 py-2 rounded-2xl font-black flex items-center gap-1.5 leading-normal">
                  🚚{" "}
                  {selectedInbound.isOrder
                    ? lang === "ar"
                      ? "أمر التركيب مفعل ونشط ومسند حالياً."
                      : "This installation order is active and scheduled for field operations."
                    : lang === "ar"
                      ? "هذا ملف طلب تركيب معلق ومكتمل التصنيع."
                      : "This is a pending installation request awaiting site activation."}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {!selectedInbound.isOrder && (
                    <button
                      onClick={() => {
                        if (!selectedInbound.googleMapsLink) {
                          displayToast(
                            lang === "ar"
                              ? "الرجاء إدخال رابط خرائط جوجل قبل تفعيل الأمر."
                              : "Please provide Google Maps link before activating.",
                            "err",
                          );
                          return;
                        }
                        setSelectedInstallReq(selectedInbound);
                        setConfirmDialog({
                          isOpen: true,
                          title:
                            lang === "ar"
                              ? "تأكيد تفعيل أمر التركيب"
                              : "Confirm Installation Order",
                          message:
                            lang === "ar"
                              ? "هل أنت متأكد من رغبتك بتفعيل أمر التركيب والتشغيل الميداني للمشروع الآن؟"
                              : "Are you sure you want to activate the field installation order now?",
                          onConfirm: async () => {
                            const ord = {
                              ...selectedInbound,
                              id: `INO-${Date.now()}`,
                              isOrder: true,
                              orderedAt: new Date().toISOString(),
                              installationStatus: "قيد التركيب الميداني",
                              statusUpdatedBy: user?.username || "النظام",
                              statusUpdatedAt: new Date().toISOString(),
                            };
                            const added = await createRecordInDb(
                              "installation_orders",
                              ord,
                            );
                            if (added) {
                              await deleteRecordInDb(
                                "installation_requests",
                                selectedInbound.id,
                              );
                              const realReqId =
                                selectedInbound.requestId ||
                                inboundRequests.find(
                                  (r) =>
                                    r.quotationNumber ===
                                    selectedInbound.quotationNumber,
                                )?.id;
                              if (realReqId) {
                                await updateRequestInDb(
                                  "sales_production_requests",
                                  realReqId,
                                  { status: "في التركيب" },
                                );
                              }
                              displayToast(
                                lang === "ar"
                                  ? "تم إنشاء أمر التركيب بنجاح وتم تحويل ملف المشروع."
                                  : "Installation Order activated!",
                              );
                              setInstallationPortal("orders");
                              setSelectedInbound(null);
                              loadAllData();
                            }
                          },
                        });
                      }}
                      className="px-5 py-2.5 bg-[#0072BC] hover:bg-blue-700 text-white font-black rounded-xl text-xs cursor-pointer transition shadow-md whitespace-nowrap"
                    >
                      🚀{" "}
                      {lang === "ar" ? "تفعيل أمر التركيب" : "Activate Order"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInbound(null)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer transition shadow-md shadow-indigo-100 w-full sm:w-auto text-center"
                  >
                    {lang === "ar" ? "إغلاق نافذة التفاصيل" : "Close Details"}
                  </button>
                </div>
              </div>
            ) : selectedInbound.isProject ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-150 mr-4 ml-4">
                <div className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-150 px-4 py-2 rounded-2xl font-black flex items-center gap-1.5 leading-normal">
                  ⚡{" "}
                  {lang === "ar"
                    ? "هذا المشروع قيد التصنيع والتدفق النشط في صالة الإنتاج حالياً"
                    : "This project is currently in active manufacturing on the production floor."}
                </div>
                <button
                  onClick={() => setSelectedInbound(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer transition shadow-md shadow-indigo-100 w-full sm:w-auto text-center"
                >
                  {lang === "ar" ? "إغلاق نافذة التفاصيل" : "Close Details"}
                </button>
              </div>
            ) : (
              <>
                {/* TIMELINE FOR COMPLETED PROJECTS */}
                {inboundPortal === "completed" && (() => {
                  const matchedProj = activeProjects.find(p => p.requestId === selectedInbound.id || p.quotationNumber === selectedInbound.quotationNumber);
                  if (!matchedProj || !matchedProj.pipelineStages) return null;
                  
                  return (
                    <div className="space-y-4 text-xs leading-relaxed max-h-96 overflow-y-auto pr-1 border-t border-slate-100 pt-4 mt-4">
                      <h4 className="font-extrabold text-[#0072BC] mb-2 flex items-center gap-1">
                        ⏱️ {lang === "ar" ? "مسار المشروع والتواريخ:" : "Project Timeline:"}
                      </h4>
                      {matchedProj.pipelineStages.map((st: any, i: number) => {
                        const isCompleted = st.completedAt;
                        return (
                          <div key={i} className="flex gap-4 items-start relative pb-6 group">
                            {i !== matchedProj.pipelineStages.length - 1 && (
                              <div className={`absolute top-6 right-3.5 w-0.5 h-full ${isCompleted ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                            )}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-300 text-slate-400"}`}>
                              {isCompleted ? "✓" : i + 1}
                            </div>
                            <div className="flex-1 text-right pt-1 pb-2">
                              <h4 className={`text-[11px] font-black ${isCompleted ? "text-emerald-900" : "text-slate-500"}`}>{st.stageName}</h4>
                              {isCompleted && st.completedAt && (
                                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                                  {lang === "ar" ? "اكتمل في:" : "Completed at:"} {new Date(st.completedAt).toLocaleString("ar-SA")}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">{st.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex flex-wrap gap-2.5 justify-center pt-3 border-t">
                {inboundPortal === "active" && (
                  <>
                    {/* BUTTON 1: CONFIRM ORDER RECEIPT */}
                    <button
                      onClick={handleConfirmReceipt}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer shadow-md ${
                        selectedInbound.status === "تم استلام الطلب"
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-350 shadow-emerald-50"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                      }`}
                    >
                      ✔️{" "}
                      {lang === "ar"
                        ? "تأكيد استلام الطلب وتعميده"
                        : "Confirm Order Receipt"}
                    </button>

                    {/* BUTTON 2: CREATE MATERIAL PURCHASE REQUEST */}
                    <button
                      onClick={() => setShowPOForm(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-xs font-black cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      📦{" "}
                      {lang === "ar"
                        ? "إنشاء طلب شراء مواد"
                        : "Sourcing Raw Materials"}
                    </button>

                    {/* BUTTON 3: RESTRICT PROJECT / HOLD */}
                    <button
                      onClick={() => setShowHoldModal(true)}
                      className={`px-4 py-2 rounded-xl transition text-xs font-black cursor-pointer w-full sm:w-auto ${
                        selectedInbound.status === "تم التقييد"
                          ? "bg-rose-200 hover:bg-rose-300 text-rose-900 border border-rose-350 shadow-rose-50"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-200"
                      }`}
                    >
                      ⚠️ {lang === "ar" ? "تقييد المشروع" : "Restrict/Hold Booking"}
                    </button>

                    {/* NEW BUTTON: CREATE PRODUCTION ORDER (When Material is Received) */}
                    {(() => {
                      const associatedProc = procurementRequests.find(
                        (p) =>
                          p.projectId === selectedInbound.id ||
                          p.quotationNumber === selectedInbound.quotationNumber,
                      );
                      if (
                        associatedProc &&
                        associatedProc.status === "تم استلام المواد"
                      ) {
                        return (
                          <button
                            onClick={handleCreateProductionOrder}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-black cursor-pointer shadow-md shadow-blue-200 w-full sm:w-auto"
                          >
                            🚀{" "}
                            {lang === "ar"
                              ? "إنشاء أمر إنتاج"
                              : "Create Production Order"}
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer w-full sm:w-auto shadow"
                >
                  🖨️ {lang === "ar" ? "طباعة" : "Print"}
                </button>
                <button
                  onClick={() => setSelectedInbound(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer w-full sm:w-auto"
                >
                  {lang === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* HOLD MODAL DIALOG (Requirement) */}
      {showHoldModal && selectedInbound && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-right border"
            dir="rtl"
          >
            <h3 className="text-sm font-black text-rose-700 flex items-center gap-1">
              ⚠️{" "}
              {lang === "ar"
                ? "تقييد الطلب الحالي وقيد أسباب الحبس المصعني"
                : "Restrict & Hold Production Order"}
            </h3>

            <div className="space-y-3 text-xs leading-normal font-bold text-slate-600">
              <label className="block">
                {lang === "ar"
                  ? "الرجاء اختيار أحد مصنفات الحظر:"
                  : "Choose restriction reason:"}
              </label>

              <div className="flex flex-col gap-2.5">
                {[
                  "غير مطابق لمعايير التصنيع / غير قابل للتصنيع بالمعايير المكتوبة",
                  "ازدحام الأعمال في المصنع (يرجى انتظار تواجد مساحة عمل للمشروع)",
                  "تم التقييد لعدم استلام دفعة أولى من العميل لشراء المواد",
                  "الوقت المقدر للمشروع غير دقيق / غير ممكن",
                  "سبب آخر",
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg"
                  >
                    <input
                      type="radio"
                      name="hold_reason"
                      value={reason}
                      checked={holdReason === reason}
                      onChange={(e) => setHoldReason(e.target.value)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {holdReason === "سبب آخر" && (
                <textarea
                  placeholder={
                    lang === "ar"
                      ? "اكتب هنا أسباب التقييد التفصيلية..."
                      : "Write custom hold details..."
                  }
                  value={holdCustomReason}
                  onChange={(e) => setHoldCustomReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={handleHoldBooking}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition text-[11px] font-black cursor-pointer shadow-md"
              >
                💾{" "}
                {lang === "ar"
                  ? "حفظ الحظر والتقييد المالي"
                  : "Lock Hold state"}
              </button>
              <button
                onClick={() => setShowHoldModal(false)}
                className="px-4 py-2 bg-slate-150 text-slate-700 rounded-xl font-bold text-xs"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIG MANAGE & SCHEDULING POPUP MODEL FOR ACTIVE PRODUCTION ORDERS */}
      {showStartManufacturingModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1500] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 text-right"
            dir="rtl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#0072BC] text-sm flex items-center gap-1.5">
                  ⚙️{" "}
                  {lang === "ar"
                    ? `تخطيط وبدء قاعة تصنيع المشروع: ${selectedOrder.orderNumber}`
                    : `Initiate fabrication workspace`}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تحديد فريق العمل، تواريخ الاستلام المستهدفة، وتسلسل مسار
                  التصنيع الفني للمشروع.
                </p>
              </div>
              <button
                onClick={() => setShowStartManufacturingModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Read-only metadata summary block */}
            <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 leading-normal">
              <p>
                اسم المشروع:{" "}
                <strong className="text-slate-900">
                  {selectedOrder.projectName}
                </strong>
              </p>
              <p>
                العميل:{" "}
                <strong className="text-slate-900">
                  {selectedOrder.clientName}
                </strong>
              </p>
              <p>
                كود المبيعات المعتمد:{" "}
                <strong className="text-slate-900 font-mono">
                  {selectedOrder.quotationNumber}
                </strong>
              </p>
              <p>
                المندوب المسؤول:{" "}
                <strong className="text-slate-900">
                  {selectedOrder.salesRep}
                </strong>
              </p>
            </div>

            {/* Display list of ordered hardware parts and quantity from the quotation (Requirement) */}
            <div className="space-y-2 border border-slate-100 p-3 rounded-2xl text-xs">
              <h4 className="font-extrabold text-[#0072BC] flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {lang === "ar"
                  ? "تفاصيل ومعاينة السعرات والأصناف بالفاتورة:"
                  : "Signage items inside the quotation:"}
              </h4>
              {(() => {
                const matchedQuote =
                  salesQuotations.find(
                    (q) =>
                      q.quotationNumber === selectedOrder.quotationNumber ||
                      q.id === selectedOrder.quoteId ||
                      q.id === selectedOrder.quotationNumber,
                  ) ||
                  quotations.find(
                    (q) =>
                      q.quotationNumber === selectedOrder.quotationNumber ||
                      q.id === selectedOrder.quoteId ||
                      q.id === selectedOrder.quotationNumber,
                  );
                if (
                  !matchedQuote ||
                  !matchedQuote.items ||
                  matchedQuote.items.length === 0
                ) {
                  return (
                    <p className="text-slate-400 italic font-bold text-[11px]">
                      {lang === "ar"
                        ? "لم يتم العثور على البنود المسعرة كأصناف في قاعدة المبيعات."
                        : "No detailed items found."}
                    </p>
                  );
                }
                return (
                  <div className="border rounded-xl bg-slate-50/50 overflow-hidden text-[11px] leading-relaxed">
                    <table className="w-full text-right text-slate-700">
                      <thead className="bg-slate-100 font-bold text-slate-500">
                        <tr>
                          <th className="p-2">
                            {lang === "ar" ? "الصنف الهيكلي" : "Signage Item"}
                          </th>
                          <th className="p-2">
                            {lang === "ar"
                              ? "الملاحظات الاضافية"
                              : "Additional Notes"}
                          </th>
                          <th className="p-2 text-center w-24">
                            {lang === "ar" ? "الكمية" : "Qty"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchedQuote.items.map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">
                              {it.itemName || it.itemNameAr || "---"}
                            </td>
                            <td className="p-2 text-slate-600 text-[10px] whitespace-pre-wrap">
                              {it.description ||
                                it.internalNotes ||
                                it.descriptionAr ||
                                "---"}
                            </td>
                            <td className="p-2 text-center font-black text-indigo-700">
                              {it.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* BUTTON INTERFACES INSIDE MODAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-y py-4">
              {/* BUTTON 2.1: INTERACTIVE WORKFORCE SELECTION (Requirement) */}
              <div className="border border-slate-150 p-3.5 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                  <Users className="w-4 h-4" />{" "}
                  {lang === "ar"
                    ? "فريق العمل الإنتاجي"
                    : "Technicians assignment"}
                </h4>
                <p className="text-[10px] text-slate-400">
                  تخصيص الكوادر وعمال تصنيع اللوحات للمشروع.
                </p>
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => setShowAssignTeam(true)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-xl transition cursor-pointer"
                  >
                    👥 {lang === "ar" ? "تعيين طاقم المصنع" : "Assign crew"}
                  </button>
                  {assignedCrew.length > 0 && (
                    <div className="p-2 bg-slate-50 rounded-xl text-[9px] text-slate-600 font-bold max-h-24 overflow-y-auto space-y-1">
                      {assignedCrew.map((c) => (
                        <p key={c}>✔️ {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* BUTTON 2.2: INTERACTIVE DATES PLANNER (Requirement) */}
              <div className="border border-slate-150 p-3.5 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />{" "}
                  {lang === "ar"
                    ? "المخطط الزمني المستهدف"
                    : "Timeline schedule"}
                </h4>
                <p className="text-[10px] text-slate-400">
                  أيام العمل المحددة بحد أقصى مضافاً لها فترة الطوارئ والـ
                  Buffer.
                </p>
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => setShowDatesForm(true)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-xl transition cursor-pointer"
                  >
                    📅{" "}
                    {lang === "ar"
                      ? "تحديد وتثبيت التواريخ والاحتياط"
                      : "Pick target dates"}
                  </button>
                  {startDate && (
                    <div className="p-2 bg-slate-50 rounded-xl text-[9px] text-slate-600 font-mono space-y-1">
                      <p>البدء: {startDate}</p>
                      <p>الانتهاء: {endDate}</p>
                      <p>الطوارئ: +{bufferDays} يوم</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BUTTON 2.3: INTERACTIVE PIPELINE PATH DESIGNER (Requirement) */}
              <div className="border border-slate-150 p-3.5 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-indigo-700 flex items-center gap-1">
                  <Layers className="w-4 h-4" />{" "}
                  {lang === "ar" ? "مسار تدرج تصنيع الهيكل" : "Custom pipeline"}
                </h4>
                <p className="text-[10px] text-slate-400">
                  بناء المراحل المخصصة ونسب تقدم الإنجاز الآلي للمشروع.
                </p>
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => setShowPathForm(true)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-xl transition cursor-pointer"
                  >
                    ⛓️{" "}
                    {lang === "ar"
                      ? "تحديد مسار الإنتاج والمراحل"
                      : "Build Custom pipeline"}
                  </button>
                  <p className="text-[9px] font-bold text-slate-500 text-center">
                    {stages.length} مراحل مصنعية مبرمة
                  </p>
                </div>
              </div>
            </div>

            {/* BUTTON 2.4: TRIGGER START MANUFACTURING ACTIVATION (Requirement) */}
            <div className="pt-3 flex justify-between items-center border-t">
              <span className="text-[10px] text-rose-500 font-extrabold">
                🚨 يرجى التأكد من استلام الدفعة النقدية الأولى وتوريد المواد قبل
                ضخ المشروع لقسم التصنيع المباشر.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleStartManufacturing}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-[#0072BC] text-white font-extrabold rounded-xl transition text-xs shadow-md cursor-pointer inline-flex items-center gap-1"
                >
                  ▶️{" "}
                  {lang === "ar"
                    ? "تأكيد بدء تصنيع المشروع والتشغيل"
                    : "Start Manufacturing Now"}
                </button>
                <button
                  onClick={() => setShowStartManufacturingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  {lang === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM CREW ASSIGNMENT NESTED MODAL (High-Fidelity ERP Autocomplete Table) */}
      {showAssignTeam && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-4 shadow-2xl text-right overflow-visible min-h-[500px]"
            dir="rtl"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
                👥{" "}
                {lang === "ar"
                  ? "تحديد وتعيين طاقم الفنيين من الموارد البشرية"
                  : "Assign workshop technicians"}
              </h3>
              <button
                onClick={() => {
                  setTempCrewRows([
                    ...tempCrewRows,
                    {
                      name: "",
                      nationality: "",
                      role: "",
                      experience: "",
                      lastProject: "",
                    },
                  ]);
                }}
                className="px-3.5 py-1.5 bg-[#0072BC] hover:bg-[#005c99] text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
              >
                ➕ {lang === "ar" ? "إضافة موظف جديد" : "Add Technician"}
              </button>
            </div>

            {/* Table of Temporary Crew Assignments */}
            <div className="border border-slate-100 rounded-2xl bg-white overflow-visible">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 font-extrabold text-slate-500 border-b">
                  <tr>
                    <th className="p-3">
                      {lang === "ar" ? "اسم الفني / الموظف" : "Employee Name"}
                    </th>
                    <th className="p-3">
                      {lang === "ar" ? "الجنسية" : "Nationality"}
                    </th>
                    <th className="p-3">
                      {lang === "ar" ? "المسمى الوظيفي" : "Role"}
                    </th>
                    <th className="p-3 text-center">
                      {lang === "ar" ? "الخبرة" : "Exp"}
                    </th>
                    <th className="p-3 text-center">
                      {lang === "ar"
                        ? "آخر مشروع اشتغل فيه (تاريخه)"
                        : "Last Project & Date"}
                    </th>
                    <th className="p-3 text-left">
                      {lang === "ar" ? "تحكم" : "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold leading-normal text-slate-650">
                  {tempCrewRows.map((row, idx) => {
                    // Filter matching employees dynamically
                    const query = (row.name || "").trim().toLowerCase();
                    const matches = employees
                      .filter((emp) => {
                        const empName =
                          emp.arabicName ||
                          emp.englishName ||
                          (emp as any).name ||
                          "";

                        // Match if query is empty (show list) or if the employee name includes the query
                        const isMatch =
                          !query || empName.toLowerCase().includes(query);

                        // Also filter out employees already added to other rows to prevent duplicates
                        const isAlreadySelected = tempCrewRows.some(
                          (r, rIdx) => rIdx !== idx && r.name === empName,
                        );

                        return isMatch && !isAlreadySelected;
                      })
                      .slice(0, 8); // show more matches (up to 8) for easier user selection

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 relative min-w-[200px]">
                          <input
                            type="text"
                            placeholder={
                              lang === "ar"
                                ? "اكتب للبحث في شجرة الموارد البشرية..."
                                : "Type name..."
                            }
                            value={row.name || ""}
                            onFocus={() => setActiveSearchIdx(idx)}
                            onBlur={() => {
                              // Small timeout to allow click event to register on the suggestion buttons
                              setTimeout(() => {
                                if (activeSearchIdx === idx) {
                                  setActiveSearchIdx(null);
                                }
                              }, 200);
                            }}
                            onChange={(e) => {
                              const copy = [...tempCrewRows];
                              copy[idx] = {
                                ...copy[idx],
                                name: e.target.value,
                                nationality: "",
                                role: "",
                                experience: "",
                                lastProject: "",
                                isConfirmed: false, // clear confirmation on change so dropdown is shown
                              };
                              setTempCrewRows(copy);
                            }}
                            className="w-full p-2 border rounded-xl font-bold bg-slate-50 focus:bg-white outline-none"
                          />
                          {/* Autocomplete suggestion popover list */}
                          {activeSearchIdx === idx &&
                            matches.length > 0 &&
                            !row.isConfirmed && (
                              <div className="absolute left-3 right-3 top-14 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 divide-y divide-slate-50 text-[10px] max-h-48 overflow-y-auto">
                                {matches.map((emp) => {
                                  const empName =
                                    emp.arabicName ||
                                    emp.englishName ||
                                    (emp as any).name;
                                  const nationality =
                                    emp.nationality || "سعودي";
                                  const role =
                                    emp.jobTitle ||
                                    (emp as any).role ||
                                    emp.department ||
                                    "عامل تصنيع";
                                  const exp = `${emp.experienceYears || 2} سنة`;

                                  // Calculate last project
                                  const matchedProj = activeProjects
                                    .reverse()
                                    .find(
                                      (p: any) =>
                                        p.assignedTeam &&
                                        p.assignedTeam.includes(empName),
                                    );
                                  const lastProjText = matchedProj
                                    ? `${matchedProj.projectName} (${matchedProj.startedAt ? new Date(matchedProj.startedAt).toLocaleDateString("ar-SA") : ""})`
                                    : "---";

                                  return (
                                    <button
                                      key={empName}
                                      type="button"
                                      onMouseDown={() => {
                                        const copy = [...tempCrewRows];
                                        copy[idx] = {
                                          name: empName,
                                          nationality,
                                          role,
                                          experience: exp,
                                          lastProject: lastProjText,
                                          isConfirmed: true,
                                        };
                                        setTempCrewRows(copy);
                                        setActiveSearchIdx(null);
                                      }}
                                      className="w-full text-right p-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition flex justify-between items-center cursor-pointer"
                                    >
                                      <span className="font-extrabold">
                                        {empName}
                                      </span>
                                      <span className="text-[9px] text-slate-400">
                                        {role} | {nationality}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {row.nationality || "---"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {row.role || "---"}
                        </td>
                        <td className="p-3 text-center text-slate-550 font-semibold">
                          {row.experience || "---"}
                        </td>
                        <td className="p-3 text-center text-slate-450 text-[10px]">
                          {row.lastProject || "---"}
                        </td>
                        <td className="p-3 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setTempCrewRows(
                                tempCrewRows.filter((_, rI) => rI !== idx),
                              );
                            }}
                            className="text-rose-500 hover:text-rose-700 transition font-black text-sm p-1"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tempCrewRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-400 italic"
                      >
                        {lang === "ar"
                          ? 'الرجاء النقر على "إضافة موظف جديد" للبدء بالفرز والتعيين.'
                          : "No technicians assigned."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3.5">
              <button
                onClick={handleSaveTeam}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer"
              >
                💾{" "}
                {lang === "ar"
                  ? "حفظ وتثبيت فريق العمل الفني"
                  : "Save Assigned Crew"}
              </button>
              <button
                onClick={() => setShowAssignTeam(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {lang === "ar" ? "رجوع" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATES PLANNER DIALOG MODAL (Requirement) */}
      {showDatesForm && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-right"
            dir="rtl"
          >
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
              📅{" "}
              {lang === "ar"
                ? "جدولة وضبط أوقات تسليم المشروع"
                : "Configure Project Timeline"}
            </h3>

            <div className="space-y-3 text-xs leading-normal font-bold text-slate-600">
              <div>
                <label className="block mb-1">
                  {lang === "ar"
                    ? "تاريخ بداية التشغيل والتوريد:"
                    : "Start Date:"}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block mb-1">
                  {lang === "ar" ? "تاريخ الانتهاء الملتزم به:" : "End Date:"}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block mb-1">
                  {lang === "ar"
                    ? "الأيام الإضافية الاحتياطية (Buffer Days):"
                    : "Additional Buffer (Days):"}
                </label>
                <input
                  type="number"
                  value={bufferDays}
                  onChange={(e) => setBufferDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-mono font-bold"
                  min={0}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={handleSetDates}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer"
              >
                💾 {lang === "ar" ? "اعتماد التواريخ وقفله" : "Lock dates"}
              </button>
              <button
                onClick={() => setShowDatesForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY WORKFLOW TIMELINE POPUP (Requirement) */}
      {showTimelineDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-right animate-in zoom-in-95"
            dir="rtl"
          >
            <h3 className="text-sm font-black text-emerald-800 flex items-center gap-1.5 border-b pb-2">
              ⭐{" "}
              {lang === "ar"
                ? "تفاصيل المخطط الزمني المعتمد والنشط"
                : "Confirmed Project Timeline"}
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 font-bold leading-relaxed">
              <div className="p-3 bg-emerald-50/55 rounded-xl border border-emerald-100/50 space-y-2">
                <p>
                  {lang === "ar" ? "تاريخ البداية المعتمد:" : "Start Date:"}{" "}
                  <strong className="text-slate-900 font-mono block">
                    {selectedOrder.startDate}
                  </strong>
                </p>
                <p>
                  {lang === "ar" ? "تاريخ النهاية المستهدف:" : "End Date:"}{" "}
                  <strong className="text-slate-900 font-mono block">
                    {selectedOrder.endDate}
                  </strong>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border space-y-1.5">
                <p>
                  {lang === "ar"
                    ? "أيام الاحتياط الإضافية (Buffer):"
                    : "Cushion Days:"}{" "}
                  <strong className="text-slate-900 font-mono">
                    {selectedOrder.bufferDays || 0} يوم
                  </strong>
                </p>
                <p className="border-t pt-1.5 mt-1.5">
                  {lang === "ar"
                    ? "إجمالي وقت العمل المقرر للمشروع:"
                    : "Total Calculated Work days:"}{" "}
                  <strong className="text-[#0072BC] font-black">
                    {Math.ceil(
                      (new Date(selectedOrder.endDate).getTime() -
                        new Date(selectedOrder.startDate).getTime()) /
                        (1000 * 3600 * 24),
                    ) + Number(selectedOrder.bufferDays || 0)}{" "}
                    يوم عمل
                  </strong>
                </p>
              </div>

              <p className="text-[10px] text-slate-400 italic font-black leading-snug">
                🔒{" "}
                {lang === "ar"
                  ? "لقد تم تأكيد وإغلاق تخطيط الفترة الزمنية بنجاح ولا يمكن تعديله بموجب حوكمة الورشة."
                  : "Locked and approved schedule."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTimelineDetailsModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition text-xs"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE PIPELINE PATH DESIGNER MODAL (Requirement) */}
      {showPathForm && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right"
            dir="rtl"
          >
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
              ⛓️{" "}
              {lang === "ar"
                ? "تخطيط مسار وخط بناء الهيكل اللوحي"
                : "Design custom assembly pipeline"}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto text-xs font-bold leading-normal text-slate-600 pr-1">
              {stages.map((st, i) => (
                <div
                  key={i}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2"
                >
                  <div className="flex justify-between items-center text-[#0072BC]">
                    <span>
                      🎯{" "}
                      {lang === "ar"
                        ? `المرحلة السريعة رقم ${i + 1}:`
                        : `Step ${i + 1}:`}
                    </span>
                    <button
                      onClick={() =>
                        setStages(stages.filter((_, idx) => idx !== i))
                      }
                      className="text-rose-500 hover:text-rose-700"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const copy = [...stages];
                        copy[i].name = e.target.value;
                        setStages(copy);
                      }}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                      placeholder="اسم مرحلة التصنيع..."
                    />
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={st.requiresPayment}
                        onChange={(e) => {
                          const copy = [...stages];
                          copy[i].requiresPayment = e.target.checked;
                          setStages(copy);
                        }}
                      />
                      <span>
                        ⚠️{" "}
                        {lang === "ar"
                          ? "يتطلب استلام دفعة مالية للتخطي"
                          : "Flag stage Payment is critical!"}
                      </span>
                    </label>
                  </div>
                </div>
              ))}

              <button
                onClick={() =>
                  setStages([
                    ...stages,
                    {
                      name: "",
                      expectedDate: "",
                      requiresPayment: false,
                      notes: "",
                    },
                  ])
                }
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-center border-2 border-dashed border-slate-300"
              >
                ➕ {lang === "ar" ? "إدراج مرحلة إضافية بالخط" : "Insert step"}
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={handleSaveStages}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer"
              >
                💾{" "}
                {lang === "ar"
                  ? "توفير وحبس مسار الإنتاج"
                  : "Verify & Lock Pipeline"}
              </button>
              <button
                onClick={() => setShowPathForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold animate-pulse"
              >
                {lang === "ar" ? "رجوع" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGES ACTIVE SEQUENCE PERFORMANCE TRACER POPUP (Requirement) */}
      {showSequenceModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1500] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right animate-in fade-in"
            dir="rtl"
          >
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <h3 className="font-extrabold text-[#0072BC] text-sm">
                  ⛓️{" "}
                  {lang === "ar"
                    ? `تسلسل تدفق خط الإنتاج: ${selectedProject.projectNumber}`
                    : `Pipeline details: ${selectedProject.projectNumber}`}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedProject.projectName}
                </p>
              </div>
              <button
                onClick={() => setShowSequenceModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
              {selectedProject.pipelineStages &&
                selectedProject.pipelineStages.map((st: any, i: number) => {
                  const isActive = selectedProject.currentStageIndex === i;
                  const isCompleted =
                    i < selectedProject.currentStageIndex || st.completedAt;

                  // Look up payments if payment stage is locked
                  const payStatus = lastPaidStatus(
                    selectedProject.quotationNumber,
                  );
                  const isPaid =
                    payStatus.includes("تم التحصيل") ||
                    payStatus.includes("جميع الدفعات") ||
                    st.paymentReceived;
                  const collectionUnlocked = !st.requiresPayment || isPaid;

                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border-2 transition ${
                        isActive
                          ? "bg-indigo-50 border-indigo-400"
                          : isCompleted
                            ? "bg-slate-50 border-slate-200 opacity-60"
                            : "bg-white border-dashed border-slate-150"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black rounded-lg ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isActive
                                ? "bg-indigo-600 text-white animate-pulse"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isCompleted
                            ? lang === "ar"
                              ? "مرحلة مكتملة"
                              : "Completed"
                            : isActive
                              ? lang === "ar"
                                ? "المرحلة قيد التشغيل"
                                : "Active runtime run"
                              : lang === "ar"
                                ? "مرحلة معلقة"
                                : "Awaiting"}
                        </span>
                        <span className="font-extrabold text-[10px] text-slate-400">
                          🚨 المرحلة {i + 1}
                        </span>
                      </div>

                      <p className="font-extrabold text-slate-800 text-xs mt-2">
                        {st.name}
                      </p>

                      {/* Required Down Payment warning */}
                      {isPaid && st.requiresPayment && (
                        <div className="mt-2 text-[10px] p-2 bg-emerald-50 border border-emerald-150 text-emerald-950 font-black rounded-xl">
                          ✨{" "}
                          {lang === "ar"
                            ? "تم استلام الدفعة المبرمة بنجاح وتم تخطي شرط العبور! ✔"
                            : "Payment received successfully and path lock bypassed! ✔"}
                        </div>
                      )}
                      {st.requiresPayment && !isPaid && (
                        <div className="mt-2 text-[10px] p-2 bg-amber-50 border border-amber-150 text-amber-950 font-black rounded-xl">
                          🪙{" "}
                          {lang === "ar"
                            ? "شروط التشغيل المسبقة: مطلـوب استلام دفعة للعبور."
                            : "Pre-conditions: Downpayment target receipt checklist critical."}
                        </div>
                      )}

                      {isActive && (
                        <div className="mt-3 flex justify-end gap-2 border-t pt-2.5">
                          {/* Button: تم استلام الدفعة to unlock proceeding (Requirement) */}
                          {st.requiresPayment && !isPaid && (
                            <button
                              onClick={() =>
                                handleConfirmPaymentReceipt(selectedProject, i)
                              }
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded-lg transition"
                            >
                              🪙{" "}
                              {lang === "ar"
                                ? "تأكيد استلام الدفعة المبرمة"
                                : "Confirm payment collection"}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleProceedStage(selectedProject, i)
                            }
                            disabled={st.requiresPayment && !collectionUnlocked}
                            className={`px-4 py-2 font-black rounded-xl text-[10px] transition cursor-pointer shadow-sm ${
                              st.requiresPayment && !collectionUnlocked
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed border"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {i === selectedProject.pipelineStages.length - 1
                              ? lang === "ar"
                                ? "🏁 إنهاء المرحلة وتأكيد انتهاء الإنتاج بالكامل"
                                : "Complete final production"
                              : lang === "ar"
                                ? "إنهاء المرحلة والانتقال للتالية ➡️"
                                : "Sign-off stage"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSequenceModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTALLATION location coordinates popups */}
      {showLocationModal && selectedInstallReq && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-right"
            dir="rtl"
          >
            <h3 className="font-extrabold text-indigo-950 text-sm">
              📍{" "}
              {lang === "ar"
                ? "تحديد موقع التركيب الميداني (خرائط Google)"
                : "Configure Field Coordinates"}
            </h3>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-600">
                {lang === "ar"
                  ? "رابط خريطة Google Maps للموقع المصدق:"
                  : "Google Maps hyperlink location:"}
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/..."
                className="w-full p-3 font-semibold text-left border rounded-xl bg-slate-50"
                dir="ltr"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-2">
              <button
                onClick={handleSaveInstallLocation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer"
              >
                💾{" "}
                {lang === "ar" ? "حفظ الموقع بالملف" : "Lock site coordinates"}
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM INSTALLATION CREW ASSIGNMENT NESTED MODAL (Requirement) */}
      {showInstallTeamModal && selectedInstallReq && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1600] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right"
            dir="rtl"
          >
            <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
              👥{" "}
              {lang === "ar"
                ? "تحديد فريق التركيب الميداني"
                : "Assign installation technicians"}
            </h3>

            <div className="space-y-2 text-xs font-bold text-slate-600 leading-normal max-h-60 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-slate-400 italic">
                  {lang === "ar"
                    ? "لم يعثر بعد على فنيين شاغرين بملف الموارد البشرية."
                    : "No human resources fetched."}
                </p>
              ) : (
                employees.map((emp) => {
                  const empName =
                    (emp as any).name || emp.arabicName || emp.englishName;
                  const isChecked = assignedCrew.includes(empName);
                  return (
                    <label
                      key={empName}
                      className="flex items-center gap-3 p-2.5 hover:bg-slate-50 border rounded-xl cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setAssignedCrew(
                              assignedCrew.filter((x) => x !== empName),
                            );
                          } else {
                            setAssignedCrew([...assignedCrew, empName]);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-slate-800 text-xs font-black">
                          {empName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {emp.department || "تركيب"} |{" "}
                          {emp.nationality || "سعودي"} | خبرة:{" "}
                          {emp.experienceYears || 2} سنة
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-2 shrink-0">
              <button
                onClick={handleSaveInstallTeam}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-[11px] cursor-pointer shadow-md"
              >
                💾 {lang === "ar" ? "حفظ" : "Save"}
              </button>
              <button
                onClick={() => setShowInstallTeamModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border text-right animate-in zoom-in-95"
            dir="rtl"
          >
            <div
              className={`flex items-center gap-2 ${confirmDialog.isDestructive ? "text-red-600" : "text-amber-600"}`}
            >
              <span className="text-xl">
                {confirmDialog.isDestructive ? "🗑️" : "⚠️"}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={
                  confirmDialog.countdown && confirmDialog.countdown > 0
                }
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${confirmDialog.isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-[#0072BC] hover:bg-blue-700"}`}
              >
                {confirmDialog.countdown && confirmDialog.countdown > 0
                  ? `${lang === "ar" ? "انتظر" : "Wait"} (${confirmDialog.countdown})`
                  : lang === "ar"
                    ? "تأكيد العمل"
                    : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
