import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Gamepad as GamepadIcon, User, Settings, LogOut, Trophy, Users, Menu, X, BarChart3, Radio } from 'lucide-react';
import UserProfile from '../User/UserProfile';
import SettingsModal from '../Settings/SettingsModal';
import ProfileSettings from '../User/ProfileSettings';
import UserDashboard from '../User/UserDashboard';
import UserAvatar from '../User/UserAvatar';
import LanguageSelector from '../Language/LanguageSelector';
import ThemeSelector from '../Theme/ThemeSelector';
import SimpleMessages from '../Social/SimpleMessages';

interface HeaderProps {
  currentView?: 'streams' | 'games' | 'multiplayer' | 'tournaments';
  onViewChange?: (view: 'streams' | 'games' | 'multiplayer' | 'tournaments') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView = 'games', onViewChange }) => {
  const { user, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleSignOut = async () => {
    try {
      setShowProfile(false);
      setShowSettings(false);
      setShowProfileSettings(false);
      setShowDashboard(false);
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-2xl border-b-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20'
          : 'bg-black/60 backdrop-blur-xl border-b border-cyan-500/20'
      }`}>
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo - MOVIDO PARA ESQUERDA */}
            <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer flex-shrink-0">
              <div className="relative">
                {/* Glow múltiplo */}
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300 animate-pulse" />
                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                
                {/* Anel rotativo */}
                <div className="absolute -inset-2 border-2 border-cyan-500/20 rounded-xl group-hover:border-cyan-400/40 transition-all duration-300 group-hover:rotate-12" />
                
                {/* Ícone */}
                <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-2 sm:p-2.5 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <GamepadIcon className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
                </div>
              </div>
              
              <div>
                <div className="text-lg sm:text-xl font-black tracking-tight leading-none">
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
                      PLAYNOW
                    </span>
                    {/* Sublinhado animado */}
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-600 animate-shimmer-slow" />
                  </span>
                  <span className="text-white ml-1 text-sm">emu</span>
                </div>
              </div>
            </div>

            {/* Navigation - CENTRAL COM LIVE STREAMS */}
            <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
              {[
                { name: 'Live Streams', view: 'streams' as const, icon: Radio, color: 'red', gradient: 'from-red-500/20 to-pink-500/20', shadow: 'red-400/40' },
                { name: 'Games', view: 'games' as const, icon: GamepadIcon, color: 'cyan', gradient: 'from-cyan-500/20 to-blue-500/20', shadow: 'cyan-400/40' },
                { name: 'Multiplayer', view: 'multiplayer' as const, icon: Users, color: 'purple', gradient: 'from-purple-500/20 to-pink-500/20', shadow: 'purple-400/40' },
                { name: 'Tournaments', view: 'tournaments' as const, icon: Trophy, color: 'yellow', gradient: 'from-yellow-500/20 to-orange-500/20', shadow: 'yellow-400/40' }
              ].map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.name}
                    onClick={() => onViewChange?.(item.view)}
                    className={`group relative px-4 py-2 transition-all duration-300 font-bold overflow-hidden rounded-xl border-2 ${
                      isActive 
                        ? `text-white border-${item.color}-500/50 bg-gradient-to-r ${item.gradient}` 
                        : 'text-gray-300 hover:text-white border-transparent hover:border-opacity-30'
                    }`}
                    style={{ borderColor: isActive ? undefined : `var(--tw-gradient-from)` }}
                  >
                    {/* Glow background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`} />
                    
                    {/* Shadow glow */}
                    <div className={`absolute inset-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} shadow-xl shadow-${item.shadow} transition-opacity duration-300`} />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Content */}
                    <span className="relative z-10 flex items-center gap-2 text-sm">
                      <item.icon className="w-4 h-4 group-hover:animate-bounce-subtle" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </span>
                    
                    {/* Bottom bar indicator */}
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'} h-0.5 bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 transition-all duration-300`} />
                  </button>
                );
              })}
            </nav>

            {/* Right Side Controls - ORGANIZADOS À DIREITA */}
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              {/* Language and Theme Selectors */}
              <div className="hidden lg:flex items-center gap-2">
                <LanguageSelector />
                <ThemeSelector />
              </div>
              
              {/* Divider */}
              <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
              
              {user ? (
                <>
                  {/* Settings Button - COMPACTO */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="group relative p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-400 hover:text-green-300 hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg border-2 border-green-500/30 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-400/30 active:scale-95 hover:scale-110 touch-manipulation overflow-hidden"
                    title="Configurações"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <Settings className="relative w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  </button>

                  {/* Quick Sign Out - COMPACTO */}
                  <button
                    onClick={handleSignOut}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-400 border-2 border-red-500/30 rounded-lg hover:text-white hover:border-red-400/60 hover:from-red-500/20 hover:to-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-400/30 hover:scale-105 group relative overflow-hidden text-sm"
                    title="Sair da conta"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <LogOut className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    <span className="relative font-bold">Sair</span>
                  </button>

                  {/* User Profile Button - COMPACTO */}
                  <div className="relative group/profile">
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="relative flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-400/40 active:scale-95 hover:scale-105 touch-manipulation overflow-hidden"
                    >
                      {/* Glow on hover */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover/profile:opacity-100 transition-opacity duration-300" />
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/profile:translate-x-full transition-transform duration-700" />
                      
                      {/* Avatar with ring */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full opacity-0 group-hover/profile:opacity-100 transition-opacity duration-300 animate-pulse" />
                        <UserAvatar user={user} size="sm" showBadge={true} />
                      </div>
                      
                      <span className="hidden lg:inline text-white font-bold tracking-wide relative text-sm">{user.username}</span>
                      
                      {/* Chevron indicator */}
                      <div className={`hidden lg:block w-3 h-3 border-r-2 border-b-2 border-cyan-400 transform transition-transform duration-300 ${showProfile ? '-rotate-135' : 'rotate-45'}`} />
                    </button>

                    {showProfile && (
                      <div className="absolute top-full right-0 mt-3 w-64 sm:w-56 bg-black/95 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />
                        
                        {/* Username no mobile */}
                        <div className="sm:hidden p-4 border-b border-gray-800">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="md" showBadge={true} />
                            <div>
                              <p className="text-white font-bold">{user.username}</p>
                              <p className="text-gray-400 text-xs">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 mt-2">
                          {[
                            { icon: BarChart3, label: 'Dashboard', color: 'cyan', gradient: 'from-cyan-500/20 to-blue-500/20', shadow: 'cyan-400/40', action: () => { setShowProfile(false); setShowDashboard(true); } },
                            { icon: User, label: 'Editar Perfil', color: 'purple', gradient: 'from-purple-500/20 to-pink-500/20', shadow: 'purple-400/40', action: () => { setShowProfile(false); setShowProfileSettings(true); } },
                            { icon: Trophy, label: 'Conquistas', color: 'yellow', gradient: 'from-yellow-500/20 to-orange-500/20', shadow: 'yellow-400/40', action: () => setShowProfile(false) },
                            { icon: Users, label: 'Amigos', color: 'pink', gradient: 'from-pink-500/20 to-red-500/20', shadow: 'pink-400/40', action: () => setShowProfile(false) },
                            { icon: Settings, label: 'Configurações', color: 'green', gradient: 'from-green-500/20 to-emerald-500/20', shadow: 'green-400/40', action: () => { setShowProfile(false); setShowSettings(true); } }
                          ].map(({ icon: Icon, label, color, gradient, shadow, action }) => (
                            <button
                              key={label}
                              onClick={action}
                              className={`relative w-full flex items-center space-x-3 px-4 py-3.5 sm:py-3 text-left text-gray-300 hover:text-${color}-400 rounded-xl transition-all duration-300 group active:scale-95 touch-manipulation overflow-hidden border border-transparent hover:border-${color}-500/30`}
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                              
                              {/* Glow background */}
                              <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                              
                              {/* Shadow glow */}
                              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 shadow-xl shadow-${shadow} transition-opacity duration-300`} />
                              
                              <Icon className="w-5 h-5 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:animate-bounce-subtle" />
                              <span className="font-semibold text-base sm:text-sm relative z-10">{label}</span>
                            </button>
                          ))}
                          
                          {/* Divider com gradiente */}
                          <div className="relative my-3 h-px">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-shimmer-slow" />
                          </div>
                          
                          <button
                            onClick={handleSignOut}
                            className="relative w-full flex items-center space-x-3 px-4 py-3.5 sm:py-3 text-left text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 group active:scale-95 touch-manipulation overflow-hidden border border-transparent hover:border-red-500/30"
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                            
                            {/* Glow background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Shadow glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-xl shadow-red-400/40 transition-opacity duration-300" />
                            
                            <LogOut className="w-5 h-5 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-12" />
                            <span className="font-bold text-base sm:text-sm relative z-10">Sair</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <button className="px-5 py-2.5 text-cyan-400 hover:text-cyan-300 font-bold transition-all duration-300 hover:scale-105">
                    Sign In
                  </button>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                    Sign Up
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="relative md:hidden p-2.5 sm:p-2 text-cyan-400 rounded-lg transition-all duration-300 active:scale-95 touch-manipulation overflow-hidden group border-2 border-transparent hover:border-cyan-500/30"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                
                {/* Glow background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Shadow glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-xl shadow-cyan-400/40 transition-opacity duration-300" />
                
                {showMobileMenu ? 
                  <X className="w-7 h-7 sm:w-6 sm:h-6 relative z-10 transition-transform duration-300 group-hover:rotate-90" /> : 
                  <Menu className="w-7 h-7 sm:w-6 sm:h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                }
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
      </header>

      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="relative h-full overflow-y-auto">
            <div className="container mx-auto px-4 pt-20 pb-8">
              {/* Language and Theme Selectors - Mobile */}
              <div className="flex items-center justify-center gap-4 mb-8 pb-6 border-b border-gray-800">
                <LanguageSelector />
                <ThemeSelector />
              </div>

              {/* User Info Mobile */}
              {user && (
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={user} size="lg" showBadge={true} />
                    <div className="flex-1">
                      <p className="text-white font-black text-lg">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links - Larger for Mobile COM LIVE STREAMS */}
              <nav className="space-y-3 mb-6">
                {[
                  { name: 'Live Streams', view: 'streams' as const, icon: Radio, gradient: 'from-red-500/20 to-pink-500/20', shadow: 'red-400/40', border: 'border-red-500/30' },
                  { name: 'Games', view: 'games' as const, icon: GamepadIcon, gradient: 'from-cyan-500/20 to-blue-500/20', shadow: 'cyan-400/40', border: 'border-cyan-500/30' },
                  { name: 'Multiplayer', view: 'multiplayer' as const, icon: Users, gradient: 'from-purple-500/20 to-pink-500/20', shadow: 'purple-400/40', border: 'border-purple-500/30' },
                  { name: 'Tournaments', view: 'tournaments' as const, icon: Trophy, gradient: 'from-yellow-500/20 to-orange-500/20', shadow: 'yellow-400/40', border: 'border-yellow-500/30' }
                ].map(({ name, view, icon: Icon, gradient, shadow, border }) => {
                  const isActive = currentView === view;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        onViewChange?.(view);
                        setShowMobileMenu(false);
                      }}
                      className={`relative block w-full px-6 py-5 text-lg font-bold text-white rounded-xl active:scale-95 transition-all duration-300 touch-manipulation text-center overflow-hidden group border-2 ${border} ${isActive ? 'border-opacity-100' : 'border-opacity-50 hover:border-opacity-100'}`}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                      
                      {/* Glow background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition-opacity duration-300`} />
                      
                      {/* Shadow glow */}
                      <div className={`absolute inset-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} shadow-xl shadow-${shadow} transition-opacity duration-300`} />
                      
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:animate-bounce-subtle" />
                        <span>{name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* User Actions - Mobile */}
              {user && (
                <div className="space-y-3">
                  {[
                    { icon: BarChart3, label: 'Dashboard', gradient: 'from-cyan-500/20 to-cyan-600/20', border: 'border-cyan-500/50', text: 'text-cyan-300', shadow: 'cyan-400/40', action: () => { setShowMobileMenu(false); setShowDashboard(true); } },
                    { icon: User, label: 'Editar Perfil', gradient: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/50', text: 'text-purple-300', shadow: 'purple-400/40', action: () => { setShowMobileMenu(false); setShowProfileSettings(true); } },
                    { icon: Settings, label: 'Configurações', gradient: 'from-green-500/20 to-green-600/20', border: 'border-green-500/50', text: 'text-green-300', shadow: 'green-400/40', action: () => { setShowMobileMenu(false); setShowSettings(true); } },
                    { icon: LogOut, label: 'Sair da conta', gradient: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/50', text: 'text-red-300', shadow: 'red-400/40', action: () => { setShowMobileMenu(false); handleSignOut(); } }
                  ].map(({ icon: Icon, label, gradient, border, text, shadow, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${gradient} border-2 ${border} rounded-xl ${text} font-bold active:scale-95 transition-all duration-300 touch-manipulation overflow-hidden group`}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-active:translate-x-[200%] transition-transform duration-500" />
                      
                      {/* Shadow glow */}
                      <div className={`absolute inset-0 opacity-0 group-active:opacity-100 shadow-xl shadow-${shadow} transition-opacity duration-200`} />
                      
                      <Icon className="w-5 h-5 relative z-10 transition-transform duration-300 group-active:scale-125" />
                      <span className="relative z-10">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <UserProfile
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showProfileSettings && (
        <ProfileSettings
          onClose={() => setShowProfileSettings(false)}
        />
      )}

      {showDashboard && (
        <UserDashboard
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* 💬 SIMPLE MESSAGES PANEL */}
      {showMessages && (
        <SimpleMessages
          onClose={() => setShowMessages(false)}
        />
      )}
    </>
  );
};

export default Header;
