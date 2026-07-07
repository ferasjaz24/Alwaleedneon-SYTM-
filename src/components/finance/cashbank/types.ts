export interface CashBox {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  branch: string;
  status: "Active" | "Closed";
  created_at: string;
  created_by: string;
}

export interface BankAccount {
  id: string;
  bank_name_ar: string;
  bank_name_en: string;
  account_name: string;
  account_number: string;
  iban: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  branch: string;
  status: "Active" | "Closed";
  created_at: string;
  created_by: string;
}

export interface CashBankTransaction {
  id: string;
  type: "Deposit" | "Withdrawal" | "Customer_Payment" | "Supplier_Payment" | "Expense" | "Payroll";
  source_type: "Cash_Box" | "Bank_Account";
  source_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  reference_number: string;
  status: "Draft" | "Pending_Approval" | "Approved" | "Cancelled";
  created_at: string;
  created_by: string;
  approved_by?: string;
  attachments?: string[];
}

export interface CashBankTransfer {
  id: string;
  from_type: "Cash_Box" | "Bank_Account";
  from_id: string;
  to_type: "Cash_Box" | "Bank_Account";
  to_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  reference_number: string;
  status: "Draft" | "Pending_Approval" | "Approved" | "Cancelled";
  created_at: string;
  created_by: string;
  approved_by?: string;
  attachments?: string[];
}
