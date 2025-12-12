# Guía para Habilitar Audio en Segundo Plano en iOS (Development Build)

Esta guía detalla los pasos necesarios para compilar y ejecutar tu aplicación en un iPhone físico utilizando un Mac. Esto es necesario para probar funcionalidades nativas avanzadas como el **audio en segundo plano**, que no funcionan en la app estándar de Expo Go.

## Requisitos Previos

*   Un ordenador **Mac**.
*   **Xcode** instalado (descárgalo gratis desde la Mac App Store).
*   Tu proyecto de React Native actualizado en el Mac.
*   Un **iPhone** y su cable de conexión.

---

## ¿Dónde ejecuto los comandos?

Todos los comandos mencionados en esta guía (`npm install`, `npx expo prebuild`, etc.) se ejecutan en la **Terminal** de tu Mac (puede ser la aplicación "Terminal", "iTerm2", o la terminal integrada de VS Code). **NO** se ejecutan dentro de la consola de Xcode.

---

## Pasos a Seguir

### 1. Preparar el Entorno en el Mac

1.  Abre la **Terminal** en la carpeta raíz de tu proyecto.
2.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```
3.  Asegúrate de que las dependencias de iOS (CocoaPods) estén listas (si no tienes CocoaPods instalado, el siguiente paso lo intentará gestionar, pero es recomendable tenerlo).

### 2. Generar el Proyecto Nativo (Prebuild)

Este paso convierte tu configuración de `app.json` (donde añadimos los permisos de audio) en una carpeta `ios/` real con código nativo de Xcode.

1.  En la terminal, ejecuta:
    ```bash
    npx expo prebuild
    ```
2.  Si te pregunta por el "Bundle Identifier" (ej. `com.tuempresa.funandtickets`), puedes aceptar el sugerido o escribir uno nuevo.
3.  **Resultado:** Verás que aparece una carpeta `ios/` en tu proyecto. No necesitas editar nada manualmente dentro de ella.

### 3. Ejecutar en tu iPhone

1.  **Conecta tu iPhone** al Mac con el cable USB.
2.  Desbloquea el iPhone. Si aparece una alerta preguntando "¿Confiar en este ordenador?", selecciona **Confiar** e introduce tu código.
3.  En la terminal, ejecuta:
    ```bash
    npx expo run:ios --device
    ```

### 4. Configuración de Firma (Signing)

Durante el proceso de compilación (después del paso 3), es probable que la terminal te pida seleccionar un equipo de desarrollo ("Development Team") para firmar la aplicación. Apple requiere esto para instalar apps en dispositivos físicos.

1.  Si la terminal te muestra una lista, selecciona tu cuenta personal (ej. "Tu Nombre (Personal Team)").
2.  Si no tienes una cuenta configurada, te pedirá iniciar sesión con tu **Apple ID**. Es seguro hacerlo; Xcode gestionará los certificados gratuitamente.

### 5. Confiar en la App (En el iPhone)

Una vez que la terminal diga **"Build Succeeded"** e instale la app en tu iPhone:

1.  Intenta abrir la app "Fun & Tickets" en tu iPhone.
2.  Probablemente verás un mensaje de error: **"Desarrollador no confiable"**.
3.  Para solucionarlo, en tu iPhone ve a:
    *   **Ajustes** -> **General** -> **VPN y gestión de dispositivos** (o "Gestión de perfiles y dispositivos").
4.  Toca en tu email de Apple ID bajo el apartado "App de desarrollador".
5.  Toca en **"Confiar en [Tu Email]"** y confirma la acción.

### 6. Prueba Final

1.  Abre la app en tu iPhone.
2.  Asegúrate de que el servidor de desarrollo (Metro Bundler) esté corriendo en tu Mac. Si se cerró, ejecuta `npx expo start` en la terminal del Mac.
3.  La app debería conectarse automáticamente.
4.  Navega a un tour, reproduce un audio y **bloquea la pantalla**. ¡El audio debería seguir sonando!

---

## Solución de Problemas Comunes

*   **Error "Code Signing Error":** Si falla la firma, abre el archivo `ios/funandtickets.xcworkspace` (o el nombre de tu proyecto) haciendo doble clic. Esto abrirá Xcode. Haz clic en el proyecto a la izquierda (icono azul), ve a la pestaña "Signing & Capabilities", selecciona tu equipo en "Team" y asegúrate de que no haya errores rojos. Luego vuelve a intentar el comando en la terminal.
*   **Dispositivo no encontrado:** Asegúrate de que el iPhone esté desbloqueado y conectado por cable. A veces desconectar y volver a conectar ayuda.
