import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Plugin para copiar arquivos estáticos necessários
const copyStaticFiles = () => ({
  name: 'copy-static-files',
  closeBundle() {
    console.log('\n🚀 Copiando arquivos estáticos...\n');
    
    // Copia auto-reload.js
    try {
      copyFileSync(
        resolve(__dirname, 'public/auto-reload.js'),
        resolve(__dirname, 'dist/auto-reload.js')
      );
      console.log('✅ auto-reload.js copiado para dist/');
    } catch (e) {
      console.warn('⚠️ Não foi possível copiar auto-reload.js:', (e as Error).message);
    }
    
    // Copia version.json
    try {
      copyFileSync(
        resolve(__dirname, 'public/version.json'),
        resolve(__dirname, 'dist/version.json')
      );
      console.log('✅ version.json copiado para dist/');
    } catch (e) {
      console.warn('⚠️ Não foi possível copiar version.json:', (e as Error).message);
    }

    // 🎮 COPIA ROMS - Sistema rápido local
    console.log('\n🎮 Copiando ROMs para dist/roms/...');
    try {
      const romsSource = resolve(__dirname, 'public/roms');
      const romsDest = resolve(__dirname, 'dist/roms');
      
      if (existsSync(romsSource)) {
        // Cria pasta de destino
        mkdirSync(romsDest, { recursive: true });
        
        // Copia toda pasta roms
        cpSync(romsSource, romsDest, { recursive: true });
        console.log('✅ ROMs copiadas para dist/roms/');
      } else {
        console.warn('⚠️ Pasta public/roms não encontrada');
      }
    } catch (e) {
      console.error('❌ Erro ao copiar ROMs:', (e as Error).message);
    }

    // 📂 COPIA EMULATORJS - Arquivos locais do emulador
    console.log('\n📂 Copiando EmulatorJS para dist/emulatorjs/...');
    try {
      const emulatorSource = resolve(__dirname, 'public/emulatorjs');
      const emulatorDest = resolve(__dirname, 'dist/emulatorjs');
      
      if (existsSync(emulatorSource)) {
        // Cria pasta de destino
        mkdirSync(emulatorDest, { recursive: true });
        
        // Copia toda pasta emulatorjs
        cpSync(emulatorSource, emulatorDest, { recursive: true });
        console.log('✅ EmulatorJS copiado para dist/emulatorjs/');
      } else {
        console.warn('⚠️ Pasta public/emulatorjs não encontrada');
      }
    } catch (e) {
      console.error('❌ Erro ao copiar EmulatorJS:', (e as Error).message);
    }

    console.log('\n✅ Build completo! Pronto para deploy.\n');
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    alias: {
      // Evita imports de módulos Node.js no browser
      'events': 'eventemitter3',
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    target: 'es2020',
    minify: false, // ✅ DESABILITAR MINIFICAÇÃO para debug
    commonjsOptions: {
      transformMixedEsModules: true,
      ignore: ['node:events', 'node:stream', 'node:util']
    },
    rollupOptions: {
      external: ['node:events', 'node:stream', 'node:util', 'node:internal/streams/readable'],
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // ✅ SEM CODE SPLITTING - Tudo em um bundle só
        inlineDynamicImports: true
      }
    },
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
    cssMinify: true,
    modulePreload: {
      polyfill: true
    }
  },
  // Performance de dev
  server: {
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx']
    }
  }
});

