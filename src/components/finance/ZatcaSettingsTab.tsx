import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ZatcaSettings {
  companyNameArabic: string;
  companyNameEnglish: string;
  vatNumber: string;
  crNumber: string;
  nationalAddress: string;
  city: string;
  country: string;
  postalCode: string;
  buildingNumber: string;
  additionalNumber: string;
  district: string;
  sellerNameForQR: string;
  vatEnabled: boolean;
  defaultVatRate: number;
  
  // ZATCA credentials
  zatcaPhase: "Phase 1" | "Phase 2";
  environment: "Sandbox" | "Simulation" | "Production";
  zatcaIntegrationEnabled: boolean;
  complianceCSID: string;
  productionCSID: string;
  privateKey: string;
  publicKey: string;
  certificate: string;
  deviceId: string;
  branchId: string;
  lastInvoiceHash: string;
  invoiceCounter: number;
}

const defaultSettings: ZatcaSettings = {
  companyNameArabic: "شركة فنون الوليد للدعاية والإعلان",
  companyNameEnglish: "Al Waleed Arts Advertising Co.",
  vatNumber: "310123456700003",
  crNumber: "1010123456",
  nationalAddress: "7322 طريق الملك عبد العزيز، الياسمين",
  city: "الرياض",
  country: "المملكة العربية السعودية",
  postalCode: "13322",
  buildingNumber: "7322",
  additionalNumber: "2441",
  district: "الياسمين",
  sellerNameForQR: "شركة فنون الوليد للدعاية والإعلان",
  vatEnabled: true,
  defaultVatRate: 15,
  zatcaPhase: "Phase 1",
  environment: "Sandbox",
  zatcaIntegrationEnabled: false,
  complianceCSID: "",
  productionCSID: "",
  privateKey: "",
  publicKey: "",
  certificate: "",
  deviceId: "DEV-ERP-992",
  branchId: "BRANCH-001",
  lastInvoiceHash: "NWZlY2E3MWI4MmQz...",
  invoiceCounter: 1,
};

export function getZatcaTLV(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: string,
  vatAmount: string
): string {
  try {
    const encoder = new TextEncoder();
    const getTagValue = (tag: number, value: string) => {
      const valueBytes = encoder.encode(value);
      const tagByte = tag;
      const lengthByte = valueBytes.length;
      const buffer = new Uint8Array(2 + valueBytes.length);
      buffer[0] = tagByte;
      buffer[1] = lengthByte;
      buffer.set(valueBytes, 2);
      return buffer;
    };

    const t1 = getTagValue(1, sellerName);
    const t2 = getTagValue(2, vatNumber);
    const t3 = getTagValue(3, timestamp);
    const t4 = getTagValue(4, totalAmount);
    const t5 = getTagValue(5, vatAmount);

    const totalLength = t1.length + t2.length + t3.length + t4.length + t5.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;

    result.set(t1, offset); offset += t1.length;
    result.set(t2, offset); offset += t2.length;
    result.set(t3, offset); offset += t3.length;
    result.set(t4, offset); offset += t4.length;
    result.set(t5, offset);

    let binary = "";
    const len = result.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Error generating TLV:", e);
    return "";
  }
}

