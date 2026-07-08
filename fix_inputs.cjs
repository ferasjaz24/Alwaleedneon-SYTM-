const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DeliveryNoteBuilder.tsx', 'utf8');

code = code.replace(
  /<input value={deliveryNoteNo} onChange={e => setDeliveryNoteNo\(e.target.value\)} id="deliveryNoteNo" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setDeliveryNoteNo(e.currentTarget.innerText)} id="deliveryNoteNo">{deliveryNoteNo}</div>'
);

code = code.replace(
  /<input type="text" value={deliveryDate} onChange={e => setDeliveryDate\(e.target.value\)} id="deliveryDate" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setDeliveryDate(e.currentTarget.innerText)} id="deliveryDate">{deliveryDate}</div>'
);

code = code.replace(
  /<input value={clientName} onChange={e => setClientName\(e.target.value\)} id="clientName" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setClientName(e.currentTarget.innerText)} id="clientName">{clientName}</div>'
);

code = code.replace(
  /<input value={projectName} onChange={e => setProjectName\(e.target.value\)} id="projectName" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setProjectName(e.currentTarget.innerText)} id="projectName">{projectName}</div>'
);

code = code.replace(
  /<input value={location} onChange={e => setLocation\(e.target.value\)} placeholder="____________________" id="location" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setLocation(e.currentTarget.innerText)} id="location">{location || "____________________"}</div>'
);

code = code.replace(
  /<input value={preparedBy} onChange={e => setPreparedBy\(e.target.value\)} id="preparedBy" \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setPreparedBy(e.currentTarget.innerText)} id="preparedBy">{preparedBy}</div>'
);

code = code.replace(
  /<textarea id="deliveryNotes" value={notes} onChange={e => setNotes\(e.target.value\)} \/>/g,
  '<div contentEditable suppressContentEditableWarning onBlur={e => setNotes(e.currentTarget.innerText)} id="deliveryNotes">{notes}</div>'
);

// We need to add some style to make these divs behave like inputs visually if needed, 
// but they are already inside cells that provide the background.
// Just add outline-none and width full.
code = code.replace(/id="deliveryNoteNo"/g, 'id="deliveryNoteNo" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="deliveryDate"/g, 'id="deliveryDate" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="clientName"/g, 'id="clientName" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="projectName"/g, 'id="projectName" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="location"/g, 'id="location" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="preparedBy"/g, 'id="preparedBy" style={{ flex: 1, outline: "none", minWidth: "100px" }}');
code = code.replace(/id="deliveryNotes"/g, 'id="deliveryNotes" style={{ flex: 1, outline: "none", minHeight: "12mm", width: "100%", whiteSpace: "pre-wrap" }}');

fs.writeFileSync('src/components/sales/DeliveryNoteBuilder.tsx', code);
