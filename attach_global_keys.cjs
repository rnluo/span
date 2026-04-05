const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

const replacement = `
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const deleteEvent = useStore(s => s.deleteEvent);

  useEffect(() => {
      const handleKeyDownGlobal = (e) => {
          if (e.key === 'Control') setCtrlPressed(true);
          if (e.key === 'Delete' || e.key === 'Backspace') {
              // Delete active event if selected and not typing in an input
              if (selectedEventId && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                  deleteEvent(selectedEventId);
                  selectEvent(null);
              }
          }
      };
      const handleKeyUpGlobal = (e) => {
          if (e.key === 'Control') setCtrlPressed(false);
      };
      
      window.addEventListener('keydown', handleKeyDownGlobal);
      window.addEventListener('keyup', handleKeyUpGlobal);
      return () => {
          window.removeEventListener('keydown', handleKeyDownGlobal);
          window.removeEventListener('keyup', handleKeyUpGlobal);
      };
  }, [selectedEventId]);

  const [isDragging, setIsDragging] = useState(false);
`;

content = content.replace(/const \[isDragging, setIsDragging\] = useState\(false\);/, replacement);

const eventReplacement = `
             {events.map((event, index) => {
                const startD = parseLocalDate(event.start);
                const endD = parseLocalDate(event.end);
                
                const pxLeft = timeToPx(startD);
                const pxRight = timeToPx(addDays(endD, 1));
                const rectLeft = pxLeft + (blockSize * 0.15);
                const widthRaw = pxRight - pxLeft;
                const rectWidth = widthRaw - (blockSize * 0.30);
                
                const isSelected = selectedEventId === event.id;
                const showBlueLink = ctrlPressed && event.link;
                const borderClass = showBlueLink ? 'border-2 border-blue-500' : (isSelected ? 'border-2 border-black' : '');
                const zHover = isSelected || showBlueLink ? 'z-20 opacity-100' : 'z-10 opacity-60 hover:opacity-100';

                return (
                    <div
                        key={event.id}
                        data-event="true"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (showBlueLink) {
                                window.open(event.link, '_blank', 'noopener,noreferrer');
                            } else {
                                selectEvent(isSelected ? null : event.id); 
                            }
                        }}
                        className={\`absolute text-white font-bold text-sm tracking-wide flex items-center px-1 overflow-hidden font-sans hover:brightness-110 cursor-pointer transition-colors \${borderClass} \${zHover}\`}
                        style={{
                            left: rectLeft,
                            width: Math.max(rectWidth, blockSize * 0.1),
                            top: ((event.trackIndex + 1) * blockSize) + blockSize * 0.15,
                            height: blockSize * 0.7,
                            backgroundColor: event.color || '#000000'
                        }}
                    >
                        {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    // TODO handle resize left
                                }}
                            />
                        )}
                        <span className="truncate flex-1 pl-1">{event.name}</span>
                        {isSelected && (
                            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    // TODO handle resize right
                                }}
                            />
                        )}
                    </div>
                )
             })}
`;

content = content.replace(/\{events\.map\(event => \{[\s\S]*?\}\)\s*\}\)/, eventReplacement);
fs.writeFileSync('src/App.jsx', content);