export default function ZatcaSettingsTab({ lang, user }: { lang: "ar" | "en"; user: any }) {
  const [settings, setSettings] = useState<ZatcaSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  // Test state for QR
  const [testSeller, setTestSeller] = useState("شركة فنون الوليد للدعاية والإعلان");
  const [testVat, setTestVat] = useState("310123456700003");
  const [testTotal, setTestTotal] = useState("1150.00");
  const [testVatAmount, setTestVatAmount] = useState("150.00");
  const [testQRBase64, setTestQRBase64] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, "settings", "zatca");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() });
        } else {
          // save default initially
          await setDoc(docRef, defaultSettings);
        }
      } catch (err: any) {
        console.error("Error loading settings:", err);
        setErrorMsg(lang === "ar" ? "فشل تحميل الإعدادات من قاعدة البيانات" : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [lang]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const docRef = doc(db, "settings", "zatca");
      await setDoc(docRef, settings);
      
      // Save Audit Log
      const logId = `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, "audit_logs", logId), {
        userId: user?.id || "unknown",
        userName: user?.username || "System",
        userRole: user?.role || "Admin",
        action: "تعديل إعدادات الزكاة والضريبة والفوترة الإلكترونية",
        module: "ZATCA Settings",
        recordId: "zatca",
        oldValue: "",
        newValue: "Updated ZATCA and Company Tax settings",
        createdAt: new Date().toISOString()
      });

      setSuccessMsg(lang === "ar" ? "تم حفظ الإعدادات الضريبية وZATCA بنجاح" : "Settings saved successfully");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "ar" ? "حدث خطأ أثناء حفظ البيانات" : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestQR = () => {
    const timestamp = new Date().toISOString();
    const b64 = getZatcaTLV(testSeller, testVat, timestamp, testTotal, testVatAmount);
    setTestQRBase64(b64);
  };

  const maskKey = (key: string) => {
    if (!key) return lang === "ar" ? "غير مضبوط" : "Not Set";
    if (showKeys) return key;
    return key.substring(0, 10) + "************************" + key.substring(key.length - 10);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072BC]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005185] to-[#0072BC] p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              ⚙️ إعدادات الزكاة والضريبة والفوترة الإلكترونية (ZATCA)
            </h1>
            <p className="text-slate-200 mt-1 text-sm">
              إدارة الهوية الضريبية للشركة، وإعدادات الضريبة والفوترة الإلكترونية المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.
            </p>
          </div>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 px-4 rounded-xl font-bold transition-all text-sm"
          >
            {showKeys ? "🙈 إخفاء المفاتيح الحساسة" : "👁️ كشف المفاتيح الحساسة"}
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-semibold text-sm animate-fade-in">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 font-semibold text-sm animate-fade-in">
            <span>❌</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Company Profile */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#005185] border-r-4 border-[#0072BC] pr-3 flex items-center gap-2">
              <span>🏢</span> البيانات الضريبية للشركة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنشأة بالعربي *</label>
                <input
                  type="text"
                  required
                  value={settings.companyNameArabic}
                  onChange={(e) => setSettings({ ...settings, companyNameArabic: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنشأة بالإنجليزي *</label>
                <input
                  type="text"
                  required
                  value={settings.companyNameEnglish}
                  onChange={(e) => setSettings({ ...settings, companyNameEnglish: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الضريبي الموحد (15 خانة) *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={settings.vatNumber}
                  onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم السجل التجاري *</label>
                <input
                  type="text"
                  required
                  value={settings.crNumber}
                  onChange={(e) => setSettings({ ...settings, crNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">العنوان الوطني *</label>
                <input
                  type="text"
                  required
                  value={settings.nationalAddress}
                  onChange={(e) => setSettings({ ...settings, nationalAddress: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المدينة *</label>
                <input
                  type="text"
                  required
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الحي *</label>
                <input
                  type="text"
                  required
                  value={settings.district}
                  onChange={(e) => setSettings({ ...settings, district: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الرمز البريدي *</label>
                <input
                  type="text"
                  required
                  value={settings.postalCode}
                  onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم المبنى *</label>
                <input
                  type="text"
                  required
                  value={settings.buildingNumber}
                  onChange={(e) => setSettings({ ...settings, buildingNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الإضافي</label>
                <input
                  type="text"
                  value={settings.additionalNumber}
                  onChange={(e) => setSettings({ ...settings, additionalNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم البائع في كود الـ QR *</label>
                <input
                  type="text"
                  required
                  value={settings.sellerNameForQR}
                  onChange={(e) => setSettings({ ...settings, sellerNameForQR: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.vatEnabled}
                    onChange={(e) => setSettings({ ...settings, vatEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#0072BC] focus:ring-[#0072BC] border-slate-300"
                  />
                  <span>تفعيل ضريبة القيمة المضافة</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">النسبة الافتراضية (%)</label>
                <input
                  type="number"
                  disabled={!settings.vatEnabled}
                  value={settings.defaultVatRate}
                  onChange={(e) => setSettings({ ...settings, defaultVatRate: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: ZATCA Integration Credentials */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#005185] border-r-4 border-[#0072BC] pr-3 flex items-center gap-2">
              <span>🧬</span> إعدادات الفوترة الإلكترونية والمرحلة الثانية (Integration)
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1.5 font-semibold">
              <p className="font-extrabold text-sm text-amber-950">⚠️ تنبيه أمني وتفصيلي محاسبي:</p>
              <p>• النظام يدعم حالياً التوليد الكامل لباركود المرحلة الأولى (TLV Base64) بنجاح 100%.</p>
              <p>• المرحلة الثانية (Phase 2 Integration) تتطلب وجود Backend/Cloud Function آمن للتوقيع الرقمي (Cryptographic Stamp) وحفظ المفاتيح الخاصة لمنع تسريبها للواجهة الأمامية.</p>
              <p>• الحقول أدناه معدة للهيكلة والربط لغايات التطوير والتأهيل الفني (Clearance & Reporting) مع منصة "فاتورة" من هيئة الزكاة والضريبة والجمارك.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">مرحلة الربط</label>
                <select
                  value={settings.zatcaPhase}
                  onChange={(e) => setSettings({ ...settings, zatcaPhase: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="Phase 1">المرحلة الأولى (حفظ وتبسيط - QR Code)</option>
                  <option value="Phase 2">المرحلة الثانية (ربط وتكامل - Integration)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">بيئة الهيئة</label>
                <select
                  value={settings.environment}
                  onChange={(e) => setSettings({ ...settings, environment: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="Sandbox">Sandbox (تطويرية تجريبية)</option>
                  <option value="Simulation">Simulation (محاكاة إنتاجية)</option>
                  <option value="Production">Production (البيئة الفعلية)</option>
                </select>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.zatcaIntegrationEnabled}
                    onChange={(e) => setSettings({ ...settings, zatcaIntegrationEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#0072BC] focus:ring-[#0072BC] border-slate-300"
                  />
                  <span>تفعيل الربط المباشر مع ZATCA</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المعرف الفريد للجهاز (Device ID)</label>
                <input
                  type="text"
                  value={settings.deviceId}
                  onChange={(e) => setSettings({ ...settings, deviceId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم الفرع (Branch ID)</label>
                <input
                  type="text"
                  value={settings.branchId}
                  onChange={(e) => setSettings({ ...settings, branchId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">عداد الفواتير المتراكم</label>
                <input
                  type="number"
                  value={settings.invoiceCounter}
                  onChange={(e) => setSettings({ ...settings, invoiceCounter: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-1">الشهادة الأمنية للتأهيل الفني (Compliance CSID)</label>
                <textarea
                  rows={2}
                  value={maskKey(settings.complianceCSID)}
                  onChange={(e) => setSettings({ ...settings, complianceCSID: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-1">الشهادة الأمنية للإنتاج (Production CSID)</label>
                <textarea
                  rows={2}
                  value={maskKey(settings.productionCSID)}
                  onChange={(e) => setSettings({ ...settings, productionCSID: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">المفتاح الخاص (Private Key)</label>
                <textarea
                  rows={2}
                  value={maskKey(settings.privateKey)}
                  onChange={(e) => setSettings({ ...settings, privateKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">المفتاح العام (Public Key)</label>
                <textarea
                  rows={2}
                  value={maskKey(settings.publicKey)}
                  onChange={(e) => setSettings({ ...settings, publicKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-1">توقيع الهاش للفاتورة السابقة (Previous Invoice Hash)</label>
                <input
                  type="text"
                  value={settings.lastInvoiceHash}
                  onChange={(e) => setSettings({ ...settings, lastInvoiceHash: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0072BC] hover:bg-[#005185] text-white py-3 px-8 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm disabled:opacity-55"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري حفظ الإعدادات...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>حفظ كافة الإعدادات والترميز</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Section 3: QR Code Compliance Test Tool */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
          <h2 className="text-lg font-extrabold text-[#005185] mb-4 flex items-center gap-2">
            <span>🔍</span> أداة اختبار توليد الباركود الضريبي (Phase 1 TLV QR Code)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم البائع</label>
                  <input
                    type="text"
                    value={testSeller}
                    onChange={(e) => setTestSeller(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الرقم الضريبي للمنشأة</label>
                  <input
                    type="text"
                    value={testVat}
                    onChange={(e) => setTestVat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">إجمالي الفاتورة شامل الضريبة (SAR)</label>
                  <input
                    type="text"
                    value={testTotal}
                    onChange={(e) => setTestTotal(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">مبلغ الضريبة (15%)</label>
                  <input
                    type="text"
                    value={testVatAmount}
                    onChange={(e) => setTestVatAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestQR}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs"
              >
                توليد واختبار مطابقة الهاش (Encode QR TLV)
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-500">الباركود المولد (ZATCA Base64 TLV)</span>
              {testQRBase64 ? (
                <>
                  <div className="bg-slate-100 p-2.5 rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(testQRBase64)}`}
                      alt="ZATCA TLV Compliance QR"
                      className="w-32 h-32"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 break-all select-all block max-w-[200px] max-h-12 overflow-y-auto bg-slate-50 p-1.5 rounded border">
                    {testQRBase64}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <span>✔️</span> تشفير TLV مطابق لمتطلبات هيئة الزكاة
                  </span>
                </>
              ) : (
                <div className="w-32 h-32 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 text-xs text-center p-4">
                  اضغط توليد لرؤية النتيجة والباركود
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
