import { Platform } from '../types';

export interface PlatformInfo {
  id: Platform;
  name: string;
  fullName: string;
  logo: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  year: number;
  manufacturer: string;
  description: string;
  emulatorCore: string;
  supportedFormats: string[];
  icon: string;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  snes: {
    id: 'snes',
    name: 'SNES',
    fullName: 'Super Nintendo Entertainment System',
    logo: '/platforms/snes-logo.png',
    color: 'text-purple-300',
    backgroundColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    year: 1990,
    manufacturer: 'Nintendo',
    description: 'Console de 16 bits que revolucionou os jogos com Super Mario World, Zelda e muito mais.',
    emulatorCore: 'snes',
    supportedFormats: ['.smc', '.sfc', '.zip'],
    icon: '🎮'
  },

  nes: {
    id: 'nes',
    name: 'NES',
    fullName: 'Nintendo Entertainment System',
    logo: '/platforms/nes-logo.png',
    color: 'text-red-300',
    backgroundColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    year: 1983,
    manufacturer: 'Nintendo',
    description: 'Console de 8 bits que iniciou a era moderna dos videogames com Super Mario Bros.',
    emulatorCore: 'nes',
    supportedFormats: ['.nes', '.zip'],
    icon: '🕹️'
  },
  
  gba: {
    id: 'gba',
    name: 'GBA',
    fullName: 'Game Boy Advance',
    logo: '/platforms/gba-logo.png',
    color: 'text-green-300',
    backgroundColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    year: 2001,
    manufacturer: 'Nintendo',
    description: 'Portátil de 32 bits com gráficos incríveis e biblioteca vasta de jogos.',
    emulatorCore: 'gba',
    supportedFormats: ['.gba', '.zip'],
    icon: '🎯'
  },
  
  gbc: {
    id: 'gbc',
    name: 'GBC',
    fullName: 'Game Boy Color',
    logo: '/platforms/gbc-logo.png',
    color: 'text-yellow-300',
    backgroundColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    year: 1998,
    manufacturer: 'Nintendo',
    description: 'Versão colorida do Game Boy clássico com Pokémon e jogos memoráveis.',
    emulatorCore: 'gb',
    supportedFormats: ['.gbc', '.gb', '.zip'],
    icon: '�'
  },

  gb: {
    id: 'gb',
    name: 'GB',
    fullName: 'Game Boy',
    logo: '/platforms/gb-logo.png',
    color: 'text-gray-300',
    backgroundColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    year: 1989,
    manufacturer: 'Nintendo',
    description: 'O portátil original que trouxe Tetris e Pokémon para milhões de jogadores.',
    emulatorCore: 'gb',
    supportedFormats: ['.gb', '.zip'],
    icon: '📱'
  },

  n64: {
    id: 'n64',
    name: 'N64',
    fullName: 'Nintendo 64',
    logo: '/platforms/n64-logo.png',
    color: 'text-blue-300',
    backgroundColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    year: 1996,
    manufacturer: 'Nintendo',
    description: 'Console 3D revolucionário com Super Mario 64, Zelda Ocarina of Time e mais.',
    emulatorCore: 'n64',
    supportedFormats: ['.n64', '.z64', '.v64', '.zip'],
    icon: '🎮'
  },

  genesis: {
    id: 'genesis',
    name: 'GENESIS',
    fullName: 'Sega Genesis / Mega Drive',
    logo: '/platforms/genesis-logo.png',
    color: 'text-cyan-300',
    backgroundColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    year: 1988,
    manufacturer: 'Sega',
    description: 'Console de 16 bits da Sega com Sonic, Streets of Rage e clássicos inesquecíveis.',
    emulatorCore: 'genesis',
    supportedFormats: ['.md', '.bin', '.gen', '.smd', '.zip'],
    icon: '💎'
  },
  
  ps1: {
    id: 'ps1',
    name: 'PS1',
    fullName: 'Sony PlayStation',
    logo: '/platforms/ps1-logo.png',
    color: 'text-purple-300',
    backgroundColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    year: 1994,
    manufacturer: 'Sony',
    description: 'Console que trouxe os jogos 3D para as massas com Final Fantasy, Crash e mais.',
    emulatorCore: 'psx',
    supportedFormats: ['.bin', '.cue', '.iso', '.chd', '.zip'],
    icon: '💿'
  },

  sms: {
    id: 'sms',
    name: 'SMS',
    fullName: 'Sega Master System',
    logo: '/platforms/sms-logo.png',
    color: 'text-orange-300',
    backgroundColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    year: 1985,
    manufacturer: 'Sega',
    description: 'Console de 8 bits da Sega que competiu com o NES, popular no Brasil.',
    emulatorCore: 'mastersystem',
    supportedFormats: ['.sms', '.zip'],
    icon: '🎪'
  },

  gg: {
    id: 'gg',
    name: 'GG',
    fullName: 'Sega Game Gear',
    logo: '/platforms/gg-logo.png',
    color: 'text-yellow-300',
    backgroundColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    year: 1990,
    manufacturer: 'Sega',
    description: 'Portátil colorido da Sega que competiu com o Game Boy.',
    emulatorCore: 'gamegear',
    supportedFormats: ['.gg', '.zip'],
    icon: '⚡'
  }
};

export function getPlatformInfo(platform: Platform): PlatformInfo {
  return PLATFORMS[platform];
}

export function getAllPlatforms(): PlatformInfo[] {
  return Object.values(PLATFORMS);
}

export function getPlatformsByYear(): PlatformInfo[] {
  return getAllPlatforms().sort((a, b) => a.year - b.year);
}