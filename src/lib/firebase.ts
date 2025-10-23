import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
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
  // Tentar inicializar com cache persistente e suporte a múltiplas abas
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  console.log('✅ Firestore inicializado com cache persistente');
} catch (error) {
  // Fallback: usar getFirestore padrão se der erro
  console.warn('⚠️ Erro ao inicializar Firestore com cache persistente, usando configuração padrão:', error);
  db = getFirestore(app);
}

// Exportar serviços
export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
