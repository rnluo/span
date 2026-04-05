const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');
let lines = content.split(/\r?\n/);
lines.splice(420, 46); // index 420 is line 421
fs.writeFileSync('src/App.jsx', lines.join('\n'));
