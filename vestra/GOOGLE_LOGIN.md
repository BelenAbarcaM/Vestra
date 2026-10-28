# Inicio de sesión con Google

Esta guía queda como referencia para continuar la integración de Google Login en Vestra. La configuración de Capacitor y las URL configurables de la API se mantienen en el proyecto.

## Google Cloud Console

1. Crea o selecciona un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Configura la pantalla de consentimiento OAuth y añade los usuarios de prueba mientras la aplicación esté en modo de pruebas.
3. En **APIs y servicios → Credenciales**, crea las credenciales que correspondan a cada plataforma:
   - **Aplicación web** para React ejecutándose en navegador. Añade los orígenes JavaScript locales que uses, por ejemplo `http://localhost:3000`.
   - Para Android, registra el nombre de paquete `com.vestra.app` y la huella SHA-1 del certificado de firma.
4. No publiques secretos OAuth en el frontend. El ID de cliente de tipo web no es un secreto, pero cualquier secreto de cliente debe permanecer en el backend.

## Configuración local

Guarda la configuración de desarrollo en variables de entorno locales y no subas archivos `.env` con credenciales al repositorio. Para probar desde un teléfono, configura también una URL HTTPS accesible desde el dispositivo para el backend; `localhost` en el teléfono apunta al propio teléfono, no a la computadora.

## Integración pendiente

La autenticación debe validar la credencial o el token recibido de Google en el backend antes de crear la sesión de Vestra. Después, el backend debe devolver el mismo formato de sesión que `backend/api/login.php` (`success`, `id_usuario`, `usuario` y `tipo`) para que el frontend pueda continuar con el flujo normal de la aplicación.

Para la app Android con Capacitor, se debe elegir y configurar un flujo compatible con Android y registrar en Google Cloud el paquete y la huella SHA-1 usados para la compilación. No se debe asumir que un origen web local como `http://localhost:3000` configura por sí solo la autenticación nativa.

## Estado actual

El inicio de sesión existente por correo y contraseña sigue en `frontend/src/componentes/Login.js`. Esta guía conserva los pasos y requisitos para que la integración de Google pueda retomarse por separado.
