import React, { useEffect, useRef } from 'react';
import { ClanConfig } from '../types/clan';
import { GuildMark } from './GuildMark';
import {
  Crown,
  Shield,
  Trophy,
  Users,
  Eye,
  Crosshair,
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';

interface ClanHeroBannerProps {
  clanConfig: ClanConfig;
  totalMembers: number;
  avgResets: number;
  powerRating: number;
  onNavigateToTab: (tab: string) => void;
  onInspectEquipment?: (name: string) => void;
}

export const ClanHeroBanner: React.FC<ClanHeroBannerProps> = ({
  clanConfig,
  totalMembers,
  avgResets,
  powerRating,
  onNavigateToTab,
  onInspectEquipment,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance lightweight embers particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    // Subtle floating glowing embers (35 particles max for fluid 60fps)
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.45 + 0.2,
      speedX: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.6 + 0.2,
      hue: Math.random() > 0.4 ? 275 : 38, // violet or amber sparks
    }));

    let lastTime = performance.now();
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY * 60 * dt;
        p.x += p.speedX * 60 * dt;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.fillStyle =
          p.hue === 275
            ? `rgba(192, 132, 252, ${p.opacity})`
            : `rgba(251, 191, 36, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="relative rounded-2xl overflow-hidden border border-purple-500/35 bg-[#070913] shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all">
      {/* Photorealistic Dark Gothic Cathedral Stage Panoramic Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-bottom opacity-40 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
        style={{
          backgroundImage: `url('/assets/causarex-armory-stage-wide.png')`,
        }}
      />

      {/* Cinematic Lighting & Volumetric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060812] via-[#080b19]/85 to-[#0b0c1e]/75 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060812] via-transparent to-[#060812]/90 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Lightweight 60FPS Ambient Embers Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Main Banner Content Layout */}
      <div className="relative z-10 p-4 sm:p-6 xl:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 min-w-0">
        {/* Left Column: Clan Title & Tactical Intel */}
        <div className="max-w-2xl space-y-3.5 min-w-0">
          {/* Tactical Top Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tracking-wide">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>SOBERANOS DE LOREN DEEP</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>{clanConfig.alliance}</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>SMASH MU · TEMPORADA ACTIVA</span>
            </span>
          </div>

          {/* Main Title & Crest */}
          <div className="flex items-center space-x-4">
            <div className="relative p-1 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 shadow-xl shadow-purple-900/40">
              <GuildMark size={6} className="border-slate-950" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#070913]" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-semibold">
                CENTRO TÁCTICO DE OPERACIONES
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
                CLAN{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-cyan-300 filter drop-shadow-[0_2px_15px_rgba(168,85,247,0.4)]">
                  ANOMALY
                </span>
              </h1>
            </div>
          </div>

          {/* Motto & Narrative */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
            "{clanConfig.motto}"
          </p>

          {/* Quick Tactical Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('roster-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onNavigateToTab('clan');
                  setTimeout(() => {
                    const el2 = document.getElementById('roster-section');
                    if (el2) el2.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }
              }}
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-950/60 flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-200" />
              <span>Roster Oficial</span>
            </button>
            <button
              onClick={() => onNavigateToTab('leagues')}
              className="px-4 sm:px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Ligas &amp; GearScore</span>
            </button>
            <button
              onClick={() => onInspectEquipment?.('UlmerMG')}
              className="px-4 sm:px-5 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 font-bold text-xs rounded-xl border border-purple-500/40 transition-all flex items-center space-x-2 active:scale-95 group"
            >
              <Eye className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Visor 3D · UlmerMG</span>
            </button>
          </div>
        </div>

        {/* Right Column: Holographic Tactical Status Card */}
        <div className="w-full xl:w-80 shrink-0 min-w-0">
          <div className="relative rounded-xl border border-purple-500/30 bg-[#090d1f]/80 backdrop-blur-md p-4 sm:p-5 shadow-2xl space-y-3.5">
            {/* Header of HUD */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-purple-400 animate-spin-slow" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  RADAR TÁCTICO
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                EN VIVO
              </span>
            </div>

            {/* Quick Tactical Stats */}
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-mono">
                  Guerreros
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {totalMembers} <span className="text-xs text-purple-400 font-normal">PJs</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-mono">
                  Prom. Resets
                </div>
                <div className="text-lg font-black text-amber-400 mt-0.5">
                  {avgResets} <span className="text-xs text-amber-500 font-normal">RR</span>
                </div>
              </div>
            </div>

            {/* Power Rating Gauge */}
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-950/80 border border-purple-500/20 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono text-[11px] flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Poder de Alianza</span>
                </span>
                <span className="text-purple-300 font-bold font-mono">
                  {powerRating.toLocaleString()} PTS
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 rounded-full"
                  style={{ width: '84%' }}
                />
              </div>
            </div>

            {/* Castle Siege Schedule Quick Flag */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Castle Siege:</span>
              <span className="text-amber-400 font-bold">Domingos 20:00 (GMT-5)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
