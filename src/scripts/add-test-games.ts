import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Jogos de teste com ROMs disponíveis publicamente
const testGames = [
  {
    title: "Super Mario World",
    description: "O clássico jogo de plataforma da Nintendo",
    cover: "/covers/Super_Mario_World_Coverart.png",
    coverUrl: "/covers/Super_Mario_World_Coverart.png",
    romUrl: "/roms/Super Mario World (USA).smc",
    platform: "snes",
    genre: "Platform",
    year: 1990,
    players: 1,
    rating: 4.9,
    publisher: "Nintendo",
    multiplayerSupport: false,
    playCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    title: "Super Mario Kart",
    description: "O primeiro jogo da série Mario Kart",
    cover: "/covers/Super Mario Kart .webp",
    coverUrl: "/covers/Super Mario Kart .webp", 
    romUrl: "/roms/Super Mario Kart (USA).smc",
    platform: "snes",
    genre: "Racing",
    year: 1992,
    players: 2,
    rating: 4.8,
    publisher: "Nintendo",
    multiplayerSupport: true,
    playCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    title: "Donkey Kong Country",
    description: "Aventura épica com gráficos pré-renderizados",
    cover: "/covers/Donkey_Kong_Country_SNES_cover.png",
    coverUrl: "/covers/Donkey_Kong_Country_SNES_cover.png",
    romUrl: "/roms/Donkey Kong Country (USA) (Rev 2).smc",
    platform: "snes",
    genre: "Platform",
    year: 1994,
    players: 2,
    rating: 4.7,
    publisher: "Nintendo",
    multiplayerSupport: true,
    playCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    title: "Street Fighter II",
    description: "O lendário jogo de luta",
    cover: "/covers/Street Fighter Alpha 2 (U) [!].jpg",
    coverUrl: "/covers/Street Fighter Alpha 2 (U) [!].jpg",
    romUrl: "/roms/Street Fighter II - The World Warriors (USA).smc",
    platform: "snes", 
    genre: "Fighting",
    year: 1991,
    players: 2,
    rating: 4.6,
    publisher: "Capcom",
    multiplayerSupport: true,
    playCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    title: "Aladdin",
    description: "Aventura baseada no filme da Disney",
    cover: "/covers/aladdin-snes.jpg",
    coverUrl: "/covers/aladdin-snes.jpg",
    romUrl: "/roms/Aladdin (USA).smc",
    platform: "snes",
    genre: "Platform",
    year: 1993,
    players: 1,
    rating: 4.4,
    publisher: "Capcom",
    multiplayerSupport: false,
    playCount: 0,
    createdAt: new Date().toISOString()
  }
];

export async function addTestGames() {
  try {
    console.log('🎮 Verificando jogos existentes...');
    
    // Verifica se já existem jogos
    const gamesSnapshot = await getDocs(collection(db, 'games'));
    
    if (gamesSnapshot.empty) {
      console.log('📦 Nenhum jogo encontrado. Adicionando jogos de teste...');
      
      for (const game of testGames) {
        try {
          const docRef = await addDoc(collection(db, 'games'), game);
          console.log(`✅ Jogo adicionado: ${game.title} (ID: ${docRef.id})`);
        } catch (error) {
          console.error(`❌ Erro ao adicionar ${game.title}:`, error);
        }
      }
      
      console.log('🎉 Todos os jogos de teste foram adicionados!');
    } else {
      console.log(`🎮 ${gamesSnapshot.size} jogos já existem no banco de dados.`);
      gamesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.title || 'Sem título'} (ID: ${doc.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar/adicionar jogos:', error);
  }
}

// Executa se chamado diretamente
if (import.meta.hot) {
  addTestGames();
}