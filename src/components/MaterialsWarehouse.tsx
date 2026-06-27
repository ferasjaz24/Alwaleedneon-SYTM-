import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  PlusCircle,
  Printer,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Download,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  CheckCircle,
  Wand2,
} from "lucide-react";
import {
  sharedPrintHeader,
  sharedPrintFooter,
  sharedPrintStyles,
} from "../utils/PrintShared";

export interface MaterialItem {
  id?: string;
  itemCode: string;
  itemNameAr: string;
  itemNameEn: string;
  category: string;
  uom: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;

  currentQty: number;
  minStock: number;
  storageLocation: string;
  status?: string; // Calculated field or override

  purchasePrice: number;
  defaultSellingPrice?: number;
  vatApplies: boolean;
  defaultSupplier: string;

  thickness?: string;
  color?: string;
  size?: string;
  material?: string;
  modelType?: string;
  origin?: string;
  brand?: string;

  attachment?: string;
  dateCreated?: string;
}

const CATEGORIES = [
  { name: "أكريليك", code: "ACR" },
  { name: "كلادينج ACP", code: "ACP" },
  { name: "معادن", code: "MET" },
  { name: "إضاءة وكهرباء", code: "ELE" },
  { name: "خامات طباعة", code: "PRN" },
  { name: "ستكر وفينيل", code: "STV" },
  { name: "دهانات ومواد كيميائية", code: "PNT" },
  { name: "أدوات تركيب", code: "TLI" },
  { name: "تغليف وحماية", code: "PKG" },
  { name: "أحبار وقطع طابعات", code: "INK" },
  { name: "خامات لوحات جاهزة", code: "BRD" },
  { name: "استاندات ومعارض", code: "STD" },
  { name: "LED", code: "LED" },
  { name: "محولات", code: "PWR" },
  { name: "ستانلس", code: "STL" },
  { name: "زنكور", code: "ZNC" },
  { name: "أخرى", code: "OTH" },
];

const UOM_LIST = [
  "حبة",
  "متر",
  "متر مربع",
  "لوح",
  "رول",
  "كرتون",
  "علبة",
  "كيلو",
  "لتر",
  "طقم",
  "باكيت",
];

