# Vestra como app Android con Capacitor

El proyecto usa React con Capacitor 8. Los proyectos nativos están en `frontend/android` y `frontend/ios`; el identificador Android configurado es `com.vestra.app`.

## Preparar el backend

La app ya obtiene desde variables de entorno las URLs de la API y de las imágenes. Copia `frontend/.env.example` a `frontend/.env`.

- En el navegador de la computadora, puedes dejar `REACT_APP_API_BASE_URL=http://localhost/vestra/backend/api`.
- En un teléfono, `localhost` apunta al teléfono. Usa una URL HTTPS accesible desde el dispositivo, por ejemplo un túnel temporal a tu Apache local: `ngrok http 80`. Configura `REACT_APP_API_BASE_URL` con la URL temporal seguida de `/vestra/backend/api`.
- Si defines `VESTRA_ALLOWED_ORIGINS` en Apache, incluye los orígenes de desarrollo `http://localhost`, `https://localhost` y `capacitor://localhost`. El backend permite esos orígenes por defecto.

El backend debe responder por HTTPS para que el WebView pueda usar las cookies de sesión de PHP entre la app y la API. PHP cURL y MySQL también deben estar activos.

## Generar e instalar un APK de prueba

1. Instala Android Studio y abre `frontend/android` (o usa `npx cap open android` desde `frontend`). Espera a que Android Studio termine la sincronización de Gradle.
2. Desde la carpeta `frontend`, genera los archivos de React y sincronízalos con Android:

   ```text
   npm run build
   npx cap sync android
   ```

   Repite esos dos comandos cada vez que cambies el frontend antes de crear otro APK.

3. En Android Studio selecciona **Build → Build Bundle(s) / APK(s) → Build APK(s)**. La APK de depuración se guarda normalmente en `frontend/android/app/build/outputs/apk/debug/app-debug.apk`; puedes instalarla en un teléfono para probar.

## Crear una APK firmada para distribuir

En Android Studio selecciona **Build → Generate Signed Bundle / APK → APK**. Crea un keystore y una clave si todavía no tienes una, selecciona la variante `release` y termina el asistente. Conserva el keystore y sus contraseñas en un lugar seguro: los necesitarás para firmar futuras actualizaciones con la misma clave. Android Studio muestra la ubicación de la APK firmada al finalizar. Android requiere que una APK esté firmada para instalarla o actualizarla. [Guía de firma de Android](https://developer.android.com/studio/publish/app-signing)

## Notas

- Para publicar en Google Play normalmente se entrega un Android App Bundle (`.aab`); para instalar directamente o compartir el instalador se usa una APK.
- Cambia `appId` en `frontend/capacitor.config.ts` antes de publicar si `com.vestra.app` no será el identificador definitivo. Debe coincidir con `applicationId` del proyecto Android.
- iOS requiere macOS y Xcode; este documento describe cómo generar APK para Android.
