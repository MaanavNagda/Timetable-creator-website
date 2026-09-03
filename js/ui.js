(function () {
  window.Timetable = window.Timetable || {};

  const State = window.Timetable.State;
  const Colors = window.Timetable.Colors;
  const Themes = window.Timetable.Themes;

  const DAYS = State.DAYS;

  let els = null;
  let classModalMode = 'add';
  let classEditId = null;
  let slotEditId = null;
  let draggedClassId = null;

  function init() {
    els = {
      stage: document.getElementById('timetables-stage'),
      overlay: document.getElementById('modal-overlay'),
      toast: document.getElementById('toast'),
      slotModal: document.getElementById('time-slot-modal'),
      classModal: document.getElementById('class-modal'),
      themeModal: document.getElementById('theme-modal'),
      slotForm: document.getElementById('slot-form'),
      slotTitle: document.getElementById('slot-modal-title'),
      slotLabel: document.getElementById('slot-label'),
      slotStart: document.getElementById('slot-start'),
      slotEnd: document.getElementById('slot-end'),
      slotDuration: document.getElementById('slot-duration'),
      slotDelete: document.getElementById('slot-delete'),
      classForm: document.getElementById('class-form'),
      classTitle: document.getElementById('class-modal-title'),
      classSubject: document.getElementById('class-subject'),
      classTeacher: document.getElementById('class-teacher'),
      classDescription: document.getElementById('class-description'),
      classLocation: document.getElementById('class-location'),
      classColor: document.getElementById('class-color'),
      classColorGrid: document.getElementById('class-color-grid'),
      classWeek: document.getElementById('class-week'),
      classTimeSlot: document.getElementById('class-time-slot'),
      classDaysGrid: document.getElementById('class-days-grid'),
      classDaysHint: document.getElementById('class-days-hint'),
      classDelete: document.getElementById('class-delete'),
      themeGrid: document.getElementById('theme-grid'),
      timeFormatBtn: document.getElementById('time-format-toggle'),
      themeToggle: document.getElementById('theme-toggle'),
      showWeekendToggle: document.getElementById('show-weekend-toggle'),
      exportPng: document.getElementById('export-png'),
      exportPdf: document.getElementById('export-pdf'),
      exportData: document.getElementById('export-data'),
      importData: document.getElementById('import-data'),
      importDataInput: document.getElementById('import-data-input'),
      duplicateWeek: document.getElementById('duplicate-week'),
      addSlotBtn: document.getElementById('add-slot-btn')
    };

    bindHeader();
    bindSlotModal();
    bindClassModal();
    bindThemeModal();
    bindOverlayKey();

    applyTheme(State.getSettings().theme, false);
    updateTimeFormatButton();
    updateWeekSwitcher();
    updateShowWeekendButton();
    render();
  }

  /* ---------------- Header controls ---------------- */

  function bindHeader() {
    els.themeToggle.addEventListener('click', openThemeModal);
    els.timeFormatBtn.addEventListener('click', toggleTimeFormat);
    els.showWeekendToggle.addEventListener('click', toggleShowWeekend);
    els.duplicateWeek.addEventListener('click', duplicateWeekAB);
    els.exportPng.addEventListener('click', () => Timetable.Export.exportPNG());
    els.exportPdf.addEventListener('click', () => Timetable.Export.exportPDF());
    els.exportData.addEventListener('click', exportData);
    els.importData.addEventListener('click', () => els.importDataInput.click());
    els.importDataInput.addEventListener('change', importData);
    els.addSlotBtn.addEventListener('click', () => openSlotModal('add'));

    document.querySelectorAll('.week-switcher [data-week]').forEach(btn => {
      btn.addEventListener('click', () => {
        State.setSettings({ weekView: btn.dataset.week });
        updateWeekSwitcher();
        render();
      });
    });
  }

  function toggleTimeFormat() {
    const current = State.getSettings().timeFormat;
    const next = current === '24h' ? '12h' : '24h';
    State.setSettings({ timeFormat: next });
    updateTimeFormatButton();
    render();
  }

  function updateTimeFormatButton() {
    const fmt = State.getSettings().timeFormat;
    els.timeFormatBtn.textContent = fmt === '24h' ? '24h' : '12h';
    els.timeFormatBtn.title = fmt === '24h' ? 'Switch to 12-hour' : 'Switch to 24-hour';
  }

  function toggleShowWeekend() {
    const settings = State.getSettings();
    State.setSettings({ showWeekend: !settings.showWeekend });
    updateShowWeekendButton();
    render();
  }

  function updateShowWeekendButton() {
    const show = State.getSettings().showWeekend;
    els.showWeekendToggle.textContent = show ? 'Mon-Sun' : 'Mon-Fri';
    els.showWeekendToggle.title = show ? 'Hide Saturday and Sunday' : 'Show Saturday and Sunday';
  }

  function duplicateWeekAB() {
    const bClasses = State.getClasses({ week: 'B' });
    if (bClasses.length > 0) {
      const proceed = confirm('Week B already has classes. Replace them with copies of Week A?');
      if (!proceed) return;
      for (const cls of bClasses.slice()) {
        State.deleteClass(cls.id);
      }
    }

    try {
      State.duplicateWeek('A', 'B');
      render();
      showToast('Week A duplicated to Week B');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function updateWeekSwitcher() {
    const view = State.getSettings().weekView;
    document.querySelectorAll('.week-switcher [data-week]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.week === view);
    });
  }

  /* ---------------- Rendering ---------------- */

  function render() {
    const settings = State.getSettings();
    const weeks = settings.weekView === 'both' ? ['A', 'B'] : [settings.weekView];

    els.stage.innerHTML = '';
    for (const week of weeks) {
      els.stage.appendChild(renderWeek(week));
    }
  }

  function renderWeek(week) {
    const wrapper = document.createElement('div');
    wrapper.className = 'timetable-wrapper';

    const heading = document.createElement('h3');
    heading.className = 'timetable-heading';
    heading.textContent = `Week ${week}`;
    wrapper.appendChild(heading);

    const visibleDays = State.getVisibleDays();

    const grid = document.createElement('div');
    grid.className = 'timetable-grid';
    grid.classList.toggle('weekend', visibleDays.length === 7);

    // Header row
    const timeHeader = document.createElement('div');
    timeHeader.className = 'timetable-header-cell time-col';
    timeHeader.innerHTML = '<span class="time-icon">⏰</span> Time';
    grid.appendChild(timeHeader);

    for (const day of visibleDays) {
      const th = document.createElement('div');
      th.className = 'timetable-header-cell';
      th.textContent = day.slice(0, 3);
      th.title = day;
      grid.appendChild(th);
    }

    // Rows
    const slots = State.getTimeSlots();
    const classes = State.getClasses({ week });

    for (const slot of slots) {
      const timeCell = document.createElement('div');
      timeCell.className = 'time-slot-cell';

      const label = document.createElement('div');
      label.className = 'slot-label';
      label.textContent = slot.label;

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = formatTimeRange(slot.start, slot.end);

      const actions = document.createElement('div');
      actions.className = 'slot-actions';
      actions.innerHTML = `
        <button type="button" class="slot-action-btn edit" data-slot-id="${slot.id}" title="Edit">✎</button>
        <button type="button" class="slot-action-btn delete" data-slot-id="${slot.id}" title="Delete">🗑</button>
      `;

      timeCell.appendChild(label);
      timeCell.appendChild(time);
      timeCell.appendChild(actions);
      grid.appendChild(timeCell);

      for (const day of visibleDays) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.dataset.day = day;
        cell.dataset.slot = slot.id;
        cell.dataset.week = week;

        const cls = classes.find(c => c.timeSlotId === slot.id && c.day === day);
        if (cls) {
          cell.appendChild(renderClassCard(cls));
        }

        cell.addEventListener('click', (e) => {
          if (e.target.closest('.class-card') || e.target.closest('.slot-action-btn')) return;
          openClassModal('add', { timeSlotId: slot.id, day, week });
        });

        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', handleDragLeave);
        cell.addEventListener('drop', handleDrop);

        grid.appendChild(cell);
      }
    }

    grid.querySelectorAll('.slot-action-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSlotModal('edit', btn.dataset.slotId);
      });
    });

    grid.querySelectorAll('.slot-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this time slot and all its classes?')) {
          try {
            State.deleteTimeSlot(btn.dataset.slotId);
            render();
            showToast('Time slot deleted');
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });

    wrapper.appendChild(grid);
    return wrapper;
  }

  function renderClassCard(cls) {
    const color = cls.color || Colors.defaultColor.hex;
    const card = document.createElement('div');
    card.className = 'class-card';
    card.draggable = true;
    card.dataset.classId = cls.id;
    card.style.setProperty('--subject-color', color);
    card.style.setProperty('--subject-bg', Colors.hexToRgba(color, 0.18));

    const subject = document.createElement('div');
    subject.className = 'subject';
    subject.textContent = cls.subject;
    card.appendChild(subject);

    if (cls.description) {
      const d = document.createElement('div');
      d.className = 'detail description';
      d.textContent = cls.description;
      card.appendChild(d);
    }

    if (cls.teacher) {
      const t = document.createElement('div');
      t.className = 'detail teacher';
      t.textContent = cls.teacher;
      card.appendChild(t);
    }

    if (cls.location) {
      const l = document.createElement('div');
      l.className = 'detail location';
      l.textContent = cls.location;
      card.appendChild(l);
    }

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openClassModal('edit', { classId: cls.id });
    });

    card.addEventListener('dragstart', (e) => {
      draggedClassId = cls.id;
      e.dataTransfer.setData('text/plain', cls.id);
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      draggedClassId = null;
      card.style.opacity = '1';
      document.querySelectorAll('.day-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
    });

    return card;
  }

  /* ---------------- Drag and drop ---------------- */

  function handleDragOver(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    const slot = cell.dataset.slot;
    const day = cell.dataset.day;
    const week = cell.dataset.week;
    const draggedId = draggedClassId || e.dataTransfer.getData('text/plain');

    if (!draggedId) return;
    const draggedClass = State.getClassById(draggedId);
    if (!draggedClass || draggedClass.week !== week) return;

    const existing = State.getClasses({ week }).find(c => c.timeSlotId === slot && c.day === day && c.id !== draggedId);
    if (existing) return;

    cell.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const cell = e.currentTarget;
    cell.classList.remove('drag-over');

    const classId = e.dataTransfer.getData('text/plain');
    if (!classId) return;

    const slotId = cell.dataset.slot;
    const day = cell.dataset.day;
    const week = cell.dataset.week;
    const cls = State.getClassById(classId);

    if (!cls || cls.week !== week) {
      showToast('Cannot move a class to a different week', true);
      return;
    }

    const existing = State.getClasses({ week }).find(c => c.timeSlotId === slotId && c.day === day && c.id !== classId);
    if (existing) {
      showToast('That slot is already occupied', true);
      return;
    }

    try {
      State.moveClassToSlot(classId, slotId, day);
      render();
      showToast('Class moved');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  /* ---------------- Time slot modal ---------------- */

  function bindSlotModal() {
    const { slotStart, slotEnd } = els;

    [slotStart, slotEnd].forEach(input => {
      input.addEventListener('input', updateSlotDuration);
    });

    els.slotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = els.slotLabel.value;
      const start = els.slotStart.value;
      const end = els.slotEnd.value;

      try {
        if (slotEditId) {
          State.updateTimeSlot(slotEditId, { label, start, end });
          showToast('Time slot updated');
        } else {
          State.addTimeSlot({ label, start, end });
          showToast('Time slot added');
        }
        closeModals();
        render();
      } catch (err) {
        showToast(err.message, true);
      }
    });

    els.slotDelete.addEventListener('click', () => {
      if (!slotEditId) return;
      if (confirm('Delete this time slot and all its classes?')) {
        try {
          State.deleteTimeSlot(slotEditId);
          closeModals();
          render();
          showToast('Time slot deleted');
        } catch (err) {
          showToast(err.message, true);
        }
      }
    });

    document.querySelectorAll('[data-close-slot]').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });
  }

  function openSlotModal(mode, id = null) {
    slotEditId = mode === 'edit' ? id : null;
    els.slotForm.reset();
    els.slotDelete.classList.toggle('hidden', mode !== 'edit');
    els.slotTitle.textContent = mode === 'edit' ? '⏰ Edit Time Slot' : '⏰ Add Time Slot';
    updateSlotDuration();

    if (mode === 'edit' && id) {
      const slot = State.getSlotById(id);
      if (!slot) return;
      els.slotLabel.value = slot.label;
      els.slotStart.value = slot.start;
      els.slotEnd.value = slot.end;
      updateSlotDuration();
    } else {
      const slots = State.getTimeSlots();
      if (slots.length > 0) {
        const last = slots[slots.length - 1];
        els.slotStart.value = last.end;
        const endMin = State.minutesFromTime(last.end) + 60;
        const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
        const endM = (endMin % 60).toString().padStart(2, '0');
        els.slotEnd.value = `${endH}:${endM}`;
        updateSlotDuration();
      }
    }

    showModal(els.slotModal);
  }

  function updateSlotDuration() {
    const start = els.slotStart.value;
    const end = els.slotEnd.value;
    const mins = State.computeDuration(start, end);
    els.slotDuration.textContent = `Duration: ${mins} minute${mins === 1 ? '' : 's'}`;
  }

  /* ---------------- Class modal ---------------- */

  function bindClassModal() {
    els.classForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveClassForm();
    });

    els.classDelete.addEventListener('click', () => {
      if (!classEditId) return;
      if (confirm('Delete this class?')) {
        try {
          State.deleteClass(classEditId);
          closeModals();
          render();
          showToast('Class deleted');
        } catch (err) {
          showToast(err.message, true);
        }
      }
    });

    document.querySelectorAll('[data-close-class]').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });
  }

  function openClassModal(mode, options = {}) {
    classModalMode = mode;
    classEditId = options.classId || null;
    els.classForm.reset();
    els.classColorGrid.innerHTML = '';
    els.classDaysGrid.innerHTML = '';
    populateColorGrid(null);
    populateTimeSlotSelect(options.timeSlotId || null);
    populateDaysGrid(options.day ? [options.day] : [], mode);

    els.classTitle.textContent = mode === 'edit' ? '✎ Edit Class' : '➕ Add New Class';
    els.classDelete.classList.toggle('hidden', mode !== 'edit');
    els.classDaysHint.textContent = mode === 'edit'
      ? 'Change the day for this class.'
      : 'A class will be created for each selected day.';

    if (mode === 'edit' && classEditId) {
      const cls = State.getClassById(classEditId);
      if (!cls) return;
      els.classSubject.value = cls.subject;
      els.classTeacher.value = cls.teacher;
      els.classDescription.value = cls.description;
      els.classLocation.value = cls.location;
      els.classColor.value = cls.color;
      els.classWeek.value = cls.week;
      els.classTimeSlot.value = cls.timeSlotId;
      populateColorGrid(cls.color);
      populateDaysGrid([cls.day], 'edit');
    } else {
      const weekView = State.getSettings().weekView;
      const week = options.week || (weekView === 'both' ? 'A' : weekView);
      els.classWeek.value = week;
      if (options.timeSlotId) {
        els.classTimeSlot.value = options.timeSlotId;
      }
      if (options.day) {
        populateDaysGrid([options.day], 'add');
      }
    }

    showModal(els.classModal);
  }

  function saveClassForm() {
    const subject = els.classSubject.value.trim();
    const teacher = els.classTeacher.value.trim();
    const description = els.classDescription.value.trim();
    const location = els.classLocation.value.trim();
    const color = els.classColor.value || Colors.defaultColor.hex;
    const week = els.classWeek.value;
    const timeSlotId = els.classTimeSlot.value;

    const selectedDays = getSelectedDays();
    if (selectedDays.length === 0) {
      showToast('Please select at least one day.', true);
      return;
    }
    if (!timeSlotId) {
      showToast('Please select a time slot.', true);
      return;
    }

    const fields = { subject, teacher, description, location, color };

    try {
      if (classModalMode === 'edit' && classEditId) {
        State.updateClass(classEditId, {
          ...fields,
          day: selectedDays[0],
          week,
          timeSlotId
        });
        showToast('Class updated');
      } else {
        State.addClassToDays(timeSlotId, selectedDays, week, fields);
        showToast(`Class added to ${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'}`);
      }
      closeModals();
      render();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function getSelectedDays() {
    return Array.from(els.classDaysGrid.querySelectorAll('input[type="checkbox"]:checked'))
      .map(input => input.value);
  }

  function populateColorGrid(selectedHex) {
    els.classColorGrid.innerHTML = '';
    let selectedValue = selectedHex || Colors.defaultColor.hex;

    Colors.all.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color.hex;
      swatch.dataset.hex = color.hex;
      swatch.title = color.name;

      if (color.hex.toLowerCase() === selectedValue.toLowerCase()) {
        swatch.classList.add('selected');
        els.classColor.value = color.hex;
      }

      swatch.addEventListener('click', () => {
        els.classColorGrid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        els.classColor.value = color.hex;
      });

      els.classColorGrid.appendChild(swatch);
    });
  }

  function populateDaysGrid(selected, mode) {
    els.classDaysGrid.innerHTML = '';

    const daysToShow = mode === 'edit' ? State.DAYS : State.getVisibleDays();
    daysToShow.forEach(day => {
      const label = document.createElement('label');
      label.className = 'day-checkbox';
      label.dataset.day = day;

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = day;
      input.dataset.day = day;
      input.checked = selected && selected.includes(day);

      if (input.checked) label.classList.add('selected');

      input.addEventListener('change', () => {
        if (mode === 'edit') {
          // Single-select in edit mode
          els.classDaysGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = cb === input;
            cb.closest('.day-checkbox').classList.toggle('selected', cb.checked);
          });
        } else {
          label.classList.toggle('selected', input.checked);
        }
      });

      const text = document.createElement('span');
      text.textContent = day;

      label.appendChild(input);
      label.appendChild(text);
      els.classDaysGrid.appendChild(label);
    });
  }

  function populateTimeSlotSelect(selectedId) {
    els.classTimeSlot.innerHTML = '';
    const slots = State.getTimeSlots();
    if (slots.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'No time slots — add one first';
      opt.value = '';
      els.classTimeSlot.appendChild(opt);
      return;
    }
    for (const slot of slots) {
      const opt = document.createElement('option');
      opt.value = slot.id;
      opt.textContent = `${slot.label} (${formatTimeRange(slot.start, slot.end)})`;
      if (slot.id === selectedId) opt.selected = true;
      els.classTimeSlot.appendChild(opt);
    }
  }

  /* ---------------- Theme modal ---------------- */

  function bindThemeModal() {
    document.querySelectorAll('[data-close-theme]').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });
  }

  function openThemeModal() {
    els.themeGrid.innerHTML = '';
    const current = State.getSettings().theme;

    Themes.all.forEach(theme => {
      const card = document.createElement('div');
      card.className = `theme-card ${theme.id === current ? 'selected' : ''}`;
      card.dataset.themeId = theme.id;

      const preview = document.createElement('div');
      preview.className = `theme-preview theme-${theme.id}`;

      const info = document.createElement('div');
      info.className = 'theme-info';
      info.innerHTML = `<div class="theme-name">${theme.name}</div><div class="theme-type">${theme.type}</div>`;

      card.appendChild(preview);
      card.appendChild(info);

      card.addEventListener('click', () => {
        State.setSettings({ theme: theme.id });
        applyTheme(theme.id);
        closeModals();
        showToast(`Theme changed to ${theme.name}`);
      });

      els.themeGrid.appendChild(card);
    });

    showModal(els.themeModal);
  }

  function exportData() {
    const json = Timetable.State.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Timetable exported as JSON');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        Timetable.State.importFromJSON(event.target.result);
        applyTheme(State.getSettings().theme);
        updateTimeFormatButton();
        updateWeekSwitcher();
        updateShowWeekendButton();
        render();
        showToast('Timetable imported successfully');
      } catch (err) {
        showToast(err.message, true);
      }
    };
    reader.onerror = () => showToast('Could not read the selected file', true);
    reader.readAsText(file);
    e.target.value = '';
  }

  function applyTheme(themeId, reRender = false) {
    const stage = els ? els.stage : document.getElementById('timetables-stage');
    if (!stage) return;

    const allThemeClasses = Themes.all.map(t => `theme-${t.id}`);
    stage.classList.remove(...allThemeClasses);
    stage.classList.add(`theme-${themeId}`);

    if (reRender) render();
  }

  /* ---------------- Modal helpers ---------------- */

  function showModal(modal) {
    [els.slotModal, els.classModal, els.themeModal].forEach(m => m.classList.add('hidden'));
    modal.classList.remove('hidden');
    els.overlay.classList.remove('hidden');
  }

  function closeModals() {
    els.overlay.classList.add('hidden');
    [els.slotModal, els.classModal, els.themeModal].forEach(m => m.classList.add('hidden'));
    slotEditId = null;
    classEditId = null;
  }

  function bindOverlayKey() {
    els.overlay.addEventListener('click', (e) => {
      if (e.target === els.overlay) closeModals();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !els.overlay.classList.contains('hidden')) {
        closeModals();
      }
    });
  }

  /* ---------------- Time formatting ---------------- */

  function formatTimeRange(start, end) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  function formatTime(time) {
    if (!time) return '';
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';

    if (State.getSettings().timeFormat === '24h') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /* ---------------- Toast ---------------- */

  let toastTimeout = null;

  function showToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    els.toast.textContent = message;
    els.toast.classList.toggle('error', isError);
    els.toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      els.toast.classList.add('hidden');
    }, 3000);
  }

  window.Timetable.UI = {
    init,
    render,
    applyTheme,
    showToast
  };
})();
