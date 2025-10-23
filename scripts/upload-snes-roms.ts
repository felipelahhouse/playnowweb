import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBi3SzoJra8bpT_enlqqkKpd7Eqh3q9iQw",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "691991405200",
  appId: "1:691991405200:web:8ce4f1f31c6950e66b6c55",
  measurementId: "G-WNZNFH46HL"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Mapeamento de ROMs SNES para títulos e anos
const snesGamesData: Record<string, { title: string; year: number; genre: string; rating: number; description: string }> = {
  "Aladdin (U) [!].smc": {
    title: "Aladdin",
    year: 1994,
    genre: "Platform",
    rating: 4.6,
    description: "Disney's Aladdin platformer with amazing animations and music"
  },
  "Battletoads & Double Dragon - The Ultimate Team (U) [!].smc": {
    title: "Battletoads & Double Dragon",
    year: 1993,
    genre: "Beat 'em up",
    rating: 4.5,
    description: "Epic crossover beat 'em up featuring both legendary franchises"
  },
  "Battletoads in Battlemaniacs (U) [!].smc": {
    title: "Battletoads in Battlemaniacs",
    year: 1993,
    genre: "Beat 'em up",
    rating: 4.4,
    description: "Challenging beat 'em up with the iconic Battletoads"
  },
  "Castlevania - Dracula X (U) [!].smc": {
    title: "Castlevania: Dracula X",
    year: 1995,
    genre: "Action",
    rating: 4.7,
    description: "Classic Castlevania action with Gothic atmosphere"
  },
  "Chrono Trigger (USA).sfc": {
    title: "Chrono Trigger",
    year: 1995,
    genre: "RPG",
    rating: 5.0,
    description: "One of the greatest RPGs ever made with time travel mechanics"
  },
  "Donkey Kong Country 3 - Dixie Kong's Double Trouble! (USA) (En,Fr).sfc": {
    title: "Donkey Kong Country 3",
    year: 1996,
    genre: "Platform",
    rating: 4.5,
    description: "Third installment with Dixie Kong and Kiddy Kong adventure"
  },
  "Dragon Ball Z - Super Butouden 2 (J) (V1.1).smc": {
    title: "Dragon Ball Z: Super Butouden 2",
    year: 1993,
    genre: "Fighting",
    rating: 4.3,
    description: "Fast-paced DBZ fighting game with iconic characters"
  },
  "Fatal Fury 2 (E) [!].smc": {
    title: "Fatal Fury 2",
    year: 1993,
    genre: "Fighting",
    rating: 4.2,
    description: "SNK's classic fighting game with international fighters"
  },
  "Fatal Fury Special (E) (61959).smc": {
    title: "Fatal Fury Special",
    year: 1993,
    genre: "Fighting",
    rating: 4.4,
    description: "Enhanced version of Fatal Fury 2 with more moves"
  },
  "Goof Troop (E).smc": {
    title: "Goof Troop",
    year: 1993,
    genre: "Puzzle",
    rating: 4.0,
    description: "Disney co-op puzzle adventure with Goofy and Max"
  },
  "Joe & Mac 2 - Lost in the Tropics (U).smc": {
    title: "Joe & Mac 2: Lost in the Tropics",
    year: 1994,
    genre: "Platform",
    rating: 4.1,
    description: "Prehistoric platformer adventure"
  },
  "Killer Instinct (E) [!].smc": {
    title: "Killer Instinct",
    year: 1995,
    genre: "Fighting",
    rating: 4.6,
    description: "Revolutionary fighting game with combo breakers"
  },
  "Kirby Super Star (USA).sfc": {
    title: "Kirby Super Star",
    year: 1996,
    genre: "Platform",
    rating: 4.8,
    description: "Multiple Kirby adventures in one cartridge"
  },
  "Legend of Zelda, The - A Link to the Past (USA).sfc": {
    title: "The Legend of Zelda: A Link to the Past",
    year: 1991,
    genre: "Action-Adventure",
    rating: 5.0,
    description: "Masterpiece action-adventure in Light and Dark Worlds"
  },
  "Legend of Zelda, The - A Link to the Past (USA) (1).sfc": {
    title: "The Legend of Zelda: A Link to the Past",
    year: 1991,
    genre: "Action-Adventure",
    rating: 5.0,
    description: "Masterpiece action-adventure in Light and Dark Worlds"
  },
  "Magical Quest Starring Mickey Mouse, The (U) .smc": {
    title: "The Magical Quest Starring Mickey Mouse",
    year: 1992,
    genre: "Platform",
    rating: 4.3,
    description: "Disney platformer with costume transformation mechanics"
  },
  "Mega Man X (U) (V1.0) .smc": {
    title: "Mega Man X",
    year: 1993,
    genre: "Action",
    rating: 4.9,
    description: "Revolutionary Mega Man with X and Zero"
  },
  "Mega Man X (U) (V1.0)  (1).smc": {
    title: "Mega Man X",
    year: 1993,
    genre: "Action",
    rating: 4.9,
    description: "Revolutionary Mega Man with X and Zero"
  },
  "Mickey to Donald - Magical Adventure 3 (J) [t2].smc": {
    title: "Mickey to Donald: Magical Adventure 3",
    year: 1995,
    genre: "Platform",
    rating: 4.2,
    description: "Disney platformer featuring Mickey and Donald"
  },
  "Mighty Morphin Power Rangers - The Movie (U).smc": {
    title: "Mighty Morphin Power Rangers: The Movie",
    year: 1995,
    genre: "Beat 'em up",
    rating: 4.0,
    description: "Beat 'em up based on the Power Rangers movie"
  },
  "Mighty Morphin Power Rangers (U).smc": {
    title: "Mighty Morphin Power Rangers",
    year: 1994,
    genre: "Fighting",
    rating: 4.1,
    description: "Fighting game featuring the original Power Rangers"
  },
  "Mortal Kombat II (USA) (Rev 1).sfc": {
    title: "Mortal Kombat II",
    year: 1994,
    genre: "Fighting",
    rating: 4.7,
    description: "Brutal fighting game with Fatalities"
  },
  "Mutant Chronicles - Doom Troopers (U) .smc": {
    title: "Mutant Chronicles: Doom Troopers",
    year: 1995,
    genre: "Run and Gun",
    rating: 3.9,
    description: "Sci-fi run and gun action game"
  },
  "Prehistorik Man (U) .smc": {
    title: "Prehistorik Man",
    year: 1995,
    genre: "Platform",
    rating: 4.0,
    description: "Prehistoric platformer adventure"
  },
  "Secret of Mana (USA).sfc": {
    title: "Secret of Mana",
    year: 1993,
    genre: "Action RPG",
    rating: 4.9,
    description: "Legendary action RPG with real-time combat"
  },
  "Sparkster (E).smc": {
    title: "Sparkster",
    year: 1994,
    genre: "Platform",
    rating: 4.2,
    description: "Rocket Knight platformer action"
  },
  "Sparkster (E) (1).smc": {
    title: "Sparkster",
    year: 1994,
    genre: "Platform",
    rating: 4.2,
    description: "Rocket Knight platformer action"
  },
  "Street Fighter Alpha 2 (U) [!].smc": {
    title: "Street Fighter Alpha 2",
    year: 1996,
    genre: "Fighting",
    rating: 4.6,
    description: "Capcom's prequel to Street Fighter II"
  },
  "Super Mario World.sfc": {
    title: "Super Mario World",
    year: 1990,
    genre: "Platform",
    rating: 5.0,
    description: "The iconic SNES launch title with Yoshi"
  },
  "Super Metroid (Japan, USA) (En,Ja).sfc": {
    title: "Super Metroid",
    year: 1994,
    genre: "Action-Adventure",
    rating: 5.0,
    description: "Masterpiece exploration game on Planet Zebes"
  },
  "Super Punch-Out!! (USA).sfc": {
    title: "Super Punch-Out!!",
    year: 1994,
    genre: "Sports",
    rating: 4.5,
    description: "Boxing game with colorful opponents"
  },
  "Teenage Mutant Ninja Turtles IV - Turtles in Time (USA).sfc": {
    title: "Teenage Mutant Ninja Turtles IV: Turtles in Time",
    year: 1992,
    genre: "Beat 'em up",
    rating: 4.8,
    description: "Legendary TMNT beat 'em up through time"
  }
};

