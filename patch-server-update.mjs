import fs from 'fs';
const patchFile = (file, patches) => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf-8');
  patches.forEach(([str, replace]) => { c = c.split(str).join(replace); });
  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
};

patchFile('server.ts', [
  [
    `      if (alreadyProcessed) {
        console.log(\`Balances for approved journal entry \${entryId} already processed.\`);
        return;
      }
    }`,
    `      if (alreadyProcessed || entry.cashBankApplied) {
        console.log(\`Balances for approved journal entry \${entryId} already processed.\`);
        return;
      }
    }`
  ],
  [
    `    } catch (err: any) {
      console.warn("Balances processing skipped due to error:", err.message);
    }
  }`,
    `      // Update Journal Entry
      if (!isReversal) {
        await updateDoc(doc(db, "journal_entries", entryId), {
          cashBankApplied: true,
          cashBankAppliedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, "journal_entries", entryId), {
          cashBankApplied: false,
          cashBankAppliedAt: null,
          isReversed: true,
          reversedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn("Balances processing skipped due to error:", err.message);
    }
  }`
  ]
]);

