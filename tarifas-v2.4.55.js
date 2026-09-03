(() => {
  if (window.RageTarifasV255) return;
  window.RageTarifasV255 = true;

  const VERSION = '2.4.55';
  const KEY = 'rageTrainingTarifasV1';
  const DEFAULTS = Object.freeze({
    '60|Individual|5': 180,
    '60|Individual|10': 320,
    '60|Pareja|5': 220,
    '60|Pareja|10': 410,
    '60|Trío|5': 285,
    '60|Trío|10': 570,
    '30|Individual|5': 105,
    '30|Individual|10': 200,
    '30|Pareja|5': 120,
    '30|Pareja|10': 215,
    '30|Trío|5': null,
    '30|Trío|10': null
  });

  const list = () => { try { return Array.isArray(clientes) ? clientes : []; } catch (_) { return []; } };
  const clientById = id => list().find(c => Number(c?.id) === Number(id));
  const keyFor = (duration, modality, sessions) => `${Number(duration)}|${modality}|${Number(sessions)}`;
  const num = value => {
    if (value === '' || value == null) return null;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const euro = value => value == null ? 'Sin tarifa fijada' : `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;

  function loadTariffs() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
    const data = { ...DEFAULTS };
    Object.keys(data).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(saved, key)) return;
      const value = saved[key];
      data[key] = value === '' || value == null ? null : num(value);
    });
    return data;
  }

  function saveTariffs(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('rage:tarifas-changed', { detail: data }));
  }

  function tariff(duration, modality, sessions) {
    const value = loadTariffs()[keyFor(duration, modality, sessions)];
    return value == null ? null : Number(value);
  }

  function tariffInputId(duration, modality, sessions) {
    const mode = modality === 'Individual' ? 'ind' : modality === 'Pareja' ? 'duo' : 'trio';
    return `tarifa-${duration}-${mode}-${sessions}`;
  }

  function tariffRow(duration, modality, label) {
    return `<div class="rage-tariff-row">
      <div class="rage-tariff-name"><strong>${label}</strong><span>${duration === 60 ? 'Full Session · 1 h' : 'Express Session · 30 min'}</span></div>
      <label><span>5 sesiones</span><div class="rage-tariff-money"><input id="${tariffInputId(duration, modality, 5)}" type="number" min="0" step="0.01" inputmode="decimal"><small>€</small></div></label>
      <label><span>10 sesiones</span><div class="rage-tariff-money"><input id="${tariffInputId(duration, modality, 10)}" type="number" min="0" step="0.01" inputmode="decimal"><small>€</small></div></label>
    </div>`;
  }

  function ensureSettingsCard() {
    const grid = document.querySelector('#ajustes-section .settings-grid');
    if (!grid || document.getElementById('rageTariffSettingsCard')) return;
    const card = document.createElement('section');
    card.id = 'rageTariffSettingsCard';
    card.className = 'settings-card rage-tariff-settings-card';
    card.innerHTML = `
      <div class="settings-card-head"><span class="settings-icon">€</span><div><h3>Tarifas y precios</h3><p>Precios por modalidad, duración y número de sesiones.</p></div></div>
      <div class="rage-tariff-note"><strong>Precio por defecto, no precio obligatorio</strong><span>Se aplicará automáticamente a nuevas fichas y renovaciones. Podrás modificar el importe en cada cliente sin alterar esta tabla.</span></div>
      <section class="rage-tariff-block"><div class="rage-tariff-block-title"><span>FULL SESSION</span><strong>1 hora</strong></div>
        ${tariffRow(60,'Individual','Individual')}${tariffRow(60,'Pareja','Dúo / Pareja')}${tariffRow(60,'Trío','Grupo / Trío')}
      </section>
      <section class="rage-tariff-block"><div class="rage-tariff-block-title"><span>EXPRESS SESSION</span><strong>30 minutos</strong></div>
        ${tariffRow(30,'Individual','Individual')}${tariffRow(30,'Pareja','Dúo / Pareja')}${tariffRow(30,'Trío','Grupo / Trío')}
      </section>
      <div class="rage-tariff-foot"><p><strong>Trío 30 min:</strong> la tablilla facilitada no fija precio. Esos dos campos se dejan vacíos y puedes completarlos si decidís ofrecer esa tarifa.</p><button type="button" onclick="restaurarTarifasRage()">Restaurar tablilla</button></div>`;
    grid.appendChild(card);
    fillSettingsForm();
  }

  function fillSettingsForm(data = loadTariffs()) {
    Object.entries(DEFAULTS).forEach(([key]) => {
      const [duration, modality, sessions] = key.split('|');
      const input = document.getElementById(tariffInputId(duration, modality, sessions));
      if (!input) return;
      const value = data[key];
      input.value = value == null ? '' : String(value);
      if (value == null) input.placeholder = 'Sin fijar';
    });
  }

  function readSettingsForm() {
    const data = {};
    for (const key of Object.keys(DEFAULTS)) {
      const [duration, modality, sessions] = key.split('|');
      const input = document.getElementById(tariffInputId(duration, modality, sessions));
      if (!input) { data[key] = loadTariffs()[key]; continue; }
      if (input.value.trim() === '') { data[key] = null; continue; }
      const value = num(input.value);
      if (value == null || value < 0) {
        alert(`Revisa la tarifa ${modality} · ${duration} min · ${sessions} sesiones.`);
        input.focus();
        return null;
      }
      data[key] = value;
    }
    return data;
  }

  const settingsSavePrevious = window.guardarAjustesRage;
  if (typeof settingsSavePrevious === 'function') {
    window.guardarAjustesRage = function () {
      ensureSettingsCard();
      const rates = readSettingsForm();
      if (!rates) return;
      saveTariffs(rates);
      const result = settingsSavePrevious.apply(this, arguments);
      installNewClientPricing();
      return result;
    };
  }

  window.restaurarTarifasRage = function () {
    if (!confirm('¿Restaurar en el formulario los precios de la tablilla facilitada? Los cambios no se guardarán hasta pulsar “Guardar cambios”.')) return;
    fillSettingsForm({ ...DEFAULTS });
  };

  function ensureHelper(input, id) {
    if (!input) return null;
    let helper = document.getElementById(id);
    if (!helper) {
      helper = document.createElement('small');
      helper.id = id;
      helper.className = 'rage-price-helper';
      input.insertAdjacentElement('afterend', helper);
    }
    return helper;
  }

  function selectedNewClientTariff() {
    return {
      duration: Number(document.getElementById('clienteBonoDuracion')?.value || 60),
      modality: document.getElementById('clienteBonoModalidad')?.value || 'Individual',
      sessions: Number(document.getElementById('clienteBonoTotal')?.value || 5)
    };
  }

  let settingNewPrice = false;
  function applyNewClientTariff(force = false) {
    const price = document.getElementById('clienteCuota');
    if (!price) return;
    price.placeholder = 'Precio del bono (€)';
    const helper = ensureHelper(price, 'rageNewClientPriceHelper');
    const s = selectedNewClientTariff();
    const currentTariff = tariff(s.duration, s.modality, s.sessions);

    if (currentTariff == null) {
      if (force) {
        settingNewPrice = true;
        price.value = '';
        settingNewPrice = false;
        price.dataset.ragePriceSource = 'manual';
      }
      if (helper) helper.textContent = 'No hay tarifa fijada para esta combinación. Introduce el precio manualmente o configúralo en Ajustes.';
      return;
    }

    if (force || !price.value.trim()) {
      settingNewPrice = true;
      price.value = String(currentTariff);
      settingNewPrice = false;
      price.dataset.ragePriceSource = 'tarifa';
    }
    if (helper) {
      helper.textContent = price.dataset.ragePriceSource === 'manual'
        ? `Tarifa configurada: ${euro(currentTariff)} · Precio manual: ${price.value || '—'} €`
        : `Tarifa aplicada automáticamente: ${euro(currentTariff)} · Puedes modificarla.`;
    }
  }

  function installNewClientPricing() {
    const total = document.getElementById('clienteBonoTotal');
    const duration = document.getElementById('clienteBonoDuracion');
    const mode = document.getElementById('clienteBonoModalidad');
    const price = document.getElementById('clienteCuota');
    if (!total || !duration || !mode || !price) return;

    [total,duration,mode].forEach(el => {
      if (el.dataset.rageTariffBound === '1') return;
      el.dataset.rageTariffBound = '1';
      el.addEventListener('change', () => applyNewClientTariff(true));
    });
    if (price.dataset.rageTariffBound !== '1') {
      price.dataset.rageTariffBound = '1';
      price.addEventListener('input', () => {
        if (settingNewPrice) return;
        price.dataset.ragePriceSource = 'manual';
        applyNewClientTariff(false);
      });
    }
    if (!price.value.trim()) applyNewClientTariff(false);
    else applyNewClientTariff(false);
  }

  function referenceFromValues(duration, modality, sessions, contractedPrice, source) {
    const base = tariff(duration, modality, sessions);
    return {
      duracion: Number(duration),
      modalidad: modality,
      sesiones: Number(sessions),
      tarifaBase: base,
      precioContratado: num(contractedPrice),
      origen: source || (base != null && Number(base) === Number(num(contractedPrice)) ? 'tarifa' : 'manual'),
      actualizadoEn: new Date().toISOString()
    };
  }

  const addPrevious = window.agregarCliente;
  if (typeof addPrevious === 'function') {
    window.agregarCliente = function () {
      installNewClientPricing();
      const s = selectedNewClientTariff();
      const priceInput = document.getElementById('clienteCuota');
      const price = priceInput?.value || '';
      const source = priceInput?.dataset.ragePriceSource || 'manual';
      const before = new Set(list().map(c => String(c.id)));
      const result = addPrevious.apply(this, arguments);
      const created = list().find(c => !before.has(String(c.id)));
      if (created) {
        created.tarifaReferencia = referenceFromValues(s.duration, s.modality, s.sessions, price, source);
        if (typeof guardarDatos === 'function') guardarDatos();
      }
      return result;
    };
  }

  function installRenewPricing(clientId) {
    const modal = document.getElementById('rage-client-editor');
    if (!modal) return;
    const total = document.getElementById('ebTotal');
    const duration = document.getElementById('ebDuration');
    const mode = document.getElementById('ebMode');
    const price = document.getElementById('ebFee');
    const full = document.getElementById('ebFull');
    if (!total || !duration || !mode || !price) return;

    const label = price.closest('label')?.querySelector(':scope > span');
    if (label) label.textContent = 'Precio del bono (€)';
    const helper = ensureHelper(price, 'rageRenewPriceHelper');
    price.dataset.ragePriceSource = 'actual';

    const selection = () => ({ duration:Number(duration.value), modality:mode.value, sessions:Number(total.value) });
    let setting = false;
    const show = () => {
      const s = selection();
      const base = tariff(s.duration, s.modality, s.sessions);
      if (!helper) return;
      if (base == null) helper.textContent = 'No hay tarifa configurada para esta combinación. El precio debe indicarse manualmente.';
      else if (price.dataset.ragePriceSource === 'manual') helper.textContent = `Tarifa vigente: ${euro(base)} · Precio manual: ${price.value || '—'} €`;
      else if (price.dataset.ragePriceSource === 'tarifa') helper.textContent = `Tarifa vigente aplicada: ${euro(base)} · Puedes modificarla.`;
      else helper.textContent = `Precio actual del cliente: ${price.value || '0'} € · Tarifa vigente: ${euro(base)}.`;
    };
    const apply = () => {
      const s = selection();
      const base = tariff(s.duration, s.modality, s.sessions);
      setting = true;
      price.value = base == null ? '' : String(base);
      setting = false;
      price.dataset.ragePriceSource = base == null ? 'manual' : 'tarifa';
      show();
    };

    [total,duration,mode].forEach(el => {
      if (el.dataset.rageTariffRenewBound === '1') return;
      el.dataset.rageTariffRenewBound = '1';
      el.addEventListener('change', apply);
      if (el === total) el.addEventListener('input', apply);
    });
    if (price.dataset.rageTariffRenewBound !== '1') {
      price.dataset.rageTariffRenewBound = '1';
      price.addEventListener('input', () => { if (!setting) { price.dataset.ragePriceSource = 'manual'; show(); } });
    }
    if (full && full.dataset.rageTariffRenewBound !== '1') {
      full.dataset.rageTariffRenewBound = '1';
      full.addEventListener('change', () => { if (full.checked) apply(); });
    }
    show();

    const save = modal.querySelector('.rage-editor-save');
    if (save && save.dataset.rageTariffSaveWrapped !== '1') {
      save.dataset.rageTariffSaveWrapped = '1';
      const original = save.onclick;
      save.onclick = function () {
        const s = selection();
        const contracted = price.value;
        const source = price.dataset.ragePriceSource || 'manual';
        const result = original?.apply(this, arguments);
        setTimeout(() => {
          if (document.getElementById('rage-client-editor')) return;
          const c = clientById(clientId);
          if (!c) return;
          c.tarifaReferencia = referenceFromValues(s.duration, s.modality, s.sessions, contracted, source);
          if (typeof guardarDatos === 'function') guardarDatos();
        }, 0);
        return result;
      };
    }
  }

  const renewPrevious = window.cambiarBonoRage;
  if (typeof renewPrevious === 'function') {
    window.cambiarBonoRage = function (id) {
      const result = renewPrevious.apply(this, arguments);
      installRenewPricing(id);
      requestAnimationFrame(() => installRenewPricing(id));
      return result;
    };
  }

  // Copias locales: incluye la tabla de tarifas para que una tablet maestra conserve también los precios configurados.
  window.exportarCopiaRage = function () {
    let ajustes = {};
    try { ajustes = JSON.parse(localStorage.getItem('rageTrainingAjustes') || '{}'); } catch (_) {}
    const backup = {
      app:'Rage Training', version:VERSION, fecha:new Date().toISOString(),
      clientes:JSON.parse(localStorage.getItem('clientes') || '[]'),
      entrenadores:JSON.parse(localStorage.getItem('entrenadores') || '[]'),
      ajustes,
      tarifas:loadTariffs()
    };
    const blob = new Blob([JSON.stringify(backup,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rage-training-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  document.addEventListener('change', async event => {
    if (event.target?.id !== 'ajImportFile') return;
    event.stopImmediatePropagation();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.clientes) || !Array.isArray(data.entrenadores)) throw new Error('invalid');
      if (!confirm('La importación sustituirá los datos actuales de clientes y entrenadores. ¿Continuar?')) return;
      localStorage.setItem('clientes', JSON.stringify(data.clientes));
      localStorage.setItem('entrenadores', JSON.stringify(data.entrenadores));
      if (data.ajustes) localStorage.setItem('rageTrainingAjustes', JSON.stringify(data.ajustes));
      if (data.tarifas) localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, ...data.tarifas }));
      location.reload();
    } catch (_) {
      alert('No se ha podido importar la copia. Comprueba que el archivo pertenece a Rage Training.');
    } finally {
      event.target.value = '';
    }
  }, true);

  function install() {
    ensureSettingsCard();
    installNewClientPricing();
  }

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('rage:tarifas-changed', () => { installNewClientPricing(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();

  window.RageTarifas = { version:VERSION, load:loadTariffs, get:tariff, save:saveTariffs, defaults:{...DEFAULTS}, refresh:install };
})();
