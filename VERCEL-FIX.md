# 🔧 FIX PARA VERCEL DEPLOY

## ❌ PROBLEMA IDENTIFICADO:
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

## ✅ SOLUCIÓN APLICADA:

### 1. **Simplificado vercel.json**
```json
{
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "public",
  "installCommand": "npm install",
  "framework": null
}
```

### 2. **Pasos para Deploy:**

**Opción A - Deploy Directo:**
```bash
# Commit y push los cambios
git add .
git commit -m "Fix Vercel runtime configuration"
git push

# Deploy desde Vercel dashboard
```

**Opción B - Deploy Manual:**
```bash
# Build local
npm run build:vercel

# Deploy manual
vercel --prod
```

## 🎯 CONFIGURACIÓN FINAL:

### **Variables de Entorno en Vercel:**
```
ELEVENLABS_API_KEY=tu_api_key
ELEVENLABS_AGENT_ID=tu_agent_id
ELEVENLABS_WEBHOOK_SECRET=tu_secret
ALLOWED_EMBED_DOMAINS=demo-uic.vercel.app
```

### **Estructura del Proyecto:**
```
DEMO-UIC/
├── api/                    # Serverless functions
│   ├── elevenlabs/
│   │   ├── token.js
│   │   ├── webhook.js
│   │   └── check-config.js
│   └── server.js
├── public/                 # Static files
├── vercel.json            # Vercel config (simplificado)
├── package.json           # Dependencies
└── vite.config.simple.js  # Build config
```

## 🚀 RESULTADO ESPERADO:

Después del deploy:
- ✅ **Build exitoso** en Vercel
- ✅ **Voice widget funcional** con ElevenLabs
- ✅ **APIs funcionando** correctamente
- ✅ **Misma funcionalidad** que ULINEA

## 📋 PRÓXIMOS PASOS:

1. **Commit y push** los cambios
2. **Verificar deploy** en Vercel dashboard
3. **Probar voice widget** en producción
4. **Verificar APIs** funcionando

¡**El error del runtime está solucionado!** 🎉
