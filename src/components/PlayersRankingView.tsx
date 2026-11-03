import React, { useState, useMemo, useEffect } from 'react';
import {
  SmashMUGearScoreItem,
  SmashMUCharacterProfile,
  Character,
  decodeMuClass,
} from '../types/clan';
import { Character3DViewer } from './Character3DViewer';
import { GuildMark } from './GuildMark';
import {
  Search,
  Trophy,
  Crown,
  Users,
  Shield,
  Eye,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface PlayersRankingViewProps {
  gearScoreRanking: SmashMUGearScoreItem[];
  clanCharacters: Character[];
  anomalyGuildName: string;
  onOpenEquipmentModal: (name: string) => void;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const PlayersRankingView: React.FC<PlayersRankingViewProps> = ({
  gearScoreRanking,
  clanCharacters,
  anomalyGuildName,
  onOpenEquipmentModal,
  isSyncing,
  onRefresh,
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedGuild, setSelectedGuild] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOnlyMyGuild, setIsOnlyMyGuild] = useState(false);

  // Selected character for the right-hand persistent 3D inspector
  const [selectedCharName, setSelectedCharName] = useState<string>('SkyTM');
  const [selectedProfile, setSelectedProfile] = useState<SmashMUCharacterProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Load selected character profile for 3D preview
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingProfile(true);

    const loadChar = async () => {
      try {
        let res = await fetch(`/api/smash/profile/${encodeURIComponent(selectedCharName)}`);
        if (!res.ok) {
          res = await fetch(
            `https://www.smashmu.com/api/profile/${encodeURIComponent(selectedCharName)}?realm=smash`
          );
        }
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.success && data.character) {
            setSelectedProfile(data);
          }
        }
      } catch (err) {
        // Fallback profile if offline
      } finally {
        if (!isCancelled) setIsLoadingProfile(false);
      }
    };

    loadChar();

    return () => {
      isCancelled = true;
    };
  }, [selectedCharName]);

  // Unique guilds list
  const availableGuilds = useMemo(() => {
    const set = new Set<string>();
    gearScoreRanking.forEach((item) => {
      if (item.Guild) set.add(item.Guild);
    });
    return Array.from(set).sort((a, b) => {
      if (a.toLowerCase() === anomalyGuildName.toLowerCase()) return -1;
      if (b.toLowerCase() === anomalyGuildName.toLowerCase()) return 1;
      return a.localeCompare(b);
    });
  }, [gearScoreRanking, anomalyGuildName]);

  // Filtered ranking list
  const filteredRanking = useMemo(() => {
    return gearScoreRanking
      .map((item, index) => ({ ...item, rank: index + 1 }))
      .filter((item) => {
        const matchesSearch = item.Name.toLowerCase().includes(searchTerm.toLowerCase());
        const classInfo = decodeMuClass(item.Class);
        const matchesClass =
          selectedClass === 'ALL' ||
          classInfo.category === selectedClass ||
          classInfo.name.toLowerCase().includes(selectedClass.toLowerCase());
        const matchesGuild =
          isOnlyMyGuild
            ? item.Guild?.toLowerCase() === anomalyGuildName.toLowerCase()
            : selectedGuild === 'ALL' || item.Guild === selectedGuild;

        return matchesSearch && matchesClass && matchesGuild;
      });
  }, [gearScoreRanking, searchTerm, selectedClass, selectedGuild, isOnlyMyGuild, anomalyGuildName]);

  const totalPages = Math.max(1, Math.ceil(filteredRanking.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedList = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredRanking.slice(start, start + pageSize);
  }, [filteredRanking, pageIndex, pageSize]);

  // Find selected item data
  const selectedStanding = useMemo(() => {
    return (
      filteredRanking.find(
        (i) => i.Name.toLowerCase() === selectedCharName.toLowerCase()
      ) ||
      gearScoreRanking.find(
        (i) => i.Name.toLowerCase() === selectedCharName.toLowerCase()
      ) || {
        Name: selectedCharName,
        Class: selectedProfile?.character?.class ?? 2,
        GearScore: selectedProfile?.character?.gearScore ?? 1355,
        Guild: selectedProfile?.character?.guild?.name ?? 'ANOMALY',
      }
    );
  }, [filteredRanking, gearScoreRanking, selectedCharName, selectedProfile]);

  const selectedClassInfo = decodeMuClass(
    selectedProfile?.character?.class ?? (selectedStanding as any).Class ?? 2
  );

  // Quick equipment previews for right column (Casco, Armadura, Alas)
  const quickItems = useMemo(() => {
    if (!selectedProfile?.equipment) return [];
    const slots = [2, 3, 7];
    return slots
      .map((s) => {
        const item = selectedProfile.equipment.find((e) => e.slotIndex === s && !e.isEmpty);
        const label = s === 2 ? 'Casco' : s === 3 ? 'Armadura' : 'Alas';
        return { slot: s, label, item };
      })
      .filter((q) => !!q.item);
  }, [selectedProfile]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Datos públicos oficiales de Smash MU</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Total indexado: {gearScoreRanking.length.toLocaleString()} guerreros
        </div>
      </div>

      {/* Main Split Layout: Table on Left / 3D Character on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (Ranking de jugadores) */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-4">
          {/* Header Title & 'Mi guild' Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
                Ranking de jugadores
              </h2>
              <div className="text-xs text-pink-400 font-mono font-semibold tracking-wide">
                Gear Score Oficial
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsOnlyMyGuild((v) => !v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md ${
                  isOnlyMyGuild
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-pink-900/40 ring-2 ring-pink-400'
                    : 'bg-[#1a0f1d] hover:bg-[#27142b] text-pink-300 border border-pink-500/30'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mi guild (ANOMALY)</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isSyncing}
                title="Sincronizar con API de Smash MU"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pink-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Bar matching Causarex */}
          <div className="bg-[#090b14] border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search Input */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar personaje..."
                  className="w-full bg-[#060810] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              {/* Class Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#060810] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition-colors"
                >
                  <option value="ALL">Todas las clases</option>
                  <option value="BK">Blade Knight / BM</option>
                  <option value="SM">Soul Master / GM</option>
                  <option value="ELF">Muse Elf / HE</option>
                  <option value="MG">Magic Gladiator / DM</option>
                  <option value="DL">Dark Lord / LE</option>
                  <option value="SUM">Summoner / DiM</option>
                  <option value="RF">Rage Fighter / FM</option>
                </select>
              </div>

              {/* Guild Dropdown */}
              <div className="sm:col-span-2">
                <select
                  value={selectedGuild}
                  disabled={isOnlyMyGuild}
                  onChange={(e) => {
                    setSelectedGuild(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#060810] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-40"
                >
                  <option value="ALL">Todas las guilds</option>
                  {availableGuilds.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rows Count Dropdown */}
              <div className="sm:col-span-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#060810] border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-pink-500 font-mono transition-colors"
                >
                  <option value={10}>Filas 10</option>
                  <option value={20}>Filas 20</option>
                  <option value={50}>Filas 50</option>
                </select>
              </div>
            </div>

            {/* Sub-status Indicator */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>
                  {isOnlyMyGuild ? 'Filtrando roster de ANOMALY' : 'Cobertura del servidor Smash MU'}
                </span>
              </span>
              <span>
                {filteredRanking.length.toLocaleString()} personajes coincidentes
              </span>
            </div>
          </div>

          {/* Ranking Table matching Causarex */}
          <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-[#070912] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#05070e] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Personaje</th>
                    <th className="py-3.5 px-4">Clase</th>
                    <th className="py-3.5 px-4">Guild</th>
                    <th className="py-3.5 px-4 text-right">GS Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No se encontraron personajes con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item) => {
                      const classInfo = decodeMuClass(item.Class);
                      const isSelected = selectedCharName.toLowerCase() === item.Name.toLowerCase();
                      const isAnomaly =
                        item.Guild?.toLowerCase() === anomalyGuildName.toLowerCase();

                      return (
                        <tr
                          key={item.Name}
                          onClick={() => setSelectedCharName(item.Name)}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-transparent border-l-4 border-pink-500'
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          {/* Rank # with Crowns */}
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {item.rank === 1 ? (
                              <span className="inline-flex items-center justify-center text-amber-400 font-black">
                                <Crown className="w-4 h-4 mr-0.5 inline" /> 1
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="text-slate-300 font-black">🥈 2</span>
                            ) : item.rank === 3 ? (
                              <span className="text-amber-600 font-black">🥉 3</span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">{item.rank}</span>
                            )}
                          </td>

                          {/* Personaje with Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              {/* Avatar Emblem */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? 'bg-pink-600 text-white shadow-md shadow-pink-900/50 ring-2 ring-pink-400'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {item.Name.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                                <span>{item.Name}</span>
                                {isAnomaly && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-700/40 font-mono">
                                    ANOMALY
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Clase Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-flex items-center space-x-1 ${classInfo.colorClass}`}
                            >
                              <span>{classInfo.name}</span>
                            </span>
                          </td>

                          {/* Guild with Mark */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {item.Guild ? (
                                <>
                                  <div className="w-3.5 h-3.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-sm shrink-0" />
                                  <span
                                    className={`font-semibold ${
                                      isAnomaly ? 'text-purple-300 font-bold' : 'text-slate-300'
                                    }`}
                                  >
                                    {item.Guild}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-500">Sin Guild</span>
                              )}
                            </div>
                          </td>

                          {/* GearScore */}
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-black font-mono text-pink-400 tracking-tight">
                              {item.GearScore.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-[#05070e] border-t border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
              <div className="text-[11px] font-mono">
                Mostrando{' '}
                <span className="text-white font-bold">
                  {((pageIndex - 1) * pageSize + 1).toLocaleString()}
                </span>{' '}
                al{' '}
                <span className="text-white font-bold">
                  {Math.min(pageIndex * pageSize, filteredRanking.length).toLocaleString()}
                </span>{' '}
                de <span className="text-pink-400 font-bold">{filteredRanking.length.toLocaleString()}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pageIndex <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-[#080b15] border border-slate-800 font-mono text-xs text-pink-300 font-bold">
                  {pageIndex} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageIndex >= totalPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Persistent Live 3D Character Stage & Inspector) matching Causarex */}
        <div className="xl:col-span-5 2xl:col-span-4 sticky top-6 space-y-3">
          {/* Selected Character Header Card */}
          <div className="bg-[#080b15] border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <GuildMark size={5} className="border-pink-500/50" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-pink-400 font-bold">
                    PERSONAJE SELECCIONADO
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-wide leading-none mt-0.5">
                    {selectedCharName}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    <span className="text-purple-300 font-semibold">{selectedClassInfo.name}</span>
                    <span> · </span>
                    <span className="text-slate-300 font-medium">
                      {(selectedStanding as any).Guild || 'ANOMALY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big GearScore callout */}
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-black font-mono text-pink-400 tracking-tight leading-none">
                  {((selectedStanding as any).GearScore || 1355).toLocaleString()}{' '}
                  <span className="text-xs font-semibold text-slate-400">GS actual</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Nivel {selectedProfile?.character?.level || 400}
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Live 3D Model Stage */}
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-[#08080e] shadow-2xl">
            {isLoadingProfile ? (
              <div className="h-[440px] flex flex-col items-center justify-center bg-[#070a13] space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                <div className="text-xs font-mono text-slate-300">
                  Cargando modelo 3D de {selectedCharName}...
                </div>
              </div>
            ) : selectedProfile ? (
              <Character3DViewer profile={selectedProfile} />
            ) : (
              <div className="h-[440px] flex items-center justify-center text-xs text-slate-500">
                Selecciona un personaje de la lista para ver su modelo 3D.
              </div>
            )}
          </div>

          {/* Quick Equipment Preview Cards (Casco, Armadura, Alas) */}
          {quickItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {quickItems.map(({ slot, label, item }) => (
                <div
                  key={slot}
                  className="bg-[#090e18] border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-between text-center transition-all hover:border-pink-500/40"
                >
                  <div className="h-11 w-full flex items-center justify-center">
                    {item?.imagePath ? (
                      <img
                        src={`https://www.smashmu.com${item.imagePath}`}
                        alt={item.name}
                        className="max-h-10 max-w-[50px] object-contain filter drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Shield className="w-5 h-5 text-slate-700" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono truncate w-full mt-1">
                    {label} <strong className="text-amber-400">+{item?.level || 0}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prominent 'Ver equipamiento' Magenta Button */}
          <button
            onClick={() => onOpenEquipmentModal(selectedCharName)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm tracking-wide uppercase transition-all shadow-xl shadow-pink-950/60 flex items-center justify-center space-x-2 active:scale-[0.99] border border-pink-400/40"
          >
            <Eye className="w-4 h-4 text-white" />
            <span>Ver equipamiento completo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
