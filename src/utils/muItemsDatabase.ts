/**
 * Official MU Online Season 6 / SmashMU Items Registry
 * Provides official item definitions, groups, indices, authentic sprite URLs, default rarities, and stats.
 */

import COMPLETE_SMASHMU_ITEMS from '../data/smashMuCompleteCatalog.json';

export interface MuCatalogItem {
  name: string;
  group: number;
  index: number;
  imagePath: string; // e.g. "/en/items/2-8.gif"
  slotLabel: string;
  category: 'weapon' | 'armor' | 'wings' | 'pet' | 'jewels';
  defaultRarity: 'legendary' | 'epic' | 'rare' | 'uncommon';
  defaultTag: string; // '[LEGENDARY]' | '[EPIC]' | '[RARE]' | '[EXC]'
  stats?: {
    damageMin?: number;
    damageMax?: number;
    defense?: number;
    attackSpeed?: number;
    maxDurability?: number;
    strengthReq?: number;
    agilityReq?: number;
    energyReq?: number;
    allowedClasses?: string[];
  };
}

export const SMASHMU_ITEM_CATALOG: MuCatalogItem[] = [
  // =================== SCEPTERS & WEAPONS (Dark Lord) ===================
  {
    name: 'Battle Scepter',
    group: 2,
    index: 8,
    imagePath: '/en/items/2-8.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 41,
      damageMax: 52,
      attackSpeed: 45,
      maxDurability: 40,
      strengthReq: 80,
      agilityReq: 17,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Master Scepter',
    group: 2,
    index: 9,
    imagePath: '/en/items/2-9.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      damageMin: 48,
      damageMax: 58,
      attackSpeed: 45,
      maxDurability: 45,
      strengthReq: 95,
      agilityReq: 22,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Great Scepter',
    group: 2,
    index: 13,
    imagePath: '/en/items/2-13.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 74,
      damageMax: 85,
      attackSpeed: 45,
      maxDurability: 65,
      strengthReq: 180,
      agilityReq: 60,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Lord Scepter',
    group: 2,
    index: 14,
    imagePath: '/en/items/2-14.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 85,
      damageMax: 97,
      attackSpeed: 45,
      maxDurability: 70,
      strengthReq: 210,
      agilityReq: 70,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Great Lord Scepter',
    group: 2,
    index: 15,
    imagePath: '/en/items/2-15.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 98,
      damageMax: 110,
      attackSpeed: 45,
      maxDurability: 75,
      strengthReq: 250,
      agilityReq: 80,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Solay Scepter',
    group: 2,
    index: 10,
    imagePath: '/en/items/2-10.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 125,
      damageMax: 140,
      attackSpeed: 40,
      maxDurability: 85,
      strengthReq: 320,
      agilityReq: 90,
      allowedClasses: ['Dark Lord'],
    },
  },
  {
    name: 'Shining Scepter',
    group: 2,
    index: 11,
    imagePath: '/en/items/2-11.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 135,
      damageMax: 152,
      attackSpeed: 40,
      maxDurability: 90,
      strengthReq: 360,
      agilityReq: 95,
      allowedClasses: ['Dark Lord'],
    },
  },

  // =================== STAFFS (Dark Wizard / Soul Master) ===================
  {
    name: 'Platina Staff',
    group: 5,
    index: 13,
    imagePath: '/en/items/5-13.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 51,
      damageMax: 53,
      attackSpeed: 30,
      maxDurability: 55,
      strengthReq: 50,
      agilityReq: 16,
      allowedClasses: ['Dark Wizard', 'Soul Master'],
    },
  },
  {
    name: 'Kundun Staff',
    group: 5,
    index: 11,
    imagePath: '/en/items/5-11.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 110,
      damageMax: 115,
      attackSpeed: 30,
      maxDurability: 85,
      strengthReq: 140,
      agilityReq: 40,
      allowedClasses: ['Soul Master', 'Grand Master'],
    },
  },
  {
    name: 'Staff of Destruction',
    group: 5,
    index: 12,
    imagePath: '/en/items/5-12.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 80,
      damageMax: 84,
      attackSpeed: 30,
      maxDurability: 70,
      strengthReq: 95,
      agilityReq: 30,
      allowedClasses: ['Dark Wizard', 'Soul Master'],
    },
  },
  {
    name: 'Grand Viper Staff',
    group: 5,
    index: 30,
    imagePath: '/en/items/5-30.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 130,
      damageMax: 135,
      attackSpeed: 30,
      maxDurability: 95,
      strengthReq: 180,
      agilityReq: 50,
      allowedClasses: ['Soul Master', 'Grand Master'],
    },
  },
  {
    name: 'Imperial Staff',
    group: 5,
    index: 31,
    imagePath: '/en/items/5-31.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 142,
      damageMax: 148,
      attackSpeed: 30,
      maxDurability: 100,
      strengthReq: 210,
      agilityReq: 60,
      allowedClasses: ['Soul Master', 'Grand Master'],
    },
  },

  // =================== SWORDS & BLADES (Dark Knight / MG) ===================
  {
    name: 'Bone Blade',
    group: 0,
    index: 22,
    imagePath: '/en/items/0-22.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 145,
      damageMax: 165,
      attackSpeed: 40,
      maxDurability: 95,
      strengthReq: 520,
      agilityReq: 120,
      allowedClasses: ['Blade Knight', 'Blade Master'],
    },
  },
  {
    name: 'Thunder Blade',
    group: 0,
    index: 18,
    imagePath: '/en/items/0-18.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 115,
      damageMax: 130,
      attackSpeed: 40,
      maxDurability: 85,
      strengthReq: 420,
      agilityReq: 100,
      allowedClasses: ['Magic Gladiator', 'Blade Knight'],
    },
  },
  {
    name: 'Sword of Destruction',
    group: 0,
    index: 17,
    imagePath: '/en/items/0-17.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      damageMin: 102,
      damageMax: 115,
      attackSpeed: 35,
      maxDurability: 80,
      strengthReq: 380,
      agilityReq: 90,
      allowedClasses: ['Blade Knight', 'Magic Gladiator'],
    },
  },
  {
    name: 'Dark Breaker',
    group: 0,
    index: 19,
    imagePath: '/en/items/0-19.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      damageMin: 128,
      damageMax: 145,
      attackSpeed: 40,
      maxDurability: 90,
      strengthReq: 480,
      agilityReq: 110,
      allowedClasses: ['Blade Knight', 'Blade Master'],
    },
  },
  {
    name: 'Lighting Sword',
    group: 0,
    index: 12,
    imagePath: '/en/items/0-12.gif',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      damageMin: 59,
      damageMax: 67,
      attackSpeed: 30,
      maxDurability: 50,
      strengthReq: 180,
      agilityReq: 40,
      allowedClasses: ['Dark Knight', 'Magic Gladiator'],
    },
  },

  // =================== SHIELDS ===================
  {
    name: 'Grand Soul Shield',
    group: 6,
    index: 15,
    imagePath: '/en/items/6-15.gif',
    slotLabel: 'WEAPON (LEFT)',
    category: 'weapon',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 12,
      maxDurability: 55,
      strengthReq: 70,
      agilityReq: 23,
      allowedClasses: ['Dark Wizard', 'Soul Master'],
    },
  },
  {
    name: 'Legendary Shield',
    group: 6,
    index: 14,
    imagePath: '/en/items/6-14.gif',
    slotLabel: 'WEAPON (LEFT)',
    category: 'weapon',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      defense: 10,
      maxDurability: 50,
      strengthReq: 65,
      agilityReq: 20,
      allowedClasses: ['Dark Wizard', 'Magic Gladiator'],
    },
  },

  // =================== SPHINX SET (Dark Wizard) ===================
  {
    name: 'Sphinx Mask',
    group: 7,
    index: 7,
    imagePath: '/en/items/7-7.gif',
    slotLabel: 'HELMET',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 13,
      maxDurability: 36,
      strengthReq: 30,
      allowedClasses: ['Dark Wizard', 'Soul Master'],
    },
  },
  {
    name: 'Sphinx Armor',
    group: 8,
    index: 7,
    imagePath: '/en/items/8-7.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 17,
      maxDurability: 36,
      strengthReq: 40,
      allowedClasses: ['Dark Wizard', 'Magic Gladiator'],
    },
  },
  {
    name: 'Sphinx Pants',
    group: 9,
    index: 7,
    imagePath: '/en/items/9-7.gif',
    slotLabel: 'PANTS',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 15,
      maxDurability: 36,
      strengthReq: 40,
      allowedClasses: ['Dark Wizard', 'Magic Gladiator'],
    },
  },
  {
    name: 'Sphinx Gloves',
    group: 10,
    index: 7,
    imagePath: '/en/items/10-7.gif',
    slotLabel: 'GLOVES',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 8,
      maxDurability: 36,
      strengthReq: 20,
      allowedClasses: ['Dark Wizard', 'Magic Gladiator'],
    },
  },
  {
    name: 'Sphinx Boots',
    group: 11,
    index: 7,
    imagePath: '/en/items/11-7.gif',
    slotLabel: 'BOOTS',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: {
      defense: 9,
      maxDurability: 36,
      strengthReq: 30,
      allowedClasses: ['Dark Wizard', 'Magic Gladiator'],
    },
  },

  // =================== LEGENDARY SET (Dark Wizard / Magic Gladiator) ===================
  {
    name: 'Legendary Helm',
    group: 7,
    index: 3,
    imagePath: '/en/items/7-3.gif',
    slotLabel: 'HELMET',
    category: 'armor',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 25,
      maxDurability: 52,
      strengthReq: 90,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },
  {
    name: 'Legendary Armor',
    group: 8,
    index: 3,
    imagePath: '/en/items/8-3.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 45,
      maxDurability: 52,
      strengthReq: 110,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },
  {
    name: 'Legendary Pants',
    group: 9,
    index: 3,
    imagePath: '/en/items/9-3.gif',
    slotLabel: 'PANTS',
    category: 'armor',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 35,
      maxDurability: 52,
      strengthReq: 100,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },
  {
    name: 'Legendary Gloves',
    group: 10,
    index: 3,
    imagePath: '/en/items/10-3.gif',
    slotLabel: 'GLOVES',
    category: 'armor',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 20,
      maxDurability: 52,
      strengthReq: 84,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },
  {
    name: 'Legendary Boots',
    group: 11,
    index: 3,
    imagePath: '/en/items/11-3.gif',
    slotLabel: 'BOOTS',
    category: 'armor',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 20,
      maxDurability: 52,
      strengthReq: 85,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },
  {
    name: 'Legendary Shield',
    group: 6,
    index: 6,
    imagePath: '/en/items/6-6.gif',
    slotLabel: 'WEAPON (LEFT)',
    category: 'weapon',
    defaultRarity: 'rare',
    defaultTag: '[RARE]',
    stats: {
      defense: 22,
      maxDurability: 50,
      strengthReq: 80,
      allowedClasses: ['Dark Wizard', 'Soul Master', 'Magic Gladiator'],
    },
  },

  // =================== HURRICANE SET (Magic Gladiator) ===================
  {
    name: 'Hurricane Armor',
    group: 8,
    index: 23,
    imagePath: '/en/items/8-23.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      defense: 48,
      maxDurability: 60,
      strengthReq: 152,
      allowedClasses: ['Magic Gladiator'],
    },
  },
  {
    name: 'Hurricane Pants',
    group: 9,
    index: 23,
    imagePath: '/en/items/9-23.gif',
    slotLabel: 'PANTS',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      defense: 42,
      maxDurability: 60,
      strengthReq: 145,
      allowedClasses: ['Magic Gladiator'],
    },
  },
  {
    name: 'Hurricane Gloves',
    group: 10,
    index: 23,
    imagePath: '/en/items/10-23.gif',
    slotLabel: 'GLOVES',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      defense: 32,
      maxDurability: 60,
      strengthReq: 130,
      allowedClasses: ['Magic Gladiator'],
    },
  },
  {
    name: 'Hurricane Boots',
    group: 11,
    index: 23,
    imagePath: '/en/items/11-23.gif',
    slotLabel: 'BOOTS',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: {
      defense: 30,
      maxDurability: 60,
      strengthReq: 130,
      allowedClasses: ['Magic Gladiator'],
    },
  },

  // =================== DRAGON SET (Dark Knight) ===================
  {
    name: 'Dragon Helm',
    group: 7,
    index: 1,
    imagePath: '/en/items/7-1.gif',
    slotLabel: 'HELMET',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { defense: 24, maxDurability: 60, strengthReq: 230, allowedClasses: ['Dark Knight', 'Blade Knight'] },
  },
  {
    name: 'Dragon Armor',
    group: 8,
    index: 1,
    imagePath: '/en/items/8-1.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { defense: 38, maxDurability: 60, strengthReq: 270, allowedClasses: ['Dark Knight', 'Blade Knight'] },
  },
  {
    name: 'Dragon Pants',
    group: 9,
    index: 1,
    imagePath: '/en/items/9-1.gif',
    slotLabel: 'PANTS',
    category: 'armor',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { defense: 28, maxDurability: 60, strengthReq: 250, allowedClasses: ['Dark Knight', 'Blade Knight'] },
  },

  // =================== GRAND SOUL & DARK SOUL ===================
  {
    name: 'Grand Soul Armor',
    group: 8,
    index: 8,
    imagePath: '/en/items/8-8.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 35, maxDurability: 65, strengthReq: 160, allowedClasses: ['Soul Master', 'Grand Master'] },
  },
  {
    name: 'Dark Soul Armor',
    group: 8,
    index: 15,
    imagePath: '/en/items/8-15.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 52, maxDurability: 75, strengthReq: 220, allowedClasses: ['Soul Master', 'Grand Master'] },
  },

  // =================== ADAMANTINE (Dark Lord) ===================
  {
    name: 'Adamantine Armor',
    group: 8,
    index: 26,
    imagePath: '/en/items/8-26.gif',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 45, maxDurability: 70, strengthReq: 260, allowedClasses: ['Dark Lord'] },
  },

  // =================== WINGS & CAPES ===================
  {
    name: 'Wings of Dragon',
    group: 12,
    index: 5,
    imagePath: '/en/items/12-5.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 45, maxDurability: 200, allowedClasses: ['Blade Knight', 'Blade Master'] },
  },
  {
    name: 'Wings of Soul',
    group: 12,
    index: 4,
    imagePath: '/en/items/12-4.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 40, maxDurability: 200, allowedClasses: ['Soul Master', 'Grand Master'] },
  },
  {
    name: 'Wings of Magic',
    group: 12,
    index: 181,
    imagePath: '/en/items/12-181.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 83, maxDurability: 255, allowedClasses: ['Dark Wizard', 'Soul Master', 'Grand Master', 'Magic Gladiator', 'Summoner'] },
  },
  {
    name: 'Cloak of Death',
    group: 12,
    index: 183,
    imagePath: '/en/items/12-183.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'uncommon',
    defaultTag: '[EXC]',
    stats: { defense: 73, maxDurability: 255, allowedClasses: ['Dark Lord', 'Lord Emperor', 'Rage Fighter'] },
  },
  {
    name: 'Wings of Chaos',
    group: 12,
    index: 182,
    imagePath: '/en/items/12-182.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { defense: 75, maxDurability: 255, allowedClasses: ['Blade Knight', 'Blade Master', 'Magic Gladiator'] },
  },
  {
    name: 'Wings of Life',
    group: 12,
    index: 180,
    imagePath: '/en/items/12-180.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { defense: 65, maxDurability: 255, allowedClasses: ['Muse Elf', 'High Elf'] },
  },
  {
    name: 'Wings of Spirits',
    group: 12,
    index: 3,
    imagePath: '/en/items/12-3.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 38, maxDurability: 200, allowedClasses: ['Muse Elf', 'High Elf'] },
  },
  {
    name: 'Cape of Lord',
    group: 13,
    index: 30,
    imagePath: '/en/items/13-30.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 50, maxDurability: 220, allowedClasses: ['Dark Lord', 'Lord Emperor'] },
  },
  {
    name: 'Cape of Emperor',
    group: 12,
    index: 40,
    imagePath: '/en/items/12-40.gif',
    slotLabel: 'WINGS',
    category: 'wings',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 80, maxDurability: 255, allowedClasses: ['Lord Emperor'] },
  },

  // =================== PETS & MOUNTS ===================
  {
    name: 'Dark Raven',
    group: 13,
    index: 5,
    imagePath: '/en/items/13-5.gif',
    slotLabel: 'PET',
    category: 'pet',
    defaultRarity: 'epic',
    defaultTag: '[EPIC]',
    stats: { damageMin: 80, damageMax: 120, allowedClasses: ['Dark Lord'] },
  },
  {
    name: 'Dark Horse',
    group: 13,
    index: 4,
    imagePath: '/en/items/13-4.gif',
    slotLabel: 'PET',
    category: 'pet',
    defaultRarity: 'legendary',
    defaultTag: '[LEGENDARY]',
    stats: { defense: 40, maxDurability: 255, allowedClasses: ['Dark Lord'] },
  },

  // =================== PENDANTS & RINGS ===================
  {
    name: 'Pendant of Lighting',
    group: 13,
    index: 12,
    imagePath: '/en/items/13-12.gif',
    slotLabel: 'PENDANT',
    category: 'jewels',
    defaultRarity: 'uncommon',
    defaultTag: '[EXC]',
  },
  {
    name: 'Ring of Magic',
    group: 13,
    index: 24,
    imagePath: '/en/items/13-24.gif',
    slotLabel: 'RING (LEFT)',
    category: 'jewels',
    defaultRarity: 'uncommon',
    defaultTag: '[EXC]',
  },
  {
    name: 'Ring of Ice',
    group: 13,
    index: 8,
    imagePath: '/en/items/13-8.gif',
    slotLabel: 'RING (RIGHT)',
    category: 'jewels',
    defaultRarity: 'uncommon',
    defaultTag: '[EXC]',
  },
];

