import React, { useState, useEffect, useMemo, useRef } from 'react';
import { serverEvents } from '../data/initialData';
import { ServerEvent } from '../types/clan';
import {
  Clock,
  Sparkles,
  MapPin,
  Gift,
  Trophy,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Flame,
  Radio,
  Swords,
  Users,
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Info,
  Key,
} from 'lucide-react';
import {
  getDetectedUserLocation,
  formatTimeInZone,
  COMMUNITY_COUNTRIES,
  convertUtcHourToLocal,
} from '../utils/timezone';

// Tactical mission and squad setup guide for Anomaly clan members
const CLAN_COORDINATION_TIPS: Record<
  string,
  {
    iconEmoji: string;
    tagline: string;
    mission: string;
    entryRequirement: string;
    recommendedParty: string;
    location: string;
    tips: string[];
  }
> = {
  bc: {
    iconEmoji: '🏰',
    tagline: 'Carrera contra el tiempo · EXP Masiva & Joyas',
    mission: 'Cruzar el puente de hielo, destruir la Puerta del Castillo, quebrar la Estatua de Cristal y recuperar el Arma Sagrada del Arcángel.',
    entryRequirement: 'Capa de Invisibilidad (Scroll of Archangel + Blood Bone + Joya del Caos). Nivel 1 a 400 según el grado (+1 a +7).',
    recommendedParty: 'Energy Elf (Buff Daño/Defensa) + Dark Lord (Critical) + Blade Master (Combo) + Magic Gladiator (Limpieza)',
    location: 'Devias (Iglesia Norte, coordenadas 209, 30)',
    tips: [
      'Entrar en el último minuto antes de que cierre el cupo de 10 personas por nivel.',
      'El buff de Energy Elf es indispensable para romper la puerta en segundos.',
      'Entregar el arma del Arcángel al NPC da bono de millones de EXP y Joyas.',
    ],
  },
  ds: {
    iconEmoji: '🔮',
    tagline: 'Supervivencia masiva · El mejor leveleo de Mu',
    mission: 'Sobrevivir a 20 minutos de oleadas interminables de monstruos élite y jefes dorados. El ranking otorga Zen y gemas.',
    entryRequirement: 'Entrada Devil Square (Devil Eye + Devil Key + Joya del Caos). Niveles 1 a 400 (+1 a +6).',
    recommendedParty: 'Magic Gladiators y Grand Masters (Meteorito / Gigantic Storm) + Energy Elf + Dark Lord (Caballo)',
    location: 'Noria (Entrada este, coordenadas 171, 105)',
    tips: [
      'Colocarse en una esquina del mapa para evitar que los monstruos te rodeen por la espalda.',
      'Coordinar spot de party entre miembros de Anomaly para que nadie quede fuera de EXP.',
      'Al minuto 15 aparecen jefes dorados que arrojan Joyas del Caos y Cajas Kundun.',
    ],
  },
  cc: {
    iconEmoji: '⚔️',
    tagline: 'PvP Todos contra Todos · Ítems Ancient Élite',
    mission: 'Combate individual a muerte. Todos los jugadores visten armaduras idénticas para ocultar su identidad. El suelo se desmorona hasta que quede solo 1 ganador.',
    entryRequirement: 'Armadura de Guardia (Se compra en tiendas de cualquier ciudad según el nivel del personaje).',
    recommendedParty: 'Evento individual (No se permiten grupos). Llevar set de alta defensa, anillos con opción reflejo y pociones de SD al máximo.',
    location: 'Acceso directo con clic derecho en la Armadura de Guardia desde cualquier ciudad',
    tips: [
      'No gastes tus pociones de SD en los primeros minutos; resérvalas para el duelo final.',
      'Mantente cerca del centro para no caerte cuando el suelo exterior comience a derrumbarse.',
      'El sobreviviente final tiene alta probabilidad de recibir un Ítem Ancient Legendario.',
    ],
  },
  golden: {
    iconEmoji: '🐉',
    tagline: 'Caza de Dragones Dorados · Cajas Box of Kundun +1 a +5',
    mission: 'Hordas de monstruos y dragones dorados invaden los mapas principales arrojando cajas con armas y armaduras excelentes de alto nivel.',
    entryRequirement: 'Acceso libre a todos los mapas según el nivel del personaje. No requiere entrada.',
    recommendedParty: 'Dividir a los miembros de Anomaly en 4 continentes: Lorencia (BOK+1), Devias (BOK+2/3), Atlans y Tarkan (BOK+4/5).',
    location: 'Lorencia, Noria, Devias, Atlans, Tarkan, Aida',
    tips: [
      'Avisar por Discord en qué coordenadas aparece el dragón dorado para cazarlo en grupo.',
      'Los Golden Tantalos en Tarkan arrojan Box of Kundun +5 con sets de alto nivel.',
      'Llevar montura (Uniria o Dinorant) para desplazarse a máxima velocidad.',
    ],
  },
  crywolf: {
    iconEmoji: '🐺',
    tagline: 'Defensa de Fortaleza · Beneficio de EXP para todo el servidor',
    mission: 'Defender los 5 Altares Sagrados custodiados por las Elfas contra las tropas oscuras del Comandante Balgass.',
    entryRequirement: 'Nivel 350+ con grupo coordinado. Entrada libre por el Valle de Loren.',
    recommendedParty: 'Comandante Dark Lord en altar central + Blade Masters y Soul Masters en anillos de contención.',
    location: 'Fortaleza de Crywolf (Entrada desde Valle de Loren)',
    tips: [
      'Si el clan defiende la estatua, todo el servidor Smash MU recibe bonus de +20% EXP.',
      'Es obligatorio estar en el canal de voz de Discord para rotar si cae un altar.',
      'Balgass arroja armas excelentes 380 y joyas Guardian.',
    ],
  },
  kanturu: {
    iconEmoji: '💎',
    tagline: 'Refinería de Gemas & Pesadilla · Opciones Harmony',
    mission: 'Derrotar las Manos mecánicas de Maya y aniquilar a Nightmare para acceder a la Torre de Refinamiento de Gemstones.',
    entryRequirement: 'Moonstone Ring equipado (se obtiene en Kanturu 1 y 2). Nivel 380+.',
    recommendedParty: 'Party completa con tanques BK en primera línea, Grand Masters con Soul Barrier y Elfa de curación.',
    location: 'Kanturu Core (Final de Kanturu Relics)',
    tips: [
      'Todos los miembros deben tener su Moonstone Ring colocado antes de que el portal se active.',
      'La torre liberada permite refinar Gemstones en Jewels of Harmony para potenciar ítems.',
      'Nightmare arroja ítems excelentes 380 y sets completos.',
    ],
  },
};