export default function MaterialsWarehouse({ lang }: { lang: "ar" | "en" }) {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportText, setSmartImportText] = useState("");
  const [smartImportFile, setSmartImportFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [editingItem, setEditingItem] = useState<Partial<MaterialItem>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    targetId: string | null;
  }>({ isOpen: false, targetId: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const smartImportFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const ts = Date.now();
      const [res, supRes] = await Promise.all([
        fetch(`/api/dynamic/materials_warehouse?t=${ts}`),
        fetch(`/api/dynamic/suppliers?t=${ts}`),
      ]);
      if (res.ok) {
        setItems(await res.json());
      } else {
        setItems([]);
      }
      if (supRes.ok) {
        setSuppliersList(await supRes.json());
      }
    } catch (e) {
      console.error("Failed to load items", e);
    }
  };

  const handleTranslate = async (
    text: string,
    context: string,
    field: "itemNameEn" | "descriptionEn",
  ) => {
    if (!text || editingItem[field]) return; // Only translate if English is empty
    try {
      const res = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          setEditingItem((prev) => ({ ...prev, [field]: data.translatedText }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateItemCode = () => {
    if (!editingItem.category) return;
    const cat = CATEGORIES.find((c) => c.name === editingItem.category);
    if (cat) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setEditingItem({
        ...editingItem,
        itemCode: `${cat.code}-${randomSuffix}`,
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditingItem((prev) => ({
          ...prev,
          imageUrl: ev.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditingItem((prev) => ({
          ...prev,
          attachment: ev.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleSave = async () => {
    if (
      !editingItem.itemCode ||
      !editingItem.itemNameAr ||
      !editingItem.category ||
      !editingItem.uom
    ) {
      alert(
        lang === "ar"
          ? "يرجى تعبئة الحقول الأساسية (رمز الصنف، اسم الصنف، التصنيف، الوحدة)."
          : "Please fill required fields.",
      );
      return;
    }

    if (
      items.some(
        (i) => i.itemCode === editingItem.itemCode && i.id !== editingItem.id,
      )
    ) {
      alert(
        lang === "ar" ? "رمز الصنف موجود مسبقاً!" : "Item code already exists!",
      );
      return;
    }

    let newItem = { ...editingItem } as MaterialItem;
    // Format numeric bounds
    newItem.currentQty = Number(newItem.currentQty) || 0;
    newItem.minStock = Number(newItem.minStock) || 0;
    newItem.purchasePrice = Number(newItem.purchasePrice) || 0;
    newItem.defaultSellingPrice = Number(newItem.defaultSellingPrice) || 0;

    setIsSaving(true);
    try {
      if (editingItem.id) {
        const res = await fetch(
          `/api/dynamic/materials_warehouse/${editingItem.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem),
          },
        );
        if (res.ok) {
          setItems(items.map((i) => (i.id === editingItem.id ? newItem : i)));
        }
      } else {
        newItem = { ...newItem, dateCreated: new Date().toISOString() };
        const res = await fetch("/api/dynamic/materials_warehouse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
        if (res.ok) {
          const json = await res.json();
          const newId = json.data?.id || json.id || `MAT-${Date.now()}`;
          setItems([{ ...newItem, id: newId }, ...items]);
        } else {
          // Fallback if dynamic API not working properly
          newItem.id = `MAT-${Date.now()}`;
          setItems([newItem, ...items]);
        }
      }
      setToast({
        message:
          lang === "ar"
            ? "تم حفظ بيانات المادة بنجاح"
            : "Material saved successfully",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
      setIsModalOpen(false);
      setEditingItem({});
    } catch (e) {
      setToast({
        message:
          lang === "ar" ? "حدث خطأ أثناء حفظ المادة" : "Error saving material",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateStatus = (qty: number, min: number, override?: string) => {
    if (override && override === "موقوف") return "موقوف";
    if (qty <= 0) return "غير متوفر";
    if (qty < min) return "منخفض";
    return "متوفر";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "متوفر":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "منخفض":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "غير متوفر":
        return "text-red-700 bg-red-50 border-red-200";
      case "موقوف":
        return "text-slate-700 bg-slate-100 border-slate-300";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return alert("يرجى تحديد مواد أولاً");
    const selected = items.filter((i) => selectedItems.includes(i.id!));

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <title>قائمة المواد المحددة</title>
          <style>
            ${sharedPrintStyles}
            body { font-family: 'Tajawal', Tahoma, Arial; direction: rtl; text-align: right; margin: 0; padding: 0; background: #fff; }
            .print-container { padding: 0; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; min-height: 100vh; }
            .content-wrapper { flex-grow: 1; }
            .page-title { color: #0072BC; text-align: center; border-bottom: 2px solid #0072BC; padding-bottom: 10px; margin-bottom: 20px; font-size: 20px; font-weight: bold; }
            .items-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
            .item-card { width: calc(50% - 10px); border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); break-inside: avoid; background: #fff; }
            .item-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
            .item-title { margin: 0 0 5px 0; color: #1e293b; font-size: 16px; font-weight: bold; }
            .item-code { margin: 0; color: #64748b; font-size: 12px; }
            .item-img { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
            .details-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .details-table th { text-align: right; color: #475569; padding: 4px 0; width: 40%; font-weight: normal; }
            .details-table td { padding: 4px 0; font-weight: bold; color: #0f172a; }
            .qty-val { color: #0072BC; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${sharedPrintHeader}
            <div class="content-wrapper">
              <div class="page-title">تقرير أصناف المواد الخام</div>
              <table class="details-table" style="width: 100%; border: 1px solid #cbd5e1; text-align: right;">
                 <thead>
                   <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                     <th style="padding: 10px; border: 1px solid #cbd5e1; white-space: nowrap;">الصورة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">اسم المادة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الرمز</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">التصنيف</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الكمية</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الوحدة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">موقع التخزين</th>
                   </tr>
                 </thead>
                 <tbody>
                 ${selected.map((item) => `
                   <tr style="border-bottom: 1px solid #e2e8f0;">
                     <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 60px;">
                       ${item.imageUrl ? `<img src="${item.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />` : '---'}
                     </td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">
                       ${item.itemNameAr || '---'}
                     </td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #64748b;">${item.itemCode || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.category || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: black; color: #0072BC;">${item.currentQty || 0}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.uom || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.storageLocation || '---'}</td>
                   </tr>
                 `).join('')}
                 </tbody>
               </table>
            </div>
            ${sharedPrintFooter}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWin.document.write(printContent);
    printWin.document.close();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchCode, dateFilter, sortOrder]);

  const filteredItems = useMemo(() => {
    let res = [...items];
    if (searchTerm) {
      res = res.filter(
        (i) =>
          (i.itemNameAr && i.itemNameAr.includes(searchTerm)) ||
          (i.itemNameEn &&
            i.itemNameEn.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    if (searchCode) {
      res = res.filter(
        (i) =>
          i.itemCode &&
          i.itemCode.toLowerCase().includes(searchCode.toLowerCase()),
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      res = res.filter((i) => {
        if (!i.dateCreated) return true;
        const cDate = new Date(i.dateCreated);
        const diffMs = now.getTime() - cDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        if (dateFilter === "year") return diffDays <= 365;
        if (dateFilter === "older") return diffDays > 365;
        return true;
      });
    }

    res.sort((a, b) => {
      const d1 = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const d2 = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return sortOrder === "newest" ? d2 - d1 : d1 - d2;
    });

    return res;
  }, [items, searchTerm, searchCode, dateFilter, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return alert("يرجى تحديد مواد أولاً");
    setDeleteConfirm({ isOpen: true, targetId: "BULK" });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.targetId) return;

    try {
      setIsSaving(true);
      if (deleteConfirm.targetId === "BULK") {
        for (const id of selectedItems) {
          await fetch(`/api/dynamic/materials_warehouse/${id}`, {
            method: "DELETE",
          });
        }
        setItems(items.filter((i) => !selectedItems.includes(i.id!)));
        setSelectedItems([]);
        setToast({
          message:
            lang === "ar"
              ? "تم حذف المواد المحددة بنجاح"
              : "Selected materials deleted",
          type: "success",
        });
      } else {
        await fetch(
          `/api/dynamic/materials_warehouse/${deleteConfirm.targetId}`,
          { method: "DELETE" },
        );
        setItems(items.filter((i) => i.id !== deleteConfirm.targetId));
        setToast({
          message: lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully",
          type: "success",
        });
      }
    } catch (e) {
      setToast({
        message: lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setDeleteConfirm({ isOpen: false, targetId: null });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSmartImportImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSmartImportFile(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleSmartImport = async () => {
    if (!smartImportText.trim() && !smartImportFile) {
      setToast({
        message:
          lang === "ar"
            ? "الرجاء إدخال نص أو إرفاق ملف"
            : "Please input text or attach file",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch("/api/gemini/parse-warehouse-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: smartImportText,
          fileBase64: smartImportFile,
          isMaterial: true,
          categories: CATEGORIES,
        }),
      });

      if (res.ok) {
        const parsedItems = await res.json();

        let newAddedItems: MaterialItem[] = [];

        // Push all parsed objects to DB
        for (const pi of parsedItems) {
          const cat = CATEGORIES.find((c) => c.name === pi.category);
          const prefix = cat ? cat.code : "MAT";
          const newItem: MaterialItem = {
            itemCode:
              pi.materialCode || pi.itemCode || `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
            itemNameAr: pi.materialName || pi.itemName || "مادة غير معروفة",
            itemNameEn: "",
            category: pi.category || "أخرى",
            uom: pi.unit || "حبة",
            descriptionAr: pi.description || "",
            descriptionEn: "",
            currentQty: Number(pi.quantity) || 0,
            minStock: 0,
            storageLocation: "",
            purchasePrice: Number(pi.price) || 0,
            vatApplies: true,
            defaultSupplier: "",
            dateCreated: new Date().toISOString(),
          };

          const createRes = await fetch("/api/dynamic/materials_warehouse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem),
          });

          if (createRes.ok) {
            const json = await createRes.json();
            const newId =
              json.data?.id ||
              json.id ||
              `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            newAddedItems.push({ ...newItem, id: newId });
          }
        }

        setItems((prev) => [...newAddedItems, ...prev]);
        setToast({
          message:
            lang === "ar"
              ? `تم استيراد وإضافة ${newAddedItems.length} مواد بنجاح`
              : `Successfully imported ${newAddedItems.length} materials`,
          type: "success",
        });
        setIsSmartImportOpen(false);
        setSmartImportText("");
        setSmartImportFile(null);
      } else {
        throw new Error("Parsing failed");
      }
    } catch (err) {
      setToast({
        message:
          lang === "ar"
            ? "فشل استيراد المواد، تأكد من البيانات."
            : "Failed to import materials",
        type: "error",
      });
    } finally {
      setIsParsing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm animate-in slide-in-from-top-10 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <span className="text-3xl text-emerald-600">🏗️</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              {lang === "ar" ? "مستودع المواد" : "Materials Warehouse"}
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-1">
              {lang === "ar"
                ? "إدارة المواد الخام للمصنع، الكميات، والمستودعات"
                : "Manage factory raw materials, stock quantities, and storage"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {selectedItems.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-5 py-2.5 rounded-xl font-bold transition"
            >
              <Trash2 className="w-5 h-5" />
              {lang === "ar" ? "حذف المحدد" : "Delete Selected"}
            </button>
          )}
          <button
            onClick={() => setIsSmartImportOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 transition"
          >
            <Wand2 className="w-5 h-5" />
            {lang === "ar" ? "استيراد ذكي" : "Smart Import"}
          </button>
          <button
            onClick={handleExportSelected}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition"
          >
            <Printer className="w-5 h-5" />
            {lang === "ar" ? "تصدير الأصناف المحددة" : "Export Selected"}
          </button>
          <button
            onClick={() => {
              setEditingItem({
                currentQty: 0,
                minStock: 0,
                vatApplies: true,
                purchasePrice: 0,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#0072BC] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md shadow-blue-200"
          >
            <PlusCircle className="w-5 h-5" />
            {lang === "ar" ? "إضافة مادة جديدة" : "Add Material"}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {lang === "ar" ? "بحث باسم الصنف" : "Search by Name"}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0072BC] text-sm font-bold text-slate-700"
              placeholder={
                lang === "ar" ? "اكتب اسم المادة..." : "Material name..."
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {lang === "ar" ? "بحث برقم الصنف" : "Search by Code"}
            </label>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0072BC] text-sm font-bold text-slate-700"
              placeholder={lang === "ar" ? "رمز الصنف..." : "Material Code..."}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {lang === "ar" ? "الفترة الزمنية" : "Time Period"}
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0072BC] text-sm font-bold text-slate-700"
            >
              <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
              <option value="week">
                {lang === "ar" ? "هذا الاسبوع" : "This Week"}
              </option>
              <option value="month">
                {lang === "ar" ? "هذا الشهر" : "This Month"}
              </option>
              <option value="year">
                {lang === "ar" ? "هذه السنة" : "This Year"}
              </option>
              <option value="older">
                {lang === "ar" ? "قبل أكثر من سنة" : "Older"}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {lang === "ar" ? "الترتيب" : "Sort Order"}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0072BC] text-sm font-bold text-slate-700"
            >
              <option value="newest">
                {lang === "ar" ? "من الأحدث للأقدم" : "Newest to Oldest"}
              </option>
              <option value="oldest">
                {lang === "ar" ? "من الأقدم للأحدث" : "Oldest to Newest"}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid -> Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === paginatedItems.length &&
                      paginatedItems.length > 0
                    }
                    onChange={(e) =>
                      setSelectedItems(
                        e.target.checked ? paginatedItems.map((i) => i.id!) : [],
                      )
                    }
                    className="w-5 h-5 accent-[#0072BC] cursor-pointer rounded-md border-slate-300"
                  />
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "الصورة" : "Image"}
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "رقم و اسم الصنف" : "Code & Name"}
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "التصنيف" : "Category"}
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "الوحدة والكمية" : "UoM & Qty"}
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="p-4 font-bold">
                  {lang === "ar" ? "إجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => {
                const isSelected = selectedItems.includes(item.id!);
                const calculatedStatus = calculateStatus(
                  item.currentQty,
                  item.minStock,
                  item.status,
                );
                const statusStyle = getStatusColor(calculatedStatus);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition ${isSelected ? "bg-blue-50/20" : ""}`}
                  >
                    <td className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedItems([...selectedItems, item.id!]);
                          else
                            setSelectedItems(
                              selectedItems.filter((id) => id !== item.id),
                            );
                        }}
                        className="w-5 h-5 accent-[#0072BC] cursor-pointer rounded-md shadow-sm border-slate-300"
                      />
                    </td>
                    <td className="p-4 w-16">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            className="w-full h-full object-cover"
                            alt={item.itemNameAr}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-800">
                        {item.itemNameAr}
                      </div>
                      <div className="text-xs font-bold text-slate-500 mt-1">
                        {item.itemCode || "---"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-600 text-xs">
                        <span className="text-sm font-black text-[#0072BC]">
                          {item.currentQty}
                        </span>{" "}
                        {item.uom}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">
                        الحد الأدنى: {item.minStock}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${statusStyle}`}
                      >
                        {calculatedStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-xl transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              targetId: item.id!,
                            })
                          }
                          className="p-2 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedItems.length === 0 && (
            <div className="py-20 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-bold">
                {lang === "ar"
                  ? "لا توجد مواد مطابقة للبحث"
                  : "No materials found"}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-100 bg-slate-50 gap-4">
           <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">{lang === 'ar' ? 'عرض' : 'Show'}</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="p-1.5 border border-slate-300 rounded-lg font-bold text-sm bg-white outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm font-bold text-slate-500">{lang === 'ar' ? 'عنصر لكل صفحة' : 'items per page'}</span>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {lang === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <div className="text-sm font-bold text-slate-600 px-2 flex items-center min-w-[100px] justify-center">
                {lang === 'ar' ? `صفحة ${currentPage} من ${totalPages || 1}` : `Page ${currentPage} of ${totalPages || 1}`}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {lang === 'ar' ? 'التالي' : 'Next'}
              </button>
           </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {editingItem.id
                    ? "تعديل بيانات مادة"
                    : "إضافة مادة خام جديدة"}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  تعبئة مواصفات المادة لسهولة جرد المخزون والربط بالمشتريات
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 bg-slate-100 rounded-full transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* الصورة - Photo */}
              <div className="flex justify-center">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className={`w-32 h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${editingItem.imageUrl ? "border-transparent bg-slate-50" : "border-slate-300 hover:border-[#0072BC] bg-slate-50 hover:bg-blue-50/50"}`}
                  >
                    {editingItem.imageUrl ? (
                      <img
                        src={editingItem.imageUrl}
                        className="w-full h-full object-cover rounded-3xl shadow-sm"
                        alt="Preview"
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2 group-hover:text-[#0072BC] transition-colors" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0072BC]">
                          صورة المادة
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* البطاقة 1: المعلومات الأساسية */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm relative">
                <div className="absolute -top-3 right-5 bg-[#0072BC] text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm">
                  المعلومات الأساسية
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      تصنيف الصنف <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white"
                      value={editingItem.category || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="">اختر التصنيف...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      رمز الصنف <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-xl font-bold font-mono text-sm bg-white"
                        placeholder="مثال: ACR-001"
                        value={editingItem.itemCode || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            itemCode: e.target.value,
                          })
                        }
                      />
                      <button
                        onClick={generateItemCode}
                        className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
                        title="توليد تلقائي لرمز المادة"
                      >
                        توليد ⚙️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      الاسم التجاري (عربي){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border rounded-xl font-bold text-sm bg-white"
                      placeholder="مثال: أكريليك شفاف 3 ملم"
                      value={editingItem.itemNameAr || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemNameAr: e.target.value,
                        })
                      }
                      onBlur={() =>
                        handleTranslate(
                          editingItem.itemNameAr || "",
                          "اسم صنف مشتريات مواد خام مصنع دعاية",
                          "itemNameEn",
                        )
                      }
                    />
                  </div>
                  <div dir="ltr">
                    <label className="block mb-1.5 text-sm font-bold text-slate-700 text-left">
                      Item Name (EN)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border rounded-xl font-bold text-sm bg-slate-100 placeholder:text-slate-400"
                      placeholder="e.g. Clear Acrylic 3mm"
                      value={editingItem.itemNameEn || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemNameEn: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-bold text-slate-700">
                    وحدة القياس <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border rounded-xl font-bold text-sm bg-white"
                    value={editingItem.uom || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, uom: e.target.value })
                    }
                  >
                    <option value="">اختر الوحدة...</option>
                    {UOM_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      الوصف (عربي)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2.5 border rounded-xl font-bold text-sm bg-white resize-none"
                      placeholder="المواصفات الفنية الوصفية..."
                      value={editingItem.descriptionAr || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          descriptionAr: e.target.value,
                        })
                      }
                      onBlur={() =>
                        handleTranslate(
                          editingItem.descriptionAr || "",
                          "وصف فني لمادة خام في الإنتاج",
                          "descriptionEn",
                        )
                      }
                    />
                  </div>
                  <div dir="ltr">
                    <label className="block mb-1.5 text-sm font-bold text-slate-700 text-left">
                      Description (EN)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2.5 border rounded-xl font-bold text-sm bg-slate-100 resize-none"
                      placeholder="Technical Description..."
                      value={editingItem.descriptionEn || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          descriptionEn: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* البطاقة 2: معلومات المخزون */}
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl space-y-4 shadow-sm relative mt-8">
                <div className="absolute -top-3 right-5 bg-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm flex items-center gap-1">
                  📊 معلومات المخزون
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-orange-900">
                      الكمية الحالية <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white text-orange-900"
                      value={editingItem.currentQty ?? 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          currentQty: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-orange-900">
                      الحد الأدنى للمخزون (للتنبيه){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white"
                      value={editingItem.minStock ?? 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          minStock: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-orange-900">
                      موقع التخزين بدقة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: رف A-03"
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white"
                      value={editingItem.storageLocation || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          storageLocation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-orange-900">
                      حالة الصنف المباشرة
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white"
                      value={editingItem.status || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="">تلقائي (حسب الكمية)</option>
                      <option value="موقوف">موقوف</option>
                    </select>
                    <p className="text-[9px] text-orange-700 mt-1 font-bold">
                      النظام يحسب الحالة (متوفر / منخفض / غير متوفر) استناداً
                      للكمية والحد الأدنى ما لم يتم الإيقاف.
                    </p>
                  </div>
                </div>
              </div>

              {/* البطاقة 3: معلومات السعر */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl space-y-4 shadow-sm relative mt-8">
                <div className="absolute -top-3 right-5 bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm flex items-center gap-1">
                  💸 معلومات السعر والمورد
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-emerald-900">
                      سعر الشراء (تكلُفة الوحدة) SAR
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-xl font-black text-sm text-emerald-700 bg-white"
                      value={editingItem.purchasePrice ?? 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          purchasePrice: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-emerald-900">
                      سعر البيع الافتراضي (اختياري) SAR
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-xl font-black text-sm bg-white"
                      value={editingItem.defaultSellingPrice ?? ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          defaultSellingPrice: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div
                    className="flex items-center gap-2 mt-4 bg-emerald-100 p-3 rounded-xl border border-emerald-200 cursor-pointer"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        vatApplies: !editingItem.vatApplies,
                      })
                    }
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-emerald-600 cursor-pointer"
                      checked={editingItem.vatApplies ?? false}
                      readOnly
                    />
                    <label className="text-[11px] font-black text-emerald-900 cursor-pointer">
                      الضريبة 15% المضافة إذا ينطبق
                    </label>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-black text-emerald-900">
                      المورد الافتراضي
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-xl font-bold text-sm bg-white"
                      value={editingItem.defaultSupplier || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          defaultSupplier: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        {lang === "ar" ? "اختر مورد..." : "Select Supplier..."}
                      </option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.specialty ? `(${s.specialty})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* البطاقة 4: معلومات فنية اختيارية */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm relative mt-8">
                <div className="absolute -top-3 right-5 bg-slate-700 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm flex items-center gap-1">
                  ⚙️ معلومات فنية للمادة (اختياري)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      السماكة
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: 3mm"
                      value={editingItem.thickness || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          thickness: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      اللون
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: أبيض ناصع"
                      value={editingItem.color || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          color: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      المقاس
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: 122×244 cm"
                      value={editingItem.size || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, size: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      الخامة
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: Acrylic"
                      value={editingItem.material || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          material: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      الموديل / النوع
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: Cast"
                      value={editingItem.modelType || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          modelType: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      الماركة
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: Mitsubishi"
                      value={editingItem.brand || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          brand: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-slate-500">
                      بلد الصنع
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      placeholder="مثال: تايوان"
                      value={editingItem.origin || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          origin: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* البطاقة 5: المرفقات */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm relative mt-8">
                <div className="absolute -top-3 right-5 bg-slate-500 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm flex items-center gap-1">
                  📎 المرفقات (ملفات)
                </div>
                <div className="pt-2">
                  <label className="block mb-1.5 text-sm font-bold text-slate-700">
                    تعهد الشراء أو الفاتورة / ملفات أخرى
                  </label>
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() => attachmentRef.current?.click()}
                      className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-black px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      <FileText className="w-4 h-4" />
                      إرفاق ملف المستند (PDF/صورة)
                    </button>
                    <input
                      type="file"
                      ref={attachmentRef}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleAttachmentUpload}
                    />
                    {editingItem.attachment && (
                      <div className="flex items-center justify-between bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold max-w-[200px] truncate shadow-sm">
                        تم إرفاق ملف المستند
                        <button
                          onClick={() =>
                            setEditingItem({ ...editingItem, attachment: "" })
                          }
                          className="mr-2 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-sm disabled:opacity-50"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 py-3 bg-[#0072BC] hover:bg-blue-700 text-white rounded-xl font-black transition text-sm shadow-md active:scale-95 disabled:opacity-75"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSaving
                  ? lang === "ar"
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : lang === "ar"
                    ? "حفظ بيانات المادة"
                    : "Save Material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSmartImportOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                {lang === "ar"
                  ? "استيراد المواد الذكي"
                  : "Smart Materials Import"}
              </h3>
              <button
                onClick={() => {
                  setIsSmartImportOpen(false);
                  setSmartImportText("");
                  setSmartImportFile(null);
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-sm mb-4">
                <p className="font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === "ar"
                    ? "انسخ والصق جداول، نصوص، أو ارفع ملفات صور أو PDF وسيتم قراءتها واضافتها تلقائيا"
                    : "Paste text/tables or upload images/PDFs. AI will read it and add materials automatically."}
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  {lang === "ar"
                    ? "النص لرفعه بالذكاء الاصطناعي:"
                    : "Text to parse:"}
                </label>
                <textarea
                  value={smartImportText}
                  onChange={(e) => setSmartImportText(e.target.value)}
                  rows={5}
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:border-purple-500 resize-none font-mono text-sm leading-relaxed"
                  placeholder={
                    lang === "ar"
                      ? "انسخ أي نص أو جدول يحتوي على المواد والصقه هنا..."
                      : "Paste any text or table containing material details..."
                  }
                ></textarea>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-bold uppercase">
                  {lang === "ar" ? "أو" : "OR"}
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  {lang === "ar" ? "ملف صورة أو PDF:" : "Image or PDF File:"}
                </label>
                <input
                  type="file"
                  accept="image/*, application/pdf"
                  hidden
                  ref={smartImportFileRef}
                  onChange={handleSmartImportImageUpload}
                />
                <div
                  onClick={() => smartImportFileRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition"
                >
                  {smartImportFile ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                      <span className="text-emerald-700 font-bold">
                        {lang === "ar" ? "تم اختيار الملف" : "File selected"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <FileText className="w-10 h-10 mb-3 text-slate-300" />
                      <span className="font-bold">
                        {lang === "ar"
                          ? "اضغط لرفع ملف (صورة / PDF)"
                          : "Click to select (Image / PDF)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => handleSmartImport()}
                disabled={
                  isParsing || (!smartImportText.trim() && !smartImportFile)
                }
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isParsing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                {lang === "ar" ? "استيراد بالذكاء الاصطناعي" : "Import with AI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                {lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
              </h3>
              <p className="text-slate-500 font-bold mb-6">
                {deleteConfirm.targetId === "BULK"
                  ? lang === "ar"
                    ? "هل أنت متأكد من حذف جميع المواد المحددة؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete all selected items? This cannot be undone."
                  : lang === "ar"
                    ? "هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن ذلك."
                    : "Are you sure you want to delete this item? This action cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ isOpen: false, targetId: null })
                  }
                  disabled={isSaving}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition shadow-md shadow-rose-200 disabled:opacity-75"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  {lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
