import { ImageManipulator, SaveFormat, type ImageResult } from 'expo-image-manipulator';

/**
 * Tamaño máximo de una página guardada. 1600 px de ancho equivale a unos 190 ppp en un A4,
 * suficiente para leer e imprimir, y pesa 10-20 veces menos que la foto original.
 */
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 2400;
const JPEG_QUALITY = 0.75;

/** Reduce y comprime una imagen. Devuelve un JPEG nuevo en la caché de la app. */
export async function compressPage(uri: string, base64 = false): Promise<ImageResult> {
  const context = ImageManipulator.manipulate(uri, { maxWidth: MAX_WIDTH, maxHeight: MAX_HEIGHT });
  let image = await context.renderAsync();
  if (image.width > MAX_WIDTH || image.height > MAX_HEIGHT) {
    const scale = Math.min(MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
    image = await context.resize({ width: Math.round(image.width * scale) }).renderAsync();
  }
  return image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64 });
}
