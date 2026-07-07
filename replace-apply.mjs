import fs from 'fs';

const serverStr = fs.readFileSync('server.ts', 'utf-8');

const regex = /async function applyJournalToCashBank\(entryId: string, entry: any, isReversal = false\) \{[\s\S]*?catch \(err: any\) \{\s*console.warn\("Balances processing skipped due to error:", err.message\);\s*\}\s*\}/;

const replacement = `async function applyJournalToCashBank(entryId: string, passedEntry?: any, isReversal = false) {
  try {
    const entryRef = doc(db, "journal_entries", entryId);
    const entrySnap = await getDoc(entryRef);
    if (!entrySnap.exists()) return;
    const entry = entrySnap.data();

    // 3. تأكد أن القيد Approved
    if (entry.status !== "معتمد" && entry.status !== "Approved") return;

    // 5. تأكد أن cashBankApplied ليس true
    if (!isReversal && entry.cashBankApplied) {
      console.log(\`Journal entry \${entryId} already applied to cash/bank.\`);
      return;
    }

    if (isReversal && !entry.cashBankApplied) {
      console.log(\`Journal entry \${entryId} is not applied, cannot reverse.\`);
      return;
    }

    // 2. تجيب سطور القيد من journal_entry_lines
    let entryLines = entry.lines || [];
    if (!entryLines || entryLines.length === 0) {
      try {
        const linesSnap = await getDocs(collection(db, "journal_entry_lines"));
        entryLines = linesSnap.docs
          .map(d => d.data())
          .filter((l: any) => l.journalEntryId === entryId)
          .sort((a: any, b: any) => (a.lineNo || 0) - (b.lineNo || 0));
      } catch (err: any) {
        console.warn("Failed to fetch journal_entry_lines fallback for", entryId, err.message);
      }
    }

    // 4. تتأكد أن القيد متوازن
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of entryLines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.log(\`Journal entry \${entryId} is not balanced, skipping.\`);
      return;
    }

    if (isReversal) {
      const movementsSnap = await getDocs(collection(db, "cash_bank_movements"));
      let foundActive = false;
      for (const d of movementsSnap.docs) {
        const mv = d.data();
        if (mv.journalEntryId === entryId && !mv.isReversed) {
          await updateDoc(doc(db, "cash_bank_movements", d.id), { isReversed: true });
          foundActive = true;
        }
      }
      if (!foundActive) {
        console.log(\`No active movements found to reverse for entry \${entryId}.\`);
        return;
      }
    }

    let appliedAny = false;

    const updateCashBox = async (boxId: string, diff: number, isDebit: boolean, lineAmount: number) => {
      const boxRef = doc(db, "cash_boxes", boxId);
      const boxSnap = await getDoc(boxRef);
      if (boxSnap.exists()) {
        const data = boxSnap.data();
        const previousBalance = Number(data.current_balance || 0);
        const newBalance = previousBalance + diff;
        await updateDoc(boxRef, { current_balance: newBalance });

        const mvId = \`\${entryId}_\${isDebit ? "debit" : "credit"}_CB_\${boxId}_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "cash_bank_movements", mvId), {
          id: mvId,
          journalEntryId: entryId,
          accountType: "Cash",
          cashBoxId: boxId,
          debitAmount: isDebit ? lineAmount : 0,
          creditAmount: !isDebit ? lineAmount : 0,
          previousBalance,
          newBalance,
          isReversed: isReversal,
          createdAt: new Date().toISOString(),
          createdBy: entry.createdBy || "System"
        });

        const txId = \`\${entryId}_\${isDebit ? "debit" : "credit"}_CB_TX_\${boxId}_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "cash_bank_transactions", txId), {
          id: txId,
          transactionNumber: \`TX-\${Math.floor(100000 + Math.random() * 900000)}\`,
          date: entry.date,
          source: "Journal Entry",
          journalEntryId: entryId,
          source_type: "Cash_Box",
          source_id: boxId,
          amount: lineAmount,
          currency: entry.currency || "SAR",
          type: diff > 0 ? "Deposit" : "Withdrawal",
          transactionDirection: diff > 0 ? "In" : "Out",
          balanceBefore: previousBalance,
          balanceAfter: newBalance,
          relatedModule: "Journal Entries",
          relatedRecordId: entryId,
          description: isReversal ? \`[إلغاء وعكس] \${entry.description}\` : entry.description,
          status: isReversal ? "Cancelled" : "Approved",
          createdBy: entry.createdBy || "System",
          createdAt: new Date().toISOString()
        });
        
        const auditId = \`cb_audit_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "audit_logs", auditId), {
          id: auditId,
          action: isReversal ? "Reverse Balance From Journal" : "Update Balance From Journal",
          module: "Cash & Bank",
          record_id: boxId,
          user_id: "System",
          user_name: entry.createdBy || "System",
          timestamp: new Date().toISOString(),
          details: \`Updated cash box \${data.code || boxId} balance from \${previousBalance} to \${newBalance} due to journal entry \${entryId}\`
        });

        appliedAny = true;
      }
    };

    const updateBankAccount = async (bankId: string, diff: number, isDebit: boolean, lineAmount: number) => {
      const bankRef = doc(db, "bank_accounts", bankId);
      const bankSnap = await getDoc(bankRef);
      if (bankSnap.exists()) {
        const data = bankSnap.data();
        const previousBalance = Number(data.current_balance || 0);
        const newBalance = previousBalance + diff;
        await updateDoc(bankRef, { current_balance: newBalance });

        const mvId = \`\${entryId}_\${isDebit ? "debit" : "credit"}_BA_\${bankId}_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "cash_bank_movements", mvId), {
          id: mvId,
          journalEntryId: entryId,
          accountType: "Bank",
          bankAccountId: bankId,
          debitAmount: isDebit ? lineAmount : 0,
          creditAmount: !isDebit ? lineAmount : 0,
          previousBalance,
          newBalance,
          isReversed: isReversal,
          createdAt: new Date().toISOString(),
          createdBy: entry.createdBy || "System"
        });

        const txId = \`\${entryId}_\${isDebit ? "debit" : "credit"}_BA_TX_\${bankId}_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "cash_bank_transactions", txId), {
          id: txId,
          transactionNumber: \`TX-\${Math.floor(100000 + Math.random() * 900000)}\`,
          date: entry.date,
          source: "Journal Entry",
          journalEntryId: entryId,
          source_type: "Bank_Account",
          source_id: bankId,
          amount: lineAmount,
          currency: entry.currency || "SAR",
          type: diff > 0 ? "Deposit" : "Withdrawal",
          transactionDirection: diff > 0 ? "In" : "Out",
          balanceBefore: previousBalance,
          balanceAfter: newBalance,
          relatedModule: "Journal Entries",
          relatedRecordId: entryId,
          description: isReversal ? \`[إلغاء وعكس] \${entry.description}\` : entry.description,
          status: isReversal ? "Cancelled" : "Approved",
          createdBy: entry.createdBy || "System",
          createdAt: new Date().toISOString()
        });

        const auditId = \`ba_audit_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;
        await setDoc(doc(db, "audit_logs", auditId), {
          id: auditId,
          action: isReversal ? "Reverse Balance From Journal" : "Update Balance From Journal",
          module: "Cash & Bank",
          record_id: bankId,
          user_id: "System",
          user_name: entry.createdBy || "System",
          timestamp: new Date().toISOString(),
          details: \`Updated bank account \${data.account_number || bankId} balance from \${previousBalance} to \${newBalance} due to journal entry \${entryId}\`
        });

        appliedAny = true;
      }
    };

    // 6. تمر على كل سطر
    for (const line of entryLines) {
      const debitVal = Number(line.debit || 0);
      const creditVal = Number(line.credit || 0);

      // 7. إذا accountType = Bank
      if (line.accountType === "Bank") {
        const bankId = line.bankAccountId;
        if (bankId) {
          if (debitVal > 0) {
            const diff = isReversal ? -debitVal : debitVal;
            await updateBankAccount(bankId, diff, !isReversal, debitVal);
          }
          if (creditVal > 0) {
            const diff = isReversal ? creditVal : -creditVal;
            await updateBankAccount(bankId, diff, isReversal, creditVal);
          }
        }
      } 
      // 8. إذا accountType = Cash
      else if (line.accountType === "Cash") {
        const boxId = line.cashBoxId;
        if (boxId) {
          if (debitVal > 0) {
            const diff = isReversal ? -debitVal : debitVal;
            await updateCashBox(boxId, diff, !isReversal, debitVal);
          }
          if (creditVal > 0) {
            const diff = isReversal ? creditVal : -creditVal;
            await updateCashBox(boxId, diff, isReversal, creditVal);
          }
        }
      }
    }

    // 11. حدث القيد
    if (appliedAny) {
      await updateDoc(entryRef, {
        cashBankApplied: !isReversal,
        cashBankAppliedAt: new Date().toISOString()
      });
    }

  } catch (err: any) {
    console.warn("Balances processing skipped due to error:", err.message);
  }
}`;

const newServerStr = serverStr.replace(regex, replacement);

if (serverStr === newServerStr) {
  console.log("No match found or no changes made!");
} else {
  fs.writeFileSync('server.ts', newServerStr, 'utf-8');
  console.log("Replaced applyJournalToCashBank successfully.");
}

