import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Mock data para Live Streams
const mockStreams = [
  {
    username: 'ProGamer_BR',
    gameName: 'Super Mario World',
    platform: 'SNES',
    viewers: 245,
    isLive: true,
    createdAt: serverTimestamp(),
  },
  {
    username: 'RetroMaster',
    gameName: 'Street Fighter Alpha 2',
    platform: 'SNES',
    viewers: 189,
    isLive: true,
    createdAt: serverTimestamp(),
  },
  {
    username: 'SpeedRunner_JP',
    gameName: 'Donkey Kong Country',
    platform: 'SNES',
    viewers: 312,
    isLive: true,
    createdAt: serverTimestamp(),
  },
];

// Mock data para Multiplayer Lobbies
const mockLobbies = [
  {
    roomName: '🏆 Torneio Street Fighter',
    hostUsername: 'FightKing_BR',
    gameName: 'Street Fighter Alpha 2',
    platform: 'SNES',
    currentPlayers: 4,
    maxPlayers: 8,
    spectators: 23,
    isPublic: true,
    status: 'active',
    createdAt: serverTimestamp(),
  },
  {
    roomName: '🎮 Mario Kart Race',
    hostUsername: 'KartMaster',
    gameName: 'Super Mario Kart',
    platform: 'SNES',
    currentPlayers: 6,
    maxPlayers: 8,
    spectators: 15,
    isPublic: true,
    status: 'active',
    createdAt: serverTimestamp(),
  },
  {
    roomName: '⚔️ Mortal Kombat Arena',
    hostUsername: 'KombatLegend',
    gameName: 'Mortal Kombat II',
    platform: 'SNES',
    currentPlayers: 2,
    maxPlayers: 4,
    spectators: 34,
    isPublic: true,
    status: 'active',
    createdAt: serverTimestamp(),
  },
];

// Função para popular streams
export const populateStreams = async () => {
  try {
    console.log('🔴 Populando Live Streams...');
    const streamsRef = collection(db, 'streams');
    
    for (const stream of mockStreams) {
      await addDoc(streamsRef, stream);
      console.log(`✅ Stream criada: ${stream.username} - ${stream.gameName}`);
    }
    
    console.log('✅ Todas as streams foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular streams:', error);
  }
};

// Função para popular lobbies
export const populateLobbies = async () => {
  try {
    console.log('🎮 Populando Multiplayer Lobbies...');
    const lobbiesRef = collection(db, 'multiplayer_rooms');
    
    for (const lobby of mockLobbies) {
      await addDoc(lobbiesRef, lobby);
      console.log(`✅ Lobby criado: ${lobby.roomName}`);
    }
    
    console.log('✅ Todos os lobbies foram criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular lobbies:', error);
  }
};

// Função para popular tudo de uma vez
export const populateAll = async () => {
  await populateStreams();
  await populateLobbies();
  console.log('🎉 Todos os dados mockados foram criados!');
};

// Para executar no console do navegador:
// import { populateAll } from './utils/populateMockData';
// populateAll();
