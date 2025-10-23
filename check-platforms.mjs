import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

console.log('📊 Analisando jogos por plataforma...\n');

const gamesRef = collection(db, 'games');
const snapshot = await getDocs(gamesRef);

const platforms = {};

snapshot.forEach((doc) => {
  const data = doc.data();
  const platform = data.platform || 'unknown';
  
  if (!platforms[platform]) {
    platforms[platform] = [];
  }
  
  platforms[platform].push({
    id: doc.id,
    title: data.title || 'Sem título',
    romUrl: data.romUrl || data.rom || 'SEM ROM'
  });
});

console.log('📦 Total de jogos:', snapshot.size);
console.log('\n📊 Jogos por plataforma:\n');

Object.keys(platforms).sort().forEach(platform => {
  console.log(`\n🎮 ${platform.toUpperCase()}: ${platforms[platform].length} jogos`);
  console.log('   Exemplos:');
  platforms[platform].slice(0, 3).forEach(game => {
    console.log(`   - ${game.title} (ROM: ${game.romUrl.substring(0, 40)}...)`);
  });
});

process.exit(0);
