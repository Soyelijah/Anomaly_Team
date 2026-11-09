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
  Handshake,
  MapPin,
  AlertTriangle,
  Key,
  ShieldAlert,
  Search,
  ChevronLeft,
  Copy,
  CalendarDays,
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
  status: 'pendiente' | 'comprometido' | 'aprobado' | 'entregado' | 'rechazado';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  reviewedBy?: string;
  providerName?: string;
  providerNotes?: string;
  claimedAt?: string;
  deliveredAt?: string;
}

interface InvasionAttendanceItem {
  id: string;
  characterName: string;
  date: string;
  invasionSlot: '14:00' | '19:00' | '23:00';
  checkInTime?: string;
  checkOutTime?: string;
  checkInIso?: string;
  checkOutIso?: string;
  durationMinutes?: number;
  mapReported?: string;
  squadCode?: string;
  userTimeZone: string;
  status: 'completado' | 'en_progreso';
  verificationStatus?: 'verificado' | 'pendiente_revision' | 'rechazado_fraude';
  reviewedBy?: string;
  reviewNotes?: string;
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
  const [allInvasionRecords, setAllInvasionRecords] = useState<InvasionAttendanceItem[]>([]);
  const [loadingInvasions, setLoadingInvasions] = useState(false);
  const [invasionFeedback, setInvasionFeedback] = useState<string | null>(null);
  const [invasionSubTab, setInvasionSubTab] = useState<'marcar_hoy' | 'registro_diario' | 'auditoria'>('marcar_hoy');
  const [selectedDailyLogDate, setSelectedDailyLogDate] = useState<string>('2026-11-09');
  const [dailyLogSearchQuery, setDailyLogSearchQuery] = useState<string>('');
  const [dailyLogSlotFilter, setDailyLogSlotFilter] = useState<'all' | '14:00' | '19:00' | '23:00'>('all');
  const [copiedDailyNotice, setCopiedDailyNotice] = useState<string | null>(null);
  const [checkoutSlot, setCheckoutSlot] = useState<'14:00' | '19:00' | '23:00' | null>(null);
  const [checkoutMap, setCheckoutMap] = useState<string>('Lorencia (Puerta Este / Salida)');
  const [checkoutSquadCode, setCheckoutSquadCode] = useState<string>('');
  const [submittingInvasionCheck, setSubmittingInvasionCheck] = useState<boolean>(false);
  const [reviewingAttendanceId, setReviewingAttendanceId] = useState<string | null>(null);

