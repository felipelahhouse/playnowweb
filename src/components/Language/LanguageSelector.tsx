import React, { useState } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 hover:scale-105 group"
        title="Change Language"
      >
        <Globe className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-2xl">{currentLang.flag}</span>
        <span className="hidden sm:inline text-blue-300 font-bold text-sm">{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden z-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" />
            <div className="p-2 mt-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                    language === lang.code
                      ? 'bg-blue-500/20 border border-blue-400/50'
                      : 'hover:bg-blue-500/10 border border-transparent'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${
                      language === lang.code ? 'text-blue-300' : 'text-gray-300'
                    }`}>
                      {lang.name}
                    </p>
                    <p className="text-xs text-gray-500">{lang.code.toUpperCase()}</p>
                  </div>
                  {language === lang.code && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
