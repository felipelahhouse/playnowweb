import React, { createContext, useContext, useState } from 'react';

type Language = 'pt' | 'en' | 'es';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Header
    'header.games': 'Jogos',
    'header.multiplayer': 'Multiplayer',
    'header.tournaments': 'Torneios',
    'header.community': 'Comunidade',
    'header.online': 'ONLINE',
    'header.profile': 'Editar Perfil',
    'header.achievements': 'Conquistas',
    'header.friends': 'Amigos',
    'header.settings': 'Configurações',
    'header.signOut': 'Sair',
    'header.signIn': 'Entrar',
    'header.signUp': 'Cadastrar',
    
    // Hero Section
    'hero.title': 'Plataforma Ultimate de Jogos Retro',
    'hero.subtitle': 'Jogue clássicos do SNES online com multiplayer, live streaming e conquistas',
    'hero.playNow': 'Jogar Agora',
    'hero.watchStreams': 'Ver Streams',
    'hero.explore': 'Explorar',
    
    // Games
    'games.title': 'Biblioteca de Jogos',
    'games.subtitle': 'Escolha seu jogo favorito',
    'games.search': 'Buscar jogos...',
    'games.all': 'Todos',
    'games.platform': 'Plataforma',
    'games.action': 'Ação',
    'games.fighting': 'Luta',
    'games.racing': 'Corrida',
    'games.sports': 'Esportes',
    'games.play': 'Jogar',
    'games.stream': 'Fazer Live',
    'games.multiplayer': 'Multiplayer',
    'games.players': 'jogadores',
    'games.rating': 'Avaliação',
    
    // Multiplayer
    'mp.title': 'Salas Multiplayer',
    'mp.subtitle': '// Crie sua sala ou entre em uma existente',
    'mp.createRoom': 'Criar Sala (HOST)',
    'mp.noRooms': 'Nenhuma Sala Ativa',
    'mp.beFirst': 'Seja o primeiro a criar uma sala multiplayer!',
    'mp.public': 'PÚBLICA',
    'mp.private': 'PRIVADA',
    'mp.host': 'HOST',
    'mp.myRoom': 'MINHA SALA',
    'mp.full': 'CHEIA',
    'mp.join': 'Entrar',
    'mp.open': 'Abrir Sala',
    'mp.createTitle': 'Criar Sala Multiplayer',
    'mp.roomName': 'Nome da Sala',
    'mp.selectGame': 'Selecionar Jogo',
    'mp.chooseGame': 'Escolha um jogo...',
    'mp.maxPlayers': 'Máximo de Jogadores',
    'mp.publicRoom': 'Sala Pública (qualquer um pode entrar)',
    'mp.create': 'Criar Sala como HOST',
    'mp.cancel': 'Cancelar',
    'mp.creating': 'Criando sala...',
    'mp.howItWorks': 'Como funciona:',
    'mp.step1': '1️⃣ Você cria a sala e vira o HOST',
    'mp.step2': '2️⃣ A sala aparece na lista para outros jogadores',
    'mp.step3': '3️⃣ Outros jogadores clicam em "Entrar" para jogar com você',
    'mp.step4': '4️⃣ Quando todos estiverem prontos, o jogo começa!',
    
    // Player
    'player.controls': 'Controles padrão',
    'player.status': 'Status',
    'player.emulator': 'Emulador',
    'player.running': 'Rodando',
    'player.error': 'Erro',
    'player.loading': 'Inicializando...',
    'player.romSize': 'Tamanho da ROM',
    'player.format': 'Formato',
    'player.exit': 'Saída',
    'player.restart': 'Reiniciar',
    'player.download': 'Baixar ROM',
    'player.exitGame': 'Sair do jogo',
    'player.arrows': 'Setas',
    'player.direction': 'Direção',
    'player.buttons': 'Botões A · B · Y · X',
    'player.menu': 'Menu do emulador',
    
    // Profile
    'profile.title': 'Meu Perfil',
    'profile.photo': 'Foto de Perfil',
    'profile.clickToChange': 'Clique no ícone da câmera para alterar',
    'profile.formats': 'Formatos: JPG, PNG, GIF · Máximo: 2MB',
    'profile.username': 'Nome de Usuário',
    'profile.email': 'Email',
    'profile.emailReadonly': 'O email não pode ser alterado',
    'profile.save': 'Salvar Alterações',
    'profile.saving': 'Salvando...',
    'profile.cancel': 'Cancelar',
    
    // Common
    'common.close': 'Fechar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sim',
    'common.no': 'Não',
  },
  
  en: {
    // Header
    'header.games': 'Games',
    'header.multiplayer': 'Multiplayer',
    'header.tournaments': 'Tournaments',
    'header.community': 'Community',
    'header.online': 'ONLINE',
    'header.profile': 'Edit Profile',
    'header.achievements': 'Achievements',
    'header.friends': 'Friends',
    'header.settings': 'Settings',
    'header.signOut': 'Sign Out',
    'header.signIn': 'Sign In',
    'header.signUp': 'Sign Up',
    
    // Hero Section
    'hero.title': 'Ultimate Retro Gaming Platform',
    'hero.subtitle': 'Play classic SNES games online with multiplayer, live streaming and achievements',
    'hero.playNow': 'Play Now',
    'hero.watchStreams': 'Watch Streams',
    'hero.explore': 'Explore',
    
    // Games
    'games.title': 'Game Library',
    'games.subtitle': 'Choose your favorite game',
    'games.search': 'Search games...',
    'games.all': 'All',
    'games.platform': 'Platform',
    'games.action': 'Action',
    'games.fighting': 'Fighting',
    'games.racing': 'Racing',
    'games.sports': 'Sports',
    'games.play': 'Play',
    'games.stream': 'Go Live',
    'games.multiplayer': 'Multiplayer',
    'games.players': 'players',
    'games.rating': 'Rating',
    
    // Multiplayer
    'mp.title': 'Multiplayer Rooms',
    'mp.subtitle': '// Create your room or join an existing one',
    'mp.createRoom': 'Create Room (HOST)',
    'mp.noRooms': 'No Active Rooms',
    'mp.beFirst': 'Be the first to create a multiplayer room!',
    'mp.public': 'PUBLIC',
    'mp.private': 'PRIVATE',
    'mp.host': 'HOST',
    'mp.myRoom': 'MY ROOM',
    'mp.full': 'FULL',
    'mp.join': 'Join',
    'mp.open': 'Open Room',
    'mp.createTitle': 'Create Multiplayer Room',
    'mp.roomName': 'Room Name',
    'mp.selectGame': 'Select Game',
    'mp.chooseGame': 'Choose a game...',
    'mp.maxPlayers': 'Max Players',
    'mp.publicRoom': 'Public Room (anyone can join)',
    'mp.create': 'Create Room as HOST',
    'mp.cancel': 'Cancel',
    'mp.creating': 'Creating room...',
    'mp.howItWorks': 'How it works:',
    'mp.step1': '1️⃣ You create the room and become the HOST',
    'mp.step2': '2️⃣ The room appears in the list for other players',
    'mp.step3': '3️⃣ Other players click "Join" to play with you',
    'mp.step4': '4️⃣ When everyone is ready, the game starts!',
    
    // Player
    'player.controls': 'Default Controls',
    'player.status': 'Status',
    'player.emulator': 'Emulator',
    'player.running': 'Running',
    'player.error': 'Error',
    'player.loading': 'Loading...',
    'player.romSize': 'ROM Size',
    'player.format': 'Format',
    'player.exit': 'Exit',
    'player.restart': 'Restart',
    'player.download': 'Download ROM',
    'player.exitGame': 'Exit Game',
    'player.arrows': 'Arrows',
    'player.direction': 'Direction',
    'player.buttons': 'Buttons A · B · Y · X',
    'player.menu': 'Emulator menu',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.photo': 'Profile Photo',
    'profile.clickToChange': 'Click the camera icon to change',
    'profile.formats': 'Formats: JPG, PNG, GIF · Max: 2MB',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.emailReadonly': 'Email cannot be changed',
    'profile.save': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.cancel': 'Cancel',
    
    // Common
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
  },
  
  es: {
    // Header
    'header.games': 'Juegos',
    'header.multiplayer': 'Multijugador',
    'header.tournaments': 'Torneos',
    'header.community': 'Comunidad',
    'header.online': 'EN LÍNEA',
    'header.profile': 'Editar Perfil',
    'header.achievements': 'Logros',
    'header.friends': 'Amigos',
    'header.settings': 'Configuración',
    'header.signOut': 'Cerrar Sesión',
    'header.signIn': 'Iniciar Sesión',
    'header.signUp': 'Registrarse',
    
    // Hero Section
    'hero.title': 'Plataforma Ultimate de Juegos Retro',
    'hero.subtitle': 'Juega clásicos de SNES en línea con multijugador, streaming en vivo y logros',
    'hero.playNow': 'Jugar Ahora',
    'hero.watchStreams': 'Ver Streams',
    'hero.explore': 'Explorar',
    
    // Games
    'games.title': 'Biblioteca de Juegos',
    'games.subtitle': 'Elige tu juego favorito',
    'games.search': 'Buscar juegos...',
    'games.all': 'Todos',
    'games.platform': 'Plataforma',
    'games.action': 'Acción',
    'games.fighting': 'Lucha',
    'games.racing': 'Carreras',
    'games.sports': 'Deportes',
    'games.play': 'Jugar',
    'games.stream': 'Transmitir',
    'games.multiplayer': 'Multijugador',
    'games.players': 'jugadores',
    'games.rating': 'Calificación',
    
    // Multiplayer
    'mp.title': 'Salas Multijugador',
    'mp.subtitle': '// Crea tu sala o únete a una existente',
    'mp.createRoom': 'Crear Sala (HOST)',
    'mp.noRooms': 'No Hay Salas Activas',
    'mp.beFirst': '¡Sé el primero en crear una sala multijugador!',
    'mp.public': 'PÚBLICA',
    'mp.private': 'PRIVADA',
    'mp.host': 'HOST',
    'mp.myRoom': 'MI SALA',
    'mp.full': 'LLENA',
    'mp.join': 'Unirse',
    'mp.open': 'Abrir Sala',
    'mp.createTitle': 'Crear Sala Multijugador',
    'mp.roomName': 'Nombre de la Sala',
    'mp.selectGame': 'Seleccionar Juego',
    'mp.chooseGame': 'Elige un juego...',
    'mp.maxPlayers': 'Máximo de Jugadores',
    'mp.publicRoom': 'Sala Pública (cualquiera puede unirse)',
    'mp.create': 'Crear Sala como HOST',
    'mp.cancel': 'Cancelar',
    'mp.creating': 'Creando sala...',
    'mp.howItWorks': 'Cómo funciona:',
    'mp.step1': '1️⃣ Creas la sala y te conviertes en el HOST',
    'mp.step2': '2️⃣ La sala aparece en la lista para otros jugadores',
    'mp.step3': '3️⃣ Otros jugadores hacen clic en "Unirse" para jugar contigo',
    'mp.step4': '4️⃣ ¡Cuando todos estén listos, el juego comienza!',
    
    // Player
    'player.controls': 'Controles Predeterminados',
    'player.status': 'Estado',
    'player.emulator': 'Emulador',
    'player.running': 'Ejecutando',
    'player.error': 'Error',
    'player.loading': 'Cargando...',
    'player.romSize': 'Tamaño de ROM',
    'player.format': 'Formato',
    'player.exit': 'Salida',
    'player.restart': 'Reiniciar',
    'player.download': 'Descargar ROM',
    'player.exitGame': 'Salir del juego',
    'player.arrows': 'Flechas',
    'player.direction': 'Dirección',
    'player.buttons': 'Botones A · B · Y · X',
    'player.menu': 'Menú del emulador',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.photo': 'Foto de Perfil',
    'profile.clickToChange': 'Haz clic en el ícono de la cámara para cambiar',
    'profile.formats': 'Formatos: JPG, PNG, GIF · Máximo: 2MB',
    'profile.username': 'Nombre de Usuario',
    'profile.email': 'Correo Electrónico',
    'profile.emailReadonly': 'El correo electrónico no se puede cambiar',
    'profile.save': 'Guardar Cambios',
    'profile.saving': 'Guardando...',
    'profile.cancel': 'Cancelar',
    
    // Common
    'common.close': 'Cerrar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sí',
    'common.no': 'No',
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const langTranslations = translations[language] as Record<string, string>;
    return langTranslations[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};
