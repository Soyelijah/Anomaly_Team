export type CharacterClass = 'BK' | 'SM' | 'ELF' | 'DL' | 'MG' | 'SUM' | 'RF' | 'GL' | 'RW' | 'OTHER';

export type SquadRole = 'frontline' | 'support' | 'seal' | 'disruptor';

export type AttendanceStatus = 'confirmed' | 'pending' | 'absent';

export type AccountCategory = 'main' | 'buffer' | 'farm' | 'vault';

export interface Character {
  id: string;
  name: string;
  characterClass: CharacterClass;
  classNameTitle?: string;
  level: number;
  resets: number;
  gearscore?: number;
  serverRank?: number;
  masterResets?: number;
  online: boolean;
  build: string;
  squad: SquadRole;
  note: string;
  attendance: AttendanceStatus;
  category: AccountCategory;
  assignedPlayer: string;
  guild?: string;
  isMaster?: boolean;
  rank?: number;
}

export interface ServerEvent {
  id: string;
  name: string;
  intervalHours: number;
  offsetMinutes: number;
  durationMinutes: number;
  zone: string;
  description: string;
  keyDrops: string[];
  recommendedLevel: string;
}

export interface SharedAccount {
  id: string;
  title: string;
  accountCategory: 'buffer_elf' | 'dl_summon' | 'guild_vault' | 'farm_mg';
  characterName: string;
  characterClass: CharacterClass;
  level: number;
  resets: number;
  purpose: string;
  holder: string;
  status: 'available' | 'in_use';
  inventorySummary: string;
  accessCodeHint: string;
}

export interface ClanConfig {
  name: string;
  tag: string;
  master: string;
  assistant: string;
  battleMasters: string[];
  motto: string;
  founded: string;
  alliance: string;
  castleStatus: 'holding' | 'attacking' | 'contender';
  currentCastle: string;
  discordUrl: string;
  whatsappUrl: string;
}

// =================== SMASH MU OFFICIAL API TYPES ===================

export interface SmashMUGearScoreItem {
  Name: string;
  Class: number;
  GearScore: number;
  Guild: string;
  rank?: number;
}

export interface SmashMURosterMember {
  name: string;
  class: number;
  gearscore: number;
  points: number;
  is_master: boolean;
  counts_for_score: boolean;
  // Crossed data from ranking
  serverGearScore?: number;
  serverRank?: number;
  serverClass?: number;
  serverGuild?: string;
}

export interface SmashMUGuildStanding {
  rank: number;
  guild_name: string;
  guild_master: string;
  total_points: number;
  total_kills: number;
  member_count: number;
  guild_gearscore: number;
  roster: SmashMURosterMember[];
}

export interface SmashMUEquipmentItem {
  slotIndex: number;
  slotLabel: string;
  isEmpty: boolean;
  group: number;
  index: number;
  realIndex: number;
  level: number;
  skill: boolean;
  luck: boolean;
  life: number;
  option: number;
  excellent: number;
  ancient: number;
  harmony: number;
  harmonyOption?: {
    type: number;
    level: number;
    name: string;
    nameEn: string;
    value: number;
    isPercent: boolean;
    label: string;
    labelEn: string;
  } | null;
  sockets?: number[];
  socketCount?: number;
  durability: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imagePath: string;
  name: string;
  excellentOptions?: string[];
  additionalOption?: string | null;
  stats?: {
    damageMin?: number;
    damageMax?: number;
    defense?: number;
    defenseSuccessRate?: number;
    attackSpeed?: number;
    maxDurability?: number;
    requireLevel?: number;
    requireStrength?: number;
    requireDexterity?: number;
    requireEnergy?: number;
    requireVitality?: number;
    requireLeadership?: number;
    allowedClasses?: string[];
  };
}

export interface SmashMUCharacterProfile {
  success: boolean;
  hidden: boolean;
  isOwner: boolean;
  realm: string;
  character: {
    name: string;
    class: number;
    className: string;
    classKey: string;
    level: number;
    resets: number;
    masterResets: number;
    gearScore: number;
    guild?: {
      name: string;
      isMaster: boolean;
      mark: string;
    };
  };
  equipment: SmashMUEquipmentItem[];
}

export interface SmashMUGuildLeagueSeason {
  id: string;
  league_type: number;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  min_members?: number;
  min_guild_gearscore?: number;
  max_guilds?: number;
  standings: SmashMUGuildStanding[];
  monsters?: Array<{ monster_name: string; points: number }>;
}

export interface SmashMULeaguesResponse {
  success: boolean;
  available: boolean;
  current: SmashMUGuildLeagueSeason[];
  history: SmashMUGuildLeagueSeason[];
}

