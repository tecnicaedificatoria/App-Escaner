import { Directory, File, Paths } from 'expo-file-system';

import { compressPage } from './images';

/**
 * Documentos guardados en el propio teléfono.
 *
 * Estructura en disco (carpeta privada de la app):
 *   documents/<id>/meta.json   -> nombre, fecha y orden de páginas
 *   documents/<id>/<página>.jpg
 *   documents/<id>/<nombre>.pdf (se regenera al exportar)
 */
export type ScannedDocument = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Nombres de archivo de las páginas, en orden. */
  pages: string[];
};

const META_FILE = 'meta.json';

function rootDir(): Directory {
  const dir = new Directory(Paths.document, 'documents');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function docDir(id: string): Directory {
  return new Directory(rootDir(), id);
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** El escáner de iOS devuelve rutas sin esquema; las convertimos en URI. */
function toUri(path: string): string {
  return /^[a-z]+:\/\//i.test(path) ? path : `file://${path}`;
}

function defaultName(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `Escaneo ${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(
    date.getHours(),
  )}.${pad(date.getMinutes())}`;
}

function writeMeta(doc: ScannedDocument): void {
  const file = new File(docDir(doc.id), META_FILE);
  file.write(JSON.stringify(doc));
}

function readMeta(dir: Directory): ScannedDocument | null {
  const file = new File(dir, META_FILE);
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as ScannedDocument;
  } catch {
    return null;
  }
}

/** Copia las imágenes del escáner (temporales) a la carpeta del documento. */
async function importImages(dir: Directory, imagePaths: string[]): Promise<string[]> {
  const names: string[] = [];
  for (const path of imagePaths) {
    const name = `${newId()}.jpg`;
    // Guardamos una versión reducida: el PDF se genera mucho más rápido y ocupa menos.
    const compressed = await compressPage(toUri(path));
    await new File(compressed.uri).move(new File(dir, name));
    names.push(name);
  }
  return names;
}

export function listDocuments(): ScannedDocument[] {
  return rootDir()
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map(readMeta)
    .filter((doc): doc is ScannedDocument => doc !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDocument(id: string): ScannedDocument | null {
  const dir = docDir(id);
  return dir.exists ? readMeta(dir) : null;
}

export function pageUri(doc: ScannedDocument, page: string): string {
  return new File(docDir(doc.id), page).uri;
}

export async function createDocument(imagePaths: string[]): Promise<ScannedDocument> {
  const now = new Date();
  const id = newId();
  const dir = docDir(id);
  dir.create({ intermediates: true });
  const pages = await importImages(dir, imagePaths);
  const doc: ScannedDocument = {
    id,
    name: defaultName(now),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    pages,
  };
  writeMeta(doc);
  return doc;
}

export async function addPages(doc: ScannedDocument, imagePaths: string[]): Promise<ScannedDocument> {
  const pages = await importImages(docDir(doc.id), imagePaths);
  const updated = { ...doc, pages: [...doc.pages, ...pages], updatedAt: new Date().toISOString() };
  writeMeta(updated);
  return updated;
}

export function removePage(doc: ScannedDocument, page: string): ScannedDocument {
  const file = new File(docDir(doc.id), page);
  if (file.exists) file.delete();
  const updated = {
    ...doc,
    pages: doc.pages.filter((p) => p !== page),
    updatedAt: new Date().toISOString(),
  };
  writeMeta(updated);
  return updated;
}

export function movePage(doc: ScannedDocument, index: number, delta: -1 | 1): ScannedDocument {
  const target = index + delta;
  if (target < 0 || target >= doc.pages.length) return doc;
  const pages = [...doc.pages];
  [pages[index], pages[target]] = [pages[target], pages[index]];
  const updated = { ...doc, pages, updatedAt: new Date().toISOString() };
  writeMeta(updated);
  return updated;
}

export function renameDocument(doc: ScannedDocument, name: string): ScannedDocument {
  const trimmed = name.trim();
  if (!trimmed || trimmed === doc.name) return doc;
  const updated = { ...doc, name: trimmed, updatedAt: new Date().toISOString() };
  writeMeta(updated);
  return updated;
}

export function deleteDocument(id: string): void {
  const dir = docDir(id);
  if (dir.exists) dir.delete();
}

/** Carpeta del documento, para guardar ahí el PDF generado. */
export function documentDirectory(id: string): Directory {
  return docDir(id);
}
