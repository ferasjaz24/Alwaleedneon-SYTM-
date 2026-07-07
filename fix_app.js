const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `                                </div>
                                <div>
                                  <label className="block mb-1 font-bold text-slate-300">
                                    {lang === "ar"
                                  {lang === "ar"`;

const replace = `                                </div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-250/60 space-y-3">
                                <p className="font-bold text-xs text-[#0072BC]">
                                  📦{" "}
                                  {lang === "ar"`;

content = content.replace(search, replace);
fs.writeFileSync('src/App.tsx', content);
