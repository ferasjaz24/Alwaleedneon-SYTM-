const fs = require('fs');
const path = require('path');

const updateInstantDocs = () => {
    let file = path.join(__dirname, 'src/components/hr/InstantDocumentsHub.tsx');
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('../utils/PrintSharedComponents')) {
        content = content.replace(
            "import { Employee, User } from '../../types';", 
            "import { Employee, User } from '../../types';\nimport { DocumentHeader, DocumentFooter } from '../../utils/PrintSharedComponents';"
        );

        // Remove old DocumentHeader and DocumentFooter definitions
        const removeRegexHeader = /const DocumentHeader = \(\) => \([\s\S]*?\);\n/g;
        const removeRegexFooter = /const DocumentFooter = \(\) => \([\s\S]*?\);\n/g;
        
        content = content.replace(removeRegexHeader, "");
        content = content.replace(removeRegexFooter, "");

        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed InstantDocs');
    }
}

updateInstantDocs();