// Unified catalog combining detailed stat items + all 933 items from Smash MU official registry
export const UNIFIED_SMASHMU_CATALOG: MuCatalogItem[] = (() => {
  const map = new Map<string, MuCatalogItem>();

  // 1. Detailed items with known stats & requirements
  for (const item of SMASHMU_ITEM_CATALOG) {
    map.set(item.name.toLowerCase().trim(), item);
  }

  // 2. Add all items from Smash MU complete 933-item registry
  for (const raw of (COMPLETE_SMASHMU_ITEMS as any[])) {
    const key = raw.name.toLowerCase().trim();
    if (!map.has(key)) {
      const isWings = raw.category === 'wings' || raw.name.toLowerCase().includes('wings') || raw.name.toLowerCase().includes('cape') || raw.name.toLowerCase().includes('cloak');
      const isLegendary = isWings || /Kundun|Destruction|Imperial|Solay|Dragon|Dark Soul|Grand Soul|Great Lord/i.test(raw.name);
      const isEpic = /Hurricane|Master|Battle|Platina|Thunder|Bone Blade|Adamantine|Red Spirit/i.test(raw.name);
      const defRarity = isLegendary ? 'legendary' : isEpic ? 'epic' : 'rare';
      const defTag = defRarity === 'legendary' ? '[LEGENDARY]' : defRarity === 'epic' ? '[EPIC]' : '[RARE]';

      map.set(key, {
        name: raw.name,
        group: raw.group,
        index: raw.index,
        imagePath: raw.imagePath,
        slotLabel: raw.slotLabel || 'EQUIPO',
        category: (raw.category as any) || 'armor',
        defaultRarity: defRarity,
        defaultTag: defTag,
      });
    }
  }

  return Array.from(map.values());
})();

