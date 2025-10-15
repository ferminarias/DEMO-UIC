# 🚀 Quick Start - Voice Widget

Guía rápida para poner en funcionamiento el Voice Widget en 5 minutos.

## 📋 Pre-requisitos

- Cuenta en Vercel (https://vercel.com)
- Cuenta de ElevenLabs con API Key
- Un agente creado en ElevenLabs
- Repositorio Git (GitHub, GitLab, o Bitbucket)

## ⚡ Inicio Rápido

### 1️⃣ Configurar Variables de Entorno Locales (opcional)

Para desarrollo local:

```bash
# Copiar ejemplo de configuración
cp .env.example .env
```

### 2️⃣ Editar `.env` (solo para desarrollo local)

Abre `.env` y completa:

```env
ELEVENLABS_API_KEY=tu_api_key_aqui
ELEVENLABS_AGENT_ID=tu_agent_id_aqui
PORT=3001
```

**¿Dónde obtener las credenciales?**
- **API Key**: https://elevenlabs.io/app/settings/api-keys
- **Agent ID**: https://elevenlabs.io/app/conversational-ai (crea o selecciona un agente)

### 3️⃣ Desplegar en Vercel

#### Opción A: Desde el Dashboard de Vercel

1. Ve a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Conecta tu repositorio Git
4. Selecciona el repositorio **DEMO-UIC**
5. En **Environment Variables**, agrega:
   - `ELEVENLABS_API_KEY` = tu_api_key
   - `ELEVENLABS_AGENT_ID` = tu_agent_id
   - `ALLOWED_EMBED_DOMAINS` = tudominio.com
6. Click en **"Deploy"**

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Configurar variables
vercel env add ELEVENLABS_API_KEY
vercel env add ELEVENLABS_AGENT_ID
vercel env add ALLOWED_EMBED_DOMAINS

# Deploy
vercel --prod
```

### 4️⃣ Verificar el Deploy

Visita: `https://tu-proyecto.vercel.app/api/elevenlabs/check-config`

Deberías ver:
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

### 5️⃣ Probar el widget

1. Abre tu sitio en Vercel: `https://tu-proyecto.vercel.app`
2. Verás un botón naranja flotante con el ícono de audífonos en la esquina inferior derecha
3. Haz clic para abrir el widget
4. Haz clic en "Iniciar llamada" para probar la conversación por voz

## 🔧 Solución de problemas

### ❌ "ElevenLabs not configured"
- Faltan variables de entorno en Vercel
- Solución: Ve a Settings → Environment Variables en Vercel y agrega todas las variables necesarias

### ❌ "Acceso denegado desde este dominio"
- Tu dominio no está en `ALLOWED_EMBED_DOMAINS`
- Solución: Agrega tu dominio a la variable de entorno en Vercel

### ❌ El widget no aparece
- Los scripts no se cargaron correctamente
- Solución: Verifica que los archivos en `assets/js/voice-widget/` existan y las rutas sean correctas

### ❌ Error de micrófono
- El navegador requiere HTTPS (excepto localhost)
- Solución: Usa localhost o configura HTTPS

## 🎨 Personalización Rápida

### Cambiar colores

Edita `assets/css/voice-widget.css`:

```css
:root {
  --voice-widget-primary: #TU_COLOR;
  --voice-widget-secondary: #TU_COLOR;
}
```

### Cambiar número de WhatsApp

Edita `assets/js/voice-widget/config.js`:

```javascript
whatsappNumber: 'TU_NUMERO',
whatsappMessage: 'TU_MENSAJE',
```

## 📱 Agregar a otras páginas

Copia estos scripts antes de `</body>`:

```html
<link rel="stylesheet" href="./assets/css/voice-widget.css">
<script src="./assets/js/voice-widget/config.js"></script>
<script src="./assets/js/voice-widget/core.js"></script>
<script src="./assets/js/voice-widget/ui.js"></script>
<script src="./assets/js/voice-widget/index.js"></script>
```

## 🔧 Desarrollo Local (opcional)

Si quieres probar localmente antes de desplegar:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Crear archivo .env
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
vercel dev
```

Abre http://localhost:3000

## 📚 Más Información

- **Deploy Completo**: Lee `DEPLOY-VERCEL.md` para guía detallada de deployment
- **Variables de Entorno**: Ver `VARIABLES-VERCEL.txt` para lista completa
- **Documentación**: Lee `VOICE-WIDGET-README.md` para documentación completa

---

¿Problemas? Revisa `DEPLOY-VERCEL.md` o `VOICE-WIDGET-README.md`
