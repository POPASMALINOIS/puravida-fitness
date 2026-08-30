(() => {
  const VERSION = '2.4.44';
  const STORAGE_KEY = 'rageCalendarZoomV244';
  const BASE_SLOT = 42;
  const TOTAL_SLOTS = 36; // 06:00 a 24:00 en tramos de 30 minutos.
  const MIN_SLOT = 12;
  const MAX_SLOT = 68;
  const STEP = 2;

  let state = loadState();
  let appliedSlot = BASE_SLOT;
  let resizeTimer = null;
  let applying = false;

  function clamp(value, min = MIN_SLOT, max = MAX_SLOT) {
    const number = Number(value);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? number : BASE_SLOT));
  }

  function isAndroidTabletLayout() {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    return coarse && shortSide >= 600;
  }

  function defaultState() {
    return {
      mode: isAndroidTabletLayout() ? 'fit' : 'manual',
      slot: BASE_SLOT,
      lastManual: BASE_SLOT
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || !['fit', 'manual'].includes(saved.mode)) return defaultState();
      return {
        mode: saved.mode,
        slot: clamp(saved.slot),
        lastManual: clamp(saved.lastManual ?? saved.slot)
      };
    } catch (_) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function calendarElement() {
    return document.querySelector('#resumen-section .week-calendar-fixed');
  }

  function panelElement() {
    return document.querySelector('#resumen-section .calendario-panel');
  }

  function baseSlotFromDom(calendar) {
    const first = calendar?.querySelector('.week-hour-fixed');
    return parseFloat(first?.style.height) || BASE_SLOT;
  }

  function availableCalendarHeight(calendar) {
    if (!calendar) return 620;

    const style = getComputedStyle(calendar);
    const cssMax = parseFloat(style.maxHeight);
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop || 0;
    const viewportBottom = viewportTop + (viewport?.height || window.innerHeight || 800);
    const rect = calendar.getBoundingClientRect();
    const bottomReserve = window.innerWidth <= 760 ? 80 : 14;
    const viewportAvailable = viewportBottom - Math.max(rect.top, viewportTop) - bottomReserve;

    const candidates = [cssMax, viewportAvailable].filter(value => Number.isFinite(value) && value > 260);
    if (!candidates.length) return Math.max(360, window.innerHeight - 240);
    return Math.max(320, Math.min(...candidates));
  }

  function fitSlot(calendar) {
    const headerHeight = calendar?.querySelector('.week-header-fixed')?.offsetHeight || 46;
    const usable = availableCalendarHeight(calendar) - headerHeight - 18;
    const value = Math.floor((usable / TOTAL_SLOTS) * 10) / 10;
    return clamp(value, MIN_SLOT, BASE_SLOT);
  }

  function annotateCalendar(calendar) {
    if (!calendar) return;
    const base = baseSlotFromDom(calendar);

    calendar.querySelectorAll('.week-day-column-fixed').forEach(column => {
      column.querySelectorAll('.week-slot-fixed').forEach((slot, index) => {
        slot.dataset.rageSlotIndex = String(index);
      });
    });

    calendar.querySelectorAll('.week-event-fixed').forEach(event => {
      if (event.dataset.rageStartSlots && event.dataset.rageDurationSlots) return;
      const top = parseFloat(event.style.top) || 3;
      const height = parseFloat(event.style.height) || Math.max(1, base - 6);
      event.dataset.rageStartSlots = String(Math.max(0, (top - 3) / base));
      event.dataset.rageDurationSlots = String(Math.max(0.5, (height + 6) / base));
    });
  }

  function zoomAnchor(calendar, oldSlot) {
    if (!calendar || !oldSlot) return null;
    const headerHeight = calendar.querySelector('.week-header-fixed')?.offsetHeight || 0;
    const visibleBody = Math.max(1, calendar.clientHeight - headerHeight);
    return (calendar.scrollTop + visibleBody / 2) / oldSlot;
  }

  function restoreAnchor(calendar, anchor, newSlot) {
    if (!calendar || anchor == null) return;
    const headerHeight = calendar.querySelector('.week-header-fixed')?.offsetHeight || 0;
    const visibleBody = Math.max(1, calendar.clientHeight - headerHeight);
    calendar.scrollTop = Math.max(0, anchor * newSlot - visibleBody / 2);
  }

  function updateControls(slot) {
    const controls = document.querySelector('.rage-calendar-zoom');
    if (!controls) return;
    const range = controls.querySelector('[data-rage-zoom-range]');
    const output = controls.querySelector('[data-rage-zoom-output]');
    const fit = controls.querySelector('[data-rage-zoom-fit]');
    if (range) range.value = String(Math.round(slot));
    if (output) {
      output.value = `${Math.round((slot / BASE_SLOT) * 100)}%`;
      output.textContent = output.value;
    }
    if (fit) {
      fit.classList.toggle('is-active', state.mode === 'fit');
      fit.setAttribute('aria-pressed', state.mode === 'fit' ? 'true' : 'false');
    }
  }

  function applyZoom({ preserve = true } = {}) {
    if (applying) return;
    const calendar = calendarElement();
    const panel = panelElement();
    if (!calendar || !panel) return;

    applying = true;
    try {
      annotateCalendar(calendar);
      const oldSlot = appliedSlot || BASE_SLOT;
      const anchor = preserve && state.mode !== 'fit' ? zoomAnchor(calendar, oldSlot) : null;
      const slot = state.mode === 'fit' ? fitSlot(calendar) : clamp(state.slot);
      const bodyHeight = TOTAL_SLOTS * slot;
      const gap = slot < 18 ? 1 : slot < 28 ? 2 : 3;

      panel.classList.toggle('rage-calendar-fit', state.mode === 'fit');
      panel.classList.toggle('rage-calendar-compact', slot < 28);
      panel.classList.toggle('rage-calendar-dense', slot < 18);
      panel.classList.toggle('rage-calendar-spacious', slot > 50);
      panel.style.setProperty('--rage-calendar-slot', `${slot}px`);

      if (state.mode === 'fit') {
        const height = availableCalendarHeight(calendar);
        calendar.style.height = `${height}px`;
      } else {
        calendar.style.removeProperty('height');
      }

      calendar.querySelectorAll('.week-hour-fixed').forEach(hour => {
        hour.style.height = `${slot}px`;
      });

      const body = calendar.querySelector('.week-body-fixed');
      const hours = calendar.querySelector('.week-hours-fixed');
      if (body) body.style.height = `${bodyHeight}px`;
      if (hours) hours.style.height = `${bodyHeight}px`;

      calendar.querySelectorAll('.week-day-column-fixed').forEach(column => {
        column.style.height = `${bodyHeight}px`;
        column.querySelectorAll('.week-slot-fixed').forEach((cell, index) => {
          const slotIndex = Number(cell.dataset.rageSlotIndex ?? index);
          cell.style.top = `${slotIndex * slot}px`;
          cell.style.height = `${slot}px`;
        });
      });

      calendar.querySelectorAll('.week-event-fixed').forEach(event => {
        const start = Number(event.dataset.rageStartSlots || 0);
        const duration = Number(event.dataset.rageDurationSlots || 1);
        event.style.top = `${start * slot + gap}px`;
        event.style.height = `${Math.max(4, duration * slot - gap * 2)}px`;
      });

      appliedSlot = slot;
      updateControls(slot);

      if (state.mode === 'fit') calendar.scrollTop = 0;
      else if (anchor != null) requestAnimationFrame(() => restoreAnchor(calendar, anchor, slot));
    } finally {
      applying = false;
    }
  }

  function setManualSlot(value, preserve = true) {
    const slot = clamp(value);
    state.mode = 'manual';
    state.slot = slot;
    state.lastManual = slot;
    saveState();
    applyZoom({ preserve });
  }

  function toggleFit() {
    if (state.mode === 'fit') {
      state.mode = 'manual';
      state.slot = clamp(state.lastManual || BASE_SLOT);
    } else {
      state.lastManual = clamp(state.slot || appliedSlot || BASE_SLOT);
      state.mode = 'fit';
    }
    saveState();
    applyZoom({ preserve: false });
  }

  function bindPinch(calendar) {
    if (!calendar || calendar.dataset.rageCalendarPinch === '1') return;
    calendar.dataset.rageCalendarPinch = '1';

    let pinch = null;
    let pendingSlot = null;
    let frame = null;

    const distance = touches => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    calendar.addEventListener('touchstart', event => {
      if (event.touches.length !== 2) return;
      pinch = {
        distance: distance(event.touches),
        slot: appliedSlot || BASE_SLOT
      };
      state.mode = 'manual';
      state.lastManual = pinch.slot;
    }, { passive: true });

    calendar.addEventListener('touchmove', event => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      const ratio = distance(event.touches) / Math.max(1, pinch.distance);
      pendingSlot = clamp(pinch.slot * ratio);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        state.slot = pendingSlot;
        state.lastManual = pendingSlot;
        applyZoom({ preserve: true });
      });
    }, { passive: false });

    const finish = event => {
      if (!pinch || event.touches.length >= 2) return;
      pinch = null;
      if (pendingSlot != null) {
        state.slot = clamp(pendingSlot);
        state.lastManual = state.slot;
        saveState();
      }
      pendingSlot = null;
    };

    calendar.addEventListener('touchend', finish, { passive: true });
    calendar.addEventListener('touchcancel', finish, { passive: true });

    calendar.addEventListener('wheel', event => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setManualSlot((appliedSlot || BASE_SLOT) + (event.deltaY < 0 ? STEP : -STEP));
    }, { passive: false });
  }

  function ensureControls() {
    const top = document.querySelector('#resumen-section .calendario-top');
    const calendar = calendarElement();
    if (!top || !calendar) return;

    let tools = top.querySelector('.rage-calendar-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'rage-calendar-tools';
      top.appendChild(tools);
    }

    const actions = top.querySelector('.calendar-actions');
    if (actions && actions.parentElement !== tools) tools.appendChild(actions);

    let controls = tools.querySelector('.rage-calendar-zoom');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'rage-calendar-zoom';
      controls.setAttribute('role', 'group');
      controls.setAttribute('aria-label', 'Zoom del calendario');
      controls.innerHTML = `
        <button type="button" data-rage-zoom-out aria-label="Reducir altura de las horas" title="Reducir">−</button>
        <input data-rage-zoom-range type="range" min="${MIN_SLOT}" max="${MAX_SLOT}" step="1" aria-label="Tamaño de las franjas horarias">
        <output data-rage-zoom-output aria-live="polite">100%</output>
        <button type="button" data-rage-zoom-in aria-label="Aumentar altura de las horas" title="Aumentar">+</button>
        <button type="button" class="rage-calendar-fit-button" data-rage-zoom-fit aria-pressed="false" title="Mostrar de 06:00 a 24:00 sin desplazamiento vertical"><span aria-hidden="true">↕</span><span>Todo el día</span></button>`;
      tools.insertBefore(controls, actions || null);

      controls.querySelector('[data-rage-zoom-out]').onclick = () =>
        setManualSlot((appliedSlot || BASE_SLOT) - STEP);
      controls.querySelector('[data-rage-zoom-in]').onclick = () =>
        setManualSlot((appliedSlot || BASE_SLOT) + STEP);
      controls.querySelector('[data-rage-zoom-fit]').onclick = toggleFit;
      controls.querySelector('[data-rage-zoom-range]').addEventListener('input', event =>
        setManualSlot(event.target.value));
    }

    bindPinch(calendar);
    updateControls(appliedSlot || BASE_SLOT);
  }

  function setup({ preserve = false } = {}) {
    ensureControls();
    applyZoom({ preserve });
  }

  const renderPrevious = window.renderCalendarioSemanal;
  if (typeof renderPrevious === 'function') {
    window.renderCalendarioSemanal = function () {
      const result = renderPrevious.apply(this, arguments);
      requestAnimationFrame(() => setup({ preserve: false }));
      setTimeout(() => setup({ preserve: false }), 30);
      return result;
    };
  }

  const observer = new MutationObserver(() => {
    if (calendarElement() && !document.querySelector('.rage-calendar-zoom')) {
      requestAnimationFrame(() => setup({ preserve: false }));
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyZoom({ preserve: state.mode !== 'fit' }), 140);
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyZoom({ preserve: state.mode !== 'fit' }), 420);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setup({ preserve: false }), { once: true });
  } else {
    setup({ preserve: false });
  }

  window.RageCalendarZoom = {
    version: VERSION,
    zoomIn: () => setManualSlot((appliedSlot || BASE_SLOT) + STEP),
    zoomOut: () => setManualSlot((appliedSlot || BASE_SLOT) - STEP),
    fitDay: () => { state.mode = 'fit'; saveState(); applyZoom({ preserve: false }); },
    normal: () => setManualSlot(BASE_SLOT, false)
  };
})();