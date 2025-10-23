import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, Sparkles, TrendingUp } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import LiveStreamWindow from './LiveStreamWindow';
import MultiplayerWindow from './MultiplayerWindow';

const ModernHeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamesCount, setGamesCount] = useState(548);
  const [isLoaded, setIsLoaded] = useState(false);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((particle, i) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particles.forEach((otherParticle, j) => {
          if (i === j) return;
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - distance / 100)})`;
            ctx.stroke();
          }
        });

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Load games count
  useEffect(() => {
    const q = query(collection(db, 'games'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGamesCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-gray-900 via-gray-950 to-black overflow-hidden min-h-screen flex items-center">
      {/* Live Stream Window - Left Side */}
      <LiveStreamWindow />

      {/* Multiplayer Window - Right Side */}
      <MultiplayerWindow />

      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-purple-900/10 to-transparent" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Floating circles */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-40 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative container mx-auto px-6 py-24 w-full">
        {/* Icon with glow effect - MELHORADO */}
        <div 
          className={`flex justify-center mb-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <div className="relative group">
            {/* Glow pulsante múltiplo */}
            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-50 animate-pulse" />
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Anel rotativo externo */}
            <div className="absolute -inset-4 border-2 border-cyan-500/30 rounded-3xl animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute -inset-6 border-2 border-purple-500/20 rounded-3xl animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
            
            {/* Card principal com hover */}
            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 rounded-3xl transform group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <Gamepad2 className="w-16 h-16 text-white animate-float" />
              
              {/* Brilho interno */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 rounded-3xl animate-shimmer-slow" />
            </div>
            
            {/* Sparkles flutuantes */}
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
              <Sparkles className="w-6 h-6 text-pink-400 drop-shadow-lg" />
            </div>
            <div className="absolute top-0 left-0 animate-bounce" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Main Title - MELHORADO */}
        <h1 
          className={`text-center mb-6 transition-all duration-1000 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative inline-block">
            {/* Sombra colorida */}
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-30 animate-pulse" />
            
            {/* Texto principal */}
            <div className="relative">
              <div className="text-6xl md:text-8xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                RETRO GAME
              </div>
              <div className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x drop-shadow-2xl">
                LIBRARY
              </div>
            </div>
            
            {/* Linhas decorativas animadas */}
            <div className="absolute -left-20 top-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 animate-shimmer-slow" />
            <div className="absolute -right-20 top-1/2 w-16 h-0.5 bg-gradient-to-l from-transparent to-purple-400 animate-shimmer-slow" style={{ animationDelay: '1s' }} />
          </div>
        </h1>

        {/* Subtitle - MELHORADO */}
        <p 
          className={`text-center text-gray-300 text-xl md:text-2xl mb-10 transition-all duration-1000 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="inline-block relative">
            <span className="text-cyan-400 font-black text-3xl animate-pulse">{gamesCount}</span>
            <span className="absolute -top-2 -right-6 text-cyan-400 text-xs animate-bounce">+</span>
          </span>
          {' '}
          <span className="text-gray-400">classic games ready to play</span>
        </p>

        {/* Feature Tags - MELHORADOS */}
        <div 
          className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Badge 1 */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300" />
            <div className="relative flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-600/10 border-2 border-yellow-500/40 rounded-full px-5 py-2.5 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-yellow-300 font-bold text-sm">{gamesCount}+ Games</span>
            </div>
          </div>

          {/* Badge 2 */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300" />
            <div className="relative flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/40 rounded-full px-5 py-2.5 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer">
              <Gamepad2 className="w-5 h-5 text-cyan-400 animate-bounce-subtle" />
              <span className="text-cyan-300 font-bold text-sm">Instant Play</span>
            </div>
          </div>

          {/* Badge 3 */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300" />
            <div className="relative flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-600/10 border-2 border-purple-500/40 rounded-full px-5 py-2.5 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer">
              <TrendingUp className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-purple-300 font-bold text-sm">Free Forever</span>
            </div>
          </div>
        </div>

        {/* Animated Divider - MELHORADO */}
        <div className="flex justify-center mb-8">
          <div className="relative w-80 h-1.5 rounded-full overflow-hidden">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 animate-gradient-x" />
            
            {/* Shine effect */}
            <div className="absolute inset-0">
              <div className="w-20 h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer-slow opacity-70" />
            </div>
            
            {/* Glow pulsante */}
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-cyan-400 to-purple-600 opacity-50 animate-pulse" />
          </div>
        </div>

        {/* Indicadores de scroll */}
        <div className="flex justify-center animate-bounce">
          <div className="text-gray-500 text-sm font-semibold flex flex-col items-center gap-2">
            <span>Scroll Down</span>
            <div className="flex gap-1">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-transparent rounded-full animate-pulse" />
              <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-8 bg-gradient-to-b from-pink-400 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
};

export default ModernHeroSection;
