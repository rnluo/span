const fs = require('fs');

const code = `import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import useStore from './store';
import { format, differenceInMilliseconds, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { toggleMode, selectedEventId, deleteEvent, selectEvent } = useStore();
  const containerRef = useRef(null);
  const [blockSize, setBlockSize] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setBlockSize(width / 32);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleMode();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEventId) {
        deleteEvent(selectedEventId);
        selectEvent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode, selectedEventId, deleteEvent, selectEvent]);

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex text-black">
      <div ref={containerRef} className="w-full h-full text-black font-sans relative box-border overflow-hidden">
        <SidebarLeft blockSize={blockSize} />
        <CenterCanvas blockSize={blockSize} />
        <SidebarRight blockSize={blockSize} />
      </div>
    </div>
  );
}

function SidebarLeft({ blockSize }) {
  const mode = useStore(s => s.mode);
  const tracks = useStore(s => s.tracks);
  const updateTrackTitle = useStore(s => s.updateTrackTitle);
  const updateTrackColor = useStore(s => s.updateTrackColor);

  const tracksTop = \\\`calc(50% - \${blockSize * 2}px)\\\`;

  return (
    <div className="absolute left-0 top-0 h-full z-20 pointer-events-none flex" style={{ width: blockSize * 8 }}>
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ x: -blockSize * 8 }}
            animate={{ x: 0 }}
            exit={{ x: -blockSize * 8 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 top-0 h-full border-r-2 border-black bg-white pointer-events-auto z-10"
            style={{ width: blockSize * 8 }}
          >
            <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
               {tracks.map((track, i) => (
                <div key={i} className="relative flex items-center" style={{ height: blockSize }}>
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => updateTrackTitle(i, e.target.value)}
                    className="absolute border-2 border-black bg-white px-2 outline-none font-bold text-black text-right"
                    style={{ left: blockSize, height: blockSize * 0.7, width: blockSize * 5, fontSize: blockSize * 0.4 }}
                    placeholder={\\\`Track \${i + 1}\\\`}
                  />
                  <div className="absolute flex justify-center items-center" style={{ left: blockSize * 6, width: blockSize, height: blockSize }}>
                      <div style={{ width: blockSize * 0.7, height: blockSize * 0.7, backgroundColor: track.color || '#aaaaaa' }} className="relative overflow-hidden border-2 border-black cursor-pointer">
                          <input
                            type="color"
                            value={track.color || '#aaaaaa'}
                            onChange={(e) => updateTrackColor(i, e.target.value)}
                            className="absolute -inset-4 opacity-0 cursor-pointer w-20 h-20"
                          />
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === 'default' && (
          <motion.div
            initial={{ x: -blockSize * 4 }}
            animate={{ x: 0 }}
            exit={{ x: -blockSize * 4 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 top-0 h-full border-r-2 border-black bg-white pointer-events-auto z-20"
            style={{ width: blockSize * 4 }}
          >
            <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
              {tracks.map((track, i) => (
                <div key={i} className="flex justify-end items-center relative" style={{ height: blockSize }}>
                    <div className="font-bold flex items-center justify-end pr-2 w-full truncate" style={{ height: blockSize * 0.7, paddingRight: blockSize * 0.5, fontSize: blockSize * 0.4 }}>
                        {track.title}
                    </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CrossedBox = ({ w, h }) => (
    <div className="w-full h-full bg-white border-2 border-black relative overflow-hidden" style={{ width: w, height: h }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="black" strokeWidth="1.5" />
        </svg>
    </div>
);

function SidebarRight({ blockSize }) {
  const mode = useStore(s => s.mode);
  const tracks = useStore(s => s.tracks);
  const presentDate = useStore(s => s.presentDate);
  const events = useStore(s => s.events);
  const addingToTrack = useStore(s => s.addingToTrack);
  const setAddingToTrack = useStore(s => s.setAddingToTrack);
  const draftEvent = useStore(s => s.draftEvent);
  const updateDraftEvent = useStore(s => s.updateDraftEvent);
  
  const addEvent = useStore(s => s.addEvent);
  const updateEvent = useStore(s => s.updateEvent);
  const selectedEventId = useStore(s => s.selectedEventId);
  const selectEvent = useStore(s => s.selectEvent);
  const clearDraftEvent = useStore(s => s.clearDraftEvent);

  const [dateError, setDateError] = useState(false);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
      if (selectedEventId) {
          const ev = events.find(e => e.id === selectedEventId);
          if (ev) {
              const dStart = new Date(ev.start);
              const dEnd = new Date(ev.end);
              const pad = n => String(n).padStart(2, '0');
              const yy1 = String(dStart.getFullYear()).slice(-2);
              const mm1 = pad(dStart.getMonth() + 1);
              const dd1 = pad(dStart.getDate());
              const yy2 = String(dEnd.getFullYear()).slice(-2);
              const mm2 = pad(dEnd.getMonth() + 1);
              const dd2 = pad(dEnd.getDate());
              
              setAddingToTrack(ev.trackIndex);
              updateDraftEvent({
                  name: ev.name || '',
                  desc: ev.desc || '',
                  dateStr: \\\`\${yy1}\${mm1}\${dd1}\${yy2}\${mm2}\${dd2}\\\`,
                  link: ev.link || ''
              });
              setDateError(false);
              setNameError(false);
          }
      }
  }, [selectedEventId]); // deliberate dependency logic

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

  const tracksTop = \\\`calc(50% - \${blockSize * 2}px)\\\`;
  const isInputsAvailable = addingToTrack !== null;

  return (
    <div className="absolute right-0 top-0 h-full z-20 pointer-events-none flex" style={{ width: blockSize * 8 }}>
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ x: blockSize * 8 }}
            animate={{ x: 0 }}
            exit={{ x: blockSize * 8 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-0 h-full border-l-2 border-black bg-white pointer-events-auto z-10"
            style={{ width: blockSize * 8 }}
          >
            <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
               {[0, 1, 2, 3].map(rowIndex => {
                   const isPlusCrossed = isInputsAvailable && addingToTrack !== rowIndex;
                   const isPlusActive = addingToTrack === rowIndex;

                   return (
                       <div key={rowIndex} className="relative" style={{ height: blockSize }}>
                           {/* PLUS BUTTON */}
                           <div className="absolute flex justify-center items-center" style={{ left: blockSize, width: blockSize, height: blockSize }}>
                               {isPlusCrossed ? (
                                   <CrossedBox w={blockSize * 0.7} h={blockSize * 0.7} />
                               ) : (
                                   <button 
                                      tabIndex={-1}
                                      onClick={() => { if (isPlusActive) { clearDraftEvent(); selectEvent(null); } else { setAddingToTrack(rowIndex); selectEvent(null); } }}
                                      className={\\\`flex items-center justify-center border-2 font-bold font-sans leading-none border-black transition-colors \${isPlusActive ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}\\\`}
                                      style={{ width: blockSize * 0.7, height: blockSize * 0.7, fontSize: blockSize * 0.6 }}
                                   >
                                      {isPlusActive ? '×' : '+'}
                                   </button>
                               )}
                           </div>

                           {/* Row 0: Name */}
                           {rowIndex === 0 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={1} placeholder="Name" className={\\\`w-full border-2 px-2 font-bold text-black outline-none bg-white \${nameError ? 'border-red-500' : 'border-black'}\\\`} style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.name} onChange={e => updateDraftEvent({name: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 1: Desc */}
                           {rowIndex === 1 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={2} placeholder="Description" className="w-full border-2 border-black px-2 outline-none bg-white text-black" style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.desc} onChange={e => updateDraftEvent({desc: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 2: Date */}
                           {rowIndex === 2 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={3} placeholder="YYMMDDYYMMDD" className={\\\`w-full border-2 px-2 outline-none bg-white text-black font-bold font-mono \${dateError ? 'border-red-500' : 'border-black'}\\\`} style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.dateStr} onChange={e => updateDraftEvent({dateStr: e.target.value.replace(/\\D/g, '')})} onKeyDown={handleKeyDown} maxLength={12} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 3: Link */}
                           {rowIndex === 3 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={4} placeholder="Link" className="w-full border-2 border-black px-2 outline-none bg-white text-black" style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.link} onChange={e => updateDraftEvent({link: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                       </div>
                   )
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === 'default' && (
          <motion.div
            initial={{ x: blockSize * 4 }}
            animate={{ x: 0 }}
            exit={{ x: blockSize * 4 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-0 h-full border-l-2 border-black bg-white pointer-events-auto z-20"
            style={{ width: blockSize * 4 }}
          >
             <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
              {tracks.map((track, i) => {
                const trackEvents = events.filter(e => e.trackIndex === i).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                const now = presentDate.getTime();
                
                let displayDateStr = '--/--/--';
                const inProgress = trackEvents.filter(e => {
                   const s = new Date(e.start).getTime();
                   const n = addDays(new Date(e.end), 1).getTime();
                   return s <= now && n >= now;
                }).sort((a,b) => new Date(a.end).getTime() - new Date(b.end).getTime());

                if (inProgress.length > 0) {
                    displayDateStr = format(new Date(inProgress[0].end), 'yy/MM/dd');
                } else {
                    const future = trackEvents.filter(e => new Date(e.start).getTime() > now);
                    if(future.length > 0) {
                        displayDateStr = format(new Date(future[0].start), 'yy/MM/dd');
                    }
                }

                return (
                    <div key={i} className="flex justify-start items-center relative" style={{ height: blockSize }}>
                        <div className="font-bold font-mono flex items-center pl-2 w-full truncate text-black" style={{ height: blockSize * 0.7, paddingLeft: blockSize * 0.5, fontSize: blockSize * 0.4 }}>
                            {displayDateStr}
                        </div>
                    </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CenterCanvas({ blockSize }) {
  const presentDate = useStore(s => s.presentDate);
  const msPerBlock = useStore(s => s.msPerBlock);
  const events = useStore(s => s.events);
  const scrollOffsetBlocks = useStore(s => s.scrollOffsetBlocks);
  const setScrollOffset = useStore(s => s.setScrollOffset);
  const zoomScale = useStore(s => s.zoomScale);
  const selectedEventId = useStore(s => s.selectedEventId);
  const selectEvent = useStore(s => s.selectEvent);
  const mode = useStore(s => s.mode);

  const containerRef = useRef(null);
  const PRESENT_COL_INDEX = 11; // 12th block index 11
  
  const tapeTop = \\\`calc(50% - \${blockSize * 3}px)\\\`;

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [startCanvasX, setStartCanvasX] = useState(0);
  const [canvasDragMoved, setCanvasDragMoved] = useState(false);

  const handleMouseDownCanvas = (e) => {
      setIsDraggingCanvas(true);
      setStartCanvasX(e.clientX);
      setCanvasDragMoved(false);
  };

  const handleMouseMoveCanvas = (e) => {
      if(!isDraggingCanvas) return;
      const dx = e.clientX - startCanvasX;
      if (Math.abs(dx) > 3) setCanvasDragMoved(true);
      setScrollOffset(scrollOffsetBlocks - (dx / blockSize));
      setStartCanvasX(e.clientX);
  };

  const handleMouseUpCanvas = (e) => {
      setIsDraggingCanvas(false);
      if (!canvasDragMoved && e.target.dataset.event !== "true" && selectedEventId) {
          selectEvent(null);
      }
  };

  const handleMouseLeaveCanvas = () => setIsDraggingCanvas(false);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        const multiplier = e.deltaY > 0 ? 1.1 : 0.9;
        zoomScale(multiplier);
    } else {
        const deltaPx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const deltaBlocks = deltaPx / blockSize;
        setScrollOffset(scrollOffsetBlocks + deltaBlocks);
    }
  };

  const parseLocalDate = (dateValue) => {
     if(!dateValue) return new Date();
     if (typeof dateValue === 'string' && dateValue.includes('-') && dateValue.length === 10) {
         const [year, month, day] = dateValue.split('-');
         return new Date(year, month - 1, day);
     }
     return new Date(dateValue);
  };

  const timeToPx = (dateValue) => {
     if(!dateValue) return 0;
     const d = parseLocalDate(dateValue);
     const diffMs = differenceInMilliseconds(d, startOfDay(presentDate));
     let blocksOffset = (diffMs / msPerBlock) - scrollOffsetBlocks;
     return (PRESENT_COL_INDEX + blocksOffset) * blockSize;
  };

  // ----- Ctrl Key Tracker -----
  const [isCtrl, setIsCtrl] = useState(false);
  useEffect(() => {
      const hDown = e => { if (e.key === 'Control' || e.key === 'Meta') setIsCtrl(true); };
      const hUp = e => { if (e.key === 'Control' || e.key === 'Meta') setIsCtrl(false); };
      window.addEventListener('keydown', hDown);
      window.addEventListener('keyup', hUp);
      return () => { window.removeEventListener('keydown', hDown); window.removeEventListener('keyup', hUp); };
  }, []);

  // ----- Event Dragging Logic -----
  const [draggingEvent, setDraggingEvent] = useState(null);

  useEffect(() => {
      const hmMove = (e) => {
          if (!draggingEvent) return;
          const dx = e.clientX - draggingEvent.originX;
          const daysDelta = Math.round(dx / blockSize);
          const newEv = { ...draggingEvent };
          
          if (draggingEvent.type === 'both') {
              newEv.start = addDays(draggingEvent.originStart, daysDelta);
              newEv.end = addDays(draggingEvent.originEnd, daysDelta);
          } else if (draggingEvent.type === 'left') {
              newEv.start = addDays(draggingEvent.originStart, daysDelta);
              if (newEv.start > newEv.end) newEv.start = newEv.end;
          } else if (draggingEvent.type === 'right') {
              newEv.end = addDays(draggingEvent.originEnd, daysDelta);
              if (newEv.end < newEv.start) newEv.end = newEv.start;
          }
          
          if (newEv.start.getTime() !== draggingEvent.start.getTime() || newEv.end.getTime() !== draggingEvent.end.getTime()) {
              setDraggingEvent(newEv);
          }
      };
      
      const hmUp = () => {
          if (draggingEvent) {
              useStore.getState().updateEvent(draggingEvent.id, {
                  start: format(draggingEvent.start, 'yyyy-MM-dd'),
                  end: format(draggingEvent.end, 'yyyy-MM-dd')
              });
              setDraggingEvent(null);
          }
      };

      if (draggingEvent) {
          window.addEventListener('mousemove', hmMove);
          window.addEventListener('mouseup', hmUp);
      }
      return () => {
          window.removeEventListener('mousemove', hmMove);
          window.removeEventListener('mouseup', hmUp);
      };
  }, [draggingEvent, blockSize]);

  const [isAnimatingMode, setIsAnimatingMode] = useState(false);
  const prevMode = useRef(mode);
  useEffect(() => {
      if (prevMode.current !== mode) {
          setIsAnimatingMode(true);
          const timer = setTimeout(() => setIsAnimatingMode(false), 300);
          prevMode.current = mode;
          return () => clearTimeout(timer);
      }
  }, [mode]);

  const activeSelectedEvent = draggingEvent || events.find(e => e.id === selectedEventId);

  const [infoWidth, setInfoWidth] = useState(0);
  const infoRef = useRef(null);

  useEffect(() => {
      if (infoRef.current) setInfoWidth(infoRef.current.getBoundingClientRect().width);
  }, [activeSelectedEvent?.id, mode, activeSelectedEvent?.start, activeSelectedEvent?.end]);

  let infoLeft = 0;
  let infoTop = '0px';
  if (activeSelectedEvent) {
      const desiredLeft = timeToPx(parseLocalDate(activeSelectedEvent.start)) + (blockSize * 0.15);
      const leftSidebarEdge = (mode === 'edit' ? 8 : 4) * blockSize;
      const rightSidebarEdge = 32 * blockSize - ((mode === 'edit' ? 8 : 4) * blockSize);
      const leftBound = leftSidebarEdge + blockSize;
      const rightBound = rightSidebarEdge - blockSize - infoWidth;

      infoLeft = Math.max(leftBound, Math.min(desiredLeft, rightBound > leftBound ? rightBound : leftBound));
      infoTop = activeSelectedEvent.trackIndex < 2 ? \\\`calc(25% - \${blockSize * 1.5}px)\\\` : \\\`calc(75% + \${blockSize * 1.5}px)\\\`;
  }

  return (
    <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onMouseLeave={handleMouseLeaveCanvas}
        onDoubleClick={() => setScrollOffset(0)}
        className={\\\`absolute left-0 top-0 w-full h-full bg-white overflow-hidden z-10 \${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}\\\`}
    >
        <div
            className="absolute top-0 w-px bg-red-500 z-0 pointer-events-none"
            style={{ left: timeToPx(startOfDay(presentDate)) + (blockSize * 0.5), height: '100%' }}
        />

        <div className="absolute w-full z-10 bg-white" style={{ top: tapeTop, height: blockSize * 6 }}>
             <div className="absolute inset-0 pointer-events-none z-0">
                 <div className="absolute top-0 w-full h-[2px] bg-black z-10" />
                 <div className="absolute w-full h-px bg-gray-200/50" style={{top: blockSize * 1}} />
                 <div className="absolute w-full h-px bg-gray-200/50" style={{top: blockSize * 2}} />
                 <div className="absolute w-full h-px bg-gray-200/50" style={{top: blockSize * 3}} />
                 <div className="absolute w-full h-px bg-gray-200/50" style={{top: blockSize * 4}} />
                 <div className="absolute w-full h-px bg-gray-200/50" style={{top: blockSize * 5}} />
                 
                 {(() => {
                     const viewStartMs = presentDate.getTime() + (scrollOffsetBlocks - 12) * msPerBlock;
                     const viewEndMs = presentDate.getTime() + (scrollOffsetBlocks + 22) * msPerBlock;

                     const daysToDraw = [];
                     let curr = startOfDay(new Date(viewStartMs));
                     const end = startOfDay(new Date(viewEndMs));
                     let limit = 0;
                     while (curr <= end && limit < 1500) {
                         daysToDraw.push(new Date(curr));
                         curr = addDays(curr, 1);
                         limit++;
                     }

                     return daysToDraw.map(day => {
                         const pxLeft = timeToPx(day);
                         const isFirst = day.getDate() === 1;
                         const isMarker = [5, 10, 15, 20, 25, 30].includes(day.getDate());
                         const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                         return (
                             <div key={day.getTime()} className="absolute top-0 h-full pointer-events-none" style={{ left: pxLeft, width: blockSize }}>
                                 {day.getDay() !== 0 && (
                                     <div className="absolute left-0 top-0 h-full w-px bg-gray-200" />
                                 )}

                                 {!isWeekend && (
                                     <div className="absolute bottom-0 left-0 w-full bg-black h-[2px] z-10" />
                                 )}

                                 {day.getDay() === 6 && (
                                     <div className="absolute bottom-0 left-0 border-b-2 border-dashed border-black h-[2px] z-10" style={{ width: blockSize * 2 }} />
                                 )}

                                 {(isFirst || isMarker) && (
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white leading-none px-1 tracking-tight z-20">
                                         <span className={\\\`text-black \${isFirst ? 'font-bold font-sans' : 'font-normal font-mono'}\\\`} style={{ fontSize: blockSize * 0.45 }}>
                                             {isFirst ? format(day, 'MMM') : day.getDate()}
                                         </span>
                                     </div>
                                 )}
                             </div>
                         )
                     })
                 })()}
             </div>

             {events.map(event => {
                const isSelected = selectedEventId === event.id;
                
                let startD, endD;
                if (draggingEvent && draggingEvent.id === event.id) {
                    startD = draggingEvent.start;
                    endD = draggingEvent.end;
                } else {
                    startD = parseLocalDate(event.start);
                    endD = parseLocalDate(event.end);
                }
                
                const pxLeft = timeToPx(startD);
                const pxRight = timeToPx(addDays(endD, 1));
                const rectLeft = pxLeft + (blockSize * 0.15);
                const widthRaw = pxRight - pxLeft;
                const rectWidth = widthRaw - (blockSize * 0.30);
                
                const hasLink = !!event.link;
                let borderClass = 'opacity-60 hover:opacity-100';
                if (isSelected) borderClass = 'border-2 border-black opacity-100';
                else if (hasLink && isCtrl) borderClass = 'border-2 border-blue-500 opacity-100';

                return (
                    <div
                        key={event.id}
                        data-event="true"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isCtrl && hasLink) {
                                window.open(event.link, '_blank');
                            } else {
                                selectEvent(isSelected ? null : event.id);
                            }
                        }}
                        className={\\\`absolute text-white font-bold tracking-wide flex items-center px-2 overflow-hidden font-sans cursor-pointer z-10 \${borderClass}\\\`}
                        style={{
                            left: rectLeft,
                            width: Math.max(rectWidth, blockSize * 0.1),
                            top: ((event.trackIndex + 1) * blockSize) + blockSize * 0.15,
                            height: blockSize * 0.7,
                            backgroundColor: event.color || '#000000',
                            fontSize: blockSize * 0.35
                        }}
                        onMouseDown={(e) => {
                            if (!isSelected) return;
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const offsetX = e.clientX - rect.left;
                            let type = 'both';
                            if (offsetX < 15) type = 'left';
                            else if (rect.width - offsetX < 15) type = 'right';

                            setDraggingEvent({
                                id: event.id,
                                type,
                                originX: e.clientX,
                                originStart: startD,
                                originEnd: endD,
                                start: startD,
                                end: endD
                            });
                        }}
                    >
                        {event.name}
                        {isSelected && (
                            <>
                                <div className="absolute left-0 top-0 w-3 h-full cursor-ew-resize" />
                                <div className="absolute right-0 top-0 w-3 h-full cursor-ew-resize" />
                            </>
                        )}
                    </div>
                )
             })}
        </div>

        <AnimatePresence>
            {activeSelectedEvent && (
                <motion.div
                    ref={infoRef}
                    initial={{ opacity: 0, left: infoLeft, top: infoTop }}
                    animate={{ opacity: 1, left: infoLeft, top: infoTop }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 0.3 }, left: { duration: isAnimatingMode ? 0.3 : 0 }, top: { duration: isAnimatingMode ? 0.3 : 0 } }}
                    className="absolute text-black pointer-events-none z-30 font-sans flex flex-col justify-center bg-white px-2 py-1 whitespace-nowrap"
                    style={{ transform: 'translateY(-50%)' }}
                >
                    <div className="font-bold mb-1" style={{ fontSize: blockSize * 0.8 }}>{activeSelectedEvent.name}</div>
                    <div className="text-black mb-1" style={{ fontSize: blockSize * 0.4 }}>{activeSelectedEvent.desc}</div>
                    <div className="text-black font-mono" style={{ fontSize: blockSize * 0.4 }}>
                        {format(draggingEvent ? draggingEvent.start : parseLocalDate(activeSelectedEvent.start), 'yyyy/MM/dd')} - {format(draggingEvent ? draggingEvent.end : parseLocalDate(activeSelectedEvent.end), 'yyyy/MM/dd')}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', code);