interface EventStatus {
  isOngoing: boolean;
  isImminent: boolean;       // <= 10 min
  isCritical: boolean;       // <= 15 min
  isUnder60Min: boolean;     // <= 60 min
  countdownFormatted: string;
  minutesUntilNext: number;
  secondsUntilNext: number;
  remHours: number;
  remMinutes: number;
  remSeconds: number;
  nextLocalTimeStr: string;
  nextUtcTimeStr: string;
  upcomingTimesToday: string[];
}

export const EventsRadar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string>('bc');
  const [viewMode, setViewMode] = useState<'individual' | 'grid'>('individual');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('anomaly_events_sound') !== 'disabled';
  });
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  const userLocation = useMemo(() => getDetectedUserLocation(), []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synthesizer: Crisp tactical notification chime
  const playTacticalChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio chime unavailable', e);
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('anomaly_events_sound', next ? 'enabled' : 'disabled');
      if (next) playTacticalChime();
      return next;
    });
  };

  // Clocks
  const serverTimeStr = currentTime.toUTCString().slice(17, 25);
  const serverDateStr = currentTime.toUTCString().slice(0, 16);
  const userTimeStr = formatTimeInZone(currentTime, userLocation.timeZone);

  // Compute countdown and schedule list
  const getEventStatus = (
    intervalHours: number,
    offsetMinutes: number,
    durationMinutes: number
  ): EventStatus => {
    const now = currentTime;
    const currentUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const currentUtcSeconds = now.getUTCSeconds();
    const intervalMinutes = intervalHours * 60;

    // Cycle calculation
    const cyclePos =
      ((currentUtcMinutes - offsetMinutes) % intervalMinutes + intervalMinutes) % intervalMinutes;
    const isOngoing = cyclePos < durationMinutes;

    let minutesUntilNext: number;
    if (isOngoing) {
      minutesUntilNext = 0;
    } else {
      minutesUntilNext = intervalMinutes - cyclePos;
    }

    const secondsUntilNext = minutesUntilNext * 60 - currentUtcSeconds;
    const remHours = Math.floor(secondsUntilNext / 3600);
    const remMinutes = Math.floor((secondsUntilNext % 3600) / 60);
    const remSeconds = Math.max(0, secondsUntilNext % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const countdownFormatted = `${pad(remHours)}:${pad(remMinutes)}:${pad(remSeconds)}`;

    // Calculate exact next start time as a Date in user's timezone
    const nextStartUtcDate = new Date(now.getTime() + secondsUntilNext * 1000);
    const nextLocalTimeStr = formatTimeInZone(nextStartUtcDate, userLocation.timeZone).slice(0, 5);
    const nextUtcTimeStr = formatTimeInZone(nextStartUtcDate, 'UTC').slice(0, 5);

    // Compute next 4 upcoming cycles for timeline
    const upcomingTimesToday: string[] = [];
    for (let i = 0; i < 4; i++) {
      const cycleDate = new Date(nextStartUtcDate.getTime() + i * intervalMinutes * 60 * 1000);
      upcomingTimesToday.push(formatTimeInZone(cycleDate, userLocation.timeZone).slice(0, 5));
    }

    const isUnder60Min = !isOngoing && secondsUntilNext > 0 && secondsUntilNext <= 3600;
    const isCritical = !isOngoing && secondsUntilNext > 0 && secondsUntilNext <= 900; // <= 15 min
    const isImminent = !isOngoing && secondsUntilNext > 0 && secondsUntilNext <= 600; // <= 10 min

    return {
      isOngoing,
      isImminent,
      isCritical,
      isUnder60Min,
      countdownFormatted,
      minutesUntilNext,
      secondsUntilNext,
      remHours,
      remMinutes,
      remSeconds,
      nextLocalTimeStr,
      nextUtcTimeStr,
      upcomingTimesToday,
    };
  };

  // Only real, active events in Smash MU (filter out inactive siege from tabs)
  const activeEventsList = useMemo(() => {
    return serverEvents.filter((ev) => ev.id !== 'siege');
  }, []);

  const allEventsWithStatus = useMemo(() => {
    return activeEventsList.map((event) => {
      const status = getEventStatus(event.intervalHours, event.offsetMinutes, event.durationMinutes);
      return { event, status };
    });
  }, [currentTime, activeEventsList]);

  // Selected event object and status
  const currentSelected = useMemo(() => {
    const found = allEventsWithStatus.find((item) => item.event.id === selectedEventId);
    return found || allEventsWithStatus[0];
  }, [allEventsWithStatus, selectedEventId]);

  const currentTip = CLAN_COORDINATION_TIPS[currentSelected?.event.id || 'bc'];

  // Imminent events count (< 60 min)
  const imminentCount = useMemo(() => {
    return allEventsWithStatus.filter(({ status }) => status.isUnder60Min).length;
  }, [allEventsWithStatus]);

  // Copy convocatoria
  const handleCopyCallout = (event: ServerEvent, status: EventStatus) => {
    const tip = CLAN_COORDINATION_TIPS[event.id];
    const text = `🚨 [CONVOCATORIA ANOMALY] ¡Atención clan!
⚔️ Evento: *${event.name}*
⏰ Inicia en: ${status.remMinutes} min (${status.nextLocalTimeStr} hs ${userLocation.flag} ${userLocation.countryName})
📍 Punto de reunión: ${tip?.location || event.zone}
🛡️ Misión: ${tip?.mission || event.description}
👥 Party sugerida: ${tip?.recommendedParty || 'Grupo en Discord'}
¡Conectarse ahora para asegurar cupos y spots!`;

    navigator.clipboard.writeText(text);
    setCopiedEventId(event.id);
    setTimeout(() => setCopiedEventId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Dual Live Clocks */}
      <div className="bg-gradient-to-r from-[#0c101d] via-[#10162a] to-[#0c101d] p-6 rounded-2xl border border-cyan-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-0.5 rounded-full">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Radar de Invasiones &amp; Eventos Oficiales</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Horarios en Tiempo Real de Smash MU
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Selecciona cada evento de forma individual para ver qué es, cómo jugarlo, los drops y los próximos horarios del día adaptados a la hora de tu país ({userLocation.flag} {userLocation.countryName}).
          </p>
        </div>

        {/* Dual Live Clocks & Sound Toggle */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* User Local Time Box */}
          <div className="bg-[#070a14] border border-cyan-500/50 rounded-xl px-4 py-3 flex-1 sm:flex-none sm:min-w-[190px] text-right shadow-lg">
            <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-end space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tu Hora ({userLocation.countryName})</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tabular-nums tracking-wider mt-0.5">
              {userTimeStr}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {userLocation.cityName} · {userLocation.utcOffsetLabel}
            </div>
          </div>

          {/* Server Time Box */}
          <div className="bg-[#070a14] border border-slate-700/80 rounded-xl px-4 py-3 flex-1 sm:flex-none sm:min-w-[170px] text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Server Time (UTC)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-200 font-mono tabular-nums tracking-wider mt-0.5">
              {serverTimeStr}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{serverDateStr}</div>
          </div>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'individual'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-950/40 ring-2 ring-pink-500/50'
                : 'text-slate-400 hover:text-white bg-[#0c101d] border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span>Ver Evento Individual (Detallado)</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-950/40 ring-2 ring-pink-500/50'
                : 'text-slate-400 hover:text-white bg-[#0c101d] border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-300" />
            <span>Ver Todos en Cuadrícula</span>
          </button>
        </div>

        {/* Audio Notification Switch */}
        <button
          onClick={toggleSound}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border self-start sm:self-auto ${
            soundEnabled
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Silenciar alarma' : 'Activar alarma sonora'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Alarma Sonora: Activa (&lt; 60m)</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span>Alarma: Silenciada</span>
            </>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: INDIVIDUAL EVENT SPOTLIGHT VIEWER (CLARO, ENTENDIBLE)  */}
      {/* ============================================================== */}
      {viewMode === 'individual' && currentSelected && (
        <div className="space-y-6">
          {/* Top Event Selector Tabs (Icon, Name, Live Countdown Pill) */}
          <div className="bg-[#0c101d] p-3 rounded-2xl border border-slate-800/80 space-y-2 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 px-1">
              <span>Elige el evento que deseas inspeccionar:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {allEventsWithStatus.map(({ event, status }) => {
                const isSelected = event.id === selectedEventId;
                const tip = CLAN_COORDINATION_TIPS[event.id];

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-purple-950/60 via-[#16142a] to-[#0c101d] border-pink-500 shadow-lg shadow-pink-950/40 ring-2 ring-pink-500/50 scale-[1.02]'
                        : status.isUnder60Min
                        ? 'bg-[#101224] border-amber-500/60 hover:border-amber-400'
                        : 'bg-[#080b15] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Live Pulser if < 60 min */}
                    {status.isUnder60Min && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{tip?.iconEmoji || '⚔️'}</span>
                      <div className="font-bold text-xs text-white truncate">{event.name.split('(')[0]}</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={`font-black px-1.5 py-0.2 rounded ${
                          status.isOngoing
                            ? 'bg-emerald-500 text-slate-950'
                            : status.isCritical
                            ? 'bg-red-500 text-white animate-pulse'
                            : status.isUnder60Min
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'text-cyan-300 bg-slate-900'
                        }`}
                      >
                        {status.isOngoing ? '¡ABIERTO!' : `T- ${status.countdownFormatted}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spotlight Hero of Selected Event */}
          <div
            className={`rounded-2xl p-6 sm:p-8 border transition-all space-y-6 relative overflow-hidden shadow-2xl ${
              currentSelected.status.isOngoing
                ? 'bg-gradient-to-br from-emerald-950/40 via-[#0e171b] to-[#090d16] border-emerald-500/80 shadow-emerald-950/40'
                : currentSelected.status.isCritical
                ? 'bg-gradient-to-br from-red-950/40 via-[#1b0e16] to-[#090d16] border-red-500/90 shadow-red-950/40 ring-2 ring-red-500/80 animate-pulse'
                : currentSelected.status.isUnder60Min
                ? 'bg-gradient-to-br from-amber-950/40 via-[#1c1410] to-[#090d16] border-amber-400/90 shadow-amber-950/40 ring-2 ring-amber-400/70'
                : 'bg-gradient-to-br from-[#101429] via-[#0d1020] to-[#070912] border-purple-500/40 shadow-purple-950/20'
            }`}
          >
            {/* Top Bar: Event Badge, Live Status Pill & Copy Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl sm:text-4xl">{currentTip?.iconEmoji || '⚔️'}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                      {currentSelected.event.name}
                    </h3>
                  </div>
                  <p className="text-xs text-pink-300 font-semibold mt-0.5">
                    {currentTip?.tagline || currentSelected.event.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCallout(currentSelected.event, currentSelected.status)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-md"
                >
                  {copiedEventId === currentSelected.event.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado para Discord/WA!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-pink-400" />
                      <span>Copiar Convocatoria Clan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BIG REAL-TIME COUNTDOWN & SCHEDULE DASHBOARD (GIGANTE Y VISIBLE) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Giant Live Countdown Display */}
              <div className="md:col-span-5 bg-[#070a14]/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Cuenta Regresiva en Vivo</span>
                    </span>

                    {currentSelected.status.isOngoing ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 animate-pulse flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>¡EN CURSO AHORA!</span>
                      </span>
                    ) : currentSelected.status.isCritical ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>¡URGENTE &lt; 15 MIN!</span>
                      </span>
                    ) : currentSelected.status.isUnder60Min ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>EN PREPARACIÓN (&lt; 60M)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        En Espera (Cada {currentSelected.event.intervalHours}h)
                      </span>
                    )}
                  </div>

                  {/* GIANT TIME NUMBERS */}
                  <div className="mt-3">
                    <div
                      className={`text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-widest ${
                        currentSelected.status.isOngoing
                          ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                          : currentSelected.status.isCritical
                          ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]'
                          : currentSelected.status.isUnder60Min
                          ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.4)]'
                          : 'text-cyan-300'
                      }`}
                    >
                      {currentSelected.status.isOngoing
                        ? 'PUERTAS ABIERTAS'
                        : currentSelected.status.countdownFormatted}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      {currentSelected.status.isOngoing
                        ? `Duración del evento: ${currentSelected.event.durationMinutes} minutos`
                        : `Tiempo restante para la siguiente apertura`}
                    </div>
                  </div>
                </div>

                {/* Local & Server Opening Time */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0a0e1c] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Tu Hora ({userLocation.countryName}):
                    </span>
                    <span className="text-base font-black font-mono text-white">
                      {currentSelected.status.isOngoing
                        ? 'Activo Ahora'
                        : `${currentSelected.status.nextLocalTimeStr} hs`}
                    </span>
                  </div>

                  <div className="bg-[#0a0e1c] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Hora Servidor (UTC):
                    </span>
                    <span className="text-base font-black font-mono text-slate-300">
                      {currentSelected.status.isOngoing
                        ? 'Activo Ahora'
                        : `${currentSelected.status.nextUtcTimeStr} UTC`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next 4 Openings Today Timeline */}
              <div className="md:col-span-7 bg-[#070a14]/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-pink-400" />
                    <span>Próximos Horarios de Hoy (Hora Local de {userLocation.countryName})</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Este evento se repite cada{' '}
                    <strong className="text-cyan-300">{currentSelected.event.intervalHours} horas</strong>. Planifica tu conexión:
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {currentSelected.status.upcomingTimesToday.map((timeStr, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        idx === 0
                          ? 'bg-pink-950/40 border-pink-500/80 shadow-md ring-1 ring-pink-500/40'
                          : 'bg-[#0a0e1c] border-slate-800'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        {idx === 0 ? 'Próximo' : `Apertura +${idx}`}
                      </span>
                      <span
                        className={`text-base font-black font-mono block mt-0.5 ${
                          idx === 0 ? 'text-pink-300' : 'text-slate-200'
                        }`}
                      >
                        {timeStr} hs
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tactical Clan Meeting Point */}
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300">
                      Punto de Reunión Anomaly:{' '}
                      <strong className="text-white">{currentTip?.location || currentSelected.event.zone}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded">
                    Reunirse 5m antes
                  </span>
                </div>
              </div>
            </div>

            {/* IN-DEPTH GUIDE: CÓMO SE JUEGA & QUÉ NECESITAS (SUPER ENTENDIBLE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 text-xs">
              {/* Card 1: Misión y Objetivo */}
              <div className="bg-[#070a14] p-5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>1. ¿De qué trata este evento?</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {currentTip?.mission || currentSelected.event.description}
                </p>
                <div className="text-[11px] text-cyan-300/90 pt-1">
                  <strong>Zona de combate:</strong> {currentSelected.event.zone}
                </div>
              </div>

              {/* Card 2: Requisitos y Cómo Entrar */}
              <div className="bg-[#070a14] p-5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>2. ¿Cómo entrar &amp; Requisitos?</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {currentTip?.entryRequirement || currentSelected.event.recommendedLevel}
                </p>
                <div className="text-[11px] text-amber-300/90 pt-1">
                  <strong>Nivel recomendado:</strong> {currentSelected.event.recommendedLevel}
                </div>
              </div>

              {/* Card 3: Botín & Drops Clave */}
              <div className="bg-[#070a14] p-5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                  <Gift className="w-4 h-4 text-pink-400" />
                  <span>3. Recompensas &amp; Drops</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSelected.event.keyDrops.map((drop, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-900 border border-slate-700/80 text-amber-300 px-2 py-1 rounded-lg font-semibold"
                    >
                      {drop}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Duración: <strong className="text-white">{currentSelected.event.durationMinutes} minutos</strong>
                </div>
              </div>
            </div>

            {/* Pro-Tips for Anomaly Clan */}
            {currentTip?.tips && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-pink-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Consejos Tácticos para Miembros del Clan:</span>
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-300 text-[11px]">
                  {currentTip.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-[#070a14] p-2.5 rounded-lg border border-slate-800/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: FULL GRID COMPARATIVE VIEW (TODOS LOS EVENTOS EN VIVO)  */}
      {/* ============================================================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allEventsWithStatus.map(({ event, status }) => {
            const tip = CLAN_COORDINATION_TIPS[event.id];

            const cardStyle = status.isOngoing
              ? 'bg-emerald-950/25 border-emerald-500/70 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
              : status.isCritical
              ? 'bg-gradient-to-b from-red-950/35 to-[#0e101f] border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.35)] ring-2 ring-red-500/80 animate-pulse'
              : status.isUnder60Min
              ? 'bg-gradient-to-b from-amber-950/30 to-[#0c101d] border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/70 animate-pulse'
              : 'bg-[#0c101d] border-slate-800 hover:border-slate-700';

            return (
              <div
                key={event.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 relative ${cardStyle}`}
              >
                {status.isUnder60Min && (
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      status.isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400 animate-ping'
                    }`}
                  />
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {status.isOngoing ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 animate-pulse flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>¡EN CURSO!</span>
                      </span>
                    ) : status.isCritical ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white flex items-center space-x-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>¡INICIA EN {status.remMinutes} MIN!</span>
                      </span>
                    ) : status.isUnder60Min ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>ALERTA &lt; 60 MIN</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded">
                        Cada {event.intervalHours}h
                      </span>
                    )}

                    <span
                      className={`text-xs font-mono tabular-nums font-black ${
                        status.isOngoing
                          ? 'text-emerald-400 font-bold'
                          : status.isCritical
                          ? 'text-red-400'
                          : status.isUnder60Min
                          ? 'text-amber-400'
                          : 'text-cyan-300'
                      }`}
                    >
                      {status.isOngoing ? 'Puertas Abiertas' : `T- ${status.countdownFormatted}`}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-white text-base leading-snug flex items-center space-x-1.5">
                      <span>{tip?.iconEmoji || '⚔️'}</span>
                      <span>{event.name}</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-1">
                    <div
                      className={`inline-flex items-center space-x-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-mono ${
                        status.isUnder60Min
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                          : 'bg-[#070a14] border-cyan-800/40 text-cyan-300'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Próximo inicio:</span>
                      <span className="font-bold text-white">
                        {status.isOngoing ? 'En curso' : `${status.nextLocalTimeStr} hs`}
                      </span>
                      <span className="text-slate-400 font-sans">({userLocation.countryName})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/70 text-xs space-y-2">
                  <div className="flex items-start space-x-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{event.zone}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setViewMode('individual');
                    }}
                    className="w-full py-1.5 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>Ver Detalles de {event.name.split('(')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
