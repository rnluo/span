import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import useStore from './store';
import { format, differenceInMilliseconds, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { toggleMode } = useStore();
  const containerRef = useRef(null);
  const [blockSize, setBlockSize] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Snap to nearest integer to avoid subpixel antialiasing making borders look blurry/thin
        setBlockSize(Math.floor(width / 32));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Tab" && e.target.tagName !== "INPUT") { e.preventDefault(); toggleMode(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

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

  const tracksTop = `calc(50% - ${blockSize * 2}px)`;

  return (
    <div className="absolute left-0 top-0 h-full z-20 pointer-events-none flex" style={{ width: blockSize * 8 }}>
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ x: -blockSize * 8 }}
            animate={{ x: 0 }}
            exit={{ x: -blockSize * 8 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 top-0 h-full border-r-[2px] border-black bg-white pointer-events-auto z-10"
            style={{ width: blockSize * 8 }}
          >
            <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
               {tracks.map((track, i) => (
                <div key={i} className="relative flex items-center" style={{ height: blockSize }}>
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => updateTrackTitle(i, e.target.value)}
                    className="absolute border-[2px] border-black bg-white px-2 outline-none font-bold text-black text-right"
                    style={{ left: blockSize, height: blockSize * 0.7, width: blockSize * 5, fontSize: blockSize * 0.4 }}
                    placeholder={`Track ${i + 1}`}
                  />
                  <div className="absolute flex justify-center items-center" style={{ left: blockSize * 6, width: blockSize, height: blockSize }}>
                      <div style={{ width: blockSize * 0.7, height: blockSize * 0.7, backgroundColor: track.color || '#aaaaaa' }} className="relative overflow-hidden border-[2px] border-black cursor-pointer">
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
            className="absolute left-0 top-0 h-full border-r-[2px] border-black bg-white pointer-events-auto z-20"
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
    <div className="w-full h-full bg-white border-[2px] border-black relative overflow-hidden" style={{ width: w, height: h }}>
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
  const importData = useStore(s => s.importData);

  const [dateError, setDateError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleImport = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
              try {
                  const data = JSON.parse(evt.target.result);
                  if (data.tracks && data.events) {
                      importData(data);
                  }
              } catch (err) {
                  console.error('Failed to import JSON', err);
              }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  const handleExport = () => {
      const data = { tracks, events };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `span-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

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
                  dateStr: `${yy1}${mm1}${dd1}${yy2}${mm2}${dd2}`,
                  link: ev.link || ''
              });
              setDateError(false);
              setNameError(false);
          }
      } else {
          clearDraftEvent();
          setAddingToTrack(null);
          setDateError(false);
          setNameError(false);
      }
  }, [selectedEventId, events, setAddingToTrack, updateDraftEvent, clearDraftEvent]);

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
const tracksTop = `calc(50% - ${blockSize * 2}px)`;
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
            className="absolute right-0 top-0 h-full border-l-[2px] border-black bg-white pointer-events-auto z-10"
            style={{ width: blockSize * 8 }}
          >
            <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
                <div className="absolute flex justify-center items-center" style={{ left: blockSize, top: -blockSize, width: blockSize, height: blockSize }}>
                   <button 
                      tabIndex={-1}
                      onClick={handleImport}
                      className="flex items-center justify-center border-[2px] font-bold leading-none border-black transition-colors bg-white text-black hover:bg-gray-200"
                      style={{ width: blockSize * 0.7, height: blockSize * 0.7, padding: blockSize * 0.1 }}
                   >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                   </button>
               </div>
               {[0, 1, 2, 3].map(rowIndex => {
                   const isPlusCrossed = isInputsAvailable && addingToTrack !== rowIndex;
                   const isPlusActive = addingToTrack === rowIndex;

                   return (
                       <div key={rowIndex} className="relative" style={{ height: blockSize }}>
                           {/* PLUS BUTTON: Block index 1 (2nd block) left: blockSize * 1 */}
                           <div className="absolute flex justify-center items-center" style={{ left: blockSize, width: blockSize, height: blockSize }}>
                               {isPlusCrossed ? (
                                   <CrossedBox w={blockSize * 0.7} h={blockSize * 0.7} />
                               ) : (
                                   <button 
                                      tabIndex={-1}
                                      onClick={() => { if (isPlusActive) { clearDraftEvent(); selectEvent(null); } else { setAddingToTrack(rowIndex); selectEvent(null); } }}
                                      className={`flex items-center justify-center border-[2px] font-bold font-sans leading-none border-black transition-colors ${isPlusActive ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
                                      style={{ width: blockSize * 0.7, height: blockSize * 0.7, fontSize: blockSize * 0.6 }}
                                   >
                                      {isPlusActive ? '×' : '+'}
                                   </button>
                               )}
                           </div>

                           {/* Row 0: Name (blocks 2-6) left: blockSize * 2, width: blockSize * 5 */}
                           {rowIndex === 0 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={1} placeholder="Name" className={`w-full border-[2px] px-2 font-sans text-black outline-none bg-white ${nameError ? 'border-red-500' : 'border-black'}`} style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.name} onChange={e => updateDraftEvent({name: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 1: Desc (blocks 2-6) */}
                           {rowIndex === 1 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={2} placeholder="Description" className="w-full border-[2px] border-black px-2 font-sans outline-none bg-white text-black" style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.desc} onChange={e => updateDraftEvent({desc: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 2: Date (YYMMDDYYMMDD) */}
                           {rowIndex === 2 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={3} placeholder="YYMMDDYYMMDD" className={`w-full border-[2px] px-2 outline-none bg-white text-black ${draftEvent.dateStr ? 'font-mono' : 'font-sans'} ${dateError ? 'border-red-500' : 'border-black'}`} style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.dateStr} onChange={e => updateDraftEvent({dateStr: e.target.value.replace(/\D/g, '')})} onKeyDown={handleKeyDown} maxLength={12} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                           {/* Row 3: Link */}
                           {rowIndex === 3 && (
                               <div className="absolute flex items-center" style={{ left: blockSize * 2, width: blockSize * 5, height: blockSize }}>
                                   {isInputsAvailable ? (
                                       <input type="text" tabIndex={4} placeholder="Link" className="w-full border-[2px] border-black px-2 font-sans outline-none bg-white text-black" style={{ height: blockSize * 0.7, fontSize: blockSize * 0.4 }} value={draftEvent.link} onChange={e => updateDraftEvent({link: e.target.value})} onKeyDown={handleKeyDown} />
                                   ) : (
                                       <CrossedBox w="100%" h={blockSize * 0.7} />
                                   )}
                               </div>
                           )}
                       </div>
                   )
               })}
               <div className="absolute flex justify-center items-center" style={{ left: blockSize, top: blockSize * 4, width: blockSize, height: blockSize }}>
                   <button 
                      tabIndex={-1}
                      onClick={handleExport}
                      className="flex items-center justify-center border-[2px] font-bold leading-none border-black transition-colors bg-white text-black hover:bg-gray-200"
                      style={{ width: blockSize * 0.7, height: blockSize * 0.7, padding: blockSize * 0.1 }}
                   >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                   </button>
               </div>
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
            className="absolute right-0 top-0 h-full border-l-[2px] border-black bg-white pointer-events-auto z-20"
            style={{ width: blockSize * 4 }}
          >
             <div className="absolute w-full flex flex-col" style={{ top: tracksTop, height: blockSize * 4 }}>
              {tracks.map((track, i) => {
                const trackEvents = events.filter(e => e.trackIndex === i).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                const now = presentDate.getTime();
                
                let displayDateStr = '--/--/--';
                const futurePoints = [];
                trackEvents.forEach(e => {
                   const s = new Date(e.start).getTime();
                   const n = new Date(e.end).getTime();
                   if (s > now) futurePoints.push(s);
                   if (n > now) futurePoints.push(n);
                });
                futurePoints.sort((a,b) => a - b);

                if (futurePoints.length > 0) {
                    displayDateStr = format(new Date(futurePoints[0]), 'yy/MM/dd');
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
  
  const tapeTop = `calc(50% - ${blockSize * 3}px)`;

  
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const deleteEvent = useStore(s => s.deleteEvent);

  useEffect(() => {
      const handleKeyDownGlobal = (e) => {
          if (e.key === 'Control') setCtrlPressed(true);

          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
              if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
              e.preventDefault();
              if (e.shiftKey) {
                  useStore.temporal.getState().redo();
              } else {
                  useStore.temporal.getState().undo();
              }
          }

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

  
  const [eventDrag, setEventDrag] = useState(null);
  const wasEventDragged = useRef(false);
  const updateEvent = useStore(s => s.updateEvent);

  useEffect(() => {
      const handleMouseUpGlobal = () => {
          if (eventDrag) {
              const blockDiff = Math.round(eventDrag.currentDx / blockSize);
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
                  selectEvent(eventDrag.id);
              }
              setEventDrag(null);
              setTimeout(() => { wasEventDragged.current = false; }, 0); // reset after click processing
          }
      };

      const handleMouseMoveGlobal = (e) => {
          if (!eventDrag) return;
          const dx = e.clientX - eventDrag.startX;
          if (Math.abs(dx) > 3) wasEventDragged.current = true;
          const blockDiff = Math.round(dx / blockSize);
          
          const origStart = parseLocalDate(eventDrag.origStart);
          const origEnd = parseLocalDate(eventDrag.origEnd);
          let tmpStart = origStart;
          let tmpEnd = origEnd;
          
          if (eventDrag.mode === 'move') {
              tmpStart = addDays(origStart, blockDiff);
              tmpEnd = addDays(origEnd, blockDiff);
          } else if (eventDrag.mode === 'left') {
              tmpStart = addDays(origStart, blockDiff);
              if (tmpStart > tmpEnd) tmpStart = tmpEnd;
          } else if (eventDrag.mode === 'right') {
              tmpEnd = addDays(origEnd, blockDiff);
              if (tmpEnd < tmpStart) tmpEnd = tmpStart;
          }

          setEventDrag(prev => ({ ...prev, currentDx: dx, tmpStart: format(tmpStart, 'yyyy-MM-dd'), tmpEnd: format(tmpEnd, 'yyyy-MM-dd') }));
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



  const [startX, setStartX] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartX(e.clientX);
      setDragMoved(false);
  };

  const handleMouseMove = (e) => {
      if(!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) setDragMoved(true);
      setScrollOffset(scrollOffsetBlocks - (dx / blockSize));
      setStartX(e.clientX);
  };

  const handleMouseUp = (e) => {
      setIsDragging(false);
      // Wait to unselect on mouse up so we don't accidentally unselect when starting a scroll drag
      if (!dragMoved && e.target.dataset.event !== "true" && selectedEventId) {
          selectEvent(null);
      }
  };

  const handleMouseLeave = () => setIsDragging(false);

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

  // Compute selected event details
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const activeEvent = eventDrag ? events.find(e => e.id === eventDrag.id) : selectedEvent;

  const [infoWidth, setInfoWidth] = useState(0);
  const [infoNode, setInfoNode] = useState(null);

  useEffect(() => {
      if (infoNode) {
          const observer = new ResizeObserver(() => {
              setInfoWidth(infoNode.getBoundingClientRect().width);
          });
          observer.observe(infoNode);
          return () => observer.disconnect();
      }
  }, [infoNode, mode, eventDrag?.tmpStart, eventDrag?.tmpEnd]); 

  let infoLeft = 0;
  let infoTop = '0px';
  let infoMaxWidth = '100vw';
  let isDraggingActiveEvent = false;

  if (activeEvent) {
      // For popover positioning, it should stay at the original position while dragging
      const dStart = parseLocalDate(activeEvent.start);
      isDraggingActiveEvent = eventDrag && eventDrag.id === activeEvent.id;
      
      const pxLeft = timeToPx(dStart);
      const desiredLeft = pxLeft + (blockSize * 0.15);

      const leftSidebarEdge = (mode === 'edit' ? 8 : 4) * blockSize;
      const rightSidebarEdge = 32 * blockSize - ((mode === 'edit' ? 8 : 4) * blockSize);
      
      infoMaxWidth = `${rightSidebarEdge - leftSidebarEdge - (blockSize * 2)}px`;

      const leftBound = leftSidebarEdge + blockSize;
      const rightBound = rightSidebarEdge - blockSize - infoWidth;

      infoLeft = Math.max(leftBound, Math.min(desiredLeft, rightBound > leftBound ? rightBound : leftBound));
      infoTop = activeEvent.trackIndex < 2 ? `calc(25% - ${blockSize * 1.5}px)` : `calc(75% + ${blockSize * 1.5}px)`;
  }

  const marksByDate = {};
  events.forEach(e => {
      (e.markedDates || []).forEach(d => {
          if (!marksByDate[d]) marksByDate[d] = [];
          marksByDate[d].push({ trackIndex: e.trackIndex });
      });
  });

  const renderMarks = () => {
        const renderedBlocks = [];
        let keyCounter = 0;

        Object.entries(marksByDate).forEach(([dateStr, marks]) => {
            marks.sort((a, b) => a.trackIndex - b.trackIndex);
            
            let segments = [];
            if (marks.length === 0) return;
            let currentSegment = [marks[0]];
            for (let i = 1; i < marks.length; i++) {
                const prevTrack = currentSegment[currentSegment.length - 1].trackIndex;
                const currTrack = marks[i].trackIndex;
                
                let canConnect = true;
                for (let t = prevTrack + 1; t < currTrack; t++) {
                    const hasEvent = events.some(e => e.trackIndex === t && e.start <= dateStr && e.end >= dateStr);
                    if (hasEvent) {
                        canConnect = false;
                        break;
                    }
                }

                if (canConnect) {
                    currentSegment.push(marks[i]);
                } else {
                    segments.push(currentSegment);
                    currentSegment = [marks[i]];
                }
            }
            segments.push(currentSegment);

            const pxLeft = timeToPx(parseLocalDate(dateStr));
            const centerPx = pxLeft + blockSize / 2;
            const triHeight = 0.15 * blockSize; // exact altitude of 0.15 * blockSize
            const triWidth = (triHeight * 2) / Math.sqrt(3); // base of equilateral triangle

            segments.forEach(segment => {
                const startTrack = segment[0].trackIndex;
                const endTrack = segment[segment.length - 1].trackIndex;
                
                const lineTop = (startTrack + 1) * blockSize + 0.15 * blockSize;
                const lineBottom = (endTrack + 1) * blockSize + 0.85 * blockSize;

                renderedBlocks.push(
                    <div key={`mark-${keyCounter++}`} className="absolute top-0 pointer-events-none z-20">
                        {/* Top Triangle */}
                        <svg 
                            style={{ position: 'absolute', left: centerPx - triWidth / 2, top: lineTop - triHeight, width: triWidth, height: triHeight, overflow: 'visible' }}
                        >
                            <polygon 
                                points={`0,0 ${triWidth},0 ${triWidth/2},${triHeight}`} 
                                fill="none" 
                                stroke="black" 
                                strokeWidth="2" 
                                strokeLinejoin="miter"
                            />
                        </svg>
                        
                        {/* Connecting Line */}
                        <div style={{
                            position: 'absolute',
                            left: centerPx - 1,
                            top: lineTop,
                            width: 2,
                            height: lineBottom - lineTop,
                            backgroundColor: 'black'
                        }} />

                        {/* Bottom Triangle */}
                        <svg 
                            style={{ position: 'absolute', left: centerPx - triWidth / 2, top: lineBottom, width: triWidth, height: triHeight, overflow: 'visible' }}
                        >
                            <polygon 
                                points={`${triWidth/2},0 ${triWidth},${triHeight} 0,${triHeight}`} 
                                fill="none" 
                                stroke="black" 
                                strokeWidth="2" 
                                strokeLinejoin="miter"
                            />
                        </svg>
                    </div>
                );
            });
        });

        return renderedBlocks;
  };

  return (
    <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={() => setScrollOffset(0)}
        className={`absolute left-0 top-0 w-full h-full bg-white overflow-hidden z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
        {/* Background Image */}
        <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
                backgroundImage: `url(${import.meta.env.BASE_URL}alpine.jpg)`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                opacity: 0.5, 
                transform: 'scale(1)' 
            }} 
        />

        {/* Present Day Line dynamically locked to center of today's block */}
        <div
            className="absolute top-0 w-px bg-red-500 z-0 pointer-events-none"
            style={{ left: timeToPx(startOfDay(presentDate)) + (blockSize * 0.5), height: '100%' }}
        />

        <div className="absolute w-full z-10 bg-white" style={{ top: tapeTop, height: blockSize * 6 }}>
             <div className="absolute inset-0 pointer-events-none z-0">
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
                                 {/* Only draw left border if it's not Sunday (since weekends are merged, Saturday's right border = Sunday's left border removed) */}
                                 {day.getDay() !== 0 && (
                                     <div className="absolute left-0 top-0 h-full w-px bg-gray-200" />
                                 )}

                                 {/* Solid top for weekdays/weekends without markers */}
                                 {!(isFirst || isMarker) && (
                                     <div className="absolute top-0 left-0 w-full bg-black h-[2px] z-10" />
                                 )}

                                 {/* Solid bottom for weekdays */}
                                 {!isWeekend && (
                                     <div className="absolute bottom-0 left-0 w-full bg-black h-[2px] z-10" />
                                 )}

                                 {/* Dashed bottom for weekends, anchored on Saturday smoothly spanning 2 blocks */}
                                 {day.getDay() === 6 && (
                                     <div className="absolute bottom-0 left-0 border-b-[2px] border-dashed border-black h-[2px] z-10" style={{ width: blockSize * 2 }} />
                                 )}

                                 {(isFirst || isMarker) && (
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none px-1 tracking-tight z-20 select-none">
                                           <span className={`text-black ${isFirst ? 'font-bold font-sans' : 'font-normal font-mono'}`} style={{ fontSize: blockSize * 0.4 }}>
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
                const isDraggingThis = eventDrag && eventDrag.id === event.id;
                
                const startD = parseLocalDate(event.start);
                const endD = parseLocalDate(event.end);
                
                const pxLeft = timeToPx(startD);
                const pxRight = timeToPx(addDays(endD, 1)); // End edge boundary
                const widthRaw = pxRight - pxLeft;
                
                let draggingLeftOffset = 0;
                let draggingRightOffset = 0;
                if (isDraggingThis) {
                    if (eventDrag.mode === 'move') {
                        draggingLeftOffset = eventDrag.currentDx;
                        draggingRightOffset = eventDrag.currentDx;
                    } else if (eventDrag.mode === 'left') {
                        draggingLeftOffset = Math.min(eventDrag.currentDx, widthRaw);
                    } else if (eventDrag.mode === 'right') {
                        draggingRightOffset = Math.max(eventDrag.currentDx, -widthRaw);
                    }
                }

                const finalLeft = pxLeft + draggingLeftOffset + (blockSize * 0.15);
                const finalWidthRaw = widthRaw - draggingLeftOffset + draggingRightOffset;
                const rectWidth = finalWidthRaw - (blockSize * 0.30); // Pads 0.15 on both ends
                
                let hasMarkOnIt = false;
                let currDate = parseLocalDate(event.start);
                const endDate = parseLocalDate(event.end);
                while (currDate <= endDate) {
                    const dStr = format(currDate, 'yyyy-MM-dd');
                    if (marksByDate[dStr] && marksByDate[dStr].some(m => m.trackIndex === event.trackIndex)) {
                        hasMarkOnIt = true;
                        break;
                    }
                    currDate = addDays(currDate, 1);
                }

                const hasLink = !!event.link;
                let borderClass = '';
                
                if (isSelected) borderClass = 'border-[2px] border-black';
                else if (hasLink && ctrlPressed) borderClass = 'border-[2px] border-blue-500';

                const bgOpacityClass = hasMarkOnIt ? 'opacity-40 group-hover:opacity-70' : 'opacity-80 group-hover:opacity-100';
                const zIndexVal = (isSelected || (hasLink && ctrlPressed)) ? 15 : 10;

                return (
                    <div
                        key={event.id}
                        data-event="true"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (wasEventDragged.current) return;

                            const rect = e.currentTarget.getBoundingClientRect();
                            const offsetX = e.clientX - rect.left;
                            const dayOffset = Math.floor((offsetX + 0.15 * blockSize) / blockSize);
                            const clickedDate = format(addDays(parseLocalDate(event.start), dayOffset), 'yyyy-MM-dd');

                            const overlappingEvents = events.filter(ev => {
                                if (ev.trackIndex !== event.trackIndex) return false;
                                return ev.start <= clickedDate && ev.end >= clickedDate;
                            }).sort((a, b) => {
                                const startDiff = parseLocalDate(a.start).getTime() - parseLocalDate(b.start).getTime();
                                return startDiff !== 0 ? startDiff : a.id.localeCompare(b.id);
                            });

                            if (e.shiftKey) {
                                const newMarkedDates = event.markedDates?.includes(clickedDate) 
                                    ? event.markedDates.filter(d => d !== clickedDate) 
                                    : [...(event.markedDates || []), clickedDate];
                                updateEvent(event.id, { markedDates: newMarkedDates });
                                return;
                            }
                            if (ctrlPressed) {
                                const linkedEvents = overlappingEvents.filter(ev => ev.link);
                                if (linkedEvents.length > 0) {
                                    linkedEvents.forEach(ev => window.open(ev.link, '_blank'));
                                } else if (hasLink) {
                                    window.open(event.link, '_blank');
                                }
                                return;
                            }
                            
                            if (overlappingEvents.length > 1) {
                                const currentIndex = overlappingEvents.findIndex(ev => ev.id === selectedEventId);
                                if (currentIndex === -1) {
                                    selectEvent(overlappingEvents[0].id);
                                } else {
                                    const nextIndex = (currentIndex + 1) % overlappingEvents.length;
                                    selectEvent(overlappingEvents[nextIndex].id);
                                }
                            } else {
                                selectEvent(isSelected ? null : event.id); 
                            }
                        }}
                        onMouseDown={(e) => {
                            if (!isSelected) {
                                // Important: if it's not selected, we don't start drag, but we want it to be selectable. The onClick will handle selection.
                                return;
                            }
                            e.stopPropagation();
                            wasEventDragged.current = false;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const offsetX = e.clientX - rect.left;
                            let mode = 'move';
                            if (offsetX < 15) mode = 'left';
                            else if (rect.width - offsetX < 15) mode = 'right';

                            setEventDrag({
                                id: event.id,
                                mode,
                                startX: e.clientX,
                                currentDx: 0,
                                origStart: event.start,
                                origEnd: event.end,
                                tmpStart: event.start,
                                tmpEnd: event.end
                            });
                        }}
                        className={`absolute text-white font-bold tracking-wide flex items-center px-2 overflow-hidden font-sans cursor-pointer group ${borderClass}`}
                        style={{
                            left: finalLeft,
                            width: Math.max(rectWidth, blockSize * 0.1),
                            top: ((event.trackIndex + 1) * blockSize) + blockSize * 0.15,
                            height: blockSize * 0.7,
                            fontSize: blockSize * 0.35,
                            zIndex: zIndexVal
                        }}
                    >
                        <div 
                            className={`absolute inset-0 transition-opacity -z-10 group-hover:brightness-110 pointer-events-none ${bgOpacityClass}`} 
                            style={{ backgroundColor: event.color || '#000000' }} 
                        />
                        {isSelected && (
                            <>
                                <div className="absolute left-0 top-0 w-3 h-full cursor-ew-resize z-20" />
                                <div className="absolute right-0 top-0 w-3 h-full cursor-ew-resize z-20" />
                            </>
                        )}
                    </div>
                )
             })}

             {/* Visit Marks */}
             {renderMarks()}
        </div>

        {/* Selected Event Details Rendered directly on background */}
        <AnimatePresence mode="wait">
            {(selectedEvent || eventDrag) && (() => {
                const activeEv = selectedEvent || events.find(e => e.id === eventDrag.id);
                if (!activeEv) return null;
                const dStart = eventDrag ? parseLocalDate(eventDrag.tmpStart) : parseLocalDate(activeEv.start);
                const dEnd = eventDrag ? parseLocalDate(eventDrag.tmpEnd) : parseLocalDate(activeEv.end);
                
                return (
                    <motion.div
                        key={activeEv.id}
                        ref={setInfoNode}
                        initial={{ opacity: 0, left: infoLeft, top: infoTop }}
                        animate={{ opacity: 1, left: infoLeft, top: infoTop }}
                        exit={{ opacity: 0 }}
                        transition={{ opacity: { duration: 0.3 }, left: { duration: isAnimatingMode ? 0.3 : 0 }, top: { duration: isAnimatingMode ? 0.3 : 0 } }}
                        className="absolute text-black pointer-events-none z-30 font-sans flex flex-col justify-center px-2 py-1 break-words whitespace-pre-wrap select-none"
                        style={{ transform: 'translateY(-50%)', maxWidth: infoMaxWidth }}
                    >
                        <div className="font-bold mb-1" style={{ fontSize: blockSize * 0.4 }}>{activeEv.name}</div>
                        <div className="text-black mb-1" style={{ fontSize: blockSize * 0.4 }}>{activeEv.desc}</div>
                        <div className="text-black font-mono" style={{ fontSize: blockSize * 0.4 }}>
                            {format(dStart, 'yyyy/MM/dd')} - {format(dEnd, 'yyyy/MM/dd')}
                        </div>
                    </motion.div>
                )
            })()}
        </AnimatePresence>
    </div>
  );
}

