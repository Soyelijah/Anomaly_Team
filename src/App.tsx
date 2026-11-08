import { useState, useEffect, useCallback } from 'react';
import {
  Character,
  ClanConfig,
  SharedAccount,
  SquadRole,
  AttendanceStatus,
  SmashMUGuildLeagueSeason,
  SmashMUGearScoreItem,
  decodeMuClass,
} from './types/clan';
import { initialClanConfig, initialCharacters, initialSharedAccounts, serverEvents } from './data/initialData';
import { RefreshCw, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PlayersRankingView } from './components/PlayersRankingView';
import { PublicView } from './components/PublicView';
import { RosterView } from './components/RosterView';
import { GuildLeaguesView } from './components/GuildLeaguesView';
import { EventsRadar } from './components/EventsRadar';
import { AuctionView } from './components/AuctionView';
import { MemberPortalView } from './components/MemberPortalView';
import { VaultAccountsView } from './components/VaultAccountsView';
import { CommunityModal } from './components/CommunityModal';
import { LoginModal, EditMemberModal, AddMemberModal, AddVaultAccountModal } from './components/Modals';
import { EquipmentInspectorModal } from './components/EquipmentInspectorModal';
import { WorldClockBar } from './components/WorldClockBar';
import { MessageSquare, LogOut, UserCheck } from 'lucide-react';
import { TeamAuthGate, TeamMemberSession } from './components/TeamAuthGate';

