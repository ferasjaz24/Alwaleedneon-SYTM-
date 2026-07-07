export const numberToArabicWords = (number: number): string => {
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const thousands = ["", "ألف", "ألفان", "آلاف", "آلاف"];
  const millions = ["", "مليون", "مليونان", "ملايين", "ملايين"];

  if (number === 0) return "صفر";
  
  // simple implementation for < 1,000,000
  let numStr = Math.floor(number).toString();
  if (numStr.length > 6) return numStr;

  let words: string[] = [];

  // Helper for < 1000
  const convertHundreds = (n: number) => {
    let res: string[] = [];
    const h = Math.floor(n / 100);
    const rest = n % 100;
    
    if (h > 0) res.push(hundreds[h]);
    
    if (rest > 0) {
      if (rest < 10) {
        if (h > 0) res.push("و" + units[rest]);
        else res.push(units[rest]);
      } else if (rest < 20) {
        if (h > 0) res.push("و" + teens[rest - 10]);
        else res.push(teens[rest - 10]);
      } else {
        const t = Math.floor(rest / 10);
        const u = rest % 10;
        let tStr = "";
        if (u > 0) tStr += units[u] + " و";
        tStr += tens[t];
        if (h > 0) res.push("و" + tStr);
        else res.push(tStr);
      }
    }
    return res.join(" ");
  };

  const th = Math.floor(number / 1000);
  const rem = number % 1000;

  if (th > 0) {
    if (th === 1) words.push("ألف");
    else if (th === 2) words.push("ألفان");
    else if (th >= 3 && th <= 10) words.push(convertHundreds(th) + " آلاف");
    else words.push(convertHundreds(th) + " ألف");
  }

  if (rem > 0) {
    if (th > 0) words.push("و" + convertHundreds(rem));
    else words.push(convertHundreds(rem));
  }

  return words.join(" ").trim().replace(/\s+/g, ' ');
};

export const tafqeet = numberToArabicWords;
