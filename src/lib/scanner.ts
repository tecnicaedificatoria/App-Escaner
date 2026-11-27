import DocumentScanner, { ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';

/**
 * Abre el escáner nativo del sistema:
 * - Android: Google ML Kit Document Scanner
 * - iPhone: VisionKit (el mismo escáner de la app Notas)
 *
 * Ambos detectan los bordes, recortan, corrigen la perspectiva y permiten varias páginas.
 * Devuelve las rutas de las imágenes, o una lista vacía si el usuario cancela.
 */
export async function scanPages(): Promise<string[]> {
  const { scannedImages, status } = await DocumentScanner.scanDocument({
    croppedImageQuality: 90,
  });
  if (status === ScanDocumentResponseStatus.Cancel) return [];
  return scannedImages ?? [];
}
