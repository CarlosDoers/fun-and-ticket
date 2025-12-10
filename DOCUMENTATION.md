# Documentación Técnica: Fun & Tickets App

Esta documentación proporciona una visión completa de la arquitectura, estructura y funcionamiento de la aplicación "Fun & Tickets", desarrollada con React Native y Expo. Está diseñada para personas que están empezando con React Native.

---

## 1. Introducción

La aplicación es una **guía turística interactiva** que permite a los usuarios escanear códigos QR para acceder a tours guiados con mapas interactivos, puntos de interés (POIs) y rutas predefinidas. Incluye un panel de administración para gestionar estos recursos.

### Flujo Principal
```
Usuario escanea QR → Se valida el código → Se muestra el mapa del tour con la ruta y POIs
```

---

## 2. Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **React Native + Expo SDK 54** | Framework multiplataforma (iOS, Android, Web) |
| **Expo Router** | Navegación basada en archivos (como Next.js) |
| **Supabase** | Backend: base de datos PostgreSQL + autenticación |
| **TypeScript** | Tipado estático para mayor seguridad |
| **react-native-maps** | Mapas nativos (iOS/Android) |
| **react-leaflet** | Mapas para versión Web |
| **expo-camera** | Escaneo de códigos QR |

---

## 3. Estructura del Proyecto

```
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
│   │   ├── MapView.tsx       #        Mapa nativo (iOS/Android)
│   │   ├── MapView.web.tsx   #        Mapa web (Leaflet)
│   │   ├── WebMapEditor.tsx  #        Placeholder nativo
│   │   └── WebMapEditor.web.tsx #     Editor de rutas (solo web)
│   ├── lib/
│   │   ├── auth.tsx          #    └── Contexto y hook de autenticación
│   │   └── supabase.ts       #    └── Cliente de Supabase configurado
│   └── types.ts              #    └── Tipos TypeScript
│
└── assets/                   # 🖼️ Imágenes y fuentes
```

---

## 4. Navegación con Expo Router

Expo Router usa **navegación basada en archivos** (file-based routing), similar a Next.js.

### 4.1 ¿Cómo funciona?

Cada archivo `.tsx` dentro de `app/` se convierte automáticamente en una ruta:

| Archivo | Ruta resultante | Descripción |
|---------|-----------------|-------------|
| `app/index.tsx` | `/` | Pantalla de inicio |
| `app/scan.tsx` | `/scan` | Escáner QR |
| `app/map/[tourId].tsx` | `/map/123` | Ruta dinámica (el `[tourId]` captura el ID) |
| `app/(auth)/login.tsx` | `/(auth)/login` | Pantalla de login |
| `app/(dashboard)/index.tsx` | `/(dashboard)` | Dashboard principal |

### 4.2 Grupos de Rutas (Paréntesis)

Los directorios con paréntesis como `(auth)` y `(dashboard)` son **grupos de rutas**:
- Sirven para organizar archivos relacionados
- El nombre del grupo aparece en la URL
- Permiten aplicar layouts específicos a un conjunto de pantallas

### 4.3 Rutas Dinámicas (Corchetes)

Los archivos con corchetes como `[tourId].tsx` crean **rutas dinámicas**:

```tsx
// En app/map/[tourId].tsx
import { useLocalSearchParams } from 'expo-router';

export default function MapScreen() {
  const { tourId } = useLocalSearchParams();
  // tourId contendrá "123" si la URL es /map/123
}
```

### 4.4 Layout y Protección de Rutas

El archivo `app/_layout.tsx` envuelve TODAS las pantallas. Sus funciones son:

1. **Proveer contexto de autenticación** a toda la app
2. **Proteger rutas**: Si intentas acceder a `(dashboard)` sin sesión, te redirige a login
3. **Redirigir usuarios logueados**: Si un admin intenta ir al login, lo manda al dashboard

```tsx
// Ejemplo simplificado de _layout.tsx
function InitialLayout() {
  const { session, isAdmin } = useAuth();
  const segments = useSegments(); // ej: ['(dashboard)', 'tours']

  useEffect(() => {
    // Si está en dashboard sin sesión -> redirect a login
    if (segments[0] === '(dashboard)' && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, segments]);

  return <Slot />; // Renderiza el contenido de la ruta actual
}
```

---

## 5. Hooks de React Usados

Los **hooks** son funciones especiales de React que permiten usar estado y otras características. Esta app usa varios:

### 5.1 `useState` - Estado Local

Guarda datos que pueden cambiar durante la vida del componente.

```tsx
const [loading, setLoading] = useState(false);
// loading = valor actual
// setLoading = función para cambiarlo

setLoading(true);  // Cambia loading a true
```

### 5.2 `useEffect` - Efectos Secundarios

Ejecuta código cuando el componente se monta o cuando cambian ciertas dependencias.

```tsx
useEffect(() => {
  // Este código se ejecuta al montar el componente
  fetchTours();
}, []); // Array vacío = solo al montar

useEffect(() => {
  // Este código se ejecuta cada vez que 'tourId' cambia
  if (tourId) fetchTour(tourId);
}, [tourId]); // Se re-ejecuta cuando tourId cambia
```

### 5.3 `useRouter` y `useLocalSearchParams` (Expo Router)

```tsx
import { useRouter, useLocalSearchParams } from 'expo-router';

const router = useRouter();
router.push('/scan');           // Navega a /scan
router.replace('/');            // Reemplaza la pantalla actual
router.back();                  // Vuelve atrás

const { tourId } = useLocalSearchParams(); // Obtiene parámetros de la URL
```

### 5.4 `useAuth` - Hook Personalizado

