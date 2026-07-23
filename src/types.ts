/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModulePermissions {
  enabled: boolean;
  viewAccess: 'none' | 'own' | 'all';
  editAccess: 'none' | 'own' | 'all';
  deleteAccess: 'none' | 'own' | 'all';
  add: boolean;
  approve: boolean;
  exportPdf: boolean;
  exportExcel: boolean;
  print: boolean;
  deleteSensitive: boolean;
  viewCosts: boolean;
}

export interface UserPermissions {
  advanced?: any;
  scopes?: any;
  moduleAccess: {
    hr: ModulePermissions;
    sales: ModulePermissions;
    finance: ModulePermissions;
    production: ModulePermissions;
    procurement: ModulePermissions;
    reports: ModulePermissions;
    settings: ModulePermissions;
    notifications: ModulePermissions;
  };
  // Legacy
  modules?: any;
  actions?: any;
}

export interface User {
  id?: string;
  uid?: string;
  username: string;
  email?: string;
  role: string;
  jobTitle: string;
  dateCreated: string;
  password?: string;
  empId?: string;
  permissions?: UserPermissions;
}

export interface CustodyRecord {
  laptop?: string;
  tools?: string;
  vehicles?: string;
  other?: string;
}

export interface Allowance {
  housing: number;
  transport: number;
  food?: number;
  muddah?: number;
  otherAllowances?: number;
  loans?: number;       // سلفة مالية
  deductions?: number;  // خصومات
  overtime?: number;    // إضافي
  bonuses?: number;     // مكافآت
  status?: string;      // حالة الموظف: Active, On Leave, Suspended
}

export interface CustodyAsset {
  name: string; // العهدة
  receivedDate: string; // تاريخ الاستلام
  category: string; // تصنيف العهدة
  additionalInfo: string; // معلومات إضافية
}

export interface Employee {
  id: string; // Employee ID
  arabicName: string; // Quadruple Arabic Name
  englishName: string;
  iqamaId: string;
  passportDetails: string;
  jobTitle: string;
  grade: string;
  basicSalary: number;
  allowances: Allowance;
  homeAddress: string;
  custody: CustodyRecord;
  birthDate: string;
  dateOfJoining: string;
  contractExpiry: string;
  department: string;
  mobile?: string;
  experienceYears?: number;
  nationality?: string;
  company?: string; // الشركة: شركة فنون الوليد أو شركة ساين اكس
  iqamaExpiryDate?: string;
  passportExpiryDate?: string;
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  insuranceClass?: string;
  insuranceExpiryDate?: string;
  custodyAssets?: CustodyAsset[];
  classification?: string; // تصنيف الموظف: موظف، عامل تصنيع، إداري، الإدارة العليا، فراس
  contractUrl?: string;
  contractQiwaNumber?: string;
  vacationBalance?: number;
  vacationUsed?: number;
  sickUsed?: number;
  personalPhoto?: string;
  iqamaPhoto?: string;
  passportPhoto?: string;
  religion?: string;

  // بيانات البنك والتحويل
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  swiftCode?: string;
  transferMethod?: string;
  accountHolderName?: string;
  bankNotes?: string;
}

export type PayrollRunStatus =
  | "Draft"
  | "Pending Review"
  | "Needs Modification"
  | "Under Modification"
  | "Reviewed"
  | "Pending Final Approval"
  | "Approved"
  | "Ready for Transfer"
  | "Transferred"
  | "Partially Paid"
  | "Rejected"
  | "Cancelled";

export interface PayrollRun {
  id: string;
  payrollNumber: string;
  month: number;
  year: number;
  salaryPeriod: string;
  department: string;
  status: PayrollRunStatus;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
  employeesCount: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  approvedAt?: string;
  approvedBy?: string;
  transferredAt?: string;
  transferredBy?: string;
  transferDetails?: {
    bankName: string;
    referenceNumber: string;
    transferDate: string;
    notes?: string;
  };
  isDeleted?: boolean;
  overtimeCalcMethod?: string;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  auditLogs?: PayrollAuditLog[];
  modificationRequests?: PayrollModificationRequest[];
  totalOvertimeHours?: number;
  totalOvertimeAmount?: number;
  employees?: PayrollRunEmployee[];
}

