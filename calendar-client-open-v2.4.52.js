(() => {
  if (window.RageCalendarClientOpenV252) return;
  window.RageCalendarClientOpenV252 = true;

  const VERSION = '2.4.52';
  const EVENT_SELECTOR = '#resumen-section .week-event-fixed';
  let decorateTimer = null;

  function clientIdFromEvent(element) {
    if (!element) return null;

    const datasetId = Number(
      element.dataset.rageClientId ||
      element.dataset.rageOpenClientId ||
      0
    );
    if (Number.isFinite(datasetId) && datasetId > 0) return datasetId;

    const code = [
      element.getAttribute('ondblclick') || '',
      element.getAttribute('onclick') || ''
    ].join(' ');
    const match = code.match(/verFichaCliente\s*\(\s*(\d+)\s*\)/);
    return match ? Number(match[1]) : null;
  }

  function resetScroll() {
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      const panel = document.querySelector('.main-panel');
      if (panel) panel.scrollTop = 0;
      const detail = document.getElementById('cliente-detalle-section');
      if (detail) detail.scrollTop = 0;
    } catch (_) {}
  }

  function openClient(element) {
    const clientId = clientIdFromEvent(element);
    if (!clientId || typeof window.verFichaCliente !== 'function') return false;

    window.verFichaCliente(clientId);
    resetScroll();
    requestAnimationFrame(resetScroll);
    setTimeout(resetScroll, 50);
    return true;
  }

  function decorateEvents() {
    document.querySelectorAll(EVENT_SELECTOR).forEach(element => {
      const clientId = clientIdFromEvent(element);
      if (!clientId) return;

      element.dataset.rageOpenClientId = String(clientId);
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');

      const clientName = element.querySelector('.evento-nombre')?.textContent?.trim() || 'cliente';
      element.setAttribute('aria-label', `Abrir ficha de ${clientName}`);
      element.setAttribute('title', `${clientName} · Pulsa para abrir su ficha · Mantén pulsado para mover la cita`);
    });
  }

  function scheduleDecoration() {
    clearTimeout(decorateTimer);
    requestAnimationFrame(decorateEvents);
    decorateTimer = setTimeout(decorateEvents, 80);
  }

  // Este listener se ejecuta antes del onclick antiguo que abría la planificación diaria.
  // La lógica de arrastre, cargada previamente, conserva prioridad y bloquea el click al soltar una cita movida.
  document.addEventListener('click', event => {
    const appointment = event.target.closest?.(EVENT_SELECTOR);
    if (!appointment || appointment.classList.contains('is-drag-source')) return;
    if (!clientIdFromEvent(appointment)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openClient(appointment);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const appointment = event.target.closest?.(EVENT_SELECTOR);
    if (!appointment || !clientIdFromEvent(appointment)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openClient(appointment);
  }, true);

  const observer = new MutationObserver(scheduleDecoration);
  const calendarMount = document.getElementById('calendarioMensual') || document.documentElement;
  observer.observe(calendarMount, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleDecoration, { once: true });
  } else {
    scheduleDecoration();
  }

  window.RageCalendarClientOpen = {
    version: VERSION,
    refresh: decorateEvents
  };
})();
