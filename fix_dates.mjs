import fs from 'fs';

let content = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const safeFormatDate = `
  const safeFormatDate = (d: any) => {
    if (!d) return '-';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toISOString().split('T')[0];
  };
`;

content = content.replace(
  "  const filteredSales = salesQuotations.filter(sq => filterByDate(sq.date || sq.createdAt || sq.lastUpdated));",
  safeFormatDate + "\n  const filteredSales = salesQuotations.filter(sq => filterByDate(sq.date || sq.createdAt || sq.lastUpdated));"
);

content = content.replace(
  "historyLogs.sort((a,b) => new Date(b.date || b.timestamp).getTime() - new Date(a.date || a.timestamp).getTime());",
  "historyLogs.sort((a,b) => (new Date(b.date || b.timestamp).getTime() || 0) - (new Date(a.date || a.timestamp).getTime() || 0));"
);

content = content.replace(
  "{new Date(h.date || h.timestamp).toISOString().split('T')[0]}",
  "{safeFormatDate(h.date || h.timestamp)}"
);

fs.writeFileSync('src/components/MainDashboard.tsx', content, 'utf8');
console.log('Fixed dates');
