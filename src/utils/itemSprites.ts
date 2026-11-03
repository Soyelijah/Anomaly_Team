/**
 * Item Sprite Resolver for Mu Online Equipment
 * Maps item names and categories to authentic, official in-game Season 6 animated/rendered sprites
 */

// Comprehensive mapping of known MU Online Season 6 items to authentic sprite assets
const ITEM_SPRITE_MAP: Record<string, string> = {
  // Scepters (Dark Lord)
  'battle scepter': '/assets/items/battle-scepter.gif',
  'master scepter': '/assets/items/master-scepter.gif',
  'great scepter': '/assets/items/great-scepter.gif',
  'lord scepter': '/assets/items/lord-scepter.gif',
  'great lord scepter': '/assets/items/great-lord-scepter.gif',
  'solay scepter': '/assets/items/solay-scepter.gif',
  'shining scepter': '/assets/items/shining-scepter.gif',

  // Staffs (Dark Wizard / Soul Master)
  'platina staff': '/assets/items/platina-staff.gif',
  'staff of kundun': '/assets/items/kundun-staff.gif',
  'kundun staff': '/assets/items/kundun-staff.gif',
  'staff of destruction': '/assets/items/staff-destruction.gif',
  'grand viper staff': '/assets/items/grand-viper-staff.gif',
  'imperial staff': '/assets/items/imperial-staff.gif',

  // Swords & Blades (Dark Knight / Blade Knight / Magic Gladiator)
  'bone blade': '/assets/items/bone-blade.gif',
  'thunder blade': '/assets/items/thunder-blade.gif',
  'sword of destruction': '/assets/items/sword-destruction.gif',
  'lighting sword': '/assets/items/lighting-sword.gif',
  'dark breaker': '/assets/items/dark-breaker.gif',
  'daybreak': '/assets/items/daybreak.gif',

  // Sphinx Set (DW / MG)
  'sphinx armor': '/assets/items/sphinx-armor.gif',
  'sphinx pants': '/assets/items/sphinx-pants.gif',
  'sphinx helm': '/assets/items/sphinx-helm.gif',
  'sphinx mask': '/assets/items/sphinx-helm.gif',
  'sphinx gloves': '/assets/items/sphinx-gloves.gif',
  'sphinx boots': '/assets/items/sphinx-boots.gif',

  // Dragon Set (DK / BK)
  'dragon armor': '/assets/items/dragon-armor.gif',

  // Grand Soul / Dark Soul (DW / SM)
  // Legendary Set (DW / MG)
  'legendary helm': '/assets/items/legendary-helm.gif',
  'legendary armor': '/assets/items/legendary-armor.gif',
  'legendary pants': '/assets/items/legendary-pants.gif',
  'legendary gloves': '/assets/items/legendary-gloves.gif',
  'legendary boots': '/assets/items/legendary-boots.gif',
  'legendary shield': '/assets/items/legendary-shield.gif',

  // Grand Soul / Dark Soul (DW / SM)
  'grand soul armor': '/assets/items/grand-soul-armor.gif',
  'dark soul armor': '/assets/items/dark-soul-armor.gif',

  // Adamantine Set (DL)
  'adamantine armor': '/assets/items/adamantine-armor.gif',

  // Shields
  'grand soul shield': '/assets/items/grand-soul-shield.gif',

  // Wings & Capes
  'wings of dragon': '/assets/items/wings-dragon.gif',
  'wings of soul': '/assets/items/wings-soul.gif',
  'wings of spirits': '/assets/items/wings-spirits.gif',
  'cape of lord': '/assets/items/cape-lord.gif',
  'cape of emperor': '/assets/items/cape-emperor.gif',
  // Wings 2.5 (Monster Wings - Smash MU Official group 12)
  'wings of life': 'https://www.smashmu.com/en/items/12-180.gif',
  'wings of magic': 'https://www.smashmu.com/en/items/12-181.gif',
  'wings of chaos': 'https://www.smashmu.com/en/items/12-182.gif',
  'cloak of death': 'https://www.smashmu.com/en/items/12-183.gif',

  // Hurricane Set (Magic Gladiator) - Official Smash MU index 23
  'hurricane armor': 'https://www.smashmu.com/en/items/8-23.gif',
  'hurricane pants': 'https://www.smashmu.com/en/items/9-23.gif',
  'hurricane gloves': 'https://www.smashmu.com/en/items/10-23.gif',
  'hurricane boots': 'https://www.smashmu.com/en/items/11-23.gif',

  // Dark Master Set (Dark Lord)
  'dark master mask': 'https://www.smashmu.com/en/items/7-25.gif',
  'dark master armor': 'https://www.smashmu.com/en/items/8-25.gif',
  'dark master pants': 'https://www.smashmu.com/en/items/9-25.gif',
  'dark master gloves': 'https://www.smashmu.com/en/items/10-25.gif',
  'dark master boots': 'https://www.smashmu.com/en/items/11-25.gif',

  // Red Spirit Set (Muse Elf / High Elf)
  'red spirit helm': 'https://www.smashmu.com/en/items/7-20.gif',
  'red spirit armor': 'https://www.smashmu.com/en/items/8-20.gif',
  'red spirit pants': 'https://www.smashmu.com/en/items/9-20.gif',
  'red spirit gloves': 'https://www.smashmu.com/en/items/10-20.gif',
  'red spirit boots': 'https://www.smashmu.com/en/items/11-20.gif',

  // Great Dragon Set (Blade Knight)
  'great dragon helm': 'https://www.smashmu.com/en/items/7-17.gif',
  'great dragon armor': 'https://www.smashmu.com/en/items/8-17.gif',
  'great dragon pants': 'https://www.smashmu.com/en/items/9-17.gif',
  'great dragon gloves': 'https://www.smashmu.com/en/items/10-17.gif',
  'great dragon boots': 'https://www.smashmu.com/en/items/11-17.gif',

  // Pets & Mounts
  'dark raven': '/assets/items/dark-raven.gif',
  'dark horse': '/assets/items/dark-horse.gif',
};

