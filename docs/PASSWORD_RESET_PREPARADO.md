# BuenBocado — Recuperación y cambio de contraseña (preparado para hosting + stores)

Este documento define **el diseño final** del flujo de **cambio de contraseña** (con sesión) y **“he olvidado mi contraseña”** (sin sesión) para **Cliente (web/app)** y **Restaurante (portal)**.

Está pensado para:
- Funcionar en **desarrollo** sin enviar emails (se imprime en consola, como el resto de notificaciones).
- Activar envío real en **producción** con **Resend** (misma filosofía que `apps/api/src/notifications.ts`).
- Ser **compatible con App Store / Google Play** cuando empaquetemos con Capacitor (links https + Universal Links/App Links).
- Añadir **acceso biométrico** como “desbloqueo rápido” de sesión guardada, con fallback a PIN/patrón del dispositivo (gestionado por el SO).

---

## 1) Cambiar contraseña (con sesión) — ya es seguro

### API (ya existe)
- `POST /api/auth/customer/change-password`
- `POST /api/auth/restaurant/change-password`

**Body**
```json
{ "currentPassword": "...", "newPassword": "..." }
```

**Reglas mínimas**
- `newPassword` min 6 (o subir a 8 en producción si queremos endurecer).

### UI (objetivo)
- Cliente: `http://localhost:3000/account` → botón “Cambiar contraseña”
- Restaurante: `http://localhost:3001/r/settings` (ya creado)

Tras cambiar contraseña: **forzar re-login**.

---

## 2) “He olvidado mi contraseña” (sin sesión) — diseño final recomendado

### Opción elegida
**Link por email con token** (single-use + caduca). Es el estándar más robusto.

### 2.1 Endpoints (a implementar cuando toque)
#### Cliente
- `POST /api/auth/customer/forgot-password`
- `POST /api/auth/customer/reset-password`

#### Restaurante
- `POST /api/auth/restaurant/forgot-password`
- `POST /api/auth/restaurant/reset-password`

**forgot-password body**
```json
{ "email": "user@dominio.com" }
```

**reset-password body**
```json
{ "token": "TOKEN_LARGO", "newPassword": "..." }
```

### 2.2 Seguridad obligatoria (sin negociaciones)
1) **No enumeración de cuentas**  
`forgot-password` siempre responde 200:  
“Si el email existe, te enviaremos instrucciones”.

2) **Token aleatorio fuerte**  
Generar con `crypto.randomBytes(32)` (o más). No usar UUID “a pelo”.

3) **Guardar SOLO hash del token en BD**  
Guardar `SHA-256(token)`; nunca el token en claro.

4) **Caducidad corta**  
Recomendado: 30–60 minutos.

5) **Single-use**  
Al usar el token: marcar `usedAt` y rechazar reutilización.

6) **Rate limit / anti-abuso**  
Por IP + por email (p.ej. 5 solicitudes / 15 min).  
En Fastify: plugin de rate limit o middleware propio.

7) **Invalidar sesiones existentes tras reset**  
Recomendado: añadir `tokenVersion` en `Customer` y `RestaurantUser`.  
Al reset: `tokenVersion++`.  
El JWT debe incluir `tokenVersion` y en `requireAuth` se verifica contra BD.  
Así, tokens robados quedan inválidos.

---

## 3) Modelo de datos propuesto (Prisma)

### Tabla `PasswordResetToken`
Campos recomendados:
- `id` (cuid/uuid)
- `userType` enum: `CUSTOMER | RESTAURANT`
- `userId` string (id del usuario)
- `tokenHash` string (sha256 hex)
- `expiresAt` datetime
- `usedAt` datetime nullable
- `createdAt` datetime
- `requestIp` string nullable
- `userAgent` string nullable

Índices:
- `(userType, userId, createdAt)`
- `tokenHash` unique

---

## 4) Enlaces en email (clave para hosting + stores)

### Variables de entorno (API)
Actualmente existe `APP_URL_RESTAURANT` en `notifications.ts`. Añadiremos:
- `APP_URL_CLIENT` → base URL de cliente (producción: https)
- `APP_URL_RESTAURANT` → base URL restaurante (producción: https)
- `MAIL_FROM` (ya existe)
- `RESEND_API_KEY` (ya existe como idea)

**En producción, SIEMPRE https**.

### Rutas de reset (web)
- Cliente (3000): `/auth/reset?token=...`
- Restaurante (3001): `/reset?token=...` o `/r/reset?token=...` (definir una)

En email se genera:
- Cliente: `${APP_URL_CLIENT}/auth/reset?token=...`
- Restaurante: `${APP_URL_RESTAURANT}/reset?token=...`

