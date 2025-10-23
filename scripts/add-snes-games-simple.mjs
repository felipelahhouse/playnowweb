import admin from 'firebase-admin';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'planowemulator',
    storageBucket: 'planowemulator.firebasestorage.app'
  });
}

const db = admin.firestore();

// Lista de jogos SNES com dados completos
const snesGames = [
  {
    title: "Aladdin",
    romFile: "Aladdin (U) [!].smc",
    coverFile: "Aladdin (USA).png",
    year: 1994,
    genre: "Platform",
    rating: 4.6,
    description: "Disney's Aladdin platformer with amazing animations and music"
  },
  {
    title: "Battletoads & Double Dragon",
    romFile: "Battletoads & Double Dragon - The Ultimate Team (U) [!].smc",
    coverFile: "Battletoads - Double Dragon (USA).png",
    year: 1993,
    genre: "Beat 'em up",
    rating: 4.5,
    description: "Epic crossover beat 'em up featuring both legendary franchises"
  },
  {
    title: "Battletoads in Battlemaniacs",
    romFile: "Battletoads in Battlemaniacs (U) [!].smc",
    coverFile: "Battletoads in Battlemaniacs (USA).png",
    year: 1993,
    genre: "Beat 'em up",
    rating: 4.4,
    description: "Challenging beat 'em up with the iconic Battletoads"
  },
  {
    title: "Castlevania: Dracula X",
    romFile: "Castlevania - Dracula X (U) [!].smc",
    coverFile: "Castlevania - Dracula X (USA).png",
    year: 1995,
    genre: "Action",
    rating: 4.7,
    description: "Classic Castlevania action with Gothic atmosphere"
  },
  {
    title: "Chrono Trigger",
    romFile: "Chrono Trigger (USA).sfc",
    coverFile: "Chrono Trigger (USA).png",
    year: 1995,
    genre: "RPG",
    rating: 5.0,
    description: "One of the greatest RPGs ever made with time travel mechanics"
  },
  {
    title: "Donkey Kong Country 3",
    romFile: "Donkey Kong Country 3 - Dixie Kong's Double Trouble! (USA) (En,Fr).sfc",
    coverFile: "Donkey Kong Country 3 - Dixie Kong_s Double Trouble! (USA) (En,Fr).png",
    year: 1996,
    genre: "Platform",
    rating: 4.5,
    description: "Third installment with Dixie Kong and Kiddy Kong adventure"
  },
  {
    title: "Dragon Ball Z: Super Butouden 2",
    romFile: "Dragon Ball Z - Super Butouden 2 (J) (V1.1).smc",
    coverFile: "Dragon Ball Z - Super Butoden 2 (Japan).png",
    year: 1993,
    genre: "Fighting",
    rating: 4.3,
    description: "Fast-paced DBZ fighting game with iconic characters"
  },
  {
    title: "Fatal Fury 2",
    romFile: "Fatal Fury 2 (E) [!].smc",
    coverFile: "Fatal Fury 2 (USA).png",
    year: 1993,
    genre: "Fighting",
    rating: 4.2,
    description: "SNK's classic fighting game with international fighters"
  },
  {
    title: "Fatal Fury Special",
    romFile: "Fatal Fury Special (E) (61959).smc",
    coverFile: "Fatal Fury Special (USA).png",
    year: 1993,
    genre: "Fighting",
    rating: 4.4,
    description: "Enhanced version of Fatal Fury 2 with more moves"
  },
  {
    title: "Goof Troop",
    romFile: "Goof Troop (E).smc",
    coverFile: "Goof Troop (USA).png",
    year: 1993,
    genre: "Puzzle",
    rating: 4.0,
    description: "Disney co-op puzzle adventure with Goofy and Max"
  },
  {
    title: "Joe & Mac 2: Lost in the Tropics",
    romFile: "Joe & Mac 2 - Lost in the Tropics (U).smc",
    coverFile: "Joe & Mac 2 - Lost in the Tropics (USA).png",
    year: 1994,
    genre: "Platform",
    rating: 4.1,
    description: "Prehistoric platformer adventure"
  },
  {
    title: "Killer Instinct",
    romFile: "Killer Instinct (E) [!].smc",
    coverFile: "Killer Instinct (USA).png",
    year: 1995,
    genre: "Fighting",
    rating: 4.6,
    description: "Revolutionary fighting game with combo breakers"
  },
  {
    title: "Kirby Super Star",
    romFile: "Kirby Super Star (USA).sfc",
    coverFile: "Kirby Super Star (USA).png",
    year: 1996,
    genre: "Platform",
    rating: 4.8,
    description: "Multiple Kirby adventures in one cartridge"
  },
  {
    title: "The Legend of Zelda: A Link to the Past",
    romFile: "Legend of Zelda, The - A Link to the Past (USA).sfc",
    coverFile: "Legend of Zelda, The - A Link to the Past (USA).png",
    year: 1991,
    genre: "Action-Adventure",
    rating: 5.0,
    description: "Masterpiece action-adventure in Light and Dark Worlds"
  },
  {
    title: "The Magical Quest Starring Mickey Mouse",
    romFile: "Magical Quest Starring Mickey Mouse, The (U) .smc",
    coverFile: "Magical Quest Starring Mickey Mouse, The (USA).png",
    year: 1992,
    genre: "Platform",
    rating: 4.3,
    description: "Disney platformer with costume transformation mechanics"
  },
  {
    title: "Mega Man X",
    romFile: "Mega Man X (U) (V1.0) .smc",
    coverFile: "Mega Man X (USA).png",
    year: 1993,
    genre: "Action",
    rating: 4.9,
    description: "Revolutionary Mega Man with X and Zero"
  },
  {
    title: "Mickey to Donald: Magical Adventure 3",
    romFile: "Mickey to Donald - Magical Adventure 3 (J) [t2].smc",
    coverFile: "Mickey to Donald - Magical Adventure 3 (Japan).png",
    year: 1995,
    genre: "Platform",
    rating: 4.2,
    description: "Disney platformer featuring Mickey and Donald"
  },
  {
    title: "Mighty Morphin Power Rangers: The Movie",
    romFile: "Mighty Morphin Power Rangers - The Movie (U).smc",
    coverFile: "Mighty Morphin Power Rangers - The Movie (USA).png",
    year: 1995,
    genre: "Beat 'em up",
    rating: 4.0,
    description: "Beat 'em up based on the Power Rangers movie"
  },
  {
    title: "Mighty Morphin Power Rangers",
    romFile: "Mighty Morphin Power Rangers (U).smc",
    coverFile: "Mighty Morphin Power Rangers (USA).png",
    year: 1994,
    genre: "Fighting",
    rating: 4.1,
    description: "Fighting game featuring the original Power Rangers"
  },
  {
    title: "Mortal Kombat II",
    romFile: "Mortal Kombat II (USA) (Rev 1).sfc",
    coverFile: "Mortal Kombat II (USA).png",
    year: 1994,
    genre: "Fighting",
    rating: 4.7,
    description: "Brutal fighting game with Fatalities"
  },
  {
    title: "Mutant Chronicles: Doom Troopers",
    romFile: "Mutant Chronicles - Doom Troopers (U) .smc",
    coverFile: "Mutant Chronicles - Doom Troopers (USA).png",
    year: 1995,
    genre: "Run and Gun",
    rating: 3.9,
    description: "Sci-fi run and gun action game"
  },
  {
    title: "Prehistorik Man",
    romFile: "Prehistorik Man (U) .smc",
    coverFile: "Prehistorik Man (USA).png",
    year: 1995,
    genre: "Platform",
    rating: 4.0,
    description: "Prehistoric platformer adventure"
  },
  {
    title: "Secret of Mana",
    romFile: "Secret of Mana (USA).sfc",
    coverFile: "Secret of Mana (USA).png",
    year: 1993,
    genre: "Action RPG",
    rating: 4.9,
    description: "Legendary action RPG with real-time combat"
  },
  {
    title: "Sparkster",
    romFile: "Sparkster (E).smc",
    coverFile: "Sparkster (USA).png",
    year: 1994,
    genre: "Platform",
    rating: 4.2,
    description: "Rocket Knight platformer action"
  },
  {
    title: "Street Fighter Alpha 2",
    romFile: "Street Fighter Alpha 2 (U) [!].smc",
    coverFile: "Street Fighter Alpha 2 (USA).png",
    year: 1996,
    genre: "Fighting",
    rating: 4.6,
    description: "Capcom's prequel to Street Fighter II"
  },
  {
    title: "Super Mario World",
    romFile: "Super Mario World.sfc",
    coverFile: "Super Mario World (USA).png",
    year: 1990,
    genre: "Platform",
    rating: 5.0,
    description: "The iconic SNES launch title with Yoshi"
  },
  {
    title: "Super Metroid",
    romFile: "Super Metroid (Japan, USA) (En,Ja).sfc",
    coverFile: "Super Metroid (Japan, USA).png",
    year: 1994,
    genre: "Action-Adventure",
    rating: 5.0,
    description: "Masterpiece exploration game on Planet Zebes"
  },
  {
    title: "Super Punch-Out!!",
    romFile: "Super Punch-Out!! (USA).sfc",
    coverFile: "Super Punch-Out!! (USA).png",
    year: 1994,
    genre: "Sports",
    rating: 4.5,
    description: "Boxing game with colorful opponents"
  },
  {
    title: "Teenage Mutant Ninja Turtles IV: Turtles in Time",
    romFile: "Teenage Mutant Ninja Turtles IV - Turtles in Time (USA).sfc",
    coverFile: "Teenage Mutant Ninja Turtles IV - Turtles in Time (USA).png",
    year: 1992,
    genre: "Beat 'em up",
    rating: 4.8,
    description: "Legendary TMNT beat 'em up through time"
  }
];

