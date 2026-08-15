(() => {
  let lastPdfBlob = null;
  let lastPdfUrl = '';

  const originalCreateObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(obj){
    const url = originalCreateObjectURL(obj);
    if (obj instanceof Blob && obj.type === 'application/pdf') {
      lastPdfBlob = obj;
      lastPdfUrl = url;
    }
    return url;
  };

  function currentFilename(){
    return document.querySelector('#rage-pdf-actions .rage-pdf-top h3')?.textContent?.trim() || 'Factura Rage Training.pdf';
  }

  async function savePdfSafely(){
    if (!lastPdfBlob) {
      alert('No se ha podido recuperar el PDF generado. Vuelve a pulsar Generar factura.');
      return;
    }

    const filename = currentFilename();
    const file = new File([lastPdfBlob], filename, { type: 'application/pdf' });

    // En iPhone/iPad y otros dispositivos compatibles usamos la hoja nativa
    // de compartir/guardar para no navegar fuera de la PWA.
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    // Escritorio / navegadores con descarga real.
    const a = document.createElement('a');
    a.href = lastPdfUrl || originalCreateObjectURL(lastPdfBlob);
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function enhanceDialog(root){
    const card = root.querySelector('.rage-pdf-card');
    const save = root.querySelector('.rage-pdf-save');
    const buttons = root.querySelector('.rage-pdf-buttons');
    if (!card || !save || !buttons || root.dataset.saveFixed === '1') return;
    root.dataset.saveFixed = '1';

    // Eliminamos el comportamiento anterior que en iOS podía sustituir la PWA
    // por la URL blob y dejar al usuario sin navegación.
    const safeSave = save.cloneNode(true);
    save.replaceWith(safeSave);
    safeSave.textContent = 'Guardar / Compartir PDF';
    safeSave.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await savePdfSafely();
    });

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'rage-pdf-back';
    back.textContent = 'Volver a Pagos';
    back.style.cssText = 'grid-column:1/-1;min-height:44px;border-radius:10px;border:1px solid #31425a;background:transparent;color:#aebbd0;font-weight:800;cursor:pointer';
    back.addEventListener('click', () => root.remove());
    buttons.appendChild(back);
  }

  const observer = new MutationObserver(() => {
    const root = document.getElementById('rage-pdf-actions');
    if (root) enhanceDialog(root);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();