export interface SmashMUGearScoreResponse {
  success: boolean;
  ranking: SmashMUGearScoreItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Class decoder utility for MU Online class numbers
export function decodeMuClass(classId: number | string): {
  code: string;
  name: string;
  category: CharacterClass;
  colorClass: string;
} {
  const id = typeof classId === 'string' ? parseInt(classId, 10) : classId;

  // Dark Knight / Blade Knight / Blade Master
  if (id >= 16 && id <= 20) {
    const isMaster = id === 18;
    return {
      code: isMaster ? 'BM' : id === 17 ? 'BK' : 'DK',
      name: isMaster ? 'Blade Master' : id === 17 ? 'Blade Knight' : 'Dark Knight',
      category: 'BK',
      colorClass: 'bg-red-950/80 text-red-300 border-red-700/60',
    };
  }

  // Dark Wizard / Soul Master / Grand Master
  if (id >= 0 && id <= 4) {
    const isMaster = id === 2;
    return {
      code: isMaster ? 'GM' : id === 1 ? 'SM' : 'DW',
      name: isMaster ? 'Grand Master' : id === 1 ? 'Soul Master' : 'Dark Wizard',
      category: 'SM',
      colorClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
    };
  }

  // Fairy Elf / Muse Elf / High Elf
  if (id >= 32 && id <= 36) {
    const isMaster = id === 34;
    return {
      code: isMaster ? 'HE' : id === 33 ? 'ME' : 'FE',
      name: isMaster ? 'High Elf' : id === 33 ? 'Muse Elf' : 'Fairy Elf',
      category: 'ELF',
      colorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    };
  }

  // Magic Gladiator / Duel Master
  if (id >= 48 && id <= 52) {
    return {
      code: id >= 49 ? 'DM' : 'MG',
      name: id >= 49 ? 'Duel Master' : 'Magic Gladiator',
      category: 'MG',
      colorClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    };
  }

  // Dark Lord / Lord Emperor
  if (id >= 64 && id <= 68) {
    return {
      code: id >= 65 ? 'LE' : 'DL',
      name: id >= 65 ? 'Lord Emperor' : 'Dark Lord',
      category: 'DL',
      colorClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    };
  }

  // Summoner / Bloody Summoner / Dimension Master
  if (id >= 80 && id <= 84) {
    return {
      code: id >= 82 ? 'DiM' : id === 81 ? 'BS' : 'SUM',
      name: id >= 82 ? 'Dimension Master' : id === 81 ? 'Bloody Summoner' : 'Summoner',
      category: 'SUM',
      colorClass: 'bg-pink-950/80 text-pink-300 border-pink-700/60',
    };
  }

  // Rage Fighter / Fist Master
  if (id >= 96 && id <= 100) {
    return {
      code: id >= 98 ? 'FM' : 'RF',
      name: id >= 98 ? 'Fist Master' : 'Rage Fighter',
      category: 'RF',
      colorClass: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
    };
  }

  // Grow Lancer / Mirage Lancer
  if (id >= 112 && id <= 116) {
    return {
      code: id >= 114 ? 'ML' : 'GL',
      name: id >= 114 ? 'Mirage Lancer' : 'Grow Lancer',
      category: 'GL',
      colorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    };
  }

  // Rune Wizard / Grand Rune Master
  if (id >= 128 && id <= 132) {
    return {
      code: id >= 130 ? 'GRM' : 'RW',
      name: id >= 130 ? 'Grand Rune Master' : 'Rune Wizard',
      category: 'RW',
      colorClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
    };
  }

  return {
    code: `C${id}`,
    name: `Clase ${id}`,
    category: 'OTHER',
    colorClass: 'bg-slate-800 text-slate-300 border-slate-700',
  };
}

// =================== DKP & SUBASTA TYPES ===================

export interface AuctionItem {
  id: string;
  itemName: string;
  itemLevel: string;
  slotLabel?: string;
  tag?: string; // '[LEGENDARY]', '[EPIC]', '[RARE]', '[EXC]', '[ANCIENT]'
  category: 'weapon' | 'armor' | 'wings' | 'pet' | 'jewels';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  excellentOptions: string[];
  sellerName: string;
  currencyType: 'bless' | 'dkp';
  startingBid: number;
  currentBid: number;
  highestBidder: string;
  buyoutPrice?: number;
  endsAt: number; // timestamp in ms
  status: 'active' | 'sold' | 'expired';
  // Discord & Database Lifecycle Integration
  es_subasta?: boolean; // Verdadero si pertenece a una subasta para gestionar en Discord
  estado?: 'Activo' | 'Vendido' | 'Cancelado'; // Control de ciclo de venta
  discord_message_id?: string; // ID del mensaje generado por Discord al publicar
  linkWeb?: string; // Enlace a la subasta en la web
  imagePath?: string;
  spriteUrl?: string; // Isolated 3D item sprite render
  screenshotUrl?: string; // Full original screenshot/receipt proof
  stats?: {
    damageMin?: number;
    damageMax?: number;
    defense?: number;
    attackSpeed?: number;
    durability?: number;
    maxDurability?: number;
    strengthReq?: number;
    agilityReq?: number;
    energyReq?: number;
  };
  classesAllowed?: string[];
  additionalStat?: string; // e.g. 'Additional defense +8'
  harmonyOption?: string;
  gearTechOption?: string; // e.g. 'All Stats +20 MAX · Armor +13%'
  hasSkill?: boolean;
  hasLuck?: boolean;
  gearScore?: number; // e.g. 136
}

export interface DKPMember {
  id: string;
  characterName: string;
  characterClass: CharacterClass;
  currentDKP: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  attendances: number;
  lastEventAttended: string;
  rank: number;
}

export interface DKPLogEntry {
  id: string;
  date: string;
  characterName: string;
  amount: number;
  reason: string;
  awardedBy: string;
}

