import { create } from 'zustand';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';
import { addDays, startOfDay, differenceInDays } from 'date-fns';
import { persist } from 'zustand/middleware';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const useStore = create(
  persist(
    temporal((set) => ({
      mode: 'default', // 'default' | 'edit'
      toggleMode: () => set((state) => ({ mode: state.mode === 'default' ? 'edit' : 'default' })),

      tracks: [
        { id: 't1', title: 'Track 1', color: '#aaaaaa' },
        { id: 't2', title: 'Track 2', color: '#bbbbbb' },
        { id: 't3', title: 'Track 3', color: '#cccccc' },
        { id: 't4', title: 'Track 4', color: '#dddddd' },
      ],
      updateTrackTitle: (index, title) => set((state) => {
        const newTracks = [...state.tracks];
        newTracks[index].title = title;
        return { tracks: newTracks };
      }),
      updateTrackColor: (index, color) => set((state) => {
        const newTracks = [...state.tracks];
        newTracks[index].color = color;
        return { tracks: newTracks };
      }),

      events: [],
      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: uuidv4() }]
      })),
      updateEvent: (id, updatedEvent) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updatedEvent } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),

      selectedEventId: null,
      selectEvent: (id) => set({ selectedEventId: id }),

      presentDate: startOfDay(new Date()),
      msPerBlock: MS_PER_DAY,

      zoomScale: (multiplier) => set((state) => {
          const newMs = state.msPerBlock * multiplier;
          const clampedMs = Math.max(1000 * 60 * 60, Math.min(MS_PER_DAY * 90, newMs));
          return { msPerBlock: clampedMs };
      }),

      scrollOffsetBlocks: 0,
      setScrollOffset: (val) => set({ scrollOffsetBlocks: val }),

      addingToTrack: null,
      setAddingToTrack: (index) => set({ addingToTrack: index }),
      draftEvent: { name: '', desc: '', dateStr: '', link: '' },
      updateDraftEvent: (data) => set((state) => ({ draftEvent: { ...state.draftEvent, ...data } })),
      clearDraftEvent: () => set({ draftEvent: { name: '', desc: '', dateStr: '', link: '' }, addingToTrack: null }),
    }), {
      partialize: (state) => ({
        events: state.events
      }),
      equality: (pastState, currentState) => {
        return pastState.events === currentState.events;
      }
    }),
    {
      name: 'span-storage',
      partialize: (state) => ({ tracks: state.tracks, events: state.events }),
    }
  )
);

export default useStore;
