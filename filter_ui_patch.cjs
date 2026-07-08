const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const filterUI = `
      {/* 2. ADVANCED SEARCH & FILTER BAR */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3" dir="rtl">
        <div className="relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={
              lang === "ar"
                ? "ابحث هنا باسم الموظف، المسمى الوظيفي، أو رقم الإقامة / الهوية..."
                : "Search by name, role, or ID..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="newest">{lang === "ar" ? "الأحدث انضماماً" : "Newest Joined"}</option>
            <option value="oldest">{lang === "ar" ? "الأقدم للأحدث" : "Oldest to Newest"}</option>
            <option value="age_oldest">{lang === "ar" ? "الأكبر عمراً" : "Oldest (Age)"}</option>
            <option value="nationality">{lang === "ar" ? "حسب الجنسية" : "By Nationality"}</option>
          </select>

          {/* Document Status Filter */}
          <select
            value={filterExpiredDocs}
            onChange={(e) => setFilterExpiredDocs(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="all">{lang === "ar" ? "جميع الوثائق" : "All Documents"}</option>
            <option value="expired">{lang === "ar" ? "وثائق منتهية (إقامة، عقد، الخ)" : "Expired Documents"}</option>
            <option value="valid">{lang === "ar" ? "وثائق صالحة" : "Valid Documents"}</option>
          </select>

          {/* Nationality Filter */}
          <select
            value={filterNationality}
            onChange={(e) => setFilterNationality(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#0072BC] cursor-pointer min-w-[150px]"
          >
            <option value="all">{lang === "ar" ? "جميع الجنسيات" : "All Nationalities"}</option>
            {Array.from(new Set(employees.map(e => e.nationality).filter(Boolean))).sort().map(nat => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>
      </div>
`;

const oldSearchBlock = /\{\/\* 2\. LIVE SEARCH BAR \*\/\}.*?(?=\{\/\* 3\. SIMPLIFIED DIRECTORY RASTER CARD \*\/\})/s;
code = code.replace(oldSearchBlock, filterUI + "\n      ");

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
