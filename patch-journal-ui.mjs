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
    '<th className="p-3 w-10 text-center">#</th>',
    '<th className="p-3 w-10 text-center">#</th>\n                          <th className="p-3 min-w-[150px]">نوع الحساب (Account Type) <span className="text-rose-500">*</span></th>'
  ],
  [
    `                            <td className="p-3">
                              <select
                                disabled={isApproved}
                                value={line.accountName}`,
    `                            <td className="p-3">
                              <select
                                disabled={isApproved}
                                value={line.accountType}
                                onChange={(e) => {
                                  const newLines = [...entryForm.lines];
                                  newLines[idx].accountType = e.target.value;
                                  newLines[idx].cashBoxId = "";
                                  newLines[idx].bankAccountId = "";
                                  setEntryForm({ ...entryForm, lines: newLines });
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:bg-slate-50 disabled:text-slate-500"
                              >
                                <option value="">اختر النوع...</option>
                                <option value="Bank">Bank</option>
                                <option value="Cash">Cash</option>
                                <option value="Revenue">Revenue</option>
                                <option value="Expense">Expense</option>
                                <option value="Customer">Customer</option>
                                <option value="Supplier">Supplier</option>
                                <option value="VAT Payable">VAT Payable</option>
                                <option value="VAT Input">VAT Input</option>
                                <option value="Equity">Equity</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                disabled={isApproved}
                                placeholder="اسم الحساب"
                                value={line.accountName}`
  ],
  [
    `                                onChange={(e) => {
                                  const newLines = [...entryForm.lines];
                                  newLines[idx].accountName = e.target.value;
                                  newLines[idx].accountType = e.target.value === "الصندوق" ? "Cash" : e.target.value === "البنك" ? "Bank" : "";
                                  newLines[idx].cashBoxId = "";
                                  newLines[idx].bankAccountId = "";
                                  setEntryForm({ ...entryForm, lines: newLines });
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:bg-slate-50 disabled:text-slate-500"
                              >
                                <option value="">اختر الحساب...</option>
                                {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </td>`,
    `                                onChange={(e) => {
                                  const newLines = [...entryForm.lines];
                                  newLines[idx].accountName = e.target.value;
                                  setEntryForm({ ...entryForm, lines: newLines });
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:bg-slate-50 disabled:text-slate-500"
                              />
                            </td>`
  ],
  [
    `                            <td className="p-3">
                              {line.accountName === "الصندوق" ? (`,
    `                            <td className="p-3">
                              {line.accountType === "Cash" ? (`
  ],
  [
    `}
                                </select>
                              ) : line.accountName === "البنك" ? (
                                <select`,
    `}
                                </select>
                              ) : line.accountType === "Bank" ? (
                                <select`
  ]
]);

