import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import MainDashboard')) {
  content = content.replace(
    'import AISettingsModal from "./components/AISettingsModal";',
    'import AISettingsModal from "./components/AISettingsModal";\\nimport MainDashboard from "./components/MainDashboard";'
  );
}

const startMarker = '{/* TAB A: GLOBAL DYNAMIC DASHBOARD */}';
const endMarker = '{/* TAB B: ADVANCED HUMAN RESOURCES DIVISION */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const codeToInject = "            {/* TAB A: GLOBAL DYNAMIC DASHBOARD */}\\n" +
"            {activeTab === 'dashboard' && (\\n" +
"              <div id='content-tab-dashboard' className='space-y-6'>\\n" +
"                 <MainDashboard user={user} lang={lang} onNavigate={(tab, subTab) => {\\n" +
"                   setActiveTab(tab as any);\\n" +
"                   if (subTab) {\\n" +
"                     if (tab === 'hr') setActiveHrSubTab(subTab);\\n" +
"                     else if (tab === 'sales') setActiveSalesSubTab(subTab);\\n" +
"                     else if (tab === 'production') setActiveProductionSubTab(subTab);\\n" +
"                     else if (tab === 'warehouse') setActiveWarehouseSubTab(subTab);\\n" +
"                   }\\n" +
"                 }} />\\n" +
"              </div>\\n" +
"            )}\\n" +
"\\n" +
"            ";

  content = content.substring(0, startIndex) + codeToInject + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('updated App.tsx');
} else {
  console.log('could not find markers');
}
