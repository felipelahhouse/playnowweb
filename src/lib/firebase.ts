import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// 🔥 CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDmC_HF775QiX6EA3rx2xDF2XXw8zmg3yQ",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "509464952147",
  appId: "1:509464952147:web:59776912f625f3235cf5a6",
  measurementId: "G-JQDRDZY9BJ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔧 FIX: Inicializar Firestore com configurações otimizadas para evitar BloomFilterError
let db: Firestore;
try {
  // 🛡️ AGRESSIVO FIX para erro "INTERNAL ASSERTION FAILED (ID: ca9)" e 400 errors:
  // Desabilitar cache persistente completamente - estava causando corrupção mesmo com long polling
  // Usar apenas long polling sem camadas adicionais de cache
  db = initializeFirestore(app, {
    // ✅ Força long polling para máxima estabilidade (sem watch streams)
    experimentalForceLongPolling: true,
    // ❌ Desabilitar cache persistente que causa 400 errors e state corruption
    // Usar memória volátil em vez de IndexedDB para evitar corrupção cross-tab
    localCache: undefined
  });
  console.log('✅ Firestore inicializado com LONG POLLING PURO (sem cache persistente)');
  console.log('   - Watch streams desabilitados');
  console.log('   - Cache persistente desabilitado (causava 400 errors)');
  console.log('   - Usando apenas polling em memória volátil');
  
  // 🧹 Limpar IndexedDB corrupto ao inicializar (para migração de usuários antigos)
  if ('indexedDB' in window) {
    (async () => {
      try {
        const dbs = await (indexedDB as any).databases?.();
        if (dbs) {
          for (const dbInfo of dbs) {
            if (dbInfo.name?.includes('firestore')) {
              indexedDB.deleteDatabase(dbInfo.name);
              console.log('[FIRESTORE] IndexedDB corrupto removido:', dbInfo.name);
            }
          }
        }
      } catch (err) {
        console.warn('[FIRESTORE] Erro ao limpar IndexedDB:', err);
      }
    })();
  }
  
  // 🧹 Limpar Service Worker cache Firestore
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('firestore') || cacheName.includes('googleapis')) {
          caches.delete(cacheName).then(() => {
            console.log('[FIRESTORE] Cache Service Worker removido:', cacheName);
          });
        }
      });
    });
  }
} catch (error) {
  // Fallback: usar getFirestore padrão se der erro
  console.warn('⚠️ Erro ao inicializar Firestore com long polling puro, usando configuração padrão:', error);
  db = getFirestore(app);
}

// Exportar serviços
export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
