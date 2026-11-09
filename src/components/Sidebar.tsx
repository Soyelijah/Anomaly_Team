import React from 'react';
import {
  Users,
  Trophy,
  Shield,
  Coins,
  Radio,
  Gavel,
  Crown,
  RefreshCw,
  Sparkles,
  X,
  UserCheck,
  Package,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { GuildMark } from './GuildMark';
import { TeamMemberSession } from './TeamAuthGate';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOfficer: boolean;
  officerName: string;
  onLogoutOfficer: () => void;
  isSyncing: boolean;
  onSync: () => void;
  onOpenCommunity?: () => void;
  onClose?: () => void;
  session?: TeamMemberSession | null;
  onLogoutSession?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    isLive?: boolean;
  };
  onClick?: () => void;
}

interface NavSection {
  category: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOfficer,
  officerName,
  onLogoutOfficer,
  isSyncing,
  onSync,
  onOpenCommunity,
  onClose,
  session,
  onLogoutSession,
}) => {
  const navSections: NavSection[] = [
    {
      category: 'Exploración y Ranking',
      items: [
        {
          id: 'players',
          label: 'Ranking Jugadores',
          sublabel: 'Top global & visor 3D',
          icon: Users,
          badge: { text: '3D' },
        },
        {
          id: 'leagues',
          label: 'Ligas de Guilds',
          sublabel: 'Competición oficial',
          icon: Trophy,
        },
      ],
    },
    {
      category: 'Operaciones del Clan',
      items: [
        {
          id: 'clan',
          label: 'Roster del Clan',
          sublabel: 'Miembros y oficiales',
          icon: Shield,
        },
        {
          id: 'member',
          label: 'Mi Portal',
          sublabel: 'Asistencia y mi PJ',
          icon: UserCheck,
        },
        {
          id: 'vault',
          label: 'Cuentas & Baúles',
          sublabel: 'Buffer Elfs & Mulas',
          icon: Package,
          badge: { text: 'CLAN' },
        },
        {
          id: 'auction',
          label: 'Subasta del Baúl',
          sublabel: 'Pujas de ítems raros',
          icon: Gavel,
        },
      ],
    },
    {
      category: 'Comunidad y En Vivo',
      items: [
        {
          id: 'events',
          label: 'Radar de Eventos',
          sublabel: 'Invasiones y eventos',
          icon: Radio,
          badge: { text: 'LIVE', isLive: true },
        },
        {
          id: 'community',
          label: 'Canales Oficiales',
          sublabel: 'Discord & WhatsApp',
          icon: MessageSquare,
          badge: { text: 'VOZ' },
          onClick: onOpenCommunity,
        },
      ],
    },
  ];

  return (
    <aside className="w-full h-full lg:w-64 shrink-0 bg-[#070912] border-r border-slate-800/80 flex flex-col justify-between select-none z-20">
      {/* Top Branding Header */}
      <div>
        <div className="p-4 pb-3.5 border-b border-slate-800/70 bg-gradient-to-b from-[#0c0d1c] to-transparent flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              <GuildMark size={5} className="border-purple-500/50 shadow-lg shadow-purple-950/60" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070912] shadow-sm shadow-emerald-500/50" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black text-white tracking-wider uppercase font-sans">
                  ANOMALY
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
              </div>
              <div className="text-[10px] text-pink-400 font-mono tracking-widest font-semibold uppercase truncate">
                SMASH MU · COMUNIDAD
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 shrink-0 cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation */}
        <nav className="p-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Category Section Header */}
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between">
                <span>{section.category}</span>
                <span className="w-8 h-[1px] bg-slate-800" />
              </div>

              {/* Items in Category */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          setActiveTab(item.id);
                        }
                        if (onClose) onClose();
                      }}
                      className={`relative group w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-950/50 via-pink-950/20 to-slate-900/30 text-white font-bold border border-pink-500/30 shadow-md shadow-pink-950/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:translate-x-1 border border-transparent'
                      }`}
                    >
                      {/* Active Left Accent Strip */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-purple-400 via-pink-500 to-amber-400 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                      )}

                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Icon Stage */}
                        <div
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isActive
                              ? 'text-pink-400 bg-pink-500/15 border border-pink-500/30'
                              : 'text-slate-400 group-hover:text-pink-300 group-hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        </div>

                        {/* Labels */}
                        <div className="truncate">
                          <div className={`text-xs leading-tight tracking-wide ${isActive ? 'text-pink-100 font-bold' : 'text-slate-300'}`}>
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] leading-tight truncate ${
                              isActive ? 'text-pink-300/70' : 'text-slate-500 group-hover:text-slate-400'
                            }`}
                          >
                            {item.sublabel}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      {item.badge && (
                        <div className="shrink-0 ml-1.5">
                          {item.badge.isLive ? (
                            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <span>LIVE</span>
                            </div>
                          ) : (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                                isActive
                                  ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm'
                                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                              }`}
                            >
                              {item.badge.text}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Area: Member Session, Sync Status & Officer Access */}
      <div className="p-3.5 border-t border-slate-800/70 bg-gradient-to-t from-[#0c0d1c] to-transparent space-y-2.5">
        {/* Verified Team Member Card */}
        {session && (
          <div className="bg-[#0e1224] border border-emerald-500/30 rounded-xl p-2.5 text-xs shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider truncate">
                  CUENTA VINCULADA
                </span>
              </div>
              {onLogoutSession && (
                <button
                  onClick={onLogoutSession}
                  className="text-[10px] text-slate-400 hover:text-red-400 transition-colors flex items-center space-x-1 shrink-0 ml-1 cursor-pointer"
                  title="Cerrar sesión del portal"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              )}
            </div>

            <div className="truncate">
              <div className="font-bold text-white text-xs truncate flex items-center space-x-1">
                <span>{session.characterName}</span>
                {session.syncedData.isMaster && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
                    GM
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                ID MU: <span className="text-purple-300">{session.muLoginId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/60 text-slate-300">
              <span className="text-amber-300 font-bold">{session.syncedData.resets} RR</span>
              <span className="text-pink-300">{session.syncedData.gearScore} GS</span>
            </div>
          </div>
        )}

        {/* Quick Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full py-1.5 px-2.5 rounded-lg bg-black/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-mono flex items-center justify-between transition-colors disabled:opacity-50 cursor-pointer"
          title="Sincronizar con API oficial de Smash MU"
        >
          <span className="flex items-center space-x-1.5 truncate">
            <RefreshCw className={`w-3 h-3 text-cyan-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="truncate">{isSyncing ? 'Sincronizando...' : 'Sincronizar Smash MU'}</span>
          </span>
          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">API</span>
        </button>

        {/* Officer Status Badge (Only shown if member is an officer/GM) */}
        {isOfficer && (
          <div className="bg-[#120e21] border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center space-x-2 truncate">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="text-[9px] text-purple-300 font-mono font-bold">OFICIAL ACTIVO</div>
                <div className="font-bold text-white text-xs truncate">{officerName}</div>
              </div>
            </div>
            <button
              onClick={onLogoutOfficer}
              className="text-[10px] text-slate-400 hover:text-red-400 transition-colors underline shrink-0 ml-1.5 cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}

        {/* Smash MU Brand Mark */}
        <div className="pt-1 text-center">
          <div className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center justify-center space-x-1">
            <span>SMASH MU</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
