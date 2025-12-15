# Guía para Compilar en iOS desde Windows (EAS Build)

A diferencia de macOS, Windows no puede ejecutar Xcode, la herramienta necesaria para compilar aplicaciones nativas de iOS. Sin embargo, puedes utilizar **EAS Build** (el servicio en la nube de Expo) para compilar la aplicación en los servidores de Expo y luego instalarla en tu iPhone.

> [!IMPORTANT]
> **Requisito Económico:** Para compilar una versión instalable en tu iPhone desde Windows (usando la nube), necesitas obligatoriamente una cuenta de **Apple Developer Program** (cuesta aprox. 99$/año).
> *Si tienes un Mac, puedes hacerlo gratis ("Personal Team"), pero desde Windows esta opción no está disponible.*

## Requisitos Previos

1.  **Cuenta de Expo:** Regístrate en [expo.dev](https://expo.dev).
2.  **Cuenta de Apple Developer:** Debes estar inscrito en el [Apple Developer Program](https://developer.apple.com/programs/).
3.  **EAS CLI:** La herramienta de línea de comandos de Expo.

---

## Pasos a Seguir

### 1. Instalación de Herramientas

Abre tu terminal en Windows (PowerShell o CMD) y ejecuta:

```bash
npm install -g eas-cli
```

Luego, inicia sesión con tu cuenta de Expo:
```bash
eas login
```

### 2. Configurar el Proyecto para EAS
En la raíz de tu proyecto, ejecuta:

```bash
eas build:configure
```
*   Si te pregunta por la plataforma, elige `All` o `iOS`.
*   Esto creará un archivo `eas.json` en tu proyecto.

### 3. Crear una "Development Build" (Build de Desarrollo)

Una "Development Build" es una versión personalizada de la app "Expo Go" que incluye tus librerías nativas (como el audio en segundo plano).

Ejecuta el siguiente comando para iniciar la compilación en la nube:

```bash
eas build --profile development --platform ios
```

1.  **Login de Apple:** Te pedirá iniciar sesión con tu cuenta de Apple ID (debe ser la cuenta pagada de desarrollador).
2.  **Certificados:** Responde `Yes` (Y) a todas las preguntas para que EAS genere y administre los certificados de distribución y perfiles de aprovisionamiento por ti.
3.  **Dispositivos:** Si es la primera vez, el CLI te preguntará si deseas registrar dispositivos.
    *   Te dará un enlace (QR). Escanéalo con tu iPhone, sigue los pasos para instalar el perfil de configuración, y tu UDID (identificador único) se registrará en tu cuenta de Apple automáticamente.
    *   Una vez registrado, vuelve a la terminal y continúa.

### 4. Esperar la Compilación
El proceso subirá tu código a los servidores de Expo y comenzará a compilar.
*   Esto puede tardar entre 15 y 30 minutos (dependiendo de la cola gratuita o prioritaria).
*   Puedes cerrar la terminal si quieres; recibirás un enlace por correo o puedes verlo en el dashboard de exp.dev.

### 5. Instalar la App en el iPhone
Cuando termine la compilación:
1.  Verás un **Código QR** en la terminal (o en la página web del build).
2.  Abre la cámara de tu iPhone y escanea el QR.
3.  Te preguntará si quieres instalar la aplicación. Dale a **Instalar**.
4.  Esta nueva app tendrá el icono de tu proyecto (o el de Expo por defecto si no lo has cambiado) y se usará **en lugar de Expo Go**.

### 6. Ejecutar el Servidor de Desarrollo
Ahora que tienes la app instalada en el iPhone, necesitas darle el código JavaScript de tu ordenador.

1.  En tu terminal de Windows, inicia el servidor:
    ```bash
    npx expo start --dev-client
    ```
    *(Nota la bandera `--dev-client`)*.

2.  Abre la nueva app que se instaló en tu iPhone.
3.  Debería detectar automáticamente tu servidor si están en la misma red Wi-Fi. Si no, escanea el QR que aparece en tu terminal usando la opción de escanear dentro de la propia app (o la cámara).

---

## Resumen de Diferencias con Mac
*   **Mac:** Compila localmente (gratis con cuenta personal). Usa `npx expo run:ios`.
*   **Windows:** Compila en la nube (requiere cuenta Apple de pago). Usa `eas build`.

## ¿Por qué hacer esto?
Al igual que en la guía de Mac, esto es necesario para probar funcionalidades que requieren modificar el código nativo, como:
*   Reproducción de audio en segundo plano.
*   Geolocalización avanzada.
*   Notificaciones push personalizadas.
