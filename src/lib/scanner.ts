import { Platform } from 'react-native';

/**
 * Abre el escáner nativo del sistema:
 * - Android: Google ML Kit Document Scanner (módulo propio en modules/document-scanner)
 * - iPhone: VisionKit, el mismo escáner de la app Notas (react-native-document-scanner-plugin)
 *
 * Ambos detectan los bordes, recortan, corrigen la perspectiva y permiten varias páginas.
 * Devuelve las rutas de las imágenes, o una lista vacía si el usuario cancela.
 */
export async function scanPages(): Promise<string[]> {
  if (Platform.OS === 'android') {
    // Se carga aquí para no requerir el módulo nativo en iOS.
    const AndroidScanner = (await import('../../modules/document-scanner')).default;
    const { status, scannedImages } = await AndroidScanner.scanDocumentAsync(null);
    return status === 'success' ? scannedImages : [];
  }

  // La librería solo está enlazada en iOS (ver react-native.config.js).
  const { default: DocumentScanner, ScanDocumentResponseStatus } = await import(
    'react-native-document-scanner-plugin'
  );
  const { scannedImages, status } = await DocumentScanner.scanDocument({
    croppedImageQuality: 90,
  });
  if (status === ScanDocumentResponseStatus.Cancel) return [];
  return scannedImages ?? [];
}
