const fs = require('fs');
const path = require('path');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Plus, Filter, ArrowRight, Save, CheckCircle, Eye, Copy, 
  Trash2, Edit2, Download, Check, AlertCircle 
} from 'lucide-react';
import { Client, WarehouseItem } from '../types';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';
import { numberToArabicWords } from '../utils/Tafqeet'; 

// We will implement Tafqeet below to be safe if not exists.

export interface SalesQuoteItem {
  id: string; // unique row id
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPct: number;
  internalNotes: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  financialYear: string;
  quoteDate: string; // YYYY-MM-DD
  quoteToType: 'client' | 'initiative';
  clientId: string; 
  clientName: string;
  projectName: string;
  orderType: 'مبيعات' | 'صيانة';
  currency: string;
  items: SalesQuoteItem[];
  status: 'مسودة' | 'نشط' | 'معتمد';
  termsText: string;
  dateCreated: string;
  lastUpdated: string;
}

const tafqeet = (num: number, currency: string) => {
  // basic implementation or dummy, we will inject a better one if needed
  // ...
  return numberToArabicWords ? numberToArabicWords(Math.round(num)) + ' ' + currency + ' فقط لا غير' : Math.round(num).toString() + ' ' + currency;
};

// ... massive component logic ... 
// Let's break this into two files to manage better or one large file.
`;

fs.writeFileSync(path.join(__dirname, 'src/components/SalesQuotations.tsx'), content, 'utf8');
