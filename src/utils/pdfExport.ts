export interface PdfExportOptions {
  scale?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  fallbackToPrint?: boolean;
}

/**
 * On-demand lazy PDF export utility that dynamically imports heavy
 * html2canvas and jspdf libraries only when invoked by the user.
 */
export async function exportElementToPdf(
  element: HTMLElement | null,
  fileName: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    scale = 2,
    format = 'a4',
    orientation = 'portrait',
    fallbackToPrint = true,
  } = options;

  if (!element) {
    if (fallbackToPrint && typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return false;
  }

  try {
    const [html2canvasModule, jspdfModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const html2canvas = (html2canvasModule.default || html2canvasModule) as (
      element: HTMLElement,
      options?: any
    ) => Promise<HTMLCanvasElement>;
    const jsPdfConstructor = (jspdfModule.default || (jspdfModule as any).jsPDF || jspdfModule) as any;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPdfConstructor({
      orientation,
      unit: 'mm',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('PDF export fallback:', err);
    if (fallbackToPrint && typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return false;
  }
}
