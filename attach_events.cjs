const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

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
                const showBlueLink = ctrlPressed && !!event.link;
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
                        className={\`absolute text-white font-bold text-sm tracking-wide flex items-center px-1 overflow-hidden font-sans hover:brightness-110 cursor-pointer \${borderClass} \${zHover}\`}
                        style={{
                            left: rectLeft,
                            width: Math.max(rectWidth, blockSize * 0.1),
                            top: ((event.trackIndex + 1) * blockSize) + blockSize * 0.15,
                            height: blockSize * 0.7,
                            backgroundColor: event.color || '#000000',
                            transition: 'left 0s, width 0s, top 0.3s'
                        }}
                    >
                        {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50"
                                onMouseDown={(e) => { e.stopPropagation(); setEventDrag({ id: event.id, mode: 'left', startX: e.clientX, origStart: event.start, origEnd: event.end }); }}
                            />
                        )}
                        <span 
                            className="truncate flex-1 pl-1 select-none" 
                            onMouseDown={(e) => { e.stopPropagation(); setEventDrag({ id: event.id, mode: 'move', startX: e.clientX, origStart: event.start, origEnd: event.end }); }}
                        >
                            {event.name}
                        </span>
                        {isSelected && (
                            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50"
                                onMouseDown={(e) => { e.stopPropagation(); setEventDrag({ id: event.id, mode: 'right', startX: e.clientX, origStart: event.start, origEnd: event.end }); }}
                            />
                        )}
                    </div>
                )
             })}
`;

content = content.replace(/\{events\.map\(event => \{[\s\S]*?\}\)\s*\}\)/, eventReplacement);

const newDragState = `
  const [eventDrag, setEventDrag] = useState(null);
  const updateEvent = useStore(s => s.updateEvent);

  useEffect(() => {
      const handleMouseUpGlobal = () => setEventDrag(null);
      const handleMouseMoveGlobal = (e) => {
          if (!eventDrag) return;
          const dx = e.clientX - eventDrag.startX;
          const blockDiff = Math.round(dx / blockSize);
          
          if (blockDiff !== 0) {
              const origStart = parseLocalDate(eventDrag.origStart);
              const origEnd = parseLocalDate(eventDrag.origEnd);
              let newStart = origStart;
              let newEnd = origEnd;
              
              if (eventDrag.mode === 'move') {
                  newStart = addDays(origStart, blockDiff);
                  newEnd = addDays(origEnd, blockDiff);
              } else if (eventDrag.mode === 'left') {
                  newStart = addDays(origStart, blockDiff);
                  if (newStart > newEnd) newStart = newEnd;
              } else if (eventDrag.mode === 'right') {
                  newEnd = addDays(origEnd, blockDiff);
                  if (newEnd < newStart) newEnd = newStart;
              }

              updateEvent(eventDrag.id, {
                  start: format(newStart, 'yyyy-MM-dd'),
                  end: format(newEnd, 'yyyy-MM-dd')
              });
              
              selectEvent(eventDrag.id); // Triggers re-sync of draftEvent dates
          }
      };

      if (eventDrag) {
          window.addEventListener('mousemove', handleMouseMoveGlobal);
          window.addEventListener('mouseup', handleMouseUpGlobal);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMoveGlobal);
          window.removeEventListener('mouseup', handleMouseUpGlobal);
      };
  }, [eventDrag, blockSize]);

  const [isDragging, setIsDragging] = useState(false);
`;

content = content.replace(/const \[isDragging, setIsDragging\] = useState\(false\);/, newDragState);

fs.writeFileSync('src/App.jsx', content);
