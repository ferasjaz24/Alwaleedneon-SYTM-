const fs = require('fs');
let code = fs.readFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', 'utf8');

const newFilteredLogic = `
  const isDocumentExpired = (emp: Employee) => {
    const isExpired = (dateString?: string) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      return !isNaN(d.getTime()) && d < new Date();
    };
    return isExpired(emp.iqamaExpiryDate) || isExpired(emp.passportExpiryDate) || isExpired(emp.insuranceExpiryDate) || isExpired(emp.contractExpiry);
  };

  const filteredEmployees = React.useMemo(() => {
    let result = employees;

    if (searchQuery.trim()) {
      const searchRes = searchEmployeesIndexed(searchQuery, result);
      result = searchRes.results;
    }

    if (filterNationality !== "all") {
      result = result.filter(emp => emp.nationality === filterNationality);
    }

    if (filterExpiredDocs === "expired") {
      result = result.filter(emp => isDocumentExpired(emp));
    } else if (filterExpiredDocs === "valid") {
      result = result.filter(emp => !isDocumentExpired(emp));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.dateOfJoining || 0).getTime() - new Date(b.dateOfJoining || 0).getTime();
      } else if (sortBy === "newest") {
        return new Date(b.dateOfJoining || 0).getTime() - new Date(a.dateOfJoining || 0).getTime();
      } else if (sortBy === "age_oldest") {
        return new Date(a.dateOfBirth || 0).getTime() - new Date(b.dateOfBirth || 0).getTime();
      } else if (sortBy === "nationality") {
        return (a.nationality || "").localeCompare(b.nationality || "");
      }
      return 0;
    });

    return result;
  }, [searchQuery, employees, filterNationality, filterExpiredDocs, sortBy]);
`;

code = code.replace(/  const filteredEmployees = React\.useMemo\(\(\) => \{\n    if \(\!searchQuery\.trim\(\)\) return employees;\n    const \{ results \} = searchEmployeesIndexed\(searchQuery, employees\);\n    return results;\n  \}, \[searchQuery, employees\]\);/g, newFilteredLogic);

fs.writeFileSync('src/components/hr/HrEmployeeDirectoryTab.tsx', code);
