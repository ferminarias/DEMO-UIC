# Instrucciones Completas - DEMO-UIC Voice Widget

## 📋 Resumen de Cambios

Se ha replicado exitosamente el backend del voice widget de **UlineaUniversidad** (Next.js) al proyecto **DEMO-UIC** (Vite + Express).

### ✅ Cambios Realizados

1. **Backend actualizado** (`api/server.js`)
   - Replicada la lógica exacta de UlineaUniversidad
   - Endpoints: `/api/elevenlabs/token`, `/api/elevenlabs/webhook`, `/api/elevenlabs/check-config`
   - Validación de origen mejorada
   - Logs detallados con prefijo `[DEMO-UIC]`

2. **Configuración de Vite corregida** (`vite.config.js`)
   - Soporte completo para `@elevenlabs/client` SDK
   - Alias de rutas configurados
   - Pre-bundling forzado del SDK
   - Definición de `global` como `globalThis`

3. **Package.json actualizado**
   - Versión específica del SDK: `@elevenlabs/client@^0.5.0`
   - Scripts simplificados
   - Dependencias optimizadas

4. **Estructura de archivos corregida**
   - Voice widget en: `src/voice-widget/`
   - HTML actualizado para apuntar a la ruta correcta

## 🚀 Instalación y Configuración

### Paso 1: Instalar Dependencias

```bash
cd "C:\Users\Fer\Documents\ulinea-university (1)\DEMO-UIC"
npm install
```

### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
ELEVENLABS_API_KEY=sk_tu_api_key_aqui
ELEVENLABS_AGENT_ID=agent_tu_agent_id_aqui
ELEVENLABS_WEBHOOK_SECRET=tu_webhook_secret_opcional
ALLOWED_EMBED_DOMAINS=localhost,127.0.0.1,demo-uic.vercel.app
```

**Obtener credenciales:**
- API Key: https://elevenlabs.io/app/settings/api-keys
- Agent ID: https://elevenlabs.io/app/conversational-ai

### Paso 3: Desarrollo Local

#### Opción A: Vite Dev Server (Frontend)

```bash
npm run dev
```

Abre: http://localhost:3000

#### Opción B: Backend Express (API)

En otra terminal:

```bash
cd api
node server.js
```

El backend correrá en: http://localhost:3001

#### Opción C: Vercel Dev (Completo)

```bash
npm run vercel-dev
```

Esto ejecuta tanto el frontend como el backend juntos.

## 📁 Estructura del Proyecto

```
DEMO-UIC/
├── api/
│   └── server.js              # Backend Express (replicado de UlineaUniversidad)
├── src/
│   └── voice-widget/
│       ├── config.js          # Configuración del widget
│       ├── core.js            # Lógica principal
│       ├── main.js            # Entry point
│       └── ui.js              # Interfaz de usuario
├── assets/
│   └── css/
│       └── voice-widget.css   # Estilos
├── index.html                 # Página principal
├── vite.config.js             # Configuración de Vite (corregida)
├── package.json               # Dependencias actualizadas
└── .env                       # Variables de entorno (crear)
```

## 🔧 Comparación: UlineaUniversidad vs DEMO-UIC

| Aspecto | UlineaUniversidad | DEMO-UIC |
|---------|-------------------|----------|
| Framework | Next.js 14 | Vite 5 |
| Backend | Next.js API Routes | Express.js |
| Lenguaje | TypeScript | JavaScript |
| SDK Import | `import { Conversation }` | `import { Conversation }` |
| Endpoints | `/app/api/elevenlabs/` | `/api/elevenlabs/` |
| Deploy | Vercel (automático) | Vercel (manual) |

### Backend Endpoints (Idénticos)

✅ **GET** `/api/elevenlabs/check-config`
- Verifica si ElevenLabs está configurado

✅ **GET** `/api/elevenlabs/token`
- Genera token de conversación
- Validación de origen
- Tracking de IP

✅ **POST** `/api/elevenlabs/webhook`
- Recibe eventos de ElevenLabs
- Validación de firma HMAC
- Streaming de transcripciones

## 🐛 Solución de Problemas

### Problema 1: "Cannot import @elevenlabs/client"

**Solución:**
```bash
# Limpiar cache de Vite
rm -rf node_modules/.vite
npm install
npm run dev
```

### Problema 2: "Module not found: config.js"

**Causa:** Rutas incorrectas en imports

**Solución:** Los archivos ya están corregidos para usar rutas relativas correctas:
```javascript
import { VoiceWidgetConfig } from './config.js';
```

### Problema 3: Backend no responde

**Verificar:**
1. Variables de entorno configuradas
2. Puerto 3001 disponible
3. Logs del servidor:

```bash
cd api
node server.js
# Deberías ver:
# [DEMO-UIC] Voice Widget API Server running on port 3001
# [DEMO-UIC] ElevenLabs configured: true
```

### Problema 4: CORS errors

**Solución:** Agregar tu dominio a `ALLOWED_EMBED_DOMAINS`:

```bash
ALLOWED_EMBED_DOMAINS=localhost,127.0.0.1,tu-dominio.com
```

## 🚢 Deploy a Vercel

### Paso 1: Conectar Repositorio

```bash
git init
git add .
git commit -m "Voice widget con backend replicado"
git remote add origin https://github.com/tu-usuario/DEMO-UIC.git
git push -u origin main
```

### Paso 2: Importar en Vercel

1. Ve a https://vercel.com/new
2. Importa tu repositorio
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Paso 3: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```
ELEVENLABS_API_KEY = sk_tu_api_key
ELEVENLABS_AGENT_ID = agent_tu_agent_id
ALLOWED_EMBED_DOMAINS = tu-dominio.vercel.app,localhost
```

### Paso 4: Deploy

```bash
npm run deploy
```

O usa el botón "Deploy" en Vercel Dashboard.

## 🧪 Testing

### Test 1: Verificar Configuración

```bash
curl http://localhost:3001/api/elevenlabs/check-config
```

Respuesta esperada:
```json
{
  "configured": true,
  "details": {
    "hasApiKey": true,
    "hasAgentId": true,
    "missing": []
  }
}
```

### Test 2: Generar Token

```bash
curl http://localhost:3001/api/elevenlabs/token
```

Respuesta esperada:
```json
{
  "token": "eyJ...",
  "agentId": "agent_...",
  "configured": true,
  "tokenGenerated": true,
  "clientIp": "127.0.0.1"
}
```

### Test 3: Widget en Navegador

1. Abre http://localhost:3000
2. Abre DevTools (F12)
3. Busca en Console:
   ```
   [VoiceWidget] Initializing with Vite bundler...
   [VoiceWidget] Core initialization completed
   [VoiceWidget] Initialized successfully with Vite
   ```
4. Click en el botón flotante naranja
5. El widget debería abrirse

## 📚 Diferencias Clave con UlineaUniversidad

### 1. Imports del SDK

**UlineaUniversidad (Next.js):**
```typescript
// No necesita import explícito en componentes cliente
// Next.js maneja el bundling automáticamente
```

**DEMO-UIC (Vite):**
```javascript
// Import explícito necesario
import { Conversation } from '@elevenlabs/client';
```

### 2. API Routes

**UlineaUniversidad:**
```
app/api/elevenlabs/token/route.ts
app/api/elevenlabs/webhook/route.ts
app/api/elevenlabs/check-config/route.ts
```

**DEMO-UIC:**
```
api/server.js (todos los endpoints en un archivo)
```

### 3. Configuración de Build

**UlineaUniversidad:**
```javascript
// next.config.mjs
// Next.js maneja todo automáticamente
```

**DEMO-UIC:**
```javascript
// vite.config.js
// Configuración manual de optimizeDeps, resolve, define
```

## 🎯 Próximos Pasos

1. **Testing exhaustivo**
   - Probar conversación de voz
   - Verificar transcripciones
   - Probar en diferentes navegadores

2. **Personalización**
   - Ajustar colores en `assets/css/voice-widget.css`
   - Modificar mensajes en `src/voice-widget/config.js`
   - Agregar logo personalizado

3. **Monitoreo**
   - Configurar logs en Vercel
   - Monitorear uso de API de ElevenLabs
   - Revisar errores en producción

4. **Optimización**
   - Minificar assets
   - Optimizar carga del SDK
   - Implementar lazy loading

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del navegador (F12 → Console)
2. Revisa los logs del backend (terminal donde corre `node server.js`)
3. Verifica las variables de entorno
4. Compara con UlineaUniversidad para ver diferencias

## ✅ Checklist de Verificación

- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env` creado con credenciales
- [ ] `npm run dev` inicia sin errores
- [ ] Backend responde en http://localhost:3001/health
- [ ] Widget visible en http://localhost:3000
- [ ] Console no muestra errores de import
- [ ] `/api/elevenlabs/check-config` retorna `configured: true`
- [ ] Click en widget abre el panel
- [ ] Conversación de voz funciona

---

**Última actualización:** Octubre 2024
**Basado en:** UlineaUniversidad Next.js voice widget
**Desarrollado para:** DEMO-UIC
