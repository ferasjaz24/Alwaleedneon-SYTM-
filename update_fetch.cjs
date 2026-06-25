let fs = require("fs");
let c = fs.readFileSync("src/components/SalesHub.tsx", "utf8");

c = c.replace(
  "const [clients, setClients] = useState<Client[]>([]);",
  "const [clients, setClients] = useState<Client[]>([]);\n  const [salesQuotes, setSalesQuotes] = useState<any[]>([]);"
);

c = c.replace(
  "const res = await fetch('/api/clients');",
  "const [res, sysRes] = await Promise.all([fetch('/api/clients'), fetch('/api/sales_quotations')]);"
);

let findBlock = `if (res.ok) {
        const data = await res.json();
        setClients(data);
      }`;
let replaceBlock = `if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
      if (sysRes && sysRes.ok) {
        const sqData = await sysRes.json();
        setSalesQuotes(sqData);
      }`;
c = c.replace(findBlock, replaceBlock);

// Now change `quotations` to `salesQuotes` inside getClientStatus, deleteClient checks, and printClientDetails
let oldGetClientStatus = `const clientQuotes = quotations.filter(q => (q.clientId === clientId || q.clientName === getClientName(clientId)) && q.status === 'معتمد');`;
let newGetClientStatus = `const clientQuotes = salesQuotes.filter(q => (q.clientId === clientId || q.clientName === getClientName(clientId)) && q.status === 'معتمد');`;
c = c.replace(oldGetClientStatus, newGetClientStatus);

// In handleDeleteClient
let oldHandleDeleteClient = `const isLinked = quotations.some(q => q.clientId === id || q.clientName === getClientName(id));`;
let newHandleDeleteClient = `const isLinked = salesQuotes.some(q => q.clientId === id || q.clientName === getClientName(id));`;
c = c.replace(oldHandleDeleteClient, newHandleDeleteClient);

// In printClientDetails
let oldPrintQuotes = `const clientQuotes = quotations.filter(q => (q.clientId === client.id || q.clientName === client.clientName) && q.status === 'معتمد');`;
let newPrintQuotes = `const clientQuotes = salesQuotes.filter(q => (q.clientId === client.id || q.clientName === client.clientName) && q.status === 'معتمد');`;
c = c.replace(oldPrintQuotes, newPrintQuotes);

// Replace properties in `printClientDetails` loop:
// We changed:
// `q.id` to `q.quotationNumber || q.id` -> but it's now salesQuotes, so it's correct.
// wait, we did this already in update_fixes.cjs. Let's make sure:

fs.writeFileSync("src/components/SalesHub.tsx", c);
