# DEMO-UIC - Voice Widget con ElevenLabs

Sitio web DEMO de UIC con **Voice Widget integrado** para conversaciones por voz usando ElevenLabs AI.

**Backend replicado desde UlineaUniversidad** - Funcionalidad idéntica con Express.js

## 🎯 Características

- ✅ **Voice Widget integrado** - Conversación por voz en tiempo real
- ✅ **Backend Express** - Replicado desde UlineaUniversidad (Next.js)
- ✅ **Vite + ElevenLabs SDK** - Configuración optimizada
- ✅ **Paleta UIC** - Colores adaptados (#36945F verde, #f6a04e naranja)
- ✅ **Responsive** - Móvil y desktop
- ✅ **Listo para Vercel** - Deploy en 1 click
- ✅ **Documentación completa** - Instrucciones paso a paso

## 🚀 Inicio Rápido

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/DEMO-UIC.git
cd DEMO-UIC

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env
# Edita .env con tus credenciales de ElevenLabs

# 4. Verificar configuración
node verificar-setup.js

# 5. Iniciar desarrollo
npm run dev
```

### Deploy en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/DEMO-UIC)

**Variables de entorno requeridas:**
```
ELEVENLABS_API_KEY = tu_api_key_aqui
ELEVENLABS_AGENT_ID = tu_agent_id_aqui
ALLOWED_EMBED_DOMAINS = tu-dominio.vercel.app,localhost
```

Tu sitio estará en: `https://tu-proyecto.vercel.app`

## 📁 Estructura del Proyecto

```
DEMO-UIC/
├── api/
│   └── server.js                     # Backend Express (replicado de UlineaUniversidad)
├── src/
│   └── voice-widget/
│       ├── config.js                 # Configuración del widget
│       ├── core.js                   # Lógica principal
│       ├── main.js                   # Entry point (Vite)
│       └── ui.js                     # Interfaz de usuario
├── assets/
│   └── css/
│       └── voice-widget.css          # Estilos (paleta UIC)
├── index.html                        # Página principal
├── vite.config.js                    # Configuración de Vite (optimizada)
├── package.json                      # Dependencias
├── verificar-setup.js                # Script de verificación
├── .env.local.example                # Template de variables
├── INSTRUCCIONES-COMPLETAS.md        # Documentación detallada
└── RESUMEN-CAMBIOS.md                # Resumen de cambios
```

## 🔧 Tecnologías

- **Frontend**: Vite 5 + JavaScript ES6
- **Backend**: Express.js (replicado de UlineaUniversidad)
- **Voice AI**: ElevenLabs Conversational AI SDK v0.5.0
- **Deploy**: Vercel
- **WebRTC**: Para audio en tiempo real

## 📋 Credenciales Necesarias

### ElevenLabs

1. **API Key**: https://elevenlabs.io/app/settings/api-keys
2. **Agent ID**: https://elevenlabs.io/app/conversational-ai
   - Crea un agente conversacional
   - Copia el Agent ID

### Vercel

1. Cuenta en: https://vercel.com
2. Conecta tu repositorio Git
3. Configura las variables de entorno

## 🎨 Paleta de Colores UIC

El Voice Widget usa los colores oficiales de UIC:

| Color | Código | Uso |
|-------|--------|-----|
| Verde Principal | `#36945F` | Botones, encabezados |
| Verde Oscuro | `#0A6342` | Hover states |
| Naranja | `#f6a04e` | FAB button, acentos |
| Naranja Hover | `#e59340` | Hover del FAB |

## 📚 Documentación

- **[INSTRUCCIONES-COMPLETAS.md](INSTRUCCIONES-COMPLETAS.md)** - Guía completa paso a paso
- **[RESUMEN-CAMBIOS.md](RESUMEN-CAMBIOS.md)** - Resumen de cambios realizados
- **[verificar-setup.js](verificar-setup.js)** - Script de verificación automática
- **[.env.local.example](.env.local.example)** - Template de variables de entorno

## 🔐 Variables de Entorno

Solo necesitas **2 variables obligatorias**:

```bash
ELEVENLABS_API_KEY=sk_tu_api_key_aqui
ELEVENLABS_AGENT_ID=agent_tu_agent_id_aqui
```

Ver `INSTRUCCIONES-COMPLETAS.md` para detalles completos.

## 🧪 Testing Local

```bash
# 1. Verificar configuración
node verificar-setup.js

# 2. Iniciar desarrollo
npm run dev

# 3. Abrir en navegador
# http://localhost:3000
```

### Verificar Backend

```bash
# En otra terminal
cd api
node server.js

# Verificar endpoint
curl http://localhost:3001/api/elevenlabs/check-config
```

## 🔧 Personalización

### Cambiar colores

Edita `assets/css/voice-widget.css` (líneas 7-14):

```css
:root {
  --voice-widget-primary: #36945F;      /* Verde UIC */
  --voice-widget-secondary: #f6a04e;    /* Naranja UIC */
}
```

### Cambiar WhatsApp

Edita `src/voice-widget/config.js`:

```javascript
export const VoiceWidgetConfig = {
  whatsappNumber: 'TU_NUMERO',
  whatsappMessage: 'TU_MENSAJE',
  // ...
};
```

### Agregar a otras páginas

Copia estos scripts antes de `</body>`:

```html
<link rel="stylesheet" href="./assets/css/voice-widget.css">
<script type="module" src="./src/voice-widget/main.js"></script>
```

## 📊 Monitoreo

### Ver Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Click en **"Functions"**
3. Selecciona la función para ver logs en tiempo real

### Verificar Configuración

Visita: `https://tu-proyecto.vercel.app/api/elevenlabs/check-config`

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

## 🐛 Troubleshooting

### Error: "Cannot import @elevenlabs/client"
```bash
# Limpiar cache y reinstalar
rm -rf node_modules/.vite
npm install
npm run dev
```

### El widget no aparece
```bash
# 1. Verificar configuración
node verificar-setup.js

# 2. Revisar console del navegador (F12)
# Buscar errores de import o rutas
```

### Error: "ElevenLabs not configured"
- ✅ Verifica archivo `.env` con credenciales reales
- ✅ Reinicia el servidor después de cambiar `.env`
- ✅ Verifica endpoint: `http://localhost:3001/api/elevenlabs/check-config`

### Error: "Acceso denegado"
- ✅ Agrega tu dominio a `ALLOWED_EMBED_DOMAINS` en `.env`
- ✅ Reinicia el servidor

### Backend no responde
```bash
# Verificar que el puerto 3001 esté libre
cd api
node server.js
# Deberías ver: [DEMO-UIC] Voice Widget API Server running on port 3001
```

Ver `INSTRUCCIONES-COMPLETAS.md` para más detalles de troubleshooting.

## 🔒 Seguridad

- ✅ Variables sensibles como secrets en Vercel
- ✅ Validación de dominios autorizados
- ✅ Verificación de firma en webhooks (opcional)
- ✅ HTTPS automático con Vercel

## 📞 Soporte

- **Vercel**: https://vercel.com/docs
- **ElevenLabs**: https://docs.elevenlabs.io/
- **Issues**: Abre un issue en GitHub

## ✅ Checklist de Verificación

### Desarrollo Local
- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env` creado con credenciales reales
- [ ] `node verificar-setup.js` pasa sin errores
- [ ] `npm run dev` inicia sin errores
- [ ] Console del navegador no muestra errores de import
- [ ] Backend responde en `/api/elevenlabs/check-config`
- [ ] Widget visible en la página
- [ ] Click en widget abre el panel
- [ ] Conversación por voz funciona

### Deploy a Vercel
- [ ] Repositorio conectado a Vercel
- [ ] `ELEVENLABS_API_KEY` configurada en Vercel
- [ ] `ELEVENLABS_AGENT_ID` configurada en Vercel
- [ ] `ALLOWED_EMBED_DOMAINS` configurada en Vercel
- [ ] Build exitoso
- [ ] Widget funciona en producción

## 📝 Licencia

MIT

---

**Desarrollado por UIC** | Voice Widget powered by ElevenLabs
