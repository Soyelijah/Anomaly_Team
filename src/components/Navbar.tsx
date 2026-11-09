import React from 'react';
import { RefreshCw, Lock, LogOut, User, Sparkles, ChevronDown } from 'lucide-react';
import { GuildMark } from './GuildMark';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOfficer: boolean;
  officerName: string;
  currentMember: string | null;
  onOpenLogin: () => void;
  onLogoutOfficer: () => void;
  onLogoutMember: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isOfficer,
  officerName,
  currentMember,
  onOpenLogin,
  onLogoutOfficer,
  onLogoutMember,
  onSync,
  isSyncing,
}) => {
  const navTabs = [
    { id: 'public', label: 'Vista Pública' },
    {
      id: 'member',
      label: currentMember ? `Mi Panel (${currentMember})` : 'Mi Panel',
      highlight: true,
    },
    { id: 'roster', label: 'Roster & Ranking' },
    { id: 'leagues', label: 'Ligas & GearScore' },
    { id: 'events', label: 'Radar de Eventos' },
    { id: 'siege', label: 'Castle Siege', tag: 'Deshabilitado' },
    { id: 'calculator', label: 'Calculadora' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d18]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title & Server context */}
        <div className="flex items-center space-x-3 shrink-0">
          <GuildMark size={4} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-lg tracking-wider whitespace-nowrap">ANOMALY</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-700/50 text-purple-300">
                Smash MU
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <span className="text-emerald-400">● En Vivo</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Loren Deep</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto py-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm'
                    : tab.highlight && currentMember
                    ? 'text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-800/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.id === 'member' && <Sparkles className="w-3 h-3 text-cyan-400 inline" />}
                <span>{tab.label}</span>
                {tab.tag && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700/50">
                    {tab.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Sync & Member / Officer Badges) */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Botón de Sincronización - Exclusivo para el Guild Master / Oficial */}
          {isOfficer && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Sincronizar Roster con API Smash MU (Exclusivo Guild Master)"
              className="px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          )}

          {/* Member Badge if logged in */}
          {currentMember && (
            <div className="flex items-center space-x-1.5 bg-[#12172f] border border-cyan-500/40 rounded-lg px-2.5 py-1.5 shadow-sm">
              <button
                onClick={() => setActiveTab('member')}
                className="text-left leading-none hover:opacity-80 transition-opacity"
                title="Ir a mi panel personal"
              >
                <div className="text-xs font-bold text-cyan-300 flex items-center space-x-1">
                  <User className="w-3 h-3 text-cyan-400 inline" />
                  <span>{currentMember}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Miembro Activo</div>
              </button>
              <button
                onClick={onLogoutMember}
                title="Cambiar o cerrar sesión de miembro"
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Officer Badge if logged in */}
          {isOfficer && (
            <div className="flex items-center space-x-1.5 bg-purple-950/60 border border-purple-500/50 rounded-lg px-2.5 py-1.5">
              <div className="text-left leading-none">
                <div className="text-xs font-bold text-amber-300">👑 {officerName}</div>
                <div className="text-[9px] text-purple-300 mt-0.5">Oficial / GM</div>
              </div>
              <button
                onClick={onLogoutOfficer}
                title="Cerrar sesión de oficial"
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Login trigger if neither or want to switch */}
          {(!currentMember || !isOfficer) && (
            <button
              onClick={onOpenLogin}
              className="px-3 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap shadow-sm shadow-amber-500/20"
              title="Iniciar sesión como miembro o líder de Anomaly"
            >
              <Lock className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">
                {!currentMember ? 'Ingreso de Miembro' : 'Modo Oficial'}
              </span>
              <span className="sm:hidden">Ingreso</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav row */}
      <div className="lg:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-[#080b14]">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center space-x-1 ${
                isActive
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.id === 'member' && <Sparkles className="w-3 h-3 text-cyan-400 inline" />}
              <span>{tab.label}</span>
              {tab.tag && (
                <span className="text-[8px] font-bold px-1 rounded bg-red-950/80 text-red-300 border border-red-700/50">
                  {tab.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
