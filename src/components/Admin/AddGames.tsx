import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const games = [
  {
    title: 'Aladdin',
    description: 'Join Aladdin in this action-packed platformer based on the Disney movie. Run, jump, and swing through Agrabah!',
  image_url: '/covers/aladdin-snes.jpg',
    rom_url: '/roms/Aladdin (U) [!].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1993,
    players: 1,
    rating: 4.5
  },
  {
    title: 'Battletoads & Double Dragon',
    description: 'The ultimate crossover! Team up with the Battletoads and Double Dragon to defeat the Dark Queen.',
  image_url: '/covers/battletoads-double-dragon.jpg',
    rom_url: '/roms/Battletoads & Double Dragon - The Ultimate Team (U) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1993,
    players: 2,
    rating: 4.3
  },
  {
    title: 'Battletoads in Battlemaniacs',
    description: 'The Battletoads are back! Fight through intense levels with crazy attacks and challenging gameplay.',
  image_url: '/covers/battletoads-in-battlemaniacs.png',
    rom_url: '/roms/Battletoads in Battlemaniacs (U) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1993,
    players: 2,
    rating: 4.4
  },
  {
    title: 'Castlevania: Dracula X',
    description: 'Battle Dracula in this gothic horror action platformer. Master the whip and save the land!',
  image_url: '/covers/castlevania-dracula-x.png',
    rom_url: '/roms/Castlevania - Dracula X (U) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1995,
    players: 1,
    rating: 4.6
  },
  {
    title: 'Dragon Ball Z: Super Butouden 2',
    description: 'Epic DBZ fighting game with your favorite characters. Master special moves and become the strongest!',
  image_url: '/covers/dragon-ball-z-super-butoden-2.jpg',
    rom_url: '/roms/Dragon Ball Z - Super Butouden 2 (J) (V1.1).smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1993,
    players: 2,
    rating: 4.5
  },
  {
    title: 'Fatal Fury 2',
    description: 'Classic fighting game with diverse characters and special moves. Battle to become the champion!',
  image_url: '/covers/fatal-fury-2.jpg',
    rom_url: '/roms/Fatal Fury 2 (E) [!].smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1993,
    players: 2,
    rating: 4.2
  },
  {
    title: 'Fatal Fury Special',
    description: 'Enhanced version of Fatal Fury with more characters and improved gameplay.',
  image_url: '/covers/fatal-fury-special.jpg',
    rom_url: '/roms/Fatal Fury Special (E) (61959).smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1994,
    players: 2,
    rating: 4.4
  },
  {
    title: 'Goof Troop',
    description: 'Join Goofy and Max in this fun puzzle-adventure game. Teamwork is the key to success!',
  image_url: '/covers/goof-troop.jpg',
    rom_url: '/roms/Goof Troop (E).smc',
    platform: 'SNES',
    genre: 'Puzzle',
    year: 1993,
    players: 2,
    rating: 4.0
  },
  {
    title: 'International Superstar Soccer Deluxe',
    description: 'The ultimate soccer experience on SNES. Play with international teams in fast-paced matches!',
  image_url: '/covers/international-superstar-soccer-deluxe.webp',
    rom_url: '/roms/International Superstar Soccer Deluxe (U).smc',
    platform: 'SNES',
    genre: 'Sports',
    year: 1995,
    players: 4,
    rating: 4.7
  },
  {
    title: 'Joe & Mac 2: Lost in the Tropics',
    description: 'Prehistoric adventure platformer with colorful graphics and fun gameplay!',
  image_url: '/covers/joe-and-mac-2.jpg',
    rom_url: '/roms/Joe & Mac 2 - Lost in the Tropics (U).smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1994,
    players: 1,
    rating: 4.1
  },
  {
    title: 'Killer Instinct',
    description: 'Revolutionary fighting game with amazing combo system and stunning graphics!',
  image_url: '/covers/killer-instinct.jpg',
    rom_url: '/roms/Killer Instinct (E) [!].smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1995,
    players: 2,
    rating: 4.8
  },
  {
    title: 'The Magical Quest Starring Mickey Mouse',
    description: 'Join Mickey in a magical adventure with costume transformations and fun platforming!',
  image_url: '/covers/magical-quest-mickey-mouse.webp',
    rom_url: '/roms/Magical Quest Starring Mickey Mouse, The (U) [!].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1992,
    players: 1,
    rating: 4.5
  },
  {
    title: 'Mega Man X',
    description: 'The legendary action platformer! Fight as X with new abilities and face challenging bosses.',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Mega Man X (U) (V1.0) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1993,
    players: 1,
    rating: 4.9
  },
  {
    title: 'Mickey to Donald: Magical Adventure 3',
    description: 'Mickey and Donald team up in this Japanese platformer adventure!',
  image_url: '/covers/mickey-to-donald-3.jpg',
    rom_url: '/roms/Mickey to Donald - Magical Adventure 3 (J) [t2].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1995,
    players: 2,
    rating: 4.2
  },
  {
    title: 'Mighty Morphin Power Rangers: The Movie',
    description: 'Fight as the Power Rangers in this action-packed beat em up based on the movie!',
  image_url: '/covers/power-rangers-movie.jpg',
    rom_url: '/roms/Mighty Morphin Power Rangers - The Movie (U).smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1995,
    players: 2,
    rating: 4.0
  },
  {
    title: 'Mighty Morphin Power Rangers',
    description: 'Morph into action as the Power Rangers and save the world from evil!',
  image_url: '/covers/power-rangers.jpg',
    rom_url: '/roms/Mighty Morphin Power Rangers (U).smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1994,
    players: 2,
    rating: 4.1
  },
  {
    title: 'Mutant Chronicles: Doom Troopers',
    description: 'Run and gun action in a dark sci-fi world. Blast through hordes of mutants!',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Mutant Chronicles - Doom Troopers (U) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1995,
    players: 2,
    rating: 3.9
  },
  {
    title: 'Prehistorik Man',
    description: 'Stone age platforming adventure with colorful graphics and fun levels!',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Prehistorik Man (U) [!].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1995,
    players: 1,
    rating: 4.0
  },
  {
    title: 'Sparkster',
    description: 'Rocket-powered possum action! Fly through levels with exciting gameplay.',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Sparkster (E).smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1994,
    players: 1,
    rating: 4.3
  },
  {
    title: 'Street Fighter Alpha 2',
    description: 'Classic Street Fighter action with Alpha counters and custom combos!',
  image_url: '/covers/street-fighter-alpha-2.jpg',
    rom_url: '/roms/Street Fighter Alpha 2 (U) [!].smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1996,
    players: 2,
    rating: 4.7
  },
  {
    title: 'Super Double Dragon',
    description: 'The Lee brothers return! Beat em up action with new moves and co-op gameplay.',
  image_url: '/covers/super-double-dragon.jpg',
    rom_url: '/roms/Super Double Dragon (U).smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1992,
    players: 2,
    rating: 4.2
  },
  {
    title: 'Super Mario Kart',
    description: 'The racing game that started it all! Race as Mario characters with items and power-ups.',
  image_url: '/covers/super-mario-kart.webp',
    rom_url: '/roms/Super Mario Kart (E) [!].smc',
    platform: 'SNES',
    genre: 'Racing',
    year: 1992,
    players: 2,
    rating: 4.9
  },
  {
    title: 'Super Mario World',
    description: 'The definitive Mario platformer! Explore Dinosaur Land with Yoshi in this timeless classic.',
  image_url: '/covers/super-mario-world.png',
    rom_url: '/roms/Super Mario World (U) [!].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1990,
    players: 1,
    rating: 5.0
  },
  {
    title: 'Super Star Wars: The Empire Strikes Back',
    description: 'Experience the epic Star Wars saga in this action-packed platformer!',
  image_url: '/covers/super-star-wars-empire-strikes-back.jpg',
    rom_url: '/roms/Super Star Wars - The Empire Strikes Back (U) (V1.1) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1993,
    players: 1,
    rating: 4.5
  },
  {
    title: 'Super Street Fighter II',
    description: 'The ultimate version of Street Fighter II with new characters and refined gameplay!',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Super Street Fighter II - The New Challengers (E) [!].smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1994,
    players: 2,
    rating: 4.8
  },
  {
    title: 'TMNT: Tournament Fighters',
    description: 'Teenage Mutant Ninja Turtles fighting game with special moves and combos!',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Teenage Mutant Hero Turtles - Tournament Fighters (E).smc',
    platform: 'SNES',
    genre: 'Fighting',
    year: 1993,
    players: 2,
    rating: 4.4
  },
  {
    title: 'TMNT IV: Turtles in Time',
    description: 'Time-traveling beat em up with the Turtles! Cowabunga through history!',
    image_url: '/aladdinsnes.jpg',
    rom_url: '/roms/Teenage Mutant Ninja Turtles IV - Turtles in Time (U) [!].smc',
    platform: 'SNES',
    genre: 'Action',
    year: 1992,
    players: 2,
    rating: 4.8
  },
  {
    title: 'Top Gear',
    description: 'High-speed racing action! Compete in international races and upgrade your car.',
  image_url: '/covers/top-gear.jpg',
    rom_url: '/roms/Top Gear (U) [!].smc',
    platform: 'SNES',
    genre: 'Racing',
    year: 1992,
    players: 2,
    rating: 4.6
  },
  {
    title: 'Donkey Kong Country',
    description: 'Revolutionary platformer with stunning pre-rendered graphics! Swing through the jungle with DK and Diddy.',
  image_url: '/covers/donkey-kong-country.png',
    rom_url: '/roms/Donkey Kong Country (U) (V1.2) [!].smc',
    platform: 'SNES',
    genre: 'Platform',
    year: 1994,
    players: 2,
    rating: 4.9
  }
];

