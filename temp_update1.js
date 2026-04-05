const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// Feature 1: Info box
content = content.replace(
    /<div className="text-xl opacity-90 mb-1">\{selectedEvent\.desc\}<\/div>\s*<div className="text-lg opacity-70 font-mono">/g,
    '<div className="text-xl text-black mb-1">{selectedEvent.desc}</div>\n                    <div className="text-xl text-black font-mono">'
);

fs.writeFileSync('src/App.jsx', content);
console.log("Done Feature 1");
