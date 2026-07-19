import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Shield, Users, Briefcase, Settings, Package, Box, LayoutDashboard, Copy, 
  History, Save, X, Lock, Unlock, AlertTriangle, FileText, CheckCircle, DollarSign,
  Smartphone, RefreshCw
} from 'lucide-react';

// Define the exact sub-sections and their unique permissions mentioned by the user
const PERMISSIONS_SCHEMA = {
  dashboard: {
    ar: 'لوحة المؤشرات', en: 'لوحة المؤشرات',
    icon: <LayoutDashboard className="w-5 h-5"/>,
    sub: {
      metrics: {
        ar: 'مؤشرات النظام الرئيسية', en: 'مؤشرات النظام الرئيسية',
        perms: [
          { id: 'view_main', labelAr: 'عرض لوحة المؤشرات الرئيسية', labelEn: 'عرض لوحة المؤشرات الرئيسية', type: 'view' },
          { id: 'view_hr', labelAr: 'عرض مؤشرات الموارد البشرية', labelEn: 'عرض مؤشرات الموارد البشرية', type: 'view' },
          { id: 'view_sales', labelAr: 'عرض مؤشرات المبيعات والتحصيل', labelEn: 'عرض مؤشرات المبيعات والتحصيل', type: 'view' },
          { id: 'view_procurement', labelAr: 'عرض مؤشرات المشتريات والمستودع', labelEn: 'عرض مؤشرات المشتريات والمستودع', type: 'view' },
          { id: 'view_production', labelAr: 'عرض مؤشرات الإنتاج', labelEn: 'عرض مؤشرات الإنتاج', type: 'view' },
          { id: 'view_alerts', labelAr: 'عرض التنبيهات الحرجة', labelEn: 'عرض التنبيهات الحرجة', type: 'sensitive' },
          { id: 'view_logs', labelAr: 'عرض آخر العمليات', labelEn: 'عرض آخر العمليات', type: 'view' },
          { id: 'filter_date', labelAr: 'استخدام فلتر الشهر والسنة', labelEn: 'استخدام فلتر الشهر والسنة', type: 'edit' },
          { id: 'view_financial', labelAr: 'عرض الأرقام المالية', labelEn: 'عرض الأرقام المالية', type: 'financial' },
          { id: 'view_payroll', labelAr: 'عرض مؤشرات الرواتب', labelEn: 'عرض مؤشرات الرواتب', type: 'financial' },
          { id: 'view_inventory', labelAr: 'عرض مؤشرات المخزون', labelEn: 'عرض مؤشرات المخزون', type: 'view' },
          { id: 'export_metrics', labelAr: 'تصدير ملخص لوحة المؤشرات', labelEn: 'تصدير ملخص لوحة المؤشرات', type: 'export' }
        ]
      },
      quick_shortcuts: {
        ar: 'الاختصارات السريعة للعمليات', en: 'الاختصارات السريعة للعمليات',
        perms: [
          { id: 'view_main_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة المؤشرات الرئيسية', labelEn: 'عرض واستخدام الاختصارات السريعة في لوحة المؤشرات الرئيسية', type: 'view' },
          { id: 'view_procurement_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة المشتريات والمستودع', labelEn: 'عرض واستخدام الاختصارات السريعة في لوحة المشتريات والمستودع', type: 'view' },
          { id: 'view_production_shortcuts', labelAr: 'عرض واستخدام الاختصارات السريعة في لوحة التحكم بالإنتاج', labelEn: 'عرض واستخدام الاختصارات السريعة في لوحة التحكم بالإنتاج', type: 'view' }
        ]
      }
    }
  },
  hr: {
    ar: 'الموارد البشرية', en: 'Human Resources',
    icon: <Users className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات', en: 'لوحة القيادة والمؤشرات',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة الموارد البشرية', labelEn: 'عرض لوحة الموارد البشرية', type: 'view' },
          { id: 'view_total_emp', labelAr: 'عرض إجمالي الموظفين', labelEn: 'عرض إجمالي الموظفين', type: 'view' },
          { id: 'view_active_emp', labelAr: 'عرض الموظفين النشطين', labelEn: 'عرض الموظفين النشطين', type: 'view' },
          { id: 'view_leave_emp', labelAr: 'عرض الموظفين في إجازة', labelEn: 'عرض الموظفين في إجازة', type: 'view' },
          { id: 'view_attendance', labelAr: 'عرض الحضور والغياب', labelEn: 'عرض الحضور والغياب', type: 'view' },
          { id: 'view_total_salaries', labelAr: 'عرض إجمالي الرواتب الشهرية', labelEn: 'عرض إجمالي الرواتب الشهرية', type: 'financial' },
          { id: 'view_total_deductions', labelAr: 'عرض إجمالي الخصومات', labelEn: 'عرض إجمالي الخصومات', type: 'financial' },
          { id: 'view_total_loans', labelAr: 'عرض إجمالي السلف', labelEn: 'عرض إجمالي السلف', type: 'financial' },
          { id: 'view_expiries', labelAr: 'عرض العقود والإقامات القريبة من الانتهاء', labelEn: 'عرض العقود والإقامات القريبة من الانتهاء', type: 'view' }
        ]
      },
      self_service: {
        ar: 'الخدمة الذاتية والاستعلامات', en: 'الخدمة الذاتية والاستعلامات',
        perms: [
          { id: 'view_inquiries', labelAr: 'عرض استعلامات الموظفين', labelEn: 'عرض استعلامات الموظفين', type: 'view' },
          { id: 'reply_inquiry', labelAr: 'الرد على استعلام موظف', labelEn: 'الرد على استعلام موظف', type: 'edit' },
          { id: 'close_inquiry', labelAr: 'إغلاق استعلام', labelEn: 'إغلاق استعلام', type: 'edit' },
          { id: 'forward_inquiry', labelAr: 'تحويل استعلام', labelEn: 'تحويل استعلام', type: 'edit' },
          { id: 'delete_inquiry', labelAr: 'حذف استعلام', labelEn: 'حذف استعلام', type: 'delete' },
          { id: 'view_attachments', labelAr: 'عرض/تحميل مرفقات الاستعلام', labelEn: 'عرض/تحميل مرفقات الاستعلام', type: 'view' },
          { id: 'print_inquiry', labelAr: 'طباعة/تصدير الاستعلام', labelEn: 'طباعة/تصدير الاستعلام', type: 'export' }
        ]
      },
      employees: {
        ar: 'بيانات الموظفين', en: 'بيانات الموظفين',
        perms: [
          { id: 'view_emp', labelAr: 'عرض قائمة الموظفين', labelEn: 'عرض قائمة الموظفين', type: 'view' },
          { id: 'add_emp', labelAr: 'إضافة موظف جديد', labelEn: 'إضافة موظف جديد', type: 'add' },
          { id: 'edit_emp', labelAr: 'تعديل بيانات الموظف', labelEn: 'تعديل بيانات الموظف', type: 'edit' },
          { id: 'delete_emp', labelAr: 'حذف موظف', labelEn: 'حذف موظف', type: 'delete' },
          { id: 'disable_emp', labelAr: 'تعطيل / تفعيل موظف', labelEn: 'تعطيل / تفعيل موظف', type: 'sensitive' },
          { id: 'view_salary', labelAr: 'عرض بيانات الراتب', labelEn: 'عرض بيانات الراتب', type: 'financial' },
          { id: 'edit_salary', labelAr: 'تعديل بيانات الراتب', labelEn: 'تعديل بيانات الراتب', type: 'sensitive' },
          { id: 'manage_files', labelAr: 'إدارة ملفات الموظف', labelEn: 'إدارة ملفات الموظف', type: 'edit' },
          { id: 'qiwa_muqeem', labelAr: 'فتح بوابة قوى ومقيم', labelEn: 'فتح بوابة قوى ومقيم', type: 'exec' }
        ]
      },
      leaves: {
        ar: 'الإجازات والأرصدة', en: 'الإجازات والأرصدة',
        perms: [
          { id: 'view_balances', labelAr: 'عرض أرصدة الإجازات', labelEn: 'عرض أرصدة الإجازات', type: 'view' },
          { id: 'edit_balances', labelAr: 'تعديل الرصيد السنوي والمستخدم', labelEn: 'تعديل الرصيد السنوي والمستخدم', type: 'sensitive' },
          { id: 'add_leave', labelAr: 'إنشاء طلب إجازة', labelEn: 'إنشاء طلب إجازة', type: 'add' },
          { id: 'edit_leave', labelAr: 'تعديل طلب إجازة', labelEn: 'تعديل طلب إجازة', type: 'edit' },
          { id: 'delete_leave', labelAr: 'حذف طلب إجازة', labelEn: 'حذف طلب إجازة', type: 'delete' },
          { id: 'approve_leave', labelAr: 'اعتماد / رفض طلب إجازة', labelEn: 'اعتماد / رفض طلب إجازة', type: 'approve' }
        ]
      },
      payroll: {
        ar: 'مسير الرواتب', en: 'مسير الرواتب',
        perms: [
          { id: 'view_payroll', labelAr: 'عرض مسير الرواتب', labelEn: 'عرض مسير الرواتب', type: 'financial' },
          { id: 'edit_components', labelAr: 'تعديل الرواتب الأساسية والبدلات', labelEn: 'تعديل الرواتب الأساسية والبدلات', type: 'sensitive' },
          { id: 'create_payroll', labelAr: 'إنشاء مسير راتب شهري', labelEn: 'إنشاء مسير راتب شهري', type: 'add' },
          { id: 'approve_payroll', labelAr: 'اعتماد مسير راتب', labelEn: 'اعتماد مسير راتب', type: 'approve' },
          { id: 'revert_payroll_draft', labelAr: 'إرجاع مسير الرواتب كمسودة', labelEn: 'إرجاع مسير الرواتب كمسودة', type: 'sensitive' },
          { id: 'print_payroll', labelAr: 'طباعة/تصدير مسير الرواتب', labelEn: 'طباعة/تصدير مسير الرواتب', type: 'export' },
          { id: 'post_mudad', labelAr: 'تسجيل دفعة راتب لبوابة مدد', labelEn: 'تسجيل دفعة راتب لبوابة مدد', type: 'exec' }
        ]
      },
      deductions: {
        ar: 'الخصومات والجزاءات', en: 'الخصومات والجزاءات',
        perms: [
          { id: 'view_deductions', labelAr: 'عرض الخصومات والجزاءات', labelEn: 'عرض الخصومات والجزاءات', type: 'view' },
          { id: 'add_deduction', labelAr: 'إضافة خصم/جزاء', labelEn: 'إضافة خصم/جزاء', type: 'add' },
          { id: 'edit_deduction', labelAr: 'تعديل/إلغاء خصم', labelEn: 'تعديل/إلغاء خصم', type: 'edit' },
          { id: 'approve_deduction', labelAr: 'اعتماد خصم', labelEn: 'اعتماد خصم', type: 'approve' }
        ]
      },
      performance: {
        ar: 'الكفاءات والأداء', en: 'الكفاءات والأداء',
        perms: [
          { id: 'view_perf', labelAr: 'عرض تقييمات الأداء', labelEn: 'عرض تقييمات الأداء', type: 'view' },
          { id: 'add_perf', labelAr: 'إضافة تقييم أداء', labelEn: 'إضافة تقييم أداء', type: 'add' },
          { id: 'approve_perf', labelAr: 'اعتماد تقييم أداء', labelEn: 'اعتماد تقييم أداء', type: 'approve' }
        ]
      },
      letters: {
        ar: 'مستندات الخطابات الفورية', en: 'مستندات الخطابات الفورية',
        perms: [
          { id: 'view_letters', labelAr: 'عرض مستندات الخطابات', labelEn: 'عرض مستندات الخطابات', type: 'view' },
          { id: 'create_letter', labelAr: 'إنشاء خطاب موظف', labelEn: 'إنشاء خطاب موظف', type: 'add' },
          { id: 'edit_letter_template', labelAr: 'إدارة قوالب الخطابات', labelEn: 'إدارة قوالب الخطابات', type: 'sensitive' }
        ]
      }
    }
  },
  sales: {
    ar: 'المبيعات والتحصيل', en: 'المبيعات والتحصيل',
    icon: <Briefcase className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات', en: 'لوحة القيادة والمؤشرات',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة مؤشرات المبيعات', labelEn: 'عرض لوحة مؤشرات المبيعات', type: 'view' },
          { id: 'view_financial', labelAr: 'عرض إجمالي التحصيل والمتبقي والمتأخرات', labelEn: 'عرض إجمالي التحصيل والمتبقي والمتأخرات', type: 'financial' }
        ]
      },
      clients: {
        ar: 'العملاء', en: 'العملاء',
        perms: [
          { id: 'view_clients', labelAr: 'عرض قائمة العملاء', labelEn: 'عرض قائمة العملاء', type: 'view' },
          { id: 'add_client', labelAr: 'إضافة عميل جديد', labelEn: 'إضافة عميل جديد', type: 'add' },
          { id: 'edit_client', labelAr: 'تعديل بيانات العميل', labelEn: 'تعديل بيانات العميل', type: 'edit' },
          { id: 'delete_client', labelAr: 'حذف عميل', labelEn: 'حذف عميل', type: 'delete' },
          { id: 'import_clients', labelAr: 'استيراد عملاء', labelEn: 'استيراد عملاء', type: 'add' }
        ]
      },
      quotations: {
        ar: 'عروض الأسعار', en: 'عروض الأسعار',
        perms: [
          { id: 'view_quotes', labelAr: 'عرض قائمة عروض الأسعار', labelEn: 'عرض قائمة عروض الأسعار', type: 'view' },
          { id: 'add_quote', labelAr: 'إضافة عرض سعر', labelEn: 'إضافة عرض سعر', type: 'add' },
          { id: 'edit_quote', labelAr: 'تعديل عرض سعر', labelEn: 'تعديل عرض سعر', type: 'edit' },
          { id: 'delete_quote', labelAr: 'حذف عرض سعر مسودة', labelEn: 'حذف عرض سعر مسودة', type: 'delete' },
          { id: 'delete_approved_quote', labelAr: 'حذف عرض سعر معتمد*', labelEn: 'حذف عرض سعر معتمد*', type: 'sensitive' },
          { id: 'approve_quote', labelAr: 'اعتماد عرض سعر', labelEn: 'اعتماد عرض سعر', type: 'approve' },
          { id: 'unapprove_quote', labelAr: 'إلغاء اعتماد عرض سعر*', labelEn: 'إلغاء اعتماد عرض سعر*', type: 'sensitive' },
          { id: 'send_production', labelAr: 'إرسال العرض للإنتاج', labelEn: 'إرسال العرض للإنتاج', type: 'exec' }
        ]
      },
      collection: {
        ar: 'قسم التحصيل المالي', en: 'قسم التحصيل المالي',
        perms: [
          { id: 'view_collection', labelAr: 'عرض قسم التحصيل المالي', labelEn: 'عرض قسم التحصيل المالي', type: 'view' },
          { id: 'add_plan', labelAr: 'إضافة خطة تحصيل', labelEn: 'إضافة خطة تحصيل', type: 'add' },
          { id: 'edit_plan', labelAr: 'تعديل خطة تحصيل', labelEn: 'تعديل خطة تحصيل', type: 'edit' },
          { id: 'add_payment', labelAr: 'تسجيل دفعة', labelEn: 'تسجيل دفعة', type: 'add' },
          { id: 'approve_payment', labelAr: 'اعتماد دفعة مالية', labelEn: 'اعتماد دفعة مالية', type: 'approve' },
          { id: 'unapprove_payment', labelAr: 'إلغاء اعتماد دفعة مالية*', labelEn: 'إلغاء اعتماد دفعة مالية*', type: 'sensitive' },
          { id: 'delete_payment', labelAr: 'حذف دفعة*', labelEn: 'حذف دفعة*', type: 'sensitive' },
          { id: 'delete_confirmed_collection', labelAr: 'حذف تحصيل معتمد/مكتمل الدفعات*', labelEn: 'حذف تحصيل معتمد/مكتمل الدفعات*', type: 'sensitive' }
        ]
      },
      prod_orders: {
        ar: 'طلبات الإنتاج المرسلة', en: 'طلبات الإنتاج المرسلة',
        perms: [
          { id: 'view_prod_orders', labelAr: 'عرض طلبات الإنتاج المرسلة', labelEn: 'عرض طلبات الإنتاج المرسلة', type: 'view' },
          { id: 'resend_prod', labelAr: 'إعادة إرسال طلب للإنتاج', labelEn: 'إعادة إرسال طلب للإنتاج', type: 'exec' },
          { id: 'delete_prod_order', labelAr: 'حذف طلب إنتاج', labelEn: 'حذف طلب إنتاج', type: 'delete' }
        ]
      },
      letters: {
        ar: 'خطابات المبيعات', en: 'خطابات المبيعات',
        perms: [
          { id: 'view_letters', labelAr: 'عرض خطابات المبيعات', labelEn: 'عرض خطابات المبيعات', type: 'view' },
          { id: 'add_letter', labelAr: 'إنشاء/تعديل خطاب', labelEn: 'إنشاء/تعديل خطاب', type: 'add' },
          { id: 'send_letter', labelAr: 'إرسال خطاب عبر واتساب/إيميل', labelEn: 'إرسال خطاب عبر واتساب/إيميل', type: 'exec' },
          { id: 'edit_letter_template', labelAr: 'إدارة قوالب خطابات المبيعات', labelEn: 'إدارة قوالب خطابات المبيعات', type: 'sensitive' }
        ]
      },
      reports: {
        ar: 'التقارير', en: 'التقارير',
        perms: [
          { id: 'view_reports', labelAr: 'عرض مركز التقارير المبيعات', labelEn: 'عرض مركز التقارير المبيعات', type: 'view' },
          { id: 'export_reports', labelAr: 'تصدير التقارير', labelEn: 'تصدير التقارير', type: 'export' }
        ]
      },
      reps: {
        ar: 'المندوبين والأهداف', en: 'المندوبين والأهداف',
        perms: [
          { id: 'view_reps', labelAr: 'عرض المندوبين والأهداف', labelEn: 'عرض المندوبين والأهداف', type: 'view' },
          { id: 'manage_targets', labelAr: 'تعديل الأهداف والعمولات', labelEn: 'تعديل الأهداف والعمولات', type: 'edit' },
          { id: 'approve_comission', labelAr: 'اعتماد عمولة', labelEn: 'اعتماد عمولة', type: 'approve' }
        ]
      },
      pricing_study: {
        ar: 'دراسة تسعير المشاريع', en: 'دراسة تسعير المشاريع',
        perms: [
          { id: 'view_pricing_study', labelAr: 'عرض دراسة تسعير المشاريع وحساب تكاليفها', labelEn: 'عرض دراسة تسعير المشاريع وحساب تكاليفها', type: 'view' },
          { id: 'edit_pricing_study', labelAr: 'إنشاء وتعديل دراسة تسعير المشاريع والكميات والأسعار', labelEn: 'إنشاء وتعديل دراسة تسعير المشاريع والكميات والأسعار', type: 'edit' }
        ]
      }
    }
  },
  procurement: {
    ar: 'المشتريات والمستودع', en: 'المشتريات والمستودع',
    icon: <Package className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للمستودع', en: 'لوحة القيادة والمؤشرات للمستودع',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة المؤشرات للمشتريات والمستودع', labelEn: 'عرض لوحة المؤشرات للمشتريات والمستودع', type: 'view' }
        ]
      },
      items: {
        ar: 'مستودع الأصناف', en: 'مستودع الأصناف',
        perms: [
          { id: 'view_items', labelAr: 'عرض مستودع الأصناف', labelEn: 'عرض مستودع الأصناف', type: 'view' },
          { id: 'manage_items', labelAr: 'إضافة وتعديل وحذف صنف', labelEn: 'إضافة وتعديل وحذف صنف', type: 'edit' },
          { id: 'approve_item', labelAr: 'اعتماد صنف', labelEn: 'اعتماد صنف', type: 'approve' }
        ]
      },
      materials: {
        ar: 'مستودع المواد', en: 'مستودع المواد',
        perms: [
          { id: 'view_materials', labelAr: 'عرض مستودع المواد', labelEn: 'عرض مستودع المواد', type: 'view' },
          { id: 'manage_materials', labelAr: 'إضافة/تعديل مادة', labelEn: 'إضافة/تعديل مادة', type: 'edit' },
          { id: 'adjust_qty', labelAr: 'تعديل الرصيد يدويا/صرف مادة', labelEn: 'تعديل الرصيد يدويا/صرف مادة', type: 'sensitive' },
          { id: 'inventory_audit', labelAr: 'جرد المواد واعتماده', labelEn: 'جرد المواد واعتماده', type: 'approve' }
        ]
      },
      requests: {
        ar: 'طلبات شراء المواد', en: 'طلبات شراء المواد',
        perms: [
          { id: 'view_requests', labelAr: 'عرض طلبات شراء المواد', labelEn: 'عرض طلبات شراء المواد', type: 'view' },
          { id: 'add_request', labelAr: 'إنشاء/تعديل طلب شراء', labelEn: 'إنشاء/تعديل طلب شراء', type: 'add' },
          { id: 'approve_request', labelAr: 'اعتماد/رفض طلب شراء', labelEn: 'اعتماد/رفض طلب شراء', type: 'approve' },
          { id: 'send_pricing', labelAr: 'إرسال للموردين والتسعير', labelEn: 'إرسال للموردين والتسعير', type: 'exec' }
        ]
      },
      suppliers: {
        ar: 'الموردين والتسعير', en: 'الموردين والتسعير',
        perms: [
          { id: 'view_suppliers', labelAr: 'عرض الموردين', labelEn: 'عرض الموردين', type: 'view' },
          { id: 'manage_suppliers', labelAr: 'إضافة/تعديل مورد', labelEn: 'إضافة/تعديل مورد', type: 'edit' },
          { id: 'issue_rfq', labelAr: 'إصدار/تعديل عرض سعر شراء', labelEn: 'إصدار/تعديل عرض سعر شراء', type: 'add' }
        ]
      },
      finance_approval: {
        ar: 'بوابة تعميد المشتريات المالية', en: 'بوابة تعميد المشتريات المالية',
        perms: [
          { id: 'view_finance_po', labelAr: 'عرض بوابات التعميد المالي', labelEn: 'عرض بوابات التعميد المالي', type: 'view' },
          { id: 'approve_finance_po', labelAr: 'اعتماد مالياً و إنشاء أمر شراء', labelEn: 'اعتماد مالياً و إنشاء أمر شراء', type: 'financial' },
          { id: 'undo_po', labelAr: 'التراجع عن أمر شراء بعد إنشائه', labelEn: 'التراجع عن أمر شراء بعد إنشائه', type: 'sensitive' },
          { id: 'reject_finance_po', labelAr: 'إعادة الطلب/الرفض المالي', labelEn: 'إعادة الطلب/الرفض المالي', type: 'edit' },
          { id: 'delete_finance_po', labelAr: 'حذف طلب تعميد مشتريات (للإدارة)', labelEn: 'Delete Procurement Request (Admin)', type: 'delete' }
        ]
      },
      daily_purchases: {
        ar: 'طلبات الشراء اليومية', en: 'Daily Purchase Requests',
        perms: [
          { id: 'view_daily_purchases', labelAr: 'عرض طلبات الشراء اليومية', labelEn: 'View Daily Purchases', type: 'view' },
          { id: 'add_daily_purchase', labelAr: 'إضافة/تعديل طلب شراء يومي', labelEn: 'Add/Edit Daily Purchase', type: 'add' },
          { id: 'confirm_finance_daily', labelAr: 'تأكيد ودفع الطلبات من المالية', labelEn: 'Finance Confirm & Pay', type: 'approve' },
          { id: 'delete_daily_purchase', labelAr: 'حذف طلب شراء يومي (للإدارة)', labelEn: 'Delete Daily Purchase (Admin)', type: 'delete' }
        ]
      },
      approved_po: {
        ar: 'أوامر شراء المواد المعتمدة', en: 'أوامر شراء المواد المعتمدة',
        perms: [
          { id: 'view_pos', labelAr: 'عرض أوامر الشراء المعتمدة', labelEn: 'عرض أوامر الشراء المعتمدة', type: 'view' },
          { id: 'receive_items', labelAr: 'تسجيل استلام المواد', labelEn: 'تسجيل استلام المواد', type: 'add' },
          { id: 'cancel_po', labelAr: 'التراجع عن أمر الشراء', labelEn: 'التراجع عن أمر الشراء', type: 'sensitive' }
        ]
      }
    }
  },
  production: {
    ar: 'مركز التحكم بالإنتاج', en: 'مركز التحكم بالإنتاج',
    icon: <Box className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للإنتاج', en: 'لوحة القيادة والمؤشرات للإنتاج',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة المؤشرات في مركز التحكم بالإنتاج', labelEn: 'عرض لوحة المؤشرات في مركز التحكم بالإنتاج', type: 'view' }
        ]
      },
      daily_followup: {
        ar: 'متابعة الإنتاج اليومية', en: 'متابعة الإنتاج اليومية',
        perms: [
          { id: 'view_daily_followup', labelAr: 'عرض متابعة الإنتاج اليومية', labelEn: 'عرض متابعة الإنتاج اليومية', type: 'view' },
          { id: 'edit_daily_followup', labelAr: 'تعديل متابعة الإنتاج اليومية', labelEn: 'تعديل متابعة الإنتاج اليومية', type: 'edit' },
          { id: 'manage_daily_followup', labelAr: 'إدارة متابعة الإنتاج اليومية', labelEn: 'إدارة متابعة الإنتاج اليومية', type: 'approve' },
          { id: 'delete_daily_followup', labelAr: 'حذف مشروع من المتابعة', labelEn: 'حذف مشروع من المتابعة', type: 'delete' }
        ]
      },
      received: {
        ar: 'طلبات الإنتاج المستلمة', en: 'طلبات الإنتاج المستلمة',
        perms: [
          { id: 'view_received', labelAr: 'عرض طلبات الإنتاج المستلمة', labelEn: 'عرض طلبات الإنتاج المستلمة', type: 'view' },
          { id: 'accept_reject', labelAr: 'استلام أو رفض طلب الإنتاج', labelEn: 'استلام أو رفض طلب الإنتاج', type: 'approve' },
          { id: 'create_order', labelAr: 'إنشاء أمر إنتاج من الطلب', labelEn: 'إنشاء أمر إنتاج من الطلب', type: 'add' },
          { id: 'view_cost_pricing', labelAr: 'عرض تفاصيل الأسعار والأصناف بالفاتورة', labelEn: 'عرض تفاصيل الأسعار والأصناف بالفاتورة', type: 'financial' }
        ]
      },
      orders: {
        ar: 'أوامر الإنتاج', en: 'أوامر الإنتاج',
        perms: [
          { id: 'view_orders', labelAr: 'عرض أوامر الإنتاج', labelEn: 'عرض أوامر الإنتاج', type: 'view' },
          { id: 'manage_orders', labelAr: 'تعديل وحذف أمر إنتاج', labelEn: 'تعديل وحذف أمر إنتاج', type: 'edit' },
          { id: 'approve_orders', labelAr: 'اعتماد / إلغاء تعميد أمر إنتاج', labelEn: 'اعتماد / إلغاء تعميد أمر إنتاج', type: 'approve' }
        ]
      },
      projects: {
        ar: 'مشاريع الإنتاج القائمة', en: 'مشاريع الإنتاج القائمة',
        perms: [
          { id: 'view_projects', labelAr: 'عرض مشاريع الإنتاج', labelEn: 'عرض مشاريع الإنتاج', type: 'view' },
          { id: 'manage_stages', labelAr: 'إضافة/تعديل/بدء مراحل الإنتاج', labelEn: 'إضافة/تعديل/بدء مراحل الإنتاج', type: 'exec' },
          { id: 'mark_ready', labelAr: 'تحويل المشروع لجاهز للتركيب', labelEn: 'تحويل المشروع لجاهز للتركيب', type: 'approve' },
          { id: 'mark_complete_no_auth', labelAr: 'تحويل لمكتمل بدون اعتماد النهائي*', labelEn: 'تحويل لمكتمل بدون اعتماد النهائي*', type: 'sensitive' }
        ]
      },
      installation: {
        ar: 'قسم التركيب والتشغيل', en: 'قسم التركيب والتشغيل',
        perms: [
          { id: 'view_install', labelAr: 'عرض طلبات/أوامر التركيب', labelEn: 'عرض طلبات/أوامر التركيب', type: 'view' },
          { id: 'schedule_install', labelAr: 'جدولة و تعيين فريق تركيب', labelEn: 'جدولة و تعيين فريق تركيب', type: 'exec' },
          { id: 'complete_install', labelAr: 'إكمال وإغلاق ملف التركيب', labelEn: 'إكمال وإغلاق ملف التركيب', type: 'approve' }
        ]
      }
    }
  },
  finance: {
    ar: 'المحاسبة والمالية', en: 'Accounting & Finance',
    icon: <DollarSign className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات حقة المحاسبة', en: 'Accounting Dashboard',
        perms: [
          { id: 'view_dashboard', labelAr: 'عرض لوحة قيادة المؤشرات المالية', labelEn: 'View Accounting Dashboard', type: 'view' },
          { id: 'edit_dashboard', labelAr: 'تحديث بيانات المؤشرات والتحكم باللوحة', labelEn: 'تحديث بيانات المؤشرات والتحكم باللوحة', type: 'edit' }
        ]
      },
      journal: {
        ar: 'القيود اليومية العامة', en: 'General Journal',
        perms: [
          { id: 'view_entries', labelAr: 'عرض دفتر القيود اليومية', labelEn: 'View Journal Entries', type: 'view' },
          { id: 'add_entry', labelAr: 'إضافة قيد جديد', labelEn: 'Add New Entry', type: 'add' },
          { id: 'edit_entry', labelAr: 'تعديل قيد يومية', labelEn: 'Edit Journal Entry', type: 'edit' },
          { id: 'submit_approval', labelAr: 'إرسال القيد للاعتماد', labelEn: 'Submit Entry for Approval', type: 'exec' },
          { id: 'approve_entry', labelAr: 'اعتماد قيد اليومية', labelEn: 'Approve Journal Entry', type: 'approve' },
          { id: 'print_entry', labelAr: 'طباعة/تصدير القيد', labelEn: 'طباعة/تصدير القيد', type: 'export' },
          { id: 'view_projects', labelAr: 'عرض المشاريع بالقيود', labelEn: 'عرض المشاريع بالقيود', type: 'view' },
          { id: 'upload_attachment', labelAr: 'رفع مرفقات القيود', labelEn: 'رفع مرفقات القيود', type: 'add' }
        ]
      },
      customer_invoices: {
        ar: 'فواتير العملاء', en: 'Customer Invoices',
        perms: [
          { id: 'view_portal', labelAr: 'عرض بوابة فواتير العملاء', labelEn: 'View Customer Invoices', type: 'view' },
          { id: 'add_invoice', labelAr: 'إضافة فاتورة عميل جديدة', labelEn: 'Add New Customer Invoice', type: 'add' },
          { id: 'edit_invoice', labelAr: 'تعديل فاتورة عميل', labelEn: 'Edit Customer Invoice', type: 'edit' },
          { id: 'approve_invoice', labelAr: 'اعتماد فاتورة عميل', labelEn: 'Approve Customer Invoice', type: 'approve' },
          { id: 'export_all', labelAr: 'تصدير كامل فواتير العملاء', labelEn: 'تصدير كامل فواتير العملاء', type: 'export' },
          { id: 'preview_invoice', labelAr: 'معاينة وطباعة فاتورة عميل', labelEn: 'معاينة وطباعة فاتورة عميل', type: 'view' }
        ]
      },
      revenues: {
        ar: 'الإيرادات والمستحقات', en: 'Revenues',
        perms: [
          { id: 'view_revenues', labelAr: 'عرض الإيرادات المستحقة', labelEn: 'عرض الإيرادات المستحقة', type: 'view' },
          { id: 'edit_revenues', labelAr: 'تعديل الإيرادات والمستحقات المضافة', labelEn: 'تعديل الإيرادات والمستحقات المضافة', type: 'edit' }
        ]
      },
      supplier_invoices: {
        ar: 'فواتير الموردين', en: 'Supplier Invoices',
        perms: [
          { id: 'view_portal', labelAr: 'عرض بوابة فواتير الموردين', labelEn: 'View Supplier Invoices', type: 'view' },
          { id: 'add_invoice', labelAr: 'إضافة فاتورة مورد جديدة', labelEn: 'Add New Supplier Invoice', type: 'add' },
          { id: 'edit_invoice', labelAr: 'تعديل فاتورة مورد', labelEn: 'Edit Supplier Invoice', type: 'edit' },
          { id: 'approve_invoice', labelAr: 'اعتماد فاتورة مورد', labelEn: 'Approve Supplier Invoice', type: 'approve' }
        ]
      },
      expenses: {
        ar: 'المصروفات والمستحقات', en: 'Expenses',
        perms: [
          { id: 'view_expenses', labelAr: 'عرض المصروفات والمستحقات', labelEn: 'View Expenses', type: 'view' },
          { id: 'edit_expenses', labelAr: 'تعديل المصروفات المستحقة', labelEn: 'Edit Expenses', type: 'edit' }
        ]
      },
      payroll: {
        ar: 'الرواتب الشهرية للأقسام', en: 'Monthly Payroll',
        perms: [
          { id: 'view_payroll', labelAr: 'الاطلاع على الرواتب الشهرية فقط', labelEn: 'View Payroll Only', type: 'view' },
          { id: 'edit_payroll', labelAr: 'تعديل ومعالجة الرواتب الشهرية بالكامل', labelEn: 'Process & Edit Payroll', type: 'edit' },
          { id: 'revert_to_draft', labelAr: 'إرجاع مسير الرواتب إلى مسودة', labelEn: 'Revert Payroll to Draft', type: 'sensitive' },
          { id: 'audit_payroll_edit', labelAr: 'مراجعة وتدقيق - مع إمكانية التعديل', labelEn: 'Review & Audit - With Edit', type: 'edit' },
          { id: 'audit_payroll_view', labelAr: 'مراجعة وتدقيق - للاطلاع فقط دون تعديل', labelEn: 'Review & Audit - View Only', type: 'view' }
        ]
      },
      cash_bank: {
        ar: 'الصندوق والبنك', en: 'Banks & Cash',
        perms: [
          { id: 'view_portal', labelAr: 'الاطلاع على الصندوق والبنك', labelEn: 'الاطلاع على الصندوق والبنك', type: 'view' },
          { id: 'manage_cash_boxes', labelAr: 'إدارة الحسابات والحركات المالية بالكامل', labelEn: 'إدارة الحسابات والحركات المالية بالكامل', type: 'edit' }
        ]
      },
      zakat_tax: {
        ar: 'قسم الزكاة والضريبة', en: 'قسم الزكاة والضريبة',
        perms: [
          { id: 'view_zakat_tax', labelAr: 'عرض قسم الزكاة والضريبة', labelEn: 'عرض قسم الزكاة والضريبة', type: 'view' },
          { id: 'register_tax_payment', labelAr: 'تسجيل سداد الضريبة أو الزكاة', labelEn: 'تسجيل سداد الضريبة أو الزكاة', type: 'financial' },
          { id: 'export_zakat_tax', labelAr: 'تصدير كشف الزكاة والضريبة', labelEn: 'تصدير كشف الزكاة والضريبة', type: 'export' }
        ]
      },
      reports: {
        ar: 'التقارير الحسابية', en: 'التقارير الحسابية',
        perms: [
          { id: 'view_reports', labelAr: 'عرض صفحة التقارير الحسابية', labelEn: 'عرض صفحة التقارير الحسابية', type: 'view' },
          { id: 'export_reports', labelAr: 'تصدير التقارير الحسابية والأرباح والخسائر', labelEn: 'تصدير التقارير الحسابية والأرباح والخسائر', type: 'export' }
        ]
      },
      zatca: {
        ar: 'إعدادات الزكاة والضريبة ZATCA', en: 'إعدادات الزكاة والضريبة ZATCA',
        perms: [
          { id: 'view_zatca', labelAr: 'عرض إعدادات زاتكا وتكامل الفواتير', labelEn: 'عرض إعدادات زاتكا وتكامل الفواتير', type: 'view' },
          { id: 'edit_zatca', labelAr: 'تعديل إعدادات زاتكا والربط الضريبي', labelEn: 'تعديل إعدادات زاتكا والربط الضريبي', type: 'sensitive' }
        ]
      }
    }
  },
  settings: {
    ar: 'المستخدمين والإعدادات', en: 'المستخدمين والإعدادات',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      users: {
        ar: 'بوابة الصلاحيات والمستخدمين', en: 'بوابة الصلاحيات والمستخدمين',
        perms: [
          { id: 'view_users', labelAr: 'عرض بوابة المستخدمين', labelEn: 'عرض بوابة المستخدمين', type: 'view' },
          { id: 'add_user', labelAr: 'إضافة مستخدم جديد', labelEn: 'إضافة مستخدم جديد', type: 'add' },
          { id: 'edit_user', labelAr: 'تعديل/حذف مستخدم', labelEn: 'تعديل/حذف مستخدم', type: 'sensitive' },
          { id: 'manage_permissions', labelAr: 'تعديل الصلاحيات للمستخدمين', labelEn: 'تعديل الصلاحيات للمستخدمين', type: 'sensitive' }
        ]
      },
      general: {
        ar: 'الإعدادات العامة', en: 'الإعدادات العامة',
        perms: [
          { id: 'view_settings', labelAr: 'عرض الإعدادات العامة', labelEn: 'عرض الإعدادات العامة', type: 'view' },
          { id: 'edit_settings', labelAr: 'تعديل بيانات الشركة وإعدادات النظام', labelEn: 'تعديل بيانات الشركة وإعدادات النظام', type: 'edit' },
          { id: 'database_backup', labelAr: 'تصدير/استيراد نسخة احتياطية', labelEn: 'تصدير/استيراد نسخة احتياطية', type: 'sensitive' }
        ]
      },
      audit: {
        ar: 'سجل العمليات والتدقيق', en: 'سجل العمليات والتدقيق',
        perms: [
          { id: 'view_audit', labelAr: 'عرض سجل التدقيق بالكامل', labelEn: 'عرض سجل التدقيق بالكامل', type: 'view' },
          { id: 'delete_audit', labelAr: 'حذف أو تفريغ السجل', labelEn: 'حذف أو تفريغ السجل', type: 'sensitive' }
        ]
      }
    }
  },
  notifications: {
    ar: 'إشعارات النظام', en: 'إشعارات النظام',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      general: {
        ar: 'عرض الإشعارات', en: 'عرض الإشعارات',
        perms: [
          { id: 'view_all', labelAr: 'عرض جميع إشعارات النظام', labelEn: 'عرض جميع إشعارات النظام', type: 'view' },
          { id: 'view_hr', labelAr: 'عرض إشعارات الموارد البشرية', labelEn: 'عرض إشعارات الموارد البشرية', type: 'view' },
          { id: 'view_sales', labelAr: 'عرض إشعارات المبيعات', labelEn: 'عرض إشعارات المبيعات', type: 'view' },
          { id: 'view_purchasing', labelAr: 'عرض إشعارات المشتريات', labelEn: 'عرض إشعارات المشتريات', type: 'view' },
          { id: 'view_production', labelAr: 'عرض إشعارات الانتاج', labelEn: 'عرض إشعارات الانتاج', type: 'view' },
          { id: 'view_finance', labelAr: 'عرض إشعارات المحاسبة المالية', labelEn: 'عرض إشعارات المحاسبة المالية', type: 'view' },
          { id: 'view_public', labelAr: 'عرض الاشعارات العامة', labelEn: 'عرض الاشعارات العامة', type: 'view' },
          { id: 'view_private', labelAr: 'عرض الاشعارات الخاصة', labelEn: 'عرض الاشعارات الخاصة', type: 'view' }
        ]
      }
    }
  }
};

