(() => {
  const FISCAL_KEY='rageTrainingFiscal';
  const ORANGE='#F15A24', DARK='#07101d', TEXT='#111827', MUTED='#64748b', LINE='#dbe2ea', SOFT='#f8fafc';

  function fiscalData(){try{return JSON.parse(localStorage.getItem(FISCAL_KEY)||'{}')}catch(_){return{}}}
  function money(v){const n=Number(String(v).replace(',','.'))||0;return n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function fechaES(v){try{return typeof formatearFechaES==='function'?formatearFechaES(v):v}catch(_){return v||'-'}}
  function num(v){return Number(String(v??0).replace(',','.'))||0}

  function ensureInvoiceNumber(pago,fiscal){
    if(pago.facturaNumero)return pago.facturaNumero;
    const serie=(fiscal.serie||'RT').toUpperCase(),y=new Date().getFullYear(),key=`rageInvoiceSeq_${serie}_${y}`;
    const seq=parseInt(localStorage.getItem(key)||'0',10)+1;
    localStorage.setItem(key,String(seq));
    pago.facturaNumero=`${serie}-${y}-${String(seq).padStart(4,'0')}`;
    pago.facturaFecha=typeof obtenerFechaISO==='function'?obtenerFechaISO(new Date()):new Date().toISOString().slice(0,10);
    if(typeof guardarDatos==='function')guardarDatos();
    return pago.facturaNumero;
  }

  function loadLogo(){
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=new URL('rage-logo.png',window.location.href).href;
    });
  }

  function roundedRect(ctx,x,y,w,h,r,fill,stroke){
    const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
  }
  function text(ctx,t,x,y,size=22,weight='400',color=TEXT,align='left'){
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial, Helvetica, sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(t??''),x,y);
  }
  function wrapText(ctx,t,x,y,maxW,lineH,size=18,weight='400',color=TEXT,maxLines=3){
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial, Helvetica, sans-serif`;ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const words=String(t??'').split(/\s+/);let line='',yy=y,lines=0;
    for(let i=0;i<words.length;i++){
      const test=line?line+' '+words[i]:words[i];
      if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,yy);yy+=lineH;lines++;line=words[i];if(lines>=maxLines-1)break}else line=test;
    }
    if(line&&lines<maxLines)ctx.fillText(line,x,yy);
  }
  function labelValue(ctx,label,value,x,y,w){
    roundedRect(ctx,x,y,w,72,10,SOFT,LINE);text(ctx,label.toUpperCase(),x+16,y+22,13,'700',MUTED);text(ctx,value,x+16,y+52,20,'700',TEXT);
  }

  function dataUrlBytes(dataUrl){
    const b64=dataUrl.split(',')[1],bin=atob(b64),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return arr;
  }
  function asciiBytes(s){return new TextEncoder().encode(s)}
  function concatBytes(parts){let len=0;parts.forEach(p=>len+=p.length);const out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});return out}
  function buildSinglePagePdf(jpegBytes,imgW,imgH){
    const objs=[];
    objs[1]=asciiBytes('<< /Type /Catalog /Pages 2 0 R >>');
    objs[2]=asciiBytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objs[3]=asciiBytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    objs[4]=concatBytes([asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),jpegBytes,asciiBytes('\nendstream')]);
    const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
    objs[5]=asciiBytes(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    const head=asciiBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');let offset=head.length;const chunks=[head],xref=[0];
    for(let i=1;i<=5;i++){xref[i]=offset;const pre=asciiBytes(`${i} 0 obj\n`),post=asciiBytes('\nendobj\n');chunks.push(pre,objs[i],post);offset+=pre.length+objs[i].length+post.length}
    const xrefOffset=offset;let xt=`xref\n0 6\n0000000000 65535 f \n`;for(let i=1;i<=5;i++)xt+=String(xref[i]).padStart(10,'0')+' 00000 n \n';
    xt+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(asciiBytes(xt));return new Blob([concatBytes(chunks)],{type:'application/pdf'});
  }

  async function generarFacturaPDF(clienteId){
    const cliente=(typeof clientes!=='undefined'?clientes:[]).find(c=>Number(c.id)===Number(clienteId));
    if(!cliente){alert('Cliente no encontrado.');return}
    const pagos=[...(cliente.pagos||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    if(!pagos.length){alert('Este cliente todavía no tiene ningún pago registrado. Registra el pago antes de generar la factura.');return}
    const fiscal=fiscalData();
    if(!(fiscal.razonSocial&&fiscal.nif&&fiscal.direccion&&fiscal.cp&&fiscal.localidad&&fiscal.datosRegistrales)){
      alert('Completa primero todos los datos fiscales, incluidos los datos registrales, en Ajustes → Datos de facturación.');if(typeof mostrarSeccion==='function')mostrarSeccion('ajustes');return;
    }
    const pago=pagos[0],numero=ensureInvoiceNumber(pago,fiscal),total=num(pago.importe||cliente.cuota),iva=num(fiscal.iva),base=iva>0?total/(1+iva/100):total,cuotaIva=total-base;
    const W=1240,H=1754,ctx=document.createElement('canvas').getContext('2d');ctx.canvas.width=W;ctx.canvas.height=H;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    const m=86,right=W-m,logo=await loadLogo();
    if(logo){const ratio=Math.min(150/logo.width,88/logo.height);ctx.drawImage(logo,m,62,logo.width*ratio,logo.height*ratio)}else{text(ctx,'RAGE TRAINING',m,108,28,'700',ORANGE)}
    text(ctx,'FACTURA',right,96,38,'700',DARK,'right');text(ctx,numero,right,128,18,'700',TEXT,'right');text(ctx,`Fecha: ${fechaES(pago.facturaFecha||pago.fecha)}`,right,154,16,'400',MUTED,'right');
    roundedRect(ctx,right-132,170,132,38,19,'#fff3ed');text(ctx,'PAGADO',right-66,196,15,'700','#d84b14','center');
    ctx.fillStyle=ORANGE;ctx.fillRect(m,232,W-2*m,5);

    text(ctx,'EMISOR',m,282,15,'700',ORANGE);text(ctx,'CLIENTE',650,282,15,'700',ORANGE);
    text(ctx,fiscal.razonSocial,m,314,20,'700');text(ctx,`NIF/CIF: ${fiscal.nif}`,m,342,17);text(ctx,fiscal.direccion,m,368,17);text(ctx,`${fiscal.cp} ${fiscal.localidad}${fiscal.provincia?', '+fiscal.provincia:''}`,m,394,17);if(fiscal.email)text(ctx,fiscal.email,m,420,17);if(fiscal.telefono)text(ctx,fiscal.telefono,m,446,17);
    text(ctx,cliente.nombre||'-',650,314,20,'700');text(ctx,`Teléfono: ${cliente.telefono||'-'}`,650,342,17);text(ctx,`Email: ${cliente.email||'-'}`,650,368,17);text(ctx,`Fecha de alta: ${fechaES(cliente.fechaAlta||'')}`,650,394,17);

    const gap=16,cardW=(W-2*m-gap*2)/3;labelValue(ctx,'Tipo de bono',`${cliente.bonoTotal||0} sesiones`,m,500,cardW);labelValue(ctx,'Duración',`${cliente.bonoDuracion||'-'} min`,m+cardW+gap,500,cardW);labelValue(ctx,'Modalidad',cliente.bonoModalidad||'-',m+(cardW+gap)*2,500,cardW);

    const sy=610,sh=46;roundedRect(ctx,m,sy,W-2*m,sh,8,DARK);text(ctx,'CONCEPTO',m+18,sy+30,14,'700','#fff');text(ctx,'BASE',845,sy+30,14,'700','#fff','right');text(ctx,'IVA',995,sy+30,14,'700','#fff','right');text(ctx,'TOTAL',right-18,sy+30,14,'700','#fff','right');
    roundedRect(ctx,m,sy+sh,W-2*m,100,0,'#fff',LINE);text(ctx,pago.concepto||'Cuota inicial / alta',m+18,sy+sh+34,17,'700');text(ctx,`Bono ${cliente.bonoTotal||0} sesiones · ${cliente.bonoDuracion||'-'} min · ${cliente.bonoModalidad||'-'}`,m+18,sy+sh+64,15,'400',MUTED);text(ctx,`${money(base)} €`,845,sy+sh+52,17,'400',TEXT,'right');text(ctx,`${money(cuotaIva)} €`,995,sy+sh+52,17,'400',TEXT,'right');text(ctx,`${money(total)} €`,right-18,sy+sh+52,17,'700',TEXT,'right');

    const tx=760,tw=right-tx,ty=800;ctx.strokeStyle=LINE;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(tx,ty+36);ctx.lineTo(right,ty+36);ctx.stroke();text(ctx,'Base imponible',tx,ty+24,17);text(ctx,`${money(base)} €`,right,ty+24,17,'700',TEXT,'right');ctx.beginPath();ctx.moveTo(tx,ty+78);ctx.lineTo(right,ty+78);ctx.stroke();text(ctx,`IVA (${money(iva)}%)`,tx,ty+66,17);text(ctx,`${money(cuotaIva)} €`,right,ty+66,17,'700',TEXT,'right');roundedRect(ctx,tx,ty+94,tw,64,9,DARK);text(ctx,'TOTAL',tx+18,ty+135,21,'700','#fff');text(ctx,`${money(total)} €`,right-18,ty+135,21,'700','#fff','right');

    const fy=1570;ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(m,fy);ctx.lineTo(right,fy);ctx.stroke();text(ctx,`Factura generada por Rage Training. Documento asociado al pago registrado el ${fechaES(pago.fecha)}.`,m,fy+32,13,'400',MUTED);text(ctx,'Datos registrales:',m,fy+60,13,'700','#475569');wrapText(ctx,fiscal.datosRegistrales,m+112,fy+60,right-(m+112),19,13,'400','#475569',3);

    const jpeg=dataUrlBytes(ctx.canvas.toDataURL('image/jpeg',0.94)),pdf=buildSinglePagePdf(jpeg,W,H),url=URL.createObjectURL(pdf),filename=`Factura ${numero}.pdf`;
    const a=document.createElement('a');a.href=url;a.download=filename;a.target='_blank';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  window.generarFacturaRagePDF=generarFacturaPDF;
  const renderPrev=window.renderPagos;
  window.renderPagos=function(){
    if(typeof renderPrev==='function')renderPrev.apply(this,arguments);
    document.querySelectorAll('#pagosLista .cliente-row').forEach(row=>{
      const ver=row.querySelector('.ver-btn'),btn=row.querySelector('.factura-btn');if(!ver||!btn)return;
      const m=(ver.getAttribute('onclick')||'').match(/\((\d+)\)/);if(!m)return;
      btn.textContent='Generar factura';btn.onclick=()=>generarFacturaPDF(Number(m[1]));
    });
  };
})();