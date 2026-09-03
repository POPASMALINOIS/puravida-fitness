(() => {
  if (window.RageTarifasV257) return;
  window.RageTarifasV257 = true;
  window.RageTarifasV255 = true;

  const VERSION = '2.4.57';
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

  const clients = () => { try { return Array.isArray(clientes) ? clientes : []; } catch (_) { return []; } };
  const clientById = id => clients().find(client => Number(client?.id) === Number(id));
  const keyFor = (duration, modality, sessions) => `${Number(duration)}|${modality}|${Number(sessions)}`;
  const toNumber = value => {
    if (value === '' || value == null) return null;
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) ? number : null;
  };
  const formatEuro = value => value == null
    ? 'Sin tarifa fijada'
    : `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 })} €`;

  function loadTariffs() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
    const data = { ...DEFAULTS };
    Object.keys(data).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(saved, key)) return;
      data[key] = saved[key] === '' || saved[key] == null ? null : toNumber(saved[key]);
    });
    return data;
  }

  function saveTariffs(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('rage:tarifas-changed', { detail: data }));
  }

  function getTariff(duration, modality, sessions) {
    const value = loadTariffs()[keyFor(duration, modality, sessions)];
    return value == null ? null : Number(value);
  }

  function inputId(duration, modality, sessions) {
    const mode = modality === 'Individual' ? 'ind' : modality === 'Pareja' ? 'duo' : 'trio';
    return `tarifa-${duration}-${mode}-${sessions}`;
  }

  function tariffRow(duration, modality, label) {
    return `<div class="rage-tariff-row">
      <div class="rage-tariff-name"><strong>${label}</strong><span>${duration === 60 ? 'Full Session · 1 h' : 'Express Session · 30 min'}</span></div>
      <label><span>5 sesiones</span><div class="rage-tariff-money"><input id="${inputId(duration, modality, 5)}" type="number" min="0" step="0.01" inputmode="decimal"><small>€</small></div></label>
      <label><span>10 sesiones</span><div class="rage-tariff-money"><input id="${inputId(duration, modality, 10)}" type="number" min="0" step="0.01" inputmode="decimal"><small>€</small></div></label>
    </div>`;
  }

  function ensureSettingsCard() {
    const grid = document.querySelector('#ajustes-section .settings-grid');
    if (!grid) return null;
    let card = document.getElementById('rageTariffSettingsCard');
    if (!card) {
      card = document.createElement('section');
      card.id = 'rageTariffSettingsCard';
      card.className = 'settings-card rage-tariff-settings-card';
      card.innerHTML = `
        <div class="settings-card-head"><span class="settings-icon">€</span><div><h3>Tarifas y precios</h3><p>Precios por modalidad, duración y número de sesiones.</p></div></div>
        <div class="rage-tariff-note"><strong>Precio por defecto, no obligatorio</strong><span>Se aplicará a nuevas fichas y renovaciones. El importe de cada cliente seguirá siendo modificable.</span></div>
        <section class="rage-tariff-block"><div class="rage-tariff-block-title"><span>FULL SESSION</span><strong>1 hora</strong></div>
          ${tariffRow(60, 'Individual', 'Individual')}${tariffRow(60, 'Pareja', 'Dúo / Pareja')}${tariffRow(60, 'Trío', 'Grupo / Trío')}
        </section>
        <section class="rage-tariff-block"><div class="rage-tariff-block-title"><span>EXPRESS SESSION</span><strong>30 minutos</strong></div>
          ${tariffRow(30, 'Individual', 'Individual')}${tariffRow(30, 'Pareja', 'Dúo / Pareja')}${tariffRow(30, 'Trío', 'Grupo / Trío')}
        </section>
        <div class="rage-tariff-foot"><p><strong>Trío 30 min:</strong> la tablilla facilitada no fija precio. Los campos quedan vacíos hasta que decidáis esa tarifa.</p><button type="button" onclick="restaurarTarifasRage()">Restaurar tablilla</button></div>`;
      grid.appendChild(card);
    }
    fillSettingsForm();
    return card;
  }

  function fillSettingsForm(data = loadTariffs()) {
    Object.keys(DEFAULTS).forEach(key => {
      const [duration, modality, sessions] = key.split('|');
      const input = document.getElementById(inputId(duration, modality, sessions));
      if (!input) return;
      const value = data[key];
      input.value = value == null ? '' : String(value);
      input.placeholder = value == null ? 'Sin fijar' : '';
    });
  }

  function readSettingsForm() {
    const current = loadTariffs();
    const data = {};
    for (const key of Object.keys(DEFAULTS)) {
      const [duration, modality, sessions] = key.split('|');
      const input = document.getElementById(inputId(duration, modality, sessions));
      if (!input) {
        data[key] = current[key];
        continue;
      }
      if (input.value.trim() === '') {
        data[key] = null;
        continue;
      }
      const value = toNumber(input.value);
      if (value == null || value < 0) {
        alert(`Revisa la tarifa ${modality} · ${duration} min · ${sessions} sesiones.`);
        input.focus();
        return null;
      }
      data[key] = value;
    }
    return data;
  }

  window.restaurarTarifasRage = function () {
    if (!confirm('¿Restaurar en el formulario los precios de la tablilla? Los cambios se guardarán al pulsar “Guardar cambios”.')) return;
    fillSettingsForm({ ...DEFAULTS });
  };

  function wrapSettingsSave() {
    if (window.guardarAjustesRage?.rageTariffWrapped) return;
    const previous = window.guardarAjustesRage;
    if (typeof previous !== 'function') return;
    function wrapped() {
      ensureSettingsCard();
      const tariffs = readSettingsForm();
      if (!tariffs) return;
      saveTariffs(tariffs);
      return previous.apply(this, arguments);
    }
    wrapped.rageTariffWrapped = true;
    window.guardarAjustesRage = wrapped;
  }

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

  function newClientSelection() {
    return {
      duration: Number(document.getElementById('clienteBonoDuracion')?.value || 60),
      modality: document.getElementById('clienteBonoModalidad')?.value || 'Individual',
      sessions: Number(document.getElementById('clienteBonoTotal')?.value || 5)
    };
  }

  let settingPrice = false;
  function applyNewClientTariff(force = false) {
    const price = document.getElementById('clienteCuota');
    if (!price) return;
    price.placeholder = 'Precio del bono (€)';
    const helper = ensureHelper(price, 'rageNewClientPriceHelper');
    const selection = newClientSelection();
    const base = getTariff(selection.duration, selection.modality, selection.sessions);

    if (base == null) {
      if (force) {
        settingPrice = true;
        price.value = '';
        settingPrice = false;
        price.dataset.ragePriceSource = 'manual';
      }
      if (helper) helper.textContent = 'No hay tarifa fijada para esta combinación. Introduce el precio manualmente o configúralo en Ajustes.';
      return;
    }

    if (force || !price.value.trim()) {
      settingPrice = true;
      price.value = String(base);
      settingPrice = false;
      price.dataset.ragePriceSource = 'tarifa';
    }
    if (helper) {
      helper.textContent = price.dataset.ragePriceSource === 'manual'
        ? `Tarifa configurada: ${formatEuro(base)} · Precio manual: ${price.value || '—'} €`
        : `Tarifa aplicada automáticamente: ${formatEuro(base)} · Puedes modificarla.`;
    }
  }

  function bindNewClientPricing() {
    const total = document.getElementById('clienteBonoTotal');
    const duration = document.getElementById('clienteBonoDuracion');
    const modality = document.getElementById('clienteBonoModalidad');
    const price = document.getElementById('clienteCuota');
    if (!total || !duration || !modality || !price) return;

    [total, duration, modality].forEach(element => {
      if (element.dataset.rageTariffBound === '1') return;
      element.dataset.rageTariffBound = '1';
      element.addEventListener('change', () => applyNewClientTariff(true));
    });
    if (price.dataset.rageTariffBound !== '1') {
      price.dataset.rageTariffBound = '1';
      price.addEventListener('input', () => {
        if (settingPrice) return;
        price.dataset.ragePriceSource = 'manual';
        applyNewClientTariff(false);
      });
    }
    applyNewClientTariff(false);
  }

  function tariffReference(duration, modality, sessions, contractedPrice, source) {
    const base = getTariff(duration, modality, sessions);
    return {
      duracion: Number(duration),
      modalidad: modality,
      sesiones: Number(sessions),
      tarifaBase: base,
      precioContratado: toNumber(contractedPrice),
      origen: source || (base != null && Number(base) === Number(toNumber(contractedPrice)) ? 'tarifa' : 'manual'),
      actualizadoEn: new Date().toISOString()
    };
  }

  function wrapClientCreation() {
    if (window.agregarCliente?.rageTariffWrapped) return;
    const previous = window.agregarCliente;
    if (typeof previous !== 'function') return;
    function wrapped() {
      bindNewClientPricing();
      const selection = newClientSelection();
      const input = document.getElementById('clienteCuota');
      const price = input?.value || '';
      const source = input?.dataset.ragePriceSource || 'manual';
      const before = new Set(clients().map(client => String(client.id)));
      const result = previous.apply(this, arguments);
      const created = clients().find(client => !before.has(String(client.id)));
      if (created) {
        created.tarifaReferencia = tariffReference(selection.duration, selection.modality, selection.sessions, price, source);
        try { if (typeof guardarDatos === 'function') guardarDatos(); } catch (_) {}
      }
      return result;
    }
    wrapped.rageTariffWrapped = true;
    window.agregarCliente = wrapped;
  }

  function installRenewPricing(clientId) {
    const modal = document.getElementById('rage-client-editor');
    if (!modal) return;
    const total = document.getElementById('ebTotal');
    const duration = document.getElementById('ebDuration');
    const modality = document.getElementById('ebMode');
    const price = document.getElementById('ebFee');
    const full = document.getElementById('ebFull');
    if (!total || !duration || !modality || !price) return;

    const label = price.closest('label')?.querySelector(':scope > span');
    if (label) label.textContent = 'Precio del bono (€)';
    const helper = ensureHelper(price, 'rageRenewPriceHelper');
    price.dataset.ragePriceSource = 'actual';
    let internal = false;

    const selection = () => ({ duration: Number(duration.value), modality: modality.value, sessions: Number(total.value) });
    const show = () => {
      const current = selection();
      const base = getTariff(current.duration, current.modality, current.sessions);
      if (!helper) return;
      if (base == null) helper.textContent = 'No hay tarifa configurada para esta combinación. El precio debe indicarse manualmente.';
      else if (price.dataset.ragePriceSource === 'manual') helper.textContent = `Tarifa vigente: ${formatEuro(base)} · Precio manual: ${price.value || '—'} €`;
      else if (price.dataset.ragePriceSource === 'tarifa') helper.textContent = `Tarifa vigente aplicada: ${formatEuro(base)} · Puedes modificarla.`;
      else helper.textContent = `Precio actual: ${price.value || '0'} € · Tarifa vigente: ${formatEuro(base)}.`;
    };
    const apply = () => {
      const current = selection();
      const base = getTariff(current.duration, current.modality, current.sessions);
      internal = true;
      price.value = base == null ? '' : String(base);
      internal = false;
      price.dataset.ragePriceSource = base == null ? 'manual' : 'tarifa';
      show();
    };

    [total, duration, modality].forEach(element => {
      if (element.dataset.rageTariffRenewBound === '1') return;
      element.dataset.rageTariffRenewBound = '1';
      element.addEventListener('change', apply);
      if (element === total) element.addEventListener('input', apply);
    });
    if (price.dataset.rageTariffRenewBound !== '1') {
      price.dataset.rageTariffRenewBound = '1';
      price.addEventListener('input', () => {
        if (!internal) {
          price.dataset.ragePriceSource = 'manual';
          show();
        }
      });
    }
    if (full && full.dataset.rageTariffRenewBound !== '1') {
      full.dataset.rageTariffRenewBound = '1';
      full.addEventListener('change', () => { if (full.checked) apply(); });
    }
    show();

    const saveButton = modal.querySelector('.rage-editor-save');
    if (saveButton && saveButton.dataset.rageTariffSaveWrapped !== '1') {
      saveButton.dataset.rageTariffSaveWrapped = '1';
      const originalSave = saveButton.onclick;
      saveButton.onclick = function () {
        const current = selection();
        const contracted = price.value;
        const source = price.dataset.ragePriceSource || 'manual';
        const result = originalSave?.apply(this, arguments);
        setTimeout(() => {
          if (document.getElementById('rage-client-editor')) return;
          const client = clientById(clientId);
          if (!client) return;
          client.tarifaReferencia = tariffReference(current.duration, current.modality, current.sessions, contracted, source);
          try { if (typeof guardarDatos === 'function') guardarDatos(); } catch (_) {}
        }, 0);
        return result;
      };
    }
  }

  function wrapRenewal() {
    if (window.cambiarBonoRage?.rageTariffWrapped) return;
    const previous = window.cambiarBonoRage;
    if (typeof previous !== 'function') return;
    function wrapped(id) {
      const result = previous.apply(this, arguments);
      installRenewPricing(id);
      requestAnimationFrame(() => installRenewPricing(id));
      return result;
    }
    wrapped.rageTariffWrapped = true;
    window.cambiarBonoRage = wrapped;
  }

  window.exportarCopiaRage = function () {
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem('rageTrainingAjustes') || '{}'); } catch (_) {}
    const backup = {
      app: 'Rage Training',
      version: VERSION,
      fecha: new Date().toISOString(),
      clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
      entrenadores: JSON.parse(localStorage.getItem('entrenadores') || '[]'),
      ajustes: settings,
      tarifas: loadTariffs()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rage-training-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    wrapSettingsSave();
    bindNewClientPricing();
    wrapClientCreation();
    wrapRenewal();
  }

  const showSectionPrevious = window.mostrarSeccion;
  if (typeof showSectionPrevious === 'function' && !showSectionPrevious.rageTariffWrapped) {
    function showSectionWrapped(section) {
      const result = showSectionPrevious.apply(this, arguments);
      if (section === 'ajustes') {
        ensureSettingsCard();
        fillSettingsForm();
      }
      return result;
    }
    showSectionWrapped.rageTariffWrapped = true;
    window.mostrarSeccion = showSectionWrapped;
  }

  const screenPrevious = window.cambiarPantalla;
  if (typeof screenPrevious === 'function' && !screenPrevious.rageTariffWrapped) {
    function screenWrapped(screenId) {
      const result = screenPrevious.apply(this, arguments);
      if (screenId === 'alta-screen') {
        requestAnimationFrame(bindNewClientPricing);
        setTimeout(bindNewClientPricing, 50);
      }
      return result;
    }
    screenWrapped.rageTariffWrapped = true;
    window.cambiarPantalla = screenWrapped;
  }

  window.addEventListener('rage:tarifas-changed', bindNewClientPricing);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  setTimeout(install, 100);
  setTimeout(install, 800);

  window.RageTarifas = {
    version: VERSION,
    load: loadTariffs,
    get: getTariff,
    save: saveTariffs,
    defaults: { ...DEFAULTS },
    refresh: install
  };
})();
