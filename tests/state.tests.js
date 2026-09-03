(function () {
  const results = document.getElementById('results');
  let passed = 0;
  let failed = 0;

  // Back up any real user data so the tests don't clobber it.
  const backup = localStorage.getItem('timetableMakerState');
  try {
    localStorage.removeItem('timetableMakerState');
  } catch (e) {
    // Ignore storage errors.
  }

  // Load a clean default state for testing.
  Timetable.State.init();

  function log(msg, ok) {
    const div = document.createElement('div');
    div.style.color = ok ? '#00e676' : '#ef4444';
    div.textContent = (ok ? '✓ ' : '✗ ') + msg;
    results.appendChild(div);
  }

  function assert(cond, msg) {
    if (cond) {
      passed++;
      log(msg, true);
    } else {
      failed++;
      log(msg, false);
    }
  }

  function section(name) {
    const h2 = document.createElement('h2');
    h2.textContent = name;
    results.appendChild(h2);
  }

  section('Colours and themes');
  assert(Timetable.Colors.all.length === 20, 'There are 20 neon colours');
  assert(Timetable.Colors.defaultColor !== undefined, 'A default colour exists');
  assert(Timetable.Themes.all.length > 0, 'There is at least one theme');
  assert(Timetable.Themes.getById('midnight-slate') !== undefined, 'Midnight Slate theme exists');

  section('Settings and defaults');
  const settings = Timetable.State.getSettings();
  assert(settings.timeFormat === '24h', 'Default time format is 24h');
  assert(settings.weekView === 'both', 'Default week view is both');
  assert(settings.theme === 'midnight-slate', 'Default theme is midnight-slate');
  assert(settings.showWeekend === false, 'Weekend hidden by default');

  section('Visible days');
  let visibleDays = Timetable.State.getVisibleDays();
  assert(visibleDays.length === 5, 'Default shows Monday to Friday');
  assert(visibleDays[4] === 'Friday', 'Friday is last visible day by default');
  Timetable.State.setSettings({ showWeekend: true });
  visibleDays = Timetable.State.getVisibleDays();
  assert(visibleDays.length === 7, 'Weekend toggle shows all 7 days');
  Timetable.State.setSettings({ showWeekend: false });

  section('Time slots');
  let slots = Timetable.State.getTimeSlots();
  assert(slots.length === 7, 'Default time slots are loaded');
  assert(slots[0].start === '09:00', 'First slot starts at 09:00');
  assert(slots[0].duration === 60, 'Period 1 duration is 60 minutes');

  const newSlot = Timetable.State.addTimeSlot({ label: 'Test Slot', start: '18:00', end: '19:00' });
  assert(Timetable.State.getTimeSlots().length === 8, 'New slot added');
  assert(newSlot.duration === 60, 'New slot duration is 60 minutes');

  try {
    Timetable.State.addTimeSlot({ label: 'Bad', start: '09:00', end: '09:00' });
    assert(false, 'Should reject end before or equal to start');
  } catch (e) {
    assert(true, 'Rejects invalid time slot');
  }

  Timetable.State.updateTimeSlot(newSlot.id, { label: 'Updated Slot' });
  assert(Timetable.State.getSlotById(newSlot.id).label === 'Updated Slot', 'Slot label updates');

  section('Classes');
  const clsA = Timetable.State.addClass({
    timeSlotId: slots[0].id,
    day: 'Monday',
    week: 'A',
    subject: 'Physics',
    teacher: 'Mr Shopland',
    location: '242',
    color: '#2979ff'
  });
  assert(clsA.subject === 'Physics', 'Class subject stored');
  assert(clsA.day === 'Monday', 'Class day stored');
  assert(Timetable.State.getClasses({ week: 'A' }).length === 1, 'Week A has one class');

  const created = Timetable.State.addClassToDays(slots[1].id, ['Tuesday', 'Wednesday', 'Thursday'], 'A', {
    subject: 'Maths',
    color: '#00e676'
  });
  assert(created.length === 3, 'Duplicate class to 3 days');
  assert(Timetable.State.getClasses({ week: 'A' }).length === 4, 'Week A now has 4 classes');

  Timetable.State.updateClass(clsA.id, { teacher: 'Mrs Press' });
  assert(Timetable.State.getClassById(clsA.id).teacher === 'Mrs Press', 'Class teacher updates');

  const duplicated = Timetable.State.duplicateWeek('A', 'B');
  assert(duplicated.length === 4, 'Week A is duplicated to Week B');
  assert(Timetable.State.getClasses({ week: 'B' }).length === 4, 'Week B has 4 classes');

  const bClass = Timetable.State.getClasses({ week: 'B' })[0];
  Timetable.State.updateClass(bClass.id, { subject: 'Different Subject' });
  assert(Timetable.State.getClassById(bClass.id).subject === 'Different Subject', 'Week B class can be changed');
  assert(Timetable.State.getClasses({ week: 'A' })[0].subject !== 'Different Subject', 'Week A is not affected');

  Timetable.State.moveClassToSlot(clsA.id, slots[2].id, 'Friday');
  const moved = Timetable.State.getClassById(clsA.id);
  assert(moved.timeSlotId === slots[2].id, 'Class moved to new time slot');
  assert(moved.day === 'Friday', 'Class moved to new day');

  Timetable.State.deleteClass(clsA.id);
  assert(Timetable.State.getClassById(clsA.id) === undefined, 'Class deleted');

  section('Cascading delete');
  const slotToDelete = slots[3].id;
  Timetable.State.addClassToDays(slotToDelete, ['Monday'], 'A', { subject: 'Temp', color: '#ff9100' });
  assert(Timetable.State.getClasses({ week: 'A' }).some(c => c.timeSlotId === slotToDelete), 'Class exists in slot');
  Timetable.State.deleteTimeSlot(slotToDelete);
  assert(!Timetable.State.getClasses({ week: 'A' }).some(c => c.timeSlotId === slotToDelete), 'Classes removed with time slot');

  section('JSON export and import');
  const currentJSON = Timetable.State.exportToJSON();
  assert(typeof currentJSON === 'string' && currentJSON.length > 0, 'State can be exported as JSON');
  const currentState = JSON.parse(currentJSON);
  assert(Array.isArray(currentState.timeSlots) && Array.isArray(currentState.classes), 'Exported JSON contains time slots and classes');

  const testImport = JSON.stringify({
    timeSlots: [{ id: 'ts-import-1', label: 'Imported Slot', start: '09:00', end: '10:00', duration: 60 }],
    classes: [{ id: 'cls-import-1', timeSlotId: 'ts-import-1', day: 'Monday', week: 'A', subject: 'Test', teacher: '', description: '', location: '', color: '#2979ff' }],
    settings: { theme: 'midnight-slate', timeFormat: '24h', weekView: 'both', showWeekend: false }
  });
  Timetable.State.importFromJSON(testImport);
  assert(Timetable.State.getTimeSlots().length === 1, 'Import replaces time slots');
  assert(Timetable.State.getClasses().length === 1, 'Import replaces classes');
  assert(Timetable.State.getClassById('cls-import-1').subject === 'Test', 'Imported class data is loaded');

  // Restore the user's saved state. If there was none, remove the test data.
  if (backup !== null) {
    localStorage.setItem('timetableMakerState', backup);
  } else {
    localStorage.removeItem('timetableMakerState');
  }

  section('Summary');
  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.style.color = failed ? '#ef4444' : '#00e676';
  summary.textContent = `${passed} passed, ${failed} failed`;
  results.appendChild(summary);
})();
