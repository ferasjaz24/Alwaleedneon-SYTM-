import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { DocumentHeader, DocumentFooter } from '../../utils/PrintSharedComponents';

interface DeliveryNoteBuilderProps {
  quoteId: string;
  quotes: any[];
  clients: any[];
  user: User;
  onSaveDraft: (docContent: string) => void;
}

export default function DeliveryNoteBuilder({ quoteId, quotes, clients, user, onSaveDraft }: DeliveryNoteBuilderProps) {
  const [deliveryNoteNo, setDeliveryNoteNo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [preparedBy, setPreparedBy] = useState('Fonoun Alwaleed Industrial Co.');
  const [notes, setNotes] = useState('The above items were delivered as listed. Quantity and physical condition are to be confirmed by the receiver at the time of handover.');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Generate Delivery Note No
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const randomSeq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    setDeliveryNoteNo(`DN-${yyyy}${mm}${dd}-${randomSeq}`);
    setDeliveryDate(`${dd} / ${mm} / ${yyyy}`);

    if (quoteId && quotes.length > 0) {
      const q = quotes.find(q => q.id === quoteId);
      if (q) {
        setClientName(q.clientName || '');
        setProjectName(q.projectName || q.quotationNumber || '');
        if (q.items) {
          const parsedItems = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;
          setItems(parsedItems.map((item: any, idx: number) => ({
            id: idx + 1,
            signType: item.itemCode || item.signType || `S-${idx + 1}`,
            description: item.description || item.name || '',
            qty: item.quantity || item.qty || 1,
            unit: item.unit || 'Nos.'
          })));
        }
      }
    }
  }, [quoteId, quotes]);

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div id="printable-sales-letter-container">
      <style>{`
        .en-text { font-family: Arial, Helvetica, sans-serif !important; direction: ltr !important; }
        .delivery-note-page {
          
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          position: relative;
        }

        .dn-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 32mm;
        }

        .company-block {
          text-align: center;
          flex: 1;
        }

        .company-ar {
          font-size: 22px;
          font-weight: 700;
          color: #777;
          letter-spacing: 1px;
          margin-bottom: 4px;
          font-family: 'EnglishNumbersOnly', 'GE SS Two', 'Tajawal', sans-serif !important;
        }

        .company-en {
          font-size: 13px;
          font-weight: 700;
          color: #555;
          letter-spacing: 2px;
        }

        .logo-block {
          width: 55mm;
          text-align: right;
        }

        .dn-logo {
          max-width: 52mm;
          max-height: 24mm;
          object-fit: contain;
        }

        .header-line {
          border-bottom: 2px solid #2e6f9e;
          margin: 0 0 10mm 0;
        }

        .dn-title-section {
          text-align: center;
          margin-top: 4mm;
          margin-bottom: 2mm;
        }

        .dn-title-section h1 {
          margin: 0;
          color: #0068a8;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .dn-title-section p {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .dn-info-table {
          width: 100%;
          border: 1px solid #9da9b5;
          margin-top: 2mm;
          margin-bottom: 5mm;
        }

        .dn-info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #9da9b5;
        }

        .dn-info-row:last-child {
          border-bottom: none;
        }

        .dn-info-cell {
          min-height: 8mm;
          padding: 5px 9px;
          background: #edf3f8;
          border-right: 1px solid #9da9b5;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .dn-info-cell:last-child {
          border-right: none;
          border-left: 1px solid #9da9b5; /* ensure middle border in ltr */
        }

        .dn-info-cell input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          flex: 1;
          font-family: inherit;
          color: #111;
        }

        .dn-items-section h2 {
          margin: 0 0 2mm 0;
          font-size: 20px;
          font-weight: 800;
        }

        .dn-items-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12.5px;
        }

        .dn-items-table th {
          background: #4d4d4d;
          color: #fff;
          border: 1px solid #333;
          padding: 4px 5px;
          text-align: center;
          font-weight: 700;
        }

        .dn-items-table td {
          border: 1px solid #333;
          padding: 3px 5px;
          min-height: 6mm;
          vertical-align: middle;
        }

        .dn-items-table tbody tr:nth-child(even) {
          background: #f3f7fb;
        }

        .dn-items-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }

        .col-item-no { width: 10%; }
        .col-sign-type { width: 14%; }
        .col-description { width: 52%; }
        .col-qty { width: 12%; }
        .col-unit { width: 12%; }

        .dn-items-table td:nth-child(1),
        .dn-items-table td:nth-child(2),
        .dn-items-table td:nth-child(4),
        .dn-items-table td:nth-child(5) {
          text-align: center;
        }

        .dn-notes {
          margin-top: 4mm;
          font-size: 12.5px;
          display: flex;
          align-items: flex-start;
          gap: 5px;
        }

        .dn-notes textarea {
          border: none;
          outline: none;
          resize: none;
          width: 100%;
          min-height: 12mm;
          font-family: inherit;
          font-size: 12.5px;
          line-height: 1.3;
          background: transparent;
        }

        .dn-signature-section {
          margin-top: 3mm;
        }

        .dn-signature-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 13px;
        }

        .dn-signature-table th {
          background: #e6f0fa;
          border: 1px solid #9da9b5;
          padding: 10px 5px;
          text-align: center;
          font-weight: 500;
        }

        .dn-signature-table td {
          border: 1px solid #9da9b5;
          text-align: center;
          height: 14mm;
          vertical-align: bottom;
          padding: 5px;
        }

        .signature-empty-row td {
          height: 14mm;
        }

        .signature-line-row td {
          height: 8mm;
        }

        .dn-footer {
          position: absolute;
          left: 15mm;
          right: 15mm;
          bottom: 10mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid #e8eef4;
          padding-top: 3mm;
          font-size: 9px;
          color: #52708c;
        }

        .footer-left,
        .footer-right {
          width: 48%;
          line-height: 1.5;
        }

        .footer-right {
          text-align: right;
        }

        @media print {
          body {
            margin: 0;
            background: #fff;
          }
          .delivery-note-page {
            margin: 0;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            box-shadow: none;
            page-break-after: always;
          }
          input,
          textarea {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }

        @page { size: A4 portrait; margin: 10mm; }
      `}</style>
      <div className="delivery-note-page relative mx-auto bg-white shadow print:shadow-none print:m-0 print:p-0 w-[210mm] min-h-[297mm] print:!w-full print:!h-auto print:!min-h-full p-[10mm] overflow-hidden" id="deliveryNotePrintArea" dir="ltr" style={{ direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Header */}
        <DocumentHeader />

        {/* Title */}
        <section className="dn-title-section">
          <h1>DELIVERY NOTE</h1>
          <p>Signage Items Delivery - Fonoun Alwaleed Industrial Co.</p>
        </section>

        {/* Info Table */}
        <section className="dn-info-table">
          <div className="dn-info-row">
            <div className="dn-info-cell" style={{ borderRight: '1px solid #9da9b5' }}>
              <strong>Delivery Note No.:</strong>
              <div contentEditable suppressContentEditableWarning className="en-text" dir="ltr" onBlur={e => setDeliveryNoteNo(e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))} id="deliveryNoteNo" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{deliveryNoteNo}</div>
            </div>
            <div className="dn-info-cell">
              <strong>Date:</strong>
              <div contentEditable suppressContentEditableWarning className="en-text" dir="ltr" onBlur={e => setDeliveryDate(e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))} id="deliveryDate" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{deliveryDate}</div>
            </div>
          </div>

          <div className="dn-info-row">
            <div className="dn-info-cell" style={{ borderRight: '1px solid #9da9b5' }}>
              <strong>Delivered To:</strong>
              <div contentEditable suppressContentEditableWarning onBlur={e => setClientName(e.currentTarget.innerText)} id="clientName" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{clientName}</div>
            </div>
            <div className="dn-info-cell">
              <strong>Project / Site:</strong>
              <div contentEditable suppressContentEditableWarning onBlur={e => setProjectName(e.currentTarget.innerText)} id="projectName" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{projectName}</div>
            </div>
          </div>

          <div className="dn-info-row">
            <div className="dn-info-cell" style={{ borderRight: '1px solid #9da9b5' }}>
              <strong>Location:</strong>
              <div contentEditable suppressContentEditableWarning onBlur={e => setLocation(e.currentTarget.innerText)} id="location" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{location || "____________________"}</div>
            </div>
            <div className="dn-info-cell">
              <strong>Prepared By:</strong>
              <div contentEditable suppressContentEditableWarning onBlur={e => setPreparedBy(e.currentTarget.innerText)} id="preparedBy" style={{ flex: 1, outline: "none", minWidth: "100px" }}>{preparedBy}</div>
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="dn-items-section">
          <h2>Delivered Items</h2>

          <table className="dn-items-table">
            <thead>
              <tr>
                <th className="col-item-no">Item No.</th>
                <th className="col-sign-type">Sign Types</th>
                <th className="col-description">Description</th>
                <th className="col-qty">QTY</th>
                <th className="col-unit">Unit</th>
              </tr>
            </thead>

            <tbody id="deliveryItemsBody">
              {items.length === 0 ? (
                <tr>
                  <td contentEditable suppressContentEditableWarning>1</td>
                  <td contentEditable suppressContentEditableWarning>A1</td>
                  <td contentEditable suppressContentEditableWarning>Main ID (High Level)</td>
                  <td contentEditable suppressContentEditableWarning>2</td>
                  <td contentEditable suppressContentEditableWarning>Nos.</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td contentEditable suppressContentEditableWarning onBlur={(e) => updateItem(idx, 'id', e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))}>{item.id}</td>
                    <td contentEditable suppressContentEditableWarning onBlur={(e) => updateItem(idx, 'signType', e.currentTarget.innerText)}>{item.signType}</td>
                    <td contentEditable suppressContentEditableWarning onBlur={(e) => updateItem(idx, 'description', e.currentTarget.innerText)}>{item.description}</td>
                    <td contentEditable suppressContentEditableWarning onBlur={(e) => updateItem(idx, 'qty', e.currentTarget.innerText.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()))}>{item.qty}</td>
                    <td contentEditable suppressContentEditableWarning onBlur={(e) => updateItem(idx, 'unit', e.currentTarget.innerText)}>{item.unit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <button 
             className="no-print mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs" 
             onClick={() => setItems([...items, { id: items.length + 1, signType: '', description: '', qty: 1, unit: 'Nos.' }])}
          >
             + Add Row
          </button>
        </section>

        {/* Notes */}
        <section className="dn-notes">
          <strong>Notes:</strong>
          <div contentEditable suppressContentEditableWarning onBlur={e => setNotes(e.currentTarget.innerText)} id="deliveryNotes" style={{ flex: 1, outline: "none", minHeight: "10mm", width: "100%", whiteSpace: "pre-wrap" }}>{notes}</div>
        </section>

        {/* Signature */}
        <section className="dn-signature-section">
          <table className="dn-signature-table">
            <thead>
              <tr>
                <th>Receiver Name</th>
                <th>Signature</th>
                <th>Date</th>
                <th>Company Stamp</th>
              </tr>
            </thead>
            <tbody>
              <tr className="signature-empty-row">
                <td contentEditable suppressContentEditableWarning></td>
                <td contentEditable suppressContentEditableWarning></td>
                <td contentEditable suppressContentEditableWarning></td>
                <td contentEditable suppressContentEditableWarning></td>
              </tr>
              <tr className="signature-line-row">
                <td>____________________</td>
                <td>____________________</td>
                <td>____ / ____ / ______</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="mt-auto relative z-0"><DocumentFooter /></div>
      </div>
    </div>
  );
}
