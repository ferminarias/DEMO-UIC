#!/usr/bin/env node

/**
 * Script de Verificación - DEMO-UIC Voice Widget
 * Verifica que todo esté configurado correctamente
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checks = [];
let hasErrors = false;

function log(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  console.log(`${icons[type]} ${message}`);
  if (type === 'error') hasErrors = true;
}

console.log('\n🔍 Verificando configuración de DEMO-UIC Voice Widget...\n');

// 1. Verificar archivos principales
log('Verificando archivos principales...', 'info');

const requiredFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  'src/voice-widget/main.js',
  'src/voice-widget/config.js',
  'src/voice-widget/core.js',
  'src/voice-widget/ui.js',
  'api/server.js',
  'assets/css/voice-widget.css'
];

for (const file of requiredFiles) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    log(`${file}`, 'success');
  } else {
    log(`${file} - NO ENCONTRADO`, 'error');
  }
}

// 2. Verificar node_modules
console.log('\n');
log('Verificando dependencias...', 'info');

const nodeModulesPath = join(__dirname, 'node_modules');
if (existsSync(nodeModulesPath)) {
  log('node_modules existe', 'success');
  
  const elevenLabsPath = join(nodeModulesPath, '@elevenlabs/client');
  if (existsSync(elevenLabsPath)) {
    log('@elevenlabs/client instalado', 'success');
  } else {
    log('@elevenlabs/client NO instalado - ejecuta: npm install', 'error');
  }
  
  const vitePath = join(nodeModulesPath, 'vite');
  if (existsSync(vitePath)) {
    log('vite instalado', 'success');
  } else {
    log('vite NO instalado - ejecuta: npm install', 'error');
  }
} else {
  log('node_modules NO existe - ejecuta: npm install', 'error');
}

// 3. Verificar variables de entorno
console.log('\n');
log('Verificando variables de entorno...', 'info');

const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  log('.env existe', 'success');
  
  try {
    const envContent = await readFile(envPath, 'utf-8');
    
    if (envContent.includes('ELEVENLABS_API_KEY')) {
      const hasRealKey = envContent.match(/ELEVENLABS_API_KEY=sk_[a-zA-Z0-9]+/);
      if (hasRealKey) {
        log('ELEVENLABS_API_KEY configurada', 'success');
      } else {
        log('ELEVENLABS_API_KEY presente pero parece placeholder', 'warning');
      }
    } else {
      log('ELEVENLABS_API_KEY NO configurada', 'error');
    }
    
    if (envContent.includes('ELEVENLABS_AGENT_ID')) {
      const hasRealAgent = envContent.match(/ELEVENLABS_AGENT_ID=agent_[a-zA-Z0-9]+/);
      if (hasRealAgent) {
        log('ELEVENLABS_AGENT_ID configurada', 'success');
      } else {
        log('ELEVENLABS_AGENT_ID presente pero parece placeholder', 'warning');
      }
    } else {
      log('ELEVENLABS_AGENT_ID NO configurada', 'error');
    }
  } catch (error) {
    log('Error leyendo .env: ' + error.message, 'error');
  }
} else {
  log('.env NO existe - copia .env.local.example a .env', 'error');
}

// 4. Verificar configuración de Vite
console.log('\n');
log('Verificando vite.config.js...', 'info');

try {
  const viteConfigPath = join(__dirname, 'vite.config.js');
  const viteConfig = await readFile(viteConfigPath, 'utf-8');
  
  if (viteConfig.includes('@elevenlabs/client')) {
    log('Configuración de ElevenLabs SDK presente', 'success');
  } else {
    log('Configuración de ElevenLabs SDK faltante', 'error');
  }
  
  if (viteConfig.includes('optimizeDeps')) {
    log('optimizeDeps configurado', 'success');
  } else {
    log('optimizeDeps NO configurado', 'warning');
  }
  
  if (viteConfig.includes("'global': 'globalThis'")) {
    log('global definido como globalThis', 'success');
  } else {
    log('global NO definido - puede causar errores', 'warning');
  }
} catch (error) {
  log('Error leyendo vite.config.js: ' + error.message, 'error');
}

// 5. Verificar package.json
console.log('\n');
log('Verificando package.json...', 'info');

try {
  const packageJsonPath = join(__dirname, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  
  if (packageJson.type === 'module') {
    log('type: "module" configurado', 'success');
  } else {
    log('type: "module" NO configurado', 'error');
  }
  
  if (packageJson.dependencies && packageJson.dependencies['@elevenlabs/client']) {
    log(`@elevenlabs/client: ${packageJson.dependencies['@elevenlabs/client']}`, 'success');
  } else {
    log('@elevenlabs/client NO en dependencies', 'error');
  }
  
  if (packageJson.devDependencies && packageJson.devDependencies['vite']) {
    log(`vite: ${packageJson.devDependencies['vite']}`, 'success');
  } else {
    log('vite NO en devDependencies', 'error');
  }
} catch (error) {
  log('Error leyendo package.json: ' + error.message, 'error');
}

// Resumen final
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  log('❌ Se encontraron errores. Por favor, corrígelos antes de continuar.', 'error');
  console.log('\n📝 Pasos sugeridos:');
  console.log('   1. npm install');
  console.log('   2. Copia .env.local.example a .env');
  console.log('   3. Configura tus credenciales de ElevenLabs en .env');
  console.log('   4. Ejecuta: npm run dev\n');
  process.exit(1);
} else {
  log('✅ Todo configurado correctamente!', 'success');
  console.log('\n🚀 Puedes iniciar el proyecto con:');
  console.log('   npm run dev          (Frontend en puerto 3000)');
  console.log('   node api/server.js   (Backend en puerto 3001)');
  console.log('   npm run vercel-dev   (Ambos con Vercel CLI)\n');
  process.exit(0);
}