  // Supply Requests state
  const [mySupplyRequests, setMySupplyRequests] = useState<ClanSupplyRequestItem[]>([]);
  const [allSupplyRequests, setAllSupplyRequests] = useState<ClanSupplyRequestItem[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [supplyType, setSupplyType] = useState('Pociones de SD Complejas (Complex SD Potions para PvP)');
  const [supplyQuantity, setSupplyQuantity] = useState('30 Pociones SD');
  const [supplyUrgency, setSupplyUrgency] = useState<'normal' | 'media' | 'alta'>('normal');
  const [supplyNotes, setSupplyNotes] = useState('');
  const [submittingSupply, setSubmittingSupply] = useState(false);
  const [supplySuccessMsg, setSupplySuccessMsg] = useState<string | null>(null);

  // Sub-tabs for supplies section: 'comunidad' | 'solicitar' | 'mis_pedidos'
  const [suppliesActiveTab, setSuppliesActiveTab] = useState<'comunidad' | 'solicitar' | 'mis_pedidos'>('comunidad');

  // "¡Yo Tengo!" claim interactive state
  const [claimingReqId, setClaimingReqId] = useState<string | null>(null);
  const [claimProviderName, setClaimProviderName] = useState(currentMemberName);
  const [claimProviderNotes, setClaimProviderNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // "Entregado" delivery confirmation state
  const [deliveringReqId, setDeliveringReqId] = useState<string | null>(null);
  const [deliveryNoteInput, setDeliveryNoteInput] = useState('');
  const [submittingDeliver, setSubmittingDeliver] = useState(false);

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
    const cleanName = currentMemberName ? currentMemberName.trim() : '';

    if (!cleanName) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/smash/profile/${encodeURIComponent(cleanName)}`);
        const contentType = res.headers.get('content-type') || '';

        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (!isCancelled && data && data.success) {
            setProfile(data);
          }
        } else {
          if (!isCancelled) {
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Notice loading member profile:', err);
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
      // 1. Cargar registros del propio jugador
      const res = await fetch(`/api/clan/invasion-attendance?characterName=${encodeURIComponent(currentMemberName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setInvasionRecords(data.records);
        }
      }

      // 2. Cargar todos los registros del clan para el Registro Diario Histórico y Auditoría
      const allRes = await fetch('/api/clan/invasion-attendance');
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.success && Array.isArray(allData.records)) {
          setAllInvasionRecords(allData.records);
        }
      }
    } catch (err) {
      console.warn('Error loading invasion attendance:', err);
    } finally {
      setLoadingInvasions(false);
    }
  };

  // Fetch supply requests for community board and member
  const loadSupplies = async () => {
    setLoadingSupplies(true);
    try {
      const allRes = await fetch('/api/clan/supply-requests');
      if (allRes.ok) {
        const dataAll = await allRes.json();
        if (dataAll.success && Array.isArray(dataAll.requests)) {
          setAllSupplyRequests(dataAll.requests);
          const cleanCur = (currentMemberName || '').trim().toLowerCase();
          setMySupplyRequests(
            dataAll.requests.filter(
              (r: ClanSupplyRequestItem) => r.characterName.toLowerCase() === cleanCur
            )
          );
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

  // Handle Check-in / Check-out for invasions con validación anti-trampas
  const handleInvasionCheck = async (
    slot: '14:00' | '19:00' | '23:00',
    checkType: 'check_in' | 'check_out',
    localTimeStr: string,
    mapOverride?: string,
    squadCodeOverride?: string
  ) => {
    setSubmittingInvasionCheck(true);
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
          mapReported: mapOverride || checkoutMap,
          squadCode: squadCodeOverride || checkoutSquadCode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInvasionFeedback(
            checkType === 'check_in'
              ? `⚔️ ¡Entrada registrada a las ${localTimeStr} para la invasión de las ${slot} hrs CLT! Permanece activo en el juego.`
              : `✅ ¡Check de salida completado! Reportado en ${mapOverride || checkoutMap}. Sincronizado en Discord #asistencias.`
          );
          setCheckoutSlot(null);
          setCheckoutSquadCode('');
          setTimeout(() => setInvasionFeedback(null), 5000);
          loadInvasions();
        }
      }
    } catch (err) {
      console.error('Error checking invasion:', err);
    } finally {
      setSubmittingInvasionCheck(false);
    }
  };

  // Manejo de Auditoría para el Guild Master (UlmerMG) y Oficiales
  const handleReviewAttendance = async (
    attendanceId: string,
    decision: 'aprobar' | 'rechazar',
    notes?: string
  ) => {
    setReviewingAttendanceId(attendanceId);
    try {
      const res = await fetch('/api/clan/invasion-attendance/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId,
          decision,
          reviewerName: currentMemberName || 'UlmerMG',
          reviewNotes:
            notes ||
            (decision === 'aprobar'
              ? 'Presencia y combate validados por la Comandancia'
              : 'Falta: No se verificó presencia real en el juego'),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInvasionFeedback(
            decision === 'aprobar'
              ? '✓ Asistencia validada y confirmada en el registro del clan.'
              : '🚨 Asistencia rechazada por fraude / inasistencia. Notificación de falta enviada a Discord.'
          );
          setTimeout(() => setInvasionFeedback(null), 5000);
          loadInvasions();
        }
      }
    } catch (err) {
      console.error('Error reviewing attendance:', err);
    } finally {
      setReviewingAttendanceId(null);
    }
  };

  // Helper para cambiar de día en el registro diario
  const shiftDay = (currentDateStr: string, deltaDays: number) => {
    try {
      const [y, m, d] = currentDateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      date.setUTCDate(date.getUTCDate() + deltaDays);
      const newY = date.getUTCFullYear();
      const newM = String(date.getUTCMonth() + 1).padStart(2, '0');
      const newD = String(date.getUTCDate()).padStart(2, '0');
      return `${newY}-${newM}-${newD}`;
    } catch {
      return currentDateStr;
    }
  };

  // Formato legible para la fecha (ej: Domingo, 8 de Noviembre de 2026)
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const formatted = new Intl.DateTimeFormat('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(date);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return dateStr;
    }
  };

  // Copiar reporte del día formateado en markdown para el canal #asistencias de Discord
  const handleCopyDailyReport = (dateStr: string, records: InvasionAttendanceItem[]) => {
    const r14 = records.filter((r) => r.invasionSlot === '14:00');
    const r19 = records.filter((r) => r.invasionSlot === '19:00');
    const r23 = records.filter((r) => r.invasionSlot === '23:00');

    const fmtNames = (list: InvasionAttendanceItem[]) =>
      list.length > 0
        ? list
            .map(
              (r) =>
                `  • **${r.characterName}** (${r.durationMinutes || 15}m · ${r.checkInTime || '14:00'} a ${
                  r.checkOutTime || '14:18'
                })`
            )
            .join('\n')
        : '  • *Sin asistentes registrados*';

    const text = `📊 **REGISTRO DIARIO DE ASISTENCIAS · CLAN ANOMALY**
📅 **Fecha Oficial:** ${dateStr} (Hora Chile)

⚔️ **Invasión 14:00 hrs CLT (${r14.length} guerreros):**
${fmtNames(r14)}

⚔️ **Invasión 19:00 hrs CLT (${r19.length} guerreros):**
${fmtNames(r19)}

⚔️ **Invasión 23:00 hrs CLT (${r23.length} guerreros):**
${fmtNames(r23)}

🏆 **Total Asistencias del Día:** ${records.length} registros
🛡️ *Sincronizado vía Plataforma Oficial de ANOMALY Smash MU*`;

    navigator.clipboard.writeText(text);
    setCopiedDailyNotice(`¡Reporte del día ${dateStr} copiado para Discord #asistencias!`);
    setTimeout(() => setCopiedDailyNotice(null), 4000);
  };

  // Submit supply request (notifies #suministros-team on Discord)
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
            '¡Solicitud publicada en el canal #suministros-team de Discord! Tus compañeros y el Guild Master podrán responder con "¡Yo Tengo!" para entregártelos.'
          );
          setSupplyNotes('');
          setSuppliesActiveTab('comunidad');
          loadSupplies();
          setTimeout(() => setSupplySuccessMsg(null), 6000);
        }
      }
    } catch (err) {
      console.error('Error submitting supply:', err);
    } finally {
      setSubmittingSupply(false);
    }
  };

  // Acción "¡Yo Tengo!" por parte de cualquier miembro que tenga los suministros disponibles
  const handleClaimSupply = async (requestId: string) => {
    const provName = (claimProviderName || currentMemberName || '').trim();
    if (!provName) return;

    setSubmittingClaim(true);
    try {
      const res = await fetch(`/api/clan/supply-requests/${requestId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: provName,
          providerNotes: claimProviderNotes.trim() || 'Tengo los ítems listos en el servidor.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSupplySuccessMsg(
            `¡Te has comprometido a entregar este suministro! Notificación enviada a Discord (#suministros-team).`
          );
          setClaimingReqId(null);
          setClaimProviderNotes('');
          loadSupplies();
          setTimeout(() => setSupplySuccessMsg(null), 5000);
        }
      }
    } catch (err) {
      console.error('Error claiming supply:', err);
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Acción para marcar suministro como "Entregado en Juego"
  const handleDeliverSupply = async (requestId: string) => {
    setSubmittingDeliver(true);
    try {
      const res = await fetch(`/api/clan/supply-requests/${requestId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryNotes: deliveryNoteInput.trim() || 'Entrega concretada con éxito en Smash MU.',
          deliveredBy: currentMemberName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSupplySuccessMsg('¡Suministro marcado como entregado en juego y notificado a Discord!');
          setDeliveringReqId(null);
          setDeliveryNoteInput('');
          loadSupplies();
          setTimeout(() => setSupplySuccessMsg(null), 5000);
        }
      }
    } catch (err) {
      console.error('Error delivering supply:', err);
    } finally {
      setSubmittingDeliver(false);
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
                  onClick={() => {
                    onUpdateMyAttendance(currentMemberName, 'confirmed');
                    fetch('/api/clan/siege-attendance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ characterName: currentMemberName, status: 'confirmed' }),
                    }).catch(() => {});
                  }}
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
                  onClick={() => {
                    onUpdateMyAttendance(currentMemberName, 'pending');
                    fetch('/api/clan/siege-attendance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ characterName: currentMemberName, status: 'pending' }),
                    }).catch(() => {});
                  }}
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
                  onClick={() => {
                    onUpdateMyAttendance(currentMemberName, 'absent');
                    fetch('/api/clan/siege-attendance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ characterName: currentMemberName, status: 'absent' }),
                    }).catch(() => {});
                  }}
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
                <div>
                  <h3 className="font-bold text-white text-base">Invasiones Diarias &amp; Asistencias</h3>
                  <p className="text-[11px] text-slate-400">Canal sincronizado: <span className="text-cyan-400 font-mono">#asistencias</span></p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[140px]">{userTimeZone}</span>
                </span>
                <button
                  type="button"
                  onClick={loadInvasions}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  title="Actualizar asistencias"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingInvasions ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Marcar Hoy, Registro Diario (Historial por Día), Auditoría GM */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-[#080b15] p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setInvasionSubTab('marcar_hoy')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  invasionSubTab === 'marcar_hoy'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚔️ Marcar Hoy
              </button>
              <button
                type="button"
                onClick={() => setInvasionSubTab('registro_diario')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  invasionSubTab === 'registro_diario'
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md font-black'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-purple-300" />
                <span>Registro Diario ({allInvasionRecords.filter((r) => r.date === selectedDailyLogDate).length})</span>
              </button>
              {(isOfficer || isGuildMaster) && (
                <button
                  type="button"
                  onClick={() => setInvasionSubTab('auditoria')}
                  className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    invasionSubTab === 'auditoria'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Auditoría GM</span>
                </button>
              )}
            </div>

            {/* Direct Attendance Banner (Quick explanation) */}
            <div className="text-xs text-slate-300 leading-relaxed bg-[#080b15] p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Asistencia a Invasiones Smash MU · 1 Clic Directo</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  14:00 · 19:00 · 23:00 CLT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tanto en <strong className="text-cyan-300">Marcar Hoy</strong> como en el <strong className="text-purple-300">Registro Diario</strong>, las asistencias quedan archivadas por fecha oficial. Pulsa <strong className="text-cyan-300">Entrada</strong> al iniciar y <strong className="text-emerald-300">Salida</strong> al terminar sin formularios molestos.
              </p>
            </div>

            {invasionFeedback && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-fadeIn shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{invasionFeedback}</span>
              </div>
            )}

            {copiedDailyNotice && (
              <div className="p-3 bg-purple-950/60 border border-purple-500/50 rounded-xl text-xs text-purple-200 flex items-center space-x-2 animate-fadeIn shadow-lg">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{copiedDailyNotice}</span>
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-TAB 1: MARCAR HOY (PLAYER 1-CLICK VIEW FOR TODAY'S 3 SLOTS)       */}
            {/* =================================================================== */}
            {invasionSubTab === 'marcar_hoy' && (
              <div className="space-y-3">
                {invasionSlots.map(({ slot, chileHour, title, description }) => {
                  const localTime = formatSlotLocalTime(chileHour);
                  const attendance = invasionRecords.find(
                    (r) => r.invasionSlot === slot && r.date === todayChileStr
                  );

                  const hasCheckIn = Boolean(attendance?.checkInTime);
                  const hasCheckOut = Boolean(attendance?.checkOutTime);
                  const isCompleted = attendance?.status === 'completado' || (hasCheckIn && hasCheckOut);

                  const elapsedMinutes = attendance?.checkInIso
                    ? Math.max(1, Math.round((Date.now() - new Date(attendance.checkInIso).getTime()) / 60000))
                    : attendance?.durationMinutes || 0;

                  return (
                    <div
                      key={slot}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        attendance?.verificationStatus === 'rechazado_fraude'
                          ? 'bg-red-950/20 border-red-500/40'
                          : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : hasCheckIn
                          ? 'bg-cyan-950/20 border-cyan-500/40 ring-1 ring-cyan-500/30'
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
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                              attendance?.verificationStatus === 'rechazado_fraude'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : hasCheckIn
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {attendance?.verificationStatus === 'rechazado_fraude'
                              ? '🚨 Sancionado'
                              : isCompleted
                              ? '✓ Check Completo'
                              : hasCheckIn
                              ? '⏳ En Combate'
                              : 'Sin Check'}
                          </span>
                        </div>
                      </div>

                      {/* Attendance timestamps and duration */}
                      {attendance && (
                        <div className="text-[10px] font-mono text-slate-300 bg-black/50 p-2 rounded-lg space-y-1 border border-slate-800/60">
                          <div className="flex items-center justify-between">
                            <span>Entrada: <strong className="text-cyan-300">{attendance.checkInTime || '—'}</strong></span>
                            <span>Salida: <strong className="text-emerald-300">{attendance.checkOutTime || 'Pendiente'}</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 pt-0.5 border-t border-slate-800/50">
                            <span>⏱️ Permanencia: <strong className="text-amber-300">{attendance.durationMinutes ? `${attendance.durationMinutes} min` : `${elapsedMinutes} min (en curso)`}</strong></span>
                            <span className="text-cyan-400">{attendance.userTimeZone || userTimeZone}</span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: 1-Click Check-In y 1-Click Check-Out (Sin formularios) */}
                      <div className="pt-1">
                        {!hasCheckIn ? (
                          <button
                            type="button"
                            disabled={submittingInvasionCheck}
                            onClick={() => handleInvasionCheck(slot, 'check_in', localTime)}
                            className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Marcar Entrada (Check-In)</span>
                          </button>
                        ) : !hasCheckOut ? (
                          <button
                            type="button"
                            disabled={submittingInvasionCheck}
                            onClick={() => handleInvasionCheck(slot, 'check_out', localTime)}
                            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Marcar Salida (Completar Asistencia)</span>
                          </button>
                        ) : (
                          <div className="w-full py-1.5 px-3 bg-emerald-950/40 text-emerald-300 font-mono text-xs rounded-lg text-center border border-emerald-500/30 flex items-center justify-center space-x-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>✓ Asistencia completada y notificada a Discord</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* =================================================================== */}
            {/* SUB-TAB 2: REGISTRO DIARIO (HISTORIAL ORGANIZADO POR DÍA)            */}
            {/* =================================================================== */}
            {invasionSubTab === 'registro_diario' && (() => {
              // Filtrar registros para el día seleccionado
              const dayRecords = allInvasionRecords.filter((r) => r.date === selectedDailyLogDate);
              const r14 = dayRecords.filter((r) => r.invasionSlot === '14:00');
              const r19 = dayRecords.filter((r) => r.invasionSlot === '19:00');
              const r23 = dayRecords.filter((r) => r.invasionSlot === '23:00');

              // Filtrado por slot y buscador
              const filteredRecords = dayRecords.filter((r) => {
                if (dailyLogSlotFilter !== 'all' && r.invasionSlot !== dailyLogSlotFilter) return false;
                if (dailyLogSearchQuery.trim()) {
                  const q = dailyLogSearchQuery.trim().toLowerCase();
                  return r.characterName.toLowerCase().includes(q);
                }
                return true;
              });

              // Extraer días con registros para selector rápido
              const availableRecordedDates = Array.from(
                new Set(allInvasionRecords.map((r) => r.date).concat(todayChileStr))
              ).sort().reverse();

              return (
                <div className="space-y-4 animate-fadeIn">
                  {/* Selector y Navegador de Fecha Interactivo */}
                  <div className="bg-[#050711] p-3.5 rounded-xl border border-purple-500/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Día Anterior / Selector / Día Siguiente */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate((cur) => shiftDay(cur, -1))}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-all"
                          title="Día anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="relative">
                          <input
                            type="date"
                            value={selectedDailyLogDate}
                            onChange={(e) => {
                              if (e.target.value) setSelectedDailyLogDate(e.target.value);
                            }}
                            className="bg-[#090d1f] border border-purple-500/50 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate((cur) => shiftDay(cur, 1))}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-all"
                          title="Día siguiente"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Botones Rápidos de Fecha: Hoy / Ayer / Fechas con data */}
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate(todayChileStr)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                            selectedDailyLogDate === todayChileStr
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          Hoy ({todayChileStr.slice(5)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate(shiftDay(todayChileStr, -1))}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                            selectedDailyLogDate === shiftDay(todayChileStr, -1)
                              ? 'bg-purple-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          Ayer ({shiftDay(todayChileStr, -1).slice(5)})
                        </button>
                      </div>
                    </div>

                    {/* Banner con Fecha Formateada en Español */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div>
                        <div className="text-xs font-black text-white capitalize flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>{formatFriendlyDate(selectedDailyLogDate)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Fecha Oficial Servidor: <strong className="text-cyan-300">{selectedDailyLogDate}</strong> (Hora Chile)
                        </div>
                      </div>

                      {/* Botón Copiar Reporte para Discord */}
                      <button
                        type="button"
                        onClick={() => handleCopyDailyReport(selectedDailyLogDate, dayRecords)}
                        className="py-1 px-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg border border-purple-500/40 shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                        title="Copiar reporte formateado en Markdown para pegar en el canal #asistencias"
                      >
                        <Copy className="w-3 h-3 text-purple-200" />
                        <span>Copiar para Discord</span>
                      </button>
                    </div>
                  </div>

                  {/* Resumen Estadístico del Día (KPIs Rápidos) */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#080b15] rounded-xl border border-purple-500/30">
                      <div className="text-[10px] text-purple-300 uppercase font-mono font-bold">Total Día</div>
                      <div className="text-lg font-black text-white font-mono">{dayRecords.length}</div>
                    </div>
                    <div className="p-2 bg-[#080b15] rounded-xl border border-slate-800">
                      <div className="text-[10px] text-cyan-400 uppercase font-mono">14:00 CLT</div>
                      <div className="text-lg font-black text-cyan-300 font-mono">{r14.length}</div>
                    </div>
                    <div className="p-2 bg-[#080b15] rounded-xl border border-slate-800">
                      <div className="text-[10px] text-amber-400 uppercase font-mono">19:00 CLT</div>
                      <div className="text-lg font-black text-amber-300 font-mono">{r19.length}</div>
                    </div>
                    <div className="p-2 bg-[#080b15] rounded-xl border border-slate-800">
                      <div className="text-[10px] text-emerald-400 uppercase font-mono">23:00 CLT</div>
                      <div className="text-lg font-black text-emerald-300 font-mono">{r23.length}</div>
                    </div>
                  </div>

                  {/* Filtro por Turno y Buscador Rápido de Miembro */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-1 bg-[#050711] p-0.5 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDailyLogSlotFilter('all')}
                        className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                          dailyLogSlotFilter === 'all'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Todos ({dayRecords.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyLogSlotFilter('14:00')}
                        className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                          dailyLogSlotFilter === '14:00'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        14:00 ({r14.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyLogSlotFilter('19:00')}
                        className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                          dailyLogSlotFilter === '19:00'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        19:00 ({r19.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyLogSlotFilter('23:00')}
                        className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                          dailyLogSlotFilter === '23:00'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        23:00 ({r23.length})
                      </button>
                    </div>

                    <div className="relative min-w-[150px]">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={dailyLogSearchQuery}
                        onChange={(e) => setDailyLogSearchQuery(e.target.value)}
                        placeholder="Buscar guerrero..."
                        className="w-full bg-[#050711] border border-slate-800 rounded-lg py-1 pl-8 pr-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Listado Diario de Guerreros */}
                  {filteredRecords.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-[#050711] rounded-xl border border-slate-800 space-y-2">
                      <p>
                        No se registraron asistencias para el día <strong className="text-white font-mono">{selectedDailyLogDate}</strong>
                        {dailyLogSlotFilter !== 'all' ? ` en el turno de las ${dailyLogSlotFilter} CLT.` : '.'}
                      </p>
                      <div className="flex items-center justify-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate('2026-11-09')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] rounded-lg border border-slate-700 cursor-pointer font-bold"
                        >
                          Ver 2026-11-09
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDailyLogDate('2026-11-08')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] rounded-lg border border-slate-700 cursor-pointer font-bold"
                        >
                          Ver 2026-11-08
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredRecords.map((record) => {
                        const isCompleted = record.status === 'completado';
                        const isFraud = record.verificationStatus === 'rechazado_fraude';

                        return (
                          <div
                            key={record.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isFraud
                                ? 'bg-red-950/20 border-red-500/40'
                                : isCompleted
                                ? 'bg-[#060914] border-slate-800 hover:border-purple-500/40'
                                : 'bg-cyan-950/20 border-cyan-500/40'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-500/30 flex items-center justify-center text-white font-black text-xs font-mono shrink-0 shadow-sm">
                                {record.characterName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs truncate flex items-center space-x-1.5 font-mono">
                                  <span>{record.characterName}</span>
                                  <span className="text-[10px] font-normal text-slate-400">
                                    · Invasión {record.invasionSlot} CLT
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                                  <span>In: <strong className="text-cyan-300">{record.checkInTime || '—'}</strong></span>
                                  <span>Out: <strong className="text-emerald-300">{record.checkOutTime || '—'}</strong></span>
                                  <span>· ⏱️ <strong className="text-amber-300">{record.durationMinutes || 15}m</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  isFraud
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {isFraud ? '🚨 Falta' : isCompleted ? '✓ Completo' : '⏳ En Curso'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* =================================================================== */}
            {/* SUB-TAB 3: AUDITORÍA GENERAL PARA GUILD MASTER Y OFICIALES           */}
            {/* =================================================================== */}
            {invasionSubTab === 'auditoria' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
                  <div className="font-bold text-amber-300 text-xs flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Panel de Control Anti-Fraude (Comandancia ANOMALY)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Como Guild Master u Oficial, puedes validar o sancionar a quienes marcaron entrada/salida. Si un miembro no estuvo en el juego, márcalo como <strong>Rechazar (Falta)</strong> para anular su registro y reportarlo en Discord automáticamente.
                  </p>
                </div>

                {allInvasionRecords.filter((r) => r.date === todayChileStr).length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-[#080b15] rounded-xl border border-slate-800">
                    Aún no hay registros de asistencia marcados el día de hoy ({todayChileStr}).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allInvasionRecords
                      .filter((r) => r.date === todayChileStr)
                      .map((record) => {
                        const isUnderReview = record.verificationStatus === 'pendiente_revision';
                        const isFraud = record.verificationStatus === 'rechazado_fraude';
                        const isVerified = record.verificationStatus === 'verificado';

                        return (
                          <div
                            key={record.id}
                            className={`p-3 rounded-xl border transition-all space-y-2 ${
                              isFraud
                                ? 'bg-red-950/30 border-red-500/50'
                                : isVerified
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-[#080b15] border-amber-500/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-black text-white text-xs flex items-center space-x-1.5 font-mono">
                                  <span>{record.characterName}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                    Turno: {record.invasionSlot} CLT
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap gap-2">
                                  <span>Entrada: <strong className="text-white">{record.checkInTime || '—'}</strong></span>
                                  <span>Salida: <strong className="text-white">{record.checkOutTime || 'Pendiente'}</strong></span>
                                  <span>Combate: <strong className="text-amber-300">{record.durationMinutes || '—'} min</strong></span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                  isFraud
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : isVerified
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                }`}
                              >
                                {isFraud ? '🔴 Sancionado / Falta' : isVerified ? '🟢 Verificado' : '🟡 Sospecha / En Revisión'}
                              </span>
                            </div>

                            {/* Action Buttons for GM */}
                            <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                              <button
                                type="button"
                                disabled={reviewingAttendanceId === record.id}
                                onClick={() => handleReviewAttendance(record.id, 'aprobar')}
                                className="py-1 px-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Aprobar Asistencia</span>
                              </button>

                              <button
                                type="button"
                                disabled={reviewingAttendanceId === record.id}
                                onClick={() => handleReviewAttendance(record.id, 'rechazar', 'Falta: El Guild Master corroboró que no estuvo en el juego durante la invasión')}
                                className="py-1 px-3 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Marcar Trampa / Falta</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Suministros del Team ANOMALY (#suministros-team) */}
          <div className="bg-[#0c101d] rounded-2xl p-6 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Suministros del Team ANOMALY</h3>
                  <p className="text-[11px] text-slate-400">Canal sincronizado: <span className="text-cyan-400 font-mono">#suministros-team</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-bold">
                  {allSupplyRequests.filter((r) => r.status === 'pendiente').length} Pendientes
                </span>
                <button
                  type="button"
                  onClick={loadSupplies}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  title="Actualizar suministros"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingSupplies ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Information Banner */}
            <div className="text-xs text-slate-300 leading-relaxed bg-[#080b15] p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center space-x-1.5">
                <Handshake className="w-4 h-4 text-amber-400" />
                <span>¿Cómo funciona el canal de suministros del clan?</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Cuando un miembro publica un pedido, llega automáticamente al canal <strong className="text-white">#suministros-team</strong> de Discord. Cualquier integrante que tenga los ítems disponibles puede presionar <strong className="text-emerald-400">"¡Yo Tengo!"</strong> para comprometerse a entregarlos indicando lugar y hora en el juego. El Guild Master (<strong className="text-white">UlmerMG</strong>) también supervisa la intendencia.
              </p>
            </div>

            {/* Sub-Tabs: Comunidad / Pedir / Mis Solicitudes */}
            <div className="flex items-center space-x-1 p-1 bg-[#080b15] rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSuppliesActiveTab('comunidad')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  suppliesActiveTab === 'comunidad'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bandeja del Team ({allSupplyRequests.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSuppliesActiveTab('solicitar')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  suppliesActiveTab === 'solicitar'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pedir Suministros</span>
              </button>

              <button
                type="button"
                onClick={() => setSuppliesActiveTab('mis_pedidos')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  suppliesActiveTab === 'mis_pedidos'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Mis Pedidos ({mySupplyRequests.length})</span>
              </button>
            </div>

            {supplySuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{supplySuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: BANDEJA DEL TEAM (Todos los pedidos del clan con "¡Yo Tengo!") */}
            {suppliesActiveTab === 'comunidad' && (
              <div className="space-y-3">
                {allSupplyRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-[#080b15] rounded-xl border border-slate-800">
                    No hay solicitudes de suministros activas en este momento. ¡El clan está bien abastecido!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {allSupplyRequests.map((req) => {
                      const isMine = req.characterName.toLowerCase() === (currentMemberName || '').toLowerCase();
                      const isClaimedByMe = req.providerName?.toLowerCase() === (currentMemberName || '').toLowerCase();
                      const isPending = req.status === 'pendiente';
                      const isClaimed = req.status === 'comprometido';
                      const isDelivered = req.status === 'entregado';

                      return (
                        <div
                          key={req.id}
                          className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                            isPending
                              ? 'bg-[#080b15] border-amber-500/40 shadow-sm'
                              : isClaimed
                              ? 'bg-[#080f1e] border-emerald-500/40'
                              : isDelivered
                              ? 'bg-[#080b15] border-cyan-500/30 opacity-80'
                              : 'bg-[#080b15] border-slate-800 opacity-60'
                          }`}
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-white text-xs">
                                  {req.characterName}
                                </span>
                                {isMine && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    TÚ
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                    req.urgency === 'alta'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      : req.urgency === 'media'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}
                                >
                                  {req.urgency}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Publicado: {new Date(req.createdAt).toLocaleDateString()} a las {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            {/* Status badge */}
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded capitalize shrink-0 ${
                                isDelivered
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : isClaimed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : req.status === 'aprobado'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : req.status === 'rechazado'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isClaimed ? '🤝 Comprometido' : isDelivered ? '✓ Entregado' : req.status}
                            </span>
                          </div>

                          {/* Item requested details */}
                          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs space-y-1">
                            <div className="font-bold text-amber-300 flex items-center justify-between">
                              <span>{req.supplyType}</span>
                              <span className="font-mono text-white text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                Cantidad: {req.quantity}
                              </span>
                            </div>
                            {req.notes && (
                              <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800/80">
                                Motivo: "{req.notes}"
                              </p>
                            )}
                          </div>

                          {/* Provider information if claimed */}
                          {req.providerName && (
                            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                              <div className="text-[11px] font-bold text-emerald-300 flex items-center space-x-1.5">
                                <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Aceptado por: <strong>{req.providerName}</strong></span>
                              </div>
                              {req.providerNotes && (
                                <p className="text-[11px] text-slate-300 italic">
                                  Observaciones: "{req.providerNotes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* GM Note if any */}
                          {req.adminNotes && !req.providerNotes && (
                            <div className="text-[10px] text-amber-300/90 italic px-1">
                              Nota de Intendencia: "{req.adminNotes}"
                            </div>
                          )}

                          {/* ACTIONS */}
                          <div className="pt-1">
                            {/* IF PENDING: Allow any other member to click "¡Yo Tengo!" */}
                            {isPending && (
                              <div>
                                {claimingReqId === req.id ? (
                                  <div className="p-3 bg-[#0d142b] border border-amber-500/60 rounded-xl space-y-2 mt-2">
                                    <div className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                                      <Handshake className="w-4 h-4 text-amber-400" />
                                      <span>Avisar que tienes disponible para entregar:</span>
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-slate-300 font-semibold block mb-0.5">
                                        Tu Personaje Donante / Proveedor:
                                      </label>
                                      <input
                                        type="text"
                                        value={claimProviderName}
                                        onChange={(e) => setClaimProviderName(e.target.value)}
                                        className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-slate-300 font-semibold block mb-0.5">
                                        Observaciones de Entrega (lugar / hora en juego):
                                      </label>
                                      <input
                                        type="text"
                                        value={claimProviderNotes}
                                        onChange={(e) => setClaimProviderNotes(e.target.value)}
                                        placeholder="Ej: Tengo las 30 SD en baúl 1 Lorencia, te tradeo a las 18:50..."
                                        className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                      />
                                    </div>

                                    <div className="flex items-center space-x-2 pt-1">
                                      <button
                                        type="button"
                                        disabled={submittingClaim}
                                        onClick={() => handleClaimSupply(req.id)}
                                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                                      >
                                        {submittingClaim ? 'Notificando a Discord...' : 'Confirmar y Avisar en Discord'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setClaimingReqId(null)}
                                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    {!isMine ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setClaimingReqId(req.id);
                                          setClaimProviderName(currentMemberName);
                                          setClaimProviderNotes('');
                                        }}
                                        className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-lg shadow transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                                      >
                                        <Handshake className="w-3.5 h-3.5" />
                                        <span>¡Yo Tengo Disponible!</span>
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-amber-300/80 italic">
                                        Tu pedido está publicado en Discord #suministros-team.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* IF CLAIMED: Allow marking as delivered */}
                            {isClaimed && (
                              <div>
                                {deliveringReqId === req.id ? (
                                  <div className="p-3 bg-[#0d1f1f] border border-cyan-500/50 rounded-xl space-y-2 mt-1">
                                    <div className="text-xs font-bold text-cyan-300">
                                      Confirmar Entrega en Smash MU:
                                    </div>
                                    <input
                                      type="text"
                                      value={deliveryNoteInput}
                                      onChange={(e) => setDeliveryNoteInput(e.target.value)}
                                      placeholder="Nota final (ej: Trade completado en Lorencia Bar)..."
                                      className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        disabled={submittingDeliver}
                                        onClick={() => handleDeliverSupply(req.id)}
                                        className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50"
                                      >
                                        {submittingDeliver ? 'Confirmando...' : 'Confirmar Entrega en Juego'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeliveringReqId(null)}
                                        className="py-1.5 px-3 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  (isClaimedByMe || isMine || isOfficer || isGuildMaster) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeliveringReqId(req.id);
                                        setDeliveryNoteInput('');
                                      }}
                                      className="py-1 px-2.5 bg-cyan-700/60 hover:bg-cyan-600 text-cyan-100 font-bold text-xs rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                                      <span>Marcar como Entregado en Juego</span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PEDIR SUMINISTROS (Formulario con catálogo completo de Smash MU) */}
            {suppliesActiveTab === 'solicitar' && (
              <form onSubmit={handleSubmitSupplyRequest} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tipo de Suministro Requerido:
                  </label>
                  <select
                    value={supplyType}
                    onChange={(e) => setSupplyType(e.target.value)}
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <optgroup label="🧪 Pociones PvP &amp; Asedio">
                      <option value="Pociones de SD Complejas (Complex SD Potions para PvP)">
                        Pociones de SD Complejas (Complex SD Potions para PvP)
                      </option>
                      <option value="Pociones de Gran Vida / Élite (Life Potions)">
                        Pociones de Gran Vida / Élite (Life Potions)
                      </option>
                      <option value="Pociones de Maná Élite / Concentrado">
                        Pociones de Maná Élite / Concentrado
                      </option>
                      <option value="Pociones de Veneno / Antídotos para Asedio">
                        Pociones de Veneno / Antídotos para Asedio
                      </option>
                    </optgroup>

                    <optgroup label="💎 Joyas &amp; Refinación">
                      <option value="Joyas de la Bendición (Jewel of Bless)">
                        Joyas de la Bendición (Jewel of Bless)
                      </option>
                      <option value="Joyas del Alma (Jewel of Soul)">
                        Joyas del Alma (Jewel of Soul)
                      </option>
                      <option value="Joyas del Caos (Jewel of Chaos)">
                        Joyas del Caos (Jewel of Chaos)
                      </option>
                      <option value="Joyas de la Creación (Jewel of Creation)">
                        Joyas de la Creación (Jewel of Creation)
                      </option>
                      <option value="Joyas de la Armonía (Jewel of Harmony)">
                        Joyas de la Armonía (Jewel of Harmony)
                      </option>
                      <option value="Joyas Guardian (Jewel of Guardian para Asedio)">
                        Joyas Guardian (Jewel of Guardian para Asedio)
                      </option>
                      <option value="Piedras Refining (Lower / Higher Refining Stones)">
                        Piedras Refining (Lower / Higher Refining Stones)
                      </option>
                    </optgroup>

                    <optgroup label="📜 Entradas de Eventos">
                      <option value="Pack Entradas Blood Castle +7 (Capa del Arcángel)">
                        Pack Entradas Blood Castle +7 (Capa del Arcángel)
                      </option>
                      <option value="Pack Entradas Devil Square +7 (Ojo + Llave)">
                        Pack Entradas Devil Square +7 (Ojo + Llave)
                      </option>
                      <option value="Entradas Illusion Temple / Chaos Castle">
                        Entradas Illusion Temple / Chaos Castle
                      </option>
                    </optgroup>

                    <optgroup label="🛡️ Equipamiento &amp; Apoyo Militar">
                      <option value="Armadura / Set de Guerra para Asedio (Damage Reduction / Reflect)">
                        Armadura / Set de Guerra para Asedio (Damage Reduction / Reflect)
                      </option>
                      <option value="Arma / Escudo de Choque o Soporte">
                        Arma / Escudo de Choque o Soporte
                      </option>
                      <option value="Alas Nivel 2 / Nivel 3 de Préstamo">
                        Alas Nivel 2 / Nivel 3 de Préstamo
                      </option>
                      <option value="Dark Raven / Dark Horse (Caballo / Cuervo para DL)">
                        Dark Raven / Dark Horse (Caballo / Cuervo para DL)
                      </option>
                      <option value="Zen de Urgencia para Resets / Reparaciones">
                        Zen de Urgencia para Resets / Reparaciones (100kk / 500kk / 1kkk)
                      </option>
                      <option value="Otro Suministro (Especificar en observaciones)">
                        Otro Suministro (Especificar en observaciones)
                      </option>
                    </optgroup>
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
                      <option value="normal">Normal (Para leveo / farm)</option>
                      <option value="media">Media (Invasión del día)</option>
                      <option value="alta">Alta (Asedio / Invasión 23:00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Motivo u Observaciones para el Team y GM:
                  </label>
                  <textarea
                    rows={2}
                    value={supplyNotes}
                    onChange={(e) => setSupplyNotes(e.target.value)}
                    placeholder="Ej: Para la invasión nocturna de las 23:00 hrs o subiendo set de guerra a +11..."
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingSupply}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingSupply ? 'Publicando en #suministros-team...' : 'Publicar Solicitud en #suministros-team'}</span>
                </button>
              </form>
            )}

            {/* TAB 3: MIS SOLICITUDES ENVIADAS */}
            {suppliesActiveTab === 'mis_pedidos' && (
              <div className="space-y-2">
                {mySupplyRequests.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-[#080b15] rounded-xl border border-slate-800">
                    No has enviado solicitudes aún. Usa la pestaña "Pedir Suministros" para requerir SD, pociones o joyas.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {mySupplyRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-lg bg-[#080b15] border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{req.supplyType}</span>
                            <span className="text-[10px] text-amber-300 font-mono">({req.quantity})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Enviado: {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                          {req.providerName && (
                            <div className="text-[11px] text-emerald-300 font-semibold">
                              🤝 Comprometido por: <strong>{req.providerName}</strong> {req.providerNotes ? `("${req.providerNotes}")` : ''}
                            </div>
                          )}
                          {req.adminNotes && !req.providerNotes && (
                            <div className="text-[10px] text-amber-300 italic">
                              Nota GM: "{req.adminNotes}"
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded capitalize self-start sm:self-auto ${
                            req.status === 'entregado'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : req.status === 'comprometido'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : req.status === 'aprobado'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : req.status === 'rechazado'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {req.status === 'comprometido' ? '🤝 Comprometido' : req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                          : req.status === 'comprometido'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'aprobado'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'rechazado'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {req.status === 'comprometido' ? '🤝 Comprometido' : req.status}
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
                    {req.providerName && (
                      <div className="text-[11px] text-emerald-300 font-semibold pt-1 border-t border-slate-800">
                        Donante: <strong>{req.providerName}</strong> {req.providerNotes ? `("${req.providerNotes}")` : ''}
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
