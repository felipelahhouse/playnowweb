import React, { useEffect, useRef, useState } from 'react';
import { Zap, Play, Users, Radio, Trophy, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const HeroSectionImproved: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    onlinePlayers: 0,
    activeSessions: 0,
    liveStreams: 0
  });

  // Load real-time stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get active sessions
        const sessionsQuery = query(
          collection(db, 'game_sessions'),
          where('status', '==', 'waiting')
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        setStats(prev => ({ ...prev, activeSessions: sessionsSnap.size }));

        // Listen to online users in real-time
        const unsubscribe = onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const now = Date.now();
            const onlineCount = snapshot.docs.filter(doc => {
              const data = doc.data();
              const lastSeen = data.last_seen?.toDate?.()?.getTime() || 0;
              return now - lastSeen < 5 * 60 * 1000; // 5 minutes
            }).length;
            setStats(prev => ({ ...prev, onlinePlayers: onlineCount }));
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('[HeroStats] Error loading:', error);
      }
    };

    loadStats();
  }, []);

  // Optimized particle animation with reduced particles for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 30 : 80; // Reduced for mobile

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 600;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }> = [];

    const colors = ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6', '#10b981'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationId: number;
    let lastFrame = 0;
    const fps = 30; // Throttle to 30fps for better performance
    const fpsInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const elapsed = currentTime - lastFrame;
      if (elapsed < fpsInterval) return;
      lastFrame = currentTime - (elapsed % fpsInterval);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Mouse interaction only on desktop
        if (!isMobile) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            particle.vx += dx * 0.00003;
            particle.vy += dy * 0.00003;
          }
        }

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles (less connections on mobile)
        const connectionDistance = isMobile ? 80 : 100;
        particles.forEach((otherParticle, j) => {
          if (i >= j) return;
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            const opacity = Math.floor((1 - distance / connectionDistance) * 30);
            ctx.strokeStyle = `${particle.color}${opacity.toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
    };

    animate(0);

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateSize);
    };
  }, [mousePos]);

  return (
    <div className="relative min-h-[500px] md:min-h-[650px] overflow-hidden pt-20">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {/* Live Stats Bar */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8 sm:mb-12">
          <div className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
            <Users className="w-4 h-4 text-green-400" />
            <div className="flex flex-col">
              <span className="text-xs text-green-300 font-medium">Online Now</span>
              <span className="text-lg font-black text-green-400 tabular-nums">
                {stats.onlinePlayers}
              </span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1" />
          </div>

          <div className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl backdrop-blur-sm hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
            <Trophy className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs text-purple-300 font-medium">Active Rooms</span>
              <span className="text-lg font-black text-purple-400 tabular-nums">
                {stats.activeSessions}
              </span>
            </div>
          </div>

          <div className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-sm hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-cyan-300 font-medium">Live Streams</span>
              <span className="text-lg font-black text-cyan-400 tabular-nums">
                {stats.liveStreams}
              </span>
            </div>
          </div>
        </div>

        {/* Main Title with Glitch Effect */}
        <div className="text-center space-y-6 md:space-y-8 mb-12">
          <div className="inline-block">
            <div className="relative group">
              {/* Glow layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
              
              {/* Main title */}
              <h1 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 tracking-tight leading-tight">
                RETRO GAMING
                <br />
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
                  MULTIPLAYER
                </span>
              </h1>

              {/* Subtitle with typing effect style */}
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-sm md:text-base mt-4">
                <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse" />
                <span>Real-time · Streaming · Tournaments</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-base md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            Join thousands of players in the ultimate retro gaming experience.
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">
              Play together
            </span>
            , {' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">
              stream live
            </span>
            , and {' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400 font-bold">
              compete
            </span>
            {' '} for glory!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center px-4 pt-4">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50 active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-3">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Start Playing Now</span>
                <TrendingUp className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button className="group relative px-8 py-4 bg-gray-800/50 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/60 hover:bg-gray-800/70 hover:scale-105 active:scale-95">
              <div className="relative flex items-center justify-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                <Zap className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                <span>Explore Games</span>
              </div>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Secure & Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span>Active Community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
      </div>
    </div>
  );
};

export default HeroSectionImproved;
