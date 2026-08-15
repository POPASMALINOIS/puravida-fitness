(() => {
  const FISCAL_KEY='rageTrainingFiscal';
  function fiscalData(){try{return JSON.parse(localStorage.getItem(FISCAL_KEY)||'{}')}catch(_){return{}}}
  function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function money(v){const n=Number(String(v).replace(',','.'))||0;return n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function fechaES(v){try{return typeof formatearFechaES==='function'?formatearFechaES(v):v}catch(_){return v||'-'}}

  function generarFacturaUnaPagina(clienteId){
    const cliente=(typeof clientes!=='undefined'?clientes:[]).find(c=>Number(c.id)===Number(clienteId));
    if(!cliente){alert('Cliente no encontrado.');return}
    const pagos=[...(cliente.pagos||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    if(!pagos.length){alert('Este cliente todavía no tiene ningún pago registrado. Registra el pago antes de generar la factura.');return}
    const fiscal=fiscalData();
    if(!(fiscal.razonSocial&&fiscal.nif&&fiscal.direccion&&fiscal.cp&&fiscal.localidad&&fiscal.datosRegistrales)){
      alert('Completa primero todos los datos fiscales, incluidos los datos registrales, en Ajustes → Datos de facturación.');
      if(typeof mostrarSeccion==='function')mostrarSeccion('ajustes');
      return;
    }
    const pago=pagos[0];
    if(!pago.facturaNumero&&typeof window.generarFacturaRage==='function'){
      /* La numeración ya la asigna el módulo principal. Si aún no existe, usamos la secuencia compatible. */
      const serie=(fiscal.serie||'RT').toUpperCase(),y=new Date().getFullYear(),key=`rageInvoiceSeq_${serie}_${y}`;
      const seq=parseInt(localStorage.getItem(key)||'0',10)+1;localStorage.setItem(key,String(seq));
      pago.facturaNumero=`${serie}-${y}-${String(seq).padStart(4,'0')}`;
      pago.facturaFecha=typeof obtenerFechaISO==='function'?obtenerFechaISO(new Date()):new Date().toISOString().slice(0,10);
      if(typeof guardarDatos==='function')guardarDatos();
    }
    const numero=pago.facturaNumero||'FACTURA';
    const total=Number(String(pago.importe||cliente.cuota||0).replace(',','.'))||0;
    const iva=Number(fiscal.iva)||0,base=iva>0?total/(1+iva/100):total,cuotaIva=total-base;
    const concepto=esc(pago.concepto||`Bono ${cliente.bonoTotal||''} sesiones`);
    const logo=new URL('rage-logo.png',window.location.href).href;
    const facturaFecha=pago.facturaFecha||pago.fecha;
    const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura ${esc(numero)}</title><style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e9edf2;font-family:Arial,Helvetica,sans-serif;color:#111827}.page{position:relative;width:210mm;height:297mm;margin:0 auto;background:#fff;padding:11mm 13mm 22mm;overflow:hidden}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2.5px solid #F15A24;padding-bottom:9px}.logo{width:115px;max-height:50px;object-fit:contain;object-position:left top}.invoice-head{text-align:right}.invoice-head h1{margin:0 0 3px;font-size:24px;letter-spacing:.08em}.invoice-head strong{font-size:12px}.invoice-head p{margin:4px 0;font-size:10px}.paid{display:inline-block;margin-top:5px;padding:5px 9px;border-radius:999px;background:#fff3ed;color:#d84b14;font-size:9px;font-weight:700;letter-spacing:.08em}.muted{color:#64748b}.cols{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin:13px 0 10px}.block h3{margin:0 0 5px;font-size:9px;letter-spacing:.13em;color:#F15A24}.block p{margin:2px 0;font-size:10px;line-height:1.22}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0}.detail{padding:7px 8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px}.detail span{display:block;font-size:7px;color:#64748b;text-transform:uppercase;letter-spacing:.07em}.detail strong{display:block;margin-top:3px;font-size:10px}.service{margin-top:8px;border:1px solid #dbe2ea;border-radius:7px;overflow:hidden}.service-head,.service-row{display:grid;grid-template-columns:1fr 72px 72px 82px}.service-head{background:#07101d;color:#fff;font-size:8px;letter-spacing:.06em;text-transform:uppercase}.service-head div,.service-row div{padding:7px 8px}.service-row{font-size:9px}.service-row div:not(:first-child){text-align:right}.totals{width:245px;margin:9px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e7eb;font-size:10px}.totals .grand{margin-top:4px;padding:8px 9px;border:0;border-radius:6px;background:#07101d;color:#fff;font-size:13px;font-weight:700}.foot{position:absolute;left:13mm;right:13mm;bottom:9mm;padding-top:6px;border-top:1px solid #dfe5ec;color:#64748b;font-size:7px;line-height:1.25}.registry{margin-top:3px;color:#475569;white-space:normal;overflow-wrap:anywhere}.actions{position:fixed;right:16px;bottom:16px;display:flex;gap:8px}.actions button{border-radius:8px;padding:10px 13px;font-weight:700;cursor:pointer}.close{background:#fff;border:1px solid #d1d5db}.print{border:0;background:#F15A24;color:#fff}
@media print{@page{size:A4;margin:0}html,body{width:210mm!important;height:297mm!important;margin:0!important;padding:0!important;background:#fff!important;overflow:hidden!important}.page{width:210mm!important;height:297mm!important;min-height:297mm!important;max-height:297mm!important;margin:0!important;padding:11mm 13mm 22mm!important;overflow:hidden!important;break-after:avoid-page!important;page-break-after:avoid!important}.actions{display:none!important}}
</style></head><body><main class="page"><section class="top"><img class="logo" src="${logo}" alt="Rage Training"><div class="invoice-head"><h1>FACTURA</h1><strong>${esc(numero)}</strong><p class="muted">Fecha: ${fechaES(facturaFecha)}</p><span class="paid">PAGADO</span></div></section><section class="cols"><div class="block"><h3>EMISOR</h3><p><strong>${esc(fiscal.razonSocial)}</strong></p><p>NIF/CIF: ${esc(fiscal.nif)}</p><p>${esc(fiscal.direccion)}</p><p>${esc(fiscal.cp)} ${esc(fiscal.localidad)}${fiscal.provincia?`, ${esc(fiscal.provincia)}`:''}</p>${fiscal.email?`<p>${esc(fiscal.email)}</p>`:''}${fiscal.telefono?`<p>${esc(fiscal.telefono)}</p>`:''}</div><div class="block"><h3>CLIENTE</h3><p><strong>${esc(cliente.nombre)}</strong></p><p>Teléfono: ${esc(cliente.telefono||'-')}</p><p>Email: ${esc(cliente.email||'-')}</p><p>Fecha de alta: ${fechaES(cliente.fechaAlta||'')}</p></div></section><section class="details"><div class="detail"><span>Tipo de bono</span><strong>${esc(cliente.bonoTotal||0)} sesiones</strong></div><div class="detail"><span>Duración</span><strong>${esc(cliente.bonoDuracion||'-')} min</strong></div><div class="detail"><span>Modalidad</span><strong>${esc(cliente.bonoModalidad||'-')}</strong></div></section><section class="service"><div class="service-head"><div>Concepto</div><div>Base</div><div>IVA</div><div>Total</div></div><div class="service-row"><div>${concepto}<br><span class="muted">Bono ${esc(cliente.bonoTotal||0)} sesiones · ${esc(cliente.bonoDuracion||'-')} min · ${esc(cliente.bonoModalidad||'-')}</span></div><div>${money(base)} €</div><div>${money(cuotaIva)} €</div><div><strong>${money(total)} €</strong></div></div></section><section class="totals"><div><span>Base imponible</span><strong>${money(base)} €</strong></div><div><span>IVA (${money(iva)}%)</span><strong>${money(cuotaIva)} €</strong></div><div class="grand"><span>TOTAL</span><span>${money(total)} €</span></div></section><section class="foot"><div>Factura generada por Rage Training. Documento asociado al pago registrado el ${fechaES(pago.fecha)}.</div><div class="registry"><strong>Datos registrales:</strong> ${esc(fiscal.datosRegistrales)}</div></section></main><div class="actions"><button class="close" onclick="window.close()">Cerrar</button><button class="print" onclick="window.print()">Guardar PDF / Imprimir</button></div></body></html>`;
    const w=window.open('','_blank');if(!w){alert('El navegador ha bloqueado la ventana de factura. Permite ventanas emergentes para Rage Training.');return}
    w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{try{w.focus()}catch(_){}},120);
  }

  window.generarFacturaRageUnaPagina=generarFacturaUnaPagina;
  const renderPrev=window.renderPagos;
  window.renderPagos=function(){
    if(typeof renderPrev==='function')renderPrev.apply(this,arguments);
    document.querySelectorAll('#pagosLista .cliente-row').forEach(row=>{
      const ver=row.querySelector('.ver-btn'),btn=row.querySelector('.factura-btn');if(!ver||!btn)return;
      const m=(ver.getAttribute('onclick')||'').match(/\((\d+)\)/);if(!m)return;
      btn.onclick=()=>generarFacturaUnaPagina(Number(m[1]));
    });
  };
})();