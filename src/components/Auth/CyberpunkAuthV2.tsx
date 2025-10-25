import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Gamepad2, Zap, Shield, Sparkles, Trophy, Users, Radio } from 'lucide-react';

const CyberpunkAuthV2: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetOption, setShowResetOption] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorDetails('');
    setSuccess('');
    setShowResetOption(false);
    setResetSending(false);

    try {
      if (mode === 'reset') {
        console.log('🔵 Enviando email de reset para:', email);
        await resetPassword(email);
        setSuccess('✅ Email de recuperação enviado! Verifique sua caixa de entrada (e spam).');
        setTimeout(() => {
          setMode('signin');
          setSuccess('');
        }, 3000);
        return;
      }

      if (mode === 'signin') {
        console.log('🔵 Tentando fazer login...');
        await signIn(email, password);
        console.log('✅ Login realizado com sucesso!');
      } else {
        console.log('🔵 Tentando criar conta...');
        if (!username.trim()) {
          throw new Error('Username é obrigatório');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        await signUp(email, password, username);
        console.log('✅ Conta criada com sucesso!');
      }
    } catch (err: any) {
      console.error('❌ Erro na autenticação:', err);
      
      let errorMessage = '';
      let errorDetail = '';
      
      if (err.message.includes('invalid-credential') || err.message.includes('Email ou senha incorretos')) {
        errorMessage = '❌ Email ou senha incorretos';
        errorDetail = '💡 Verifique:\n• O email está correto?\n• A senha está correta?\n• Caps Lock está desativado?\n• Esqueceu a senha? Clique em "Forgot password?"';
        setShowResetOption(true);
      } else if (err.message.includes('Usuário não encontrado') || err.message.includes('user-not-found')) {
        errorMessage = '❌ Usuário não encontrado';
        errorDetail = '💡 Verifique se o email está correto ou crie uma nova conta.';
        if (mode === 'signin') {
          setTimeout(() => {
            setErrorDetails(errorDetail + '\n\n🔄 Quer criar uma conta? Clique em "CREATE PLAYER"');
          }, 1000);
        }
      } else if (err.message.includes('Senha incorreta') || err.message.includes('wrong-password')) {
        errorMessage = '❌ Senha incorreta';
        errorDetail = '💡 Dicas:\n• Verifique se o Caps Lock está desativado\n• A senha tem pelo menos 6 caracteres?\n• Esqueceu a senha? Clique em "Forgot password?"';
        setShowResetOption(true);
      } else if (err.message.includes('email já está cadastrado') || err.message.includes('email-already-in-use')) {
        errorMessage = '❌ Este email já está cadastrado';
        errorDetail = '💡 Opções:\n• Faça login ao invés de criar conta\n• Esqueceu a senha? Use "Forgot password?"\n• Use outro email para criar nova conta';
        if (mode === 'signup') {
          setTimeout(() => {
            setMode('signin');
          }, 3000);
        }
        setShowResetOption(true);
      } else if (err.message.includes('Email inválido') || err.message.includes('invalid-email')) {
        errorMessage = '❌ Email inválido';
        errorDetail = '💡 Use um email válido:\n• Exemplo: usuario@gmail.com\n• Verifique se não há espaços\n• Verifique se tem @ e .com';
      } else if (err.message.includes('Senha muito fraca') || err.message.includes('weak-password')) {
        errorMessage = '❌ Senha muito fraca';
        errorDetail = '💡 Crie uma senha mais forte:\n• Mínimo 6 caracteres\n• Use letras e números\n• Exemplo: senha123';
      } else if (err.message.includes('muitas tentativas') || err.message.includes('too-many-requests')) {
        errorMessage = '❌ Muitas tentativas';
        errorDetail = '💡 Aguarde alguns minutos e tente novamente.\nPor segurança, bloqueamos temporariamente.';
      } else if (err.message.includes('Erro de conexão') || err.message.includes('network')) {
        errorMessage = '❌ Erro de conexão';
        errorDetail = '💡 Verifique:\n• Sua conexão com a internet\n• Se o site está carregando\n• Tente recarregar a página (F5)';
      } else if (err.message.includes('operation-not-allowed')) {
        errorMessage = '❌ Login não está ativado';
        errorDetail = '⚠️ O administrador precisa ativar o Email/Password no Firebase Console.\n\n🔗 Instruções em: ATIVAR_EMAIL_PASSWORD_AGORA.md';
      } else {
        errorMessage = '❌ ' + (err.message || 'Erro desconhecido');
        errorDetail = '💡 Tente:\n• Recarregar a página (F5)\n• Usar outro navegador\n• Verificar sua conexão';
      }
      
      setError(errorMessage);
      setErrorDetails(errorDetail);
      setLoading(false);
    } finally {
      if (mode !== 'reset') {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setErrorDetails('');
    setSuccess('');
    setShowResetOption(false);
    setResetSending(false);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      
      let errorMessage = '';
      let errorDetail = '';
      
      if (err.message && err.message.includes('popup-blocked')) {
        errorMessage = '❌ Pop-up bloqueado';
        errorDetail = '💡 Permita pop-ups:\n• Clique no ícone 🔒 na barra de endereços\n• Selecione "Sempre permitir pop-ups"\n• Tente novamente';
      } else if (err.message && err.message.includes('popup-closed')) {
        errorMessage = '❌ Login cancelado';
        errorDetail = '💡 Você fechou a janela de login.\nTente novamente e selecione sua conta Google.';
      } else if (err.message && err.message.includes('unauthorized-domain')) {
        errorMessage = '❌ Domínio não autorizado';
        errorDetail = '⚠️ O administrador precisa:\n• Ir em Firebase Console\n• Authentication > Settings\n• Adicionar este domínio na lista\n\n🔗 Veja: ATIVAR_EMAIL_PASSWORD_AGORA.md';
      } else if (err.message && err.message.includes('operation-not-allowed')) {
        errorMessage = '❌ Login com Google não está ativado';
        errorDetail = '⚠️ O administrador precisa ativar:\n• Firebase Console\n• Authentication > Sign-in method\n• Ativar Google\n\n🔗 Veja: ATIVAR_EMAIL_PASSWORD_AGORA.md';
      } else {
        errorMessage = '❌ Falha no login com Google';
        errorDetail = '💡 Tente:\n• Recarregar a página (F5)\n• Usar Email/Password ao invés\n• Verificar sua conexão';
      }
      
      setError(errorMessage);
      setErrorDetails(errorDetail);
      setLoading(false);
    }
  };

  const handleQuickReset = async () => {
    if (!email) {
      setError('❌ Informe o email para redefinir a senha');
      setErrorDetails('💡 Digite o email da conta acima e tente novamente.');
      return;
    }

    try {
      setResetSending(true);
      await resetPassword(email);
      setSuccess('✅ Email de recuperação enviado! Verifique sua caixa de entrada (e spam).');
      setError('');
      setErrorDetails('');
      setShowResetOption(false);
      setMode('signin');
    } catch (resetError: any) {
      console.error('Erro ao enviar reset rápido:', resetError);
      setError('❌ Não foi possível enviar o email de redefinição');
      setErrorDetails('💡 Verifique se o email está correto e tente novamente. Se o problema persistir, contate o suporte.');
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background - Todos os dispositivos - Otimizado */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(3px) brightness(0.8)',
          zIndex: 0,
          transform: 'translateZ(0)',
          willChange: 'auto'
        }}
        onError={() => {
          // Video background decorativo - falha não crítica
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>

      {/* Overlay gradiente - Mais suave para ver melhor o vídeo */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(88,28,135,0.1), rgba(0,0,0,0.4))',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      
      {/* Video Background - Apenas Desktop (>768px) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="hidden md:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(2px) brightness(0.7)',
          zIndex: 0
        }}
        onError={(e) => {
          console.error('❌ Erro ao carregar vídeo:', e);
          const video = e.currentTarget;
          console.warn('❌ Caminho tentado:', video.currentSrc || '/videoplayback.mp4');
          console.log('� Tentando caminho alternativo...');
          
          // Tenta caminho sem barra inicial
          if (video.src.includes('/videoplayback.mp4')) {
            video.src = 'videoplayback.mp4';
          }
        }}
        onLoadedData={(e) => {
          console.log('✅ Vídeo carregado com sucesso!');
          console.log('📹 Video src:', e.currentTarget.currentSrc);
          console.log('📏 Dimensões:', e.currentTarget.videoWidth, 'x', e.currentTarget.videoHeight);
        }}
        onCanPlay={() => console.log('✅ Vídeo pronto para reproduzir!')}
        onPlay={() => console.log('▶️ Vídeo está reproduzindo!')}
      >
        <source src="/bg.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>

      {/* Gradiente radial central */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
          zIndex: 2,
          opacity: 0.2,
          pointerEvents: 'none'
        }}
      />

      {/* Raios de luz diagonais */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`ray-${i}`}
          className="absolute opacity-10"
          style={{
            top: '-50%',
            left: `${i * 20}%`,
            width: '2px',
            height: '200%',
            background: 'linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.4) 50%, transparent)',
            transform: `rotate(${10 + i * 5}deg)`,
            animation: `shimmer ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Partículas flutuantes */}
      {[...Array(30)].map((_, i) => {
        const colors = ['#06b6d4', '#a855f7', '#ec4899', '#22d3ee', '#8b5cf6'];
        const sizes = [2, 3, 4, 6];
        const color = colors[i % colors.length];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        return (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              animation: `float ${8 + Math.random() * 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`,
              opacity: 0.4 + Math.random() * 0.4,
              boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color}`,
              zIndex: 4,
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* Ondas de fundo */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)
          `,
          animation: 'wave 20s ease-in-out infinite',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Círculos de luz nebulosos */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`nebula-${i}`}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 2) * 40}%`,
            width: `${200 + i * 50}px`,
            height: `${200 + i * 50}px`,
            background: i % 3 === 0 
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)'
              : i % 3 === 1
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
            animation: `nebula ${15 + i * 3}s ease-in-out infinite`,
            animationDelay: `${i * 2}s`,
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Content Container - Otimizado para Mobile */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 flex items-center justify-center lg:justify-between gap-4 sm:gap-8 min-h-screen">
        
        {/* Left Side - Arcade Cabinet 3D - Apenas Desktop */}
        <div className="hidden lg:flex flex-col items-center space-y-8 xl:space-y-12 flex-1">
          {/* Arcade Machine 3D */}
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* Cabinet Top */}
            <div className="relative w-96 h-24 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-3xl border-4 border-cyan-400/30 mb-2" style={{
              transform: 'rotateX(10deg)',
              boxShadow: '0 -10px 40px rgba(6, 182, 212, 0.2)'
            }}>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-t-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 font-black text-2xl tracking-widest">
                ARCADE
              </div>
            </div>

            {/* Main Cabinet Body */}
            <div className="relative w-96 h-[500px] bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-2xl border-4 border-cyan-400/50 shadow-2xl overflow-hidden" style={{
              boxShadow: '0 20px 60px rgba(6, 182, 212, 0.3), inset 0 0 60px rgba(6, 182, 212, 0.1)'
            }}>
              {/* Screen Area */}
              <div className="absolute top-8 left-8 right-8 h-64 bg-black rounded-xl border-4 border-gray-700 overflow-hidden" style={{
                boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)'
              }}>
                {/* CRT Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-pink-500/30 blur-2xl" style={{
                  animation: 'pulse 4s ease-in-out infinite'
                }} />
                
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, transparent 1px, transparent 2px, rgba(0, 0, 0, 0.15) 3px)',
                  animation: 'scan 8s linear infinite'
                }} />
                
                {/* Logo Display */}
                <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
                  {/* Gamepad with Rotation */}
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-60 animate-pulse" />
                    <Gamepad2 className="w-28 h-28 text-cyan-400 relative z-10" style={{
                      filter: 'drop-shadow(0 0 30px rgba(34, 211, 238, 1))',
                      animation: 'rotate3d 6s ease-in-out infinite'
                    }} />
                  </div>
                  
                  {/* Logo Text */}
                  <h1 className="text-6xl font-black mb-2 relative" style={{
                    background: 'linear-gradient(90deg, #06b6d4, #a855f7, #ec4899, #06b6d4)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gradient 3s linear infinite',
                    textShadow: '0 0 40px rgba(34, 211, 238, 0.6)',
                    filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))'
                  }}>
                    PLAYNOW
                  </h1>
                  
                  {/* Pixel Art Border */}
                  <div className="flex space-x-1 mb-2">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-cyan-400" style={{
                        animation: `pixelPulse ${1 + i * 0.1}s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`
                      }} />
                    ))}
                  </div>
                  
                  <p className="text-purple-400 font-mono text-lg tracking-widest font-bold">EMULATOR</p>
                </div>
              </div>
              
              {/* Control Panel */}
              <div className="absolute bottom-8 left-8 right-8 h-40 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border-2 border-cyan-400/30 p-6" style={{
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Joystick */}
                <div className="absolute left-12 top-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-4 border-red-900" style={{
                      animation: 'joystick 3s ease-in-out infinite',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.6), inset 0 -2px 8px rgba(0, 0, 0, 0.4)'
                    }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-400 rounded-full" />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute right-12 top-6 flex space-x-3">
                  {[
                    { color: 'from-red-500 to-red-700', shadow: 'rgba(239, 68, 68, 0.8)', delay: '0s' },
                    { color: 'from-yellow-500 to-yellow-700', shadow: 'rgba(234, 179, 8, 0.8)', delay: '0.2s' },
                    { color: 'from-blue-500 to-blue-700', shadow: 'rgba(59, 130, 246, 0.8)', delay: '0.4s' },
                    { color: 'from-green-500 to-green-700', shadow: 'rgba(34, 197, 94, 0.8)', delay: '0.6s' }
                  ].map((btn, i) => (
                    <div key={i} className={`w-14 h-14 rounded-full bg-gradient-to-br ${btn.color} border-4 border-gray-900`} style={{
                      animation: 'buttonPress 2s ease-in-out infinite',
                      animationDelay: btn.delay,
                      boxShadow: `0 4px 20px ${btn.shadow}, inset 0 -3px 10px rgba(0, 0, 0, 0.4)`
                    }} />
                  ))}
                </div>
                
                {/* Coin Slot */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                  <div className="w-16 h-8 bg-black border-2 border-yellow-500/50 rounded flex items-center justify-center">
                    <span className="text-yellow-500 text-xs font-mono">INSERT COIN</span>
                  </div>
                </div>
              </div>
              
              {/* Side Glow */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50 blur-sm" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-50 blur-sm" />
            </div>
            
            {/* Base/Pedestal */}
            <div className="relative w-80 h-16 bg-gradient-to-b from-gray-900 to-black rounded-b-2xl border-4 border-t-0 border-cyan-400/20 mt-2 mx-auto" style={{
              transform: 'rotateX(-10deg)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
            }}>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-b-2xl" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex space-x-4 mt-16">
            <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl hover:bg-black/60 transition-all">
              <Gamepad2 className="w-8 h-8 text-cyan-400 mb-2 mx-auto" style={{
                animation: 'float 2s ease-in-out infinite'
              }} />
              <p className="text-cyan-400 text-2xl font-black">500+</p>
              <p className="text-gray-400 text-xs font-mono">GAMES</p>
            </div>
            <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl hover:bg-black/60 transition-all">
              <Users className="w-8 h-8 text-purple-400 mb-2 mx-auto" style={{
                animation: 'float 2s ease-in-out infinite 0.5s'
              }} />
              <p className="text-purple-400 text-2xl font-black">50K+</p>
              <p className="text-gray-400 text-xs font-mono">PLAYERS</p>
            </div>
            <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-pink-500/30 rounded-xl hover:bg-black/60 transition-all">
              <Trophy className="w-8 h-8 text-pink-400 mb-2 mx-auto" style={{
                animation: 'float 2s ease-in-out infinite 1s'
              }} />
              <p className="text-pink-400 text-2xl font-black">∞</p>
              <p className="text-gray-400 text-xs font-mono">FUN</p>
            </div>
          </div>

          {/* Feature Badges - Melhoradas com Multiplayer */}
          <div className="flex flex-wrap justify-center gap-3 max-w-sm">
            <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center space-x-2 hover:scale-105 hover:bg-cyan-500/20 transition-all cursor-pointer">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-semibold">Instant Play</span>
            </div>
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center space-x-2 hover:scale-105 hover:bg-purple-500/20 transition-all cursor-pointer">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Save States</span>
            </div>
            <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-full flex items-center space-x-2 hover:scale-105 hover:bg-pink-500/20 transition-all cursor-pointer">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-pink-300 text-sm font-semibold">HD Graphics</span>
            </div>
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full flex items-center space-x-2 hover:scale-105 hover:bg-green-500/20 transition-all cursor-pointer">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-semibold">Online Multiplayer</span>
            </div>
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center space-x-2 hover:scale-105 hover:bg-yellow-500/20 transition-all cursor-pointer">
              <Radio className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-semibold">Live Streaming</span>
            </div>
          </div>
        </div>

        {/* Right Side - Modern Glass Login Card - Otimizado Mobile */}
        <div className="w-full lg:w-auto flex-1 max-w-lg">
          <div className="relative">
            {/* Glow Background */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl" style={{
              animation: 'pulse 6s ease-in-out infinite'
            }} />
            
            {/* Glass Morphism Card */}
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden" style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}>
              {/* Top Glow Bar */}
              <div className="h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" style={{
                animation: 'gradient 3s linear infinite',
                backgroundSize: '200% auto'
              }} />
              
              {/* Header Section - Layout Simplificado */}
              <div className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  {/* Icon with Glow - Menor no Mobile */}
                  <div className="inline-flex items-center justify-center w-16 sm:w-24 h-16 sm:h-24 rounded-xl sm:rounded-2xl mb-3 sm:mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl opacity-20" />
                    {mode === 'signin' ? (
                      <Shield className="w-8 sm:w-12 h-8 sm:h-12 text-cyan-400 relative z-10" style={{
                        filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))',
                        animation: 'float 3s ease-in-out infinite'
                      }} />
                    ) : mode === 'reset' ? (
                      <Mail className="w-8 sm:w-12 h-8 sm:h-12 text-purple-400 relative z-10 animate-pulse" style={{
                        filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))'
                      }} />
                    ) : (
                      <Sparkles className="w-8 sm:w-12 h-8 sm:h-12 text-pink-400 relative z-10 animate-pulse" style={{
                        filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))'
                      }} />
                    )}
                  </div>
                  
                  {/* Title removido a pedido: manter apenas o ícone e o toggle abaixo */}
                  <div className="mb-4" />
                </div>

                {/* Mode Toggle - Sem sombra excessiva */}
                {mode !== 'reset' && (
                  <div className="relative mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
                    <div
                      className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-out"
                      style={{
                        background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
                        transform: mode === 'signin' ? 'translateX(calc(100% + 8px))' : 'translateX(0)'
                      }}
                    />
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                          mode === 'signup' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        CREATE ACCOUNT
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                          mode === 'signin' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        SIGN IN
                      </button>
                    </div>
                  </div>
                )}

                {/* Form - Compacto Mobile */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-xs font-black">!</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-red-300 text-xs sm:text-sm font-bold mb-1 sm:mb-2">{error}</p>
                          {errorDetails && (
                            <div className="bg-red-950/50 rounded-md sm:rounded-lg p-2 sm:p-3 mt-1 sm:mt-2">
                              <p className="text-red-200/80 text-xs whitespace-pre-line leading-relaxed">
                                {errorDetails}
                              </p>
                            </div>
                          )}
                          {showResetOption && mode !== 'reset' && (
                            <div className="mt-2 sm:mt-3 space-y-2">
                              <button
                                type="button"
                                onClick={handleQuickReset}
                                disabled={resetSending}
                                className="w-full py-2 px-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-md sm:rounded-lg text-red-100 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {resetSending ? 'Enviando link…' : 'Enviar link de redefinição'}
                              </button>
                              <p className="text-red-200/60 text-[11px]">
                                O link será enviado para <span className="font-semibold">{email || 'o email digitado acima'}</span>.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-black">✓</span>
                        </div>
                        <p className="text-green-300 text-sm font-semibold flex-1">{success}</p>
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-1 sm:mb-2 flex items-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-cyan-400" />
                        Username
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg sm:rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose your gaming name"
                          required
                          className="relative w-full px-3 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all font-medium"
                          style={{
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                        <User className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-1 sm:mb-2 flex items-center">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        className="relative w-full px-3 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all font-medium"
                        style={{
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    </div>
                  </div>

                  {mode !== 'reset' && (
                    <div>
                      <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-1 sm:mb-2 flex items-center">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-pink-400" />
                        Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secure password"
                          required
                          className="relative w-full px-3 sm:px-5 py-3 sm:py-4 pr-10 sm:pr-12 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:border-pink-400/50 focus:bg-white/10 transition-all font-medium"
                          style={{
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-400 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'signin' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-colors hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {mode === 'reset' && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="text-sm text-gray-400 hover:text-gray-200 font-semibold transition-colors hover:underline"
                      >
                        ← Back to login
                      </button>
                    </div>
                  )}

                  {/* Modern Submit Button - Compacto Mobile */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-3 sm:py-5 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    style={{
                      background: 'linear-gradient(90deg, #06b6d4, #a855f7, #ec4899)',
                      backgroundSize: '200% auto',
                      animation: 'gradient 3s linear infinite',
                      boxShadow: '0 10px 40px -10px rgba(6, 182, 212, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>LOADING...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>
                            {mode === 'signin' ? 'SIGN IN NOW' : mode === 'reset' ? 'SEND RESET LINK' : 'CREATE ACCOUNT'}
                          </span>
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </span>
                  </button>

                  {mode !== 'reset' && (
                    <>
                      <div className="relative my-4 sm:my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 sm:px-4 bg-black text-gray-600 text-xs sm:text-sm font-bold">OR CONTINUE WITH</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="relative w-full py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 group"
                      >
                        <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Continue with Google</span>
                          <span className="sm:hidden">Google Sign In</span>
                        </span>
                      </button>
                    </>
                  )}
                </form>

                {/* Footer - Compacto Mobile */}
                <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-white/5 text-center">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <p className="text-xs text-gray-400 font-medium">
                      <span className="hidden sm:inline">Secured with 256-bit encryption</span>
                      <span className="sm:hidden">256-bit Secured</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    © 2024 PlayNowEmu <span className="hidden sm:inline">• Retro Gaming Platform</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% {
            opacity: 0.05;
            transform: translateY(0) rotate(10deg);
          }
          50% {
            opacity: 0.15;
            transform: translateY(-20px) rotate(12deg);
          }
        }

        @keyframes rotate3d {
          0%, 100% {
            transform: rotateY(0deg) rotateZ(0deg);
          }
          50% {
            transform: rotateY(180deg) rotateZ(10deg);
          }
        }

        @keyframes pixelPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes joystick {
          0%, 100% {
            transform: rotate(0deg) translateX(0);
          }
          25% {
            transform: rotate(-15deg) translateX(-5px);
          }
          50% {
            transform: rotate(0deg) translateX(0);
          }
          75% {
            transform: rotate(15deg) translateX(5px);
          }
        }

        @keyframes buttonPress {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(2px) scale(0.95);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.05;
          }
          33% {
            transform: scale(1.1) rotate(5deg);
            opacity: 0.08;
          }
          66% {
            transform: scale(0.95) rotate(-5deg);
            opacity: 0.03;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translate(20px, -30px) rotate(90deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(-15px, -60px) rotate(180deg);
            opacity: 0.5;
          }
          75% {
            transform: translate(30px, -40px) rotate(270deg);
            opacity: 0.8;
          }
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 20px rgba(34, 211, 238, 0.5), 0 0 30px rgba(34, 211, 238, 0.3);
          }
          to {
            text-shadow: 0 0 30px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.5);
          }
        }

        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 75%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 25%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes nebula {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(30px, -20px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-20px, 30px) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default CyberpunkAuthV2;