---

## 5) Compatibilidad con App Store / Google Play (Capacitor)

La forma correcta para que el email abra la app instalada:
1) Usar **links https** con dominio final (ej.: `https://app.buenbocado.com/auth/reset?...`)
2) Configurar:
   - iOS: **Universal Links** + Associated Domains
   - Android: **App Links** + `assetlinks.json`

### En Capacitor
- Escuchar eventos de deep link (`appUrlOpen`) y enrutar internamente al reset.
- Si la app no está instalada, el link abre la web normal (perfecto).

---

## 6) Email templates (coherente con el sistema actual)

Añadir en `apps/api/src/notifications.ts`:
- `passwordResetEmailCustomer(...)`
- `passwordResetEmailRestaurant(...)`

Y enviar con `sendEmail()`:
- En dev: se imprime el “email” (como ya ocurre).
- En prod: activar Resend descomentando bloque [RESEND].

---

## 7) Checklist de activación en hosting (cuando toque)

1) Elegir dominios:
   - `app.buenbocado.com` (cliente)
   - `restaurant.buenbocado.com` (restaurante)
   - `admin.buenbocado.com` (admin, si se separa)
2) Configurar HTTPS (proxy / Caddy / Cloudflare).
3) Poner env vars en API:
   - `APP_URL_CLIENT=https://app.buenbocado.com`
   - `APP_URL_RESTAURANT=https://restaurant.buenbocado.com`
   - `MAIL_FROM=BuenBocado <hola@buenbocado.com>`
   - `RESEND_API_KEY=...`
4) Verificar dominio en Resend (SPF/DKIM).
5) Probar:
   - forgot → email → link → reset → login OK
   - rate limit OK
   - tokens single-use OK
   - tokenVersion invalida sesiones antiguas OK

---

## 8) Decisión explícita (para no mezclar cosas)

- **Hoy**: NO activamos “forgot password” en UI final (porque depende de dominios https reales).
- **Queda diseñado y preparado** para implementarlo cuando haya hosting (sin improvisar).

---

## 9) Acceso con huella/Face ID o PIN/patrón (App stores) — diseño recomendado

### 9.1 Qué es (y qué NO es)
- **NO** es “entrar sin contraseña para siempre”.
- **SÍ** es: después de un login normal, guardamos la sesión (refresh token) en **almacenamiento seguro del dispositivo**
  y la desbloqueamos con **biometría** (o la **credencial del dispositivo**, es decir, PIN/patrón), gestionado por el sistema operativo.

**Importante:** la app **no puede leer** el patrón/PIN ni la huella; solo recibe “aprobado/rechazado” del SO.

### 9.2 Cuándo aplica
- **Cliente App (Capacitor)**: recomendado.
- **Restaurante**: solo si empaquetamos el portal restaurante como app. Si es web, no lo priorizamos.

### 9.3 Flujo (alto nivel)
1) Usuario inicia sesión normal (email/contraseña).
2) En Ajustes (/account): toggle “Entrar con Face ID/huella”.
3) Si lo activa:
   - Guardar el **refresh token** en Keychain (iOS) / Keystore (Android) mediante Secure Storage.
   - En siguientes aperturas de la app:
     - Pedir biometría (o credencial del dispositivo) → si OK, leer refresh token → renovar sesión.
4) Si falla o el usuario cancela:
   - Mostrar login normal.

### 9.4 Reglas de seguridad para hacerlo bien
- El “desbloqueo biométrico” solo sirve si:
  - el refresh token está en almacenamiento seguro, y
  - la API permite **revocar** sesiones globalmente (ver `tokenVersion`).
- Cuando ocurra cualquiera de estos eventos:
  - reset de contraseña (“olvidé contraseña”),
  - cambio de contraseña,
  - “cerrar sesión en todos los dispositivos” (si se añade),
  entonces: `tokenVersion++` y la app debe pedir login normal otra vez.

### 9.5 Deep links + biometría
- Si el usuario abre un link de reset desde email:
  - la app puede abrir la pantalla de reset directamente (deep link),
  - **no se debe exigir biometría** para cambiar contraseña (es un flujo distinto, sin sesión).
- Para acceder a la cuenta (sesión guardada), sí se exige biometría si el usuario la activó.

### 9.6 Nota de implementación (cuando toque)
- Implementar con un plugin de biometría y Secure Storage compatible con Capacitor.
- La decisión de librería concreta se toma cuando cerremos empaquetado, porque cambia rápido.
- El comportamiento debe ser idéntico en iOS/Android: biometría y/o credencial del dispositivo cuando el SO lo permita.

