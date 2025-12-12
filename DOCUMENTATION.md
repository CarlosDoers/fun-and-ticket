# Documentación Técnica: Fun & Tickets App

Esta documentación proporciona una visión completa de la arquitectura, estructura y funcionamiento de la aplicación "Fun & Tickets", desarrollada con React Native y Expo. Está diseñada para personas que están empezando con React Native.

---

## 1. Introducción

La aplicación es una **guía turística interactiva** que permite a los usuarios escanear códigos QR para acceder a tours guiados con mapas interactivos, puntos de interés (POIs) y rutas predefinidas. Incluye un panel de administración para gestionar estos recursos.

### Flujo Principal
\`\`\`
Usuario escanea QR → Se valida el código → Se muestra el mapa del tour con la ruta y POIs → Usuario puede ver imágenes y escuchar audio guías
\`\`\`

---

## 2. Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **React Native + Expo SDK 54** | Framework multiplataforma (iOS, Android, Web) |
| **Expo Router** | Navegación basada en archivos (como Next.js) |
| **Supabase** | Backend: base de datos PostgreSQL + autenticación + Storage |
| **TypeScript** | Tipado estático para mayor seguridad |
| **react-native-maps** | Mapas nativos (iOS/Android) |
| **react-leaflet** | Mapas para versión Web |
| **expo-camera** | Escaneo de códigos QR |
| **expo-audio** | Reproducción de Audio |
| **Gluestack UI** | Sistema de componentes UI (v2) |

---

## 3. Estructura del Proyecto

\`\`\`
/
├── app/                      # 📱 Rutas y Pantallas (Expo Router)
│   ├── (auth)/               #    └── Autenticación (Login)
│   │   └── login.tsx
│   ├── (dashboard)/          #    └── Panel Admin (protegido por rol)
│   │   ├── index.tsx         #        Menú principal del dashboard
│   │   ├── tours/            #        CRUD de tours
│   │   └── qrs/              #        Gestión de códigos QR
│   ├── map/
│   │   └── [tourId].tsx      #    └── Vista pública del tour (ruta dinámica)
│   ├── _layout.tsx           #    └── Layout raíz + protección de rutas
│   ├── index.tsx             #    └── Pantalla de bienvenida
│   └── scan.tsx              #    └── Escáner QR público
│
├── src/                      # 📦 Código fuente compartido
│   ├── components/           #    └── Componentes reutilizables
│   │   ├── MapView.tsx       #        Mapa nativo con Audio Player
│   │   ├── MapView.web.tsx   #        Mapa web (Leaflet)
│   ├── lib/
│   │   ├── auth.tsx          #    └── Contexto y hook de autenticación
│   │   ├── supabase.ts       #    └── Cliente de Supabase configurado
│   │   └── theme.ts          #    └── Sistema de diseño centralizado
│   └── types.ts              #    └── Tipos TypeScript
│
└── assets/                   # 🖼️ Imágenes y fuentes
\`\`\`

---

## 4. Funcionalidad de Audio Guías

Se ha implementado la capacidad de subir y reproducir audio guías asociadas a los Puntos de Interés (POIs).

1.  **Storage**: Los archivos de audio se almacenan en un bucket de Supabase llamado \`audios\`.
2.  **Base de Datos**: La tabla \`pois\` tiene una columna \`audio_url\` que guarda el enlace público del archivo.
3.  **Administración**: Desde el dashboard (\`pois/index.tsx\`), los administradores pueden subir archivos de audio al crear o editar un POI.
4.  **Reproducción**: En la vista pública del mapa (\`MapView.tsx\`), al abrir un POI que contiene audio, aparece un reproductor integrado que permite escuchar la descripción.

---

## 5. Navegación con Expo Router

Expo Router usa **navegación basada en archivos** (file-based routing), similar a Next.js.
... (Resto del documento igual)
