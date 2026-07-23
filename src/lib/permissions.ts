import { User, ModulePermissions, UserPermissions } from '../types';

export function hasPermission(
  user: User | null,
  module: keyof UserPermissions['moduleAccess'],
  action: keyof ModulePermissions
): boolean {
  if (!user) return false;
  
  // Feras / Super Admin override
  const username = user.username?.toLowerCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  if (username === 'feras' || username === 'ferasadmin' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management') {
    if (action === 'viewAccess' || action === 'editAccess' || action === 'deleteAccess') return 'all' as any;
    return true;
  }

  // Check new permissions explicitly
  if (user.permissions && user.permissions.moduleAccess) {
    const mod = user.permissions.moduleAccess[module];
    if (!mod || !mod.enabled) return false;
    
    // For viewAccess, editAccess, deleteAccess, just return the value instead of boolean if they expect a string.
    // However, this standard hasPermission normally returns a boolean.
    // Let's adjust this.
    return mod[action] as any;
  }

  return false;
}

export function getAccessLevel(
  user: User | null,
  module: keyof UserPermissions['moduleAccess'],
  action: 'viewAccess' | 'editAccess' | 'deleteAccess'
): 'none' | 'own' | 'all' {
  if (!user) return 'none';
  
  // Super Admin overrides
  const username = user.username?.toLowerCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  if (username === 'feras' || username === 'ferasadmin' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management') {
    return 'all';
  }

  // Check detailed permissions
  if (user.permissions && user.permissions.moduleAccess) {
    const mod = user.permissions.moduleAccess[module];
    if (!mod || !mod.enabled) return 'none';
    
    return mod[action] || 'none';
  }
  
  return 'none';
}

export function canAccessModule(user: User | null, module: keyof UserPermissions['moduleAccess']): boolean {
  if (!user) return false;
  
  // A new pending user (Employee with no advanced permissions) can ONLY access the HR module (specifically Employee Inquiries)
  const username = user.username?.toLowerCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  const isSuperAdmin = username === 'feras' || username === 'ferasadmin' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management';
  
  if (!isSuperAdmin && roleName === 'employee') {
    const hasAnyGranted = user.permissions && user.permissions.advanced && Object.keys(user.permissions.advanced).length > 0;
    if (!hasAnyGranted) {
      return module === 'hr';
    }
  }

  const lvl = getAccessLevel(user, module, 'viewAccess');
  return lvl === 'all' || lvl === 'own';
}

export function hasAdvancedPermission(
  user: User | null,
  mainModule: string,
  subModule: string,
  permId: string
): boolean {
  if (!user) return false;
  const username = user.username?.toUpperCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  
  // Hardcoded Super Admin / Owners always return true
  if (username === 'FERAS' || username === 'FERASADMIN' || username === 'ADMIN' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management' || roleName.includes('owner')) {
     return true;
  }
  
  let normSub = subModule;
  let normPerm = permId;
  if (subModule === 'collections') {
    normSub = 'collection';
  }
  if (permId === 'view_collections') {
    normPerm = 'view_collection';
  }
  if (subModule === 'production_requests') {
    normSub = 'prod_orders';
  }
  if (permId === 'view_requests' && (subModule === 'production_requests' || subModule === 'prod_orders')) {
    normPerm = 'view_prod_orders';
  }

  // Advanced granular check
  if (user.permissions && user.permissions.advanced && Object.keys(user.permissions.advanced).length > 0) {
     const val = user.permissions.advanced[mainModule]?.[normSub]?.[normPerm];
     return val === 'all' || val === 'own' || val === true;
  }
  
  // For finance_approval, we don't fall back to generic procurement view access.
  if (mainModule === 'procurement' && subModule === 'finance_approval') {
    return false;
  }
  
  // Fallback to standard permissions
  try {
    const modKey = mainModule as any;
    if (!canAccessModule(user, modKey)) return false;
    
    if (permId.startsWith('view')) {
      return getAccessLevel(user, modKey, 'viewAccess') !== 'none';
    }
    if (permId.startsWith('add') || permId.startsWith('create')) {
      const mod = user.permissions?.moduleAccess?.[modKey];
      return !!(mod && mod.add);
    }
    if (permId.startsWith('edit') || permId.startsWith('manage') || permId.startsWith('reply')) {
      return getAccessLevel(user, modKey, 'editAccess') !== 'none';
    }
    if (permId.startsWith('delete')) {
      return getAccessLevel(user, modKey, 'deleteAccess') !== 'none';
    }
    if (permId.startsWith('approve')) {
      const mod = user.permissions?.moduleAccess?.[modKey];
      return !!(mod && mod.approve);
    }
    return getAccessLevel(user, modKey, 'viewAccess') !== 'none';
  } catch {
    return false;
  }
}

