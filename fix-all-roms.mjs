import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

console.log('🔧 Atualizando ROMs de todos os jogos...\n');

const gamesRef = collection(db, 'games');
const snapshot = await getDocs(gamesRef);

let updated = 0;
let errors = 0;

for (const gameDoc of snapshot.docs) {
  const data = gameDoc.data();
  const currentRomUrl = data.romUrl || data.rom || '';
  
  try {
    let newRomUrl = currentRomUrl;
    
    // Se começa com "roms/" (Firebase Storage path), converter para "/games/roms/"
    if (currentRomUrl.startsWith('roms/')) {
      newRomUrl = `/games/${currentRomUrl}`;
      console.log(`✅ ${data.title || gameDoc.id}`);
      console.log(`   DE: ${currentRomUrl}`);
      console.log(`   PARA: ${newRomUrl}\n`);
      
      await updateDoc(doc(db, 'games', gameDoc.id), {
        romUrl: newRomUrl
      });
      
      updated++;
    } else if (currentRomUrl.startsWith('/games/roms/')) {
      console.log(`⏭️  ${data.title || gameDoc.id} - JÁ está correto\n`);
    } else if (!currentRomUrl) {
      console.log(`⚠️  ${data.title || gameDoc.id} - SEM ROM URL\n`);
    } else {
      console.log(`ℹ️  ${data.title || gameDoc.id} - Mantendo: ${currentRomUrl}\n`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${data.title || gameDoc.id}:`, error.message);
    errors++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Atualizados: ${updated}`);
console.log(`❌ Erros: ${errors}`);
console.log(`📦 Total: ${snapshot.size}`);
console.log('='.repeat(60));

process.exit(0);