const COLOR_MAP: Record<string, string> = {
  view: 'text-blue-700 bg-blue-50 border-blue-200 accent-blue-600',
  add: 'text-emerald-700 bg-emerald-50 border-emerald-200 accent-emerald-600',
  edit: 'text-orange-700 bg-orange-50 border-orange-200 accent-orange-600',
  delete: 'text-red-700 bg-red-50 border-red-200 accent-red-600',
  approve: 'text-purple-700 bg-purple-50 border-purple-200 accent-purple-600',
  financial: 'text-emerald-800 bg-emerald-100 border-emerald-300 accent-emerald-700',
  sensitive: 'text-rose-800 bg-rose-100 border-rose-300 accent-rose-700',
  exec: 'text-indigo-800 bg-indigo-50 border-indigo-200 accent-indigo-600',
  export: 'text-slate-700 bg-slate-100 border-slate-300 accent-slate-600'
};

const BADGE_MAP: Record<string, { labelAr: string, labelEn: string, color: string }> = {
  sensitive: { labelAr: 'حساسة وخطرة ⚠️', labelEn: 'Sensitive ⚠️', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  financial: { labelAr: 'مالية 💵', labelEn: 'Financial 💵', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  approve: { labelAr: 'اعتماد ✍️', labelEn: 'Approval ✍️', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delete: { labelAr: 'حذف 🗑️', labelEn: 'Delete 🗑️', color: 'bg-red-100 text-red-800 border-red-300' }
};

export default function AdvancedPermissionsPortal({ 
  user,
  allUsers,
  lang,
  onClose,
  onSave
}: any) {
  // We store advanced permissions inside `user.permissions.advanced`
  // mapping structure: { [mainKey]: { [subKey]: { [permId]: boolean } } }
  const isTargetFeras = user.username?.toUpperCase() === 'FERAS';

  const getCompletePermissions = () => {
    const complete: any = {};
    Object.entries(PERMISSIONS_SCHEMA).forEach(([mainKey, mainVal]) => {
      complete[mainKey] = {};
      Object.entries(mainVal.sub).forEach(([subKey, subVal]) => {
        complete[mainKey][subKey] = {};
        subVal.perms.forEach((p: any) => {
          complete[mainKey][subKey][p.id] = 'all';
        });
      });
    });
    return complete;
  };

  const [advPerms, setAdvPerms] = useState<any>(() => {
    if (isTargetFeras) {
      return getCompletePermissions();
    }
    return user.permissions?.advanced || {};
  });
  
  const [scopes, setScopes] = useState<any>(user.permissions?.scopes || { global: 'all' });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [activeMain, setActiveMain] = useState(Object.keys(PERMISSIONS_SCHEMA)[0]);
  const [activeSub, setActiveSub] = useState(Object.keys(PERMISSIONS_SCHEMA[activeMain as keyof typeof PERMISSIONS_SCHEMA]?.sub || {})[0] || "");

  // Device security states
  const [deviceLockEnabled, setDeviceLockEnabled] = useState<boolean>(
    user.deviceLockEnabled !== false
  );
  const [allowDeviceMigration, setAllowDeviceMigration] = useState<boolean>(
     !!user.allowDeviceMigration
  );
  const [openLoginAnywhere, setOpenLoginAnywhere] = useState<boolean>(
     !!user.openLoginAnywhere
  );
  const [allowMultiBrowserOnSameDevice, setAllowMultiBrowserOnSameDevice] = useState<boolean>(
     !!user.allowMultiBrowserOnSameDevice
  );
  const [blockConcurrentLogins, setBlockConcurrentLogins] = useState<boolean>(
     !!user.blockConcurrentLogins
  );
  const [allowAutoMigration, setAllowAutoMigration] = useState<boolean>(
     !!user.allowAutoMigration
  );
  const [boundHardwareId, setBoundHardwareId] = useState<string>(
     user.boundHardwareId || ""
  );
  const [boundDeviceId, setBoundDeviceId] = useState<string>(
     user.boundDeviceId || ""
  );
  const [boundDeviceName, setBoundDeviceName] = useState<string>(
     user.boundDeviceName || ""
  );
  const [pendingDeviceApprovalId, setPendingDeviceApprovalId] = useState<string>(
     user.pendingDeviceApprovalId || ""
  );
  const [pendingDeviceApprovalName, setPendingDeviceApprovalName] = useState<string>(
     user.pendingDeviceApprovalName || ""
  );

  const [localUsers, setLocalUsers] = useState<any[]>(allUsers || []);

  const handleApproveDevice = async (targetUsername: string, targetDevId: string, targetDevName: string) => {
    try {
      const res = await fetch(`/api/users/${targetUsername}/approve-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devId: targetDevId, devName: targetDevName })
      });
      if (res.ok) {
         const data = await res.json();
         const updatedUser = data.user || {};
         if (targetUsername.toUpperCase() === user.username.toUpperCase()) {
            setBoundDeviceId(updatedUser.boundDeviceId || "");
            setBoundDeviceName(updatedUser.boundDeviceName || "");
            setPendingDeviceApprovalId(updatedUser.pendingDeviceApprovalId || "");
            setPendingDeviceApprovalName(updatedUser.pendingDeviceApprovalName || "");
         }
         // Update localUsers list
         setLocalUsers(prev => prev.map(u => {
            if (u.username.toUpperCase() === targetUsername.toUpperCase()) {
               return { 
                  ...u, 
                  boundDeviceId: updatedUser.boundDeviceId || "", 
                  boundDeviceName: updatedUser.boundDeviceName || "", 
                  boundDeviceOS: updatedUser.boundDeviceOS || "",
                  boundDeviceBrowser: updatedUser.boundDeviceBrowser || "",
                  boundDeviceType: updatedUser.boundDeviceType || "",
                  boundHardwareId: updatedUser.boundHardwareId || "",
                  pendingDeviceApprovalId: "", 
                  pendingDeviceApprovalName: "" 
               };
            }
            return u;
         }));
         alert("تم قبول طلب استبدال الجهاز للمستخدم " + targetUsername + " بنجاح! تم استبدال الجهاز بنجاح وتوثيق تفاصيل المتصفح والبيئة الجديدة.");
      } else {
         const errData = await res.json();
         alert("فشل قبول وتوثيق الجهاز: " + (errData.error || "خطأ غير معروف"));
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالخادم.");
    }
  };

  const handleRejectDevice = async (targetUsername: string) => {
    try {
      const res = await fetch(`/api/users/${targetUsername}/reject-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
         if (targetUsername.toUpperCase() === user.username.toUpperCase()) {
            setPendingDeviceApprovalId("");
            setPendingDeviceApprovalName("");
         }
         // Update localUsers list
         setLocalUsers(prev => prev.map(u => {
            if (u.username.toUpperCase() === targetUsername.toUpperCase()) {
               return { ...u, pendingDeviceApprovalId: "", pendingDeviceApprovalName: "" };
            }
            return u;
         }));
         alert("تم رفض طلب تفعيل الجهاز للمستخدم " + targetUsername + ".");
      } else {
         const errData = await res.json();
         alert("فشل معالجة رفض الطلب: " + (errData.error || "خطأ غير معروف"));
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالخادم.");
    }
  };
  
  const handleToggle = (main: string, sub: string, permId: string, val: boolean) => {
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: {
              ...(prev[main]?.[sub] || {}),
              [permId]: val ? 'all' : false
           }
        }
     }));
  };

  const handleScopeChange = (main: string, sub: string, permId: string, scopeVal: string) => {
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: {
              ...(prev[main]?.[sub] || {}),
              [permId]: scopeVal
           }
        }
     }));
  };

  const handleToggleSub = (main: string, sub: string, val: boolean) => {
     const subPerms = (PERMISSIONS_SCHEMA as any)[main]?.sub?.[sub]?.perms || [];
     const newSubState: any = {};
     subPerms.forEach((p: any) => newSubState[p.id] = val ? 'all' : false);
     setAdvPerms((prev: any) => ({
        ...prev,
        [main]: {
           ...(prev[main] || {}),
           [sub]: newSubState
        }
     }));
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    // Generate backwards compatible standard permissions from advanced perms to keep App functional immediately
    // If hr view is true, set viewAccess to 'all'
    const newModuleAccess: any = { ...user.permissions?.moduleAccess };
    Object.keys(PERMISSIONS_SCHEMA).forEach(main => {
       if (main !== 'dashboard' && main !== 'settings') {
          const mainPerms = advPerms[main] || {};
          const hasAnyView = Object.values(mainPerms).some((s: any) => Object.values(s).some(v => !!v));
          const hasAnyAll = Object.values(mainPerms).some((s: any) => Object.values(s).some(v => v === 'all' || v === true));
          
          if (!newModuleAccess[main]) newModuleAccess[main] = {};
          
          const calculatedScope = hasAnyAll ? 'all' : 'own';
          
          newModuleAccess[main].enabled = hasAnyView;
          newModuleAccess[main].viewAccess = hasAnyView ? calculatedScope : 'none';
          newModuleAccess[main].editAccess = hasAnyView ? calculatedScope : 'none'; 
          
          // Settings delete is for users, let's keep it simple
          if (advPerms.settings?.users?.edit_user) {
              newModuleAccess[main].deleteAccess = 'all';
          }
       }
    });

    // Handle procurement specifics carefully to not break the UI right away:
    if (advPerms.procurement?.finance_approval?.view_finance_po) {
        if (!newModuleAccess.procurement) newModuleAccess.procurement = {};
        newModuleAccess.procurement.deleteAccess = 'all'; // Reused standard permission mapped to Senior Management earlier
    }

    const payload = {
       allowMultiBrowserOnSameDevice,
       boundHardwareId,
       advanced: advPerms,
       scopes: scopes,
       moduleAccess: newModuleAccess,
       deviceLockEnabled,
       allowDeviceMigration,
       openLoginAnywhere,
       boundDeviceId,
       boundDeviceName,
       pendingDeviceApprovalId,
       pendingDeviceApprovalName,
       blockConcurrentLogins,
       allowAutoMigration
    };

    await onSave(user.username, payload);
    setSavedSuccess(true);
    setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(false);
        onClose();
    }, 800);
  };

  // Metrics calculation
  let activePermsCount = 0;
  let sensitiveCount = 0;
  let hasFinancial = false;

  Object.values(advPerms).forEach((main: any) => {
     Object.values(main).forEach((sub: any) => {
        Object.entries(sub).forEach(([pid, val]) => {
           if (val) {
              activePermsCount++;
              // Need to find type to count sensitive/fin
              Object.values(PERMISSIONS_SCHEMA).forEach(mst => {
                 Object.values((mst as any).sub).forEach((sst: any) => {
                    const p = sst.perms.find((x: any) => x.id === pid);
                    if (p && p.type === 'sensitive') sensitiveCount++;
                    if (p && p.type === 'financial') hasFinancial = true;
                 });
              });
           }
        })
     })
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm rtl" dir="rtl" style={{ direction: 'rtl' }}>
      <div className="bg-slate-50 w-full max-w-[95vw] lg:max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border-2 border-slate-700">
         
         <div className="p-4 sm:p-6 bg-slate-900 text-white shrink-0 flex flex-wrap gap-4 items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
               <Shield className="w-8 h-8 text-indigo-400" />
               <div>
                  <h2 className="text-xl font-black tracking-wide">بوابة الصلاحيات والتحكم بالوصول المتقدمة</h2>
                  <p className="text-xs text-slate-400 mt-1">تخصيص الهيكل الوظيفي ومستويات الوصول (RBAC)</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                   type="button"
                   onClick={() => {
                     setAdvPerms(getCompletePermissions());
                   }}
                   disabled={isSaving}
                   className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/30"
               >
                   <CheckCircle className="w-4 h-4" />
                   منح صلاحيات كاملة
               </button>
               <button 
                   onClick={handleSaveData} 
                   disabled={isSaving}
                   className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg overflow-hidden relative ${
                     savedSuccess ? 'bg-emerald-500 scale-105 shadow-emerald-500/50' :
                     isSaving ? 'bg-indigo-500 opacity-80 cursor-not-allowed scale-95' : 
                     'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/30'
                   }`}
               >
                   {savedSuccess ? (
                      <>
                         <CheckCircle className="w-4 h-4 animate-bounce"/>
                         تم الحفظ بنجاح
                      </>
                   ) : isSaving ? (
                      <>
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         جاري الحفظ...
                      </>
                   ) : (
                      <>
                         <Save className="w-4 h-4"/>
                         حفظ واعتماد الصلاحيات
                      </>
                   )}
               </button>
               <button onClick={onClose} disabled={isSaving} className="p-2.5 bg-slate-800 hover:bg-rose-600 rounded-xl transition text-white">
                   <X className="w-5 h-5" />
               </button>
            </div>
         </div>

         <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
             
             {/* 2. Main Sections Sidebar */}
             <div className="w-full md:w-64 bg-slate-800 border-l border-slate-700 shrink-0 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex">
                <div className="pb-4 mb-4 border-b border-slate-700">
                   <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-700/50">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner">
                         {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 truncate text-right">
                         <h3 className="text-sm font-black text-white truncate">{user.username}</h3>
                         <p className="text-[10px] text-indigo-300 font-bold truncate mt-0.5">{user.jobTitle || 'موظف'}</p>
                      </div>
                   </div>
                </div>

                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-wider text-right flex items-center justify-between">
                   <span>الأقسام الرئيسية</span>
                   <button 
                     type="button"
                     onClick={() => {
                        setActiveMain('device_security');
                        setActiveSub('');
                     }}
                     className={`flex items-center gap-1.5 px-2 py-1 text-[9px] font-black rounded-lg transition-all ${activeMain === 'device_security' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                   >
                     <Smartphone className="w-3 h-3" />
                     أمان الأجهزة
                   </button>
                </h4>
                {Object.entries(PERMISSIONS_SCHEMA).map(([mKey, mVal]) => (
                   <button 
                     key={mKey}
                     onClick={() => {
                        setActiveMain(mKey);
                        setActiveSub(Object.keys((mVal as any).sub)[0]);
                     }}
                     className={`flex items-center gap-3 w-full p-3 transition-all text-right rounded-xl text-sm font-bold ${activeMain === mKey ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                   >
                     {mVal.icon}
                     <span>{mVal.ar}</span>
                   </button>
                ))}
             </div>

             {/* Dynamic Sub-sections list (Middle column) */}
             {activeMain !== 'device_security' && (
             <div className="w-full md:w-64 bg-white border-l border-slate-200 shrink-0 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex">
                <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-wider flex items-center justify-between text-right">
                   الأقسام الفرعية
                   <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">{Object.keys((PERMISSIONS_SCHEMA as any)[activeMain]?.sub || {}).length}</span>
                </h4>
                {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain]?.sub || {}).map(([sKey, sVal]: [string, any]) => {
                   const hasAnyPerm = Object.values(advPerms[activeMain]?.[sKey] || {}).some(v => v);
                   return (
                     <button 
                       key={sKey}
                       onClick={() => setActiveSub(sKey)}
                       className={`flex items-center justify-between w-full p-3 transition-all rounded-xl text-xs font-bold text-right border ${activeSub === sKey ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'}`}
                     >
                       <span>{sVal.ar}</span>
                       {hasAnyPerm && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                     </button>
                   );
                })}
             </div>
             )}

             {/* Permissions area */}
             <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                   {activeMain === 'device_security' ? (
                      <div className="space-y-6 text-right" dir="rtl" style={{ direction: 'rtl' }}>
                         {/* Banner */}
                         <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-400">
                               <Shield className="w-8 h-8" />
                            </div>
                            <div>
                               <h3 className="text-lg font-black">إدارة أمان الأجهزة وتوثيق الدخول</h3>
                               <p className="text-xs text-slate-400 mt-1 font-semibold">
                                  قفل تشغيل حساب الموظف على جهاز واحد وحماية ترحيل الجلسات لمنع الاختراق.
                               </p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Column 1: Core Toggles */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                               <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-indigo-500" />
                                  تفضيلات الأمان وقفل الأجهزة
                                </h4>

                               <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-indigo-600 font-sans">السماح بالدخول من متصفحات متعددة على نفس الجهاز</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند التفعيل، سيقوم النظام بالتحقق فقط من معرّف الجهاز الفيزيائي للموظف (Hardware ID) ويسمح له باستخدام متصفحات متعددة (مثل Chrome و Safari) دون حظره.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setAllowMultiBrowserOnSameDevice(!allowMultiBrowserOnSameDevice)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowMultiBrowserOnSameDevice ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowMultiBrowserOnSameDevice ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-slate-800">تفعيل قفل الجهاز الموثق</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند تفعيل هذا الخيار، سيتم إلزام المستخدم بالدخول من جهاز واحد فقط موثق ومسجل لدى النظام.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setDeviceLockEnabled(!deviceLockEnabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${deviceLockEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${deviceLockEnabled ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-slate-800">تفعيل حظر الدخول المتعدد (منع الجلسات المتزامنة)</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند التفعيل، سيتم حظر تسجيل دخول الموظف إذا كان هناك جلسة نشطة مستخدمة بالفعل على جهاز/متصفح آخر في نفس الوقت لمنع مشاركة الحسابات.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setBlockConcurrentLogins(!blockConcurrentLogins)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${blockConcurrentLogins ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${blockConcurrentLogins ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-slate-800 font-sans">السماح بالنقل التلقائي الموثق (لمرة واحدة)</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند التفعيل، يستطيع المستخدم الانتقال لجهازه الجديد تلقائياً لمرة واحدة بمجرد تسجيل الدخول (Setup Mode) وسيتم قفله على الجهاز الجديد وإلغاء القديم فوراً.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setAllowDeviceMigration(!allowDeviceMigration)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowDeviceMigration ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowDeviceMigration ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-slate-800 font-sans">السماح بالنقل التلقائي الموثق للجهاز بشكل مستمر</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند التفعيل، سيتم نقل ترخيص حساب المستخدم وتحديث جهازه الموثق تلقائياً عند الدخول من أي جهاز جديد مع توثيق وتسجيل النقل بالكامل في سجلات التدقيق الأمني.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setAllowAutoMigration(!allowAutoMigration)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowAutoMigration ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowAutoMigration ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>

                                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                     <div className="flex-1">
                                        <span className="block text-sm font-black text-[#0072BC]">تعطيل القفل مؤقتاً لهذا المستخدم (دخول مفتوح)</span>
                                        <span className="block text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                                           عند التفعيل، يمكن لهذا المستخدم الدخول من أي متصفح أو جهاز مختلف بشكل مفتوح دون تفعيل حظر الأجهزة وتجاوز قيود القفل.
                                        </span>
                                     </div>
                                     <button
                                        type="button"
                                        onClick={() => setOpenLoginAnywhere(!openLoginAnywhere)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${openLoginAnywhere ? 'bg-emerald-600' : 'bg-slate-300'}`}
                                     >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${openLoginAnywhere ? '-translate-x-5' : 'translate-x-0'}`} />
                                     </button>
                                  </div>
                               </div>
                            </div>

                            {/* Column 2: Bound Device Status & Approvals */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                               <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-indigo-500" />
                                  حالة الجهاز المقترن بالعمل
                               </h4>

                               <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between gap-4">
                                  {boundDeviceId ? (
                                     <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                           جهاز موثق ومقترن بنجاح
                                        </div>
                                        <div className="p-3 bg-slate-100 rounded-lg text-slate-700 font-mono text-xs select-all text-center break-all border border-slate-200">
                                           {boundDeviceId}
                                        </div>
                                        {boundDeviceName && (
                                           <div className="text-[11px] text-[#0072BC] font-black text-center bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-100">
                                              اسم الجهاز: {boundDeviceName}
                                           </div>
                                        )}
                                        {user.boundDeviceOS && (
                                           <div className="text-[11px] text-slate-600 font-bold text-right bg-slate-100/50 py-1 px-2.5 rounded border border-slate-200">
                                              💻 نظام التشغيل: <span className="font-semibold text-slate-800">{user.boundDeviceOS}</span>
                                           </div>
                                        )}
                                        {user.boundDeviceBrowser && (
                                           <div className="text-[11px] text-slate-600 font-bold text-right bg-slate-100/50 py-1 px-2.5 rounded border border-slate-200">
                                              🌐 المتصفح: <span className="font-semibold text-slate-800">{user.boundDeviceBrowser}</span>
                                           </div>
                                        )}
                                        {user.boundDeviceType && (
                                           <div className="text-[11px] text-slate-600 font-bold text-right bg-slate-100/50 py-1 px-2.5 rounded border border-slate-200">
                                              📱 نوع الجهاز: <span className="font-semibold text-slate-800">{user.boundDeviceType}</span>
                                           </div>
                                        )}
                                        {user.boundDeviceAt && (
                                           <div className="text-[10px] text-slate-500 font-bold text-right py-0.5 px-1">
                                              🕒 تم الاقتران في: {new Date(user.boundDeviceAt).toLocaleString("ar-EG")}
                                           </div>
                                        )}
                                        <button
                                           type="button"
                                           onClick={() => {
                                              setBoundDeviceId("");
                                              setBoundDeviceName("");
                                              setBoundHardwareId("");
                                           }}
                                           className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg transition"
                                        >
                                           إلغاء ربط ومسح هذا الجهاز فوراً
                                        </button>

                                        {/* Context-aware pending request for the selected user */}
                                        {pendingDeviceApprovalId && (
                                           <div className="mt-4 p-4 rounded-xl border-2 border-amber-400 bg-amber-50/70 space-y-3 text-right">
                                              <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                                                 <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">طلب استبدال جهاز معلق لهذا الموظف</span>
                                                 <span className="text-xs font-black text-slate-800">{user.username}</span>
                                              </div>
                                              <div className="space-y-1.5 text-xs text-slate-700">
                                                 <div className="font-mono text-[10px] bg-white p-2 rounded border border-amber-200 break-all select-all">
                                                    معرف الجهاز الجديد: <span className="font-black text-slate-900">{pendingDeviceApprovalId}</span>
                                                 </div>
                                                 {pendingDeviceApprovalName && (
                                                    <div className="font-black text-[#0072BC] mt-1">📱 اسم الجهاز الجديد: {pendingDeviceApprovalName}</div>
                                                 )}
                                                 {(() => {
                                                    const matchUser = localUsers.find(u => u.username.toUpperCase() === user.username.toUpperCase());
                                                    if (matchUser) {
                                                       return (
                                                          <>
                                                             {matchUser.pendingDeviceApprovalOS && (
                                                                <div className="text-slate-600 font-bold">💻 نظام التشغيل: {matchUser.pendingDeviceApprovalOS}</div>
                                                             )}
                                                             {matchUser.pendingDeviceApprovalBrowser && (
                                                                <div className="text-slate-600 font-bold">🌐 المتصفح: {matchUser.pendingDeviceApprovalBrowser}</div>
                                                             )}
                                                             {matchUser.pendingDeviceApprovalType && (
                                                                <div className="text-slate-600 font-bold">📱 نوع الجهاز: {matchUser.pendingDeviceApprovalType}</div>
                                                             )}
                                                             {matchUser.pendingDeviceApprovalAt && (
                                                                <div className="text-[10px] text-slate-400 mt-1 font-semibold">🕒 طلب في: {new Date(matchUser.pendingDeviceApprovalAt).toLocaleString("ar-EG")}</div>
                                                             )}
                                                          </>
                                                       );
                                                    }
                                                    return null;
                                                 })()}
                                              </div>
                                              <div className="flex gap-2 pt-1">
                                                 <button
                                                    type="button"
                                                    onClick={() => handleApproveDevice(user.username, pendingDeviceApprovalId, pendingDeviceApprovalName || "جهاز غير معروف")}
                                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black transition text-center"
                                                 >
                                                    قبول وتغيير الجهاز
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => handleRejectDevice(user.username)}
                                                    className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition text-center"
                                                 >
                                                    رفض الطلب
                                                 </button>
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  ) : (
                                     <div className="py-4 text-center space-y-2">
                                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                                        <p className="text-xs font-black text-slate-700">لا يوجد جهاز مرتبط حالياً</p>
                                        <p className="text-[11px] text-slate-400 font-semibold">
                                           سيقوم النظام تلقائياً بربط أول جهاز يقوم بالولوج للحساب كجهاز موثق تلقائياً.
                                        </p>
                                     </div>
                                  )}
                               </div>

                               {/* Pending Approvals */}
                               <div className="pt-4 border-t border-slate-100">
                                  <h5 className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
                                     <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                     <span>طلبات ترخيص الأجهزة المعلقة (لكل موظفي الشركة)</span>
                                  </h5>
                                  {localUsers.filter(u => u.pendingDeviceApprovalId).length > 0 ? (
                                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {localUsers.filter(u => u.pendingDeviceApprovalId).map(u => (
                                           <div key={u.username} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 text-right">
                                              <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
                                                 <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">طلب معلق</span>
                                                 <span className="text-xs font-black text-slate-800">{u.username}</span>
                                              </div>
                                              <div>
                                                 <span className="block text-[10px] text-slate-500 mt-1 font-mono break-all">{u.pendingDeviceApprovalId}</span>
                                                 {u.pendingDeviceApprovalName && (
                                                    <span className="block text-[10px] text-[#0072BC] mt-1 font-black">اسم الجهاز: {u.pendingDeviceApprovalName}</span>
                                                 )}
                                                 {u.pendingDeviceApprovalOS && (
                                                    <span className="block text-[10px] text-slate-600 mt-1 font-bold">💻 نظام التشغيل: {u.pendingDeviceApprovalOS}</span>
                                                 )}
                                                 {u.pendingDeviceApprovalBrowser && (
                                                    <span className="block text-[10px] text-slate-600 mt-1 font-bold">🌐 المتصفح: {u.pendingDeviceApprovalBrowser}</span>
                                                 )}
                                                 {u.pendingDeviceApprovalType && (
                                                    <span className="block text-[10px] text-slate-600 mt-1 font-bold">📱 نوع الجهاز: {u.pendingDeviceApprovalType}</span>
                                                 )}
                                                 {u.pendingDeviceApprovalAt && (
                                                    <span className="block text-[9px] text-slate-400 mt-1 font-semibold">🕒 طلب في: {new Date(u.pendingDeviceApprovalAt).toLocaleString("ar-EG")}</span>
                                                 )}
                                              </div>
                                              <div className="flex gap-2">
                                                 <button
                                                    type="button"
                                                    onClick={() => handleApproveDevice(u.username, u.pendingDeviceApprovalId, u.pendingDeviceApprovalName || "جهاز غير معروف")}
                                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black transition text-center"
                                                 >
                                                    قبول وتوثيق
                                                 </button>
                                                 <button
                                                    type="button"
                                                    onClick={() => handleRejectDevice(u.username)}
                                                    className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition text-center"
                                                 >
                                                    رفض الطلب
                                                 </button>
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  ) : (
                                     <p className="text-[11px] text-slate-400 italic text-center py-2 font-semibold">لا توجد طلبات ترخيص أجهزة معلقة حالياً.</p>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <>
                    
                    {/* Selectors for mobile only */}
                    <div className="flex md:hidden flex-col gap-2 mb-4 pb-4 border-b border-slate-200">
                        <select 
                           className="p-2 rounded border border-slate-300 text-sm font-bold bg-white"
                           value={activeMain}
                           onChange={(e) => {
                              setActiveMain(e.target.value);
                              setActiveSub(Object.keys((PERMISSIONS_SCHEMA as any)[e.target.value]?.sub || {})[0] || "");
                           }}
                        >
                            {Object.entries(PERMISSIONS_SCHEMA).map(([mKey, mVal]) => (
                               <option key={mKey} value={mKey}>{mVal.ar}</option>
                            ))}
                        </select>
                        <select 
                           className="p-2 rounded border border-slate-300 text-sm font-bold bg-white"
                           value={activeSub}
                           onChange={(e) => setActiveSub(e.target.value)}
                        >
                            {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain]?.sub || {}).map(([sKey, sVal]: [string, any]) => (
                               <option key={sKey} value={sKey}>{sVal.ar}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 text-right">
                          <div>
                             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-400" />
                                صلاحيات: {((PERMISSIONS_SCHEMA as any)[activeMain]?.sub?.[activeSub] || {}).ar || ""}
                             </h3>
                             <p className="text-xs text-slate-500 mt-1 font-semibold">تخصيص دقيق لصلاحيات المستخدم داخل هذا القسم الفرعي.</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-4">

                             <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
                                <button 
                                   onClick={() => handleToggleSub(activeMain, activeSub, false)}
                                className="px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg text-[11px] font-bold transition"
                             >
                               تعطيل الكل
                             </button>
                             <button 
                                onClick={() => handleToggleSub(activeMain, activeSub, true)}
                                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-bold transition shadow-md"
                             >
                               منح الكل
                             </button>
                          </div>
                       </div>
                    </div>
                       
                       <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {(((PERMISSIONS_SCHEMA as any)[activeMain]?.sub?.[activeSub] || {}).perms || []).map((perm: any) => {
                             const permVal = advPerms[activeMain]?.[activeSub]?.[perm.id];
                             const isChecked = !!permVal;
                             const currentScope = permVal === 'own' ? 'own' : 'all';
                             const colorClasses = COLOR_MAP[perm.type] || COLOR_MAP.view;
                             const badge = BADGE_MAP[perm.type];
                             
                             return (
                               <div key={perm.id} className={`flex flex-col p-4 rounded-xl border transition-all hover:shadow-sm ${isChecked ? colorClasses.replace('text-', 'border-').split(' ')[2] : 'bg-white border-slate-200'} ${isChecked ? colorClasses.split(' ')[1] : ''}`}>
                                  <label className="flex flex-row-reverse items-center justify-between cursor-pointer w-full">
                                     <div className="flex items-center gap-3 flex-row-reverse">
                                        <div className={`w-10 h-6 bg-slate-200 rounded-full relative transition-colors ${isChecked ? colorClasses.split(' ')[3].replace('accent-', 'bg-') : ''}`}>
                                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isChecked ? 'left-1' : 'left-5'}`}></div>
                                        </div>
                                        <div className="text-right flex items-center justify-end gap-2 flex-wrap">
                                           <span className={`text-sm font-bold ${isChecked ? colorClasses.split(' ')[0] : 'text-slate-700'}`}>{lang === "ar" ? perm.labelAr : (perm.labelEn || perm.labelAr)}</span>
                                           {badge && <span className={`mr-2 px-1.5 py-0.5 rounded text-[9px] font-black ${badge.color}`}>{lang === "ar" ? badge.labelAr : badge.labelEn}</span>}
                                        </div>
                                     </div>
                                     
                                     {/* hidden checkbox */}
                                     <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={isChecked}
                                        onChange={(e) => handleToggle(activeMain, activeSub, perm.id, e.target.checked)} 
                                      />
                                  </label>

                                  {isChecked && (
                                     <div className="mt-4 pt-3 border-t border-slate-200 flex flex-row-reverse items-center justify-between">
                                        <span className={`text-[10px] font-bold ${colorClasses.split(' ')[0]} opacity-80`}>نطاق البيانات والمعالجة:</span>
                                        <select 
                                           value={currentScope}
                                           onChange={(e) => handleScopeChange(activeMain, activeSub, perm.id, e.target.value)}
                                           className={`bg-white border border-slate-200 text-xs font-bold p-1 rounded-md outline-none cursor-pointer ${colorClasses.split(' ')[0]}`}
                                        >
                                           <option value="all">جميع البيانات (وصول كامل)</option>
                                           <option value="own">البيانات الخاصة به فقط</option>
                                        </select>
                                     </div>
                                  )}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                    </>
                    )}
                </div>

                {/* Footer summary bar */}
                <div className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between text-right">
                   <div className="flex items-center gap-6">
                      <div className="text-center">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">مجموع الصلاحيات المفعلة</span>
                         <span className="block text-xl font-black text-indigo-400">{activePermsCount}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-800"></div>
                      <div className="text-center">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">صلاحيات حساسة وخطرة</span>
                         <span className="block text-xl font-black text-rose-500">{sensitiveCount}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
                      <div className="text-center hidden sm:block">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">الوصول المالي الشامل</span>
                         <span className={`block text-sm font-black mt-1 ${hasFinancial ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {hasFinancial ? 'نشط' : 'محجوب'}
                         </span>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 text-xs font-bold font-mono text-slate-500">
                      SYS_SEC_V2
                   </div>
                </div>

             </div>
         </div>
      </div>
    </div>
  );
}
