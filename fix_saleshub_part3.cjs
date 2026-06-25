const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

const regexCity = /<div>\s*<label className="block mb-1\.5">المدينة<\/label>\s*<input\s*type="text"\s*value=\{editingClient\?\.city \|\| ''\}\s*onChange=\{e => setEditingClient\(\{\.\.\.editingClient, city: e\.target\.value\}\)\}\s*className="w-full p-2\.5 border border-slate-300 rounded-xl outline-none focus:border-\[#0072BC\]"\s*placeholder="مكة المكرمة\.\.\."\s*\/>\s*<\/div>/g;

const newCountryCityBlock = `
                {/* Country Selection */}
                <div className="relative">
                  <label className="block mb-1.5">دولة العميل</label>
                  <div 
                    className="w-full p-2.5 border border-slate-300 rounded-xl cursor-pointer bg-white flex justify-between items-center"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <span>
                      {countrySearch ? countrySearch : (editingClient?.country ? arabCountries.find(c => c.name === editingClient.country)?.flag + ' ' + editingClient.country : 'اختر الدولة...')}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                      <div className="p-2 border-b">
                        <input 
                          type="text" 
                          placeholder="ابحث عن دولة..." 
                          className="w-full p-2 bg-slate-50 border rounded-lg outline-none"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {arabCountries.filter(c => c.name.includes(countrySearch)).map(country => (
                          <div 
                            key={country.name}
                            className="p-2 hover:bg-slate-50 cursor-pointer rounded-lg flex items-center gap-2"
                            onClick={() => {
                               setEditingClient({...editingClient, country: country.name, region: '', city: ''});
                               setShowCountryDropdown(false);
                               setCountrySearch('');
                            }}
                          >
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Region if KSA */}
                {editingClient?.country === 'السعودية' && (
                  <div>
                    <label className="block mb-1.5">اقليم العميل</label>
                    <select 
                      value={editingClient?.region || ''}
                      onChange={e => setEditingClient({...editingClient, region: e.target.value, city: ''})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    >
                      <option value="">اختر الإقليم...</option>
                      {saudiRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* City based on logic */}
                <div>
                  <label className="block mb-1.5">المدينة / المنطقة</label>
                  {editingClient?.country === 'السعودية' && editingClient?.region ? (
                    <select 
                      value={editingClient?.city || ''}
                      onChange={e => setEditingClient({...editingClient, city: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                    >
                      <option value="">اختر المدينة...</option>
                      {saudiCities[editingClient?.region as keyof typeof saudiCities]?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={editingClient?.city || ''}
                      onChange={e => setEditingClient({...editingClient, city: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#0072BC]"
                      placeholder={editingClient?.country === 'السعودية' ? 'اختر الإقليم لتظهر المدن...' : 'اكتب اسم المدينة...'}
                      disabled={editingClient?.country === 'السعودية' && !editingClient?.region}
                    />
                  )}
                </div>
`;

c = c.replace(regexCity, newCountryCityBlock);

fs.writeFileSync(f, c, 'utf8');
