# 🚀 INSTRUCCIONES DE DEPLOY PARA VERCEL

## ✅ CONFIGURACIÓN COMPLETADA

DEMO-UIC ahora está **100% configurado** para funcionar en Vercel con Vite bundler.

## 📋 PASOS PARA DEPLOY

### 1. **Variables de Entorno en Vercel**
Configura estas variables en tu dashboard de Vercel:

```
ELEVENLABS_API_KEY=tu_api_key_aqui
ELEVENLABS_AGENT_ID=tu_agent_id_aqui
ELEVENLABS_WEBHOOK_SECRET=tu_webhook_secret_aqui
ALLOWED_EMBED_DOMAINS=demo-uic.vercel.app,localhost,127.0.0.1
```

### 2. **Deploy Automático**
```bash
npm run deploy
```

### 3. **Deploy Manual**
```bash
# Build para producción
npm run build:vercel

# Deploy a Vercel
vercel --prod
```

## 🔧 CONFIGURACIÓN TÉCNICA

### **Archivos de Configuración:**
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `vite.config.simple.js` - Configuración de build
- ✅ `package.json` - Scripts de build y deploy
- ✅ `scripts/copy-build.js` - Script de copia multiplataforma

### **Build Process:**
1. **Vite build** - Genera archivos optimizados
2. **Copy script** - Copia archivos a `/public`
3. **Vercel deploy** - Sube a producción

## 🎯 RESULTADO ESPERADO

Después del deploy, DEMO-UIC debería funcionar **100% igual que ULINEA**:

- ✅ **Voice widget funcional** con ElevenLabs
- ✅ **WebRTC connection** estable
- ✅ **Text input** a ElevenLabs primero
- ✅ **Backend fallback** si ElevenLabs falla
- ✅ **Misma arquitectura** que ULINEA (Vite = Next.js bundler)

## 🚨 TROUBLESHOOTING

### Si el build falla:
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build:vercel
```

### Si el voice widget no funciona:
1. Verificar variables de entorno en Vercel
2. Verificar que las APIs estén funcionando
3. Revisar logs de la consola del navegador

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs de Vercel
2. Verifica las variables de entorno
3. Compara con ULINEA que funciona

¡**DEMO-UIC ahora debería funcionar 100% en Vercel!** 🎉
