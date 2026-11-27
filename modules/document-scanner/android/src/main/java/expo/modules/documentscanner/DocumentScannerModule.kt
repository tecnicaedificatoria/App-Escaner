package expo.modules.documentscanner

import android.app.Activity
import android.util.Log
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Escáner de documentos de Android con Google ML Kit.
 *
 * Abre la pantalla de escaneo de Google Play services (detección de bordes, recorte,
 * filtros y varias páginas) y devuelve las URI de las imágenes JPEG resultantes.
 */
class DocumentScannerModule : Module() {
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("DocumentScanner")

    AsyncFunction("scanDocumentAsync") { pageLimit: Int?, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("ERR_NO_ACTIVITY", "La app no está en primer plano.", null)
        return@AsyncFunction
      }
      if (pendingPromise != null) {
        promise.reject("ERR_BUSY", "Ya hay un escaneo en curso.", null)
        return@AsyncFunction
      }

      pendingPromise = promise
      try {
        val builder = GmsDocumentScannerOptions.Builder()
          .setGalleryImportAllowed(true)
          .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
          .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
        if (pageLimit != null && pageLimit > 0) {
          builder.setPageLimit(pageLimit)
        }

        GmsDocumentScanning.getClient(builder.build())
          .getStartScanIntent(activity)
          .addOnSuccessListener { intentSender ->
            try {
              activity.startIntentSenderForResult(intentSender, REQUEST_CODE, null, 0, 0, 0)
            } catch (error: Throwable) {
              finishWithError("No se pudo abrir el escáner", error)
            }
          }
          .addOnFailureListener { error ->
            finishWithError("No se pudo abrir el escáner", error)
          }
      } catch (error: Throwable) {
        finishWithError("Error al iniciar el escáner", error)
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_CODE) return@OnActivityResult
      val promise = pendingPromise ?: return@OnActivityResult
      pendingPromise = null

      if (payload.resultCode != Activity.RESULT_OK) {
        promise.resolve(mapOf("status" to "cancel", "scannedImages" to emptyList<String>()))
        return@OnActivityResult
      }

      val result = GmsDocumentScanningResult.fromActivityResultIntent(payload.data)
      val images = result?.pages?.map { it.imageUri.toString() } ?: emptyList()
      promise.resolve(mapOf("status" to "success", "scannedImages" to images))
    }
  }

  private fun finishWithError(message: String, cause: Throwable?) {
    val promise = pendingPromise ?: return
    pendingPromise = null
    // Incluye las primeras líneas de la traza para poder diagnosticar fallos en el móvil.
    val trace = cause?.let { Log.getStackTraceString(it).lineSequence().take(8).joinToString("\n") }
    Log.e("DocumentScanner", message, cause)
    promise.reject("ERR_SCANNER", if (trace != null) "$message\n\n$trace" else message, cause)
  }

  companion object {
    private const val REQUEST_CODE = 0x5C4E
  }
}
