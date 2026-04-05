const fs = require('fs');

let content = fs.readFileSync('src/store.js', 'utf8');

const selectEventReplacement = `
      selectEvent: (id) => set((state) => {
        if (!id) {
            return { selectedEventId: null };
        }
        const ev = state.events.find(e => e.id === id);
        if (!ev) return { selectedEventId: null };
        
        const formatYY = (d) => {
            const date = new Date(d);
            const yy = String(date.getFullYear()).slice(2);
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return \`\${yy}\${mm}\${dd}\`;
        };
        
        return { 
            selectedEventId: id,
            addingToTrack: ev.trackIndex,
            draftEvent: {
                name: ev.name,
                desc: ev.desc || '',
                dateStr: formatYY(ev.start) + formatYY(ev.end),
                link: ev.link || ''
            }
        };
      }),
`;

content = content.replace(/selectEvent:[\s\S]*?\},/, selectEventReplacement);

fs.writeFileSync('src/store.js', content);
