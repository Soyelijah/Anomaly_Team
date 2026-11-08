import React, { useState, useEffect } from 'react';
import { Character, CharacterClass, SquadRole } from '../types/clan';
import {
  Search,
  UserPlus,
  ArrowUpDown,
  Edit2,
  Trash2,
  RefreshCw,
  Crown,
  Eye,
  LayoutGrid,
  List,
  Shield,
  Swords,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

interface RosterViewProps {
  characters: Character[];
  isOfficer: boolean;
  onEditCharacter: (char: Character) => void;
  onDeleteCharacter: (id: string) => void;
  onOpenAddModal: () => void;
  onInspectEquipment: (characterName: string) => void;
  syncLog: string[];
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const RosterView: React.FC<RosterViewProps> = ({
  characters,
  isOfficer,
  onEditCharacter,
  onDeleteCharacter,
  onOpenAddModal,
  onInspectEquipment,
  syncLog,
  onRefresh,
  isSyncing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSquad, setSelectedSquad] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'resets' | 'level' | 'rank' | 'gearscore'>('gearscore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Responsive default: Cards on screens < 1024px, Table on desktop
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };
    handleResize();
  }, []);

  const getClassBadge = (cls: CharacterClass) => {
    switch (cls) {
      case 'BK':
        return 'bg-red-950/80 text-red-300 border-red-700/60';
      case 'SM':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'ELF':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'DL':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'MG':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'SUM':
        return 'bg-pink-950/80 text-pink-300 border-pink-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSquadName = (squad: SquadRole) => {
    switch (squad) {
      case 'frontline':
        return 'Frontline (Tanque)';
      case 'support':
        return 'Support & Buff';
      case 'seal':
        return 'Sello & Corona';
      case 'disruptor':
        return 'Disruptor / Debuff';
    }
  };

  const handleSort = (field: 'name' | 'resets' | 'level' | 'rank' | 'gearscore') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredCharacters = characters
    .filter((char) => {
      const matchSearch =
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.build.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.note.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === 'ALL' || char.characterClass === selectedClass;
      const matchSquad = selectedSquad === 'ALL' || char.squad === selectedSquad;
      return matchSearch && matchClass && matchSquad;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'gearscore') comparison = (a.gearscore || 0) - (b.gearscore || 0);
      else if (sortField === 'resets') comparison = a.resets - b.resets;
      else if (sortField === 'level') comparison = a.level - b.level;
      else if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'rank') comparison = (a.rank || 99) - (b.rank || 99);
      return sortAsc ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      {/* Sincronización Terminal Status - EXCLUSIVO PARA GUILD MASTER */}
      {isOfficer && (
        <div className="bg-[#0c101d] border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-slate-300 uppercase tracking-wider truncate">
                Monitor de Sincronización Smash MU API (Exclusivo Guild Master)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-mono text-[11px] text-slate-500">
                smashmu.com: profiles / gearscore
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-bold rounded text-[11px] flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Consulta la API oficial de Smash MU para actualizar Resets y Niveles"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Consultando...' : 'Recargar Resets & Niveles'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#070a14] border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 max-h-24 overflow-y-auto space-y-1">
            {syncLog.map((log, index) => (
              <div key={index} className="leading-tight">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster Controls: Search, Filters, View Mode Toggle & Actions */}
      <div className="bg-[#0c101d] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                Nómina Oficial &amp; Rankings del Clan ANOMALY
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40 font-mono shrink-0">
                {filteredCharacters.length} PJs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Datos verificados desde Smash MU combinados con estrategia de guerra.
            </p>
          </div>

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* View Mode Toggle Button */}
            <div className="inline-flex rounded-lg bg-[#080b15] border border-slate-700/80 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de Tarjetas Tácticas (Ideal para móviles y tablets)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de Tabla Completa con columna fija"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por personaje o build..."
                className="bg-[#080b15] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-full sm:w-48 md:w-56"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 flex-1 sm:flex-initial min-w-[125px]"
            >
              <option value="ALL">Todas las Clases</option>
              <option value="BK">Blade Knight (BK)</option>
              <option value="SM">Soul Master (SM)</option>
              <option value="ELF">Muse Elf (ELF)</option>
              <option value="DL">Dark Lord (DL)</option>
              <option value="MG">Magic Gladiator (MG)</option>
              <option value="SUM">Summoner (SUM)</option>
            </select>

            {/* Squad Filter */}
            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 flex-1 sm:flex-initial min-w-[125px]"
            >
              <option value="ALL">Todos Escuadrones</option>
              <option value="frontline">Frontline (Tanque)</option>
              <option value="support">Support &amp; Buff</option>
              <option value="seal">Sello &amp; Corona</option>
              <option value="disruptor">Disruptor / Debuff</option>
            </select>

            {/* Add Character button for Officer */}
            {isOfficer && (
              <button
                onClick={onOpenAddModal}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-sm ml-auto sm:ml-0 shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar PJ</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================== VIEW MODE 1: CARDS (Responsive & Mobile-Ready) ===================== */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-2">
            {filteredCharacters.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 bg-[#080b15] rounded-xl border border-slate-800">
                No se encontraron personajes que coincidan con los filtros aplicados.
              </div>
            ) : (
              filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="bg-[#080b15] border border-slate-800/90 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3.5 group shadow-sm hover:shadow-lg hover:shadow-purple-950/20"
                >
                  {/* Card Header: Online dot, Name, Class Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            char.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                          }`}
                          title={char.online ? 'Online' : 'Offline'}
                        />
                        <button
                          onClick={() => onInspectEquipment(char.name)}
                          className="font-bold text-white text-base hover:text-purple-300 transition-colors truncate text-left"
                          title="Clic para inspeccionar equipamiento real en Smash MU"
                        >
                          {char.name}
                        </button>
                        {char.isMaster && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            <span>GM</span>
                          </span>
                        )}
                        {char.category === 'buffer' && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 shrink-0">
                            Buffer
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {char.classNameTitle || char.characterClass}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${getClassBadge(
                        char.characterClass
                      )}`}
                    >
                      {char.characterClass}
                    </span>
                  </div>

                  {/* Stats Grid: Level, Resets, GearScore */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0c101d] p-2.5 rounded-lg border border-slate-800/80 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Nivel</div>
                      <div className="text-cyan-300 font-bold text-xs sm:text-sm">{char.level}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Resets</div>
                      <div className="text-amber-400 font-bold text-xs sm:text-sm">{char.resets} RR</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">GearScore</div>
                      <div className="text-purple-300 font-bold text-xs sm:text-sm">
                        {char.gearscore ? `${char.gearscore.toLocaleString()} GS` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Build & Strategy */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-300 leading-snug font-medium line-clamp-2">
                      <span className="text-slate-500 text-[11px]">Build: </span>
                      {char.build}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-purple-300 font-medium truncate">
                        {getSquadName(char.squad)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          char.attendance === 'confirmed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : char.attendance === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            : 'bg-red-950 text-red-300 border border-red-800/40'
                        }`}
                      >
                        {char.attendance === 'confirmed'
                          ? 'Confirmado'
                          : char.attendance === 'pending'
                          ? 'Pendiente'
                          : 'Ausente'}
                      </span>
                    </div>

                    {char.note && (
                      <div className="text-[11px] text-slate-400 italic line-clamp-1">
                        "{char.note}"
                      </div>
                    )}
                  </div>

                  {/* Actions: Prominent Full-Width Inspect Button (Never gets cut off) */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => onInspectEquipment(char.name)}
                      className="flex-1 py-2 px-3 text-xs font-bold text-purple-200 hover:text-white bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Ver Ítems y Equipamiento Real en Smash MU"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Inspeccionar Equipo Real</span>
                    </button>

                    {isOfficer && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => onEditCharacter(char)}
                          className="p-2 text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 rounded-xl border border-cyan-800/40 transition-colors cursor-pointer"
                          title="Editar Datos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCharacter(char.id)}
                          className="p-2 text-red-400 hover:text-red-300 bg-red-950/60 hover:bg-red-900 rounded-xl border border-red-800/40 transition-colors cursor-pointer"
                          title="Quitar Personaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================== VIEW MODE 2: TABLE (With Sticky Pinned Actions Column) ===================== */}
        {viewMode === 'table' && (
          <div className="relative overflow-x-auto border border-slate-800 rounded-xl custom-scrollbar w-full">
            <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
              <thead className="bg-[#080b15] border-b border-slate-800 text-slate-400 font-semibold select-none">
                <tr>
                  <th className="p-3 w-20">Estado</th>
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <span className="flex items-center space-x-1">
                      <span>Personaje</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </span>
                  </th>
                  <th className="p-3 w-20">Clase</th>
                  <th
                    onClick={() => handleSort('level')}
                    className="p-3 cursor-pointer hover:text-white transition-colors w-20"
                  >
                    <span className="flex items-center space-x-1">
                      <span>Nivel</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort('resets')}
                    className="p-3 cursor-pointer hover:text-white transition-colors w-24"
                  >
                    <span className="flex items-center space-x-1">
                      <span>Resets</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort('gearscore')}
                    className="p-3 cursor-pointer hover:text-white transition-colors w-28"
                  >
                    <span className="flex items-center space-x-1">
                      <span>GearScore</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </span>
                  </th>
                  <th className="p-3 min-w-[200px]">Build / Estrategia</th>
                  <th className="p-3 w-36">Escuadrón</th>
                  <th className="p-3 w-28">Asistencia</th>
                  <th className="p-3 min-w-[160px]">Nota Interna</th>

                  {/* STICKY RIGHT COLUMN HEADER - ALWAYS VISIBLE */}
                  <th className="p-3 text-right sticky right-0 bg-[#080b15] shadow-[-12px_0_16px_rgba(0,0,0,0.8)] z-10 w-44">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCharacters.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No se encontraron personajes que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredCharacters.map((char) => (
                    <tr
                      key={char.id}
                      className="group hover:bg-[#12172b] transition-colors"
                    >
                      <td className="p-3">
                        <span className="inline-flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              char.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-[11px] text-slate-400">
                            {char.online ? 'Online' : 'Offline'}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => onInspectEquipment(char.name)}
                            className="hover:text-purple-300 hover:underline text-left transition-colors font-bold text-white flex items-center space-x-1 cursor-pointer"
                            title="Clic para ver ítems y equipamiento real en Smash MU"
                          >
                            <span>{char.name}</span>
                          </button>
                          {char.isMaster && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              <span>GM</span>
                            </span>
                          )}
                          {char.category === 'buffer' && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                              Buffer
                            </span>
                          )}
                        </div>
                        {char.classNameTitle && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {char.classNameTitle}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getClassBadge(
                            char.characterClass
                          )}`}
                        >
                          {char.characterClass}
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-cyan-300">{char.level}</td>
                      <td className="p-3 font-mono tabular-nums font-bold text-amber-400">
                        {char.resets} RR
                      </td>
                      <td className="p-3 font-mono tabular-nums text-purple-300 font-semibold">
                        {char.gearscore ? (
                          <span className="bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded text-[11px]">
                            {char.gearscore.toLocaleString()} GS
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-200">{char.build}</td>
                      <td className="p-3">
                        <span className="text-[11px] text-purple-300 font-medium">
                          {getSquadName(char.squad)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            char.attendance === 'confirmed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : char.attendance === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                              : 'bg-red-950 text-red-300 border border-red-800/40'
                          }`}
                        >
                          {char.attendance === 'confirmed'
                            ? 'Confirmado'
                            : char.attendance === 'pending'
                            ? 'Pendiente'
                            : 'Ausente'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                        {char.note || '—'}
                      </td>

                      {/* STICKY RIGHT COLUMN CELL - NEVER CLIPPED, ALWAYS ON SCREEN */}
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap sticky right-0 bg-[#0c101d] group-hover:bg-[#12172b] shadow-[-12px_0_16px_rgba(0,0,0,0.8)] z-10 transition-colors">
                        <button
                          onClick={() => onInspectEquipment(char.name)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Ver Ítems y Equipamiento Real en Smash MU"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          <span>Inspeccionar</span>
                        </button>
                        {isOfficer && (
                          <>
                            <button
                              onClick={() => onEditCharacter(char)}
                              className="p-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 rounded border border-cyan-800/40 cursor-pointer"
                              title="Editar Datos de Personaje"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteCharacter(char.id)}
                              className="p-1 text-red-400 hover:text-red-300 bg-red-950/60 rounded border border-red-800/40 cursor-pointer"
                              title="Quitar Personaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
