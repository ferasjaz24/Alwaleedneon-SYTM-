const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const filterStates = `  const [searchQuery, setSearchQuery] = useState("");
  const [filterNationality, setFilterNationality] = useState("all");
  const [filterExpiredDocs, setFilterExpiredDocs] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
`;

code = code.replace('  const [searchQuery, setSearchQuery] = useState("");', filterStates);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