Este es un **custom hook** creado en `src/lib/auth.tsx`. Simplifica el acceso al estado de autenticación:

```tsx
const { session, user, loading, isAdmin, isGuide, signOut } = useAuth();

// session: Sesión de Supabase (null si no está logueado)
// user: Datos del usuario actual
// loading: true mientras verifica la sesión
// isAdmin/isGuide: Roles del usuario
// signOut: Función para cerrar sesión
```

---

## 6. Context API (Contexto de React)

El **Context** permite pasar datos a toda la aplicación sin tener que pasarlos manualmente a cada componente.

### ¿Cómo funciona en esta app?

1. **Se crea el contexto** en `src/lib/auth.tsx`:
   ```tsx
   const AuthContext = createContext({...});
   ```

2. **Se provee el contexto** en `_layout.tsx`:
   ```tsx
   <AuthProvider>
     <App />
   </AuthProvider>
   ```

3. **Se consume el contexto** en cualquier componente:
   ```tsx
   const { isAdmin } = useAuth(); // useAuth usa useContext internamente
   ```

---

## 7. Componentes Principales

### 7.1 MapView (`src/components/MapView.tsx`)

Muestra el mapa interactivo con la ruta del tour.

**Props:**
- `routeData`: Objeto con `waypoints` (puntos de la ruta) y `pois` (puntos de interés)
- `style`: Estilos opcionales

**Funcionalidades:**
- **Auto-zoom**: Calcula automáticamente la región para mostrar todos los puntos
- **Polyline**: Dibuja la línea de la ruta conectando los waypoints
- **Markers**: Coloca marcadores en cada POI
- **Callout**: Al tocar un marcador, muestra título, descripción e imágenes

> **Nota sobre Platform-Specific Files**: Existen dos versiones:
> - `MapView.tsx` → Usa `react-native-maps` (para iOS/Android)
> - `MapView.web.tsx` → Usa `react-leaflet` (para Web)
> 
> React Native automáticamente elige el archivo correcto según la plataforma.

### 7.2 WebMapEditor (`src/components/WebMapEditor.web.tsx`)

Editor de rutas usado en el dashboard (solo funciona en web).

**Características:**
- Click derecho para añadir POIs
- Arrastrar marcadores para moverlos
- Generación automática de rutas usando OSRM (Open Source Routing Machine)
- Optimización del orden de POIs para la ruta más corta

### 7.3 Escáner QR (`app/scan.tsx`)

**Flujo:**
1. Solicita permiso de cámara (`Camera.requestCameraPermissionsAsync()`)
2. Muestra la cámara con `CameraView`
3. Al detectar un QR, busca el código en Supabase
4. Si es válido, navega a `/map/[tourId]`

---

## 8. Modelos de Datos (`src/types.ts`)

### Tour
```typescript
type Tour = {
  id: string;
  name: string;
  description: string;
  route_data: RouteData;
  created_by: string;
  created_at: string;
};
```

### RouteData
```typescript
type RouteData = {
  waypoints: Coordinate[]; // Puntos que forman la línea de la ruta
  pois: POI[];             // Puntos de interés con info
};
```

### POI (Point of Interest)
```typescript
type POI = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  images?: string[]; // URLs de imágenes
};
```

### QR
```typescript
type QR = {
  id: string;
  code: string;        // El texto que contiene el QR
  tour_id: string;     // Referencia al tour
  is_active: boolean;
  expires_at?: string; // Fecha de caducidad (opcional)
  created_at: string;
};
```

---

## 9. Estilos en React Native

React Native usa `StyleSheet.create()` en lugar de CSS. La sintaxis es similar pero con diferencias:

| CSS | React Native |
|-----|--------------|
| `background-color` | `backgroundColor` |
| `font-size: 16px` | `fontSize: 16` |
| `padding: 10px 20px` | `paddingVertical: 10, paddingHorizontal: 20` |
| `display: flex` | `display: 'flex'` (es el default) |

**Ejemplo:**
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

// Uso:
<View style={styles.container}>
  <Text style={styles.title}>Hola</Text>
</View>
```

---

## 10. Supabase: Base de Datos y Auth

### Configuración (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Guarda la sesión en el dispositivo
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### Operaciones comunes

```typescript
// Leer datos
const { data, error } = await supabase
  .from('tours')
  .select('*')
  .eq('id', tourId)
  .single();

// Insertar datos
await supabase.from('tours').insert({
  name: 'Mi Tour',
  description: 'Descripción...',
});

// Actualizar datos
await supabase
  .from('tours')
  .update({ name: 'Nuevo nombre' })
  .eq('id', tourId);

// Eliminar datos
await supabase.from('tours').delete().eq('id', tourId);
```

---

## 11. Comandos Útiles

```bash
# Iniciar en modo desarrollo
npm start

# Iniciar solo web
npm run web

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios
```

---

## 12. Glosario de Términos

| Término | Descripción |
|---------|-------------|
| **Componente** | Bloque de UI reutilizable (función que retorna JSX) |
| **Props** | Parámetros que se pasan a un componente |
| **State** | Datos internos de un componente que pueden cambiar |
| **Hook** | Función especial de React que empieza con `use` |
| **Context** | Sistema para compartir datos globalmente |
| **Layout** | Componente que envuelve y estructura otras pantallas |
| **Route Group** | Carpeta con paréntesis `(nombre)` para organizar rutas |
| **Dynamic Route** | Archivo con corchetes `[param]` para capturar valores de la URL |
| **Waypoint** | Punto geográfico que forma parte de una ruta |
| **POI** | Point of Interest - Punto de interés con información |
