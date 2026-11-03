import React, { useState, useMemo } from 'react';
import { DKPMember, DKPLogEntry, CharacterClass } from '../types/clan';
import { initialDKPMembers, initialDKPLogs } from '../data/initialData';
import {
  Coins,
  Trophy,
  Award,
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface DKPViewProps {
  isOfficer: boolean;
  currentMemberName?: string;
}

export const DKPView: React.FC<DKPViewProps> = ({ isOfficer, currentMemberName = 'UlmerMG' }) => {
  const [members, setMembers] = useState<DKPMember[]>(() => {
    const saved = localStorage.getItem('anomaly_dkp_members');
    if (saved) {
      try {
        const parsed: DKPMember[] = JSON.parse(saved);
        if (parsed.some((p) => p.currentDKP === 420 || p.lastEventAttended?.includes('Tarkan'))) {
          localStorage.removeItem('anomaly_dkp_members');
          return initialDKPMembers;
        }
        return parsed;
      } catch (e) {
        return initialDKPMembers;
      }
    }
    return initialDKPMembers;
  });

  const [logs, setLogs] = useState<DKPLogEntry[]>(() => {
    const saved = localStorage.getItem('anomaly_dkp_logs');
    if (saved) {
      try {
        const parsed: DKPLogEntry[] = JSON.parse(saved);
        if (parsed.some((l) => l.reason?.includes('Rune Blade +11'))) {
          localStorage.removeItem('anomaly_dkp_logs');
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);

  // New DKP Award Form State
  const [awardMember, setAwardMember] = useState(members[0]?.characterName || '');
  const [awardAmount, setAwardAmount] = useState<number>(15);
  const [awardReason, setAwardReason] = useState('Asistencia a Invasión de Dragones Dorados');
  const [awardSuccess, setAwardSuccess] = useState(false);

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchName = m.characterName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchClass = classFilter === 'ALL' || m.characterClass === classFilter;
        return matchName && matchClass;
      })
      .sort((a, b) => b.currentDKP - a.currentDKP);
  }, [members, searchTerm, classFilter]);

  const totalDkpCirculating = useMemo(() => {
    return members.reduce((acc, m) => acc + m.currentDKP, 0);
  }, [members]);

  const totalAttendances = useMemo(() => {
    return members.reduce((acc, m) => acc + m.attendances, 0);
  }, [members]);

  const handleAwardDKP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardMember || awardAmount === 0) return;

    // Update member points
    const updatedMembers = members.map((m) => {
      if (m.characterName === awardMember) {
        const newCurrent = Math.max(0, m.currentDKP + awardAmount);
        const newLifetime = awardAmount > 0 ? m.lifetimeEarned + awardAmount : m.lifetimeEarned;
        const newSpent = awardAmount < 0 ? m.lifetimeSpent + Math.abs(awardAmount) : m.lifetimeSpent;
        const newAttendances = awardAmount > 0 ? m.attendances + 1 : m.attendances;
        return {
          ...m,
          currentDKP: newCurrent,
          lifetimeEarned: newLifetime,
          lifetimeSpent: newSpent,
          attendances: newAttendances,
          lastEventAttended: awardReason,
        };
      }
      return m;
    });

    const newLog: DKPLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      characterName: awardMember,
      amount: awardAmount,
      reason: awardReason,
      awardedBy: `${currentMemberName} (Oficial)`,
    };

    const updatedLogs = [newLog, ...logs];

    setMembers(updatedMembers);
    setLogs(updatedLogs);
    localStorage.setItem('anomaly_dkp_members', JSON.stringify(updatedMembers));
    localStorage.setItem('anomaly_dkp_logs', JSON.stringify(updatedLogs));

    setAwardSuccess(true);
    setTimeout(() => {
      setAwardSuccess(false);
      setIsAwardModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0c101d] via-[#12132a] to-[#0c101d] p-6 rounded-2xl border border-pink-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-pink-300 bg-pink-500/10 px-3 py-0.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-pink-400" />
            <span>Sistema Oficial de Mérito &amp; Asistencia</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">DKP del Clan Anomaly</h2>
          <p className="text-xs text-slate-400">
            Puntos por participar en invasiones, bosses y eventos. Usa tus DKP acumulados para canjear o pujar por ítems en la <strong>Subasta del Clan</strong>.
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={() => setIsAwardModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar DKP de Asistencia</span>
          </button>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0c101d] p-4 rounded-xl border border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">DKP Circulando</div>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {totalDkpCirculating.toLocaleString()} DKP
            </div>
          </div>
        </div>

        <div className="bg-[#0c101d] p-4 rounded-xl border border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Miembros en el Sistema</div>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {members.length} Guerreros
            </div>
          </div>
        </div>

        <div className="bg-[#0c101d] p-4 rounded-xl border border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Asistencias a Eventos</div>
            <div className="text-2xl font-black text-cyan-300 font-mono tabular-nums">
              {totalAttendances} Registradas
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: DKP Ranking (Left) + Activity Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Member DKP Leaderboard */}
        <div className="lg:col-span-8 bg-[#0c101d] rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Award className="w-4 h-4 text-pink-400" />
                <span>Tabla de Puntos DKP de Anomaly</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clasificación de mérito actualizada de los miembros del clan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar miembro..."
                  className="bg-[#080b15] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 w-36 sm:w-44"
                />
              </div>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Clases</option>
                <option value="BK">BK / BM</option>
                <option value="SM">SM / GM</option>
                <option value="ELF">ELF / HE</option>
                <option value="DL">DL / LE</option>
                <option value="MG">MG / DM</option>
                <option value="SUM">SUM / DiM</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080b15] border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Personaje</th>
                  <th className="p-3">Clase</th>
                  <th className="p-3">DKP Disponible</th>
                  <th className="p-3">Asistencias</th>
                  <th className="p-3">Último Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredMembers.map((member, index) => {
                  const isTop3 = index < 3;
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            index === 0
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                              : index === 1
                              ? 'bg-slate-300 text-slate-950'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{member.characterName}</span>
                          {member.characterName === 'UlmerMG' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                              GM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-purple-300 border border-slate-700">
                          {member.characterClass}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-black text-pink-400 tabular-nums">
                        {member.currentDKP.toLocaleString()} DKP
                      </td>
                      <td className="p-3 font-mono text-cyan-300">
                        {member.attendances} eventos
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-[170px]">
                        {member.lastEventAttended}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: DKP Activity Log */}
        <div className="lg:col-span-4 bg-[#0c101d] rounded-2xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Registro de Actividad Reciente</span>
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-[#080b15] rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <p className="font-semibold text-slate-400">Sin registros de DKP aún</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Los oficiales pueden registrar puntos por asistencia a eventos usando el botón superior.
                  </p>
                </div>
              ) : (
                logs.map((log) => {
                  const isPositive = log.amount > 0;
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#080b15] border border-slate-800/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{log.characterName}</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center space-x-0.5 ${
                            isPositive
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : 'bg-red-950/80 text-red-300 border border-red-800/50'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>
                            {isPositive ? `+${log.amount}` : log.amount} DKP
                          </span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">{log.reason}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                        <span>{log.date}</span>
                        <span>{log.awardedBy}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1 text-slate-300">
            <div className="font-bold text-purple-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Cómo funciona el DKP en Anomaly?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ganas DKP al conectarte a eventos clave (Blood Castle, Crywolf, Maya, Invasiones). Luego puedes usar tus DKP para comprar o ganar en subastas los mejores drops del clan sin gastar tu Zen ni tus Joyas.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Award DKP */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1222] border border-pink-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Coins className="w-4 h-4 text-pink-400" />
                <span>Registrar Mérito / DKP</span>
              </h3>
              <button
                onClick={() => setIsAwardModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>

            {awardSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 flex items-center space-x-2 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>¡Puntos DKP registrados y actualizados correctamente!</span>
              </div>
            ) : (
              <form onSubmit={handleAwardDKP} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Miembro del Clan</label>
                  <select
                    value={awardMember}
                    onChange={(e) => setAwardMember(e.target.value)}
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-pink-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.characterName}>
                        {m.characterName} ({m.characterClass} · {m.currentDKP} DKP)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cantidad de Puntos (Positivo suma, Negativo descuenta)
                  </label>
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Motivo / Evento</label>
                  <input
                    type="text"
                    required
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    placeholder="Ej: Asistencia a Invasión de Dragones Dorados"
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAwardModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all shadow-md"
                  >
                    Confirmar Registro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
