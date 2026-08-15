(() => {
  const FISCAL_KEY = 'rageTrainingFiscal';
  const DEFAULT_FISCAL = {
    razonSocial: '', nif: '', direccion: '', cp: '', localidad: '', provincia: '',
    email: '', telefono: '', serie: 'RT', iva: 21, datosRegistrales: ''
  };

  function fiscalData(){
    try { return { ...DEFAULT_FISCAL, ...(JSON.parse(localStorage.getItem(FISCAL_KEY)) || {}) }; }
    catch(_) { return { ...DEFAULT_FISCAL }; }
  }
  function saveFiscal(data){ localStorage.setItem(FISCAL_KEY, JSON.stringify(data)); }
  function esc(v=''){ return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
  function money(v){ const n=Number(String(v).replace(',','.'))||0; return n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fechaES(v){ try{return typeof formatearFechaES==='function'?formatearFechaES(v):v}catch(_){return v||'-'} }
  function yearNow(){ return new Date().getFullYear(); }

  function ensureFiscalCard(){
    const grid=document.querySelector('#ajustes-section .settings-grid');
    if(!grid || document.getElementById('rage-fiscal-card')) return;
    const card=document.createElement('section');
    card.className='settings-card settings-card-fiscal';
    card.id='rage-fiscal-card';
    card.innerHTML=`
      <div class="settings-card-head"><span class="settings-icon">€</span><div><h3>Datos de facturación</h3><p>Se utilizarán automáticamente en todas las facturas.</p></div></div>
      <div class="settings-two-cols fiscal-grid">
        <label class="settings-field fiscal-full"><span>Razón social / nombre fiscal *</span><input id="fiscalRazon" type="text"></label>
        <label class="settings-field"><span>NIF / CIF *</span><input id="fiscalNif" type="text"></label>
        <label class="settings-field"><span>Serie de facturación</span><input id="fiscalSerie" type="text" maxlength="8" placeholder="RT"></label>
        <label class="settings-field fiscal-full"><span>Domicilio fiscal *</span><input id="fiscalDireccion" type="text"></label>
        <label class="settings-field"><span>Código postal *</span><input id="fiscalCp" type="text"></label>
        <label class="settings-field"><span>Localidad *</span><input id="fiscalLocalidad" type="text"></label>
        <label class="settings-field"><span>Provincia</span><input id="fiscalProvincia" type="text"></label>
        <label class="settings-field"><span>IVA (%)</span><input id="fiscalIva" type="number" min="0" max="100" step="0.01"></label>
        <label class="settings-field"><span>Email</span><input id="fiscalEmail" type="email"></label>
        <label class="settings-field"><span>Teléfono</span><input id="fiscalTelefono" type="text"></label>
        <label class="settings-field fiscal-full"><span>Datos registrales *</span><input id="fiscalRegistro" type="text" placeholder="Ej.: Registro Mercantil de Madrid, Tomo ..., Folio ..., Hoja ..., Inscripción ..."></label>
      </div>
      <p class="settings-help">Los campos marcados con * deben estar cumplimentados antes de emitir una factura.</p>`;
    grid.insertBefore(card, grid.firstChild?.nextSibling || null);
    fillFiscal();
  }

  function fillFiscal(){
    const d=fiscalData();
    const map={fiscalRazon:'razonSocial',fiscalNif:'nif',fiscalDireccion:'direccion',fiscalCp:'cp',fiscalLocalidad:'localidad',fiscalProvincia:'provincia',fiscalEmail:'email',fiscalTelefono:'telefono',fiscalSerie:'serie',fiscalIva:'iva',fiscalRegistro:'datosRegistrales'};
    Object.entries(map).forEach(([id,key])=>{ const el=document.getElementById(id); if(el) el.value=d[key]??''; });
  }

  function readFiscal(){
    const val=id=>(document.getElementById(id)?.value||'').trim();
    return {
      razonSocial:val('fiscalRazon'), nif:val('fiscalNif'), direccion:val('fiscalDireccion'), cp:val('fiscalCp'),
      localidad:val('fiscalLocalidad'), provincia:val('fiscalProvincia'), email:val('fiscalEmail'), telefono:val('fiscalTelefono'),
      serie:(val('fiscalSerie')||'RT').toUpperCase(), iva:Math.max(0,Math.min(100,Number(val('fiscalIva')||'21'))),
      datosRegistrales:val('fiscalRegistro')
    };
  }

  function fiscalComplete(d){ return !!(d.razonSocial&&d.nif&&d.direccion&&d.cp&&d.localidad&&d.datosRegistrales); }

  function saveFiscalFromForm(){
    if(!document.getElementById('rage-fiscal-card')) return;
    saveFiscal(readFiscal());
  }

  const guardarAjustesPrev=window.guardarAjustesRage;
  window.guardarAjustesRage=function(){
    if(typeof guardarAjustesPrev==='function') guardarAjustesPrev.apply(this,arguments);
    saveFiscalFromForm();
  };

  function nextInvoiceNumber(payment){
    if(payment.facturaNumero) return payment.facturaNumero;
    const d=fiscalData(), serie=(d.serie||'RT').toUpperCase(), y=yearNow();
    const key=`rageInvoiceSeq_${serie}_${y}`;
    let seq=parseInt(localStorage.getItem(key)||'0',10)+1;
    localStorage.setItem(key,String(seq));
    payment.facturaNumero=`${serie}-${y}-${String(seq).padStart(4,'0')}`;
    payment.facturaFecha=typeof obtenerFechaISO==='function'?obtenerFechaISO(new Date()):new Date().toISOString().slice(0,10);
    if(typeof guardarDatos==='function') guardarDatos();
    return payment.facturaNumero;
  }

  function generarFactura(clienteId){
    const cliente=(typeof clientes!=='undefined'?clientes:[]).find(c=>Number(c.id)===Number(clienteId));
    if(!cliente){ alert('Cliente no encontrado.'); return; }
    const pagos=[...(cliente.pagos||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    if(!pagos.length){ alert('Este cliente todavía no tiene ningún pago registrado. Registra el pago antes de generar la factura.'); return; }
    const fiscal=fiscalData();
    if(!fiscalComplete(fiscal)){
      alert('Completa primero todos los datos fiscales, incluidos los datos registrales, en Ajustes → Datos de facturación.');
      if(typeof mostrarSeccion==='function') mostrarSeccion('ajustes');
      setTimeout(()=>document.getElementById('rage-fiscal-card')?.scrollIntoView({behavior:'smooth',block:'start'}),100);
      return;
    }
    const pago=pagos[0];
    const numero=nextInvoiceNumber(pago);
    const total=Number(String(pago.importe||cliente.cuota||0).replace(',','.'))||0;
    const iva=Number(fiscal.iva)||0;
    const base=iva>0 ? total/(1+iva/100) : total;
    const cuotaIva=total-base;
    const concepto=esc(pago.concepto||`Bono ${cliente.bonoTotal||''} sesiones`);
    const logo=new URL('rage-logo.png',window.location.href).href;
    const facturaFecha=pago.facturaFecha||pago.fecha;

    const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura ${esc(numero)}</title><style>
      @page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#111827}.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:14mm 15mm 12mm;display:flex;flex-direction:column}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #F15A24;padding-bottom:14px}.logo{width:140px;max-height:62px;object-fit:contain;object-position:left top}.invoice-head{text-align:right}.invoice-head h1{font-size:28px;letter-spacing:.08em;margin:0 0 6px}.invoice-head strong{font-size:14px}.muted{color:#64748b}.cols{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:20px 0}.block h3{font-size:10px;letter-spacing:.13em;color:#F15A24;margin:0 0 8px}.block p{margin:3px 0;font-size:12px;line-height:1.35}.service{border:1px solid #dbe2ea;border-radius:9px;overflow:hidden;margin-top:12px}.service-head,.service-row{display:grid;grid-template-columns:1fr 82px 82px 92px;gap:0}.service-head{background:#07101d;color:#fff;font-size:9px;letter-spacing:.08em;text-transform:uppercase}.service-head div,.service-row div{padding:10px 11px}.service-row{font-size:11px;border-top:1px solid #e5e7eb}.service-row div:not(:first-child){text-align:right}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.detail{background:#f8fafc;border:1px solid #e5e7eb;border-radius:7px;padding:10px}.detail span{display:block;color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:.07em}.detail strong{display:block;margin-top:4px;font-size:11px}.totals{margin:14px 0 0 auto;width:285px}.totals div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:12px}.totals .grand{border:0;background:#07101d;color:#fff;padding:11px;border-radius:7px;margin-top:6px;font-size:15px;font-weight:700}.paid{display:inline-flex;margin-top:10px;padding:6px 10px;border-radius:999px;background:#fff3ed;color:#d84b14;font-size:10px;font-weight:700;letter-spacing:.08em}.foot{margin-top:auto;padding-top:10px;border-top:1px solid #e5e7eb;color:#64748b;font-size:8px;line-height:1.35}.registry{margin-top:5px;color:#475569}.actions{position:fixed;right:18px;bottom:18px;display:flex;gap:8px}.actions button{border:0;border-radius:9px;padding:11px 14px;font-weight:700;cursor:pointer}.print{background:#F15A24;color:#fff}.close{background:#fff;border:1px solid #d1d5db!important}
      @media print{@page{size:A4;margin:10mm}html,body{width:190mm;height:277mm;margin:0!important;padding:0!important;background:#fff!important;overflow:hidden!important}.page{width:190mm!important;height:277mm!important;min-height:277mm!important;max-height:277mm!important;margin:0!important;padding:7mm 8mm 6mm!important;overflow:hidden!important;page-break-after:avoid!important;break-after:avoid-page!important}.top{padding-bottom:9px!important}.logo{width:125px!important;max-height:54px!important}.invoice-head h1{font-size:24px!important;margin-bottom:4px!important}.paid{margin-top:7px!important}.cols{margin:13px 0!important;gap:24px!important}.block p{font-size:11px!important;line-height:1.25!important;margin:2px 0!important}.details{margin:8px 0!important;gap:7px!important}.detail{padding:8px!important}.service{margin-top:8px!important}.service-head div,.service-row div{padding:8px 9px!important}.totals{margin-top:9px!important;width:270px!important}.totals div{padding:5px 0!important}.totals .grand{padding:9px!important;margin-top:4px!important}.foot{padding-top:7px!important;font-size:7.5px!important;line-height:1.25!important}.registry{margin-top:4px!important}.actions{display:none!important}}
      </style></head><body><main class="page"><section class="top"><img class="logo" src="${logo}" alt="Rage Training"><div class="invoice-head"><h1>FACTURA</h1><strong>${esc(numero)}</strong><p class="muted">Fecha: ${fechaES(facturaFecha)}</p><span class="paid">PAGADO</span></div></section>
      <section class="cols"><div class="block"><h3>EMISOR</h3><p><strong>${esc(fiscal.razonSocial)}</strong></p><p>NIF/CIF: ${esc(fiscal.nif)}</p><p>${esc(fiscal.direccion)}</p><p>${esc(fiscal.cp)} ${esc(fiscal.localidad)}${fiscal.provincia?`, ${esc(fiscal.provincia)}`:''}</p>${fiscal.email?`<p>${esc(fiscal.email)}</p>`:''}${fiscal.telefono?`<p>${esc(fiscal.telefono)}</p>`:''}</div><div class="block"><h3>CLIENTE</h3><p><strong>${esc(cliente.nombre)}</strong></p><p>Teléfono: ${esc(cliente.telefono||'-')}</p><p>Email: ${esc(cliente.email||'-')}</p><p>Fecha de alta: ${fechaES(cliente.fechaAlta||'')}</p></div></section>
      <section class="details"><div class="detail"><span>Tipo de bono</span><strong>${esc(cliente.bonoTotal||0)} sesiones</strong></div><div class="detail"><span>Duración</span><strong>${esc(cliente.bonoDuracion||'-')} min</strong></div><div class="detail"><span>Modalidad</span><strong>${esc(cliente.bonoModalidad||'-')}</strong></div></section>
      <section class="service"><div class="service-head"><div>Concepto</div><div>Base</div><div>IVA</div><div>Total</div></div><div class="service-row"><div>${concepto}<br><span class="muted">Bono ${esc(cliente.bonoTotal||0)} sesiones · ${esc(cliente.bonoDuracion||'-')} min · ${esc(cliente.bonoModalidad||'-')}</span></div><div>${money(base)} €</div><div>${money(cuotaIva)} €</div><div><strong>${money(total)} €</strong></div></div></section>
      <section class="totals"><div><span>Base imponible</span><strong>${money(base)} €</strong></div><div><span>IVA (${money(iva)}%)</span><strong>${money(cuotaIva)} €</strong></div><div class="grand"><span>TOTAL</span><span>${money(total)} €</span></div></section>
      <section class="foot"><div>Factura generada por Rage Training. Documento asociado al pago registrado el ${fechaES(pago.fecha)}.</div><div class="registry"><strong>Datos registrales:</strong> ${esc(fiscal.datosRegistrales)}</div></section></main><div class="actions"><button class="close" onclick="window.close()">Cerrar</button><button class="print" onclick="window.print()">Guardar PDF / Imprimir</button></div></body></html>`;
    const w=window.open('','_blank');
    if(!w){ alert('El navegador ha bloqueado la ventana de factura. Permite ventanas emergentes para Rage Training.'); return; }
    w.document.open();w.document.write(html);w.document.close();
    setTimeout(()=>{try{w.focus()}catch(_){}},120);
  }
  window.generarFacturaRage=generarFactura;

  const renderPagosPrev=window.renderPagos;
  window.renderPagos=function(){
    if(typeof renderPagosPrev==='function') renderPagosPrev.apply(this,arguments);
    const lista=document.getElementById('pagosLista'); if(!lista) return;
    lista.querySelectorAll('.cliente-row').forEach(row=>{
      const ver=row.querySelector('.ver-btn'); if(!ver) return;
      const m=(ver.getAttribute('onclick')||'').match(/\((\d+)\)/); if(!m) return;
      const id=m[1], acciones=row.querySelector('.acciones'); if(!acciones||acciones.querySelector('.factura-btn')) return;
      const btn=document.createElement('button');btn.type='button';btn.className='factura-btn';btn.textContent='Generar factura';btn.onclick=()=>generarFactura(Number(id));acciones.appendChild(btn);
    });
  };

  const mostrarPrev=window.mostrarSeccion;
  window.mostrarSeccion=function(seccion){
    const r=typeof mostrarPrev==='function'?mostrarPrev.apply(this,arguments):undefined;
    if(seccion==='ajustes'){ setTimeout(()=>{ensureFiscalCard();fillFiscal();},0); }
    if(seccion==='pagos'){ setTimeout(()=>window.renderPagos(),0); }
    return r;
  };

  document.addEventListener('DOMContentLoaded',()=>{ensureFiscalCard();});
})();