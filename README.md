# DEMO-UIC - Voice Widget con ElevenLabs

Sitio web DEMO de UIC con **Voice Widget integrado** para conversaciones por voz usando ElevenLabs AI.

## 🎯 Características

- ✅ **Sitio HTML estático** - No requiere framework
- ✅ **Voice Widget integrado** - Conversación por voz en tiempo real
- ✅ **Serverless Functions (Vercel)** - Backend escalable sin servidor
- ✅ **Paleta UIC** - Colores adaptados (#36945F verde, #f6a04e naranja)
- ✅ **Responsive** - Móvil y desktop
- ✅ **Listo para Vercel** - Deploy en 1 click

## 🚀 Deploy Rápido en Vercel

### Paso 1: Fork o clona este repositorio

```bash
git clone https://github.com/tu-usuario/DEMO-UIC.git
cd DEMO-UIC
```

### Paso 2: Despliega en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/DEMO-UIC)

### Paso 3: Configura las 2 variables de entorno en Vercel

```
ELEVENLABS_API_KEY = tu_api_key_aqui
ELEVENLABS_AGENT_ID = tu_agent_id_aqui
```

### Paso 4: ¡Listo!

Tu sitio estará en: `https://tu-proyecto.vercel.app`

## 📁 Estructura del Proyecto

```
DEMO-UIC/
├── api/                              # Vercel Serverless Functions
│   └── elevenlabs/
│       ├── token.js                  # Genera tokens de sesión
│       ├── webhook.js                # Recibe eventos de ElevenLabs
│       └── check-config.js           # Verifica configuración
├── assets/
│   ├── css/
│   │   └── voice-widget.css          # Estilos del widget (paleta UIC)
│   └── js/
│       └── voice-widget/
│           ├── config.js             # Configuración
│           ├── core.js               # Lógica de ElevenLabs
│           ├── ui.js                 # Interfaz de usuario
│           └── index.js              # Punto de entrada
├── index.html                        # Página principal con widget
├── package.json                      # Configuración del proyecto
├── vercel.json                       # Configuración de Vercel
└── .env.example                      # Template de variables
```

## 🔧 Tecnologías

- **Frontend**: HTML, CSS, JavaScript Vanilla
- **Backend**: Vercel Serverless Functions
- **Voice AI**: ElevenLabs Conversational AI
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

- **[QUICK-START.md](QUICK-START.md)** - Guía rápida de 5 minutos
- **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)** - Guía completa de deployment
- **[VARIABLES-VERCEL.txt](VARIABLES-VERCEL.txt)** - Lista de variables de entorno
- **[VOICE-WIDGET-README.md](VOICE-WIDGET-README.md)** - Documentación técnica completa

## 🔐 Variables de Entorno

Solo necesitas **2 variables obligatorias**:

```bash
ELEVENLABS_API_KEY=sk_tu_api_key_aqui
ELEVENLABS_AGENT_ID=agent_tu_agent_id_aqui
```

Ver `VARIABLES-VERCEL.txt` o `CONFIGURAR-VARIABLES.md` para detalles completos.

## 🧪 Testing Local

```bash
# Instalar Vercel CLI
npm install -g vercel

# Crear archivo .env con tus credenciales
cp .env.example .env

# Iniciar servidor de desarrollo de Vercel
vercel dev
```

Abre http://localhost:3000

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

Edita `assets/js/voice-widget/config.js`:

```javascript
whatsappNumber: 'TU_NUMERO',
whatsappMessage: 'TU_MENSAJE',
```

### Agregar a otras páginas

Copia estos scripts antes de `</body>`:

```html
<link rel="stylesheet" href="./assets/css/voice-widget.css">
<script src="./assets/js/voice-widget/config.js"></script>
<script src="./assets/js/voice-widget/core.js"></script>
<script src="./assets/js/voice-widget/ui.js"></script>
<script src="./assets/js/voice-widget/index.js"></script>
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

### El widget no aparece
- ✅ Verifica que los scripts estén en el HTML
- ✅ Revisa la consola del navegador (F12)
- ✅ Verifica las rutas de los archivos

### Error: "ElevenLabs not configured"
- ✅ Configura variables de entorno en Vercel
- ✅ Redeploy el proyecto

### Error: "Acceso denegado"
- ✅ Agrega tu dominio a `ALLOWED_EMBED_DOMAINS`
- ✅ Redeploy el proyecto

### No se conecta a ElevenLabs
- ✅ Verifica que las credenciales sean correctas
- ✅ Revisa los logs en Vercel → Functions
- ✅ Verifica que el Agent ID esté activo en ElevenLabs

## 🔒 Seguridad

- ✅ Variables sensibles como secrets en Vercel
- ✅ Validación de dominios autorizados
- ✅ Verificación de firma en webhooks (opcional)
- ✅ HTTPS automático con Vercel

## 📞 Soporte

- **Vercel**: https://vercel.com/docs
- **ElevenLabs**: https://docs.elevenlabs.io/
- **Issues**: Abre un issue en GitHub

## ✅ Checklist de Deploy

- [ ] Fork/clone del repositorio
- [ ] Proyecto conectado a Vercel
- [ ] `ELEVENLABS_API_KEY` configurada
- [ ] `ELEVENLABS_AGENT_ID` configurada
- [ ] `ALLOWED_EMBED_DOMAINS` configurada
- [ ] Deploy exitoso
- [ ] `/api/elevenlabs/check-config` retorna `configured: true`
- [ ] Widget visible en el sitio
- [ ] Conversación por voz funciona

## 📝 Licencia

MIT

---

**Desarrollado por UIC** | Voice Widget powered by ElevenLabs
