// 🚧 MAINTENANCE INDICATOR - Indicador de manutenção no canto inferior direito
import React, { useState, useEffect } from 'react';
import { Wrench, Clock } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const MaintenanceIndicator: React.FC = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Detectar idioma do navegador
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      setLanguage('es');
    } else if (browserLang.startsWith('en')) {
      setLanguage('en');
    } else {
      setLanguage('pt');
    }

    // Listener para mudanças no modo manutenção
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'maintenance'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsMaintenanceMode(data.enabled === true);
          setMessage(data.message || '');
          setEstimatedTime(data.estimatedTime || '');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (!isMaintenanceMode) return null;

  const translations = {
    pt: {
      title: 'Em Manutenção',
      workingOn: 'Estamos trabalhando nisso',
      estimatedTime: 'Tempo estimado',
      thankYou: 'Obrigado pela paciência!'
    },
    en: {
      title: 'Under Maintenance',
      workingOn: 'We are working on it',
      estimatedTime: 'Estimated time',
      thankYou: 'Thank you for your patience!'
    },
    es: {
      title: 'En Mantenimiento',
      workingOn: 'Estamos trabajando en ello',
      estimatedTime: 'Tiempo estimado',
      thankYou: '¡Gracias por tu paciencia!'
    }
  };

  const t = translations[language];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isMinimized ? (
        // Versão minimizada - apenas ícone pulsante
        <button
          onClick={() => setIsMinimized(false)}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 blur-xl opacity-75 group-hover:opacity-100 animate-pulse" />
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full border-2 border-orange-300 shadow-2xl shadow-orange-500/50 hover:scale-110 transition-all duration-300">
            <Wrench className="w-6 h-6 text-white animate-bounce" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          </div>
        </button>
      ) : (
        // Versão expandida
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 blur-xl opacity-50 animate-pulse" />
          
          {/* Card principal */}
          <div className="relative bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 rounded-2xl border-2 border-orange-500/50 shadow-2xl shadow-orange-500/30 overflow-hidden backdrop-blur-xl w-80">
            {/* Header animado */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            {/* Conteúdo */}
            <div className="p-5 space-y-4">
              {/* Título com ícone */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Wrench className="w-8 h-8 text-orange-400 animate-bounce" />
                    <div className="absolute inset-0 animate-ping">
                      <Wrench className="w-8 h-8 text-orange-400 opacity-50" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-wide">
                      {t.title}
                    </h3>
                    <p className="text-xs text-orange-300 font-medium">
                      {t.workingOn}
                    </p>
                  </div>
                </div>

                {/* Botão minimizar */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-orange-500/20 rounded-lg transition-colors"
                  title="Minimizar"
                >
                  <svg className="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Mensagem */}
              {message && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-sm text-orange-100 leading-relaxed">
                    {message}
                  </p>
                </div>
              )}

              {/* Tempo estimado */}
              {estimatedTime && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-3">
                  <Clock className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <div>
                    <p className="text-xs text-orange-300 font-medium">
                      {t.estimatedTime}
                    </p>
                    <p className="text-lg text-white font-bold">
                      {estimatedTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-orange-500/30">
                <p className="text-xs text-center text-orange-300 font-semibold">
                  {t.thankYou} ❤️
                </p>
              </div>

              {/* Barra de progresso animada */}
              <div className="relative h-1 bg-orange-900/30 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 animate-progress" />
              </div>
            </div>

            {/* Luzes piscando */}
            <div className="absolute top-0 left-0 right-0 flex justify-around p-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceIndicator;
