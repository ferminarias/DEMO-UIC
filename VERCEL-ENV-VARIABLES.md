# Variables de Entorno para Vercel

## 📝 Variables Requeridas para el Voice Widget

Copia estas variables y sus valores en la configuración de Vercel (Project Settings → Environment Variables).

### 🔑 ElevenLabs Configuration

#### `ELEVENLABS_API_KEY`
- **Tipo**: Secret
- **Descripción**: API Key de ElevenLabs para autenticar las solicitudes
- **Dónde obtenerla**: https://elevenlabs.io/app/settings/api-keys
- **Ejemplo**: `sk_1234567890abcdef1234567890abcdef`
- **Requerida**: ✅ SÍ

```
ELEVENLABS_API_KEY=tu_api_key_aqui
```

#### `ELEVENLABS_AGENT_ID`
- **Tipo**: Plain Text
- **Descripción**: ID del agente conversacional de ElevenLabs
- **Dónde obtenerla**: https://elevenlabs.io/app/conversational-ai
- **Ejemplo**: `agent_abc123xyz456`
- **Requerida**: ✅ SÍ

```
ELEVENLABS_AGENT_ID=tu_agent_id_aqui
```

#### `ELEVENLABS_WEBHOOK_SECRET`
- **Tipo**: Secret
- **Descripción**: Secret para verificar la autenticidad de los webhooks de ElevenLabs
- **Dónde obtenerla**: En la configuración del agente en ElevenLabs
- **Ejemplo**: `whsec_1234567890abcdef`
- **Requerida**: ❌ NO (opcional, pero recomendado para producción)

```
ELEVENLABS_WEBHOOK_SECRET=tu_webhook_secret_aqui
```

### 🌐 Dominios Permitidos

#### `ALLOWED_EMBED_DOMAINS`
- **Tipo**: Plain Text
- **Descripción**: Lista de dominios autorizados para usar el widget (separados por comas)
- **Ejemplo**: `midominio.com,www.midominio.com,educacionenlinea.uic.mx`
- **Requerida**: ❌ NO (si no se especifica, permite localhost)

```
ALLOWED_EMBED_DOMAINS=tudominio.com,www.tudominio.com
```

### 🔧 Configuración del Servidor (Opcional para Backend Express)

Si despliegas el backend Express por separado:

#### `PORT`
- **Tipo**: Plain Text
- **Descripción**: Puerto donde correrá el servidor API
- **Ejemplo**: `3001`
- **Requerida**: ❌ NO (por defecto usa 3001)

```
PORT=3001
```

---

## 🚀 Cómo Agregar Variables en Vercel

### Opción 1: Desde el Dashboard

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Click en **Add Variable**
4. Ingresa:
   - **Key**: Nombre de la variable (ej: `ELEVENLABS_API_KEY`)
   - **Value**: Valor de la variable
   - **Environments**: Selecciona donde aplica (Production, Preview, Development)
5. Click en **Save**

### Opción 2: Desde Vercel CLI

```bash
vercel env add ELEVENLABS_API_KEY
# Pega el valor cuando se te solicite

vercel env add ELEVENLABS_AGENT_ID
# Pega el valor cuando se te solicite

vercel env add ELEVENLABS_WEBHOOK_SECRET
# Pega el valor cuando se te solicite (opcional)

vercel env add ALLOWED_EMBED_DOMAINS
# Ejemplo: tudominio.com,www.tudominio.com
```

### Opción 3: Desde archivo `.env` (Local Development)

Para desarrollo local, crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
ELEVENLABS_API_KEY=tu_api_key_aqui
ELEVENLABS_AGENT_ID=tu_agent_id_aqui
ELEVENLABS_WEBHOOK_SECRET=tu_webhook_secret_aqui
ALLOWED_EMBED_DOMAINS=localhost,127.0.0.1
```

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env` a Git. Asegúrate de que esté en `.gitignore`.

---

## 📋 Checklist de Variables

Usa esta lista para verificar que todas las variables necesarias estén configuradas:

### Variables Obligatorias
- [ ] `ELEVENLABS_API_KEY` - API Key de ElevenLabs
- [ ] `ELEVENLABS_AGENT_ID` - ID del agente conversacional

### Variables Opcionales
- [ ] `ELEVENLABS_WEBHOOK_SECRET` - Para verificar webhooks
- [ ] `ALLOWED_EMBED_DOMAINS` - Dominios autorizados
- [ ] `PORT` - Puerto del servidor (solo si usas backend Express separado)

---

## 🔍 Verificación de Configuración

### Verificar en Desarrollo Local

1. Inicia el servidor:
   ```bash
   cd api
   npm start
   ```

2. Abre: http://localhost:3001/api/elevenlabs/check-config

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

### Verificar en Vercel

1. Después del deploy, visita: `https://tu-dominio.vercel.app/api/elevenlabs/check-config`

2. Si todas las variables están configuradas correctamente, verás:
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

---

## ⚠️ Problemas Comunes

### Error: "ElevenLabs not configured"
**Causa**: Faltan `ELEVENLABS_API_KEY` o `ELEVENLABS_AGENT_ID`  
**Solución**: Verifica que ambas variables estén configuradas en Vercel

### Error: "Acceso denegado desde este dominio"
**Causa**: El dominio no está en `ALLOWED_EMBED_DOMAINS`  
**Solución**: Agrega tu dominio a la variable `ALLOWED_EMBED_DOMAINS`

### Error: "Token generation failed"
**Causa**: API Key inválida o expirada  
**Solución**: Regenera tu API Key en ElevenLabs y actualízala en Vercel

### El webhook no funciona
**Causa**: Falta `ELEVENLABS_WEBHOOK_SECRET` o está mal configurado  
**Solución**: Verifica que el secret coincida con el configurado en ElevenLabs

---

## 🔐 Seguridad

### Buenas Prácticas

1. **Nunca expongas las API Keys**
   - No las incluyas en el código
   - No las subas a Git
   - No las compartas públicamente

2. **Usa variables de entorno**
   - Siempre usa variables de entorno para secretos
   - Marca las variables sensibles como "Secret" en Vercel

3. **Limita los dominios permitidos**
   - Especifica solo los dominios que realmente necesitas
   - No uses wildcards en producción

4. **Regenera keys comprometidas**
   - Si crees que una key se filtró, regenerala inmediatamente
   - Actualiza la variable en Vercel después de regenerar

---

## 📞 Soporte

Si tienes problemas configurando las variables:

1. Revisa la documentación de ElevenLabs: https://docs.elevenlabs.io/
2. Revisa los logs de Vercel para ver errores específicos
3. Verifica que todas las variables estén en el ambiente correcto (Production/Preview/Development)

---

**Última actualización**: 2025-01-15  
**Versión del Voice Widget**: 1.0.0
