(function () {
  window.Timetable = window.Timetable || {};

  const UI = window.Timetable.UI;

  function getHtml2Canvas() {
    return (typeof html2canvas !== 'undefined') ? html2canvas : null;
  }

  function getJsPDFClass() {
    if (typeof jsPDF !== 'undefined') return jsPDF;
    if (window.jspdf && typeof window.jspdf.jsPDF !== 'undefined') return window.jspdf.jsPDF;
    return null;
  }

  function captureStage() {
    const stage = document.getElementById('timetables-stage');
    if (!stage) throw new Error('Timetable stage not found.');

    const h2c = getHtml2Canvas();
    if (!h2c) {
      throw new Error('html2canvas is not loaded. PNG/PDF export requires the export libraries.');
    }

    const originalOverflow = stage.style.overflow;
    stage.style.overflow = 'visible';

    const width = stage.scrollWidth;
    const height = stage.scrollHeight;

    return h2c(stage, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height
    }).then(canvas => {
      stage.style.overflow = originalOverflow;
      return canvas;
    });
  }

  function exportPNG() {
    captureStage()
      .then(canvas => {
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `timetable-${new Date().toISOString().slice(0, 10)}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          UI.showToast('PNG downloaded');
        }, 'image/png');
      })
      .catch(err => {
        console.error(err);
        UI.showToast(err.message, true);
      });
  }

  function exportPDF() {
    const jsPDFClass = getJsPDFClass();
    if (!jsPDFClass) {
      UI.showToast('jsPDF is not loaded. PDF export requires the export libraries.', true);
      return;
    }

    captureStage()
      .then(canvas => {
        const ratio = canvas.width / canvas.height;
        const orientation = ratio > 1.2 ? 'l' : 'p';
        const pdf = new jsPDFClass({ orientation, unit: 'mm', format: 'a4' });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const padding = 10;

        const maxWidth = pageWidth - padding * 2;
        const maxHeight = pageHeight - padding * 2;

        let imgWidth = maxWidth;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * ratio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save(`timetable-${new Date().toISOString().slice(0, 10)}.pdf`);
        UI.showToast('PDF downloaded');
      })
      .catch(err => {
        console.error(err);
        UI.showToast(err.message, true);
      });
  }

  window.Timetable.Export = {
    exportPNG,
    exportPDF,
    captureStage
  };
})();
