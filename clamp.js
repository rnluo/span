const fs = require('fs');
let s = fs.readFileSync('src/App.jsx', 'utf-8');

// SidebarLeft text
s = s.replace(/text-lg([^"]*placeholder=`Track)/g, 'text-[clamp(12px,1.5vw,18px)]$1');
s = s.replace(/text-lg([^"]*\{track.title\})/g, 'text-[clamp(12px,1.5vw,18px)]$1');

// Right sidebar Date text
s = s.replace(/"font-bold text-lg font-mono flex/g, '"font-bold text-[clamp(12px,1.5vw,18px)] font-mono flex');

// Center canvas date numbers on tape
s = s.replace(/className={`text-lg text-black font-mono \$\{isFirst \? 'font-bold font-sans' : 'font-normal font-mono'\}`}/g, "className={`text-[clamp(12px,1.5vw,18px)] text-black ${isFirst ? 'font-bold font-sans' : 'font-normal font-mono'}`}");

// Selected details
s = s.replace(/text-4xl/g, 'text-[clamp(18px,2.5vw,36px)]');
s = s.replace(/className="text-[^"]*opacity-90[^"]*">\{selectedEvent\.desc\}/, 'className="text-[clamp(14px,1.5vw,22px)] text-black mb-1">{selectedEvent.desc}');
s = s.replace(/className="text-[^"]*opacity-70[^"]*">/, 'className="text-[clamp(14px,1.5vw,22px)] text-black font-mono">');
// Subagent might have replaced it. Let's do a catch-all for selected event details.
s = s.replace(/<div className="text-xl mb-1">\{selectedEvent.desc\}<\/div>/g, '<div className="text-[clamp(14px,1.5vw,22px)] text-black mb-1">{selectedEvent.desc}</div>');
s = s.replace(/<div className="text-xl opacity-90 mb-1">\{selectedEvent.desc\}<\/div>/g, '<div className="text-[clamp(14px,1.5vw,22px)] text-black mb-1">{selectedEvent.desc}</div>');
s = s.replace(/<div className="text-lg opacity-70 font-mono">/g, '<div className="text-[clamp(14px,1.5vw,22px)] text-black font-mono">');

fs.writeFileSync('src/App.jsx', s);
