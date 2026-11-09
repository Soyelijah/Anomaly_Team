import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  Globe,
  Radio,
  Check,
  RotateCcw,
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

interface ClanSupplyRequestItem {
  id: string;
  characterName: string;
  supplyType: string;
  quantity: string;
  urgency: 'normal' | 'media' | 'alta';
  notes: string;
  status: 'pendiente' | 'aprobado' | 'entregado' | 'rechazado';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  reviewedBy?: string;
}

interface InvasionAttendanceItem {
  id: string;
  characterName: string;
  date: string;
  invasionSlot: '14:00' | '19:00' | '23:00';
  checkInTime?: string;
  checkOutTime?: string;
  userTimeZone: string;
  status: 'completado' | 'en_progreso';
  updatedAt: string;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  currentMemberName,
  isOfficer,
  characters,
  serverEvents: _serverEvents,
  onUpdateMyAttendance,
  onInspectMyEquipment,
  onNavigateToTab,
  session,
  clanConfigName = 'Anomaly',
}) => {
  const [profile, setProfile] = useState<SmashMUCharacterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Timezone auto-detection
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago';
    } catch {
      return 'America/Santiago';
    }
  }, []);

  // Invasion slots in Chilean time (CLT)
  const invasionSlots: Array<{
    slot: '14:00' | '19:00' | '23:00';
    chileHour: number;
    title: string;
    description: string;
  }> = [
    {
      slot: '14:00',
      chileHour: 14,
      title: 'Invasión de Tarde (14:00 hrs CLT)',
      description: 'Dragones Dorados, Kundun Menor e Invasión de Verano.',
    },
    {
      slot: '19:00',
      chileHour: 19,
      title: 'Invasión Estelar (19:00 hrs CLT)',
      description: 'Jefes principales, Cajas Kundun +4/+5 y drop de Joyas de la Bendición.',
    },
    {
      slot: '23:00',
      chileHour: 23,
      title: 'Invasión Nocturna (23:00 hrs CLT)',
      description: 'Invasión masiva del clan para farm de pociones SD y materiales de asedio.',
    },
  ];

  // Invasions Attendance state
  const [invasionRecords, setInvasionRecords] = useState<InvasionAttendanceItem[]>([]);
  const [loadingInvasions, setLoadingInvasions] = useState(false);
  const [invasionFeedback, setInvasionFeedback] = useState<string | null>(null);

  // Supply Requests state
  const [mySupplyRequests, setMySupplyRequests] = useState<ClanSupplyRequestItem[]>([]);
  const [allSupplyRequests, setAllSupplyRequests] = useState<ClanSupplyRequestItem[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [supplyType, setSupplyType] = useState('Pociones de SD (Complex / SD Potions)');
  const [supplyQuantity, setSupplyQuantity] = useState('30 Pociones SD');
  const [supplyUrgency, setSupplyUrgency] = useState<'normal' | 'media' | 'alta'>('normal');
  const [supplyNotes, setSupplyNotes] = useState('');
  const [submittingSupply, setSubmittingSupply] = useState(false);
  const [supplySuccessMsg, setSupplySuccessMsg] = useState<string | null>(null);

  // GM Response state
  const [gmResponseNote, setGmResponseNote] = useState<Record<string, string>>({});

  // Find character in local state
  const myCharacter = characters.find(
    (c) => c.name.toLowerCase() === currentMemberName.toLowerCase()
  );

  // Detect guild affiliation
  const profileGuildRaw =
    profile?.character?.guild?.name ||
    (typeof profile?.character?.guild === 'string' ? profile?.character?.guild : null);
  const sessionGuildRaw = session?.syncedData?.guild;
  const characterGuildRaw = myCharacter?.guild;
  const detectedGuildName: string =
    profileGuildRaw || sessionGuildRaw || characterGuildRaw || 'Sin Clan';

  // Check membership
  const isAnomalyMember: boolean =
    isOfficer ||
    session?.role === 'officer' ||
    session?.role === 'member' ||
    (typeof detectedGuildName === 'string' &&
      detectedGuildName.toLowerCase() === clanConfigName.toLowerCase()) ||
    Boolean(myCharacter);

  const isGuildMaster: boolean = Boolean(
    myCharacter?.isMaster ||
    profile?.character?.guild?.isMaster ||
    session?.syncedData?.isMaster ||
    currentMemberName.toLowerCase() === 'ulmermg'
  );

  // Helper to calculate exact local time for an invasion slot
  const formatSlotLocalTime = (chileHour: number) => {
    try {
      const now = new Date();
      // Date in Santiago
      const santiagoParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now); // "YYYY-MM-DD"

      const santiagoDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const santiagoOffsetMin = Math.round((santiagoDate.getTime() - utcDate.getTime()) / 60000);

      const [y, m, d] = santiagoParts.split('-').map(Number);
      const targetUtcMs = Date.UTC(y, m - 1, d, chileHour, 0, 0) - santiagoOffsetMin * 60000;
      const targetDate = new Date(targetUtcMs);

      return targetDate.toLocaleTimeString([], {
        timeZone: userTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return `${String(chileHour).padStart(2, '0')}:00`;
    }
  };

  // Fetch real items and equipment
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

  // Fetch invasion attendance
  const loadInvasions = async () => {
    setLoadingInvasions(true);
    try {
      const res = await fetch(`/api/clan/invasion-attendance?characterName=${encodeURIComponent(currentMemberName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setInvasionRecords(data.records);
        }
      }
    } catch (err) {
      console.warn('Error loading invasion attendance:', err);
    } finally {
      setLoadingInvasions(false);
    }
  };

  // Fetch supply requests
  const loadSupplies = async () => {
    setLoadingSupplies(true);
    try {
      // My requests
      const myRes = await fetch(`/api/clan/supply-requests?characterName=${encodeURIComponent(currentMemberName)}`);
      if (myRes.ok) {
        const data = await myRes.json();
        if (data.success && Array.isArray(data.requests)) {
          setMySupplyRequests(data.requests);
        }
      }

      // If officer or GM, fetch all requests for the inbox
      if (isOfficer || isGuildMaster) {
        const allRes = await fetch(`/api/clan/supply-requests`);
        if (allRes.ok) {
          const dataAll = await allRes.json();
          if (dataAll.success && Array.isArray(dataAll.requests)) {
            setAllSupplyRequests(dataAll.requests);
          }
        }
      }
    } catch (err) {
      console.warn('Error loading supplies:', err);
    } finally {
      setLoadingSupplies(false);
    }
  };

  useEffect(() => {
    loadInvasions();
    loadSupplies();
  }, [currentMemberName, isOfficer, isGuildMaster]);

  // Handle Check-in / Check-out for invasions
  const handleInvasionCheck = async (
    slot: '14:00' | '19:00' | '23:00',
    checkType: 'check_in' | 'check_out',
    localTimeStr: string
  ) => {
    try {
      const res = await fetch('/api/clan/invasion-attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: currentMemberName,
          invasionSlot: slot,
          checkType,
          userTimeZone,
          localTimeStr,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInvasionFeedback(
            checkType === 'check_in'
              ? `¡Entrada registrada a las ${localTimeStr} para la invasión de las ${slot} hrs CLT!`
              : `¡Check completado! Salida registrada para la invasión de las ${slot} hrs CLT.`
          );
          setTimeout(() => setInvasionFeedback(null), 4000);
          loadInvasions();
        }
      }
    } catch (err) {
      console.error('Error checking invasion:', err);
    }
  };

  // Submit supply request
  const handleSubmitSupplyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyQuantity.trim()) return;

    setSubmittingSupply(true);
    try {
      const res = await fetch('/api/clan/supply-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: currentMemberName,
          supplyType,
          quantity: supplyQuantity,
          urgency: supplyUrgency,
          notes: supplyNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSupplySuccessMsg(
            '¡Solicitud enviada a la bandeja de UlmerMG (Guild Master)! Se notificará en Discord.'
          );
          setSupplyNotes('');
          loadSupplies();
          setTimeout(() => setSupplySuccessMsg(null), 5000);
        }
      }
    } catch (err) {
      console.error('Error submitting supply:', err);
    } finally {
      setSubmittingSupply(false);
    }
  };

  // GM Action on supply request
  const handleUpdateSupplyStatus = async (
    id: string,
    status: 'aprobado' | 'entregado' | 'rechazado'
  ) => {
    try {
      const note = gmResponseNote[id] || '';
      const res = await fetch(`/api/clan/supply-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: note,
          reviewerName: currentMemberName,
        }),
      });
      if (res.ok) {
        loadSupplies();
      }
    } catch (err) {
      console.error('Error updating supply status:', err);
    }
  };

  const equippedItems = (profile?.equipment || []).filter((e: SmashMUEquipmentItem) => !e.isEmpty);

  // Today in Chile date
  const todayChileStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

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
                  ? '"Panel táctico oficial para coordinar invasiones, solicitar suministros a intendencia y preparar el asedio."'
                  : '"Panel personal de jugador sincronizado con Smash MU. Consulta tus artículos equipados y participa en la subasta del baúl."'}
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
        {/* Left Column: Castle Siege Preparation & Real Equipment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Castle Siege Preparation & Real Recommendations */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-purple-500/30 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Fase de Preparación: Castle Siege (Valle de Loren)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                PRÓXIMAMENTE · ASIGNACIÓN ACTIVA
              </span>
            </div>

            <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800 space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                El asedio oficial al Castillo de Loren en Smash MU se encuentra en fase preparatoria para el clan. La fecha del primer asedio y la apertura del trono serán programadas por la administración de Smash MU y convocadas por el Guild Master (<strong className="text-white">UlmerMG</strong>).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="p-3 rounded-lg bg-[#0c101d] border border-purple-500/20 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-purple-400 font-bold flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Meta de Resets &amp; Nivel</span>
                  </div>
                  <div className="text-slate-200 font-semibold">Nivel 400 &amp; 200+ Resets</div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Para asegurar puntos de stats máximos (Fuerza, Agilidad, Vida, Energía/Comando).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#0c101d] border border-cyan-500/20 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>Equipamiento Estratégico</span>
                  </div>
                  <div className="text-slate-200 font-semibold">Armas +13/+15 &amp; Harmony</div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Sets de guerra con opciones reflect/damage reduction y alas nivel 3 para mitigación.
                  </p>
                </div>
              </div>

              {/* Roles por Clase para Asedio */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-2 font-semibold">Roles Clave del Clan en Asedio:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-amber-300 font-bold">Dark Lord (DL):</span> Comando alto para aura de daño de clan y sello del trono.
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-red-300 font-bold">Blade Master (BM):</span> Frontline de choque con reflect y combo en puertas y puentes.
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-purple-300 font-bold">Grand Master (SM):</span> Soul Barrier maxeado y daño zonal para proteger a la party.
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-emerald-300 font-bold">High Elf (ME):</span> Greater Damage y Greater Defense continuos para sustain.
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Confirmation for when GM schedules */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">
                Confirma tu disponibilidad de combate para la convocatoria del GM:
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
                  <span>Disponible</span>
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
                  <span>No Disponible</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Real Equipment & Items Preview */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
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

        {/* Right Column: Daily Invasions & Supply Requests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 3: Invasiones Diarias del Clan (14:00, 19:00, 23:00 Hora Chilena) */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-cyan-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="font-bold text-white text-base">Invasiones Diarias del Clan</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[140px]">{userTimeZone}</span>
              </span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-[#080b15] p-3 rounded-xl border border-slate-800/80">
              <div className="font-semibold text-white mb-1">⏰ Horario Oficial de Invasiones:</div>
              <p className="text-slate-400 text-[11px]">
                El clan coordina 3 invasiones diarias: <strong className="text-cyan-300">14:00 hrs, 19:00 hrs y 23:00 hrs (Hora Chilena)</strong>. A continuación se muestra la hora sincronizada en tu país. Da clic en <strong className="text-emerald-300">Entrada</strong> al iniciar y en <strong className="text-cyan-300">Salida</strong> para completar el check.
              </p>
            </div>

            {invasionFeedback && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{invasionFeedback}</span>
              </div>
            )}

            {/* The 3 Daily Invasions Cards */}
            <div className="space-y-3">
              {invasionSlots.map(({ slot, chileHour, title, description }) => {
                const localTime = formatSlotLocalTime(chileHour);
                const attendance = invasionRecords.find(
                  (r) => r.invasionSlot === slot && r.date === todayChileStr
                );

                const hasCheckIn = Boolean(attendance?.checkInTime);
                const hasCheckOut = Boolean(attendance?.checkOutTime);
                const isCompleted = attendance?.status === 'completado' || (hasCheckIn && hasCheckOut);

                return (
                  <div
                    key={slot}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : hasCheckIn
                        ? 'bg-cyan-950/20 border-cyan-500/40'
                        : 'bg-[#080b15] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>{title}</span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                          Tu hora local: <strong className="text-white">{localTime} hrs</strong> ({userTimeZone})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{description}</div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : hasCheckIn
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isCompleted ? '✓ Check Completo' : hasCheckIn ? 'En Curso' : 'Sin Check'}
                      </span>
                    </div>

                    {/* Attendance timestamps if available */}
                    {attendance && (
                      <div className="text-[10px] font-mono text-slate-400 bg-black/40 p-1.5 rounded flex items-center justify-between">
                        <span>Entrada: {attendance.checkInTime || '—'}</span>
                        <span>Salida: {attendance.checkOutTime || 'Pendiente'}</span>
                      </div>
                    )}

                    {/* Check Action Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      {!hasCheckIn ? (
                        <button
                          type="button"
                          onClick={() => handleInvasionCheck(slot, 'check_in', localTime)}
                          className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Marcar Entrada (Check-In)</span>
                        </button>
                      ) : !hasCheckOut ? (
                        <button
                          type="button"
                          onClick={() => handleInvasionCheck(slot, 'check_out', localTime)}
                          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar Salida (Completar Check)</span>
                        </button>
                      ) : (
                        <div className="w-full py-1.5 px-3 bg-emerald-950/40 text-emerald-300 font-mono text-xs rounded-lg text-center border border-emerald-500/30">
                          ✓ Asistencia registrada en Discord del clan
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Solicitar Suministros del Clan & Historial */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Solicitar Suministros del Clan</h3>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Intendencia Oficial
              </span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-[#080b15] p-3 rounded-xl border border-slate-800/80">
              <div className="font-semibold text-white mb-0.5">¿A dónde llega esta solicitud?</div>
              <p className="text-slate-400 text-[11px]">
                Llega directamente a la bandeja privada de gestión del <strong className="text-amber-300">Guild Master (UlmerMG)</strong> y se notifica al canal interno de intendencia en Discord. Al ser aprobada, el GM te entregará los suministros en el servidor o autorizará el retiro del baúl comunitario.
              </p>
            </div>

            {supplySuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{supplySuccessMsg}</span>
              </div>
            )}

            {/* Request Form */}
            <form onSubmit={handleSubmitSupplyRequest} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tipo de Suministro Requerido:
                </label>
                <select
                  value={supplyType}
                  onChange={(e) => setSupplyType(e.target.value)}
                  className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Pociones de SD (Complex / SD Potions)">Pociones de SD (Complex / SD Potions para PvP)</option>
                  <option value="Pociones de Gran Vida / Élite">Pociones de Gran Vida / Élite</option>
                  <option value="Joyas de la Bendición (Jewel of Bless)">Joyas de la Bendición (Jewel of Bless)</option>
                  <option value="Joyas del Alma (Jewel of Soul)">Joyas del Alma (Jewel of Soul)</option>
                  <option value="Armadura / Arma de Apoyo para Asedio">Armadura / Arma de Apoyo para Asedio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Cantidad Requerida:
                  </label>
                  <input
                    type="text"
                    required
                    value={supplyQuantity}
                    onChange={(e) => setSupplyQuantity(e.target.value)}
                    placeholder="Ej: 30 Pociones SD o 20 Bless"
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Nivel de Urgencia:
                  </label>
                  <select
                    value={supplyUrgency}
                    onChange={(e) => setSupplyUrgency(e.target.value as any)}
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="normal">Normal (Para leveo)</option>
                    <option value="media">Media (Invasión del día)</option>
                    <option value="alta">Alta (Asedio / Invasión 23:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Motivo o Notas para el Guild Master:
                </label>
                <textarea
                  rows={2}
                  value={supplyNotes}
                  onChange={(e) => setSupplyNotes(e.target.value)}
                  placeholder="Ej: Para la invasión nocturna de las 23:00 hrs o subiendo set a +11..."
                  className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSupply}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingSupply ? 'Enviando...' : 'Enviar Solicitud al Guild Master'}</span>
              </button>
            </form>

            {/* My Recent Requests Status */}
            {mySupplyRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mis Solicitudes Enviadas:
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {mySupplyRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg bg-[#080b15] border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{req.supplyType}</div>
                        <div className="text-[10px] text-slate-400">
                          {req.quantity} · {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        {req.adminNotes && (
                          <div className="text-[10px] text-amber-300 italic">
                            Nota GM: "{req.adminNotes}"
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded capitalize ${
                          req.status === 'entregado'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : req.status === 'aprobado'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'rechazado'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: BANDEJA DE GESTIÓN DEL GUILD MASTER (Panel de UlmerMG y Oficiales) */}
      {(isOfficer || isGuildMaster || currentMemberName.toLowerCase() === 'ulmermg') && (
        <section className="bg-gradient-to-br from-[#0c101d] via-[#121630] to-[#0c101d] rounded-2xl p-6 border-2 border-amber-500/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base flex items-center space-x-2">
                  <span>Bandeja de Suministros del Clan (Panel de Gestión GM)</span>
                </h3>
                <p className="text-xs text-amber-300/80">
                  Panel reservado para el Guild Master (<strong className="text-white">UlmerMG</strong>) para aprobar y despachar suministros a los integrantes.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {allSupplyRequests.filter((r) => r.status === 'pendiente').length} Solicitudes Pendientes
              </span>
              <button
                type="button"
                onClick={loadSupplies}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                title="Actualizar bandeja"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingSupplies ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {allSupplyRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay solicitudes de suministros registradas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSupplyRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    req.status === 'pendiente'
                      ? 'bg-[#090d1f] border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : req.status === 'aprobado'
                      ? 'bg-[#090d1f] border-emerald-500/40'
                      : req.status === 'entregado'
                      ? 'bg-[#090d1f] border-cyan-500/40'
                      : 'bg-[#090d1f] border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-white flex items-center space-x-1.5">
                        <span>{req.characterName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded capitalize ${
                        req.status === 'entregado'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : req.status === 'aprobado'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'rechazado'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                    <div className="font-bold text-amber-300">{req.supplyType}</div>
                    <div className="text-white font-mono font-semibold">Cantidad: {req.quantity}</div>
                    {req.notes && (
                      <div className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                        Motivo: "{req.notes}"
                      </div>
                    )}
                  </div>

                  {/* GM Action Buttons */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <input
                      type="text"
                      placeholder="Nota de entrega (ej: Lorencia Bar baúl 2)..."
                      value={gmResponseNote[req.id] || req.adminNotes || ''}
                      onChange={(e) =>
                        setGmResponseNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateSupplyStatus(req.id, 'aprobado')}
                        className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded transition-all cursor-pointer"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSupplyStatus(req.id, 'entregado')}
                        className="flex-1 py-1 px-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded transition-all cursor-pointer"
                      >
                        Entregado
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSupplyStatus(req.id, 'rechazado')}
                        className="py-1 px-2 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 font-bold text-[11px] rounded transition-all cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
