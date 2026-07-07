/**
 * Automatically detects the Saudi Arabian bank name from a given IBAN.
 * Saudi IBAN format is 24 characters: SAxxYYYY... where YYYY or positions 4 and 5 (0-indexed) is the bank code.
 */
export function detectBankFromIban(iban: string, lang: 'ar' | 'en'): { ar: string; en: string; matched: boolean } {
  if (!iban) return { ar: "", en: "", matched: false };
  
  const cleanIban = iban.toUpperCase().replace(/[\s-]/g, "");
  if (!cleanIban.startsWith("SA")) {
    return { ar: "", en: "", matched: false };
  }
  
  if (cleanIban.length < 6) {
    return { ar: "", en: "", matched: false };
  }
  
  // Extract positions 4 and 5 (0-indexed), e.g., SA80 -> "80"
  const code = cleanIban.substring(4, 6);
  
  const bankMap: Record<string, { ar: string; en: string }> = {
    "80": { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
    "10": { ar: "البنك الأهلي السعودي (SNB)", en: "Saudi National Bank (SNB)" },
    "05": { ar: "مصرف الإنماء", en: "Alinma Bank" },
    "20": { ar: "بنك الرياض", en: "Riyad Bank" },
    "15": { ar: "البنك السعودي الأول (ساب)", en: "SAB (Saudi British Bank)" },
    "30": { ar: "البنك العربي الوطني", en: "Arab National Bank" },
    "40": { ar: "البنك السعودي للاستثمار", en: "Saudi Investment Bank" },
    "45": { ar: "البنك السعودي الأول (ساب)", en: "SAB (Saudi British Bank)" },
    "50": { ar: "البنك السعودي الفرنسي", en: "Banque Saudi Fransi" },
    "55": { ar: "بنك الجزيرة", en: "Bank AlJazira" },
    "76": { ar: "بنك البلاد", en: "Bank Albilad" },
    "60": { ar: "بنك الخليج الدولي", en: "Gulf International Bank" }
  };
  
  const found = bankMap[code];
  if (found) {
    return { ...found, matched: true };
  }
  
  return { ar: "", en: "", matched: false };
}
