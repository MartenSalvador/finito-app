# Finito

Aplicacion web para descubrir, publicar y intercambiar rompecabezas.

## Requisitos

- Node.js 24.12 o superior
- Cuenta y proyecto de Firebase
- Firebase CLI y Java para ejecutar los emuladores o desplegar reglas

## Configuracion

Crear un archivo `.env.local` con las variables publicas del proyecto:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npm run test:watch
```

## Firebase

Las reglas de Firestore y Storage estan en `firestore.rules` y `storage.rules`.
La coleccion `users` guarda datos privados; `publicProfiles` solo contiene los
campos publicos necesarios para mostrar perfiles. Las cuentas existentes se
sincronizan a `publicProfiles` cuando su titular vuelve a iniciar sesion.

Para ejecutar las pruebas de reglas en los emuladores (no toca el proyecto remoto):

```bash
npm run test:rules
```

Para iniciar los emuladores y probar manualmente:

```bash
firebase --config firebase.json emulators:start --only auth,firestore,storage --project demo-finito
```

Para revisarlas y desplegarlas:

```bash
firebase deploy --only firestore:rules,storage --project <project-id>
```

## Arquitectura

- `src/views`: vistas principales.
- `src/components`: componentes compartidos y modales.
- `src/hooks`: autenticacion, moderacion y ciclo de intercambios.
- `src/utils`: funciones reutilizables y operaciones de cuenta.
- `src/data`: datos mock usados como respaldo.
- `src/firebase`: inicializacion de Firebase.