const AddGames: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [gameCount, setGameCount] = useState<number>(0);

  // Verificar quantos jogos já existem
  const checkGames = async () => {
    try {
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      setGameCount(gamesSnapshot.size);
    } catch (error) {
      console.error('Erro ao contar jogos:', error);
      setGameCount(0);
    }
  };

  // Verificar ao carregar
  React.useEffect(() => {
    checkGames();
  }, []);

  const addGames = async () => {
    setIsAdding(true);
    setStatus('🎮 Iniciando...');
    setProgress(0);

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      try {
        // Verifica se já existe
        const existingQuery = query(
          collection(db, 'games'),
          where('title', '==', game.title)
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          setStatus(`⚠️  ${game.title} já existe, pulando...`);
        } else {
          // Adiciona o jogo ao Firestore
          await addDoc(collection(db, 'games'), {
            ...game,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setStatus(`✅ ${game.title} adicionado!`);
        }

        setProgress(Math.round(((i + 1) / games.length) * 100));
      } catch (error: any) {
        setStatus(`❌ Erro: ${error.message}`);
        console.error(`Erro ao adicionar ${game.title}:`, error);
      }

      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setStatus('🎉 Concluído! Todos os jogos foram adicionados!');
    setIsAdding(false);
    
    // Recarregar contagem
    await checkGames();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 border-2 border-cyan-500 rounded-xl p-6 max-w-md shadow-2xl">
      <h3 className="text-2xl font-bold text-cyan-400 mb-4">Adicionar Jogos</h3>
      
      <div className="mb-4">
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-gray-300 text-sm mb-1">Jogos no banco de dados:</p>
          <p className="text-3xl font-bold text-cyan-400">{gameCount} jogos</p>
        </div>
        
        <p className="text-gray-300 mb-2">
          {games.length} jogos prontos para adicionar
        </p>
        
        {progress > 0 && (
          <div className="mb-4">
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-cyan-400 mt-2 font-bold">{progress}%</p>
          </div>
        )}
        
        {status && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-300 font-mono">{status}</p>
          </div>
        )}
      </div>

      <button
        onClick={addGames}
        disabled={isAdding}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:cursor-not-allowed mb-3"
      >
        {isAdding ? '⏳ Adicionando...' : '🚀 Adicionar Todos os Jogos'}
      </button>

      <button
        onClick={() => window.location.reload()}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
      >
        🔄 Atualizar Página
      </button>
    </div>
  );
};

export default AddGames;
