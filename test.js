const toEngDigits = (str) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
console.log(toEngDigits('١٢/٠٣/٢٠٢٤'));
