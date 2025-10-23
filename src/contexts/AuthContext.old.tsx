import React, { createContext, useContext, useEffect, useState } from 'react';
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
import { doc, getDoc, setDoc, updateDoc, type DocumentData } from 'firebase/firestore';
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const toUserProfile = (firebaseUser: FirebaseUser, overrides: Partial<User> = {}): User => {
  const username = overrides.username
    ?? firebaseUser.displayName
    ?? firebaseUser.email?.split('@')[0]
    ?? 'Player';

  const baseProfile: User & { avatar_url?: string } = {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    username,
    created_at: overrides.created_at ?? new Date().toISOString(),
    is_online: overrides.is_online ?? true,
    last_seen: overrides.last_seen ?? new Date().toISOString(),
  };

  const avatarFromOverrides = overrides.avatar_url;
  const avatarFromFirebase = firebaseUser.photoURL ?? undefined;

  if (avatarFromOverrides) {
    baseProfile.avatar_url = avatarFromOverrides;
  } else if (avatarFromFirebase) {
    baseProfile.avatar_url = avatarFromFirebase;
  }

  return baseProfile;
};

const prepareUserForFirestore = (profile: User): DocumentData => {
  const { avatar_url, ...rest } = profile;
  if (avatar_url) {
    return { ...rest, avatar_url };
  }
  return { ...rest };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const upsertProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data() as User;
      const updated: Partial<User> = {
        is_online: true,
        last_seen: new Date().toISOString(),
      };
      await updateDoc(userRef, updated);
      return { ...data, ...updated };
    }

    const profile = toUserProfile(firebaseUser);
    await setDoc(userRef, prepareUserForFirestore(profile));
    return profile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await upsertProfile(firebaseUser);
          setUser(profile);
        } catch (error) {
          console.error('Failed to sync user profile', error);
          setUser(toUserProfile(firebaseUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔵 Iniciando login...', { email });
      
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login bem-sucedido:', credentials.user.uid);
      
      const profile = await upsertProfile(credentials.user);
      console.log('✅ Profile sincronizado');
      
      setUser(profile);
    } catch (error: any) {
      console.error('❌ ERRO NO LOGIN:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem:', error.message);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao fazer login';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique o email ou crie uma conta.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Tente novamente ou use "Esqueci a senha".';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido. Verifique o formato do email.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Esta conta foi desativada. Entre em contato com o suporte.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      console.log('🔵 Iniciando cadastro...', { email, username });
      
      // Criar conta no Firebase Auth
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Conta criada no Firebase Auth:', credentials.user.uid);
      
      // Atualizar profile com username
      if (auth.currentUser && username) {
        await updateProfile(auth.currentUser, { displayName: username });
        console.log('✅ Profile atualizado com username');
      }

      // Criar perfil no Firestore
      const profile = toUserProfile(credentials.user, { username });
      console.log('🔵 Criando perfil no Firestore...', profile);
      
      await setDoc(
        doc(db, 'users', credentials.user.uid),
        prepareUserForFirestore(profile)
      );
      console.log('✅ Perfil criado no Firestore com sucesso!');
      
      setUser(profile);
      console.log('✅ Cadastro completo! Usuário logado.');
    } catch (error: any) {
      console.error('❌ ERRO NO CADASTRO:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem:', error.message);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao criar conta';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado. Faça login ou use outro email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido. Verifique o formato do email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Erro de permissão no banco de dados. Entre em contato com o suporte.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (user?.id) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          is_online: false,
          last_seen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erro ao atualizar status offline:', error);
      }
    }

    await firebaseSignOut(auth).catch((error) => {
      console.error('Erro ao sair:', error);
    });
    setUser(null);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Forçar seleção de conta e adicionar escopo de perfil
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      provider.addScope('profile');
      provider.addScope('email');
      
      const credentials = await signInWithPopup(auth, provider);
      const profile = await upsertProfile(credentials.user);
      setUser(profile);
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up bloqueado! Por favor, permita pop-ups no seu navegador.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado. Você fechou a janela de login.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domínio não autorizado. O administrador precisa adicionar este domínio no Firebase Console.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Login com Google não está ativado. Entre em contato com o administrador.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw new Error(error?.message ?? 'Erro ao enviar email de recuperação');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
