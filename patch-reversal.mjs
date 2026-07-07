import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('src/components/finance/JournalEntries.tsx', [
  [
    `const handleDelete = (entry: any) => {
    setDeleteConfirmItem(entry);
  };`,
    `const handleDelete = (entry: any) => {
    setDeleteConfirmItem(entry);
  };

  const handleCreateReversal = async (entry: any) => {
    if (!window.confirm("هل أنت متأكد أنك تريد إنشاء واعتماد قيد عكسي لهذا القيد؟")) return;
    try {
      const revLines = (entry.lines || []).map((l: any) => ({
        ...l,
        debit: l.credit || 0,
        credit: l.debit || 0
      }));
      const payload = {
        date: new Date().toISOString().split("T")[0],
        type: "قيد عكسي",
        status: "معتمد",
        description: \`قيد عكسي للقيد رقم \${entry.id}\`,
        lines: revLines,
        totalDebit: entry.totalCredit || 0,
        totalCredit: entry.totalDebit || 0,
        amount: entry.amount,
        createdBy: user.username,
        updatedAt: new Date().toISOString()
      };
      
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Also update original entry status to "Reversed"
        await fetch(\`/api/journal-entries/\${entry.id}\`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...entry, status: "Reversed" })
        });
        alert("تم إنشاء واعتماد القيد العكسي بنجاح.");
        fetchEntries();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create reversal");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };`
  ],
  [
    `                        {entry.status === 'معتمد' ? (
                          <button 
                            onClick={() => handleDelete(entry)} 
                            className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition active:scale-95 duration-100" 
                            title="عكس وإلغاء القيد"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : entry.status !== 'ملغي' ? (`,
    `                        {entry.status === 'معتمد' || entry.status === 'Approved' ? (
                          <button 
                            onClick={() => handleCreateReversal(entry)} 
                            className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition active:scale-95 duration-100" 
                            title="Create Reversal Entry (قيد عكسي)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : entry.status !== 'ملغي' && entry.status !== 'Reversed' ? (`
  ]
]);

