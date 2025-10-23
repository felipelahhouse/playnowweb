const fs = require('fs');
const path = require('path');

// Helper function to clean filename and extract title
function extractTitle(filename) {
  let title = filename
    .replace(/\.zip$/i, '')
    .replace(/\.smc$/i, '')
    .replace(/\.sfc$/i, '')
    .replace(/\.chd$/i, '')
    // Remove region codes
    .replace(/\s*\([UEJ]\)\s*/g, ' ')
    .replace(/\s*\([A-Z][a-z]*\)\s*/g, ' ')
    .replace(/\s*\[[^\]]*\]\s*/g, ' ')
    // Clean up
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return title;
}

// Helper function to guess genre based on title keywords
function guessGenre(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('pokemon') || titleLower.includes('digimon') || titleLower.includes('monster')) return 'RPG';
  if (titleLower.includes('mario kart') || titleLower.includes('racing') || titleLower.includes('nascar') || titleLower.includes('top gear')) return 'Racing';
  if (titleLower.includes('mario') || titleLower.includes('sonic') || titleLower.includes('crash') || titleLower.includes('donkey kong')) return 'Platform';
  if (titleLower.includes('zelda') || titleLower.includes('dragon quest') || titleLower.includes('final fantasy')) return 'RPG';
  if (titleLower.includes('street fighter') || titleLower.includes('mortal kombat') || titleLower.includes('tekken') || titleLower.includes('fatal fury') || titleLower.includes('king of fighters')) return 'Fighting';
  if (titleLower.includes('soccer') || titleLower.includes('football') || titleLower.includes('basketball') || titleLower.includes('baseball') || titleLower.includes('sports')) return 'Sports';
  if (titleLower.includes('call of duty') || titleLower.includes('doom') || titleLower.includes('medal of honor') || titleLower.includes('shooter')) return 'Shooter';
  if (titleLower.includes('puzzle') || titleLower.includes('tetris') || titleLower.includes('brain')) return 'Puzzle';
  if (titleLower.includes('simpsons') || titleLower.includes('scooby') || titleLower.includes('spongebob') || titleLower.includes('looney tunes')) return 'Adventure';
  if (titleLower.includes('castlevania') || titleLower.includes('metroid') || titleLower.includes('batman')) return 'Action';
  if (titleLower.includes('resident evil') || titleLower.includes('alone in the dark') || titleLower.includes('silent hill')) return 'Horror';
  
  return 'Action';
}

// Helper function to find matching cover
function findCover(romName, platform, coversDir) {
  const baseName = romName
    .replace(/\.zip$/i, '')
    .replace(/\.smc$/i, '')
    .replace(/\.sfc$/i, '')
    .replace(/\.chd$/i, '');
  
  const coverPath = path.join(coversDir, platform);
  
  if (!fs.existsSync(coverPath)) {
    return null;
  }
  
  const covers = fs.readdirSync(coverPath);
  
  // Try exact match first
  const exactMatch = covers.find(cover => {
    const coverBase = cover.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    return coverBase.toLowerCase() === baseName.toLowerCase();
  });
  
  if (exactMatch) {
    return `/covers/${platform}/${exactMatch}`;
  }
  
  // Try partial match
  const partialMatch = covers.find(cover => {
    const coverBase = cover.replace(/\.(jpg|jpeg|png|webp)$/i, '').toLowerCase();
    const romBase = baseName.toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\s*\[[^\]]*\]\s*/g, '')
      .trim();
    
    return coverBase.includes(romBase.slice(0, 20)) || romBase.includes(coverBase.slice(0, 20));
  });
  
  if (partialMatch) {
    return `/covers/${platform}/${partialMatch}`;
  }
  
  return null;
}

// Main function
function generateGamesDatabase() {
  const romsDir = path.join(__dirname, 'public', 'roms');
  const coversDir = path.join(__dirname, 'public', 'covers');
  const games = [];
  let id = 1;

  const platforms = [
    { name: 'gba', ext: '.zip' },
    { name: 'gbc', ext: '.zip' },
    { name: 'genesis', ext: '.zip' },
    { name: 'n64', ext: '.zip' },
    { name: 'snes', ext: ['.smc', '.sfc'] },
    { name: 'ps1', ext: '.chd' }
  ];

  platforms.forEach(({ name: platform, ext }) => {
    const platformDir = path.join(romsDir, platform);
    
    if (!fs.existsSync(platformDir)) {
      console.log(`Skipping ${platform} - directory not found`);
      return;
    }

    const extensions = Array.isArray(ext) ? ext : [ext];
    let files = [];
    
    extensions.forEach(extension => {
      const platformFiles = fs.readdirSync(platformDir)
        .filter(file => file.toLowerCase().endsWith(extension));
      files = files.concat(platformFiles);
    });

    console.log(`Processing ${platform}: ${files.length} games`);

    files.forEach(filename => {
      const title = extractTitle(filename);
      const genre = guessGenre(title);
      const cover = findCover(filename, platform, coversDir);
      const extension = path.extname(filename);
      
      games.push({
        id: `game-${id++}`,
        title,
        platform,
        genre,
        year: 1995, // Default year
        rating: 4.0,
        players: "1-2",
        description: `Jogue ${title} no emulador de ${platform.toUpperCase()}.`,
        romUrl: `/roms/${platform}/${filename}`,
        cover: cover || `/covers/${platform}/default.png`,
        playCount: 0
      });
    });
  });

  const output = {
    games: games.sort((a, b) => a.title.localeCompare(b.title))
  };

  fs.writeFileSync(
    path.join(__dirname, 'public', 'games-database.json'),
    JSON.stringify(output, null, 2)
  );

  console.log(`\n✅ Generated database with ${games.length} games`);
  console.log('\nGames per platform:');
  
  const platformCounts = {};
  games.forEach(game => {
    platformCounts[game.platform] = (platformCounts[game.platform] || 0) + 1;
  });
  
  Object.entries(platformCounts).forEach(([platform, count]) => {
    console.log(`  ${platform.toUpperCase()}: ${count} games`);
  });
}

generateGamesDatabase();
