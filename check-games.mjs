import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLOfzona1DQD5XQxVQVX8FXrgSqbN5vAE",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "510808214588",
  appId: "1:510808214588:web:1ab54d5e7745a76be8cb85",
  measurementId: "G-TGL2ZHFBFZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('🔍 Verificando jogos SNES no Firestore...\n');

const gamesRef = collection(db, 'games');
const gamesQuery = query(gamesRef, where('platform', '==', 'snes'));
const snapshot = await getDocs(gamesQuery);

console.log(`📦 Total de jogos SNES: ${snapshot.size}\n`);

snapshot.forEach((doc) => {
  const data = doc.data();
  console.log(`\n🎮 ${data.title || 'Sem título'}`);
  console.log(`   ID: ${doc.id}`);
  console.log(`   ROM URL: ${data.romUrl || data.rom || 'NÃO DEFINIDO'}`);
  console.log(`   Cover: ${data.cover || 'Sem cover'}`);
});

console.log('\n\n📁 Verificando arquivos no Storage (roms/snes/)...\n');

try {
  const storageRef = ref(storage, 'roms/snes');
  const result = await listAll(storageRef);
  
  console.log(`📦 Total de arquivos: ${result.items.length}\n`);
  
  result.items.forEach((item) => {
    console.log(`   ✅ ${item.fullPath}`);
  });
} catch (error) {
  console.error('❌ Erro ao listar Storage:', error.message);
}

process.exit(0);