/**
 * Searches the SmashMU items catalog matching query string across all 933 official items
 */
export function searchMuItems(query: string, limit = 8): MuCatalogItem[] {
  if (!query || query.trim().length === 0) return UNIFIED_SMASHMU_CATALOG.slice(0, limit);
  const q = query.toLowerCase().trim();

  // Score matches: exact match > startsWith > includes words
  const scored = UNIFIED_SMASHMU_CATALOG.map((item) => {
    const nameLower = item.name.toLowerCase();
    let score = 0;
    if (nameLower === q) score += 100;
    else if (nameLower.startsWith(q)) score += 50;
    else if (nameLower.includes(q)) score += 20;

    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.every((t) => nameLower.includes(t))) {
      score += 30;
    }

    return { item, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  return scored.slice(0, limit);
}

/**
 * Finds exact item specification by name (case-insensitive) across all 933 official Smash MU items
 */
export function getSmashMuItemByName(rawName: string): MuCatalogItem | undefined {
  if (!rawName) return undefined;
  let clean = rawName
    .replace(/^(?:[o0O\s|!*#]+|\[[A-Za-z]+\])\s*/gi, '')
    .replace(/^(?:[|!1liI\s]*e[vw]\b|l\s*ev|1\s*ev|lev|lvl|level)\s*/gi, '')
    .replace(/^[|!:\-_~.\s]+/, '')
    .replace(/\s*\+\d{1,2}\s*$/, '')
    .toLowerCase()
    .trim();

  // Normalize common OCR misreads on wings & cloaks
  clean = clean
    .replace(/\bwin[gd]s?\s+of\s+magic\b/gi, 'wings of magic')
    .replace(/\bwin[gd]s?\s+of\s+chaos\b/gi, 'wings of chaos')
    .replace(/\bwin[gd]s?\s+of\s+life\b/gi, 'wings of life')
    .replace(/\bcloa?k\s+of\s+death\b/gi, 'cloak of death')
    .replace(/\bwin[gd]s?\s+of\b/gi, 'wing of')
    .replace(/\bcloa?k\s+of\b/gi, 'cape of');

  const cleanWithWings = clean.replace(/\bwing of\b/g, 'wings of').replace(/\bcape of\b/g, 'cloak of');
  const cleanWithWing = clean.replace(/\bwings of\b/g, 'wing of').replace(/\bcloak of\b/g, 'cape of');

  // 1. Exact match in unified catalog
  const exact = UNIFIED_SMASHMU_CATALOG.find((i) => {
    const iName = i.name.toLowerCase().trim();
    const iNameNorm = iName.replace(/\bwings of\b/g, 'wing of').replace(/\bcloak of\b/g, 'cape of');
    return clean === iName || cleanWithWings === iName || cleanWithWing === iName || cleanWithWing === iNameNorm;
  });
  if (exact) return exact;

  // 2. Partial match in unified catalog
  const partial = UNIFIED_SMASHMU_CATALOG.find((i) => {
    const iName = i.name.toLowerCase().trim();
    const iNameNorm = iName.replace(/\bwings of\b/g, 'wing of').replace(/\bcloak of\b/g, 'cape of');
    return (
      clean === iName ||
      clean.includes(iName) ||
      iName.includes(clean) ||
      cleanWithWing === iNameNorm ||
      cleanWithWing.includes(iNameNorm) ||
      iNameNorm.includes(cleanWithWing)
    );
  });
  if (partial) return partial;

  // 3. Fallback token-based search
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const tokenMatch = UNIFIED_SMASHMU_CATALOG.find((i) => {
      const iName = i.name.toLowerCase();
      return tokens.every(
        (t) =>
          iName.includes(t) ||
          (t === 'wing' && iName.includes('wings')) ||
          (t === 'wings' && iName.includes('wing')) ||
          (t === 'cape' && iName.includes('cloak')) ||
          (t === 'cloak' && iName.includes('cape'))
      );
    });
    if (tokenMatch) return tokenMatch;
  }

  return undefined;
}

/**
 * Resolves authentic image URL directly from SmashMU CDN
 */
export function getSmashMuImageUrl(imagePath?: string): string {
  if (!imagePath) return 'https://www.smashmu.com/en/items/2-8.gif';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/en/items/')) {
    return `https://www.smashmu.com${imagePath}`;
  }
  return imagePath;
}
