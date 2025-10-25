import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Converter FirebaseUser para User
  function createUserProfile(firebaseUser: FirebaseUser, customUsername?: string): User {
    const username = customUsername || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player';
    
    const profile: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      username,
      created_at: new Date().toISOString(),
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    // Só adiciona avatar_url se existir
    if (firebaseUser.photoURL) {
      profile.avatar_url = firebaseUser.photoURL;
    }

    return profile;
  }

  // Sincronizar com Firestore
  async function syncUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      // Usuário já existe, apenas atualizar status
      const existingData = snapshot.data() as User;
      await updateDoc(userRef, {
        is_online: true,
        last_seen: new Date().toISOString(),
      });
      return { ...existingData, is_online: true, last_seen: new Date().toISOString() };
    } else {
      // Criar novo perfil
      const newProfile = createUserProfile(firebaseUser);
      const dataToSave: Record<string, any> = { ...newProfile };
      
      // Remover undefined values
      if (!dataToSave.avatar_url) {
        delete dataToSave.avatar_url;
      }
      
      await setDoc(userRef, dataToSave);
      return newProfile;
    }
  }

  // Observar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
        } catch (error) {
          console.error('Erro ao sincronizar perfil:', error);
          // Fallback: usar dados básicos do Firebase
          setUser(createUserProfile(firebaseUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sistema de Heartbeat para presença em tempo real
  useEffect(() => {
    if (!user) {
      // Limpar heartbeat se não houver usuário
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    console.log('[PRESENCE] 🟢 Iniciando heartbeat para:', user.username);

    // Função para atualizar presença com retry para erros do Firestore
    const updatePresence = async (retryCount = 0, maxRetries = 2) => {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          is_online: true,
          last_seen: serverTimestamp(),
        });
        console.log('[PRESENCE] ✅ Heartbeat atualizado');
      } catch (error: any) {
        // ❌ Detectar erro específico do Firestore: "ve":-1 (estado corrupto)
        const errorMsg = error?.message || '';
        const isFirestoreCorrupt = errorMsg.includes('INTERNAL ASSERTION FAILED') || 
                                   errorMsg.includes('ve') ||
                                   errorMsg.includes('Unexpected state');

        if (isFirestoreCorrupt && retryCount < maxRetries) {
          console.warn(`⚠️ [PRESENCE] Estado Firestore corrupto detectado. Retry ${retryCount + 1}...`);
          // ⏳ Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          // 🔄 Tentar novamente
          return updatePresence(retryCount + 1, maxRetries);
        }
        
        // Suprimir erros de Firestore para não poluir o console
        if (!isFirestoreCorrupt) {
          console.error('[PRESENCE] ❌ Erro no heartbeat:', error);
        }
      }
    };

    // Atualizar presença imediatamente
    updatePresence();

    // Configurar heartbeat a cada 30 segundos
    heartbeatIntervalRef.current = setInterval(updatePresence, 30000);

    // Detectar quando usuário fecha navegador/aba
    const handleBeforeUnload = async () => {
      console.log('[PRESENCE] 🔴 Usuário saindo...');
      try {
        // Usar navigator.sendBeacon para garantir que o request seja enviado
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          is_online: false,
          last_seen: serverTimestamp(),
        });
      } catch (error: any) {
        // Suprimir erros de Firestore corrupto para não poluir o console
        const errorMsg = error?.message || '';
        if (!errorMsg.includes('INTERNAL ASSERTION FAILED') && !errorMsg.includes('ve')) {
          console.error('[PRESENCE] ❌ Erro ao marcar offline:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[PRESENCE] 👁️ Tab inativa');
      } else {
        console.log('[PRESENCE] 👁️ Tab ativa - atualizando presença');
        updatePresence();
      }
    };

    // Event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      console.log('[PRESENCE] 🛑 Limpando heartbeat');
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Marcar offline ao desmontar
      if (user?.id) {
        updateDoc(doc(db, 'users', user.id), {
          is_online: false,
          last_seen: serverTimestamp(),
        }).catch(console.error);
      }
    };
  }, [user]);

  // Login com email/senha
  async function signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profile = await syncUserProfile(result.user);
      setUser(profile);
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mensagens de erro amigáveis
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Email ou senha incorretos');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('Usuário não encontrado');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas. Aguarde alguns minutos');
      } else {
        throw new Error('Erro ao fazer login. Tente novamente');
      }
    }
  }

  // Cadastro com email/senha
  async function signUp(email: string, password: string, username: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar displayName
      await updateProfile(result.user, { displayName: username });
      
      // Criar perfil no Firestore
      const profile = createUserProfile(result.user, username);
      const dataToSave: Record<string, any> = { ...profile };
      
      // Remover undefined
      if (!dataToSave.avatar_url) {
        delete dataToSave.avatar_url;
      }
      
      await setDoc(doc(db, 'users', result.user.uid), dataToSave);
      setUser(profile);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este email já está cadastrado');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Senha muito fraca. Use pelo menos 6 caracteres');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido');
      } else {
        throw new Error('Erro ao criar conta. Tente novamente');
      }
    }
  }

  // Login com Google
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const profile = await syncUserProfile(result.user);
      setUser(profile);
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up bloqueado. Permita pop-ups no navegador');
      } else {
        throw new Error('Erro ao fazer login com Google');
      }
    }
  }

  // Reset de senha
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw new Error('Erro ao enviar email de recuperação');
    }
  }

  // Logout
  async function signOut() {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          is_online: false,
          last_seen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
    
    await firebaseSignOut(auth);
    setUser(null);
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