async function uploadSnesRoms() {
  const romsDir = path.join(process.cwd(), 'public', 'roms', 'snes');
  const files = fs.readdirSync(romsDir);

  console.log(`🎮 Encontradas ${files.length} ROMs SNES para upload\n`);

  let uploadCount = 0;
  let skipCount = 0;

  for (const file of files) {
    const filePath = path.join(romsDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    const gameData = snesGamesData[file];
    
    if (!gameData) {
      console.log(`⚠️  Pulando ${file} (sem dados de jogo)`);
      skipCount++;
      continue;
    }

    try {
      // Verificar se jogo já existe no Firestore
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where('title', '==', gameData.title), where('platform', '==', 'SNES'));
      const existingGames = await getDocs(q);

      if (!existingGames.empty) {
        console.log(`⏭️  ${gameData.title} - Já existe no Firestore`);
        skipCount++;
        continue;
      }

      // Upload ROM para Storage
      const storageRef = ref(storage, `roms/snes/${file}`);
      await uploadBytes(storageRef, fileBuffer);
      const romUrl = await getDownloadURL(storageRef);

      // Upload cover para Storage (se existir localmente)
      let coverUrl = `/covers/snes/${file.replace(/\.(smc|sfc)$/i, '.png')}`;
      const coverPath = path.join(process.cwd(), 'public', 'covers', 'snes', `${file.replace(/\.(smc|sfc)$/i, '.png')}`);
      
      if (fs.existsSync(coverPath)) {
        const coverBuffer = fs.readFileSync(coverPath);
        const coverRef = ref(storage, `covers/snes/${file.replace(/\.(smc|sfc)$/i, '.png')}`);
        await uploadBytes(coverRef, coverBuffer);
        coverUrl = await getDownloadURL(coverRef);
      }

      // Adicionar ao Firestore
      await addDoc(collection(db, 'games'), {
        title: gameData.title,
        platform: 'SNES',
        genre: gameData.genre,
        year: gameData.year,
        rating: gameData.rating,
        description: gameData.description,
        romUrl: romUrl,
        cover: coverUrl,
        coverUrl: coverUrl,
        playCount: 0,
        players: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ ${gameData.title} - Upload completo!`);
      uploadCount++;

    } catch (error) {
      console.error(`❌ Erro ao processar ${file}:`, error);
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Uploads: ${uploadCount}`);
  console.log(`   ⏭️  Pulados: ${skipCount}`);
  console.log(`   📦 Total: ${files.length}`);
}

// Executar
uploadSnesRoms()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
