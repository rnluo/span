
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace border with border-2 in classes
code = code.replace(/border-r border-black/g, 'border-r-2 border-black');
code = code.replace(/border-l border-black/g, 'border-l-2 border-black');
code = code.replace(/border border-black/g, 'border-2 border-black');

// Re-write to make sure all we replace works
fs.writeFileSync('src/App.jsx.temp', code);

