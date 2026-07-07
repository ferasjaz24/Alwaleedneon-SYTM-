const fs = require('fs');
const pid = 1044;
const maps = fs.readFileSync('/proc/' + pid + '/maps', 'utf8').split('\n');
const memFd = fs.openSync('/proc/' + pid + '/mem', 'r');
let total = 0;
let out = fs.openSync('mem_dump.bin', 'w');

for (const line of maps) {
    if (!line) continue;
    const parts = line.split(' ');
    const range = parts[0].split('-');
    const perms = parts[1];
    if (perms.indexOf('r') === -1) continue; 
    const start = BigInt('0x' + range[0]);
    const end = BigInt('0x' + range[1]);
    const size = Number(end - start);
    
    if (size > 100 * 1024 * 1024) continue; 
    
    const buf = Buffer.alloc(size);
    try {
        fs.readSync(memFd, buf, 0, size, start);
        fs.writeSync(out, buf);
    } catch (e) {
    }
}
fs.closeSync(memFd);
fs.closeSync(out);
console.log('Done');
