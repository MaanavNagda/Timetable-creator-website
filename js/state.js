(function () {
  window.Timetable = window.Timetable || {};

  const STORAGE_KEY = 'timetableMakerState';

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const WEEKS = ['A', 'B'];

  const DEFAULT_TIME_SLOTS_DATA = [
    { label: 'Period 1', start: '09:00', end: '10:00' },
    { label: 'Period 2', start: '10:00', end: '11:00' },
    { label: 'Period 3', start: '11:00', end: '12:00' },
    { label: 'Period 4', start: '12:00', end: '13:00' },
    { label: 'Lunch', start: '13:00', end: '14:00' },
    { label: 'Period 5', start: '14:00', end: '15:00' },
    { label: 'Period 6', start: '15:00', end: '16:00' }
  ];

  const DEFAULT_SETTINGS = {
    theme: 'midnight-slate',
    timeFormat: '24h',
    weekView: 'both',
    showWeekend: false
  };

  let state = null;

  function generateId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function computeDuration(start, end) {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if ([h1, m1, h2, m2].some(Number.isNaN)) return 0;
    const startMin = h1 * 60 + m1;
    const endMin = h2 * 60 + m2;
    return Math.max(0, endMin - startMin);
  }

  function sortTimeSlots(slots) {
    return slots.slice().sort((a, b) => {
      const aMins = minutesFromTime(a.start);
      const bMins = minutesFromTime(b.start);
      return aMins - bMins;
    });
  }

  function minutesFromTime(time) {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  }

  function createDefaultState() {
    const timeSlots = DEFAULT_TIME_SLOTS_DATA.map(s => ({
      ...s,
      id: generateId('ts'),
      duration: computeDuration(s.start, s.end)
    }));
    return {
      timeSlots,
      classes: [],
      settings: { ...DEFAULT_SETTINGS }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.timeSlots) && Array.isArray(parsed.classes) && parsed.settings) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved state', e);
    }
    return createDefaultState();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save timetable state', e);
    }
  }

  function init() {
    state = load();
    if (!state.settings) state.settings = { ...DEFAULT_SETTINGS };
    if (!state.classes) state.classes = [];
    if (typeof state.settings.showWeekend === 'undefined') {
      state.settings.showWeekend = DEFAULT_SETTINGS.showWeekend;
    }
    state.timeSlots = sortTimeSlots(state.timeSlots.map(s => ({
      ...s,
      duration: computeDuration(s.start, s.end)
    })));
    save();
    return state;
  }

  function getState() { return state; }
  function getSettings() { return state.settings; }

  function exportToJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importFromJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid timetable file.');
    if (!Array.isArray(parsed.timeSlots)) throw new Error('Missing time slots.');
    if (!Array.isArray(parsed.classes)) throw new Error('Missing classes.');
    if (!parsed.settings || typeof parsed.settings !== 'object') throw new Error('Missing settings.');

    state = {
      timeSlots: sortTimeSlots(parsed.timeSlots.map(s => ({
        ...s,
        duration: computeDuration(s.start, s.end)
      }))),
      classes: parsed.classes,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
    };

    if (typeof state.settings.showWeekend === 'undefined') {
      state.settings.showWeekend = DEFAULT_SETTINGS.showWeekend;
    }

    save();
    return state;
  }

  function setSettings(patch) {
    Object.assign(state.settings, patch);
    save();
  }

  function getTimeSlots() { return state.timeSlots; }
  function getVisibleDays() { return state.settings.showWeekend ? DAYS : DAYS.slice(0, 5); }
  function getSlotById(id) { return state.timeSlots.find(s => s.id === id); }

  function validateTimeSlot(slot) {
    if (!slot.label || !slot.label.trim()) throw new Error('Label is required.');
    if (!slot.start || !slot.end) throw new Error('Start and end times are required.');
    if (slot.start >= slot.end) throw new Error('End time must be after start time.');
    return true;
  }

  function addTimeSlot(slot) {
    validateTimeSlot(slot);
    const newSlot = {
      id: generateId('ts'),
      label: slot.label.trim(),
      start: slot.start,
      end: slot.end,
      duration: computeDuration(slot.start, slot.end)
    };
    state.timeSlots.push(newSlot);
    state.timeSlots = sortTimeSlots(state.timeSlots);
    save();
    return newSlot;
  }

  function updateTimeSlot(id, patch) {
    const slot = getSlotById(id);
    if (!slot) throw new Error('Time slot not found.');
    const merged = { ...slot, ...patch };
    validateTimeSlot(merged);
    slot.label = merged.label.trim();
    slot.start = merged.start;
    slot.end = merged.end;
    slot.duration = computeDuration(slot.start, slot.end);
    state.timeSlots = sortTimeSlots(state.timeSlots);
    save();
    return slot;
  }

  function deleteTimeSlot(id) {
    const index = state.timeSlots.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Time slot not found.');
    state.timeSlots.splice(index, 1);
    state.classes = state.classes.filter(c => c.timeSlotId !== id);
    save();
  }

  function getAllClasses() { return state.classes; }

  function getClasses(filter) {
    if (filter && filter.week && filter.week !== 'both') {
      return state.classes.filter(c => c.week === filter.week).slice();
    }
    return state.classes.slice();
  }

  function getClassById(id) { return state.classes.find(c => c.id === id); }

  function validateClass(cls) {
    if (!cls.subject || !cls.subject.trim()) throw new Error('Subject is required.');
    if (!cls.day || !DAYS.includes(cls.day)) throw new Error('A valid day is required.');
    if (!cls.timeSlotId) throw new Error('A time slot is required.');
    if (!cls.week || !WEEKS.includes(cls.week)) throw new Error('A valid week is required.');
    return true;
  }

  function getDefaultColorHex() {
    if (window.Timetable && window.Timetable.Colors && window.Timetable.Colors.defaultColor) {
      return window.Timetable.Colors.defaultColor.hex;
    }
    return '#2979ff';
  }

  function addClass(cls) {
    validateClass(cls);
    const newClass = {
      id: generateId('cls'),
      timeSlotId: cls.timeSlotId,
      day: cls.day,
      week: cls.week,
      subject: cls.subject.trim(),
      teacher: (cls.teacher || '').trim(),
      description: (cls.description || '').trim(),
      location: (cls.location || '').trim(),
      color: cls.color || getDefaultColorHex()
    };
    state.classes.push(newClass);
    save();
    return newClass;
  }

  function updateClass(id, patch) {
    const cls = getClassById(id);
    if (!cls) throw new Error('Class not found.');
    const merged = { ...cls, ...patch };
    validateClass(merged);
    cls.timeSlotId = merged.timeSlotId;
    cls.day = merged.day;
    cls.week = merged.week;
    cls.subject = merged.subject.trim();
    cls.teacher = (merged.teacher || '').trim();
    cls.description = (merged.description || '').trim();
    cls.location = (merged.location || '').trim();
    cls.color = merged.color;
    save();
    return cls;
  }

  function deleteClass(id) {
    const index = state.classes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Class not found.');
    state.classes.splice(index, 1);
    save();
  }

  function addClassToDays(timeSlotId, days, week, fields) {
    if (!Array.isArray(days) || days.length === 0) throw new Error('At least one day is required.');
    const created = [];
    for (const day of days) {
      created.push(addClass({ ...fields, timeSlotId, day, week }));
    }
    return created;
  }

  function moveClassToSlot(id, timeSlotId, day) {
    const cls = getClassById(id);
    if (!cls) throw new Error('Class not found.');
    if (!getSlotById(timeSlotId)) throw new Error('Time slot not found.');
    if (!DAYS.includes(day)) throw new Error('Invalid day.');
    cls.timeSlotId = timeSlotId;
    cls.day = day;
    save();
    return cls;
  }

  function duplicateWeek(from, to) {
    if (!WEEKS.includes(from) || !WEEKS.includes(to)) throw new Error('Invalid week.');
    if (from === to) throw new Error('Cannot duplicate a week onto itself.');
    const created = [];
    for (const cls of getClasses({ week: from })) {
      created.push(addClass({ ...cls, week: to }));
    }
    return created;
  }

  function reset() {
    state = createDefaultState();
    save();
  }

  window.Timetable.State = {
    DAYS,
    WEEKS,
    STORAGE_KEY,
    init,
    load,
    save,
    getState,
    getSettings,
    setSettings,
    exportToJSON,
    importFromJSON,
    getTimeSlots,
    getVisibleDays,
    getSlotById,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getAllClasses,
    getClasses,
    getClassById,
    addClass,
    updateClass,
    deleteClass,
    addClassToDays,
    duplicateWeek,
    moveClassToSlot,
    computeDuration,
    sortTimeSlots,
    minutesFromTime,
    reset
  };
})();
