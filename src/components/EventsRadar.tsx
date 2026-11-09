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
  ChevronLeft,
  Info,
  Key,
  Search,
  HelpCircle,
  X,
  Compass,
} from 'lucide-react';
import {
  getDetectedUserLocation,
  formatTimeInZone,
} from '../utils/timezone';

// Tactical mission and squad setup guide for Anomaly clan members (All 20 Smash MU events)
const CLAN_COORDINATION_TIPS: Record<
  string,
  {
    iconEmoji: string;
    tagline: string;
    mission: string;
    entryRequirement: string;
    recommendedParty: string;
    location: string;
    warpCommand: string;
    tips: string[];
  }
> = {
  ds: {
    iconEmoji: '🔮',
    tagline: 'Supervivencia masiva · El mejor leveleo y farm de Smash MU',
    mission: 'Sobrevivir a oleadas continuas de monstruos élite y jefes dorados durante 20 minutos. Los puntos y kills se registran en el ranking oficial.',
    entryRequirement: 'Entrada Devil Square + Joya del Caos (Niveles 1 a 400 según DS 1 a 7). Límite de 2 entradas.',
    recommendedParty: 'Grand Masters y Magic Gladiators (Meteorito / Gigantic Storm) + Energy Elf (Buff) + Dark Lord (Critical Damage)',
    location: 'Noria (Entrada este, coordenadas 171, 105)',
    warpCommand: '/warp noria 171 105',
    tips: [
      'Colocarse en una esquina del mapa para evitar ataques por la espalda.',
      'Al minuto 15 aparecen jefes dorados con alto drop de joyas y cajas Kundun.',
      'Asegurar spot de party con compañeros de Anomaly para maximizar EXP de grupo.',
    ],
  },
  balrog: {
    iconEmoji: '👿',
    tagline: 'Señor Infernal de Lost Tower · Cajas Kundun +3 & Armaduras Élite',
    mission: 'Aniquilar a Balrog en la cima de Lost Tower antes de que sus esbirros oscuros dominen la torre.',
    entryRequirement: 'Acceso directo a Lost Tower 7. Nivel 180+ recomendado.',
    recommendedParty: 'Blade Master (Combo PvP) + Grand Master (Soul Barrier) + Energy Elf',
    location: 'Lost Tower 7 (Altar central del piso 7)',
    warpCommand: '/warp losttower7',
    tips: [
      'Llegar 2 minutos antes para asegurar el control del altar contra otros clanes.',
      'Balrog arroja Cajas Box of Kundun +3 y armas excelentes de Lost Tower.',
      'Mantener buffs de defensa activos contra su ataque de guadaña infernal.',
    ],
  },
  fireflame: {
    iconEmoji: '🏮',
    tagline: 'Invasión de Espectros de Fuego · Joyas del Caos & Creación',
    mission: 'Cazar a los espíritus de fuego y faroles mágicos que descienden en las afueras de las ciudades.',
    entryRequirement: 'Acceso libre en mapas iniciales. Nivel 50+.',
    recommendedParty: 'Grupo móvil con montura (Uniria / Dinorant / Fenrir) para rastrear coordenadas.',
    location: 'Lorencia, Noria y Devias',
    warpCommand: '/warp lorencia',
    tips: [
      'Compartir en el canal de voz de Discord las coordenadas exactas de avistamiento.',
      'Arrojan Lucky Pouches y Joyas de la Creación de alto valor en el baúl del clan.',
    ],
  },
  hydra: {
    iconEmoji: '🐉',
    tagline: 'Terror de las Aguas Profundas · Armas Acuáticas & Kundun +3/+4',
    mission: 'Sumergirse en la fosa de Atlans 3 y derribar a la bestia de múltiples cabezas.',
    entryRequirement: 'Guantes con opción Swimming Speed o Dinorant para movilidad bajo el agua. Nivel 220+.',
    recommendedParty: 'Dark Lord (Fire Scream) + Energy Elf + Blade Knight',
    location: 'Atlans 3 (Profundidades acuáticas)',
    warpCommand: '/warp atlans3',
    tips: [
      'Aprovechar el rango ofensivo para no recibir el aliento venenoso de área.',
      'Excelente fuente de Box of Kundun +4 y joyas.',
    ],
  },
  whitewizard: {
    iconEmoji: '🧙‍♂️',
    tagline: 'Mago Blanco & Tropas Orcas · Anillo Wizard Ring (+10% Daño)',
    mission: 'Derrotar al White Wizard y a sus Destructores Orcos para conseguir el valioso Wizard Ring.',
    entryRequirement: 'Entrada libre en mapas principales. Nivel 80+.',
    recommendedParty: 'Cazadores rápidos con daño en área (Grand Master / MG / Tiradoras Elf)',
    location: 'Lorencia (puertas este/oeste), Noria y Devias',
    warpCommand: '/warp lorencia',
    tips: [
      'El Wizard Ring otorga +10% de daño de skill y velocidad de ataque, esencial para asedios.',
      'Matar a los soldados orcos primero para que no bloqueen el paso hacia el mago.',
    ],
  },
  zaikan: {
    iconEmoji: '🏜️',
    tagline: 'Monarca de las Arenas · Cajas Box of Kundun +4',
    mission: 'Enfrentar a Zaikan en las profundidades del desierto de Tarkan antes de que se desvanezca en la tormenta de arena.',
    entryRequirement: 'Nivel 280+ con set de buena defensa.',
    recommendedParty: 'Blade Knight (Tanque) + Dark Lord + Soul Master con soporte',
    location: 'Tarkan 2 (Final del desierto)',
    warpCommand: '/warp tarkan2',
    tips: [
      'Zaikan tiene alta regeneración; concentrar ráfagas de combo simultáneas.',
      'Arroja armas de Tarkan exc y Box of Kundun +4.',
    ],
  },
  pouch: {
    iconEmoji: '🎒',
    tagline: 'Duendes de la Fortuna · Pouch of Blessing & Joyas Bless',
    mission: 'Capturar a los pequeños duendes que corren despavoridos por las praderas soltando tesoros.',
    entryRequirement: 'Acceso libre a todos los niveles.',
    recommendedParty: 'Individual o parejas cubriendo las salidas de Lorencia y Noria.',
    location: 'Lorencia, Noria, Devias',
    warpCommand: '/warp noria',
    tips: [
      'Son muy veloces; usar habilidades de congelación (Ice Storm / Ice Arrow) para frenarlos.',
      'Gran fuente de Joyas de la Bendición y gemas para el clan.',
    ],
  },
  icequeen: {
    iconEmoji: '❄️',
    tagline: 'Reina del Hielo · Armaduras Heladas Exc & Joyas',
    mission: 'Asaltar el salón helado de Devias y derrocar a la Reina del Hielo.',
    entryRequirement: 'Nivel 100+. Resistencia a frío recomendada.',
    recommendedParty: 'Cualquier guerrero con daño respetable.',
    location: 'Devias 3 y 4 (Castillo de hielo norte)',
    warpCommand: '/warp devias3',
    tips: [
      'Mantener distancia si no tienes resistencia al congelamiento.',
      'Rápido respawn y excelente para farmear sets con opción Luck.',
    ],
  },
  gorgon: {
    iconEmoji: '💀',
    tagline: 'Tirano de las Mazmorras · Box of Kundun +2 / +3',
    mission: 'Penetrar el nivel 3 de Dungeon y reclamar el trono custodiado por Gorgon.',
    entryRequirement: 'Nivel 130+ en Dungeon 3.',
    recommendedParty: 'Guerreros en etapa media de resets.',
    location: 'Dungeon 3 (Cámara del trono)',
    warpCommand: '/warp dungeon3',
    tips: [
      'Cuidado con sus ataques mágicos en cadena en pasillos estrechos.',
    ],
  },
  battleground: {
    iconEmoji: '⚔️',
    tagline: 'Zona de Guerra PvP · Puntos de Honor & Títulos de Clan',
    mission: 'Batalla masiva entre clanes rivales por el control de la zona de guerra de Smash MU.',
    entryRequirement: 'Nivel 350+ con preparación de combate.',
    recommendedParty: 'Escuadra completa de Anomaly en canal de voz (Tanques, Soporte y DPS)',
    location: 'Arena de Batalla PvP',
    warpCommand: '/warp arena',
    tips: [
      'Mantener la formación cerrada; los que se dispersan son presa fácil del combo enemigo.',
      'Llevar el inventario repleto de pociones de SD complejas.',
    ],
  },
  lunarrabbit: {
    iconEmoji: '🐇',
    tagline: 'Conejos Celestiales · Joyas de Creación & Cajas Mágicas',
    mission: 'Encontrar a los conejos lunares que descienden en noches místicas en Elbeland y Noria.',
    entryRequirement: 'Nivel 40+. Libre acceso.',
    recommendedParty: 'Exploradores rápidos con montura.',
    location: 'Elbeland, Noria, Lorencia',
    warpCommand: '/warp elbeland',
    tips: [
      'Matar rápidamente antes de que se desvanezcan.',
      'Drop asegurado de Joyas del Caos y Creación.',
    ],
  },
  bc: {
    iconEmoji: '🏰',
    tagline: 'El Puente del Arcángel · Máxima EXP & Joyas de Asedio',
    mission: 'Cruzar el puente de Devias, romper la puerta, quebrar la estatua de cristal y devolver el arma al Arcángel herido.',
    entryRequirement: 'Capa de Invisibilidad (+1 a +7 según nivel). Límite de 2 entradas.',
    recommendedParty: 'Energy Elf (Buff Daño/Defensa) + Dark Lord (Critical) + Blade Master (Combo) + Magic Gladiator (Limpieza)',
    location: 'Iglesia de Devias (NPC Arcángel coordenadas 209, 30)',
    warpCommand: '/warp devias 209 30',
    tips: [
      'Entrar en el último minuto para asegurar cupo con la party completa del clan.',
      'El buff de Energy Elf es indispensable para romper la puerta en segundos.',
      'Entregar el arma sagrada al NPC da millones de EXP y Joyas al clan.',
    ],
  },
  skeletonking: {
    iconEmoji: '☠️',
    tagline: 'Rey de los No-Muertos · Cajas Kundun +1 & Joyas Bless',
    mission: 'Destruir al Rey Esqueleto que comanda las hordas que asedian las puertas de Lorencia.',
    entryRequirement: 'Nivel 30+.',
    recommendedParty: 'Guerreros en etapa inicial/media de resets.',
    location: 'Lorencia (Alrededores de las 4 puertas y cementerio)',
    warpCommand: '/warp lorencia',
    tips: [
      'Avisar por Discord en cuál de las 4 puertas de Lorencia cayó el spawn.',
    ],
  },
  reddragon: {
    iconEmoji: '🐲',
    tagline: 'Lluvia de Fuego · Cajas Kundun +2/+3 & Joyas Bless y Soul',
    mission: 'Neutralizar el bombardeo de los Dragones Rojos que cruzan los cielos de las ciudades.',
    entryRequirement: 'Nivel 120+.',
    recommendedParty: 'Parties con ataque a distancia (Elfas de arco, Grand Masters).',
    location: 'Lorencia, Noria, Devias',
    warpCommand: '/warp lorencia',
    tips: [
      'Seguir la sombra de los dragones en el suelo para anticipar su aterrizaje.',
    ],
  },
  kanturu: {
    iconEmoji: '💎',
    tagline: 'Refinería de Gemas & Pesadilla · Gemstones & Jewel of Harmony',
    mission: 'Destruir las Manos de Maya y aniquilar a Nightmare para habilitar la Torre de Refinamiento de Gemstones.',
    entryRequirement: 'Moonstone Ring equipado (obligatorio para cruzar el portal). Nivel 380+.',
    recommendedParty: 'Party completa con tanques BK en primera línea, Grand Masters con Soul Barrier y Elfa de curación.',
    location: 'Kanturu Core (Final de Kanturu Relics)',
    warpCommand: '/warp kanturu3',
    tips: [
      'Todos los miembros deben tener el Moonstone Ring colocado antes de que inicie la cuenta atrás.',
      'La torre liberada permite refinar Gemstones en Jewels of Harmony para potenciar ítems de guerra.',
      'Nightmare arroja ítems excelentes 380 y sets completos.',
    ],
  },
  golden: {
    iconEmoji: '✨',
    tagline: 'Invasión Dorada Oficial · Box of Kundun +1 a +5 & Sets Élite',
    mission: 'Invasión masiva de Dragones Dorados, Golden Tantalos, Golden Derkon y Golden Goblins.',
    entryRequirement: 'Acceso a mapas según nivel (150 a 400). Coordinado con turnos de 14:00, 19:00 y 23:00 CLT.',
    recommendedParty: 'Dividir a los miembros de Anomaly en 4 continentes: Lorencia (BOK+1), Devias (BOK+2/3), Atlans y Tarkan (BOK+4/5).',
    location: 'Lorencia, Noria, Devias, Atlans, Tarkan, Aida',
    warpCommand: '/warp tarkan',
    tips: [
      'Avisar inmediatamente por Discord en qué coordenadas aparece cada dorado.',
      'Los Golden Tantalos en Tarkan arrojan Box of Kundun +5 con armaduras de alto nivel.',
      'Marcar la asistencia en el canal #asistencias para el registro oficial del clan.',
    ],
  },
  giantcrab: {
    iconEmoji: '🦀',
    tagline: 'Monstruo de las Fosas Abisales · Box of Kundun +5',
    mission: 'Descender a la fosa más profunda de Atlans y quebrar el caparazón blindado del Cangrejo Gigante.',
    entryRequirement: 'Nivel 360+ con set de reducción de daño.',
    recommendedParty: 'Escuadra élite con buffer y Dark Lord de alto daño.',
    location: 'Atlans 3 Abisal',
    warpCommand: '/warp atlans3',
    tips: [
      'Tiene altísima defensa física; usar daño elemental y combos perforantes.',
      'Excelente fuente de Box of Kundun +5 para el baúl del clan.',
    ],
  },
  protodrakan: {
    iconEmoji: '🦖',
    tagline: 'Bestia Biomecánica · Ítems Season 6 Élite & Seeds',
    mission: 'Cazar al prototipo Drakan en las tierras pantanosas de Karutan.',
    entryRequirement: 'Nivel 400 (Master Level recomendado).',
    recommendedParty: 'Party de combate pesado con alta regeneración de vida y SD.',
    location: 'Karutan 2 / Pantano Oscuro',
    warpCommand: '/warp karutan2',
    tips: [
      'Sus ataques de área empujan a los guerreros; arrinconarlo contra un obstáculo.',
      'Arroja ítems socket y gemas de refinación avanzada.',
    ],
  },
  nix: {
    iconEmoji: '🌊',
    tagline: 'World Boss Lago Nixie · Armas y Escudos Nixie Legendarios',
    mission: 'Operación mayor de la alianza ANOMALY para doblegar al dios acuático Nix en Nixies Lake.',
    entryRequirement: 'Master Level 100+ con grupo coordinado y Spirit Stone para acceder al santuario.',
    recommendedParty: 'Alianza completa en canal de voz (Raid de varios grupos con rotación de buffers).',
    location: 'Nixies Lake (Santuario central)',
    warpCommand: '/warp nixieslake',
    tips: [
      'Boss de ciclo multidiario (~112 horas de respawn según Event Timer).',
      'Esquivar sus círculos de hielo congelante que anulan pociones de SD.',
      'Arroja armas legendarias Nixie y recompensas Ruud para todo el clan.',
    ],
  },
  lordferea: {
    iconEmoji: '👑',
    tagline: 'Raid Supremo Semanal · Armas y Escudos Ferea Ancestrales',
    mission: 'El desafío definitivo de Smash MU. Derrotar al Señor Supremo de Ferea en su sala de cristal.',
    entryRequirement: 'Master Level 150 con set completo +13/+15 y opciones Harmony activas.',
    recommendedParty: 'Todo el roster oficial de Anomaly bajo el mando de UlmerMG y oficiales.',
    location: 'Ferea Crystal Sanctum',
    warpCommand: '/warp ferea',
    tips: [
      'Respawn semanal (~141 horas de ciclo según Event Timer oficial).',
      'Requiere coordinación militar por Discord con roles estrictos de tanques, buffers y DPS.',
      'El botín incluye las mejores armas y armaduras ancestrales de todo el servidor.',
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
  const [selectedEventId, setSelectedEventId] = useState<string>('ds');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'event' | 'boss_invasion' | 'world_boss'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('anomaly_events_sound') !== 'disabled';
  });
  const [trackedEvents, setTrackedEvents] = useState<Record<string, boolean>>(() => {
    return { ds: true, bc: true, golden: true };
  });
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);

  const userLocation = useMemo(() => getDetectedUserLocation(), []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synthesizer: Crisp tactical notification chime (5 minute alert)
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

  const toggleTrackEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackedEvents((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && soundEnabled) playTacticalChime();
      return next;
    });
  };

  // Clocks
  const serverTimeStr = currentTime.toUTCString().slice(17, 25);
  const serverDateStr = currentTime.toUTCString().slice(0, 16);
  const userTimeStr = formatTimeInZone(currentTime, userLocation.timeZone);

  // Compute countdown and schedule list using epoch minutes to support multi-day bosses
  const getEventStatus = (
    intervalHours: number,
    offsetMinutes: number,
    durationMinutes: number
  ): EventStatus => {
    const now = currentTime;
    const intervalMinutes = intervalHours * 60;
    const totalEpochMinutes = Math.floor(now.getTime() / 60000);
    const currentSeconds = now.getSeconds();

    // Cycle calculation
    const cyclePos =
      ((totalEpochMinutes - offsetMinutes) % intervalMinutes + intervalMinutes) % intervalMinutes;
    const isOngoing = cyclePos < durationMinutes;

    let minutesUntilNext: number;
    if (isOngoing) {
      minutesUntilNext = 0;
    } else {
      minutesUntilNext = intervalMinutes - cyclePos;
    }

    const secondsUntilNext = isOngoing ? 0 : minutesUntilNext * 60 - currentSeconds;
    const remHours = Math.floor(secondsUntilNext / 3600);
    const remMinutes = Math.floor((secondsUntilNext % 3600) / 60);
    const remSeconds = Math.max(0, secondsUntilNext % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    // Format: "HH:MM:SS" (e.g. "00:01:51" or "112:01:13" exactly matching the client screenshots!)
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
    const isImminent = !isOngoing && secondsUntilNext > 0 && secondsUntilNext <= 300; // <= 5 min (matching "BELL TRACKS A 5 MINUTE ALERT")

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

  // Compute status for all 20 real Smash MU events
  const allEventsWithStatus = useMemo(() => {
    return serverEvents.map((event) => {
      const status = getEventStatus(event.intervalHours, event.offsetMinutes, event.durationMinutes);
      return { event, status };
    });
  }, [currentTime]);

  // Sort queue identically to in-game client: Ongoing "OPEN" first, then ordered by upcoming secondsUntilNext
  const sortedQueue = useMemo(() => {
    let list = [...allEventsWithStatus];

    // Filter by category
    if (categoryFilter === 'event') {
      list = list.filter(({ event }) => event.category === 'event' || event.category === 'pvp');
    } else if (categoryFilter === 'boss_invasion') {
      list = list.filter(({ event }) => event.category === 'boss' || event.category === 'invasion');
    } else if (categoryFilter === 'world_boss') {
      list = list.filter(({ event }) => event.category === 'world_boss' || event.id === 'kanturu');
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        ({ event }) =>
          event.name.toLowerCase().includes(q) ||
          event.zone.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q)
      );
    }

    // Sort: Ongoing first, then by ascending remaining time
    return list.sort((a, b) => {
      if (a.status.isOngoing && !b.status.isOngoing) return -1;
      if (!a.status.isOngoing && b.status.isOngoing) return 1;
      return a.status.secondsUntilNext - b.status.secondsUntilNext;
    });
  }, [allEventsWithStatus, categoryFilter, searchQuery]);

  // Selected event object and status
  const currentSelected = useMemo(() => {
    const found = allEventsWithStatus.find((item) => item.event.id === selectedEventId);
    return found || allEventsWithStatus[0];
  }, [allEventsWithStatus, selectedEventId]);

  const currentTip = CLAN_COORDINATION_TIPS[currentSelected?.event.id || 'ds'];

  // Handle "Move to event" action (copies coordinates and warp command)
  const handleMoveToEvent = (event: ServerEvent) => {
    const tip = CLAN_COORDINATION_TIPS[event.id];
    const cmd = tip?.warpCommand || `/warp ${event.zone.split(' ')[0].toLowerCase()}`;
    navigator.clipboard.writeText(cmd);
    setCopiedNotice(`¡Comando "${cmd}" copiado al portapapeles! Pégalo en el chat de Smash MU.`);
    setTimeout(() => setCopiedNotice(null), 4000);
  };

  // Copy Discord convocatoria
  const handleCopyCallout = (event: ServerEvent, status: EventStatus) => {
    const tip = CLAN_COORDINATION_TIPS[event.id];
    const text = `🚨 [CONVOCATORIA ANOMALY] ¡Atención clan!
⚔️ Evento: *${event.name}*
⏰ Estado: ${status.isOngoing ? '¡ABIERTO AHORA!' : `Inicia en ${status.countdownFormatted} (${status.nextLocalTimeStr} hs ${userLocation.flag} ${userLocation.countryName})`}
📍 Zona: ${tip?.location || event.zone}
🗺️ Warp: ${tip?.warpCommand || '/warp noria'}
🛡️ Misión: ${tip?.mission || event.description}
👥 Party recomendada: ${tip?.recommendedParty || 'Escuadra en Discord'}
¡Conectarse ahora para asegurar cupos!`;

    navigator.clipboard.writeText(text);
    setCopiedNotice('¡Convocatoria copiada para Discord y WhatsApp del clan!');
    setTimeout(() => setCopiedNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Authentic Smash MU Event Timer Frame */}
      <div className="bg-gradient-to-r from-[#070b16] via-[#0d1428] to-[#070b16] p-5 sm:p-6 rounded-2xl border-2 border-cyan-500/40 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/40 text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Event Timer · Smash MU
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              EN VIVO
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sincronizado con la ventana oficial del cliente de Smash MU. Consulta los 20 eventos y jefes reales, cupos de entrada (0/2) y cuentas regresivas exactas adaptadas a tu hora local ({userLocation.flag} {userLocation.countryName}).
          </p>
        </div>

        {/* Dual Live Clocks & Global Bell Sound Switch */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* User Local Clock */}
          <div className="bg-[#050711] border border-cyan-500/60 rounded-xl px-4 py-2.5 flex-1 sm:flex-none sm:min-w-[190px] text-right shadow-lg">
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

          {/* Server UTC Clock */}
          <div className="bg-[#050711] border border-slate-700/80 rounded-xl px-4 py-2.5 flex-1 sm:flex-none sm:min-w-[160px] text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Server Time (UTC)</div>
            <div className="text-xl sm:text-2xl font-black text-slate-200 font-mono tabular-nums tracking-wider mt-0.5">
              {serverTimeStr}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{serverDateStr}</div>
          </div>

          {/* Sound Notification Alert Toggle */}
          <button
            onClick={toggleSound}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-md ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Alarma sonora activa para alertas de 5 minutos' : 'Activar alarma sonora'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {copiedNotice && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 1: IN-GAME EVENT TIMER SPOTLIGHT WINDOW (IDÉNTICO AL JUEGO)   */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-b from-[#0e162d] via-[#090e1f] to-[#070b18] rounded-2xl border-2 border-cyan-500/40 p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
        {/* Window Top Controls (Icon, Title, Help, Close preview) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black text-slate-200 uppercase tracking-widest font-mono">
              Event Timer
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-cyan-400 font-mono">Smash MU Official Schedule</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowTacticalGuide((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Guía y Requisitos de Entrada"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Spotlight Card: Hero Image on Left, Details & Giant Countdown on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Event Visual Card / Photo Banner with DS/BC badge */}
          <div className="lg:col-span-5 relative group">
            <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-[#1a1233] via-[#0e1124] to-[#0a0714] border-2 border-slate-700/80 overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
              {/* Background ambient lighting */}
              <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-black/80 pointer-events-none" />

              {/* Photo tag & badge */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded bg-black/70 border border-slate-700 text-[10px] text-slate-300 font-mono">
                    Photo 1
                  </span>
                  {currentSelected.event.category && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-300 uppercase font-mono font-bold">
                      {currentSelected.event.category}
                    </span>
                  )}
                </div>

                {currentSelected.event.badge && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-md">
                    {currentSelected.event.badge}
                  </span>
                )}
              </div>

              {/* Center icon / illustration representation */}
              <div className="flex flex-col items-center justify-center my-auto text-center space-y-2 z-10">
                <span className="text-5xl sm:text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {currentTip?.iconEmoji || '⚔️'}
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow-md">
                  {currentSelected.event.name}
                </span>
                <span className="text-[11px] text-cyan-300 font-medium">
                  {currentSelected.event.zone}
                </span>
              </div>

              {/* Bottom Arrows toggle */}
              <div className="flex items-center justify-between z-10 pt-2 border-t border-slate-800/60">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const idx = serverEvents.findIndex((e) => e.id === selectedEventId);
                      const prevIdx = (idx - 1 + serverEvents.length) % serverEvents.length;
                      setSelectedEventId(serverEvents[prevIdx].id);
                    }}
                    className="p-1 rounded bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const idx = serverEvents.findIndex((e) => e.id === selectedEventId);
                      const nextIdx = (idx + 1) % serverEvents.length;
                      setSelectedEventId(serverEvents[nextIdx].id);
                    }}
                    className="p-1 rounded bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {currentSelected.event.entries ? `Cupos: ${currentSelected.event.entries}` : 'Entrada libre'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Entries, COUNTDOWN & Action Buttons */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                    {currentSelected.event.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-pink-300/90 font-medium mt-1">
                    {currentTip?.tagline || currentSelected.event.description}
                  </p>
                </div>

                {currentSelected.event.entries && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">Entries</span>
                    <span className="text-sm font-black font-mono text-cyan-300 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                      {currentSelected.event.entries}
                    </span>
                  </div>
                )}
              </div>

              {/* COUNTDOWN SECTION (IDÉNTICO AL JUEGO: LABEL COUNTDOWN + GIGANTE OPEN O TIEMPO) */}
              <div className="mt-5 p-5 bg-[#050814]/90 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
                <span className="text-[11px] uppercase tracking-widest font-black text-slate-400 font-mono block">
                  COUNTDOWN
                </span>

                <div className="flex items-baseline space-x-3">
                  {currentSelected.status.isOngoing ? (
                    <div className="text-5xl sm:text-6xl font-black font-mono text-amber-300 drop-shadow-[0_0_25px_rgba(252,211,77,0.6)] tracking-wider animate-pulse">
                      OPEN
                    </div>
                  ) : (
                    <div
                      className={`text-5xl sm:text-6xl font-black font-mono tabular-nums tracking-widest ${
                        currentSelected.status.isCritical
                          ? 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]'
                          : currentSelected.status.isUnder60Min
                          ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.4)]'
                          : 'text-amber-400 font-mono'
                      }`}
                    >
                      {currentSelected.status.countdownFormatted}
                    </div>
                  )}

                  {!currentSelected.status.isOngoing && (
                    <span className="text-xs font-mono text-slate-400">
                      ({currentSelected.status.nextLocalTimeStr} hs en {userLocation.countryName})
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono pt-1 flex items-center space-x-2">
                  <span>Duración: {currentSelected.event.durationMinutes} min</span>
                  <span>·</span>
                  <span>Ciclo: Cada {currentSelected.event.intervalHours}h</span>
                  <span>·</span>
                  <span className="text-cyan-400">Hora Servidor: {currentSelected.status.nextUtcTimeStr} UTC</span>
                </div>
              </div>
            </div>

            {/* In-Game Action Buttons: Move to event (Golden button), Bell Alert, Guide (Purple) */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
              {/* Golden "Move to event" button (copies warp coordinates into game) */}
              <button
                type="button"
                onClick={() => handleMoveToEvent(currentSelected.event)}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Move to event</span>
              </button>

              {/* Bell alert tracker button */}
              <button
                type="button"
                onClick={(e) => toggleTrackEvent(currentSelected.event.id, e)}
                className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  trackedEvents[currentSelected.event.id]
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={
                  trackedEvents[currentSelected.event.id]
                    ? 'Alerta sonora de 5 minutos activa para este evento'
                    : 'Activar alerta sonora de 5 minutos'
                }
              >
                {trackedEvents[currentSelected.event.id] ? (
                  <BellRing className="w-5 h-5 text-emerald-400 animate-bounce" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </button>

              {/* Purple "Guide" button */}
              <button
                type="button"
                onClick={() => setShowTacticalGuide((prev) => !prev)}
                className="py-3 px-5 bg-gradient-to-r from-purple-800 to-violet-800 hover:from-purple-700 hover:to-violet-700 text-white font-extrabold text-xs sm:text-sm rounded-xl border border-purple-500/40 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Info className="w-4 h-4 text-purple-200" />
                <span>{showTacticalGuide ? 'Ocultar Guía' : 'Guide'}</span>
              </button>

              {/* Copy Discord Convocatoria */}
              <button
                type="button"
                onClick={() => handleCopyCallout(currentSelected.event, currentSelected.status)}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Copiar texto formateado para Discord"
              >
                <Copy className="w-3.5 h-3.5 text-pink-400" />
                <span>Convocatoria Clan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tactical Guide Drawer if toggled */}
        {showTacticalGuide && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
            <div className="bg-[#050711] p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>1. Misión &amp; Cómo Jugar</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentTip?.mission || currentSelected.event.description}
              </p>
              <div className="text-[10px] text-cyan-300 font-mono">
                Warp: {currentTip?.warpCommand || '/warp'}
              </div>
            </div>

            <div className="bg-[#050711] p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>2. Requisitos de Entrada</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentTip?.entryRequirement || currentSelected.event.recommendedLevel}
              </p>
              <div className="text-[10px] text-amber-300 font-mono">
                Cupos: {currentSelected.event.entries || 'Ilimitados'}
              </div>
            </div>

            <div className="bg-[#050711] p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Gift className="w-4 h-4 text-pink-400" />
                <span>3. Drops &amp; Recompensas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentSelected.event.keyDrops.map((drop, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-900 border border-slate-700 text-amber-300 px-2 py-0.5 rounded font-mono font-bold"
                  >
                    {drop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: ACTIVITY QUEUE (LISTA REAL DE LOS 20 EVENTOS DE SMASH MU)   */}
      {/* ===================================================================== */}
      <div className="bg-[#0c101d] rounded-2xl p-6 border border-slate-800/90 shadow-xl space-y-4">
        {/* Header row with "Activity Queue" and "BELL TRACKS A 5 MINUTE ALERT" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2 font-mono tracking-wide">
              <span>Activity Queue</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ordenados cronológicamente por orden de apertura en tiempo real.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>BELL TRACKS A 5 MINUTE ALERT</span>
            </span>
          </div>
        </div>

        {/* Filter categories & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070a14] rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`py-1 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos (20)
            </button>
            <button
              onClick={() => setCategoryFilter('event')}
              className={`py-1 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === 'event'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Eventos (DS / BC / BattleGround)
            </button>
            <button
              onClick={() => setCategoryFilter('boss_invasion')}
              className={`py-1 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === 'boss_invasion'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Jefes &amp; Invasiones
            </button>
            <button
              onClick={() => setCategoryFilter('world_boss')}
              className={`py-1 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === 'world_boss'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              World Bosses (Nix, Ferea, Maya)
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evento o mapa..."
              className="w-full bg-[#070a14] border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 3-Column / 2-Column Activity Queue Grid matching the client screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedQueue.map(({ event, status }) => {
            const isSelected = event.id === selectedEventId;
            const tip = CLAN_COORDINATION_TIPS[event.id];
            const isTracked = trackedEvents[event.id];

            // Card border styling matching in-game green border when OPEN or active
            const isGreenBorder = status.isOngoing;
            const isCriticalBorder = status.isCritical && !status.isOngoing;

            return (
              <div
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#121c38] to-[#0a1024] border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                    : isGreenBorder
                    ? 'bg-[#081512] border-emerald-500/80 shadow-md shadow-emerald-950/30'
                    : isCriticalBorder
                    ? 'bg-[#180d14] border-red-500/80 shadow-md shadow-red-950/30 ring-1 ring-red-500/40'
                    : 'bg-[#080b15] border-slate-800/90 hover:border-slate-700 hover:bg-[#0c1020]'
                }`}
              >
                {/* Left: Thumbnail Icon Badge */}
                <div
                  className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isGreenBorder
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                      : isCriticalBorder
                      ? 'bg-red-950/50 border-red-500/60 text-red-300'
                      : 'bg-[#0d1222] border-slate-700/80 text-white'
                  }`}
                >
                  <span className="text-2xl">{tip?.iconEmoji || '⚔️'}</span>
                  {event.badge && (
                    <span className="text-[8px] font-mono font-black text-amber-300 mt-0.5">
                      {event.badge}
                    </span>
                  )}
                </div>

                {/* Center: Title & Subtitle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-extrabold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                      {event.name}
                    </h4>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {event.entries ? `Entries: ${event.entries}` : 'Click to preview'}
                  </span>

                  {/* Countdown Timer row */}
                  <div className="mt-1">
                    {status.isOngoing ? (
                      <span className="text-xs font-black font-mono text-emerald-400 drop-shadow-sm tracking-wider">
                        OPEN
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-black font-mono tracking-wider tabular-nums ${
                          status.isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'
                        }`}
                      >
                        {status.countdownFormatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Bell Icon Button */}
                <button
                  type="button"
                  onClick={(e) => toggleTrackEvent(event.id, e)}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    isTracked
                      ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/40'
                      : 'text-slate-600 hover:text-slate-300'
                  }`}
                  title={isTracked ? 'Alerta sonora activa' : 'Rastrear alerta de 5 minutos'}
                >
                  {isTracked ? <BellRing className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
