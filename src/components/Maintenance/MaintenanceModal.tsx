// 🚧 MAINTENANCE MODAL - Exibido para usuários quando site está em manutenção
import React, { useEffect, useState } from 'react';
import { Wrench, Clock, Sparkles } from 'lucide-react';

interface MaintenanceModalProps {
  message: string;
  estimatedTime: string;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ message, estimatedTime }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Raios de luz */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 opacity-20"
            style={{
              background: `conic-gradient(from ${i * 60}deg at 50% 50%, transparent 0deg, rgba(251, 146, 60, 0.15) 10deg, transparent 20deg)`,
              animation: `spin ${20 + i * 5}s linear infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}

        {/* Partículas flutuantes */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Modal Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 border-2 border-orange-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-orange-500/20 backdrop-blur-xl">
          
          {/* Icon animado */}
          <div className="relative mb-8">
            <div className="relative inline-block">
              <Wrench className="w-24 h-24 text-orange-400 mx-auto animate-bounce" />
              
              {/* Círculos pulsantes */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-orange-500/20 rounded-full animate-ping" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-orange-500/10 rounded-full animate-pulse" />
              </div>

              {/* Ferramentas girando */}
              <Wrench className="absolute -top-2 -right-2 w-8 h-8 text-cyan-400 animate-spin-slow" />
              <Sparkles className="absolute -bottom-2 -left-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-6 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
            🚧 Site em Manutenção
          </h1>

          {/* Mensagem */}
          <p className="text-lg sm:text-xl text-center text-gray-300 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Tempo estimado */}
          <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl">
            <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-sm text-gray-400">Tempo estimado:</div>
              <div className="text-xl font-bold text-cyan-400">{estimatedTime}</div>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <p className="text-gray-500 font-mono text-sm">
              Estamos trabalhando nisso{dots}
            </p>
          </div>

          {/* Progress bar decorativo */}
          <div className="mt-8 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-loading-bar" />
          </div>

          {/* Footer message */}
          <p className="text-center text-sm text-gray-600 mt-8">
            Agradecemos sua paciência! ❤️
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceModal;
