import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Shield, Users, Briefcase, Settings, Package, Box, LayoutDashboard, Copy, 
  History, Save, X, Lock, Unlock, AlertTriangle, FileText, CheckCircle, DollarSign
} from 'lucide-react';

// Define the exact sub-sections and their unique permissions mentioned by the user
const PERMISSIONS_SCHEMA = {
  dashboard: {
    ar: 'لوحة المؤشرات',
    icon: <LayoutDashboard className="w-5 h-5"/>,
    sub: {
      metrics: {
        ar: 'مؤشرات النظام الرئيسية',
        perms: [
          { id: 'view_main', label: 'عرض لوحة المؤشرات الرئيسية', type: 'view' },
          { id: 'view_hr', label: 'عرض مؤشرات الموارد البشرية', type: 'view' },
          { id: 'view_sales', label: 'عرض مؤشرات المبيعات والتحصيل', type: 'view' },
          { id: 'view_procurement', label: 'عرض مؤشرات المشتريات والمستودع', type: 'view' },
          { id: 'view_production', label: 'عرض مؤشرات الإنتاج', type: 'view' },
          { id: 'view_alerts', label: 'عرض التنبيهات الحرجة', type: 'sensitive' },
          { id: 'view_logs', label: 'عرض آخر العمليات', type: 'view' },
          { id: 'filter_date', label: 'استخدام فلتر الشهر والسنة', type: 'edit' },
          { id: 'view_financial', label: 'عرض الأرقام المالية', type: 'financial' },
          { id: 'view_payroll', label: 'عرض مؤشرات الرواتب', type: 'financial' },
          { id: 'view_inventory', label: 'عرض مؤشرات المخزون', type: 'view' },
          { id: 'export_metrics', label: 'تصدير ملخص لوحة المؤشرات', type: 'export' }
        ]
      },
      quick_shortcuts: {
        ar: 'الاختصارات السريعة للعمليات',
        perms: [
          { id: 'view_main_shortcuts', label: 'عرض واستخدام الاختصارات السريعة في لوحة المؤشرات الرئيسية', type: 'view' },
          { id: 'view_procurement_shortcuts', label: 'عرض واستخدام الاختصارات السريعة في لوحة المشتريات والمستودع', type: 'view' },
          { id: 'view_production_shortcuts', label: 'عرض واستخدام الاختصارات السريعة في لوحة التحكم بالإنتاج', type: 'view' }
        ]
      }
    }
  },
  hr: {
    ar: 'الموارد البشرية',
    icon: <Users className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات',
        perms: [
          { id: 'view_dashboard', label: 'عرض لوحة الموارد البشرية', type: 'view' },
          { id: 'view_total_emp', label: 'عرض إجمالي الموظفين', type: 'view' },
          { id: 'view_active_emp', label: 'عرض الموظفين النشطين', type: 'view' },
          { id: 'view_leave_emp', label: 'عرض الموظفين في إجازة', type: 'view' },
          { id: 'view_attendance', label: 'عرض الحضور والغياب', type: 'view' },
          { id: 'view_total_salaries', label: 'عرض إجمالي الرواتب الشهرية', type: 'financial' },
          { id: 'view_total_deductions', label: 'عرض إجمالي الخصومات', type: 'financial' },
          { id: 'view_total_loans', label: 'عرض إجمالي السلف', type: 'financial' },
          { id: 'view_expiries', label: 'عرض العقود والإقامات القريبة من الانتهاء', type: 'view' }
        ]
      },
      self_service: {
        ar: 'الخدمة الذاتية والاستعلامات',
        perms: [
          { id: 'view_inquiries', label: 'عرض استعلامات الموظفين', type: 'view' },
          { id: 'reply_inquiry', label: 'الرد على استعلام موظف', type: 'edit' },
          { id: 'close_inquiry', label: 'إغلاق استعلام', type: 'edit' },
          { id: 'forward_inquiry', label: 'تحويل استعلام', type: 'edit' },
          { id: 'delete_inquiry', label: 'حذف استعلام', type: 'delete' },
          { id: 'view_attachments', label: 'عرض/تحميل مرفقات الاستعلام', type: 'view' },
          { id: 'print_inquiry', label: 'طباعة/تصدير الاستعلام', type: 'export' }
        ]
      },
      employees: {
        ar: 'بيانات الموظفين',
        perms: [
          { id: 'view_emp', label: 'عرض قائمة الموظفين', type: 'view' },
          { id: 'add_emp', label: 'إضافة موظف جديد', type: 'add' },
          { id: 'edit_emp', label: 'تعديل بيانات الموظف', type: 'edit' },
          { id: 'delete_emp', label: 'حذف موظف', type: 'delete' },
          { id: 'disable_emp', label: 'تعطيل / تفعيل موظف', type: 'sensitive' },
          { id: 'view_salary', label: 'عرض بيانات الراتب', type: 'financial' },
          { id: 'edit_salary', label: 'تعديل بيانات الراتب', type: 'sensitive' },
          { id: 'manage_files', label: 'إدارة ملفات الموظف', type: 'edit' },
          { id: 'qiwa_muqeem', label: 'فتح بوابة قوى ومقيم', type: 'exec' }
        ]
      },
      leaves: {
        ar: 'الإجازات والأرصدة',
        perms: [
          { id: 'view_balances', label: 'عرض أرصدة الإجازات', type: 'view' },
          { id: 'edit_balances', label: 'تعديل الرصيد السنوي والمستخدم', type: 'sensitive' },
          { id: 'add_leave', label: 'إنشاء طلب إجازة', type: 'add' },
          { id: 'edit_leave', label: 'تعديل طلب إجازة', type: 'edit' },
          { id: 'delete_leave', label: 'حذف طلب إجازة', type: 'delete' },
          { id: 'approve_leave', label: 'اعتماد / رفض طلب إجازة', type: 'approve' }
        ]
      },
      payroll: {
        ar: 'مسير الرواتب',
        perms: [
          { id: 'view_payroll', label: 'عرض مسير الرواتب', type: 'financial' },
          { id: 'edit_components', label: 'تعديل الرواتب الأساسية والبدلات', type: 'sensitive' },
          { id: 'create_payroll', label: 'إنشاء مسير راتب شهري', type: 'add' },
          { id: 'approve_payroll', label: 'اعتماد مسير راتب', type: 'approve' },
          { id: 'print_payroll', label: 'طباعة/تصدير مسير الرواتب', type: 'export' },
          { id: 'post_mudad', label: 'تسجيل دفعة راتب لبوابة مدد', type: 'exec' }
        ]
      },
      deductions: {
        ar: 'الخصومات والجزاءات',
        perms: [
          { id: 'view_deductions', label: 'عرض الخصومات والجزاءات', type: 'view' },
          { id: 'add_deduction', label: 'إضافة خصم/جزاء', type: 'add' },
          { id: 'edit_deduction', label: 'تعديل/إلغاء خصم', type: 'edit' },
          { id: 'approve_deduction', label: 'اعتماد خصم', type: 'approve' }
        ]
      },
      performance: {
        ar: 'الكفاءات والأداء',
        perms: [
          { id: 'view_perf', label: 'عرض تقييمات الأداء', type: 'view' },
          { id: 'add_perf', label: 'إضافة تقييم أداء', type: 'add' },
          { id: 'approve_perf', label: 'اعتماد تقييم أداء', type: 'approve' }
        ]
      },
      letters: {
        ar: 'مستندات الخطابات الفورية',
        perms: [
          { id: 'view_letters', label: 'عرض مستندات الخطابات', type: 'view' },
          { id: 'create_letter', label: 'إنشاء خطاب موظف', type: 'add' },
          { id: 'edit_letter_template', label: 'إدارة قوالب الخطابات', type: 'sensitive' }
        ]
      }
    }
  },
  sales: {
    ar: 'المبيعات والتحصيل',
    icon: <Briefcase className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات',
        perms: [
          { id: 'view_dashboard', label: 'عرض لوحة مؤشرات المبيعات', type: 'view' },
          { id: 'view_financial', label: 'عرض إجمالي التحصيل والمتبقي والمتأخرات', type: 'financial' }
        ]
      },
      clients: {
        ar: 'العملاء',
        perms: [
          { id: 'view_clients', label: 'عرض قائمة العملاء', type: 'view' },
          { id: 'add_client', label: 'إضافة عميل جديد', type: 'add' },
          { id: 'edit_client', label: 'تعديل بيانات العميل', type: 'edit' },
          { id: 'delete_client', label: 'حذف عميل', type: 'delete' },
          { id: 'import_clients', label: 'استيراد عملاء', type: 'add' }
        ]
      },
      quotations: {
        ar: 'عروض الأسعار',
        perms: [
          { id: 'view_quotes', label: 'عرض قائمة عروض الأسعار', type: 'view' },
          { id: 'add_quote', label: 'إضافة عرض سعر', type: 'add' },
          { id: 'edit_quote', label: 'تعديل عرض سعر', type: 'edit' },
          { id: 'delete_quote', label: 'حذف عرض سعر مسودة', type: 'delete' },
          { id: 'delete_approved_quote', label: 'حذف عرض سعر معتمد*', type: 'sensitive' },
          { id: 'approve_quote', label: 'اعتماد عرض سعر', type: 'approve' },
          { id: 'unapprove_quote', label: 'إلغاء اعتماد عرض سعر*', type: 'sensitive' },
          { id: 'send_production', label: 'إرسال العرض للإنتاج', type: 'exec' }
        ]
      },
      collection: {
        ar: 'قسم التحصيل المالي',
        perms: [
          { id: 'view_collection', label: 'عرض قسم التحصيل المالي', type: 'view' },
          { id: 'add_plan', label: 'إضافة خطة تحصيل', type: 'add' },
          { id: 'edit_plan', label: 'تعديل خطة تحصيل', type: 'edit' },
          { id: 'add_payment', label: 'تسجيل دفعة', type: 'add' },
          { id: 'approve_payment', label: 'اعتماد دفعة مالية', type: 'approve' },
          { id: 'unapprove_payment', label: 'إلغاء اعتماد دفعة مالية*', type: 'sensitive' },
          { id: 'delete_payment', label: 'حذف دفعة*', type: 'sensitive' }
        ]
      },
      prod_orders: {
        ar: 'طلبات الإنتاج المرسلة',
        perms: [
          { id: 'view_prod_orders', label: 'عرض طلبات الإنتاج المرسلة', type: 'view' },
          { id: 'resend_prod', label: 'إعادة إرسال طلب للإنتاج', type: 'exec' },
          { id: 'delete_prod_order', label: 'حذف طلب إنتاج', type: 'delete' }
        ]
      },
      letters: {
        ar: 'خطابات المبيعات',
        perms: [
          { id: 'view_letters', label: 'عرض خطابات المبيعات', type: 'view' },
          { id: 'add_letter', label: 'إنشاء/تعديل خطاب', type: 'add' },
          { id: 'send_letter', label: 'إرسال خطاب عبر واتساب/إيميل', type: 'exec' }
        ]
      },
      reports: {
        ar: 'التقارير',
        perms: [
          { id: 'view_reports', label: 'عرض مركز التقارير المبيعات', type: 'view' },
          { id: 'export_reports', label: 'تصدير التقارير', type: 'export' }
        ]
      },
      reps: {
        ar: 'المندوبين والأهداف',
        perms: [
          { id: 'view_reps', label: 'عرض المندوبين والأهداف', type: 'view' },
          { id: 'manage_targets', label: 'تعديل الأهداف والعمولات', type: 'edit' },
          { id: 'approve_comission', label: 'اعتماد عمولة', type: 'approve' }
        ]
      },
      pricing_study: {
        ar: 'دراسة تسعير المشاريع',
        perms: [
          { id: 'view_pricing_study', label: 'عرض دراسة تسعير المشاريع وحساب تكاليفها', type: 'view' },
          { id: 'edit_pricing_study', label: 'إنشاء وتعديل دراسة تسعير المشاريع والكميات والأسعار', type: 'edit' }
        ]
      }
    }
  },
  procurement: {
    ar: 'المشتريات والمستودع',
    icon: <Package className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للمستودع',
        perms: [
          { id: 'view_dashboard', label: 'عرض لوحة المؤشرات للمشتريات والمستودع', type: 'view' }
        ]
      },
      items: {
        ar: 'مستودع الأصناف',
        perms: [
          { id: 'view_items', label: 'عرض مستودع الأصناف', type: 'view' },
          { id: 'manage_items', label: 'إضافة وتعديل وحذف صنف', type: 'edit' },
          { id: 'approve_item', label: 'اعتماد صنف', type: 'approve' }
        ]
      },
      materials: {
        ar: 'مستودع المواد',
        perms: [
          { id: 'view_materials', label: 'عرض مستودع المواد', type: 'view' },
          { id: 'manage_materials', label: 'إضافة/تعديل مادة', type: 'edit' },
          { id: 'adjust_qty', label: 'تعديل الرصيد يدويا/صرف مادة', type: 'sensitive' },
          { id: 'inventory_audit', label: 'جرد المواد واعتماده', type: 'approve' }
        ]
      },
      requests: {
        ar: 'طلبات شراء المواد',
        perms: [
          { id: 'view_requests', label: 'عرض طلبات شراء المواد', type: 'view' },
          { id: 'add_request', label: 'إنشاء/تعديل طلب شراء', type: 'add' },
          { id: 'approve_request', label: 'اعتماد/رفض طلب شراء', type: 'approve' },
          { id: 'send_pricing', label: 'إرسال للموردين والتسعير', type: 'exec' }
        ]
      },
      suppliers: {
        ar: 'الموردين والتسعير',
        perms: [
          { id: 'view_suppliers', label: 'عرض الموردين', type: 'view' },
          { id: 'manage_suppliers', label: 'إضافة/تعديل مورد', type: 'edit' },
          { id: 'issue_rfq', label: 'إصدار/تعديل عرض سعر شراء', type: 'add' }
        ]
      },
      finance_approval: {
        ar: 'بوابة تعميد المشتريات المالية',
        perms: [
          { id: 'view_finance_po', label: 'عرض بوابات التعميد المالي', type: 'view' },
          { id: 'approve_finance_po', label: 'اعتماد مالياً و إنشاء أمر شراء', type: 'financial' },
          { id: 'undo_po', label: 'التراجع عن أمر شراء بعد إنشائه', type: 'sensitive' },
          { id: 'reject_finance_po', label: 'إعادة الطلب/الرفض المالي', type: 'edit' }
        ]
      },
      approved_po: {
        ar: 'أوامر شراء المواد المعتمدة',
        perms: [
          { id: 'view_pos', label: 'عرض أوامر الشراء المعتمدة', type: 'view' },
          { id: 'receive_items', label: 'تسجيل استلام المواد', type: 'add' },
          { id: 'cancel_po', label: 'التراجع عن أمر الشراء', type: 'sensitive' }
        ]
      }
    }
  },
  production: {
    ar: 'مركز التحكم بالإنتاج',
    icon: <Box className="w-5 h-5"/>,
    sub: {
      dashboard: {
        ar: 'لوحة القيادة والمؤشرات للإنتاج',
        perms: [
          { id: 'view_dashboard', label: 'عرض لوحة المؤشرات في مركز التحكم بالإنتاج', type: 'view' }
        ]
      },
      daily_followup: {
        ar: 'متابعة الإنتاج اليومية',
        perms: [
          { id: 'view_daily_followup', label: 'عرض متابعة الإنتاج اليومية', type: 'view' },
          { id: 'edit_daily_followup', label: 'تعديل متابعة الإنتاج اليومية', type: 'edit' },
          { id: 'manage_daily_followup', label: 'إدارة متابعة الإنتاج اليومية', type: 'approve' },
          { id: 'delete_daily_followup', label: 'حذف مشروع من المتابعة', type: 'delete' }
        ]
      },
      received: {
        ar: 'طلبات الإنتاج المستلمة',
        perms: [
          { id: 'view_received', label: 'عرض طلبات الإنتاج المستلمة', type: 'view' },
          { id: 'accept_reject', label: 'استلام أو رفض طلب الإنتاج', type: 'approve' },
          { id: 'create_order', label: 'إنشاء أمر إنتاج من الطلب', type: 'add' },
          { id: 'view_cost_pricing', label: 'عرض تفاصيل الأسعار والأصناف بالفاتورة', type: 'financial' }
        ]
      },
      orders: {
        ar: 'أوامر الإنتاج',
        perms: [
          { id: 'view_orders', label: 'عرض أوامر الإنتاج', type: 'view' },
          { id: 'manage_orders', label: 'تعديل وحذف أمر إنتاج', type: 'edit' },
          { id: 'approve_orders', label: 'اعتماد / إلغاء تعميد أمر إنتاج', type: 'approve' }
        ]
      },
      projects: {
        ar: 'مشاريع الإنتاج القائمة',
        perms: [
          { id: 'view_projects', label: 'عرض مشاريع الإنتاج', type: 'view' },
          { id: 'manage_stages', label: 'إضافة/تعديل/بدء مراحل الإنتاج', type: 'exec' },
          { id: 'mark_ready', label: 'تحويل المشروع لجاهز للتركيب', type: 'approve' },
          { id: 'mark_complete_no_auth', label: 'تحويل لمكتمل بدون اعتماد النهائي*', type: 'sensitive' }
        ]
      },
      installation: {
        ar: 'قسم التركيب والتشغيل',
        perms: [
          { id: 'view_install', label: 'عرض طلبات/أوامر التركيب', type: 'view' },
          { id: 'schedule_install', label: 'جدولة و تعيين فريق تركيب', type: 'exec' },
          { id: 'complete_install', label: 'إكمال وإغلاق ملف التركيب', type: 'approve' }
        ]
      }
    }
  },
  finance: {
    ar: 'المحاسبة والمالية',
    icon: <DollarSign className="w-5 h-5"/>,
    sub: {
      journal: {
        ar: 'القيود اليومية العامة',
        perms: [
          { id: 'view_entries', label: 'عرض دفتر القيود اليومية', type: 'view' },
          { id: 'add_entry', label: 'إضافة قيد جديد', type: 'add' },
          { id: 'edit_entry', label: 'تعديل قيد يومية', type: 'edit' },
          { id: 'submit_approval', label: 'إرسال القيد للاعتماد', type: 'exec' },
          { id: 'approve_entry', label: 'اعتماد قيد اليومية', type: 'approve' },
          { id: 'print_entry', label: 'طباعة/تصدير القيد', type: 'export' },
          { id: 'view_projects', label: 'عرض المشاريع بالقيود', type: 'view' },
          { id: 'upload_attachment', label: 'رفع مرفقات القيود', type: 'add' }
        ]
      },
      customer_invoices: {
        ar: 'فواتير العملاء',
        perms: [
          { id: 'view_portal', label: 'عرض بوابة فواتير العملاء', type: 'view' },
          { id: 'view_table', label: 'عرض جدول فواتير العملاء', type: 'view' },
          { id: 'view_details', label: 'عرض تفاصيل فاتورة عميل', type: 'view' },
          { id: 'search_invoices', label: 'البحث في فواتير العملاء', type: 'view' },
          { id: 'use_filters', label: 'استخدام فلاتر فواتير العملاء', type: 'view' },
          { id: 'view_attachment', label: 'عرض مرفق فاتورة العميل', type: 'view' },
          { id: 'view_log', label: 'عرض سجل عمليات الفاتورة', type: 'view' },
          { id: 'add_invoice', label: 'إضافة فاتورة عميل جديدة', type: 'add' },
          { id: 'open_add_modal', label: 'فتح نافذة إضافة فاتورة عميل', type: 'add' },
          { id: 'save_draft', label: 'حفظ فاتورة عميل كمسودة', type: 'add' },
          { id: 'send_approval', label: 'إرسال فاتورة عميل للاعتماد', type: 'exec' },
          { id: 'create_from_quote', label: 'إنشاء فاتورة من عرض سعر', type: 'add' },
          { id: 'upload_attachment', label: 'رفع مرفق فاتورة عميل', type: 'add' },
          { id: 'edit_invoice', label: 'تعديل فاتورة عميل', type: 'edit' },
          { id: 'edit_draft', label: 'تعديل فاتورة عميل مسودة', type: 'edit' },
          { id: 'edit_pending', label: 'تعديل فاتورة عميل بانتظار اعتماد', type: 'edit' },
          { id: 'edit_amount', label: 'تعديل مبلغ فاتورة عميل', type: 'edit' },
          { id: 'edit_due_date', label: 'تعديل تاريخ الاستحقاق', type: 'edit' },
          { id: 'edit_attachment', label: 'تعديل مرفق الفاتورة', type: 'edit' },
          { id: 'approve_invoice', label: 'اعتماد فاتورة عميل', type: 'approve' },
          { id: 'reject_invoice', label: 'رفض اعتماد فاتورة عميل', type: 'approve' },
          { id: 'unapprove_invoice', label: 'إلغاء اعتماد فاتورة عميل', type: 'sensitive' },
          { id: 'issue_invoice', label: 'إصدار فاتورة عميل', type: 'approve' },
          { id: 'register_payment', label: 'تسجيل دفعة على فاتورة عميل', type: 'financial' },
          { id: 'edit_payment', label: 'تعديل دفعة فاتورة عميل', type: 'edit' },
          { id: 'delete_payment', label: 'حذف دفعة فاتورة عميل', type: 'delete' },
          { id: 'upload_receipt', label: 'رفع سند دفع عميل', type: 'add' },
          { id: 'cancel_invoice', label: 'إلغاء فاتورة عميل', type: 'delete' },
          { id: 'delete_unapproved', label: 'حذف فاتورة عميل غير معتمدة', type: 'delete' },
          { id: 'delete_draft', label: 'حذف فاتورة عميل مسودة', type: 'delete' },
          { id: 'edit_approved', label: 'تعديل فاتورة عميل معتمدة', type: 'sensitive' },
          { id: 'delete_approved', label: 'حذف فاتورة عميل معتمدة', type: 'sensitive' },
          { id: 'delete_paid', label: 'حذف فاتورة عميل مدفوعة', type: 'sensitive' },
          { id: 'edit_paid_amount', label: 'تعديل مبلغ فاتورة مدفوعة', type: 'sensitive' },
          { id: 'unapprove_issued', label: 'إلغاء اعتماد فاتورة صادرة', type: 'sensitive' },
          { id: 'delete_approved_attachment', label: 'حذف مرفق فاتورة معتمدة', type: 'sensitive' },
          { id: 'register_unapproved_payment', label: 'تسجيل دفعة على فاتورة غير معتمدة', type: 'sensitive' },
          { id: 'export_all', label: 'تصدير كامل فواتير العملاء', type: 'export' },
          
          { id: 'preview_invoice', label: 'معاينة فاتورة عميل', type: 'view' },
          { id: 'print_invoice', label: 'طباعة فاتورة عميل', type: 'export' },
          { id: 'export_pdf', label: 'تصدير فاتورة عميل PDF', type: 'export' },
          { id: 'view_qr', label: 'عرض QR فاتورة عميل', type: 'view' },
          { id: 'zatca_settings', label: 'إدارة إعدادات زاتكا ZATCA', type: 'sensitive' },
          { id: 'zatca_monitor', label: 'عرض لوحة زاتكا ZATCA Monitor', type: 'view' },
          { id: 'zatca_generate_qr', label: 'توليد QR متوافق مع زاتكا', type: 'exec' },
          { id: 'zatca_generate_xml', label: 'توليد XML لزاتكا', type: 'exec' },
          { id: 'zatca_validate', label: 'التحقق الضريبي للفاتورة', type: 'exec' },
          { id: 'zatca_send', label: 'إرسال الفاتورة إلى زاتكا', type: 'approve' },
          { id: 'zatca_resend', label: 'إعادة إرسال لزاتكا', type: 'sensitive' },
          { id: 'zatca_view_log', label: 'عرض سجل زاتكا للفاتورة', type: 'view' },
          { id: 'zatca_export_xml', label: 'تصدير XML زاتكا', type: 'export' },
          { id: 'edit_before_approval', label: 'تعديل بيانات فاتورة عميل قبل الاعتماد', type: 'edit' },
          { id: 'edit_approved_invoice', label: 'تعديل بيانات فاتورة عميل معتمدة', type: 'sensitive' },
          { id: 'edit_items', label: 'تعديل الأصناف داخل فاتورة عميل', type: 'edit' },
          { id: 'edit_vat', label: 'تعديل الضريبة داخل فاتورة عميل', type: 'edit' },
          { id: 'edit_discount', label: 'تعديل الخصم داخل فاتورة عميل', type: 'edit' },
          
          { id: 'edit_template', label: 'تعديل قالب الفاتورة', type: 'sensitive' },
          { id: 'edit_company_data', label: 'تعديل بيانات شركة داخل الفاتورة', type: 'sensitive' },
          { id: 'edit_tax_data', label: 'تعديل بيانات ضريبية داخل الفاتورة', type: 'sensitive' },
          { id: 'export_approved', label: 'تصدير فاتورة معتمدة', type: 'sensitive' },
          { id: 'export_cancelled', label: 'تصدير فاتورة ملغاة', type: 'sensitive' },
          { id: 'print_cancelled', label: 'طباعة فاتورة ملغاة', type: 'sensitive' },
          { id: 'modify_qr', label: 'حذف أو تعديل QR Code', type: 'sensitive' }
        ]
      },
      supplier_invoices: {
        ar: 'فواتير الموردين',
        perms: [
          { id: 'view_portal', label: 'عرض بوابة فواتير الموردين', type: 'view' },
          { id: 'view_table', label: 'عرض جدول فواتير الموردين', type: 'view' },
          { id: 'view_details', label: 'عرض تفاصيل فاتورة مورد', type: 'view' },
          { id: 'search_invoices', label: 'البحث في فواتير الموردين', type: 'view' },
          { id: 'use_filters', label: 'استخدام فلاتر فواتير الموردين', type: 'view' },
          { id: 'view_attachment', label: 'عرض مرفق فاتورة المورد', type: 'view' },
          { id: 'view_log', label: 'عرض سجل عمليات فاتورة المورد', type: 'view' },
          { id: 'add_invoice', label: 'إضافة فاتورة مورد جديدة', type: 'add' },
          { id: 'open_add_modal', label: 'فتح نافذة إضافة فاتورة مورد', type: 'add' },
          { id: 'save_recorded', label: 'حفظ فاتورة مورد كمسجلة', type: 'add' },
          { id: 'send_approval', label: 'إرسال فاتورة مورد للاعتماد', type: 'exec' },
          { id: 'create_from_po', label: 'إنشاء فاتورة من أمر شراء', type: 'add' },
          { id: 'upload_attachment', label: 'رفع مرفق فاتورة مورد', type: 'add' },
          { id: 'edit_invoice', label: 'تعديل فاتورة مورد', type: 'edit' },
          { id: 'edit_recorded', label: 'تعديل فاتورة مورد مسجلة', type: 'edit' },
          { id: 'edit_pending', label: 'تعديل فاتورة مورد بانتظار اعتماد', type: 'edit' },
          { id: 'edit_amount', label: 'تعديل مبلغ فاتورة مورد', type: 'edit' },
          { id: 'edit_due_date', label: 'تعديل تاريخ الاستحقاق', type: 'edit' },
          { id: 'edit_attachment', label: 'تعديل مرفق فاتورة المورد', type: 'edit' },
          { id: 'approve_invoice', label: 'اعتماد فاتورة مورد', type: 'approve' },
          { id: 'reject_invoice', label: 'رفض فاتورة مورد', type: 'approve' },
          { id: 'unapprove_invoice', label: 'إلغاء اعتماد فاتورة مورد', type: 'sensitive' },
          { id: 'request_revision', label: 'طلب تعديل فاتورة مورد', type: 'edit' },
          { id: 'register_payment', label: 'تسجيل دفع لفاتورة مورد', type: 'financial' },
          { id: 'edit_payment', label: 'تعديل دفع فاتورة مورد', type: 'edit' },
          { id: 'delete_payment', label: 'حذف دفع فاتورة مورد', type: 'delete' },
          { id: 'upload_receipt', label: 'رفع سند دفع مورد', type: 'add' },
          { id: 'link_payment_account', label: 'ربط الدفع بالصندوق أو البنك', type: 'financial' },
          { id: 'cancel_invoice', label: 'إلغاء فاتورة مورد', type: 'delete' },
          { id: 'delete_unapproved', label: 'حذف فاتورة مورد غير معتمدة', type: 'delete' },
          { id: 'delete_recorded', label: 'حذف فاتورة مورد مسجلة', type: 'delete' },
          { id: 'edit_approved', label: 'تعديل فاتورة مورد معتمدة', type: 'sensitive' },
          { id: 'delete_approved', label: 'حذف فاتورة مورد معتمدة', type: 'sensitive' },
          { id: 'delete_paid', label: 'حذف فاتورة مورد مدفوعة', type: 'sensitive' },
          { id: 'edit_paid_amount', label: 'تعديل مبلغ فاتورة مورد مدفوعة', type: 'sensitive' },
          { id: 'unapprove_paid', label: 'إلغاء اعتماد فاتورة مورد مدفوعة', type: 'sensitive' },
          { id: 'pay_unapproved', label: 'تسجيل دفع لفاتورة مورد غير معتمدة', type: 'sensitive' },
          { id: 'delete_approved_attachment', label: 'حذف مرفق فاتورة مورد معتمدة', type: 'sensitive' },
          { id: 'export_all', label: 'تصدير كامل فواتير الموردين', type: 'export' },
          
          { id: 'preview_invoice', label: 'معاينة فاتورة مورد', type: 'view' },
          { id: 'print_invoice', label: 'طباعة فاتورة مورد', type: 'export' },
          { id: 'export_pdf', label: 'تصدير فاتورة مورد PDF', type: 'export' },
          { id: 'view_qr', label: 'عرض QR فاتورة مورد', type: 'view' },
          { id: 'edit_before_approval', label: 'تعديل بيانات فاتورة مورد قبل الاعتماد', type: 'edit' },
          { id: 'edit_approved_invoice', label: 'تعديل بيانات فاتورة مورد معتمدة', type: 'sensitive' },
          { id: 'edit_items', label: 'تعديل الأصناف داخل فاتورة مورد', type: 'edit' },
          { id: 'edit_vat', label: 'تعديل الضريبة داخل فاتورة مورد', type: 'edit' },
          { id: 'edit_discount', label: 'تعديل الخصم داخل فاتورة مورد', type: 'edit' }
        ]
      }
    }
  },
  settings: {
    ar: 'المستخدمين والإعدادات',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      users: {
        ar: 'بوابة الصلاحيات والمستخدمين',
        perms: [
          { id: 'view_users', label: 'عرض بوابة المستخدمين', type: 'view' },
          { id: 'add_user', label: 'إضافة مستخدم جديد', type: 'add' },
          { id: 'edit_user', label: 'تعديل/حذف مستخدم', type: 'sensitive' },
          { id: 'manage_permissions', label: 'تعديل الصلاحيات للمستخدمين', type: 'sensitive' }
        ]
      },
      general: {
        ar: 'الإعدادات العامة',
        perms: [
          { id: 'view_settings', label: 'عرض الإعدادات العامة', type: 'view' },
          { id: 'edit_settings', label: 'تعديل بيانات الشركة وإعدادات النظام', type: 'edit' },
          { id: 'database_backup', label: 'تصدير/استيراد نسخة احتياطية', type: 'sensitive' }
        ]
      },
      audit: {
        ar: 'سجل العمليات والتدقيق',
        perms: [
          { id: 'view_audit', label: 'عرض سجل التدقيق بالكامل', type: 'view' },
          { id: 'delete_audit', label: 'حذف أو تفريغ السجل', type: 'sensitive' }
        ]
      }
    }
  },
  notifications: {
    ar: 'إشعارات النظام',
    icon: <Settings className="w-5 h-5"/>,
    sub: {
      general: {
        ar: 'عرض الإشعارات',
        perms: [
          { id: 'view_all', label: 'عرض جميع إشعارات النظام', type: 'view' },
          { id: 'view_hr', label: 'عرض إشعارات الموارد البشرية', type: 'view' },
          { id: 'view_sales', label: 'عرض إشعارات المبيعات', type: 'view' },
          { id: 'view_purchasing', label: 'عرض إشعارات المشتريات', type: 'view' },
          { id: 'view_production', label: 'عرض إشعارات الانتاج', type: 'view' },
          { id: 'view_finance', label: 'عرض إشعارات المحاسبة المالية', type: 'view' },
          { id: 'view_public', label: 'عرض الاشعارات العامة', type: 'view' },
          { id: 'view_private', label: 'عرض الاشعارات الخاصة', type: 'view' }
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

const BADGE_MAP: Record<string, { label: string, color: string }> = {
  sensitive: { label: 'حساسة وخطرة ⚠️', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  financial: { label: 'مالية 💵', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  approve: { label: 'اعتماد ✍️', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delete: { label: 'حذف 🗑️', color: 'bg-red-100 text-red-800 border-red-300' }
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
  const [advPerms, setAdvPerms] = useState<any>(user.permissions?.advanced || {});
  
  const [scopes, setScopes] = useState<any>(user.permissions?.scopes || { global: 'all' });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [activeMain, setActiveMain] = useState(Object.keys(PERMISSIONS_SCHEMA)[0]);
  const [activeSub, setActiveSub] = useState(Object.keys(PERMISSIONS_SCHEMA[activeMain as keyof typeof PERMISSIONS_SCHEMA].sub)[0]);
  
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
     const subPerms = (PERMISSIONS_SCHEMA as any)[main].sub[sub].perms;
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
       advanced: advPerms,
       scopes: scopes,
       moduleAccess: newModuleAccess
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

                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-wider text-right">الأقسام الرئيسية</h4>
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
             <div className="w-full md:w-64 bg-white border-l border-slate-200 shrink-0 flex flex-col p-4 gap-2 overflow-y-auto hidden md:flex">
                <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-wider flex items-center justify-between text-right">
                   الأقسام الفرعية
                   <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">{Object.keys((PERMISSIONS_SCHEMA as any)[activeMain].sub).length}</span>
                </h4>
                {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain].sub).map(([sKey, sVal]: [string, any]) => {
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

             {/* Permissions area */}
             <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                    
                    {/* Selectors for mobile only */}
                    <div className="flex md:hidden flex-col gap-2 mb-4 pb-4 border-b border-slate-200">
                        <select 
                           className="p-2 rounded border border-slate-300 text-sm font-bold bg-white"
                           value={activeMain}
                           onChange={(e) => {
                              setActiveMain(e.target.value);
                              setActiveSub(Object.keys((PERMISSIONS_SCHEMA as any)[e.target.value].sub)[0]);
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
                            {Object.entries((PERMISSIONS_SCHEMA as any)[activeMain].sub).map(([sKey, sVal]: [string, any]) => (
                               <option key={sKey} value={sKey}>{sVal.ar}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 text-right">
                          <div>
                             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-400" />
                                صلاحيات: {(PERMISSIONS_SCHEMA as any)[activeMain].sub[activeSub].ar}
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
                          {(PERMISSIONS_SCHEMA as any)[activeMain].sub[activeSub].perms.map((perm: any) => {
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
                                           <span className={`text-sm font-bold ${isChecked ? colorClasses.split(' ')[0] : 'text-slate-700'}`}>{perm.label}</span>
                                           {badge && <span className={`mr-2 px-1.5 py-0.5 rounded text-[9px] font-black ${badge.color}`}>{badge.label}</span>}
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