export interface DeductionItem {
  id: string;
  type: "Absence Deduction" | "Late Deduction" | "Loan Deduction" | "Penalty Deduction" | "Other Deduction" | "GOSI Deduction";
  amount: number;
  reason: string;
  notes?: string;
  source?: "HR" | "Manual";
  sourceDeductionId?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PayrollRunEmployee {
  id: string;
  payrollRunId: string;
  employeeId: string;
  arabicName: string;
  englishName: string;
  jobTitle: string;
  department: string;
  company?: string; // الشركة: شركة فنون الوليد أو شركة ساين اكس
  iqamaId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  muddahAmount: number;
  overtimeHours: number;
  overtimeAmount: number;
  overtimeCalcMethod?: string; // 'manual' | 'basic' | 'muddah'
  otherAllowances: number;
  otherAllowancesReason?: string;
  loansDeduction: number;
  gosiDeduction: number;
  absenceDeduction?: number;
  lateDeduction?: number;
  penaltyDeduction?: number;
  otherDeductions: number;
  deductionsReason?: string;
  absenceDeductionReason?: string;
  lateDeductionReason?: string;
  loanDeductionReason?: string;
  penaltyDeductionReason?: string;
  bankName: string;
  iban: string;
  accountNumber: string;
  swiftCode?: string;
  transferMethod: string;
  accountHolderName: string;
  bankInfo?: {
    bankName: string;
    iban: string;
    accountNumber: string;
    swiftCode: string;
    transferMethod: string;
    accountHolderName: string;
  };
  totalEntitlements: number;
  totalDeductions: number;
  netSalary: number;
  deductionsList?: DeductionItem[];
  transferStatus?: string;
  isTransferred?: boolean;
  modifications?: {
    id?: string;
    field: string;
    oldValue: any;
    newValue: any;
    modifiedBy: string;
    modifiedAt: string;
    fromReview?: boolean;
  }[];
}

export interface PayrollAuditLog {
  id: string;
  payrollRunId: string;
  timestamp: string;
  operatorName: string;
  action: string;
  details: string;
}

export interface PayrollModificationRequest {
  id: string;
  payrollRunId: string;
  employeeId?: string;
  employeeName?: string;
  requestedBy: string;
  requestedAt: string;
  notes: string;
  status: "Open" | "Closed";
  responseNotes?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface SignageItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface MilestoneCollection {
  downPayment: { amount: number; percentage: number; isCollected: boolean; alertSent: boolean }; // 50%
  preInstallation: { amount: number; percentage: number; isCollected: boolean; alertSent: boolean }; // 30%
  uponDelivery: { amount: number; percentage: number; isCollected: boolean; alertSent: boolean }; // 20%
}

export interface Quotation {
  id: string;
  clientName: string;
  projectTitle: string;
  title?: string;
  customerId?: string;
  isApproved?: boolean;
  milestonesSetup?: any[];
  stage: 'New Lead' | 'Design Request' | 'Technical Estimation' | 'Sent Quotation' | 'Client Negotiation' | 'Down-payment' | 'Production Start' | 'Completed' | 'Closed' | 'Site Survey' | 'Pending Approval' | 'Approved Costing' | 'Draft' | 'Rejected' | 'Won' | 'Lost' | 'Approved' | string;
  neonMeters: number;
  installationFees: number;
  vatRate: number; // usually 15%
  items: SignageItem[];
  milestones: MilestoneCollection | any;
  dateCreated: string;
  salesRepName?: string;
  designFileUrl?: string;
  designFileName?: string;
  installationAddress?: string;
  signageType?: 'Neon Sign' | 'Acrylic Board' | 'LED Screen' | 'Flex Printing' | 'Custom Fabrication';
  productionStatus?: 'Pending Design Checklist' | 'In Production' | 'Halted' | 'Ready' | 'Completed' | 'Cancelled' | 'Closed';
  cncFileUrl?: string;
  cncFileName?: string;
  productionStages?: {
    id: number;
    titleAr: string;
    titleEn: string;
    status: 'Done' | 'Current' | 'Pending';
    operator: string;
    expectedHours: number;
    actualHours: number;
    timeStarted: string | null;
    logs: string[];
    isCurrentlyPaused: boolean;
    pauseReason: string;
  }[];
  productionMaterials?: {
    id: string;
    key: string;
    name: string;
    requested: number;
    available: number;
    reserved: number;
    deficit: number;
    reqDate?: string;
    priority?: string;
    status: 'Pending' | 'Fully Supplied' | 'Partially Supplied' | 'PO Made';
  }[];
  productionTasks?: {
    id: string;
    workerName: string;
    role: string;
    description: string;
    createdAt: string;
  }[];
  productionHaltReason?: string;
  productionHaltHistory?: { reason: string; date: string; resolvedNotes?: string }[];
  productionCanceledReason?: string;
  actualDurationDays?: number;
  scrapPercentage?: number;
  [key: string]: any;
}

export interface RecruitmentTemplate {
  jobTitle: string;
  salaryMin: number;
  salaryMax: number;
  careerPath: string[];
  responsibilities: string[];
  skills: string[];
}

export interface ClearanceProfile {
  clearanceId: string;
  employeeId: string;
  commenceDate: string;
  reasonCategory: string;
  detailedJustification: string;
  checkpointBlockers: {
    pendingVehiclesHandover: boolean;
    pendingITHandover: boolean;
    pendingToolkitsHandover: boolean;
  };
  auditSecurityHash: string;
  scheduledFinalSettleDate: string;
  signatories: {
    fleetManager: string;
    itDirector: string;
    warehouseController: string;
  };
  isFullyCertifiedCleared: boolean;
}

export interface RolePreset {
  id: string;
  label: string;
  roleTitle: string;
  iconName: string;
  rawNotes: string;
}

export interface LeaveRequest {
  id: string;
  empId: string;
  name: string;
  type_ar: string;
  type_en: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submissionType: 'self' | 'hr';
}

export interface InquiryRequest {
  id: string;
  empId: string;
  name: string;
  category_ar: 'حالة العقد' | 'توزيع الراتب' | 'ساعات العمل' | 'معلومات المسمى الوظيفي' | 'خطاب تعريف بالراتب' | 'شهادة خبرة' | string;
  category_en: 'Contract Expiry Status' | 'Salary Statement' | 'Working Hours' | 'Job Title Info' | 'Salary Certificate Document' | 'Experience Certificate Document' | string;
  details: string;
  status: 'PENDING' | 'ANSWERED' | string;
  hrNotes?: string;
  dateCreated: string;
}



export interface Client {
  id: string;
  clientName: string;
  companyName: string;
  mobile: string;
  email: string;
  country?: string;
  region?: string;
  city: string;
  crNumber: string;
  taxExempt: boolean;
  taxNumber: string;
  classification: string;
  nationalAddress?: {
    buildingNumber?: string;
    streetName?: string;
    district?: string;
    city?: string;
    postalCode?: string;
    additionalNumber?: string;
  };
  dateCreated: string;
  status?: string;
  isDraft?: boolean;
}

export interface WarehouseItem {
  id: string; // The UUID or DB ID
  itemGroup: string; // Background, منتجات, الخ
  itemCode: string; // رمز الصنف
  itemNameAr: string; 
  itemNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  defaultUnit: string; // وحدة القياس الافتراضية
  warehouse: string; // مستودع الدمام الاساسي - المصنع الرئيسي
  isPurchaseItem: boolean; // صنف شراء نعم او لا
  imageUrl?: string;
  isDraft: boolean;
  dateCreated: string;
}

export interface EmployeeDoc {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNum: string;
  department: string;
  jobTitle: string;
  docType: string;
  docNumber: string;
  issueDate?: string;
  expiryDate: string;
  docUrl: string;
  docFile?: string;
  notes: string;
  status: string; // سارية, قريبة من الانتهاء, تحتاج متابعة, حرجة, تنتهي اليوم, منتهية
  alertDays?: number;
  updatedAt: string;
  updatedBy: string;
}

export interface VehicleDoc {
  id: string;
  vehicleName: string;
  plateNumber: string;
  model: string;
  driverName?: string;
  docType: string;
  docNumber: string;
  issueDate?: string;
  expiryDate: string;
  docUrl: string;
  docFile?: string;
  notes: string;
  status: string;
  alertDays?: number;
  updatedAt: string;
  updatedBy: string;
}

export interface DocActivityLog {
  id: string;
  timestamp: string;
  user: string;
  actionType: 'ADD_DOC' | 'EDIT_DOC' | 'DELETE_DOC' | 'UPDATE_EXPIRY' | 'VIEW_LINK' | 'EXPORT_REPORT';
  docCategory: 'employee' | 'vehicle';
  docType: string;
  docNumber: string;
  relatedName: string; // Employee Name or Vehicle Plate/Name
  beforeState?: string;
  afterState?: string;
}