async function addSnesGames() {
  console.log(`🎮 Adicionando ${snesGames.length} jogos SNES ao Firestore\n`);

  let addedCount = 0;
  let skipCount = 0;

  for (const game of snesGames) {
    try {
      // Verificar se jogo já existe
      const gamesRef = db.collection('games');
      const existingGames = await gamesRef
        .where('title', '==', game.title)
        .where('platform', '==', 'SNES')
        .get();

      if (!existingGames.empty) {
        console.log(`⏭️  ${game.title} - Já existe`);
        skipCount++;
        continue;
      }

      // Adicionar ao Firestore com URLs relativas (servidas pelo Hosting)
      await gamesRef.add({
        title: game.title,
        platform: 'SNES',
        genre: game.genre,
        year: game.year,
        rating: game.rating,
        description: game.description,
        romUrl: `/roms/snes/${game.romFile}`,
        cover: `/covers/snes/${game.coverFile}`,
        coverUrl: `/covers/snes/${game.coverFile}`,
        playCount: 0,
        players: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${game.title} - Adicionado!`);
      addedCount++;

    } catch (error) {
      console.error(`❌ Erro ao adicionar ${game.title}:`, error.message);
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Adicionados: ${addedCount}`);
  console.log(`   ⏭️  Pulados: ${skipCount}`);
  console.log(`   📦 Total: ${snesGames.length}`);
}

// Executar
addSnesGames()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
