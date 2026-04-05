const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const replacement = `
  const addEvent = useStore(s => s.addEvent);
  const updateEvent = useStore(s => s.updateEvent);
  const selectedEventId = useStore(s => s.selectedEventId);
  const selectEvent = useStore(s => s.selectEvent);
  const clearDraftEvent = useStore(s => s.clearDraftEvent);

  const [dateError, setDateError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          let hasError = false;
          if (!draftEvent.name || !draftEvent.name.trim()) {
              setNameError(true);
              hasError = true;
          } else {
              setNameError(false);
          }

          if (!draftEvent.dateStr || draftEvent.dateStr.length !== 12) {
              setDateError(true);
              hasError = true;
          } else {
              const y1 = parseInt(draftEvent.dateStr.slice(0, 2), 10);
              const m1 = parseInt(draftEvent.dateStr.slice(2, 4), 10);
              const d1 = parseInt(draftEvent.dateStr.slice(4, 6), 10);
              const y2 = parseInt(draftEvent.dateStr.slice(6, 8), 10);
              const m2 = parseInt(draftEvent.dateStr.slice(8, 10), 10);
              const d2 = parseInt(draftEvent.dateStr.slice(10, 12), 10);
              
              const dStart = new Date(2000 + y1, m1 - 1, d1);
              const dEnd = new Date(2000 + y2, m2 - 1, d2);
              
              if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()) || dStart > dEnd) {
                  setDateError(true);
                  hasError = true;
              } else {
                  setDateError(false);
              }
          }

          if (hasError) return;
          
          const payload = {
              ...draftEvent,
              start: format(new Date(2000 + parseInt(draftEvent.dateStr.slice(0, 2), 10), parseInt(draftEvent.dateStr.slice(2, 4), 10) - 1, parseInt(draftEvent.dateStr.slice(4, 6), 10)), 'yyyy-MM-dd'),
              end: format(new Date(2000 + parseInt(draftEvent.dateStr.slice(6, 8), 10), parseInt(draftEvent.dateStr.slice(8, 10), 10) - 1, parseInt(draftEvent.dateStr.slice(10, 12), 10)), 'yyyy-MM-dd'),
              trackIndex: addingToTrack,
              color: tracks[addingToTrack].color
          };

          if (selectedEventId) {
              updateEvent(selectedEventId, payload);
          } else {
              addEvent(payload);
          }

          clearDraftEvent();
          selectEvent(null);
      }
  };
`;

content = content.replace(/const addEvent =[\s\S]*?clearDraftEvent\(\);\s*\}\s*\};\s*/, replacement);

// Next: fix "isPlusActive ? clearDraftEvent() : setAddingToTrack(rowIndex)" to also clear selectEvent 
content = content.replace(/onClick=\{\(\) => isPlusActive \? clearDraftEvent\(\) : setAddingToTrack\(rowIndex\)\}/g, "onClick={() => { if (isPlusActive) { clearDraftEvent(); selectEvent(null); } else { setAddingToTrack(rowIndex); selectEvent(null); } }}");

// Next: add 'nameError' styling to name input
content = content.replace(/className="w-full border-2 border-black px-2 font-bold text-black outline-none bg-white" style=\{\{ height: blockSize \* 0\.7 \}\} value=\{draftEvent\.name\}/g,
"className={`w-full border-2 px-2 font-bold text-black outline-none bg-white ${nameError ? 'border-red-500' : 'border-black'}`} style={{ height: blockSize * 0.7 }} value={draftEvent.name}");

fs.writeFileSync('src/App.jsx', content);