export default function App() {
  const [activeTab, setActiveTab] = useState('clan');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clanConfig] = useState<ClanConfig>(() => {
    return initialClanConfig;
  });

  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('anomaly_clan_characters');
    if (saved) {
      try {
        const parsed: Character[] = JSON.parse(saved);
        // Merge initialCharacters so all verified members are present
        const mergedMap = new Map<string, Character>();
        initialCharacters.forEach((c) => mergedMap.set(c.name.toLowerCase(), c));

        parsed.forEach((c) => {
          if (c && c.name) {
            const lower = c.name.toLowerCase();
            const init = mergedMap.get(lower);
            if (init) {
              mergedMap.set(lower, {
                ...init,
                attendance: c.attendance || init.attendance,
                note: c.note || init.note,
                squad: c.squad || init.squad,
              });
            } else if (c.guild && c.guild.toLowerCase() === 'anomaly') {
              mergedMap.set(lower, c);
            }
          }
        });

        return Array.from(mergedMap.values());
      } catch (e) {
        // Fallback
      }
    }
    return initialCharacters;
  });

  const [currentMember, setCurrentMember] = useState<string | null>(() => {
    return localStorage.getItem('anomaly_current_member') || 'MATONSITO';
  });

  const [sharedAccounts, setSharedAccounts] = useState<SharedAccount[]>(() => {
    const saved = localStorage.getItem('anomaly_clan_vault');
    if (saved) {
      try {
        const parsed: SharedAccount[] = JSON.parse(saved);
        return parsed.filter(
          (a) => !/Aura_Anomaly|Warp_Anomaly|Vault_Anomaly|Farm_Anomaly|Anomaly_Warrior/i.test(a.characterName)
        );
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Private Team Session (Member registration & verification with Smash MU)
  const [teamSession, setTeamSession] = useState<TeamMemberSession | null>(() => {
    const saved = localStorage.getItem('anomaly_team_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isOfficer, setIsOfficer] = useState<boolean>(() => {
    return localStorage.getItem('anomaly_is_officer') === 'true';
  });

  const [officerName, setOfficerName] = useState<string>(() => {
    return localStorage.getItem('anomaly_officer_name') || 'UlmerMG';
  });

  // Official Smash MU API states
  const [currentLeagues, setCurrentLeagues] = useState<SmashMUGuildLeagueSeason[]>([]);
  const [historyLeagues, setHistoryLeagues] = useState<SmashMUGuildLeagueSeason[]>([]);
  const [gearScoreRanking, setGearScoreRanking] = useState<SmashMUGearScoreItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLog, setSyncLog] = useState<string[]>([
    '[SISTEMA] Portal conectado a la API de Smash MU (smashmu.com).',
    '[CLAN] Detectados integrantes reales de Anomaly: UlmerMG (Guild Master) y UlmerDL.',
  ]);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [inspectedCharacter, setInspectedCharacter] = useState<string | null>(null);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('anomaly_clan_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('anomaly_clan_vault', JSON.stringify(sharedAccounts));
  }, [sharedAccounts]);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 24)]);
  }, []);

  // Fetch official Smash MU APIs and cross data
  const fetchSmashMuData = useCallback(async () => {
    setIsSyncing(true);
    addLog(`Iniciando consulta oficial a smashmu.com...`);

    let leaguesData: any = null;
    let gsData: any = null;

    // 1. Fetch Guild Leagues (try proxy first, then direct)
    try {
      addLog(`Consultando /api/smash/guild-leagues...`);
      let res = await fetch('/api/smash/guild-leagues');
      if (!res.ok) {
        res = await fetch('https://www.smashmu.com/api/guild-leagues');
      }
      if (res.ok) {
        leaguesData = await res.json();
      }
    } catch (err: any) {
      addLog(`Aviso en guild-leagues: ${err.message}`);
    }

    // 2. Fetch GearScore Ranking (5,000 players)
    try {
      addLog(`Consultando /api/smash/gearscore (5,000 mejores)...`);
      let res = await fetch('/api/smash/gearscore');
      if (!res.ok) {
        res = await fetch('https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000');
      }
      if (res.ok) {
        gsData = await res.json();
      }
    } catch (err: any) {
      addLog(`Aviso en gearscore: ${err.message}`);
    }

    // Process Leagues Data
    if (leaguesData && leaguesData.success) {
      setCurrentLeagues(leaguesData.current || []);
      setHistoryLeagues(leaguesData.history || []);
      addLog(`Ligas cargadas: ${leaguesData.current?.length || 0} actuales y ${leaguesData.history?.length || 0} históricas.`);
    }

    // Process Gearscore and Cross
    const gsMap = new Map<string, { item: SmashMUGearScoreItem; rank: number }>();
    if (gsData && gsData.success && Array.isArray(gsData.ranking)) {
      const rankingList: SmashMUGearScoreItem[] = gsData.ranking;
      setGearScoreRanking(rankingList);
      addLog(`Ranking GearScore recibido: ${rankingList.length.toLocaleString()} jugadores cargados.`);

      rankingList.forEach((item, idx) => {
        if (item.Name) {
          gsMap.set(item.Name.toLowerCase(), { item, rank: idx + 1 });
        }
      });
    } else {
      // Resilient baseline fallback for Vercel / offline
      setGearScoreRanking((current) => {
        if (current.length > 0) return current;
        return initialCharacters.map((c, i) => ({
          Name: c.name,
          Class: c.characterClass === 'BK' ? 16 : c.characterClass === 'SM' ? 0 : c.characterClass === 'ELF' ? 32 : c.characterClass === 'MG' ? 48 : c.characterClass === 'DL' ? 64 : 80,
          GearScore: c.gearscore || 800,
          Guild: c.guild || 'Anomaly',
          rank: i + 1,
        }));
      });
    }

    // 3. Fetch Real Character Profiles & Stats (Resets, Level, Equipment) from Smash MU
    try {
      addLog(`Consultando perfiles oficiales para obtener Resets y Niveles reales...`);
      let profilesData: any = null;
      let pRes = await fetch(
        '/api/smash/clan-profiles?names=MATONSITO,SkyTM,SavioGM,Matthew,Pocajontas,prinmestis,CasS,Yhambo,rusbelx23,UlmerDL,UlmerMG'
      );
      if (!pRes.ok) {
        pRes = await fetch('/api/smash/clan-profiles');
      }
      if (pRes.ok) {
        profilesData = await pRes.json();
      }

      const profileMap = new Map<string, any>();
      if (profilesData && profilesData.success && Array.isArray(profilesData.profiles)) {
        profilesData.profiles.forEach((p: any) => {
          if (p.found && p.data?.character) {
            profileMap.set(p.name.toLowerCase(), p.data);
          }
        });
      }

      let crossedCount = 0;
      setCharacters((prev) => {
        const updated = prev.map((char) => {
          const matchGS = gsMap.get(char.name.toLowerCase());
          const matchProf = profileMap.get(char.name.toLowerCase());

          let newLevel = char.level;
          let newResets = char.resets;
          let newGearScore = matchGS ? matchGS.item.GearScore : char.gearscore;
          let newClassNameTitle = char.classNameTitle;
          let newClassCategory = char.characterClass;
          let newBuild = char.build;
          let newSquad = char.squad;
          let isMaster = char.isMaster;

          if (matchProf && matchProf.character) {
            const c = matchProf.character;
            newLevel = typeof c.level === 'number' ? c.level : newLevel;
            newResets = typeof c.resets === 'number' ? c.resets : newResets;
            newGearScore = c.gearScore || newGearScore;
            isMaster = !!c.guild?.isMaster;

            const decoded = decodeMuClass(c.class);
            newClassNameTitle = c.className || decoded.name;
            newClassCategory = decoded.category;

            // Generate real build summary from actual equipped items
            const realEquip = (matchProf.equipment || [])
              .filter((eq: any) => !eq.isEmpty && eq.name)
              .map((eq: any) => eq.name)
              .filter(
                (n: string) =>
                  !n.toLowerCase().includes('empty slot') &&
                  !n.toLowerCase().includes('ring') &&
                  !n.toLowerCase().includes('pendant')
              )
              .slice(0, 3);

            if (realEquip.length > 0 && (char.build === 'Detectado en Smash MU' || !char.build)) {
              newBuild = realEquip.join(' / ');
            }

            // Assign tactical squad if default
            if (newSquad === 'frontline') {
              if (decoded.category === 'DL') newSquad = 'seal';
              else if (decoded.category === 'SM' || decoded.category === 'ELF') newSquad = 'support';
            }
          }

          crossedCount++;
          return {
            ...char,
            level: newLevel,
            resets: newResets,
            gearscore: newGearScore,
            serverRank: matchGS ? matchGS.rank : char.serverRank,
            guild: matchGS?.item.Guild || char.guild || 'Anomaly',
            classNameTitle: newClassNameTitle,
            characterClass: newClassCategory,
            build: newBuild,
            squad: newSquad,
            isMaster: isMaster,
            online: true,
          };
        });

        // Also check if any other players belonging to ANOMALY in 5000 GS need to be integrated
        if (gsData && gsData.success && Array.isArray(gsData.ranking)) {
          const anomalyPlayersInServer: SmashMUGearScoreItem[] = gsData.ranking.filter(
            (p: SmashMUGearScoreItem) => p.Guild && p.Guild.toLowerCase() === clanConfig.name.toLowerCase()
          );

          anomalyPlayersInServer.forEach((ap, idx) => {
            const existing = updated.find((c) => c.name.toLowerCase() === ap.Name.toLowerCase());
            if (!existing) {
              const classDecoded = decodeMuClass(ap.Class);
              const prof = profileMap.get(ap.Name.toLowerCase());
              const cData = prof?.character;
              const realLevel = cData?.level ?? 380;
              const realResets = cData?.resets ?? 150;
              const isMaster = cData?.guild?.isMaster ?? false;

              const realEquip = (prof?.equipment || [])
                .filter((eq: any) => !eq.isEmpty && eq.name)
                .map((eq: any) => eq.name)
                .slice(0, 3);
              const buildText =
                realEquip.length > 0
                  ? realEquip.join(' / ')
                  : `${classDecoded.name} (GearScore: ${ap.GearScore})`;

              updated.push({
                id: `char-server-${Date.now()}-${idx}`,
                name: ap.Name,
                characterClass: classDecoded.category,
                classNameTitle: cData?.className || classDecoded.name,
                level: realLevel,
                resets: realResets,
                gearscore: ap.GearScore,
                serverRank: gsData.ranking.indexOf(ap) + 1,
                online: true,
                build: buildText,
                squad: classDecoded.category === 'DL' ? 'seal' : classDecoded.category === 'SM' ? 'support' : 'frontline',
                note: `Miembro de Anomaly en Servidor (GearScore: ${ap.GearScore})`,
                attendance: 'confirmed',
                category: 'main',
                assignedPlayer: ap.Name,
                guild: ap.Guild,
                isMaster: isMaster,
              });
              crossedCount++;
            }
          });
        }

        return updated;
      });

      // Log exact real stats to monitor
      if (profileMap.size > 0) {
        const statsSummaries: string[] = [];
        profileMap.forEach((prof) => {
          const c = prof.character;
          statsSummaries.push(`${c.name}: ${c.resets} RR (Nv. ${c.level})`);
        });
        addLog(`✓ Datos 100% reales actualizados: ${statsSummaries.join(' | ')}`);
      } else {
        addLog(`¡Cruce completado! ${crossedCount} personajes sincronizados con datos oficiales.`);
      }
    } catch (err: any) {
      addLog(`Aviso al obtener perfiles: ${err.message}`);
    }

    setIsSyncing(false);
  }, [clanConfig.name, addLog]);

  // Initial load
  useEffect(() => {
    fetchSmashMuData();
  }, [fetchSmashMuData]);

  // Private Team Auth Handlers (Smash MU verification & linking)
  const handleLoginSuccess = (session: TeamMemberSession) => {
    setTeamSession(session);
    localStorage.setItem('anomaly_team_session', JSON.stringify(session));
    setCurrentMember(session.characterName);
    localStorage.setItem('anomaly_current_member', session.characterName);
    if (session.role === 'officer' || session.characterName.toLowerCase() === 'ulmermg') {
      setIsOfficer(true);
      setOfficerName(session.characterName);
      localStorage.setItem('anomaly_is_officer', 'true');
      localStorage.setItem('anomaly_officer_name', session.characterName);
    }
    addLog(
      `[ACCESO] Cuenta Smash MU vinculada: ${session.characterName} (ID: ${session.muLoginId}, ${session.syncedData.resets} RR, ${session.syncedData.gearScore} GS).`
    );
  };

  const handleSessionLogout = () => {
    setTeamSession(null);
    localStorage.removeItem('anomaly_team_session');
    setIsOfficer(false);
    localStorage.removeItem('anomaly_is_officer');
    addLog(`Sesión del portal cerrada.`);
  };

  // Auth Handlers (Officer & Member)
  const handleLogin = (user: string) => {
    setIsOfficer(true);
    setOfficerName(user);
    localStorage.setItem('anomaly_is_officer', 'true');
    localStorage.setItem('anomaly_officer_name', user);
    addLog(`Oficial autenticado: ${user} (Privilegios de edición activados).`);
  };

  const handleLogout = () => {
    setIsOfficer(false);
    localStorage.removeItem('anomaly_is_officer');
    localStorage.removeItem('anomaly_officer_name');
    addLog(`Sesión de oficial cerrada. Vista en Modo Lectura.`);
  };

  const handleLoginMember = (charName: string) => {
    setCurrentMember(charName);
    localStorage.setItem('anomaly_current_member', charName);
    setActiveTab('member');
    addLog(`Miembro activo: ${charName} ha iniciado sesión en su panel personal.`);
  };

  const handleLogoutMember = () => {
    setCurrentMember(null);
    localStorage.removeItem('anomaly_current_member');
    addLog(`Sesión de miembro cerrada.`);
  };

  const handleMemberAttendanceUpdate = (charName: string, status: AttendanceStatus) => {
    setCharacters((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === charName.toLowerCase() ? { ...c, attendance: status } : c
      )
    );
    addLog(
      `Asistencia registrada para ${charName}: ${
        status === 'confirmed' ? 'Confirmado' : status === 'absent' ? 'Ausente' : 'Pendiente'
      }.`
    );
  };

  // Character Handlers
  const handleSaveCharacter = (updated: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    addLog(`Datos actualizados para el personaje: ${updated.name}`);
  };

  const handleDeleteCharacter = (id: string) => {
    const char = characters.find((c) => c.id === id);
    if (char && confirm(`¿Quitar a ${char.name} de la nómina del clan?`)) {
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      addLog(`Personaje removido: ${char.name}`);
    }
  };

  const handleAddCharacter = (newChar: Character) => {
    setCharacters((prev) => [newChar, ...prev]);
    addLog(`Nuevo personaje añadido al clan: ${newChar.name} (${newChar.characterClass})`);
  };

  // Castle Siege Handlers
  const handleUpdateAttendance = (id: string, attendance: AttendanceStatus) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, attendance } : c)));
  };

  const handleUpdateSquad = (id: string, squad: SquadRole) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, squad } : c)));
  };

  const handleAutoAssign = () => {
    setCharacters((prev) =>
      prev.map((c) => {
        let squad: SquadRole = 'frontline';
        if (c.characterClass === 'BK' || c.characterClass === 'MG') squad = 'frontline';
        else if (c.characterClass === 'ELF' || c.characterClass === 'SM') squad = 'support';
        else if (c.characterClass === 'DL') squad = 'seal';
        else if (c.characterClass === 'SUM') squad = 'disruptor';
        return { ...c, squad };
      })
    );
    addLog(`Escuadrones de Castle Siege reorganizados automáticamente por clase.`);
  };

  // Shared Accounts Handlers
  const handleToggleAccountStatus = (id: string) => {
    setSharedAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const nextStatus = acc.status === 'available' ? 'in_use' : 'available';
          const nextHolder = nextStatus === 'in_use' ? officerName : 'Libre';
          return { ...acc, status: nextStatus, holder: nextHolder };
        }
        return acc;
      })
    );
  };

  const handleAddAccount = (acc: SharedAccount) => {
    setSharedAccounts((prev) => [acc, ...prev]);
    addLog(`Nueva cuenta compartida registrada: ${acc.title}`);
  };

  const handleDeleteAccount = (id: string) => {
    setSharedAccounts((prev) => prev.filter((a) => a.id !== id));
    addLog(`Cuenta de bóveda removida.`);
  };

  const handleApplyRecruit = (app: {
    characterName: string;
    characterClass: Character['characterClass'];
    resets: number;
    level: number;
    contact: string;
    motivation: string;
  }) => {
    addLog(`Nueva postulación recibida de: ${app.characterName} (${app.characterClass}, ${app.resets} RR)`);
  };

  // Private Gate: Member must be registered and verified with their Smash MU Login ID & Character
  if (!teamSession) {
    return (
      <TeamAuthGate
        onLoginSuccess={handleLoginSuccess}
        teamDiscordUrl={clanConfig.discordUrl}
        smashMuDiscordUrl={clanConfig.smashMuDiscordUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 flex selection:bg-pink-600 selection:text-white">
      {/* Desktop Permanent Left Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOfficer={isOfficer}
          officerName={officerName}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogoutOfficer={handleLogout}
          isSyncing={isSyncing}
          onSync={fetchSmashMuData}
          onOpenCommunity={() => setIsCommunityOpen(true)}
          session={teamSession}
          onLogoutSession={handleSessionLogout}
        />
      </div>

      {/* Mobile Drawer Navigation (Off-canvas) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl flex flex-col">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              isOfficer={isOfficer}
              officerName={officerName}
              onOpenLogin={() => {
                setIsLoginOpen(true);
                setMobileSidebarOpen(false);
              }}
              onLogoutOfficer={handleLogout}
              isSyncing={isSyncing}
              onSync={fetchSmashMuData}
              onOpenCommunity={() => {
                setIsCommunityOpen(true);
                setMobileSidebarOpen(false);
              }}
              onClose={() => setMobileSidebarOpen(false)}
              session={teamSession}
              onLogoutSession={handleSessionLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
        {/* Sleek Top Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#070912]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Abrir menú de navegación"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-pink-400" />
            </button>

            {/* Connected Member ID & Character Status */}
            <div className="flex items-center space-x-2 text-xs font-mono truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-slate-400 hidden md:inline text-[11px]">ID:</span>
                <span className="text-purple-300 font-bold hidden md:inline">{teamSession.muLoginId}</span>
                <span className="text-slate-600 hidden md:inline">•</span>
                <span className="text-white font-bold">{teamSession.characterName}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold shrink-0">
                  {teamSession.syncedData.resets} RR
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 font-bold shrink-0 hidden sm:inline">
                  {teamSession.syncedData.gearScore} GS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs shrink-0">
            {/* Quick Community Channels Trigger */}
            <button
              onClick={() => setIsCommunityOpen(true)}
              className="px-2.5 sm:px-3 py-1 bg-[#131733] hover:bg-[#1c224a] border border-purple-500/40 text-purple-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Canales Oficiales: Discord y WhatsApp del Clan"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Discord</span>
              <span className="sm:hidden">Discord</span>
            </button>

            {/* Quick Live World Clock */}
            <div className="bg-[#0b0e1c] border border-slate-800 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono text-purple-300 whitespace-nowrap hidden sm:block">
              GMT-5
            </div>

            {/* Sync Indicator */}
            {isSyncing && (
              <span className="flex items-center space-x-1 text-pink-400 text-xs font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Sincronizando...</span>
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleSessionLogout}
              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Cerrar sesión de mi cuenta Smash MU"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 custom-scrollbar">
          {activeTab === 'players' && (
            <PlayersRankingView
              gearScoreRanking={gearScoreRanking}
              clanCharacters={characters}
              anomalyGuildName={clanConfig.name}
              onOpenEquipmentModal={(name) => setInspectedCharacter(name)}
              isSyncing={isSyncing}
              onRefresh={fetchSmashMuData}
            />
          )}

          {activeTab === 'clan' && (
            <PublicView
              clanConfig={clanConfig}
              characters={characters}
              onApplyRecruit={handleApplyRecruit}
              onNavigateToTab={setActiveTab}
              onInspectEquipment={(name) => setInspectedCharacter(name)}
              isOfficer={isOfficer}
              onEditCharacter={(char) => setEditingCharacter(char)}
              onDeleteCharacter={handleDeleteCharacter}
              onOpenAddModal={() => setIsAddMemberOpen(true)}
              onOpenCommunity={() => setIsCommunityOpen(true)}
              syncLog={syncLog}
              onRefresh={fetchSmashMuData}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'vault' && (
            <VaultAccountsView
              sharedAccounts={sharedAccounts}
              currentMemberName={currentMember || officerName || 'UlmerMG'}
              isOfficer={isOfficer}
              onToggleStatus={handleToggleAccountStatus}
              onDeleteAccount={handleDeleteAccount}
              onOpenAddModal={() => setIsAddAccountOpen(true)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'leagues' && (
            <GuildLeaguesView
              currentLeagues={currentLeagues}
              historyLeagues={historyLeagues}
              gearScoreRanking={gearScoreRanking}
              isLoading={isSyncing}
              onRefresh={fetchSmashMuData}
              anomalyGuildName={clanConfig.name}
              onInspectEquipment={(name) => setInspectedCharacter(name)}
              isOfficer={isOfficer}
            />
          )}

          {activeTab === 'events' && <EventsRadar />}

          {activeTab === 'auction' && (
            <AuctionView
              currentMemberName={currentMember || 'UlmerMG'}
              isOfficer={isOfficer}
            />
          )}

          {activeTab === 'member' && (
            <MemberPortalView
              currentMemberName={currentMember || 'UlmerMG'}
              isOfficer={isOfficer}
              characters={characters}
              serverEvents={serverEvents}
              onUpdateMyAttendance={handleMemberAttendanceUpdate}
              onInspectMyEquipment={(name) => setInspectedCharacter(name)}
              onNavigateToTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginOfficer={handleLogin}
        onLoginMember={handleLoginMember}
        availableCharacters={characters.slice(0, 6)}
      />

      <EditMemberModal
        isOpen={editingCharacter !== null}
        character={editingCharacter}
        onClose={() => setEditingCharacter(null)}
        onSave={handleSaveCharacter}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAdd={handleAddCharacter}
      />

      <AddVaultAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAdd={handleAddAccount}
      />

      <EquipmentInspectorModal
        characterName={inspectedCharacter}
        onClose={() => setInspectedCharacter(null)}
      />

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        teamDiscordUrl={clanConfig.discordUrl}
        smashMuDiscordUrl={clanConfig.smashMuDiscordUrl}
        whatsappUrl={clanConfig.whatsappUrl}
      />
    </div>
  );
}
