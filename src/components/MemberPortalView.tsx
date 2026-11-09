import React, { useState, useEffect } from 'react';
import { Character, ServerEvent, SmashMUEquipmentItem, SmashMUCharacterProfile } from '../types/clan';
import { GuildMark } from './GuildMark';
import { TeamMemberSession } from './TeamAuthGate';
import {
  Shield,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Calendar,
  Package,
  ChevronRight,
  Send,
  ExternalLink,
  Users,
  Gavel,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MemberPortalViewProps {
  currentMemberName: string;
  isOfficer: boolean;
  characters: Character[];
  serverEvents: ServerEvent[];
  onUpdateMyAttendance: (characterName: string, status: 'confirmed' | 'pending' | 'absent') => void;
  onInspectMyEquipment: (characterName: string) => void;
  onNavigateToTab: (tab: string) => void;
  session?: TeamMemberSession | null;
  clanConfigName?: string;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  currentMemberName,
  isOfficer,
  characters,
  serverEvents,
  onUpdateMyAttendance,
  onInspectMyEquipment,
  onNavigateToTab,
  session,
  clanConfigName = 'Anomaly',
}) => {
  const [profile, setProfile] = useState<SmashMUCharacterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [eventCheckIns, setEventCheckIns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`anomaly_checkins_${currentMemberName}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [requestText, setRequestText] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Find character in local state (if they are part of Anomaly roster)
  const myCharacter = characters.find(
    (c) => c.name.toLowerCase() === currentMemberName.toLowerCase()
  );

  // Detect guild affiliation from Smash MU API profile, current session, or clan roster
  const profileGuildRaw = profile?.character?.guild?.name || (typeof profile?.character?.guild === 'string' ? profile?.character?.guild : null);
  const sessionGuildRaw = session?.syncedData?.guild;
  const characterGuildRaw = myCharacter?.guild;

  const detectedGuildName: string = profileGuildRaw || sessionGuildRaw || characterGuildRaw || 'Sin Clan';

  // Check if player is an authentic member or officer of ANOMALY
  const isAnomalyMember: boolean =
    isOfficer ||
    (session?.role === 'officer' || session?.role === 'member') ||
    (typeof detectedGuildName === 'string' &&
      detectedGuildName.toLowerCase() === clanConfigName.toLowerCase()) ||
    Boolean(myCharacter);

  const isGuildMaster: boolean = Boolean(
    myCharacter?.isMaster ||
    profile?.character?.guild?.isMaster ||
    session?.syncedData?.isMaster ||
    currentMemberName.toLowerCase() === 'ulmermg'
  );

  // Fetch real items and equipment for this member from Smash MU API
  useEffect(() => {
    let isCancelled = false;
    setLoadingProfile(true);

    const fetchProfile = async () => {
      try {
        let res = await fetch(`/api/smash/profile/${encodeURIComponent(currentMemberName)}`);
        if (!res.ok) {
          res = await fetch(
            `https://www.smashmu.com/api/profile/${encodeURIComponent(currentMemberName)}?realm=smash`
          );
        }
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.success) {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error('Error fetching member profile:', err);
      } finally {
        if (!isCancelled) setLoadingProfile(false);
      }
    };

    fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [currentMemberName]);

  const toggleEventCheckIn = (eventId: string) => {
    const next = { ...eventCheckIns, [eventId]: !eventCheckIns[eventId] };
    setEventCheckIns(next);
    localStorage.setItem(`anomaly_checkins_${currentMemberName}`, JSON.stringify(next));
  };

  const handleSendVaultRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false);
      setRequestText('');
    }, 3500);
  };

  const equippedItems = (profile?.equipment || []).filter((e: SmashMUEquipmentItem) => !e.isEmpty);

  return (
    <div className="space-y-8">
      {/* Member Hero Card */}
      <section className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-gradient-to-br from-[#0b0e1d] via-[#10152e] to-[#1a1236] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            {isAnomalyMember ? (
              <GuildMark size={6} className="border-purple-400/50 mt-1 sm:mt-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40 mt-1 sm:mt-0">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">{currentMemberName}</span>

                {/* Clan Membership Badge */}
                {isGuildMaster ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>GUILD MASTER</span>
                  </span>
                ) : isAnomalyMember ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span>MIEMBRO DE ANOMALY</span>
                  </span>
                ) : detectedGuildName && detectedGuildName !== 'Sin Clan' ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-700/50 flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>CLAN: {detectedGuildName.toUpperCase()}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>JUGADOR SIN CLAN · SMASH MU</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 font-mono">
                <span className="text-purple-300 font-semibold">
                  {profile?.character?.className || myCharacter?.classNameTitle || myCharacter?.characterClass || 'Personaje Smash MU'}
                </span>
                <span>·</span>
                <span className="text-cyan-300">
                  Nivel {profile?.character?.level ?? myCharacter?.level ?? 400}
                </span>
                <span>·</span>
                <span className="text-amber-400 font-bold">
                  {profile?.character?.resets ?? myCharacter?.resets ?? 0} Resets
                </span>
                <span>·</span>
                <span className="text-purple-300 font-bold">
                  {profile?.character?.gearScore ?? myCharacter?.gearscore ?? '—'} GearScore
                </span>
              </div>

              <p className="text-xs text-slate-400 italic pt-1">
                {isAnomalyMember
                  ? '"Panel personal del miembro para supervisar artículos, confirmar asistencia a asedios y registrar participación en eventos."'
                  : '"Panel personal de jugador sincronizado con Smash MU. Consulta tus artículos equipados, participa en la subasta del baúl y revisa el radar de eventos."'}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onInspectMyEquipment(currentMemberName)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-purple-200" />
              <span>Ver Mis Artículos &amp; Equipamiento Real</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Equipment Summary & Castle Siege Attendance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Castle Siege Attendance & Tactical Orders */}
          {isAnomalyMember ? (
            <div className="bg-[#0c101d] rounded-2xl p-6 border border-purple-500/30 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Mi Asistencia al Castle Siege (Domingo 20:00 UTC)</h3>
                </div>
                <span className="text-xs font-mono text-purple-300">Valle de Loren</span>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-slate-300 font-semibold block">
                  Selecciona tu estado de asistencia para este domingo:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateMyAttendance(currentMemberName, 'confirmed')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      myCharacter?.attendance === 'confirmed'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                        : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirmado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateMyAttendance(currentMemberName, 'pending')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      myCharacter?.attendance === 'pending'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50 ring-2 ring-amber-500/30'
                        : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>En Duda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateMyAttendance(currentMemberName, 'absent')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      myCharacter?.attendance === 'absent'
                        ? 'bg-red-950 border-red-500 text-red-300 shadow-md shadow-red-950/50 ring-2 ring-red-500/30'
                        : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>Ausente</span>
                  </button>
                </div>

                {/* Squad Assignment and Tactical Orders (ANOMALY Only) */}
                <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Mi Escuadrón Asignado:</span>
                    <span className="text-purple-300 font-bold uppercase tracking-wider bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/40">
                      {myCharacter?.squad === 'seal'
                        ? 'Corona & Pedestal (Sello)'
                        : myCharacter?.squad === 'support'
                        ? 'Support & Buffs'
                        : myCharacter?.squad === 'disruptor'
                        ? 'Disruptores & Switches'
                        : 'Frontline (Choque & Puertas)'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Órdenes Tácticas del Mando de Anomaly:</span>
                    <div className="text-slate-200 leading-relaxed font-mono text-[11px] bg-black/40 p-2.5 rounded border border-slate-800/60">
                      {myCharacter?.squad === 'seal'
                        ? '🎯 Avanzar con escolta hasta el trono interior. Ocupar el pedestal principal y sellar la corona con apoyo de buff de SD y vida.'
                        : myCharacter?.squad === 'support'
                        ? '✨ Mantener Greater Damage, Greater Defense y Soul Barrier activos en toda la party de choque.'
                        : myCharacter?.squad === 'disruptor'
                        ? '⚡ Neutralizar los switches 1 y 2, anular a los atacantes rivales y crear distracción en el patio.'
                        : '⚔️ Romper la primera puerta de entrada en el puente. Contener a los rivales con combo reflect y choque frontal.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* External / Sin Clan notice for Castle Siege */
            <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Asistencia al Castle Siege (Domingo 20:00 UTC)</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Valle de Loren</span>
              </div>

              <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800/90 space-y-3.5">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-400 shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Estado: {detectedGuildName === 'Sin Clan' ? 'Jugador Independiente (Sin Clan)' : `Miembro del Clan ${detectedGuildName}`}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tu personaje <strong className="text-cyan-300">{currentMemberName}</strong> no pertenece a la Guild <strong className="text-pink-400">ANOMALY</strong> en Smash MU. La asignación de escuadrones de asedio (Frontline, Support, Corona) y las órdenes tácticas del mando están reservadas exclusivamente para los integrantes oficiales del clan.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    ¿Deseas postularte para unirte a ANOMALY y participar en el Asedio?
                  </span>
                  <a
                    href="https://discord.gg/VqDMBHkGGe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Postularme en Discord</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Real Equipment & Items Preview */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Mis Artículos Equipados en Servidor</h3>
              </div>
              <button
                onClick={() => onInspectMyEquipment(currentMemberName)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>Inspección Detallada</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="py-8 text-center text-slate-400 text-xs">Cargando equipamiento en vivo...</div>
            ) : equippedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {equippedItems.slice(0, 8).map((item) => (
                  <div
                    key={item.slotIndex}
                    onClick={() => onInspectMyEquipment(currentMemberName)}
                    className="p-3 rounded-xl bg-[#080b15] border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="w-12 h-12 mx-auto flex items-center justify-center p-1 bg-black/40 rounded-lg">
                      <img
                        src={`https://www.smashmu.com${item.imagePath}`}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono font-bold">
                        {item.level > 0 ? `+${item.level}` : 'Nivel 0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No se detectaron ítems en el perfil de Smash MU o están privados.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Events Participation & Vault Supplies (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 3: Events Participation & Check-in */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Mis Participaciones en Eventos</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {Object.values(eventCheckIns).filter(Boolean).length} / {serverEvents.length} Marcados
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Marca los eventos a los que asistirás o en los que participaste esta semana para el seguimiento de actividad:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {serverEvents.map((event) => {
                const isChecked = !!eventCheckIns[event.id];

                return (
                  <div
                    key={event.id}
                    onClick={() => toggleEventCheckIn(event.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isChecked
                        ? 'bg-purple-950/40 border-purple-500/50 text-white'
                        : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold">{event.name}</div>
                      <div className="text-[10px] text-slate-500">Cada {event.intervalHours} horas · {event.zone}</div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs ${
                        isChecked
                          ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                          : 'border-slate-700 bg-slate-900 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Vault Supply Request or External Info */}
          {isAnomalyMember ? (
            <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Solicitar Suministros del Clan</h3>
              </div>

              <p className="text-xs text-slate-400">
                ¿Necesitas pociones de vida élite, pociones de SD complejas o joyas para el asedio? Envía una solicitud directa al Guild Master:
              </p>

              {requestSent ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>¡Solicitud enviada a UlmerMG! Se revisará en Discord.</span>
                </div>
              ) : (
                <form onSubmit={handleSendVaultRequest} className="space-y-2">
                  <textarea
                    required
                    rows={2}
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="Ej: Necesito 1 pack de Pociones SD para el Sello del Domingo..."
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Pedido de Suministro</span>
                  </button>
                </form>
              )}

              <div className="pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('vault')}
                  className="w-full py-2 bg-purple-950/70 hover:bg-purple-900 border border-purple-700/50 text-purple-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>Ver Cuentas Compartidas &amp; Elfas de Buff</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Package className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Baúl del Clan &amp; Cuentas Compartidas</h3>
              </div>

              <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800 text-xs space-y-3">
                <p className="text-slate-300 leading-relaxed">
                  El acceso a las <strong className="text-purple-300">Elfas de Buff comunitarias</strong>, cuentas de mulas y distribución de suministros del clan es de uso exclusivo para los integrantes oficiales de <strong className="text-pink-400">ANOMALY</strong>.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Como jugador registrado en la plataforma, puedes comerciar y adquirir artículos directamente a través de nuestra <strong className="text-amber-300">Subasta del Baúl</strong>.
                </p>

                <button
                  type="button"
                  onClick={() => onNavigateToTab('auction')}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 border border-amber-500/40 text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Gavel className="w-4 h-4 text-amber-400" />
                  <span>Ir a la Subasta del Baúl (Pujas Abiertas)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
