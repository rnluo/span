const fs = require('fs');
let p1 = fs.readFileSync('src/App.jsx.temp1', 'utf-8');
let p2 = fs.readFileSync('src/App.jsx.temp2', 'utf-8');

// Remove imports from p2
p2 = p2.replace(/import .*?;\n/g, '');
p2 = p2.replace(/export function CenterCanvas/, 'function CenterCanvas');
fs.writeFileSync('src/App.jsx', p1 + '\n' + p2);
