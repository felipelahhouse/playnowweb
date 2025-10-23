import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, User, Save, Trash2, AlertTriangle, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import { updateProfile, deleteUser } from 'firebase/auth';

interface ProfileSettingsProps {
  onClose: () => void;
}

// 🎨 AVATARES PRÉ-DEFINIDOS - Atualizado para v9.x
const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Emma',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Robot2',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Robot3',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Robot4',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Pixel1',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Pixel2',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Pixel3',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Pixel4',
];

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [username, setUsername] = useState(user?.username || '');
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
      }

      setUploading(true);

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      // 🔧 FIX: O caminho PRECISA incluir userId para passar no storage.rules
      const filePath = `avatars/${user?.id}/${fileName}`;

      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file, {
        cacheControl: '3600',
      });

      const publicUrl = await getDownloadURL(storageRef);
      setAvatarUrl(publicUrl);
      console.log('✅ Avatar uploaded:', publicUrl);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        username,
        avatar_url: avatarUrl,
        last_seen: new Date().toISOString(),
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username,
          photoURL: avatarUrl || undefined,
        });
      }

      alert('Perfil atualizado com sucesso!');
      window.location.reload(); // Recarregar para atualizar o header
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return;

    // Primeira confirmação
    const confirm1 = window.confirm(
      '⚠️ ATENÇÃO: Você está prestes a deletar sua conta permanentemente!\n\n' +
      'Esta ação é IRREVERSÍVEL e irá:\n' +
      '• Deletar todos os seus dados\n' +
      '• Remover seu histórico de jogos\n' +
      '• Apagar suas conquistas\n' +
      '• Excluir suas salas multiplayer\n\n' +
      'Tem certeza que deseja continuar?'
    );

    if (!confirm1) return;

    // Segunda confirmação
    const confirm2 = window.confirm(
      '⛔ ÚLTIMA CHANCE!\n\n' +
      'Você tem ABSOLUTA CERTEZA que deseja deletar sua conta?\n\n' +
      'Esta ação NÃO PODE SER DESFEITA!'
    );

    if (!confirm2) return;

    // Terceira confirmação com digitação
    const typedConfirm = window.prompt(
      '🔴 CONFIRMAÇÃO FINAL\n\n' +
      'Para confirmar a exclusão da conta, digite:\n' +
      'DELETAR MINHA CONTA'
    );

    if (typedConfirm !== 'DELETAR MINHA CONTA') {
      alert('❌ Confirmação incorreta. Exclusão cancelada.');
      return;
    }

    setDeleting(true);

    try {
      console.log('[DELETE ACCOUNT] Iniciando exclusão da conta:', user.id);

      // 1. Deletar documento do Firestore
      await deleteDoc(doc(db, 'users', user.id));
      console.log('[DELETE ACCOUNT] ✅ Documento do Firestore deletado');

      // 2. Deletar usuário do Firebase Authentication
      await deleteUser(auth.currentUser);
      console.log('[DELETE ACCOUNT] ✅ Usuário do Authentication deletado');

      alert('✅ Sua conta foi deletada com sucesso. Você será redirecionado para a página inicial.');
      
      // Fazer logout e redirecionar
      await signOut();
      window.location.href = '/';
    } catch (error: unknown) {
      console.error('[DELETE ACCOUNT] ❌ Erro ao deletar conta:', error);
      
      const firebaseError = error as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/requires-recent-login') {
        alert(
          '❌ Por segurança, você precisa fazer login novamente antes de deletar sua conta.\n\n' +
          'Por favor:\n' +
          '1. Faça logout\n' +
          '2. Faça login novamente\n' +
          '3. Tente deletar a conta novamente'
        );
      } else {
        alert(`❌ Erro ao deletar conta: ${firebaseError?.message || 'Erro desconhecido'}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl sm:rounded-3xl border-2 border-cyan-500/30 p-4 sm:p-6 md:p-8 my-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-cyan-400" />
            Editar Perfil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95 touch-manipulation"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Avatar Section - Mobile Optimized */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-800/50 rounded-xl sm:rounded-2xl">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.warn('❌ Erro ao carregar preview do avatar:', avatarUrl);
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const initial = (username || 'U').charAt(0).toUpperCase();
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white bg-gradient-to-br from-cyan-400 to-purple-500">${initial}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 sm:p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-95 touch-manipulation"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center">
              <p className="text-white font-bold mb-1 text-sm sm:text-base">Foto de Perfil</p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Clique no ícone da câmera para fazer upload
              </p>
              <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
                Formatos: JPG, PNG • Tamanho máx: 2MB
              </p>
            </div>

            {/* Botão para abrir galeria de avatares */}
            <button
              onClick={() => setShowAvatarGallery(!showAvatarGallery)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 font-medium transition-all active:scale-95 touch-manipulation"
            >
              <Image className="w-4 h-4" />
              <span className="text-sm">
                {showAvatarGallery ? 'Fechar Galeria' : 'Escolher Avatar Pré-definido'}
              </span>
            </button>

            {/* Galeria de Avatares Pré-definidos */}
            {showAvatarGallery && (
              <div className="w-full mt-4 p-4 bg-gray-900/50 rounded-xl border border-purple-500/30">
                <h3 className="text-white font-bold mb-3 text-sm">Escolha um avatar:</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {PRESET_AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setAvatarUrl(avatar);
                        setShowAvatarGallery(false);
                      }}
                      className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 touch-manipulation ${
                        avatarUrl === avatar
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                          : 'border-gray-600 hover:border-purple-400'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover bg-gray-800"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.warn('❌ Erro ao carregar avatar:', avatar);
                          // Fallback para avatar com fundo colorido
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const colors = [
                              'from-red-400 to-pink-500',
                              'from-blue-400 to-cyan-500', 
                              'from-green-400 to-emerald-500',
                              'from-purple-400 to-pink-500',
                              'from-orange-400 to-red-500',
                              'from-indigo-400 to-purple-500'
                            ];
                            const color = colors[index % colors.length];
                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl">${index + 1}</div>`;
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Username Field - Mobile Optimized */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
              Nome de Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
              minLength={3}
              maxLength={20}
              className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-gray-800 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 touch-manipulation"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-gray-800/50 text-gray-500 rounded-lg sm:rounded-xl cursor-not-allowed"
            />
            <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
              O email não pode ser alterado
            </p>
          </div>

          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:shadow-xl hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
