import React, { useState, useEffect } from "react";
import { CashBox, BankAccount, CashBankTransaction } from "./types";
import { db } from "../../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Wallet, Landmark, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";

interface Props {
  lang: "ar" | "en";
}

export default function CashBankDashboard({ lang }: Props) {
  const [totalCash, setTotalCash] = useState(0);
  const [totalBank, setTotalBank] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cashRes = await fetch("/api/dynamic/cash_boxes");
        if (cashRes.ok) {
          const data = await cashRes.json();
          let sum = 0;
          data.forEach((item: any) => sum += Number(item.current_balance || 0));
          setTotalCash(sum);
        }

        const bankRes = await fetch("/api/dynamic/bank_accounts");
        if (bankRes.ok) {
          const data = await bankRes.json();
          let sum = 0;
          data.forEach((item: any) => sum += Number(item.current_balance || 0));
          setTotalBank(sum);
        }

        const transRes = await fetch("/api/dynamic/cash_bank_transactions");
        if (transRes.ok) {
          const data = await transRes.json();
          const currentMonth = new Date().toISOString().substring(0, 7);
          let dep = 0;
          let wit = 0;
          data.forEach((item: any) => {
            if (item.status === "Approved") {
              if (item.date && item.date.startsWith(currentMonth)) {
                if (item.type === "Deposit" || item.type === "Customer_Payment") dep += Number(item.amount || 0);
                else if (item.type === "Withdrawal" || item.type === "Supplier_Payment" || item.type === "Expense" || item.type === "Payroll") wit += Number(item.amount || 0);
              }
            }
          });
          setTotalDeposits(dep);
          setTotalWithdrawals(wit);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">SAR</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{lang === "ar" ? "إجمالي رصيد الصناديق" : "Total Cash Balance"}</p>
        <h3 className="text-2xl font-bold text-slate-800" dir="ltr">{totalCash.toLocaleString()}</h3>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Landmark className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">SAR</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{lang === "ar" ? "إجمالي رصيد البنوك" : "Total Bank Balance"}</p>
        <h3 className="text-2xl font-bold text-slate-800" dir="ltr">{totalBank.toLocaleString()}</h3>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{lang === "ar" ? "هذا الشهر" : "This Month"}</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{lang === "ar" ? "إجمالي الإيداعات والمقبوضات" : "Total Deposits & Collections"}</p>
        <h3 className="text-2xl font-bold text-slate-800" dir="ltr">{totalDeposits.toLocaleString()}</h3>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">{lang === "ar" ? "هذا الشهر" : "This Month"}</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{lang === "ar" ? "إجمالي المدفوعات والمسحوبات" : "Total Withdrawals & Payments"}</p>
        <h3 className="text-2xl font-bold text-slate-800" dir="ltr">{totalWithdrawals.toLocaleString()}</h3>
      </div>
    </div>
  );
}
