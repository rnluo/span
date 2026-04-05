const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Date markers on the tape
content = content.replace(/className={`text-lg text-black \$\{isFirst \? 'font-bold' : 'font-normal'\}`}/g, 'className={`text-lg text-black font-mono ${isFirst ? \\\'font-bold\\' : \\\'font-normal\\\'}`}'.replace(/\\'/g, "'"));

// 2. Right sidebar default mode display date
content = content.replace(/className="font-bold text-lg flex items-center pl-2 w-full truncate text-black"/g, 'className="font-bold text-lg font-mono flex items-center pl-2 w-full truncate text-black"');

// 3. Draft YYMMDDYYMMDD input
content = content.replace(/className={`w-full border-2 px-2 outline-none bg-white text-black font-bold outline-none \$\{dateError \? 'border-red-500' : 'border-black'\}`}/g, 'className={`w-full border-2 px-2 outline-none bg-white text-black font-bold font-mono outline-none ${dateError ? \\\'border-red-500\\\' : \\\'border-black\\\'}`}'.replace(/\\'/g, "'"));

// 4. Clicked event info popup dates
content = content.replace(/<div className="text-lg opacity-70">/g, '<div className="text-lg opacity-70 font-mono">');

fs.writeFileSync('src/App.jsx', content);
