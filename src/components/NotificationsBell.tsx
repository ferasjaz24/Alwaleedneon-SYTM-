import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText, AlertCircle, Clock, AlertTriangle, UserPlus, FileWarning, Wallet } from 'lucide-react';
import { User } from '../types';
import { hasAdvancedPermission } from '../lib/permissions';

interface NotificationsBellProps {
  user: User | null;
  lang: 'ar' | 'en';
}

interface Notification {
  id: string;
  type: 'hr' | 'sales' | 'purchasing' | 'production' | 'finance' | 'system';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  icon: React.ReactNode;
}

export default function NotificationsBell({ user, lang }: NotificationsBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkPermissions = (type: string) => {
    if (!user) return false;
    // If not enabled or no view_all, they might need specific view.
    // user.role is 'Admin' etc. We can just use hasAdvancedPermission if needed.
    // For now, let's implement a simple check.
    const isAdmin = user.role === 'Admin' || user.role === 'General Admin Director' || user.username === 'feras';
    if (isAdmin) return true;

    // Based on user request, check custom permissions
    const perms = user.permissions?.moduleAccess?.notifications;
    if (!perms || !perms.enabled) return false;

    // advanced scopes
    const advanced = user.permissions?.advanced?.notifications?.general;
    if (!advanced) return false;

    if (advanced.includes('view_all')) return true;
    if (type === 'hr' && advanced.includes('view_hr')) return true;
    if (type === 'sales' && advanced.includes('view_sales')) return true;
    if (type === 'finance' && advanced.includes('view_finance')) return true;
    if (type === 'production' && advanced.includes('view_production')) return true;
    if (type === 'purchasing' && advanced.includes('view_purchasing')) return true;
    if (type === 'system' && advanced.includes('view_public')) return true;

    return false;
  };

  const loadNotifications = async () => {
    const newNotifs: Notification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();
    
    // 1. HR: Employees docs
    if (checkPermissions('hr')) {
      try {
        const empRes = await fetch('/api/employees');
        const employees = await empRes.json();
        
        employees.forEach((emp: any) => {
          const checkExpiry = (dateStr: string, name: string, docName: string) => {
            if (!dateStr) return;
            const ms = new Date(dateStr).getTime() - todayMs;
            const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
            if (days < 0) {
              newNotifs.push({
                id: `exp-${emp.id}-${docName}`,
                type: 'hr',
                title: lang === 'ar' ? 'وثيقة منتهية' : 'Document Expired',
                message: lang === 'ar' ? `انتهاء ${docName} للموظف ${name}` : `${docName} expired for ${name}`,
                date: todayStr,
                isRead: false,
                icon: <FileWarning className="w-5 h-5 text-red-500" />
              });
            } else if (days <= 30) {
              newNotifs.push({
                id: `exp-warn-${emp.id}-${docName}`,
                type: 'hr',
                title: lang === 'ar' ? 'وثيقة تقترب من الانتهاء' : 'Document Expiring Soon',
                message: lang === 'ar' ? `${docName} للموظف ${name} تنتهي خلال ${days} يوم` : `${docName} for ${name} expires in ${days} days`,
                date: todayStr,
                isRead: false,
                icon: <Clock className="w-5 h-5 text-amber-500" />
              });
            }
          };

          checkExpiry(emp.iqamaExpiryDate, emp.arabicName, 'الإقامة');
          checkExpiry(emp.passportExpiryDate, emp.arabicName, 'جواز السفر');
          checkExpiry(emp.insuranceExpiryDate, emp.arabicName, 'التأمين الطبي');
          checkExpiry(emp.contractExpiry, emp.arabicName, 'عقد العمل');
        });
      } catch (e) {}

      // Inquiries
      try {
        const inqRes = await fetch('/api/inquiries');
        const inquiries = await inqRes.json();
        const pendingInq = inquiries.filter((i: any) => i.status === 'PENDING');
        if (pendingInq.length > 0) {
          newNotifs.push({
            id: 'inq-pending',
            type: 'hr',
            title: lang === 'ar' ? 'طلبات استعلام جديدة' : 'New Inquiries',
            message: lang === 'ar' ? `يوجد ${pendingInq.length} طلبات استعلام جديدة بانتظار الرد` : `There are ${pendingInq.length} new inquiries pending reply`,
            date: todayStr,
            isRead: false,
            icon: <UserPlus className="w-5 h-5 text-blue-500" />
          });
        }
      } catch (e) {}
    }

    // 2. Finance: Late payments
    if (checkPermissions('finance')) {
      try {
        const invRes = await fetch('/api/customer-invoices');
        const invoices = await invRes.json();
        let lateCount = 0;
        invoices.forEach((inv: any) => {
          if (inv.dueDate < todayStr && inv.remainingAmount > 0 && inv.status !== 'ملغاة') {
            lateCount++;
          }
        });
        if (lateCount > 0) {
          newNotifs.push({
            id: 'fin-late',
            type: 'finance',
            title: lang === 'ar' ? 'دفعات متأخرة' : 'Late Payments',
            message: lang === 'ar' ? `يوجد ${lateCount} فواتير عملاء متأخرة الدفع` : `There are ${lateCount} overdue customer invoices`,
            date: todayStr,
            isRead: false,
            icon: <Wallet className="w-5 h-5 text-red-500" />
          });
        }
      } catch (e) {}
    }

    // 3. Production: Delays and installation
    if (checkPermissions('production')) {
      try {
        const sqRes = await fetch('/api/sales_quotations');
        const quotes = await sqRes.json();
        
        let delayedCount = 0;
        let approachingInst = 0;

        quotes.forEach((q: any) => {
           if (q.productionStatus === 'Halted') delayedCount++;
           if (q.stage === 'Ready' || q.productionStatus === 'Ready') approachingInst++;
        });

        if (delayedCount > 0) {
          newNotifs.push({
            id: 'prod-delay',
            type: 'production',
            title: lang === 'ar' ? 'تأخير في الإنتاج' : 'Production Delayed',
            message: lang === 'ar' ? `يوجد ${delayedCount} مشاريع متوقفة أو متأخرة في الإنتاج` : `There are ${delayedCount} halted/delayed projects`,
            date: todayStr,
            isRead: false,
            icon: <AlertTriangle className="w-5 h-5 text-rose-500" />
          });
        }

        if (approachingInst > 0) {
          newNotifs.push({
            id: 'prod-inst',
            type: 'production',
            title: lang === 'ar' ? 'وقت التركيب' : 'Installation Approaching',
            message: lang === 'ar' ? `يوجد ${approachingInst} مشاريع جاهزة للتركيب` : `There are ${approachingInst} projects ready for installation`,
            date: todayStr,
            isRead: false,
            icon: <AlertCircle className="w-5 h-5 text-emerald-500" />
          });
        }
      } catch (e) {}
    }

    setNotifications(newNotifs);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-200/60 hover:bg-[#0072BC] hover:text-white text-slate-600 rounded-xl transition-colors outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 99 ? '+99' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0072BC]" />
              {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs text-[#0072BC] font-bold bg-blue-100 px-2 py-1 rounded-full">
                {unreadCount} {lang === 'ar' ? 'جديد' : 'New'}
              </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold">{lang === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer">
                    <div className="mt-0.5">
                      {notif.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">{notif.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <button className="text-xs font-bold text-[#0072BC] hover:underline">
              {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