/**
 * Sanitizes and extracts the pure item name from OCR strings or title tags
 */
export const cleanMuItemName = (rawName?: string): string => {
  if (!rawName) return '';
  let clean = rawName
    .replace(/^(?:[o0O\s|!*#]+|\[[A-Za-z]+\])\s*/gi, '')
    .replace(/^(?:[|!1liI\s]*e[vw]\b|l\s*ev|1\s*ev|lev|lvl|level)\s*/gi, '')
    .replace(/^[|!:\-_~.\s]+/, '')
    .replace(/\s*\+\d{1,2}\s*$/, '')
    .trim();

  // Normalize common OCR misreads on wings & cloaks
  clean = clean
    .replace(/\bwin[gd]s?\s+of\s+magic\b/gi, 'Wings of Magic')
    .replace(/\bwin[gd]s?\s+of\s+chaos\b/gi, 'Wings of Chaos')
    .replace(/\bwin[gd]s?\s+of\s+life\b/gi, 'Wings of Life')
    .replace(/\bcloa?k\s+of\s+death\b/gi, 'Cloak of Death')
    .replace(/\bwin[gd]s?\s+of\b/gi, 'Wings of');

  return clean;
};

import { getSmashMuItemByName, getSmashMuImageUrl } from './muItemsDatabase';

export const getItemSprite = (itemName?: string, category?: string): string => {
  if (!itemName) {
    if (category === 'armor') return 'https://www.smashmu.com/en/items/8-7.gif';
    if (category === 'weapon') return 'https://www.smashmu.com/en/items/2-8.gif';
    if (category === 'wings') return 'https://www.smashmu.com/en/items/12-0.gif';
    if (category === 'pet') return 'https://www.smashmu.com/en/items/13-5.gif';
    return 'https://www.smashmu.com/en/items/2-8.gif';
  }

  // 1. Check official Smash MU complete 933-item catalog
  const catalogMatch = getSmashMuItemByName(itemName);
  if (catalogMatch && catalogMatch.imagePath) {
    return getSmashMuImageUrl(catalogMatch.imagePath);
  }

  const clean = cleanMuItemName(itemName).toLowerCase();

  // 2. Direct exact lookup
  if (ITEM_SPRITE_MAP[clean]) {
    return ITEM_SPRITE_MAP[clean];
  }

  // 2. Exact match in keys
  for (const [key, path] of Object.entries(ITEM_SPRITE_MAP)) {
    if (clean === key || clean.includes(key)) {
      return path;
    }
  }

  // 3. Keyword based matching for weapons
  if (clean.includes('battle') && clean.includes('scepter')) {
    return '/assets/items/battle-scepter.gif';
  }
  if (clean.includes('master') && clean.includes('scepter')) {
    return '/assets/items/master-scepter.gif';
  }
  if (clean.includes('great') && clean.includes('scepter')) {
    return '/assets/items/great-scepter.gif';
  }
  if (clean.includes('lord') && clean.includes('scepter')) {
    return clean.includes('great') ? '/assets/items/great-lord-scepter.gif' : '/assets/items/lord-scepter.gif';
  }
  if (clean.includes('solay')) {
    return '/assets/items/solay-scepter.gif';
  }
  if (clean.includes('shining')) {
    return '/assets/items/shining-scepter.gif';
  }
  if (clean.includes('scepter') || clean.includes('cetro')) {
    return '/assets/items/battle-scepter.gif';
  }

  // Staffs
  if (clean.includes('platina')) {
    return '/assets/items/platina-staff.gif';
  }
  if (clean.includes('kundun')) {
    return '/assets/items/kundun-staff.gif';
  }
  if (clean.includes('destruction') && (clean.includes('staff') || clean.includes('baston'))) {
    return '/assets/items/staff-destruction.gif';
  }
  if (clean.includes('viper')) {
    return '/assets/items/grand-viper-staff.gif';
  }
  if (clean.includes('imperial')) {
    return '/assets/items/imperial-staff.gif';
  }
  if (clean.includes('staff') || clean.includes('baston')) {
    return '/assets/items/platina-staff.gif';
  }

  // Swords & Blades
  if (clean.includes('bone') || clean.includes('hueso')) {
    return '/assets/items/bone-blade.gif';
  }
  if (clean.includes('thunder')) {
    return '/assets/items/thunder-blade.gif';
  }
  if (clean.includes('dark breaker') || clean.includes('breaker')) {
    return '/assets/items/dark-breaker.gif';
  }
  if (clean.includes('daybreak')) {
    return '/assets/items/daybreak.gif';
  }
  if (clean.includes('destruction') || clean.includes('destruccion')) {
    return '/assets/items/sword-destruction.gif';
  }
  if (clean.includes('lighting') || clean.includes('relampago')) {
    return '/assets/items/lighting-sword.gif';
  }
  if (clean.includes('blade') || clean.includes('sword') || clean.includes('espada')) {
    return '/assets/items/bone-blade.gif';
  }

  // Armors & Sets
  if (clean.includes('sphinx') || clean.includes('esfinge')) {
    if (clean.includes('pants') || clean.includes('pantalon')) return '/assets/items/sphinx-pants.gif';
    if (clean.includes('helm') || clean.includes('casco') || clean.includes('mask')) return '/assets/items/sphinx-helm.gif';
    if (clean.includes('gloves') || clean.includes('guantes')) return '/assets/items/sphinx-gloves.gif';
    if (clean.includes('boots') || clean.includes('botas')) return '/assets/items/sphinx-boots.gif';
    return '/assets/items/sphinx-armor.gif';
  }

  if (clean.includes('legendary') || clean.includes('legendario')) {
    if (clean.includes('gloves') || clean.includes('guantes')) return '/assets/items/legendary-gloves.gif';
    if (clean.includes('boots') || clean.includes('botas')) return '/assets/items/legendary-boots.gif';
    if (clean.includes('pants') || clean.includes('pantalon')) return '/assets/items/legendary-pants.gif';
    if (clean.includes('helm') || clean.includes('casco') || clean.includes('mask')) return '/assets/items/legendary-helm.gif';
    if (clean.includes('shield') || clean.includes('escudo')) return '/assets/items/legendary-shield.gif';
    return '/assets/items/legendary-armor.gif';
  }

  if (clean.includes('hurricane')) {
    if (clean.includes('pants') || clean.includes('pantalon')) return 'https://www.smashmu.com/en/items/9-24.gif';
    if (clean.includes('gloves') || clean.includes('guantes')) return 'https://www.smashmu.com/en/items/10-24.gif';
    if (clean.includes('boots') || clean.includes('botas')) return 'https://www.smashmu.com/en/items/11-24.gif';
    return 'https://www.smashmu.com/en/items/8-24.gif';
  }

  if (clean.includes('dark master')) {
    if (clean.includes('mask') || clean.includes('helm') || clean.includes('casco')) return 'https://www.smashmu.com/en/items/7-25.gif';
    if (clean.includes('pants') || clean.includes('pantalon')) return 'https://www.smashmu.com/en/items/9-25.gif';
    if (clean.includes('gloves') || clean.includes('guantes')) return 'https://www.smashmu.com/en/items/10-25.gif';
    if (clean.includes('boots') || clean.includes('botas')) return 'https://www.smashmu.com/en/items/11-25.gif';
    return 'https://www.smashmu.com/en/items/8-25.gif';
  }

  if (clean.includes('red spirit')) {
    if (clean.includes('helm') || clean.includes('casco')) return 'https://www.smashmu.com/en/items/7-20.gif';
    if (clean.includes('pants') || clean.includes('pantalon')) return 'https://www.smashmu.com/en/items/9-20.gif';
    if (clean.includes('gloves') || clean.includes('guantes')) return 'https://www.smashmu.com/en/items/10-20.gif';
    if (clean.includes('boots') || clean.includes('botas')) return 'https://www.smashmu.com/en/items/11-20.gif';
    return 'https://www.smashmu.com/en/items/8-20.gif';
  }

  if (clean.includes('great dragon')) {
    if (clean.includes('helm') || clean.includes('casco')) return 'https://www.smashmu.com/en/items/7-17.gif';
    if (clean.includes('pants') || clean.includes('pantalon')) return 'https://www.smashmu.com/en/items/9-17.gif';
    if (clean.includes('gloves') || clean.includes('guantes')) return 'https://www.smashmu.com/en/items/10-17.gif';
    if (clean.includes('boots') || clean.includes('botas')) return 'https://www.smashmu.com/en/items/11-17.gif';
    return 'https://www.smashmu.com/en/items/8-17.gif';
  }

  if (clean.includes('dragon')) {
    return '/assets/items/dragon-armor.gif';
  }
  if (clean.includes('dark soul')) {
    return '/assets/items/dark-soul-armor.gif';
  }
  if (clean.includes('grand soul')) {
    return '/assets/items/grand-soul-armor.gif';
  }
  if (clean.includes('adamantine')) {
    return '/assets/items/adamantine-armor.gif';
  }

  // Wings & Capes
  if (clean.includes('cape') || clean.includes('capa')) {
    return clean.includes('emperor') ? '/assets/items/cape-emperor.gif' : '/assets/items/cape-lord.gif';
  }
  if (clean.includes('wings') || clean.includes('alas')) {
    if (clean.includes('soul')) return '/assets/items/wings-soul.gif';
    if (clean.includes('spirits') || clean.includes('espiritus')) return '/assets/items/wings-spirits.gif';
    return '/assets/items/wings-dragon.gif';
  }

  // Fallbacks by category
  if (category === 'armor') return '/assets/items/sphinx-armor.gif';
  if (category === 'weapon') return '/assets/items/battle-scepter.gif';
  if (category === 'wings') return '/assets/items/wings-dragon.gif';
  if (category === 'pet') return '/assets/items/dark-raven.gif';

  return '/assets/items/battle-scepter.gif';
};