export function getAdvancedPermissionScope(
  user: User | null,
  mainModule: string,
  subModule: string,
  permId: string
): 'all' | 'own' | 'none' {
  if (!user) return 'none';
  const username = user.username?.toUpperCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  
  if (username === 'FERAS' || username === 'FERASADMIN' || username === 'ADMIN' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management' || roleName.includes('owner')) {
     return 'all';
  }

  let normSub = subModule;
  let normPerm = permId;
  if (subModule === 'collections') {
    normSub = 'collection';
  }
  if (permId === 'view_collections') {
    normPerm = 'view_collection';
  }
  if (subModule === 'production_requests') {
    normSub = 'prod_orders';
  }
  if (permId === 'view_requests' && (subModule === 'production_requests' || subModule === 'prod_orders')) {
    normPerm = 'view_prod_orders';
  }

  if (user.permissions && user.permissions.advanced && Object.keys(user.permissions.advanced).length > 0) {
     const val = user.permissions.advanced[mainModule]?.[normSub]?.[normPerm];
     if (val === 'all' || val === true) return 'all';
     if (val === 'own') return 'own';
     return 'none';
  }
  
  // Fallback to standard permissions
  try {
    const act = permId.includes('delete') ? 'deleteAccess' : (permId.includes('edit') || permId.includes('manage') ? 'editAccess' : 'viewAccess');
    return getAccessLevel(user, mainModule as any, act);
  } catch {
    return 'none';
  }
}

