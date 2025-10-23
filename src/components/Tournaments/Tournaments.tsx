// 🏆 TOURNAMENTS - Sistema de Torneios
// Criação, listagem e participação em torneios

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Star, Plus, Gamepad2, Crown } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getUserPermissions } from '../../lib/auth';

interface Tournament {
  id: string;
  name: string;
  game: string;
  platform: string;
  prize: string;
  maxPlayers: number;
  currentPlayers: number;
  startDate: Date;
  status: 'upcoming' | 'ongoing' | 'finished';
  createdBy: string;
  rules: string;
}

const Tournaments: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const permissions = user ? getUserPermissions(user) : null;
  const canCreateTournaments = permissions?.canCreateTournaments || false;

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tournaments'),
        orderBy('startDate', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const tournamentsData: Tournament[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        tournamentsData.push({
          id: doc.id,
          name: data.name,
          game: data.game,
          platform: data.platform,
          prize: data.prize,
          maxPlayers: data.maxPlayers,
          currentPlayers: data.currentPlayers || 0,
          startDate: data.startDate?.toDate() || new Date(),
          status: data.status,
          createdBy: data.createdBy,
          rules: data.rules
        });
      });

      setTournaments(tournamentsData);
    } catch (error) {
      console.error('[TOURNAMENTS] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, 'tournaments'), {
        name: formData.get('name'),
        game: formData.get('game'),
        platform: formData.get('platform'),
        prize: formData.get('prize'),
        maxPlayers: parseInt(formData.get('maxPlayers') as string),
        currentPlayers: 0,
        startDate: Timestamp.fromDate(new Date(formData.get('startDate') as string)),
        status: 'upcoming',
        createdBy: user.id,
        rules: formData.get('rules'),
        createdAt: Timestamp.now()
      });

      alert('✅ Torneio criado com sucesso!');
      setShowCreateModal(false);
      loadTournaments();
    } catch (error) {
      console.error('[TOURNAMENTS] Erro ao criar:', error);
      alert('❌ Erro ao criar torneio');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              TORNEIOS
            </h1>
            <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-gray-400 text-xl">
            Compete com os melhores jogadores e ganhe prêmios incríveis!
          </p>
        </div>

        {/* Create Tournament Button (Admin/Moderators Only) */}
        {canCreateTournaments && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Criar Novo Torneio
            </button>
          </div>
        )}

        {/* Tournaments Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Carregando torneios...</p>
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="group bg-gradient-to-br from-gray-900 to-black rounded-2xl border-2 border-yellow-500/30 hover:border-yellow-400/60 transition-all duration-300 overflow-hidden hover:scale-105"
              >
                {/* Status Badge */}
                <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                      tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {tournament.status === 'ongoing' ? '🔴 AO VIVO' :
                       tournament.status === 'upcoming' ? '📅 EM BREVE' :
                       '✅ FINALIZADO'}
                    </span>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-black text-white mb-4 group-hover:text-yellow-400 transition-colors">
                    {tournament.name}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">{tournament.game}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">
                        {tournament.currentPlayers}/{tournament.maxPlayers} Jogadores
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">
                        {tournament.startDate.toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-400">
                        {tournament.prize}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={tournament.status !== 'upcoming'}
                  >
                    {tournament.status === 'upcoming' ? '🎮 Participar' :
                     tournament.status === 'ongoing' ? '👁️ Assistir' :
                     '📊 Resultados'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Trophy className="w-24 h-24 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              Nenhum torneio disponível
            </h3>
            <p className="text-gray-500">
              {canCreateTournaments ? 'Seja o primeiro a criar um torneio!' : 'Novos torneios em breve!'}
            </p>
          </div>
        )}

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border-2 border-yellow-500/30 p-8 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-yellow-400 flex items-center gap-2">
                  <Crown className="w-8 h-8" />
                  Criar Novo Torneio
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Nome do Torneio</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Ex: Campeonato Mundial SNES"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Jogo</label>
                    <input
                      type="text"
                      name="game"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                      placeholder="Super Mario Kart"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Plataforma</label>
                    <select
                      name="platform"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="snes">SNES</option>
                      <option value="megadrive">Mega Drive</option>
                      <option value="gba">GBA</option>
                      <option value="n64">N64</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Máx. Jogadores</label>
                    <input
                      type="number"
                      name="maxPlayers"
                      required
                      min="2"
                      max="64"
                      defaultValue="8"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Início</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Prêmio</label>
                  <input
                    type="text"
                    name="prize"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Ex: VIP 1 mês + Badge Campeão"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Regras</label>
                  <textarea
                    name="rules"
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none resize-none"
                    placeholder="Descreva as regras do torneio..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
                >
                  🏆 Criar Torneio
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
