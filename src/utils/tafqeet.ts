export function tafqeet(number: number): string {
  if (number === 0) return "صفر ريال سعودي لا غير";

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const thousands = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف", "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];
  const millions = ["", "مليون", "مليونان", "ثلاثة ملايين", "أربعة ملايين", "خمسة ملايين", "ستة ملايين", "سبعة ملايين", "ثمانية ملايين", "تسعة ملايين"];

  function getTafqeet(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return ones[n % 10] + (n % 10 !== 0 ? " و " : "") + tens[Math.floor(n / 10)];
    if (n < 1000) return hundreds[Math.floor(n / 100)] + (n % 100 !== 0 ? " و " + getTafqeet(n % 100) : "");
    if (n < 3000) return thousands[Math.floor(n / 1000)] + (n % 1000 !== 0 ? " و " + getTafqeet(n % 1000) : "");
    if (n < 10000) return getTafqeet(Math.floor(n / 1000)) + " آلاف" + (n % 1000 !== 0 ? " و " + getTafqeet(n % 1000) : "");
    if (n < 1000000) return getTafqeet(Math.floor(n / 1000)) + " ألف" + (n % 1000 !== 0 ? " و " + getTafqeet(n % 1000) : "");
    if (n < 3000000) return millions[Math.floor(n / 1000000)] + (n % 1000000 !== 0 ? " و " + getTafqeet(n % 1000000) : "");
    if (n < 10000000) return getTafqeet(Math.floor(n / 1000000)) + " ملايين" + (n % 1000000 !== 0 ? " و " + getTafqeet(n % 1000000) : "");
    return getTafqeet(Math.floor(n / 1000000)) + " مليون" + (n % 1000000 !== 0 ? " و " + getTafqeet(n % 1000000) : "");
  }

  const intPart = Math.floor(number);
  const fracPart = Math.round((number - intPart) * 100);

  let result = getTafqeet(intPart) + " ريال سعودي";
  if (fracPart > 0) {
    result += " و " + getTafqeet(fracPart) + " هللة";
  }
  
  result = result.replace(/و\s*$/, "").trim() + " لا غير";
  return result;
}
