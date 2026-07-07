const fs = require('fs');
const logs = fs.readFileSync('/.aistudio/artifacts/brain/d861e019-651a-40da-80b0-99e9dbd6c143/.system_generated/logs/transcript.jsonl', 'utf8');

const lines = logs.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.content && obj.content.includes('HrEmployeeDirectoryTab.tsx') && obj.content.includes('/* READ ONLY PRESENTATION & COUNTDOWN BADGES */')) {
            // Check if this has the full file or a large chunk
            // We can just look for the first time it was printed or edited
            const linesArr = obj.content.split('\n');
            let foundStart = -1;
            let foundEnd = -1;
            for (let j = 0; j < linesArr.length; j++) {
                if (linesArr[j].includes('/* READ ONLY PRESENTATION & COUNTDOWN BADGES */')) {
                    foundStart = j;
                }
                if (foundStart !== -1 && linesArr[j].includes('/* SECTION: Bank & Transfer Information */')) {
                    foundEnd = j;
                    break;
                }
            }
            if (foundStart !== -1 && foundEnd !== -1) {
                fs.writeFileSync('extracted_chunk.tsx', linesArr.slice(foundStart, foundEnd).join('\n'));
                console.log('Extracted chunk!');
                process.exit(0);
            }
        }
    } catch(e) {}
}
console.log('Not found');
