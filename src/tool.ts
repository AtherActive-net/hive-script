import fs from 'fs';

let count = 1000;
let out = '';

for(let i = 0; i < count; i++) {
    out += `int a${i} = 0;`;
}

fs.writeFile('test.hive',out, (err) => {});