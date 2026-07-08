const fs = require('fs');
let code = fs.readFileSync('src/components/finance/MonthlyPayrollRuns.tsx', 'utf8');

// Add the state
code = code.replace(/const \[bankFilter, setBankFilter\] = useState\("All"\);/,
  `const [bankFilter, setBankFilter] = useState("All");
  const [showDetailedDeductions, setShowDetailedDeductions] = useState(false);`
);

// Replace the table headers for deductions
const oldHeaders = `<th className="py-4 px-3 text-right text-rose-600">خصم السلف</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم الغياب</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم التأخير</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصم الجزاءات</th>
                          <th className="py-4 px-3 text-right text-rose-600">تأمينات GOSI</th>
                          <th className="py-4 px-3 text-right text-rose-600">خصومات أخرى</th>`;
const newHeaders = `{showDetailedDeductions && (
                            <>
                              <th className="py-4 px-3 text-right text-rose-600">خصم السلف</th>
                              <th className="py-4 px-3 text-right text-rose-600">خصم الغياب</th>
                              <th className="py-4 px-3 text-right text-rose-600">خصم التأخير</th>
                              <th className="py-4 px-3 text-right text-rose-600">خصم الجزاءات</th>
                              <th className="py-4 px-3 text-right text-rose-600">تأمينات GOSI</th>
                            </>
                          )}
                          <th className="py-4 px-3 text-right text-rose-600">
                            <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setShowDetailedDeductions(!showDetailedDeductions)}>
                              خصومات أخرى
                              <span className="text-[10px] bg-rose-100 text-rose-700 rounded-full w-4 h-4 flex items-center justify-center">
                                {showDetailedDeductions ? '◀' : '▶'}
                              </span>
                            </div>
                          </th>`;

code = code.replace(oldHeaders, newHeaders);

// Now for the columns.
const loansStart = `<!-- LOANS DEDUCTION -->`; // Note: in source it's {/* LOANS DEDUCTION */} but replace might be tricky with regex. Let's just use replace with string search.

fs.writeFileSync('src/components/finance/MonthlyPayrollRuns.tsx', code);
