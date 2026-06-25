import fs from 'fs';

let typesCode = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export interface ModulePermissions {
  enabled: boolean;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  exportPdf: boolean;
  exportExcel: boolean;
  print: boolean;
  deleteSensitive: boolean;
  viewCosts: boolean;
}

export interface UserPermissions {
  moduleAccess: {
    hr: ModulePermissions;
    sales: ModulePermissions;
    finance: ModulePermissions;
    production: ModulePermissions;
    procurement: ModulePermissions;
    reports: ModulePermissions;
    settings: ModulePermissions;
  };
  // Legacy
  modules?: any;
  actions?: any;
}
`;

typesCode = typesCode.replace(
  /export interface UserPermissions \{[\s\S]*?viewCosts:[^\n]*\n  \};\n\}/m,
  newTypes.trim()
);

fs.writeFileSync('src/types.ts', typesCode, 'utf8');
