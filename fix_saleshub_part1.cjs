const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/SalesHub.tsx');
let c = fs.readFileSync(f, 'utf8');

const imports = `import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Phone, Mail, MapPin, User, Search, Filter, Calendar, Save, Trash2, 
  Upload, Sparkles, Printer, Info, CheckCircle2, AlertTriangle, FileSpreadsheet,
  X, MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Quotation, Employee, Client } from '../types';
import { sharedPrintHeader, sharedPrintFooter, sharedPrintStyles } from '../utils/PrintShared';

const arabCountries = [
  { name: 'السعودية', flag: '🇸🇦' },
  { name: 'الإمارات', flag: '🇦🇪' },
  { name: 'الكويت', flag: '🇰🇼' },
  { name: 'قطر', flag: '🇶🇦' },
  { name: 'البحرين', flag: '🇧🇭' },
  { name: 'عمان', flag: '🇴🇲' },
  { name: 'مصر', flag: '🇪🇬' },
  { name: 'الأردن', flag: '🇯🇴' },
  { name: 'المغرب', flag: '🇲🇦' },
  { name: 'الجزائر', flag: '🇩🇿' },
  { name: 'تونس', flag: '🇹🇳' },
  { name: 'العراق', flag: '🇮🇶' },
  { name: 'اليمن', flag: '🇾🇪' },
  { name: 'سوريا', flag: '🇸🇾' },
  { name: 'فلسطين', flag: '🇵🇸' },
  { name: 'لبنان', flag: '🇱🇧' },
  { name: 'ليبيا', flag: '🇱🇾' },
  { name: 'السودان', flag: '🇸🇩' },
  { name: 'موريتانيا', flag: '🇲🇷' },
  { name: 'الصومال', flag: '🇸🇴' },
  { name: 'غير ذلك', flag: '🌍' }
];

const saudiRegions = ['المنطقة الشرقية', 'المنطقة الوسطى', 'المنطقة الشمالية', 'المنطقة الغربية', 'المنطقة الجنوبية'];
const saudiCities = {
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الاحساء', 'الجبيل', 'القطيف', 'الخفجي', 'حفر الباطن'],
  'المنطقة الوسطى': ['الرياض', 'الخرج', 'بريدة', 'عنيزة', 'الزلفي', 'المجمعة', 'الرس'],
  'المنطقة الغربية': ['مكة المكرمة', 'جدة', 'الطائف', 'المدينة المنورة', 'ينبع', 'رابغ'],
  'المنطقة الجنوبية': ['ابها', 'خميس مشيط', 'نجران', 'جازان', 'الباحة', 'بيشة'],
  'المنطقة الشمالية': ['تبوك', 'حائل', 'عرعر', 'سكاكا', 'القريات', 'طريف', 'رفحاء']
};
`;

c = c.replace(/import React[\s\S]*?from '\.\.\/utils\/PrintShared';/, imports);

fs.writeFileSync(f, c, 'utf8');
