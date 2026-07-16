sed -i '/{confirmDialog.isOpen && (/,$d' src/components/finance/MonthlyPayrollRuns.tsx
cat << 'INNER_EOF' >> src/components/finance/MonthlyPayrollRuns.tsx
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 font-arabic">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-600 mb-8 font-arabic leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors font-arabic"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all font-arabic"
              >
                تأكيد المتابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
INNER_EOF
