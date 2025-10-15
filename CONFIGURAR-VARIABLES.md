# 🔧 Configurar Variables de Entorno en Vercel

## 📝 Variables Requeridas

Antes de hacer deploy, necesitas configurar **SOLO 2 VARIABLES** en Vercel:

### ✅ Variables Obligatorias

1. **ELEVENLABS_API_KEY**
   - Obtener en: https://elevenlabs.io/app/settings/api-keys
   - Tipo: Secret
   - Ejemplo: `sk_1234567890abcdefghijklmnopqrstuvwxyz`

2. **ELEVENLABS_AGENT_ID**
   - Obtener en: https://elevenlabs.io/app/conversational-ai
   - Tipo: Plain Text
   - Ejemplo: `agent_abc123xyz456`

**¡Eso es todo!** Solo necesitas estas 2 variables para que funcione.

---

## 🚀 Método 1: Dashboard de Vercel (Recomendado)

### Paso 1: Acceder a Settings

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto **DEMO-UIC**
3. Click en **"Settings"** (arriba)
4. Click en **"Environment Variables"** (menú izquierdo)

### Paso 2: Agregar Variables

Para cada variable:

1. Click en **"Add New"** o **"Add"**
2. **Name/Key**: Escribe el nombre exacto (ej: `ELEVENLABS_API_KEY`)
3. **Value**: Pega el valor
4. **Environment**: Selecciona **Production**, **Preview**, y **Development**
5. Click **"Save"**

Repite para cada variable.

### Paso 3: Redeploy

1. Ve a **"Deployments"** (arriba)
2. Encuentra el último deployment
3. Click en los 3 puntos **"..."**
4. Click en **"Redeploy"**

---

## 💻 Método 2: Vercel CLI

```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# 2. Login
vercel login

# 3. Agregar las 2 variables obligatorias
vercel env add ELEVENLABS_API_KEY
# Cuando te pregunte, pega tu API Key y presiona Enter
# Selecciona: Production, Preview, Development (usa espaciador para marcar)

vercel env add ELEVENLABS_AGENT_ID
# Pega tu Agent ID
# Selecciona: Production, Preview, Development

# 4. Deploy
vercel --prod
```

---

## 🔍 Método 3: Durante el Primer Deploy

Si aún no has hecho el primer deploy:

1. Ve a https://vercel.com/new
2. Click en **"Import Project"**
3. Conecta tu repositorio Git
4. Selecciona **DEMO-UIC**
5. **ANTES de hacer click en "Deploy":**
   - Expande **"Environment Variables"**
   - Click en **"+ Add"**
   - Agrega todas las variables necesarias
6. Ahora sí, click en **"Deploy"**

---

## ✅ Verificar que Funcionen

Después de agregar las variables y hacer redeploy:

1. Espera a que termine el deployment (1-2 minutos)
2. Visita: `https://tu-proyecto.vercel.app/api/elevenlabs/check-config`
3. Deberías ver:

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

Si ves `"configured": false` o variables en `"missing"`, revisa que las hayas agregado correctamente.

---

## 🐛 Solución de Problemas

### Error: "Build failed - Environment variables not found"

**Causa**: Intentaste hacer deploy sin configurar las variables primero  
**Solución**: 
1. Configura las variables en Settings → Environment Variables
2. Redeploy el proyecto

### Error: "configured": false en /api/elevenlabs/check-config

**Causa**: Las variables no están configuradas o tienen nombres incorrectos  
**Solución**:
1. Verifica en Settings → Environment Variables
2. Asegúrate de que los nombres sean exactamente:
   - `ELEVENLABS_API_KEY` (no `ELEVEN_LABS_API_KEY`)
   - `ELEVENLABS_AGENT_ID` (no `ELEVENLABS_AGENTID`)
3. Verifica que estén en el ambiente correcto (Production)

### Las variables no se aplican después de agregarlas

**Causa**: Necesitas hacer redeploy  
**Solución**:
1. Ve a Deployments
2. Redeploy el último deployment
3. Las variables nuevas se aplicarán automáticamente

---

## 📋 Checklist

Marca cuando completes cada paso:

- [ ] Obtuve mi API Key de ElevenLabs
- [ ] Obtuve mi Agent ID de ElevenLabs
- [ ] Agregué `ELEVENLABS_API_KEY` en Vercel
- [ ] Agregué `ELEVENLABS_AGENT_ID` en Vercel
- [ ] Seleccioné Production, Preview, Development en ambas variables
- [ ] Hice redeploy del proyecto
- [ ] Verifiqué en `/api/elevenlabs/check-config`
- [ ] El widget funciona correctamente

---

## 📸 Capturas de Pantalla de Referencia

### Dónde encontrar Settings → Environment Variables:

```
Vercel Dashboard
├── [Tu Proyecto]
    ├── Overview
    ├── Deployments
    ├── Analytics
    ├── Logs
    └── Settings ← Click aquí
        ├── General
        ├── Domains
        ├── Environment Variables ← Luego aquí
        ├── Git
        └── ...
```

### Cómo se ve el formulario para agregar variables:

```
┌─────────────────────────────────────────┐
│ Add Environment Variable                │
├─────────────────────────────────────────┤
│ Name                                    │
│ [ELEVENLABS_API_KEY____________]        │
│                                         │
│ Value                                   │
│ [sk_1234567890abcdef___________]        │
│                                         │
│ Environments                            │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
│                                         │
│ [ Cancel ]  [ Save ]                    │
└─────────────────────────────────────────┘
```

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentación de Variables**: https://vercel.com/docs/environment-variables
- **ElevenLabs API Keys**: https://elevenlabs.io/app/settings/api-keys
- **ElevenLabs Agents**: https://elevenlabs.io/app/conversational-ai

---

**💡 Tip**: Guarda tus credenciales en un lugar seguro (como un password manager). Las necesitarás si alguna vez recreas el proyecto.