export function canShowSubmenu(user: User | null, module: string, subId: string): boolean {
  if (!user) return false;
  
  // Super Admin overrides
  const username = user.username?.toLowerCase() || '';
  const roleName = user.role?.toLowerCase() || '';
  if (username === 'feras' || username === 'ferasadmin' || username === 'admin' || roleName === 'super admin' || roleName === 'general admin director' || roleName.includes('الادارة العليا') || roleName === 'senior management') {
    return true;
  }

  // Map subId to schema
  if (module === 'hr') {
    if (subId === 'dashboard') return hasAdvancedPermission(user, 'hr', 'dashboard', 'view_dashboard');
    if (subId === 'ess_dashboard') return true;
    if (subId === 'employees_all') return hasAdvancedPermission(user, 'hr', 'employees', 'view_emp');
    if (subId === 'leaves_tracker') return hasAdvancedPermission(user, 'hr', 'leaves', 'view_balances');
    if (subId === 'payroll_main') return hasAdvancedPermission(user, 'hr', 'payroll', 'view_payroll');
    if (subId === 'payroll_deductions') return hasAdvancedPermission(user, 'hr', 'deductions', 'view_deductions');
    if (subId === 'recruitment') return hasAdvancedPermission(user, 'hr', 'performance', 'view_perf');
    if (subId === 'documents') return hasAdvancedPermission(user, 'hr', 'letters', 'view_letters');
  }

  if (module === 'sales') {
    if (subId === 'sales_dashboard') return hasAdvancedPermission(user, 'sales', 'dashboard', 'view_dashboard');
    if (subId === 'sales_crm') return hasAdvancedPermission(user, 'sales', 'clients', 'view_clients');
    if (subId === 'sales_quotations') return hasAdvancedPermission(user, 'sales', 'quotations', 'view_quotes');
    if (subId === 'sales_collections') return hasAdvancedPermission(user, 'sales', 'collection', 'view_collection');
    if (subId === 'sales_production_requests') return hasAdvancedPermission(user, 'sales', 'prod_orders', 'view_prod_orders');
    if (subId === 'sales_letters') return hasAdvancedPermission(user, 'sales', 'letters', 'view_letters');
    if (subId === 'sales_reports') return hasAdvancedPermission(user, 'sales', 'reports', 'view_reports');
    if (subId === 'sales_reps_targets') return hasAdvancedPermission(user, 'sales', 'reps', 'view_reps');
    if (subId === 'sales_pricing_study') return hasAdvancedPermission(user, 'sales', 'pricing_study', 'view_pricing_study');
    if (subId === 'sales_costing') {
      if (!user.permissions?.advanced || Object.keys(user.permissions.advanced).length === 0) {
        const role = user.role || "";
        const title = (user.jobTitle || "").toLowerCase();
        const isRep = title.includes("rep") || title.includes("associate") || title.includes("مندوب") || role === "Sales Rep";
        const isMgmt = role === "Sales Manager" || role === "Manager" || title.includes("manager") || title.includes("director") || title.includes("إدارة") || title.includes("مدير") || title.includes("owner") || title.includes("gm");
        return isMgmt && !isRep;
      }
      return hasAdvancedPermission(user, 'sales', 'quotations', 'view_quotes');
    }
  }

  if (module === 'procurement') {
    if (subId === 'warehouse_dashboard') return hasAdvancedPermission(user, 'procurement', 'dashboard', 'view_dashboard');
    if (subId === 'warehouse_items') return hasAdvancedPermission(user, 'procurement', 'items', 'view_items');
    if (subId === 'materials_warehouse') return hasAdvancedPermission(user, 'procurement', 'materials', 'view_materials');
    if (subId === 'warehouse_procurement') return hasAdvancedPermission(user, 'procurement', 'requests', 'view_requests');
    if (subId === 'warehouse_suppliers_pricing') return hasAdvancedPermission(user, 'procurement', 'suppliers', 'view_suppliers');
    if (subId === 'warehouse_finance_approval') return hasAdvancedPermission(user, 'procurement', 'finance_approval', 'view_finance_po');
    if (subId === 'warehouse_daily_purchases') return hasAdvancedPermission(user, 'procurement', 'daily_purchases', 'view_daily_purchases');
  }

  if (module === 'production') {
    if (subId === 'prod_dashboard') return hasAdvancedPermission(user, 'production', 'dashboard', 'view_dashboard');
    if (subId === 'prod_daily_followup') return hasAdvancedPermission(user, 'production', 'daily_followup', 'view_daily_followup');
    if (subId === 'prod_inbound') return hasAdvancedPermission(user, 'production', 'received', 'view_received');
    if (subId === 'prod_orders') return hasAdvancedPermission(user, 'production', 'orders', 'view_orders');
    if (subId === 'prod_active_projects') return hasAdvancedPermission(user, 'production', 'projects', 'view_projects');
    if (subId === 'prod_installation') return hasAdvancedPermission(user, 'production', 'installation', 'view_install');
  }

  if (module === 'finance') {
    if (subId === 'accounting_dashboard') return hasAdvancedPermission(user, 'finance', 'dashboard', 'view_dashboard');
    if (subId === 'accounting_journal') return hasAdvancedPermission(user, 'finance', 'journal', 'view_entries');
    if (subId === 'accounting_invoices') return hasAdvancedPermission(user, 'finance', 'customer_invoices', 'view_portal');
    if (subId === 'accounting_revenues') return hasAdvancedPermission(user, 'finance', 'revenues', 'view_revenues');
    if (subId === 'accounting_supplier_invoices') return hasAdvancedPermission(user, 'finance', 'supplier_invoices', 'view_portal');
    if (subId === 'accounting_expenses') return hasAdvancedPermission(user, 'finance', 'expenses', 'view_expenses');
    if (subId === 'accounting_payroll') return hasAdvancedPermission(user, 'finance', 'payroll', 'view_payroll');
    if (subId === 'accounting_cash_bank') return hasAdvancedPermission(user, 'finance', 'cash_bank', 'view_portal');
    if (subId === 'accounting_eos_leave') return hasAdvancedPermission(user, 'finance', 'eos_calculator', 'view_calculator');
    if (subId === 'accounting_zakat_tax') return hasAdvancedPermission(user, 'finance', 'zakat_tax', 'view_zakat_tax');
    if (subId === 'accounting_reports') return hasAdvancedPermission(user, 'finance', 'reports', 'view_reports');
    if (subId === 'accounting_zatca') return hasAdvancedPermission(user, 'finance', 'zatca', 'view_zatca');
    if (subId === 'accounting_firas') return hasAdvancedPermission(user, 'finance', 'firas', 'view_firas');
  }

  return true;
}
