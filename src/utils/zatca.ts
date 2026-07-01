export function generateZatcaQR(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  invoiceTotal: string,
  vatTotal: string
): string {
  const getTLV = (tag: number, value: string): Uint8Array => {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    const result = new Uint8Array(2 + valueBytes.length);
    result[0] = tag;
    result[1] = valueBytes.length;
    result.set(valueBytes, 2);
    return result;
  };

  const tlv1 = getTLV(1, sellerName || '');
  const tlv2 = getTLV(2, vatNumber || '');
  const tlv3 = getTLV(3, timestamp || '');
  const tlv4 = getTLV(4, invoiceTotal || '');
  const tlv5 = getTLV(5, vatTotal || '');

  const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  result.set(tlv1, offset); offset += tlv1.length;
  result.set(tlv2, offset); offset += tlv2.length;
  result.set(tlv3, offset); offset += tlv3.length;
  result.set(tlv4, offset); offset += tlv4.length;
  result.set(tlv5, offset);

  let binary = '';
  for (let i = 0; i < result.length; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
}

export function generateZatcaXML(invoice: any, sellerDetails: any, buyerDetails: any): string {
  const uuid = crypto.randomUUID();
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.id}</cbc:ID>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0111010">${buyerDetails?.taxNumber ? '388' : '388'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${sellerDetails?.crNumber || "1010000000"}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${sellerDetails?.address || "Street"}</cbc:StreetName>
        <cbc:CityName>${sellerDetails?.city || "Riyadh"}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${sellerDetails?.taxNumber || "300000000000003"}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${sellerDetails?.name || "Company"}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${buyerDetails?.address || "Client Address"}</cbc:StreetName>
        <cbc:CityName>${buyerDetails?.city || "Riyadh"}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${buyerDetails?.taxNumber || ""}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.partyName || "Client"}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${invoice.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${invoice.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${invoice.totalAmount}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${invoice.discount}</cbc:AllowanceTotalAmount>
    <cbc:PrepaidAmount currencyID="SAR">${invoice.paidAmount}</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="SAR">${invoice.remainingAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
  return xmlContent;
}