# 🚀 Guía de Despliegue en Vercel

Esta guía te muestra cómo desplegar DEMO-UIC con el Voice Widget en Vercel.

## 📋 Pre-requisitos

1. Cuenta en Vercel (https://vercel.com)
2. Cuenta en ElevenLabs con:
   - API Keydd
   - Agent ID configurado
3. Repositorio Git (GitHub, GitLab, o Bitbuckesdsdt)

## 🔧 Estructura del Proyecto

El proyecto está configurado para funcionar directamente con **Vercel Serverless Functions**:

```
DEMO-UIC/
├── api/
│   └── elevenlabs/
│       ├── token.js           # Serverless Function
│       ├── webhook.js         # Serverless Function
│       └── check-config.js    # Serverless Function
├── assets/
│   ├── css/
│   │   └── voice-widget.css
│   └── js/
│       └── voice-widget/
│           ├── config.js
│           ├── core.js
│           ├── ui.js
│           └── index.js
├── index.html
├── package.json
├── vercel.json                # Configuración de Vercel
└── .env.example              # Template de variables
```

## 🚀 Método 1: Deploy desde Vercel Dashboard

### Paso 1: Conectar Repositorio

1. Ve a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Conecta tu repositorio Git (GitHub/GitLab/Bitbucket)
4. Selecciona el repositorio **DEMO-UIC**
5. Click en **"Import"**

### Paso 2: Configurar Variables de Entorno

En la pantalla de configuración del proyecto:

1. Expande la sección **"Environment Variables"**
2. Agrega las siguientes variables:

```bash
ELEVENLABS_API_KEY = tu_api_key_aqui
ELEVENLABS_AGENT_ID = tu_agent_id_aqui
ELEVENLABS_WEBHOOK_SECRET = tu_webhook_secret_aqui (opcional)
ALLOWED_EMBED_DOMAINS = tudominio.vercel.app,tudominio.com
```

**✅ Importante**: Marca `ELEVENLABS_API_KEY` y `ELEVENLABS_WEBHOOK_SECRET` como **Sensitive** para que no se muestren en los logs.

### Paso 3: Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (1-2 minutos)
3. Una vez completado, verás tu URL: `https://tu-proyecto.vercel.app`

### Paso 4: Verificar

Visita:
```
https://tu-proyecto.vercel.app/api/elevenlabs/check-config
```

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

## 🖥️ Método 2: Deploy desde CLI

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login

```bash
vercel login
```

### Paso 3: Configurar Variables de Entorno

```bash
vercel env add ELEVENLABS_API_KEY production
# Pega tu API Key cuando se te solicite

vercel env add ELEVENLABS_AGENT_ID production
# Pega tu Agent ID cuando se te solicite

vercel env add ELEVENLABS_WEBHOOK_SECRET production
# Pega tu Webhook Secret cuando se te solicite (opcional)

vercel env add ALLOWED_EMBED_DOMAINS production
# Ejemplo: tudominio.com,www.tudominio.com
```

### Paso 4: Deploy

Desde la raíz del proyecto:

```bash
# Deploy de preview (para pruebas)
vercel

# Deploy a producción
vercel --prod
```

## 🔄 Configurar Webhook de ElevenLabs

Una vez desplegado el proyecto:

1. Ve a https://elevenlabs.io/app/conversational-ai
2. Selecciona tu agente
3. Ve a la configuración de Webhooks
4. Agrega la URL del webhook:
   ```
   https://tu-proyecto.vercel.app/api/elevenlabs/webhook
   ```
5. Si configuraste un secret, agrégalo también

## 🎯 Testing

### Probar localmente con Vercel Dev

```bash
# Instalar dependencias
npm install

# Crear archivo .env local
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo de Vercel
vercel dev
```

Abre http://localhost:3000 para probar el widget localmente.

### Probar en Producción

1. Abre tu sitio: `https://tu-proyecto.vercel.app`
2. Deberías ver el botón naranja del widget en la esquina inferior derecha
3. Haz clic en el botón para abrir el widget
4. Haz clic en "Iniciar llamada" para probar la conversación por voz

## 🔧 Configuración Avanzada

### Custom Domain

1. En el dashboard de Vercel, ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel
4. Actualiza `ALLOWED_EMBED_DOMAINS` para incluir tu dominio

### Configuración de CORS

El archivo `vercel.json` incluye configuración de CORS. Si necesitas personalizarla, edita:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### Configuración de Caching

Para mejorar el rendimiento:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## 🐛 Troubleshooting

### Error: "Environment variables not found"

**Causa**: Las variables no están configuradas en Vercel  
**Solución**: Ve a Settings → Environment Variables y agrega todas las variables necesarias

### Error: "Function exceeds maximum size"

**Causa**: Las serverless functions son muy grandes  
**Solución**: Ya están optimizadas, pero si persiste, contacta a soporte de Vercel

### Error 403: "Acceso denegado desde este dominio"

**Causa**: Tu dominio no está en `ALLOWED_EMBED_DOMAINS`  
**Solución**: Agrega tu dominio a la variable de entorno

### El widget no carga

**Causa**: Problemas con las rutas de los archivos  
**Solución**: Verifica que las rutas en `index.html` sean correctas:
```html
<link rel="stylesheet" href="./assets/css/voice-widget.css">
<script src="./assets/js/voice-widget/config.js"></script>
```

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en la pestaña **"Functions"**
3. Click en cualquier función para ver sus logs
4. Filtra por función específica (token, webhook, check-config)

### Analytics

Vercel proporciona analytics automáticamente:
- Ve a la pestaña **"Analytics"** en tu proyecto
- Monitorea:
  - Requests por segundo
  - Latencia de funciones
  - Errores 4xx/5xx
  - Uso de ancho de banda

## 🔒 Seguridad

### Variables Sensibles

- ✅ Marca `ELEVENLABS_API_KEY` como sensible
- ✅ Marca `ELEVENLABS_WEBHOOK_SECRET` como sensible
- ✅ Nunca comitees el archivo `.env` a Git
- ✅ Usa `.env.example` como template

### Rate Limiting

Vercel incluye rate limiting automático. Si necesitas más control:

```javascript
// En api/elevenlabs/token.js
import { rateLimit } from '@vercel/edge';

const limiter = rateLimit({
  interval: '1m',
  limit: 60,
});

export default async function handler(req, res) {
  const rateLimitResult = await limiter.check(res, req);
  if (!rateLimitResult.success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  // ... resto del código
}
```

## 🔄 Actualizaciones

### Deploy Automático

Vercel despliega automáticamente cuando pusheas a tu rama principal:

```bash
git add .
git commit -m "Update voice widget"
git push origin main
```

Vercel detectará el push y hará el deploy automáticamente.

### Rollback

Si algo sale mal:

1. Ve al dashboard de Vercel
2. Click en **"Deployments"**
3. Encuentra el deployment anterior que funcionaba
4. Click en **"..."** → **"Promote to Production"**

## 📞 Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **ElevenLabs Docs**: https://docs.elevenlabs.io/

## ✅ Checklist de Deploy

- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] `ELEVENLABS_API_KEY` configurada
- [ ] `ELEVENLABS_AGENT_ID` configurada
- [ ] `ALLOWED_EMBED_DOMAINS` configurada
- [ ] Deploy exitoso
- [ ] `/api/elevenlabs/check-config` retorna `configured: true`
- [ ] Widget visible en el sitio
- [ ] Conversación por voz funciona
- [ ] Webhook configurado en ElevenLabs (opcional)
- [ ] Custom domain configurado (opcional)

---

**¡Listo para producción!** 🎉

Tu Voice Widget está ahora desplegado en Vercel y listo para usar.
