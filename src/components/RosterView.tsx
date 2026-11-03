import React, { useState } from 'react';
import { Character, CharacterClass, SquadRole } from '../types/clan';
import { Search, UserPlus, ArrowUpDown, Edit2, Trash2, RefreshCw, Crown, Eye } from 'lucide-react';

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
        <div className="bg-[#0c101d] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                Monitor de Sincronización Smash MU API (Exclusivo Guild Master)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-[11px] text-slate-500">
                smashmu.com: profiles / gearscore / leagues
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-bold rounded text-[11px] flex items-center space-x-1.5 transition-colors disabled:opacity-50"
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

      {/* Roster Controls: Search, Filters & Actions */}
      <div className="bg-[#0c101d] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="truncate">Nómina Oficial &amp; Rankings del Clan ANOMALY</span>
            </h2>
            <p className="text-xs text-slate-400">
              Datos de nivel y resets extraídos del servidor combinados con roles de guerra internos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
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

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 flex-1 sm:flex-initial min-w-[130px]"
            >
              <option value="ALL">Todas las Clases</option>
              <option value="BK">Blade Knight (BK)</option>
              <option value="SM">Soul Master (SM)</option>
              <option value="ELF">Muse Elf (ELF)</option>
              <option value="DL">Dark Lord (DL)</option>
              <option value="MG">Magic Gladiator (MG)</option>
              <option value="SUM">Summoner (SUM)</option>
            </select>

            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 flex-1 sm:flex-initial min-w-[130px]"
            >
              <option value="ALL">Todos los Escuadrones</option>
              <option value="frontline">Frontline (Tanque)</option>
              <option value="support">Support &amp; Buff</option>
              <option value="seal">Sello &amp; Corona</option>
              <option value="disruptor">Disruptor / Debuff</option>
            </select>

            {isOfficer && (
              <button
                onClick={onOpenAddModal}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-sm ml-auto sm:ml-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar Personaje</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl custom-scrollbar w-full">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="bg-[#080b15] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Estado</th>
                <th
                  onClick={() => handleSort('name')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center space-x-1">
                    <span>Personaje</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </span>
                </th>
                <th className="p-3">Clase</th>
                <th
                  onClick={() => handleSort('level')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center space-x-1">
                    <span>Nivel</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('resets')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center space-x-1">
                    <span>Resets</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('gearscore')}
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center space-x-1">
                    <span>GearScore (GS)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </span>
                </th>
                <th className="p-3">Build / Estrategia</th>
                <th className="p-3">Escuadrón de Asedio</th>
                <th className="p-3">Asistencia</th>
                <th className="p-3">Nota Interna</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCharacters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    No se encontraron personajes que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCharacters.map((char) => (
                  <tr key={char.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <span className="inline-flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
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
                          className="hover:text-purple-300 hover:underline text-left transition-colors font-bold text-white flex items-center space-x-1"
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
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onInspectEquipment(char.name)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 rounded-lg transition-all shadow-sm active:scale-95"
                        title="Ver Ítems y Equipamiento Real en Smash MU"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>Inspeccionar</span>
                      </button>
                      {isOfficer && (
                        <>
                          <button
                            onClick={() => onEditCharacter(char)}
                            className="p-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 rounded border border-cyan-800/40"
                            title="Editar Datos de Personaje"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCharacter(char.id)}
                            className="p-1 text-red-400 hover:text-red-300 bg-red-950/60 rounded border border-red-800/40"
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
      </div>
    </div>
  );
};
