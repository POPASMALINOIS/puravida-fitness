(() => {
  const VERSION = '2.4.41';
  const root = document.documentElement;
  let virtualKeyboardHeight = 0;
  let revealTimers = [];

  function editable(element) {
    return !!element && element.matches?.('input, textarea, select, [contenteditable="true"]');
  }

  function installViewportMode() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const current = meta.getAttribute('content') || '';
    if (!current.includes('interactive-widget=')) {
      meta.setAttribute('content', `${current}, interactive-widget=resizes-content`);
    }
  }

  function installStyles() {
    if (document.getElementById('rage-android-tablet-keyboard-style')) return;
    const style = document.createElement('style');
    style.id = 'rage-android-tablet-keyboard-style';
    style.textContent = `
      :root{
        --rage-visual-height:100dvh;
        --rage-visual-top:0px;
      }
      html.rage-tracking-modal-open,
      html.rage-tracking-modal-open body{
        overflow:hidden!important;
        overscroll-behavior:none!important;
      }
      @media (pointer:coarse), (max-width:1100px){
        #rageTrackingModal.tracking-modal-backdrop{
          position:fixed!important;
          inset:auto 0 auto 0!important;
          top:var(--rage-visual-top,0px)!important;
          width:100vw!important;
          height:var(--rage-visual-height,100dvh)!important;
          min-height:0!important;
          max-height:none!important;
          padding:8px max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))!important;
          display:flex!important;
          align-items:stretch!important;
          justify-content:center!important;
          overflow:hidden!important;
          box-sizing:border-box!important;
        }
        #rageTrackingModal .tracking-modal{
          display:flex!important;
          flex-direction:column!important;
          width:min(920px,100%)!important;
          max-width:100%!important;
          height:100%!important;
          min-height:0!important;
          max-height:100%!important;
          margin:0 auto!important;
          overflow:hidden!important;
          border-radius:15px!important;
          box-sizing:border-box!important;
        }
        #rageTrackingModal .tracking-modal-head{
          position:relative!important;
          z-index:5!important;
          flex:0 0 auto!important;
          padding:13px 15px!important;
          background:#0b1626!important;
        }
        #rageTrackingModal .tracking-modal-body{
          position:relative!important;
          flex:1 1 auto!important;
          min-height:0!important;
          max-height:none!important;
          width:100%!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          scroll-behavior:smooth!important;
          scroll-padding-top:20px!important;
          scroll-padding-bottom:120px!important;
          padding:15px 15px 120px!important;
          box-sizing:border-box!important;
        }
        #rageTrackingModal .tracking-modal-actions{
          position:relative!important;
          z-index:6!important;
          flex:0 0 auto!important;
          margin:0!important;
          padding:10px 14px max(10px,env(safe-area-inset-bottom))!important;
          background:#0b1626!important;
          box-shadow:0 -10px 26px rgba(2,8,18,.42)!important;
        }
        #rageTrackingModal input,
        #rageTrackingModal textarea,
        #rageTrackingModal select{
          font-size:16px!important;
          scroll-margin-top:24px!important;
          scroll-margin-bottom:120px!important;
        }
        #rageTrackingModal textarea{
          min-height:72px;
        }
        #rageTrackingModal .meso-exercise-panel{
          overflow:visible!important;
        }
        #rageTrackingModal .meso-exercise-edit-row{
          scroll-margin-top:18px!important;
          scroll-margin-bottom:125px!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-head{
          padding:7px 12px!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-head .section-kicker{
          display:none!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-head h3{
          margin:0!important;
          font-size:17px!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-body{
          padding-top:10px!important;
          padding-bottom:96px!important;
          scroll-padding-bottom:96px!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-actions{
          gap:7px!important;
          padding:7px 10px max(7px,env(safe-area-inset-bottom))!important;
        }
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-actions button{
          min-height:42px!important;
          padding:8px 12px!important;
        }
      }
      @media (pointer:coarse) and (min-width:600px) and (max-width:1400px){
        #rageTrackingModal .tracking-modal.rage-tablet-exercise-modal{
          width:min(100%,1040px)!important;
        }
        #rageTrackingModal .tracking-modal.rage-tablet-exercise-modal .meso-exercise-copy{
          position:sticky;
          top:-1px;
          z-index:3;
          padding:8px 0 10px;
          background:#091423;
        }
      }
      @media (pointer:coarse) and (orientation:landscape) and (max-height:620px){
        html.rage-soft-keyboard-open #rageTrackingModal .tracking-modal-head{
          display:none!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function currentOverlay() {
    return document.getElementById('rageTrackingModal');
  }

  function markModal() {
    const overlay = currentOverlay();
    const modal = overlay?.querySelector('.tracking-modal');
    const editor = overlay?.querySelector('#mesoExerciseEditor');

    root.classList.toggle('rage-tracking-modal-open', !!overlay);
    if (modal) modal.classList.toggle('rage-tablet-exercise-modal', !!editor);
    updateViewport();
  }

  function availableViewport() {
    const vv = window.visualViewport;
    let height = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight);
    const top = Math.max(0, Math.round(vv?.offsetTop || 0));

    if (virtualKeyboardHeight > 0) {
      height = Math.min(height, Math.max(240, Math.round(window.innerHeight - virtualKeyboardHeight)));
    }

    return { height: Math.max(240, height), top };
  }

  function updateViewport() {
    const { height, top } = availableViewport();
    root.style.setProperty('--rage-visual-height', `${height}px`);
    root.style.setProperty('--rage-visual-top', `${top}px`);

    const focused = document.activeElement;
    const overlay = currentOverlay();
    const layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    const keyboardOpen = !!overlay && editable(focused) && focused.closest?.('#rageTrackingModal') &&
      ((layoutHeight - height) > 110 || virtualKeyboardHeight > 80);

    root.classList.toggle('rage-soft-keyboard-open', keyboardOpen);
    overlay?.classList.toggle('rage-keyboard-open', keyboardOpen);

    if (keyboardOpen) requestAnimationFrame(() => revealFocused(focused));
  }

  function revealFocused(element) {
    if (!editable(element) || !element.closest?.('#rageTrackingModal')) return;

    const modal = element.closest('.tracking-modal');
    const body = modal?.querySelector('.tracking-modal-body');
    if (!modal || !body) return;

    const viewport = availableViewport();
    const viewportTop = viewport.top;
    const viewportBottom = viewport.top + viewport.height;
    const head = modal.querySelector('.tracking-modal-head');
    const actions = modal.querySelector('.tracking-modal-actions');
    const headBottom = head && getComputedStyle(head).display !== 'none'
      ? head.getBoundingClientRect().bottom
      : viewportTop;
    const actionsTop = actions?.getBoundingClientRect().top || viewportBottom;
    const safeTop = Math.max(viewportTop + 8, headBottom + 10);
    const safeBottom = Math.min(viewportBottom - 8, actionsTop - 12);
    const rect = element.getBoundingClientRect();

    let delta = 0;
    if (rect.bottom > safeBottom) delta = rect.bottom - safeBottom + 22;
    else if (rect.top < safeTop) delta = rect.top - safeTop - 18;

    if (delta) body.scrollBy({ top: delta, behavior: 'smooth' });
  }

  function scheduleReveal(element) {
    revealTimers.forEach(clearTimeout);
    revealTimers = [60, 180, 360, 620].map(delay =>
      setTimeout(() => {
        updateViewport();
        revealFocused(element);
      }, delay)
    );
  }

  document.addEventListener('focusin', event => {
    const target = event.target;
    if (!editable(target) || !target.closest?.('#rageTrackingModal')) return;
    scheduleReveal(target);
  }, true);

  document.addEventListener('focusout', () => {
    setTimeout(updateViewport, 120);
    setTimeout(updateViewport, 360);
  }, true);

  const observer = new MutationObserver(markModal);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateViewport, { passive: true });
  window.addEventListener('resize', updateViewport, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewport, 100);
    setTimeout(updateViewport, 450);
  }, { passive: true });

  if (navigator.virtualKeyboard) {
    navigator.virtualKeyboard.addEventListener('geometrychange', event => {
      virtualKeyboardHeight = Math.max(0, Math.round(event.target?.boundingRect?.height || 0));
      updateViewport();
      if (editable(document.activeElement)) scheduleReveal(document.activeElement);
    });
  }

  installViewportMode();
  installStyles();
  markModal();
  updateViewport();
  window.RageAndroidTabletVersion = VERSION;
})();