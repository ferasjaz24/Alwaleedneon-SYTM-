import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const updatedCollections = `const collectionsWithUsername = [
          "projects", "customers", "installation_requests", "installation_orders", 
          "maintenance_tickets", "salaries", "cash_movements", "warehouse_items",
          "sales_quotations", "clients", "vacations", "deductions", "activity_logs", "production_orders"
        ];`;

content = content.replace(
  /const collectionsWithUsername = \[[\s\S]*?\];/,
  updatedCollections
);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('server collections updated');
