import { File } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import { documentDirectory, pageUri, type ScannedDocument } from './documents';

// Tamaño A4 en puntos (72 ppp).
const A4 = { width: 595, height: 842 };

function safeFileName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 _.-]/g, '')
    .trim();
  return cleaned || 'documento';
}

function buildHtml(images: string[]): string {
  const pages = images
    .map((src) => `<div class="page"><img src="data:image/jpeg;base64,${src}" /></div>`)
    .join('');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;
          page-break-after: always; break-after: page; overflow: hidden; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style></head>
<body>${pages}</body></html>`;
}

/** Genera un PDF (una página A4 por imagen) y devuelve su archivo. */
export async function exportPdf(doc: ScannedDocument): Promise<File> {
  if (doc.pages.length === 0) throw new Error('El documento no tiene páginas.');

  const images = await Promise.all(doc.pages.map((page) => new File(pageUri(doc, page)).base64()));
  const { uri } = await printToFileAsync({
    html: buildHtml(images),
    width: A4.width,
    height: A4.height,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const dir = documentDirectory(doc.id);
  for (const entry of dir.list()) {
    if (entry instanceof File && entry.extension === '.pdf') entry.delete();
  }
  const target = new File(dir, `${safeFileName(doc.name)}.pdf`);
  await new File(uri).move(target);
  return target;
}

/** Genera el PDF y abre el menú de compartir del sistema. */
export async function sharePdf(doc: ScannedDocument): Promise<void> {
  if (!(await isAvailableAsync())) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  const pdf = await exportPdf(doc);
  await shareAsync(pdf.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: doc.name,
  });
}
