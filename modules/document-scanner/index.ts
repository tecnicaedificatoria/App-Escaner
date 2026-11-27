import { requireNativeModule } from 'expo';

export type ScanResult = {
  status: 'success' | 'cancel';
  scannedImages: string[];
};

type NativeDocumentScanner = {
  scanDocumentAsync(pageLimit: number | null): Promise<ScanResult>;
};

/** Módulo nativo propio de Android (ML Kit). En iOS se usa VisionKit vía otra librería. */
export default requireNativeModule<NativeDocumentScanner>('DocumentScanner');
