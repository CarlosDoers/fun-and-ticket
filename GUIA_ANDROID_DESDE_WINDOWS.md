# Guía para Compilar en Android desde Windows

A diferencia de iOS, Windows es una plataforma de primera clase para el desarrollo de Android. Puedes compilar y ejecutar tu aplicación directamente en tu dispositivo Android conectándolo por USB.

## Opción A: Compilación Local (Recomendada y Gratis)

Esta opción utiliza los recursos de tu ordenador para compilar la app. Es más rápida para iterar y no requiere cuentas de pago ni colas de espera.

### 1. Requisitos Previos (Instalación)

Necesitas configurar el entorno de desarrollo de Android ("React Native CLI Quickstart"):

1.  **Instalar JDK (Java Development Kit):**
    *   Se recomienda **OpenJDK 17** (o 11).
    *   Puedes instalarlo via Chocolatey (`choco install -y microsoft-openjdk17`) o descargándolo de [Adoptium](https://adoptium.net/).
2.  **Instalar Android Studio:**
    *   Descárgalo de [developer.android.com](https://developer.android.com/studio).
    *   Durante la instalación, asegúrate de marcar: **"Android SDK"**, **"Android SDK Platform"** y **"Android Virtual Device"**.
3.  **Configurar Variables de Entorno:**
    *   Busca "Variables de entorno" en Windows.
    *   Crea una nueva variable de usuario llamada `ANDROID_HOME` apuntando a tu SDK (usualmente: `%LOCALAPPDATA%\Android\Sdk`).
    *   Añade `platform-tools` al **Path**: Edita la variable `Path` y añade `%LOCALAPPDATA%\Android\Sdk\platform-tools`.

### 2. Configurar el Móvil Android

1.  **Activar Opciones de Desarrollador:**
    *   Ve a Ajustes -> Información del teléfono.
    *   Toca 7 veces seguidas en "Número de compilación" hasta que diga "¡Ya eres desarrollador!".
2.  **Activar Depuración por USB:**
    *   Ve a Ajustes -> Sistema -> Opciones para desarrolladores.
    *   Activa **Depuración por USB**.
3.  Conecta el móvil al PC por USB.

### 3. Ejecutar la Aplicación

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npx expo run:android --device
```

1.  La primera vez tardará varios minutos mientras descarga Gradle y compila las librerías nativas.
2.  Si te pregunta qué dispositivo usar, selecciona tu teléfono conectado.
3.  **Importante:** Asegúrate de que tu movil y tu PC estén en la misma red Wi-Fi la primera vez para que Metro Bundler pueda enviar el JS, o usa `npx expo start --dev-client` después de instalar la app.

---

## Opción B: EAS Build (Nube)

Si no quieres instalar Android Studio o tu PC es lento, puedes usar la nube de Expo (igual que en iOS).

1.  **Instalar EAS CLI** (si no lo tienes):
    ```bash
    npm install -g eas-cli
    ```
2.  **Login:**
    ```bash
    eas login
    ```
3.  **Compilar:**
    ```bash
    eas build --profile development --platform android
    ```
4.  **Instalar:**
    *   Al terminar, escanea el código QR y descarga el `.apk` directamente en tu móvil.
    *   Instálalo (permite instalar "Apps desconocidas" si te lo pide).
5.  **Ejecutar:**
    *   Arranca el servidor en tu PC: `npx expo start --dev-client`.
    *   Abre la app en el móvil y conecta.

---

## Resumen
*   **run:android (Local):** Gratis, requiere configurar Android Studio, compilación rápida tras la primera vez. Ideal para el día a día.
*   **EAS Build (Nube):** Fácil de usar (sin configurar SDKs), pero más lento (colas de espera) y limitado por la capa gratuita de Expo. Ideal si no quieres "ensuciar" tu Windows con herramientas de desarrollo.
