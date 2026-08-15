(() => {
  let lastPdfBlob = null;
  let lastPdfUrl = '';

  const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(object){
    const url = nativeCreateObjectURL(object);
    if (object instanceof Blob && object.type === 'application/pdf') {
      lastPdfBlob = object;
      lastPdfUrl = url;
    }
    return url;
  };

  function invoiceFilename(){
    return document.querySelector('#rage-pdf-actions .rage-pdf-top h3')?.textContent?.trim() || 'Factura Rage Training.pdf';
  }

  async function saveWithoutLeavingApp(){
    if (!lastPdfBlob) {
      alert('No se ha podido recuperar el PDF. Vuelve a pulsar Generar factura.');
      return;
    }

    const filename = invoiceFilename();
    const file = new File([lastPdfBlob], filename, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const anchor = document.createElement('a');
    anchor.href = lastPdfUrl || nativeCreateObjectURL(lastPdfBlob);
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function patchInvoiceDialog(dialog){
    if (!dialog || dialog.dataset.rageSaveFixed === '1') return;
    const oldSave = dialog.querySelector('.rage-pdf-save');
    const buttons = dialog.querySelector('.rage-pdf-buttons');
    if (!oldSave || !buttons) return;
    dialog.dataset.rageSaveFixed = '1';

    const save = oldSave.cloneNode(true);
    oldSave.replaceWith(save);
    save.textContent = 'Guardar / Compartir PDF';
    save.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      await saveWithoutLeavingApp();
    });

    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Volver a Pagos';
    back.className = 'rage-pdf-back';
    back.style.cssText = 'grid-column:1/-1;min-height:44px;border-radius:10px;border:1px solid #31425a;background:transparent;color:#aebbd0;font-weight:800;cursor:pointer';
    back.addEventListener('click', () => dialog.remove());
    buttons.appendChild(back);
  }

  const observer = new MutationObserver(() => {
    patchInvoiceDialog(document.getElementById('rage-pdf-actions'));
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();