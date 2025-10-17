/**
 * Copy build files script for Vercel deployment
 * Cross-platform compatible (Windows/Linux/Mac)
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const srcDir = join(projectRoot, 'dist');
const destDir = join(projectRoot, 'public');

console.log('📦 Copying build files for Vercel...');
console.log('Source:', srcDir);
console.log('Destination:', destDir);

function copyRecursive(src, dest) {
  const stats = statSync(src);
  
  if (stats.isDirectory()) {
    // Ensure destination directory exists
    mkdirSync(dest, { recursive: true });
    
    const items = readdirSync(src);
    for (const item of items) {
      // Skip if trying to copy to same location
      if (src === dest) continue;
      copyRecursive(join(src, item), join(dest, item));
    }
  } else {
    // Ensure destination directory exists
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`✅ Copied: ${src} → ${dest}`);
  }
}

function basename(path) {
  return path.split('/').pop() || path.split('\\').pop();
}

try {
  // Copy all files from dist to public
  copyRecursive(srcDir, destDir);
  console.log('🎉 Build files copied successfully for Vercel deployment!');
} catch (error) {
  console.error('❌ Error copying build files:', error);
  process.exit(1);
}
