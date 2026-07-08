const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const fontFace = `
@font-face {
  font-family: "EnglishNumbersOnly";
  unicode-range: U+0030-0039, U+002E, U+002F, U+002D; /* Digits, dot, slash, hyphen */
  src: local("Arial"), local("Helvetica"), local("Roboto");
}
`;

if (!css.includes('EnglishNumbersOnly')) {
  css = css.replace('/* Prepared @font-face structures for licensed fonts */', fontFace + '\n/* Prepared @font-face structures for licensed fonts */');
  
  css = css.replace(
    '[dir="rtl"], [dir="rtl"] * {\n  font-family: "Gotham Pro", "GE SS", "GE SS Two", "Cairo", sans-serif !important;\n}',
    '[dir="rtl"], [dir="rtl"] * {\n  font-family: "EnglishNumbersOnly", "Gotham Pro", "GE SS", "GE SS Two", "Cairo", sans-serif !important;\n}'
  );

  css = css.replace(
    '[dir="ltr"], [dir="ltr"] * {\n  font-family: "Gotham Pro", "Gotham", sans-serif !important;\n}',
    '[dir="ltr"], [dir="ltr"] * {\n  font-family: "EnglishNumbersOnly", "Gotham Pro", "Gotham", sans-serif !important;\n}'
  );
  
  fs.writeFileSync('src/index.css', css);
}

