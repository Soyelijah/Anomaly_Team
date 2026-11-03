import React, { useState, useMemo, useEffect } from 'react';
import {
  SmashMUGuildLeagueSeason,
  SmashMUGuildStanding,
  SmashMUGearScoreItem,
  decodeMuClass,
} from '../types/clan';
import {
  Trophy,
  Shield,
  Crown,
  Users,
  Search,
  Zap,
  CheckCircle,
  Flame,
  Calendar,
  Swords,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GuildLeaguesViewProps {
  currentLeagues: SmashMUGuildLeagueSeason[];
  historyLeagues: SmashMUGuildLeagueSeason[];
  gearScoreRanking: SmashMUGearScoreItem[];
  isLoading: boolean;
  onRefresh: () => void;
  anomalyGuildName: string;
  onInspectEquipment?: (name: string) => void;
  isOfficer?: boolean;
}

interface GroupedSeason {
  key: string;              // e.g. "TEMPORADA 5"
  displayName: string;      // e.g. "Temporada 5"
  seasonNumber: number;     // e.g. 5
  isActive: boolean;        // true if active status
  league1?: SmashMUGuildLeagueSeason; // league_type === 1
  league2?: SmashMUGuildLeagueSeason; // league_type === 2
  otherLeagues: SmashMUGuildLeagueSeason[];
  hasAnomaly: boolean;
  totalGuildsCount: number;
}

export const GuildLeaguesView: React.FC<GuildLeaguesViewProps> = ({
  currentLeagues,
  historyLeagues,
  gearScoreRanking,
  isLoading,
  onRefresh,
  anomalyGuildName,
  onInspectEquipment,
  isOfficer,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'leagues' | 'all_gs'>('leagues');
  const [selectedSeasonKey, setSelectedSeasonKey] = useState<string>('');
  const [selectedLeagueType, setSelectedLeagueType] = useState<number>(1);
  const [selectedGuildName, setSelectedGuildName] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Fast lookup map for GearScore: lowerCase(Name) -> SmashMUGearScoreItem
  const gearScoreMap = useMemo(() => {
    const map = new Map<string, { item: SmashMUGearScoreItem; rank: number }>();
    gearScoreRanking.forEach((item, index) => {
      if (item && item.Name) {
        map.set(item.Name.toLowerCase(), { item, rank: index + 1 });
      }
    });
    return map;
  }, [gearScoreRanking]);

  // Group and sort seasons by Name & Number (Temporada 5, Temporada 4, etc.)
  const groupedSeasons = useMemo<GroupedSeason[]>(() => {
    const allRaw = [...currentLeagues, ...historyLeagues];
    const map = new Map<string, GroupedSeason>();

    allRaw.forEach((season) => {
      if (!season || !season.name) return;
      const key = season.name.trim().toUpperCase();

      const containsAnomaly = season.standings?.some(
        (g) => g.guild_name.toLowerCase() === anomalyGuildName.toLowerCase()
      );

      if (!map.has(key)) {
        const matchNum = season.name.match(/\d+/);
        const num = matchNum ? parseInt(matchNum[0], 10) : 0;
        const displayName = num > 0 ? `Temporada ${num}` : season.name.trim();

        map.set(key, {
          key,
          displayName,
          seasonNumber: num,
          isActive: season.status === 'active' || currentLeagues.some((c) => c.id === season.id),
          otherLeagues: [],
          hasAnomaly: !!containsAnomaly,
          totalGuildsCount: 0,
        });
      }

      const entry = map.get(key)!;
      if (containsAnomaly) entry.hasAnomaly = true;
      if (season.status === 'active' || currentLeagues.some((c) => c.id === season.id)) {
        entry.isActive = true;
      }

      if (season.league_type === 1) {
        if (!entry.league1 || (season.standings?.length || 0) > (entry.league1.standings?.length || 0)) {
          entry.league1 = season;
        }
      } else if (season.league_type === 2) {
        if (!entry.league2 || (season.standings?.length || 0) > (entry.league2.standings?.length || 0)) {
          entry.league2 = season;
        }
      } else {
        entry.otherLeagues.push(season);
      }
    });

    map.forEach((entry) => {
      let count = 0;
      if (entry.league1?.standings) count += entry.league1.standings.length;
      if (entry.league2?.standings) count += entry.league2.standings.length;
      entry.totalGuildsCount = count;
    });

    // Sort: Active first, then by seasonNumber descending (5, 4, 3, 2, 1)
    return Array.from(map.values()).sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.seasonNumber - a.seasonNumber;
    });
  }, [currentLeagues, historyLeagues, anomalyGuildName]);

  // Auto-select latest active season on load
  useEffect(() => {
    if (groupedSeasons.length > 0) {
      if (!selectedSeasonKey || !groupedSeasons.some((s) => s.key === selectedSeasonKey)) {
        const activeOne = groupedSeasons.find((s) => s.isActive) || groupedSeasons[0];
        setSelectedSeasonKey(activeOne.key);
        if (activeOne.league1) {
          setSelectedLeagueType(1);
        } else if (activeOne.league2) {
          setSelectedLeagueType(2);
        }
      }
    }
  }, [groupedSeasons, selectedSeasonKey]);

  // Current active season group
  const currentGroup = useMemo(() => {
    return groupedSeasons.find((s) => s.key === selectedSeasonKey) || groupedSeasons[0] || null;
  }, [groupedSeasons, selectedSeasonKey]);

  // Currently resolved division
  const activeSeason = useMemo(() => {
    if (!currentGroup) return null;
    if (selectedLeagueType === 1 && currentGroup.league1) return currentGroup.league1;
    if (selectedLeagueType === 2 && currentGroup.league2) return currentGroup.league2;
    return currentGroup.league1 || currentGroup.league2 || currentGroup.otherLeagues[0] || null;
  }, [currentGroup, selectedLeagueType]);

  // Standings for active division
  const standings = activeSeason?.standings || [];

  // Active selected guild inside standings
  const activeGuild = useMemo(() => {
    if (!standings.length) return null;
    if (selectedGuildName) {
      const found = standings.find(
        (g) => g.guild_name.toLowerCase() === selectedGuildName.toLowerCase()
      );
      if (found) return found;
    }
    // If anomaly is in this division, default to anomaly
    const anomalyGuild = standings.find(
      (g) => g.guild_name.toLowerCase() === anomalyGuildName.toLowerCase()
    );
    return anomalyGuild || standings[0];
  }, [selectedGuildName, standings, anomalyGuildName]);

  // Cross roster.name with ranking.Name
  const enrichedRoster = useMemo(() => {
    if (!activeGuild || !activeGuild.roster) return [];

    return activeGuild.roster.map((member) => {
      const matched = gearScoreMap.get(member.name.toLowerCase());
      return {
        ...member,
        serverGearScore: matched ? matched.item.GearScore : member.gearscore,
        serverRank: matched ? matched.rank : undefined,
        serverClass: matched ? matched.item.Class : member.class,
        serverGuild: matched ? matched.item.Guild : activeGuild.guild_name,
        isCrossed: !!matched,
      };
    });
  }, [activeGuild, gearScoreMap]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return enrichedRoster.filter((m) => {
      const matchName = m.name.toLowerCase().includes(memberSearch.toLowerCase());
      const classInfo = decodeMuClass(m.serverClass || m.class);
      const matchClass = filterClass === 'ALL' || classInfo.category === filterClass;
      return matchName && matchClass;
    });
  }, [enrichedRoster, memberSearch, filterClass]);

  // Global GS rankings state
  const [gsSearch, setGsSearch] = useState('');
  const [gsGuildFilter, setGsGuildFilter] = useState('ALL');
  const [gsPage, setGsPage] = useState(1);
  const GS_PAGE_SIZE = 50;

  const allGuildsInGS = useMemo(() => {
    const set = new Set<string>();
    gearScoreRanking.forEach((i) => {
      if (i.Guild) set.add(i.Guild);
    });
    return Array.from(set).sort();
  }, [gearScoreRanking]);

  const allFilteredGS = useMemo(() => {
    return gearScoreRanking
      .map((item, idx) => ({ ...item, rank: idx + 1 }))
      .filter((item) => {
        const matchName = item.Name.toLowerCase().includes(gsSearch.toLowerCase());
        const matchGuild = gsGuildFilter === 'ALL' || item.Guild === gsGuildFilter;
        return matchName && matchGuild;
      });
  }, [gearScoreRanking, gsSearch, gsGuildFilter]);

  const totalGsPages = Math.max(1, Math.ceil(allFilteredGS.length / GS_PAGE_SIZE));
  const currentGsPage = Math.min(gsPage, totalGsPages);

  const paginatedGearScoreRanking = useMemo(() => {
    const start = (currentGsPage - 1) * GS_PAGE_SIZE;
    return allFilteredGS.slice(start, start + GS_PAGE_SIZE);
  }, [allFilteredGS, currentGsPage]);

  // Anomaly members in 5000 GS ranking
  const anomalyGsMembers = useMemo(() => {
    return gearScoreRanking.filter(
      (item) => item.Guild && item.Guild.toLowerCase() === anomalyGuildName.toLowerCase()
    );
  }, [gearScoreRanking, anomalyGuildName]);

  return (
    <div className="space-y-6">
      {/* Header and API Status */}
      <div className="bg-gradient-to-r from-[#0c101d] via-[#14122d] to-[#0c101d] p-6 rounded-2xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 px-3 py-0.5 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Integración Oficial: smashmu.com/api/guild-leagues &amp; gearscore</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Ligas de Guilds &amp; Cruce de GearScore (GS)</h2>
          <p className="text-xs text-slate-400">
            Organizado por Temporada y División (Liga 1 / División A y Liga 2 / División B) con cruce en vivo del roster.
          </p>
        </div>

        {isOfficer && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Recargar datos oficiales (Exclusivo Guild Master)"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5"
            >
              <Zap className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Consultando API...' : 'Recargar Datos Oficiales'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Mode */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab('leagues')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeMainTab === 'leagues'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-[#0c101d]'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-300" />
          <span>Ligas por Temporada &amp; División</span>
        </button>

        <button
          onClick={() => setActiveMainTab('all_gs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeMainTab === 'all_gs'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-[#0c101d]'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>Ranking GearScore Global (Top 5,000)</span>
        </button>
      </div>

      {/* VIEW A: LEAGUES ORGANIZED BY SEASON AND DIVISION */}
      {activeMainTab === 'leagues' && (
        <div className="space-y-5">
          {/* 1. SELECTOR DE TEMPORADAS (ORDENADO, SIN DUPLICADOS) */}
          <div className="bg-[#0c101d] p-4 rounded-xl border border-slate-800/80 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Seleccionar Temporada:</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {groupedSeasons.length} temporadas disponibles
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {groupedSeasons.map((season) => {
                const isSelected = season.key === selectedSeasonKey;
                return (
                  <button
                    key={season.key}
                    onClick={() => {
                      setSelectedSeasonKey(season.key);
                      // Default to available league
                      if (season.league1) setSelectedLeagueType(1);
                      else if (season.league2) setSelectedLeagueType(2);
                      // Reset selected guild so it picks the top guild of the new season
                      setSelectedGuildName('');
                    }}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-400/50 scale-[1.02]'
                        : 'bg-[#101426] text-slate-400 hover:text-white hover:bg-[#161c36] border border-slate-800'
                    }`}
                  >
                    <span>{season.displayName}</span>
                    {season.isActive ? (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full flex items-center space-x-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                        <span>ACTIVA</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded font-medium">
                        Historial
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELECTOR DE DIVISIÓN / LIGA (LIGA 1 vs LIGA 2) */}
          {currentGroup && (
            <div className="bg-[#0c101d] p-4 rounded-xl border border-slate-800/80 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Seleccionar División de {currentGroup.displayName}:</span>
                </span>
                <span className="text-[11px] font-mono text-purple-300">
                  {currentGroup.totalGuildsCount} Guilds en Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* LIGA 1 / DIVISIÓN A */}
                <button
                  onClick={() => {
                    if (currentGroup.league1) {
                      setSelectedLeagueType(1);
                      setSelectedGuildName('');
                    }
                  }}
                  disabled={!currentGroup.league1}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    !currentGroup.league1
                      ? 'opacity-40 cursor-not-allowed bg-slate-900/30 border-slate-800/50'
                      : selectedLeagueType === 1
                      ? 'bg-gradient-to-br from-amber-950/40 via-[#16142a] to-[#0c101d] border-amber-500/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/50'
                      : 'bg-[#101426] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-base font-black text-white">
                          Liga 1 (División A)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Mayor
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Primera división de guilds con mayor puntuación.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40 shrink-0">
                      {currentGroup.league1?.standings?.length || 0} Guilds
                    </span>
                  </div>

                  {currentGroup.league1?.standings?.some(
                    (g) => g.guild_name.toLowerCase() === anomalyGuildName.toLowerCase()
                  ) && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] text-purple-300 font-semibold bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/40">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>ANOMALY compite aquí</span>
                    </div>
                  )}
                </button>

                {/* LIGA 2 / DIVISIÓN B */}
                <button
                  onClick={() => {
                    if (currentGroup.league2) {
                      setSelectedLeagueType(2);
                      setSelectedGuildName('');
                    }
                  }}
                  disabled={!currentGroup.league2}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    !currentGroup.league2
                      ? 'opacity-40 cursor-not-allowed bg-slate-900/30 border-slate-800/50'
                      : selectedLeagueType === 2
                      ? 'bg-gradient-to-br from-purple-950/40 via-[#16142a] to-[#0c101d] border-purple-500/80 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/50'
                      : 'bg-[#101426] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-base font-black text-white">
                          Liga 2 (División B)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Ascenso
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Segunda división y torneos de clanes en ascenso.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/40 shrink-0">
                      {currentGroup.league2?.standings?.length || 0} Guilds
                    </span>
                  </div>

                  {currentGroup.league2?.standings?.some(
                    (g) => g.guild_name.toLowerCase() === anomalyGuildName.toLowerCase()
                  ) && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] text-purple-300 font-semibold bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/40">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>ANOMALY compite aquí</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. CONTEXT BANNER DEL TORNEO ACTIVO */}
          {activeSeason && (
            <div className="bg-gradient-to-r from-[#0d1122] via-[#14122d] to-[#0d1122] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    selectedLeagueType === 1
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}
                >
                  {selectedLeagueType === 1 ? <Trophy className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-white">
                      {currentGroup?.displayName} ·{' '}
                      {selectedLeagueType === 1 ? 'Liga 1 (División A)' : 'Liga 2 (División B)'}
                    </span>
                    {activeSeason.status === 'active' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>En Vivo / Activa</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Finalizada
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3">
                    <span>
                      Guilds registradas: <strong className="text-white">{standings.length}</strong>
                    </span>
                    {activeSeason.starts_at && (
                      <span>
                        Inicio:{' '}
                        <strong className="text-slate-300">
                          {new Date(activeSeason.starts_at).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                    {activeSeason.ends_at && (
                      <span>
                        Fin:{' '}
                        <strong className="text-slate-300">
                          {new Date(activeSeason.ends_at).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {anomalyGsMembers.length > 0 && (
                <div className="flex items-center space-x-2 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-purple-200">
                    {anomalyGsMembers.length} PJs de ANOMALY en Top GS
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. 2-COLUMN SPLIT: STANDINGS (LEFT) + ENRICHED ROSTER (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* STANDINGS LIST (LEFT COLUMN) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center space-x-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Tabla de Posiciones</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">{standings.length} Guilds</span>
              </div>

              {standings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0c101d] rounded-xl border border-slate-800 text-xs">
                  No hay guilds registradas en esta división.
                </div>
              ) : (
                <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                  {standings.map((guild) => {
                    const isSelected = activeGuild?.guild_name === guild.guild_name;
                    const isAnomaly = guild.guild_name.toLowerCase() === anomalyGuildName.toLowerCase();

                    return (
                      <div
                        key={guild.guild_name}
                        onClick={() => setSelectedGuildName(guild.guild_name)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-950/40 ring-1 ring-purple-400/40'
                            : isAnomaly
                            ? 'bg-[#120f26] border-purple-500/40 hover:border-purple-400'
                            : 'bg-[#0c101d] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono shadow-sm ${
                                guild.rank === 1
                                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                                  : guild.rank === 2
                                  ? 'bg-slate-300 text-slate-950'
                                  : guild.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {guild.rank}
                            </span>
                            <span
                              className={`font-black text-sm tracking-wide ${
                                isAnomaly ? 'text-purple-300 font-extrabold' : 'text-white'
                              }`}
                            >
                              {guild.guild_name}
                            </span>
                            {isAnomaly && (
                              <span className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                                Tu Clan
                              </span>
                            )}
                          </div>

                          <span className="font-mono tabular-nums text-xs font-black text-amber-400">
                            {guild.total_points.toLocaleString()} pts
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <div>
                            <span className="block text-[10px] text-slate-500">Master:</span>
                            <span className="text-slate-300 font-semibold truncate block">
                              {guild.guild_master || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500">Miembros:</span>
                            <span className="text-cyan-300 font-mono font-semibold">{guild.member_count}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500">GS Total:</span>
                            <span className="text-purple-300 font-mono font-bold">
                              {guild.guild_gearscore?.toLocaleString() || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CROSSED ROSTER (RIGHT COLUMN) */}
            <div className="lg:col-span-8 bg-[#0c101d] rounded-2xl p-5 border border-slate-800 space-y-4">
              {activeGuild ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Roster de la Guild:</span>
                        <span className="text-lg font-black text-white">{activeGuild.guild_name}</span>
                        <span className="text-xs font-mono text-purple-400">
                          ({activeGuild.member_count} integrantes)
                        </span>
                        {activeGuild.guild_name.toLowerCase() === anomalyGuildName.toLowerCase() && (
                          <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                            ANOMALY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Líder:{' '}
                        <span className="text-amber-400 font-bold">{activeGuild.guild_master}</span> ·{' '}
                        GearScore Promedio:{' '}
                        <span className="font-mono text-cyan-300">
                          {activeGuild.member_count > 0
                            ? Math.round(activeGuild.guild_gearscore / activeGuild.member_count)
                            : 0}{' '}
                          GS
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Buscar en roster..."
                          className="bg-[#080b15] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-36 sm:w-48"
                        />
                      </div>

                      <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="ALL">Todas las Clases</option>
                        <option value="BK">BK / BM</option>
                        <option value="SM">SM / GM</option>
                        <option value="ELF">ELF / HE</option>
                        <option value="DL">DL / LE</option>
                        <option value="MG">MG / DM</option>
                        <option value="SUM">SUM / DiM</option>
                        <option value="RF">RF / FM</option>
                      </select>
                    </div>
                  </div>

                  {/* CROSSED ROSTER TABLE */}
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#080b15] border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Personaje</th>
                          <th className="p-3">Clase (Mu Online)</th>
                          <th className="p-3">GearScore Cruzado</th>
                          <th className="p-3">Ranking Global GS</th>
                          <th className="p-3">Puntos Liga</th>
                          <th className="p-3 text-right">Estatus Oficial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredRoster.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500">
                              No hay personajes que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredRoster.map((member, idx) => {
                            const classInfo = decodeMuClass(member.serverClass || member.class);

                            return (
                              <tr key={member.name} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-3 font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-1.5 font-bold text-white">
                                    <button
                                      onClick={() => onInspectEquipment?.(member.name)}
                                      className="hover:text-purple-300 hover:underline text-left transition-colors flex items-center space-x-1"
                                      title="Clic para ver ítems y equipamiento real"
                                    >
                                      <span>{member.name}</span>
                                    </button>
                                    {member.is_master && (
                                      <span title="Guild Master">
                                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classInfo.colorClass}`}
                                    title={`Código original: ${member.class}`}
                                  >
                                    {classInfo.name} ({classInfo.code})
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-1 font-mono font-bold text-amber-400 tabular-nums">
                                    <span>{member.serverGearScore?.toLocaleString()} GS</span>
                                    {member.isCrossed && (
                                      <span title="Verificado con Ranking Gearscore de 5000 jugadores">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-cyan-300">
                                  {member.serverRank ? (
                                    <span className="bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                                      #{member.serverRank} Servidor
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-semibold text-purple-300">
                                  {member.points.toLocaleString()} pts
                                </td>
                                <td className="p-3 text-right">
                                  {member.counts_for_score ? (
                                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/30">
                                      Aporta al Score
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">Reserva</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">Selecciona una guild para ver su nómina.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: ALL GEARSCORE RANKING (5,000 PLAYERS) */}
      {activeMainTab === 'all_gs' && (
        <div className="bg-[#0c101d] rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Ranking GearScore Global del Servidor Smash</span>
              </h3>
              <p className="text-xs text-slate-400">
                Total registrado: {gearScoreRanking.length.toLocaleString()} jugadores cargados de la API de Smash MU.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={gsSearch}
                  onChange={(e) => setGsSearch(e.target.value)}
                  placeholder="Buscar jugador..."
                  className="bg-[#080b15] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={gsGuildFilter}
                onChange={(e) => setGsGuildFilter(e.target.value)}
                className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none max-w-[160px]"
              >
                <option value="ALL">Todas las Guilds</option>
                {allGuildsInGS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080b15] border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Rank #</th>
                  <th className="p-3">Personaje</th>
                  <th className="p-3">Clase</th>
                  <th className="p-3">Guild</th>
                  <th className="p-3 text-right">GearScore (GS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedGearScoreRanking.map((item: any) => {
                  const classInfo = decodeMuClass(item.Class);
                  const isAnomaly = item.Guild && item.Guild.toLowerCase() === anomalyGuildName.toLowerCase();

                  return (
                    <tr
                      key={item.Name}
                      className={`virtual-row hover:bg-slate-800/30 transition-colors ${
                        isAnomaly ? 'bg-purple-950/30' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-400">#{item.rank}</td>
                      <td className="p-3 font-bold text-white flex items-center space-x-1.5">
                        <button
                          onClick={() => onInspectEquipment?.(item.Name)}
                          className="hover:text-purple-300 hover:underline text-left transition-colors"
                          title="Clic para ver equipamiento e ítems"
                        >
                          {item.Name}
                        </button>
                        {isAnomaly && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-900 text-purple-200">
                            ANOMALY
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classInfo.colorClass}`}>
                          {classInfo.name} ({classInfo.code})
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{item.Guild || '—'}</td>
                      <td className="p-3 font-mono font-black text-amber-400 tabular-nums text-right">
                        {item.GearScore.toLocaleString()} GS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* GS Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div>
              Mostrando del{' '}
              <span className="font-bold text-white">
                {((currentGsPage - 1) * GS_PAGE_SIZE + 1).toLocaleString()}
              </span>{' '}
              al{' '}
              <span className="font-bold text-white">
                {Math.min(currentGsPage * GS_PAGE_SIZE, allFilteredGS.length).toLocaleString()}
              </span>{' '}
              de <span className="font-bold text-purple-400">{allFilteredGS.length.toLocaleString()}</span> personajes
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setGsPage((p) => Math.max(1, p - 1))}
                disabled={currentGsPage <= 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1 rounded-lg bg-[#080b15] border border-slate-800 font-mono text-purple-300">
                Pág. {currentGsPage} de {totalGsPages}
              </span>
              <button
                onClick={() => setGsPage((p) => Math.min(totalGsPages, p + 1))}
                disabled={currentGsPage >= totalGsPages}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
