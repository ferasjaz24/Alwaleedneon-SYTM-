import React, { useState, useRef, useMemo, useEffect } from "react";
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
import { WarehouseItem } from "../types";
import {
  sharedPrintHeader,
  sharedPrintFooter,
  sharedPrintStyles,
} from "../utils/PrintShared";

export default function ItemsWarehouse({ lang }: { lang: "ar" | "en" }) {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, month, week, year, older
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportText, setSmartImportText] = useState("");
  const [smartImportFile, setSmartImportFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [editingItem, setEditingItem] = useState<Partial<WarehouseItem>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    targetId: string | null;
  }>({ isOpen: false, targetId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const smartImportFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/warehouse_items");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error("Failed to load items", e);
    }
  };

  const ITEM_GROUPS = [
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
    { name: "Background", code: "241" },
    { name: "منتجات", code: "242" },
    { name: "مجموعات الأصناف", code: "243" },
    { name: "خدمات", code: "244" },
    { name: "أصناف مجمعة", code: "245" },
    { name: "Sign", code: "246" },
    { name: "Printing", code: "247" },
    { name: "Neon", code: "248" },
    { name: "Letters", code: "249" },
    { name: "مواد خام", code: "240" },
  ];

  const UOM_LIST = [
    "M2",
    "طن",
    "SQM",
    "متر",
    "Meter",
    "Nos",
    "كرتون",
    "لتر",
    "Pc",
    "Valid UOM",
    "Link",
    "ساعة",
    "كيلو",
    "دقيقة",
    "زوج",
    "مجموعة",
    "وحدة",
  ];
  const WAREHOUSES = ["مستودع الدمام الاساسي - المصنع الرئيسي", "خدمات"];

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
    if (!editingItem.itemGroup) return;
    const group = ITEM_GROUPS.find((g) => g.name === editingItem.itemGroup);
    if (group) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
      setEditingItem({
        ...editingItem,
        itemCode: `${group.code}-${randomSuffix}`,
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

  const handleSave = async (isDraft: boolean) => {
    if (!isDraft) {
      if (
        !editingItem.itemGroup ||
        !editingItem.itemCode ||
        !editingItem.itemNameAr ||
        !editingItem.defaultUnit ||
        !editingItem.warehouse ||
        editingItem.isPurchaseItem === undefined ||
        !editingItem.descriptionAr
      ) {
        alert(
          "يرجى تعبئة جميع الحقول المطلوبة (يتضمن المجموعة، رمز الصنف، الاسم، الوحدة، المستودع، صنف شراء، الوصف).",
        );
        return;
      }
    }

    if (
      items.some(
        (i) =>
          i.itemCode &&
          i.itemCode === editingItem.itemCode &&
          i.id !== editingItem.id,
      )
    ) {
      alert("رمز الصنف موجود مسبقاً!");
      return;
    }

    let newItem = { ...editingItem, isDraft } as WarehouseItem;
    try {
      if (editingItem.id) {
        const res = await fetch(`/api/warehouse_items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
        if (res.ok) {
          setItems(items.map((i) => (i.id === editingItem.id ? newItem : i)));
        }
      } else {
        newItem = { ...newItem, dateCreated: new Date().toISOString() };
        const res = await fetch("/api/warehouse_items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
        if (res.ok) {
          const json = await res.json();
          setItems([json.item, ...items]);
        }
      }
      setIsModalOpen(false);
      setEditingItem({});
    } catch (e) {
      alert("حدث خطأ في حفظ الصنف");
      console.error(e);
    }
  };

  const handleCloseIcon = () => {
    // If not saved and no ID and has content, save as draft.
    const hasContent = Object.values(editingItem).some((v) =>
      typeof v === "string" ? v.trim() !== "" : v !== undefined,
    );

    if (!editingItem.id && hasContent) {
      handleSave(true);
    } else {
      setIsModalOpen(false);
      setEditingItem({});
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm.targetId) return;
    try {
      setIsDeleting(true);
      if (deleteConfirm.targetId === "BULK") {
        for (const id of selectedItems) {
          await fetch(`/api/warehouse_items/${id}`, { method: "DELETE" });
        }
        setItems(items.filter((i) => !selectedItems.includes(i.id!)));
        setSelectedItems([]);
        setToast({
          message:
            lang === "ar"
              ? "تم حذف الأصناف بنجاح"
              : "Items deleted successfully",
          type: "success",
        });
      } else {
        await fetch(`/api/warehouse_items/${deleteConfirm.targetId}`, {
          method: "DELETE",
        });
        setItems(items.filter((i) => i.id !== deleteConfirm.targetId));
        setToast({
          message: lang === "ar" ? "تم حذف الصنف بنجاح" : "Item deleted",
          type: "success",
        });
      }
    } catch (e) {
      setToast({
        message: lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
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
          isMaterial: false,
          categories: ITEM_GROUPS,
        }),
      });

      if (res.ok) {
        const parsedItems = await res.json();

        let newAddedItems: WarehouseItem[] = [];

        // Push all parsed objects to DB
        for (const pi of parsedItems) {
          const group = ITEM_GROUPS.find((g) => g.name === pi.category);
          const prefix = group ? group.code : "ITM";
          const newItem: Omit<WarehouseItem, "id"> = {
            itemCode:
              pi.itemCode ||
              `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
            itemNameAr: pi.itemName || "صنف غير معروف",
            itemNameEn: "",
            itemGroup: pi.category || "عام",
            defaultUnit: pi.unit || "Pc",
            isPurchaseItem: true,
            descriptionAr: pi.description || "",
            descriptionEn: "",
            warehouse: "مستودع الدمام الاساسي - المصنع الرئيسي",
            isDraft: false,
            dateCreated: new Date().toISOString(),
          };

          const createRes = await fetch("/api/warehouse_items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem),
          });

          if (createRes.ok) {
            const json = await createRes.json();
            newAddedItems.push(json.item);
          }
        }

        setItems((prev) => [...newAddedItems, ...prev]);
        setToast({
          message:
            lang === "ar"
              ? `تم استيراد وإضافة ${newAddedItems.length} صنف/أصناف بنجاح`
              : `Successfully imported ${newAddedItems.length} items`,
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
            ? "فشل استيراد الأصناف، تأكد من البيانات."
            : "Failed to import items",
        type: "error",
      });
    } finally {
      setIsParsing(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return alert("يرجى تحديد أصناف أولاً");
    const selected = items.filter((i) => selectedItems.includes(i.id));

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <title>تصدير الأصناف</title>
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
            .item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
            .details-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .details-table th { text-align: right; color: #475569; padding: 4px 0; width: 40%; font-weight: normal; }
            .details-table td { padding: 4px 0; font-weight: bold; color: #0f172a; }
            .desc-box { margin-top: 10px; font-size: 11px; color: #64748b; background: #f8fafc; padding: 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${sharedPrintHeader}
            <div class="content-wrapper">
              <div class="page-title">معلومات الأصناف المحددة</div>
              <table class="details-table" style="width: 100%; border: 1px solid #cbd5e1; text-align: right;">
                 <thead>
                   <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                     <th style="padding: 10px; border: 1px solid #cbd5e1; white-space: nowrap;">الصورة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">اسم الصنف</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الرمز</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">المجموعة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الوحدة</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">المستودع</th>
                     <th style="padding: 10px; border: 1px solid #cbd5e1;">الوصف</th>
                   </tr>
                 </thead>
                 <tbody>
                 ${selected.map((item) => `
                   <tr style="border-bottom: 1px solid #e2e8f0;">
                     <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 60px;">
                       ${item.imageUrl ? `<img src="${item.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />` : '---'}
                     </td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">
                       <span style="font-weight: bold; color: #1e293b;">${item.itemNameAr || '---'}</span>
                       ${item.itemNameEn ? `<br><span style="font-size: 10px; color: #64748b;">${item.itemNameEn}</span>` : ''}
                     </td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; color: #0072BC;">${item.itemCode || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.itemGroup || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.defaultUnit || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.warehouse || '---'}</td>
                     <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${item.descriptionAr || '---'}</td>
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
    let res = items;
    if (searchTerm) {
      res = res.filter(
        (i) =>
          i.itemNameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.itemNameEn?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (searchCode) {
      res = res.filter((i) =>
        i.itemCode?.toLowerCase().includes(searchCode.toLowerCase()),
      );
    }
    if (dateFilter !== "all") {
      const now = new Date();
      res = res.filter((i) => {
        const d = new Date(i.dateCreated);
        if (dateFilter === "week")
          return now.getTime() - d.getTime() <= 7 * 24 * 3600 * 1000;
        if (dateFilter === "month")
          return (
            now.getMonth() === d.getMonth() &&
            now.getFullYear() === d.getFullYear()
          );
        if (dateFilter === "year") return now.getFullYear() === d.getFullYear();
        if (dateFilter === "older") return now.getFullYear() > d.getFullYear();
        return true;
      });
    }
    if (sortOrder === "newest") {
      res = res.sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      );
    } else {
      res = res.sort(
        (a, b) =>
          new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime(),
      );
    }
    return res;
  }, [items, searchTerm, searchCode, dateFilter, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
            <Search className="w-7 h-7 text-indigo-500" />
            {lang === "ar" ? "مستودع الاصناف" : "Items Warehouse"}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsSmartImportOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 transition"
          >
            <Wand2 className="w-5 h-5" />
            {lang === "ar" ? "استيراد ذكي" : "Smart Import"}
          </button>
          <button
            onClick={() => {
              setEditingItem({});
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition"
          >
            <PlusCircle className="w-5 h-5" />
            {lang === "ar" ? "إضافة صنف جديد" : "Add New Item"}
          </button>
          {selectedItems.length > 0 && (
            <button
              onClick={() =>
                setDeleteConfirm({ isOpen: true, targetId: "BULK" })
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-sm font-bold transition"
            >
              <Trash2 className="w-5 h-5" />
              {lang === "ar" ? "حذف المحدد" : "Delete Selected"}
            </button>
          )}
          {selectedItems.length === 1 && (
            <button
              onClick={() => {
                const selectedItem = items.find(
                  (i) => i.id === selectedItems[0],
                );
                if (selectedItem) {
                  const { id, itemCode, dateCreated, ...rest } = selectedItem;
                  setEditingItem(rest as Partial<WarehouseItem>);
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition"
            >
              <PlusCircle className="w-5 h-5" />
              {lang === "ar" ? "تكرار الصنف المحدد" : "Duplicate Selected"}
            </button>
          )}
          <button
            onClick={handleExportSelected}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition"
          >
            <Download className="w-5 h-5" />
            {lang === "ar" ? "تصدير الأصناف المحددة" : "Export Selected"}
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              بحث باسم الصنف
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
              placeholder="اسم الصنف..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              بحث برقم الصنف
            </label>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
              placeholder="رمز الصنف..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              الفترة الزمنية
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
            >
              <option value="all">الكل</option>
              <option value="week">هذا الاسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذه السنة</option>
              <option value="older">قبل أكثر من سنة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              الترتيب
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
            >
              <option value="newest">من الأحدث للأقدم</option>
              <option value="oldest">من الأقدم للأحدث</option>
            </select>
          </div>
        </div>
      </div>

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
                        e.target.checked ? paginatedItems.map((i) => i.id) : [],
                      )
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4">الصورة</th>
                <th className="p-4">رقم و اسم الصنف</th>
                <th className="p-4">المجموعة</th>
                <th className="p-4">الوحدة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) =>
                        setSelectedItems(
                          e.target.checked
                            ? [...selectedItems, item.id]
                            : selectedItems.filter((id) => id !== item.id),
                        )
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemNameAr}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">
                      {item.itemNameAr}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      {item.itemCode}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{item.itemGroup}</td>
                  <td className="p-4 text-slate-600">{item.defaultUnit}</td>
                  <td className="p-4">
                    {item.isDraft ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> مسودة
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                        معتمد
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ isOpen: true, targetId: item.id })
                        }
                        className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد أصناف تطابق البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-100 bg-slate-50 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              {lang === "ar" ? "عرض" : "Show"}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1.5 border border-slate-300 rounded-lg font-bold text-sm bg-white outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-bold text-slate-500">
              {lang === "ar" ? "عنصر لكل صفحة" : "items per page"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {lang === "ar" ? "السابق" : "Previous"}
            </button>
            <div className="text-sm font-bold text-slate-600 px-2 flex items-center min-w-[100px] justify-center">
              {lang === "ar"
                ? `صفحة ${currentPage} من ${totalPages || 1}`
                : `Page ${currentPage} of ${totalPages || 1}`}
            </div>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
              }
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {lang === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            dir="rtl"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">
                {editingItem.id ? "تعديل صنف" : "إضافة صنف جديد"}
              </h3>
              <button
                onClick={handleCloseIcon}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Col */}
                <div className="space-y-5">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      مجموعة الصنف
                    </label>
                    <select
                      value={editingItem.itemGroup || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemGroup: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="">اختر المجموعة...</option>
                      {ITEM_GROUPS.map((g) => (
                        <option key={g.code} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-bold text-slate-700">
                        رمز الصنف
                      </label>
                      <button
                        onClick={generateItemCode}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded-lg"
                      >
                        توليد رمز صنف
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingItem.itemCode || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemCode: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-mono"
                      dir="ltr"
                      placeholder="مثال: 247-1234"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      اسم الصنف بالعربي
                    </label>
                    <input
                      type="text"
                      value={editingItem.itemNameAr || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemNameAr: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleTranslate(
                          e.target.value,
                          "Warehouse item name",
                          "itemNameEn",
                        )
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      اسم الصنف بالانجليزي
                    </label>
                    <input
                      type="text"
                      value={editingItem.itemNameEn || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          itemNameEn: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      المستودع
                    </label>
                    <select
                      value={editingItem.warehouse || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          warehouse: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="">اختر المستودع...</option>
                      {WAREHOUSES.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Col */}
                <div className="space-y-5">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      وحدة القياس الافتراضية
                    </label>
                    <select
                      value={editingItem.defaultUnit || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          defaultUnit: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="">اختر الوحدة...</option>
                      {UOM_LIST.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      صنف شراء؟
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={editingItem.isPurchaseItem === true}
                          onChange={() =>
                            setEditingItem({
                              ...editingItem,
                              isPurchaseItem: true,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span>نعم</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={editingItem.isPurchaseItem === false}
                          onChange={() =>
                            setEditingItem({
                              ...editingItem,
                              isPurchaseItem: false,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span>لا</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      وصف الصنف بالعربي
                    </label>
                    <textarea
                      value={editingItem.descriptionAr || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          descriptionAr: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleTranslate(
                          e.target.value,
                          "Warehouse item description",
                          "descriptionEn",
                        )
                      }
                      rows={2}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      وصف الصنف بالانجليزي
                    </label>
                    <textarea
                      value={editingItem.descriptionEn || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          descriptionEn: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 resize-none"
                      dir="ltr"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-slate-700">
                      صورة الصنف
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition min-h-[100px]"
                    >
                      {editingItem.imageUrl ? (
                        <img
                          src={editingItem.imageUrl}
                          className="h-20 object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon className="w-6 h-6 mb-2" />
                          <span className="text-xs">اضغط لرفع صورة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  if (editingItem.id) {
                    setDeleteConfirm({
                      isOpen: true,
                      targetId: editingItem.id,
                    });
                  }
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4" />
                حذف الصنف
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(true)}
                  className="px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold shadow-sm transition"
                >
                  حفظ كمسودة
                </button>
                <button
                  onClick={() => handleSave(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  حفظ الصنف
                </button>
              </div>
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
                    ? "هل أنت متأكد من حذف جميع الأصناف المحددة؟ لا يمكن التراجع عن هذا الإجراء."
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
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition shadow-md shadow-rose-200 disabled:opacity-75"
                >
                  {isDeleting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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

      {isSmartImportOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                {lang === "ar" ? "استيراد الأصناف الذكي" : "Smart Items Import"}
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
                    : "Paste text/tables or upload images/PDFs. AI will read it and add items automatically."}
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
                      ? "انسخ أي نص أو جدول يحتوي على الأصناف والصقه هنا..."
                      : "Paste any text or table containing item details..."
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
            <span className="text-xl">✓</span>
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
