# 🔧 Configurar Variables de Entorno en Vercel

## ⚠️ ERROR ACTUAL: "Invalid domain for site owner"

Este error aparece porque las variables de entorno de ElevenLabs no están configuradas en Vercel.

## 📋 Pasos para Configurar:

### 1. Ir a tu Proyecto en Vercel
```
https://vercel.com/dashboard
```

### 2. Seleccionar tu Proyecto DEMO-UIC

### 3. Ir a Settings → Environment Variables

### 4. Agregar las siguientes variables:

#### Variable 1: ELEVENLABS_API_KEY
- **Name:** `ELEVENLABS_API_KEY`
- **Value:** Tu API Key de ElevenLabs
- **Environment:** Production, Preview, Development (seleccionar todas)

#### Variable 2: ELEVENLABS_AGENT_ID  
- **Name:** `ELEVENLABS_AGENT_ID`
- **Value:** Tu Agent ID de ElevenLabs
- **Environment:** Production, Preview, Development (seleccionar todas)

### 5. Redeploy tu Proyecto

Después de agregar las variables:
1. Ve a la pestaña **Deployments**
2. Click en los 3 puntos del último deployment
3. Click en **Redeploy**
4. Espera a que termine el deploy

## 🔑 ¿Dónde Obtener las Credenciales?

### ElevenLabs API Key:
1. Ve a https://elevenlabs.io/app/settings/api-keys
2. Copia tu API Key
3. Pégala en Vercel como `ELEVENLABS_API_KEY`

### ElevenLabs Agent ID:
1. Ve a https://elevenlabs.io/app/conversational-ai
2. Selecciona tu agente
3. Copia el Agent ID de la URL o configuración
4. Pégalo en Vercel como `ELEVENLABS_AGENT_ID`

## ✅ Verificar que Funciona:

Después del redeploy:
1. Abre tu sitio
2. Click en el botón naranja del Voice Widget
3. Click en "Iniciar llamada"
4. Si todo está bien configurado, debería conectarse sin errores

## 🚨 Si Sigue sin Funcionar:

1. Verifica que las variables estén en **Production**
2. Verifica que no haya espacios extras en los valores
3. Haz un **Redeploy** completo
4. Revisa los logs en Vercel → Functions → Logs

## 📞 Modo Fallback:

Si no configuras las variables, el widget mostrará:
- ❌ Error de conexión
- ℹ️ Mensaje: "El asistente de voz estará disponible en breve"
- ✅ El input de texto seguirá funcionando (si está configurado el backend)
