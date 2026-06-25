const fs = require('fs');
const path = require('path');

let typesPath = path.join(__dirname, 'src/types.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

const clientInterface = `
export interface Client {
  id: string;
  clientName: string;
  companyName: string;
  mobile: string;
  email: string;
  city: string;
  crNumber: string;
  taxExempt: boolean;
  taxNumber: string;
  classification: string;
  dateCreated: string;
  status?: string;
  isDraft?: boolean;
}
`;

if(!typesContent.includes('export interface Client')) {
    typesContent += clientInterface;
    fs.writeFileSync(typesPath, typesContent, 'utf8');
    console.log('Added Client interface to types.ts');
}
