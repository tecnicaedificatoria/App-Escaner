# Escáner

App para Android e iPhone que escanea documentos con la cámara del teléfono, los guarda en el propio dispositivo y los comparte como PDF.

Hecha con **React Native + Expo** (SDK 58). El escaneo usa los escáneres nativos de cada sistema a través de [`react-native-document-scanner-plugin`](https://github.com/WebsiteBeaver/react-native-document-scanner-plugin):

- **Android:** Google ML Kit Document Scanner
- **iPhone:** VisionKit (el mismo escáner de la app Notas)

Los dos detectan los bordes, recortan, corrigen la perspectiva y permiten escanear varias páginas seguidas.

## Qué hace la versión 1

- Escanear un documento de una o varias páginas.
- Lista de documentos guardados, con miniatura, número de páginas y fecha.
- Renombrar, añadir páginas, reordenarlas (subir o bajar) y quitar páginas.
- Exportar a PDF (una página A4 por imagen) y compartirlo por correo, WhatsApp, Drive, etc.
- Eliminar documentos.

Todo se guarda en la carpeta privada de la app. No hay servidor ni cuentas.

## Estructura

```
src/app/_layout.tsx        Navegación (Expo Router)
src/app/index.tsx          Pantalla «Mis documentos»
src/app/document/[id].tsx  Pantalla de un documento
src/lib/documents.ts       Guardado en disco (expo-file-system)
src/lib/scanner.ts         Llamada al escáner nativo
src/lib/pdf.ts             Generar y compartir el PDF (expo-print, expo-sharing)
```

## Probar la app en un teléfono

El escáner es código nativo, así que **no funciona en Expo Go**: hace falta una *development build*. Se compila en la nube con EAS, sin necesidad de Mac ni de Android Studio.

1. Crea una cuenta gratuita en [expo.dev](https://expo.dev).
2. Instala dependencias e inicia sesión:
   ```bash
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
3. Compila la build de desarrollo:
   ```bash
   npx eas-cli@latest build --profile development --platform android   # o ios
   ```
   En iPhone, EAS te pedirá registrar el dispositivo y hace falta la cuenta de Apple Developer.
4. Instala en el teléfono la build que te da EAS (enlace o código QR) y arranca el servidor:
   ```bash
   npm start
   ```

Para una versión de prueba que no necesita el servidor, usa `--profile preview`. En Android genera un APK instalable directamente.

## Publicar en las tiendas

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

Antes hace falta:

- **Google Play Console** (25 USD, un solo pago). Las cuentas personales nuevas tienen que hacer una prueba cerrada con 12 testers durante 14 días antes de publicar en producción.
- **Apple Developer Program** (99 USD al año). Cada versión pasa por la revisión de Apple.
- Una **política de privacidad** publicada en una URL, e iconos y capturas para las fichas de las tiendas.

Identificador de la app en ambas tiendas: `com.tecnicaedificatoria.escaner` (está en `app.json`).

## Comprobaciones

```bash
npm run typecheck
npm run lint
```
