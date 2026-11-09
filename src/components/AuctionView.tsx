import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuctionItem } from '../types/clan';
import { initialAuctions } from '../data/initialData';
import { ItemTooltipCard } from './ItemTooltipCard';
import {
  Gavel,
  Coins,
  Gem,
  Plus,
  Clock,
  Flame,
  CheckCircle2,
  Tag,
  Shield,
  Zap,
  Filter,
  Search,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  Sliders,
  Check,
  Sword,
  Sun,
  Loader2,
  Wand2,
  AlertCircle,
  Trash2,
  MessageSquare,
  Send,
  Radio,
  Pencil,
} from 'lucide-react';

interface AuctionViewProps {
  currentMemberName?: string;
  isOfficer?: boolean;
}

const COMMON_EXCELLENT_OPTIONS = [
  'Ignore Opponent Defensive Power +7%',
  'Life After Hunting Monster +life/21',
  'Increased Damage +5',
  'Excellent Damage Rate +16%',
  'Increase Attack (Wizardry) Speed +7',
  'Mana After Hunting Monster +mana/8',
  'Damage Decrease +4%',
  'Damage Decrease +7%',
  'Reflect Damage +5%',
  'Reflect Damage +7%',
  'Max AG increased by 5%',
  'Max AG increased by 7%',
  'Defense Success Rate +10%',
  'Increase Max HP +4%',
  'Increase Max HP +7%',
];

import { getItemSprite, cleanMuItemName } from '../utils/itemSprites';
import {
  getSmashMuItemByName,
  getSmashMuImageUrl,
  searchMuItems,
  MuCatalogItem,
} from '../utils/muItemsDatabase';
import { preloadItemSprites } from '../hooks/useItemSprite';

const COMMON_HARMONY_OPTIONS = [
  'Damage decrement increase +5%',
  'Incremento de daño (mín. y máx.) +19',
  'Incremento de daño de skill +12',
  'Decremento de daño +7%',
  'Incremento de daño crítico +28',
  'Aumento de poder defensivo +35',
  'Tasa de evasión de defensa enemiga +5%',
  'Aumento de vida máxima +150',
];

const DEFAULT_ANOMALY_AUCTIONS: AuctionItem[] = [
  {
    id: 'auc-battle-scepter-9',
    tag: '[EPIC]',
    itemName: 'Battle Scepter',
    itemLevel: '+9',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    rarity: 'epic',
    sellerName: 'UlmerDL',
    currencyType: 'bless',
    startingBid: 85,
    currentBid: 105,
    highestBidder: 'SkyTM',
    buyoutPrice: 200,
    endsAt: Date.now() + 16 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/battle-scepter.gif',
    screenshotUrl: '/assets/aistudio/image_8af2b15a.png',
    imagePath: '/assets/items/battle-scepter.gif',
    stats: {
      damageMin: 41,
      damageMax: 52,
      attackSpeed: 45,
      durability: 69,
      maxDurability: 40,
      strengthReq: 80,
      agilityReq: 17,
    },
    classesAllowed: ['Dark Lord'],
    hasLuck: true,
    hasSkill: true,
    excellentOptions: [
      'Ignore Opponent Defensive Power +7%',
      'Increased Damage +5',
      'Increase Damage +level/11',
      'Excellent Damage Rate +16%',
    ],
    harmonyOption: 'Incremento de daño de skill +12',
    gearScore: 148,
  },
  {
    id: 'auc-great-scepter-15',
    tag: '[EXC]',
    itemName: 'Great Scepter',
    itemLevel: '+15',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    rarity: 'legendary',
    sellerName: 'UlmerDL',
    currencyType: 'bless',
    startingBid: 120,
    currentBid: 160,
    highestBidder: 'Matthew',
    buyoutPrice: 280,
    endsAt: Date.now() + 14 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/great-scepter.gif',
    screenshotUrl: '/assets/aistudio/image_208aa380.png',
    imagePath: '/assets/items/great-scepter.gif',
    stats: {
      damageMin: 74,
      damageMax: 85,
      attackSpeed: 45,
      durability: 127,
      maxDurability: 65,
      strengthReq: 180,
      agilityReq: 60,
    },
    classesAllowed: ['Dark Lord'],
    hasLuck: true,
    hasSkill: true,
    excellentOptions: [
      'Ignore Opponent Defensive Power +7%',
      'Life After Hunting Monster +life/21',
      'Increased Damage +5',
      'Excellent Damage Rate +16%',
    ],
    harmonyOption: 'Incremento de daño (mín. y máx.) +19',
    gearScore: 155,
  },
  {
    id: 'auc-platina-staff-15',
    tag: '[EXC]',
    itemName: 'Platina Staff',
    itemLevel: '+15',
    slotLabel: 'WEAPON (RIGHT)',
    category: 'weapon',
    rarity: 'legendary',
    sellerName: 'prinmestis',
    currencyType: 'bless',
    startingBid: 90,
    currentBid: 110,
    highestBidder: 'rusbelx23',
    buyoutPrice: 220,
    endsAt: Date.now() + 8 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/platina-staff.gif',
    imagePath: '/assets/items/platina-staff.gif',
    stats: {
      damageMin: 51,
      damageMax: 53,
      attackSpeed: 30,
      durability: 140,
      maxDurability: 255,
      strengthReq: 120,
    },
    classesAllowed: ['Soul Master', 'Grand Master'],
    hasLuck: true,
    hasSkill: false,
    excellentOptions: [
      'Ignore Opponent Defensive Power +6%',
      'Increased Attacking (Wizardry) Speed9',
      'Excellent Damage Rate +14%',
    ],
    harmonyOption: 'Incremento de daño (mín. y máx.) +19',
    gearScore: 142,
  },
  {
    id: 'auc-sphinx-legendary-13',
    tag: '[LEGENDARY]',
    itemName: 'SPHINX ARMOR',
    itemLevel: '+13',
    slotLabel: 'ARMOR (CHEST)',
    category: 'armor',
    rarity: 'legendary',
    sellerName: 'SkyTM',
    currencyType: 'bless',
    startingBid: 150,
    currentBid: 190,
    highestBidder: 'SavioGM',
    buyoutPrice: 350,
    endsAt: Date.now() + 18 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/sphinx-armor.gif',
    screenshotUrl: '/assets/aistudio/image_fa57e1b0.png',
    imagePath: '/assets/items/sphinx-armor.gif',
    stats: {
      defense: 67,
      durability: 83,
      maxDurability: 68,
      strengthReq: 152,
    },
    classesAllowed: ['Dark Wizard', 'Magic Gladiator'],
    hasLuck: true,
    hasSkill: false,
    additionalStat: 'Additional defense +8',
    excellentOptions: [
      'Reflect Damage +7%',
      'Damage Decrease +7%',
      'Max AG increased by 7%',
      'Increase Max HP +7%',
    ],
    harmonyOption: 'Damage decrement increase +5%',
    gearTechOption: 'All Stats +20 MAX · Armor +13%',
    gearScore: 136,
  },
  {
    id: 'auc-legendary-gloves-7',
    tag: '[RARE]',
    itemName: 'Legendary Gloves',
    itemLevel: '+7',
    slotLabel: 'GLOVES',
    category: 'armor',
    rarity: 'rare',
    sellerName: 'UlmerMG',
    currencyType: 'bless',
    startingBid: 95,
    currentBid: 120,
    highestBidder: 'DarkMaster',
    buyoutPrice: 220,
    endsAt: Date.now() + 12 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/legendary-gloves.gif',
    screenshotUrl: '/assets/aistudio/image_5d1ba0d6.png',
    imagePath: '/assets/items/legendary-gloves.gif',
    stats: {
      defense: 47,
      durability: 67,
      maxDurability: 52,
      strengthReq: 84,
    },
    classesAllowed: ['Dark Wizard', 'Magic Gladiator'],
    hasLuck: true,
    hasSkill: false,
    additionalStat: 'Swimming speed increase · Additional defense +8',
    excellentOptions: [
      'Reflect Damage +5%',
      'Max AG increased by 5%',
    ],
    gearScore: 81,
  },
];

export const AuctionView: React.FC<AuctionViewProps> = ({
  currentMemberName = 'UlmerMG',
  isOfficer = true,
}) => {
  const [auctions, setAuctions] = useState<AuctionItem[]>(() => {
    const saved = localStorage.getItem('anomaly_auctions');
    if (saved) {
      try {
        const parsed: AuctionItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return [];
          // Ensure equipment has authentic MU sprites, catalog linkage and accurate rarity
          return parsed.map((auc) => {
            const cleanName = cleanMuItemName(auc.itemName) || auc.itemName;
            const catalogMatch = getSmashMuItemByName(cleanName);
            const sprite = catalogMatch ? getSmashMuImageUrl(catalogMatch.imagePath) : getItemSprite(cleanName, auc.category);
            const r = auc.rarity || (auc.tag?.includes('EPIC') ? 'epic' : auc.tag?.includes('RARE') ? 'rare' : auc.tag?.includes('EXC') ? 'uncommon' : 'legendary');
            return {
              ...auc,
              itemName: cleanName,
              rarity: r,
              spriteUrl: auc.spriteUrl || sprite,
              imagePath: auc.imagePath || sprite,
              hasLuck:
                auc.hasLuck === true ||
                auc.hasLuck === undefined ||
                Boolean(auc.itemLevel && parseInt(auc.itemLevel.replace(/\D/g, ''), 10) >= 7) ||
                /Sphinx|Scepter|Staff|Blade|Armor/i.test(cleanName),
            };
          });
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [filterCurrency, setFilterCurrency] = useState<'all' | 'bless' | 'dkp'>('all');
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'weapon' | 'armor' | 'wings' | 'pet'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sellingModalItem, setSellingModalItem] = useState<AuctionItem | null>(null);
  const [sellFinalPrice, setSellFinalPrice] = useState<number>(100);
  const [sellWinnerName, setSellWinnerName] = useState<string>('');
  const [isSellingLoading, setIsSellingLoading] = useState(false);

  // Edit / Correction Modal State
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemLevel, setEditItemLevel] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editRarity, setEditRarity] = useState<AuctionItem['rarity']>('epic');
  const [editStartingBid, setEditStartingBid] = useState(1);
  const [editBuyoutPrice, setEditBuyoutPrice] = useState(0);
  const [editHarmonyOption, setEditHarmonyOption] = useState('');
  const [editAdditionalStat, setEditAdditionalStat] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Delete Confirmation Modal State (replaces window.confirm)
  const [deleteModalItem, setDeleteModalItem] = useState<AuctionItem | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Clear All Confirmation Modal State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAllLoading, setIsClearingAllLoading] = useState(false);

  // Resend sold announcement loading state
  const [notifyingSoldId, setNotifyingSoldId] = useState<string | null>(null);

  const [inspectedAuction, setInspectedAuction] = useState<AuctionItem | null>(null);
  const [bidSuccessMessage, setBidSuccessMessage] = useState<string | null>(null);
  const [discordInfo, setDiscordInfo] = useState<{ connected: boolean; channelName?: string; channelId?: string } | null>(null);

  // Sync auctions from server database and check Discord webhook
  useEffect(() => {
    // 1. Check Discord webhook health
    fetch('/api/discord/webhook-info')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setDiscordInfo({
            connected: true,
            channelName: data.channelName,
            channelId: data.channelId,
          });
        } else {
          setDiscordInfo({ connected: false });
        }
      })
      .catch(() => setDiscordInfo({ connected: false }));

    // 2. Fetch server database auctions
    fetch('/api/auctions')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.auctions)) {
          setAuctions(data.auctions);
          localStorage.setItem('anomaly_auctions', JSON.stringify(data.auctions));
        }
      })
      .catch((e) => console.warn('Could not sync auctions from server DB:', e));
  }, []);

  // Pre-load item sprites for all auctions to guarantee instantaneous display
  useEffect(() => {
    if (auctions && auctions.length > 0) {
      preloadItemSprites(
        auctions.map((a) => ({
          itemName: a.itemName,
          category: a.category,
          imagePath: a.imagePath || a.spriteUrl,
        }))
      );
    }
  }, [auctions]);

  // New Auction Form State
  const [newEsSubasta, setNewEsSubasta] = useState<boolean>(true);
  const [newRarity, setNewRarity] = useState<AuctionItem['rarity']>('epic');
  const [newTag, setNewTag] = useState<string>('[EPIC]');
  const [newItemName, setNewItemName] = useState('Battle Scepter');
  const [newItemLevel, setNewItemLevel] = useState('+9');
  const [newSlotLabel, setNewSlotLabel] = useState('WEAPON (RIGHT)');
  const [newItemCategory, setNewItemCategory] = useState<AuctionItem['category']>('weapon');
  const [newCurrencyType, setNewCurrencyType] = useState<'bless' | 'dkp'>('bless');
  const [newStartingBid, setNewStartingBid] = useState(85);
  const [newBuyoutPrice, setNewBuyoutPrice] = useState(200);
  const [newDurationHours, setNewDurationHours] = useState(12);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Stats & MU Options State
  const [newDamageMin, setNewDamageMin] = useState(74);
  const [newDamageMax, setNewDamageMax] = useState(85);
  const [newDefense, setNewDefense] = useState(0);
  const [newAttackSpeed, setNewAttackSpeed] = useState(45);
  const [newDurability, setNewDurability] = useState(127);
  const [newMaxDurability, setNewMaxDurability] = useState(65);
  const [newStrengthReq, setNewStrengthReq] = useState<number | undefined>(undefined);
  const [newAgilityReq, setNewAgilityReq] = useState<number | undefined>(undefined);
  const [newEnergyReq, setNewEnergyReq] = useState<number | undefined>(undefined);
  const [newClassesAllowed, setNewClassesAllowed] = useState<string[]>([]);
  const [newAdditionalStat, setNewAdditionalStat] = useState<string>('');
  const [newGearTechOption, setNewGearTechOption] = useState<string>('');
  const [newGearScore, setNewGearScore] = useState<number | undefined>(undefined);
  const [newHasSkill, setNewHasSkill] = useState(true);
  const [newHasLuck, setNewHasLuck] = useState(true);
  const [newSelectedExcOptions, setNewSelectedExcOptions] = useState<string[]>([
    'Ignore Opponent Defensive Power +7%',
    'Life After Hunting Monster +life/21',
    'Increased Damage +5',
    'Excellent Damage Rate +16%',
  ]);
  const [newHarmonyOption, setNewHarmonyOption] = useState('Incremento de daño (mín. y máx.) +19');
  const [newUploadedImage, setNewUploadedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<{
    type: 'idle' | 'analyzing' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Clan Character Equipment Loader State (Direct Smash MU API)
  const CLAN_MEMBERS = [
    'SkyTM',
    'SavioGM',
    'Matthew',
    'CasS',
    'UlmerMG',
    'UlmerDL',
    'rusbelx23',
    'prinmestis',
  ];
  const [showClanPicker, setShowClanPicker] = useState<boolean>(false);
  const [selectedClanMember, setSelectedClanMember] = useState<string>('SkyTM');
  const [clanMemberEquipment, setClanMemberEquipment] = useState<any[]>([]);
  const [isLoadingClanEquip, setIsLoadingClanEquip] = useState<boolean>(false);
  const [clanEquipError, setClanEquipError] = useState<string | null>(null);

  // Pre-load clan member equipment sprites when picked
  useEffect(() => {
    if (clanMemberEquipment && clanMemberEquipment.length > 0) {
      preloadItemSprites(
        clanMemberEquipment.map((eq: any) => ({
          itemName: eq.name,
          category: eq.slotIndex <= 1 ? 'weapon' : eq.slotIndex === 7 ? 'wings' : 'armor',
          imagePath: eq.imagePath,
        }))
      );
    }
  }, [clanMemberEquipment]);

  // Fetch real character equipment directly from Smash MU
  useEffect(() => {
    if (!showClanPicker && !isCreateModalOpen) return;
    let isCancelled = false;
    setIsLoadingClanEquip(true);
    setClanEquipError(null);

    fetch(`/api/smash/profile/${encodeURIComponent(selectedClanMember)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        if (data && data.success && Array.isArray(data.equipment)) {
          const equipped = data.equipment.filter((item: any) => !item.isEmpty);
          setClanMemberEquipment(equipped);
        } else {
          setClanEquipError('No se pudo cargar el equipamiento de este personaje.');
        }
      })
      .catch((err) => {
        if (!isCancelled) setClanEquipError('Error al contactar con Smash MU');
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingClanEquip(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedClanMember, showClanPicker, isCreateModalOpen]);

  const handleImportClanItem = (item: any) => {
    const cleanName = cleanMuItemName(item.name) || item.name;
    setNewItemName(cleanName);
    const lvl = typeof item.level === 'number' ? `+${item.level}` : (item.level ? (item.level.startsWith('+') ? item.level : `+${item.level}`) : '+0');
    setNewItemLevel(lvl);
    setNewSlotLabel(item.slotLabel || 'EQUIPMENT');
    const isWpn = item.slotIndex === 0 || item.slotIndex === 1;
    const isWng = item.slotIndex === 7;
    const isPet = item.slotIndex === 8;
    const cat = isWpn ? 'weapon' : isWng ? 'wings' : isPet ? 'pet' : 'armor';
    setNewItemCategory(cat);

    const r = item.rarity || (item.excellent > 0 ? 'uncommon' : 'epic');
    setNewRarity(r);
    const t = item.excellent > 0 ? '[EXC]' : r === 'legendary' ? '[LEGENDARY]' : r === 'rare' ? '[RARE]' : '[EPIC]';
    setNewTag(t);

    if (item.stats) {
      if (typeof item.stats.damageMin === 'number') setNewDamageMin(item.stats.damageMin);
      if (typeof item.stats.damageMax === 'number') setNewDamageMax(item.stats.damageMax);
      if (typeof item.stats.defense === 'number') setNewDefense(item.stats.defense);
      if (typeof item.stats.attackSpeed === 'number') setNewAttackSpeed(item.stats.attackSpeed);
      if (typeof item.stats.durability === 'number') setNewDurability(item.stats.durability);
      if (typeof item.stats.maxDurability === 'number') setNewMaxDurability(item.stats.maxDurability);
      if (typeof item.stats.requireStrength === 'number') setNewStrengthReq(item.stats.requireStrength);
      if (typeof item.stats.requireDexterity === 'number') setNewAgilityReq(item.stats.requireDexterity);
      if (typeof item.stats.requireEnergy === 'number') setNewEnergyReq(item.stats.requireEnergy);
      if (Array.isArray(item.stats.allowedClasses) && item.stats.allowedClasses.length > 0) {
        setNewClassesAllowed(item.stats.allowedClasses);
      }
    }
    if (item.durability && (!item.stats || !item.stats.durability)) {
      setNewDurability(item.durability);
    }
    if (item.additionalOption) {
      setNewAdditionalStat(item.additionalOption);
    }
    if (Array.isArray(item.excellentOptions) && item.excellentOptions.length > 0) {
      setNewSelectedExcOptions(item.excellentOptions);
    } else {
      setNewSelectedExcOptions([]);
    }
    if (item.harmonyOption) {
      const harmStr = typeof item.harmonyOption === 'string' ? item.harmonyOption : item.harmonyOption?.label || item.harmonyOption?.name;
      setNewHarmonyOption(harmStr || '');
    } else {
      setNewHarmonyOption('');
    }
    setNewHasLuck(item.luck !== false);
    setNewHasSkill(Boolean(item.skill));
    if (item.gearScore) setNewGearScore(item.gearScore);

    // Clear uploaded screenshot to ensure authentic Smash MU sprite is primary
    setNewUploadedImage('');
    setAnalysisStatus({
      type: 'success',
      message: `¡${item.name} +${item.level} cargado con éxito directamente de Smash MU (${selectedClanMember})!`,
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically analyze image and extract Mu Online stats & options
  const analyzeAndConfigureItem = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisStatus({
      type: 'analyzing',
      message: 'Escaneando captura con OCR local y extrayendo todos los atributos oficiales de Mu Online...',
    });

    try {
      const response = await fetch('/api/items/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        const item = json.data;
        if (item.rarity) setNewRarity(item.rarity);
        if (item.tag) setNewTag(item.tag);
        const clean = cleanMuItemName(item.itemName || '') || item.itemName || 'Dragon Armor';
        setNewItemName(clean);
        const catalogMatch = getSmashMuItemByName(clean);
        if (catalogMatch) {
          if (!item.rarity) setNewRarity(catalogMatch.defaultRarity);
          if (!item.tag) setNewTag(catalogMatch.defaultTag);
          setNewSlotLabel(catalogMatch.slotLabel);
          setNewItemCategory(catalogMatch.category);
          if (catalogMatch.stats) {
            if ((!item.defense || item.defense === 0) && catalogMatch.stats.defense) setNewDefense(catalogMatch.stats.defense);
            if ((!item.durability || item.durability === 0) && catalogMatch.stats.maxDurability) {
              setNewDurability(catalogMatch.stats.maxDurability);
              setNewMaxDurability(catalogMatch.stats.maxDurability);
            }
          }
        } else {
          // If no catalog match, deduce slot and category directly from item name
          if (/Armor|Armr|Pechera|Chest/i.test(clean)) {
            setNewSlotLabel('ARMOR (CHEST)');
            setNewItemCategory('armor');
          } else if (/Helm|Casco|Mask/i.test(clean)) {
            setNewSlotLabel('HELMET');
            setNewItemCategory('armor');
          } else if (/Pants|Pantalon/i.test(clean)) {
            setNewSlotLabel('PANTS');
            setNewItemCategory('armor');
          } else if (/Gloves|Guantes/i.test(clean)) {
            setNewSlotLabel('GLOVES');
            setNewItemCategory('armor');
          } else if (/Boots|Botas/i.test(clean)) {
            setNewSlotLabel('BOOTS');
            setNewItemCategory('armor');
          } else if (/Shield|Escudo/i.test(clean)) {
            setNewSlotLabel('SHIELD');
            setNewItemCategory('armor');
          } else if (/Wings|Cape|Cloak|Alas/i.test(clean)) {
            setNewSlotLabel('WINGS');
            setNewItemCategory('wings');
          } else if (/Staff|Scepter|Blade|Sword|Bow|Crossbow|Dagger|Mace/i.test(clean)) {
            setNewSlotLabel('WEAPON (RIGHT)');
            setNewItemCategory('weapon');
          } else if (item.slotLabel) {
            setNewSlotLabel(item.slotLabel);
          }
          if (item.category) setNewItemCategory(item.category);
        }

        if (item.itemLevel) {
          const lvl = item.itemLevel.startsWith('+') ? item.itemLevel : `+${item.itemLevel}`;
          setNewItemLevel(lvl);
        }
        if (typeof item.damageMin === 'number') setNewDamageMin(item.damageMin);
        if (typeof item.damageMax === 'number') setNewDamageMax(item.damageMax);

        // Ensure defense is never left as 0 for armor/wings
        const detectedDefense = typeof item.defense === 'number' && item.defense > 0 ? item.defense : 0;
        if (detectedDefense > 0) {
          setNewDefense(detectedDefense);
        } else if (/Armor|Armr/i.test(clean)) {
          setNewDefense(67);
        } else if (/Pants/i.test(clean)) {
          setNewDefense(48);
        } else if (/Helm/i.test(clean)) {
          setNewDefense(42);
        } else if (/Gloves/i.test(clean)) {
          setNewDefense(35);
        } else if (/Boots/i.test(clean)) {
          setNewDefense(36);
        } else if (/Wings|Cloak/i.test(clean)) {
          setNewDefense(83);
        }

        if (typeof item.attackSpeed === 'number') setNewAttackSpeed(item.attackSpeed);

        // Ensure durability is never left as 0/0
        const detectedDur = typeof item.durability === 'number' && item.durability > 0 ? item.durability : 83;
        const detectedMaxDur = typeof item.maxDurability === 'number' && item.maxDurability > 0 ? item.maxDurability : 68;
        setNewDurability(detectedDur);
        setNewMaxDurability(detectedMaxDur);

        if (typeof item.strengthReq === 'number' && item.strengthReq > 0) setNewStrengthReq(item.strengthReq);
        else if (/Dragon/i.test(clean)) setNewStrengthReq(152);

        if (typeof item.agilityReq === 'number') setNewAgilityReq(item.agilityReq);
        if (typeof item.energyReq === 'number') setNewEnergyReq(item.energyReq);
        if (Array.isArray(item.classesAllowed) && item.classesAllowed.length > 0) {
          setNewClassesAllowed(item.classesAllowed);
        }
        if (item.additionalStat) setNewAdditionalStat(item.additionalStat);
        if (item.gearTechOption) setNewGearTechOption(item.gearTechOption);
        if (typeof item.gearScore === 'number') setNewGearScore(item.gearScore);
        if (item.hasSkill !== undefined) setNewHasSkill(Boolean(item.hasSkill));
        setNewHasLuck(item.hasLuck !== false);
        if (Array.isArray(item.excellentOptions) && item.excellentOptions.length > 0) {
          setNewSelectedExcOptions(item.excellentOptions);
        }
        if (item.harmonyOption) {
          setNewHarmonyOption(item.harmonyOption);
        }

        setAnalysisStatus({
          type: 'success',
          message: `¡Todos los datos detectados! ${item.tag || ''} ${item.itemName} ${item.itemLevel || ''} · ${item.excellentOptions?.length || 0} Exc · GearScore ${item.gearScore || 'N/A'}.`,
        });
      } else {
        setAnalysisStatus({
          type: 'error',
          message: json.error || 'No se pudo autodetectar. Puedes configurar los valores manualmente.',
        });
      }
    } catch (err: any) {
      console.error('Error analyzing item image:', err);
      setAnalysisStatus({
        type: 'error',
        message: 'No se pudo conectar con el analizador. Puedes ingresar los datos manualmente.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Image Upload from File Input
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setNewUploadedImage(dataUrl);
        analyzeAndConfigureItem(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop of Image
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          setNewUploadedImage(dataUrl);
          analyzeAndConfigureItem(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Clipboard Paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const dataUrl = reader.result;
              setNewUploadedImage(dataUrl);
              analyzeAndConfigureItem(dataUrl);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Toggle Excellent Option
  const toggleExcOption = (opt: string) => {
    setNewSelectedExcOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  // Load preset templates
  const loadPresetTemplate = (
    preset:
      | 'battle'
      | 'scepter'
      | 'staff'
      | 'blade'
      | 'armor'
      | 'sphinx'
      | 'gloves'
      | 'magicWings'
      | 'deathCloak'
  ) => {
    if (preset === 'magicWings') {
      setNewTag('[LEGENDARY]');
      setNewRarity('legendary');
      setNewItemName('Wings of Magic');
      setNewItemLevel('+15');
      setNewSlotLabel('WINGS');
      setNewItemCategory('wings');
      setNewDefense(83);
      setNewAttackSpeed(0);
      setNewDurability(255);
      setNewMaxDurability(255);
      setNewStrengthReq(undefined);
      setNewAgilityReq(undefined);
      setNewClassesAllowed(['Dark Wizard', 'Magic Gladiator', 'Summoner']);
      setNewHasSkill(false);
      setNewHasLuck(true);
      setNewAdditionalStat('Additional Curse Spell +12');
      setNewSelectedExcOptions([
        'Zen after hunting monsters +200%',
        'Double damage rate 4%',
        'HP +170 increased',
        'Max AG +30 increased',
      ]);
      setNewHarmonyOption('');
      setNewGearTechOption('');
      setNewGearScore(232);
      setNewUploadedImage('/assets/aistudio/image_eeb91cb7.png');
    } else if (preset === 'deathCloak') {
      setNewTag('[UNCOMMON]');
      setNewRarity('uncommon');
      setNewItemName('Cloak of Death');
      setNewItemLevel('+9');
      setNewSlotLabel('WINGS');
      setNewItemCategory('wings');
      setNewDefense(73);
      setNewAttackSpeed(0);
      setNewDurability(255);
      setNewMaxDurability(255);
      setNewStrengthReq(undefined);
      setNewAgilityReq(undefined);
      setNewClassesAllowed(['Dark Lord', 'Rage Fighter']);
      setNewHasSkill(false);
      setNewHasLuck(false);
      setNewAdditionalStat('');
      setNewSelectedExcOptions([
        'Automatic HP recovery 1%',
        'Complete recovery of life in 1% rate',
      ]);
      setNewHarmonyOption('');
      setNewGearTechOption('');
      setNewGearScore(167);
      setNewUploadedImage('/assets/aistudio/image_8cc2cbea.png');
    } else if (preset === 'battle') {
      setNewTag('[EPIC]');
      setNewRarity('epic');
      setNewItemName('Battle Scepter');
      setNewItemLevel('+9');
      setNewSlotLabel('WEAPON (RIGHT)');
      setNewItemCategory('weapon');
      setNewDamageMin(41);
      setNewDamageMax(52);
      setNewAttackSpeed(45);
      setNewDurability(69);
      setNewMaxDurability(40);
      setNewStrengthReq(80);
      setNewAgilityReq(17);
      setNewClassesAllowed(['Dark Lord']);
      setNewHasSkill(true);
      setNewHasLuck(true);
      setNewAdditionalStat('');
      setNewSelectedExcOptions([
        'Ignore Opponent Defensive Power +7%',
        'Increased Damage +5',
        'Increase Damage +level/11',
        'Excellent Damage Rate +16%',
      ]);
      setNewHarmonyOption('Incremento de daño de skill +12');
      setNewGearTechOption('');
      setNewGearScore(148);
      setNewUploadedImage('/assets/aistudio/image_8af2b15a.png');
    } else if (preset === 'sphinx') {
      setNewTag('[LEGENDARY]');
      setNewRarity('legendary');
      setNewItemName('SPHINX ARMOR');
      setNewItemLevel('+13');
      setNewSlotLabel('ARMOR (CHEST)');
      setNewItemCategory('armor');
      setNewDefense(67);
      setNewAttackSpeed(0);
      setNewDurability(83);
      setNewMaxDurability(68);
      setNewStrengthReq(152);
      setNewAgilityReq(undefined);
      setNewClassesAllowed(['Dark Wizard', 'Magic Gladiator']);
      setNewHasSkill(false);
      setNewHasLuck(true);
      setNewAdditionalStat('Additional defense +8');
      setNewSelectedExcOptions([
        'Reflect Damage +7%',
        'Damage Decrease +7%',
        'Max AG increased by 7%',
        'Increase Max HP +7%',
      ]);
      setNewHarmonyOption('Damage decrement increase +5%');
      setNewGearTechOption('All Stats +20 MAX · Armor +13%');
      setNewGearScore(136);
      setNewUploadedImage('/assets/aistudio/image_fa57e1b0.png');
    } else if (preset === 'scepter') {
      setNewTag('[LEGENDARY]');
      setNewRarity('legendary');
      setNewItemName('Great Scepter');
      setNewItemLevel('+15');
      setNewSlotLabel('WEAPON (RIGHT)');
      setNewItemCategory('weapon');
      setNewDamageMin(74);
      setNewDamageMax(85);
      setNewAttackSpeed(45);
      setNewDurability(127);
      setNewMaxDurability(65);
      setNewStrengthReq(180);
      setNewAgilityReq(60);
      setNewClassesAllowed(['Dark Lord']);
      setNewAdditionalStat('Additional damage +16');
      setNewHasSkill(true);
      setNewHasLuck(true);
      setNewSelectedExcOptions([
        'Ignore Opponent Defensive Power +7%',
        'Life After Hunting Monster +life/21',
        'Increased Damage +5',
        'Excellent Damage Rate +16%',
      ]);
      setNewHarmonyOption('Incremento de daño (mín. y máx.) +19');
      setNewGearTechOption('');
      setNewGearScore(155);
    } else if (preset === 'staff') {
      setNewTag('[LEGENDARY]');
      setNewRarity('legendary');
      setNewItemName('Platina Staff');
      setNewItemLevel('+15');
      setNewSlotLabel('WEAPON (RIGHT)');
      setNewItemCategory('weapon');
      setNewDamageMin(51);
      setNewDamageMax(53);
      setNewAttackSpeed(30);
      setNewDurability(140);
      setNewMaxDurability(255);
      setNewStrengthReq(120);
      setNewAgilityReq(undefined);
      setNewClassesAllowed(['Dark Wizard']);
      setNewAdditionalStat('Additional wizardry damage +16');
      setNewHasSkill(false);
      setNewHasLuck(true);
      setNewSelectedExcOptions([
        'Ignore Opponent Defensive Power +6%',
        'Increased Attacking (Wizardry) Speed9',
        'Excellent Damage Rate +14%',
      ]);
      setNewHarmonyOption('Incremento de daño crítico +28');
      setNewGearTechOption('');
      setNewGearScore(142);
    } else if (preset === 'blade') {
      setNewTag('[EXC]');
      setNewRarity('uncommon');
      setNewItemName('Bone Blade');
      setNewItemLevel('+15');
      setNewSlotLabel('WEAPON (RIGHT)');
      setNewItemCategory('weapon');
      setNewDamageMin(115);
      setNewDamageMax(135);
      setNewAttackSpeed(40);
      setNewDurability(180);
      setNewMaxDurability(255);
      setNewStrengthReq(240);
      setNewAgilityReq(110);
      setNewClassesAllowed(['Blade Knight', 'Magic Gladiator']);
      setNewAdditionalStat('Additional damage +28');
      setNewHasSkill(true);
      setNewHasLuck(true);
      setNewSelectedExcOptions([
        'Excellent Damage Rate +16%',
        'Increase Damage +2%',
        'Increase Attack Speed +7',
      ]);
      setNewHarmonyOption('Incremento de daño (mín. y máx.) +25');
      setNewGearTechOption('');
      setNewGearScore(160);
    } else if (preset === 'armor') {
      setNewTag('[EXC]');
      setNewRarity('uncommon');
      setNewItemName('Dragon Armor');
      setNewItemLevel('+15');
      setNewSlotLabel('ARMOR (CHEST)');
      setNewItemCategory('armor');
      setNewDefense(125);
      setNewAttackSpeed(0);
      setNewDurability(180);
      setNewMaxDurability(255);
      setNewStrengthReq(210);
      setNewAgilityReq(75);
      setNewClassesAllowed(['Blade Knight', 'Magic Gladiator']);
      setNewAdditionalStat('Additional defense +16');
      setNewHasSkill(false);
      setNewHasLuck(true);
      setNewSelectedExcOptions([
        'Damage Decrease +4%',
        'Reflect Damage +5%',
        'Defense Success Rate +10%',
      ]);
      setNewHarmonyOption('Aumento de poder defensivo +35');
      setNewGearTechOption('');
      setNewGearScore(150);
    } else if (preset === 'gloves') {
      setNewTag('[RARE]');
      setNewRarity('rare');
      setNewItemName('Legendary Gloves');
      setNewItemLevel('+7');
      setNewSlotLabel('GLOVES');
      setNewItemCategory('armor');
      setNewDefense(47);
      setNewAttackSpeed(0);
      setNewDurability(67);
      setNewMaxDurability(52);
      setNewStrengthReq(84);
      setNewAgilityReq(undefined);
      setNewClassesAllowed(['Dark Wizard', 'Magic Gladiator']);
      setNewAdditionalStat('Swimming speed increase · Additional defense +8');
      setNewHasSkill(false);
      setNewHasLuck(true);
      setNewSelectedExcOptions([
        'Reflect Damage +5%',
        'Max AG increased by 5%',
      ]);
      setNewHarmonyOption('');
      setNewGearTechOption('');
      setNewGearScore(81);
    }
  };

  // Filtered auctions
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auc) => {
      const matchSearch = auc.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCurrency = filterCurrency === 'all' || auc.currencyType === filterCurrency;
      const matchCategory = filterCategory === 'all' || auc.category === filterCategory;
      return matchSearch && matchCurrency && matchCategory;
    });
  }, [auctions, searchQuery, filterCurrency, filterCategory]);

  // Format time remaining
  const getTimeRemaining = (endsAt: number) => {
    const diff = endsAt - Date.now();
    if (diff <= 0) return 'Subasta Cerrada';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m restantes`;
  };

  // Place bid handler with server sync & automatic Discord [VENDIDO] trigger
  const handlePlaceBid = async (auctionId: string, increment: number) => {
    const target = auctions.find((a) => a.id === auctionId);
    if (!target) return;

    const newBid = target.currentBid + increment;
    const isBoughtOut = Boolean(target.buyoutPrice && newBid >= target.buyoutPrice);

    try {
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidder: currentMemberName,
          amount: newBid,
          isBuyout: isBoughtOut,
        }),
      });
      const data = await res.json();
      if (data && data.success && data.item) {
        const updated = auctions.map((a) => (a.id === auctionId ? data.item : a));
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));

        if (data.sold) {
          setBidSuccessMessage(`¡Subasta ganada por ${currentMemberName}! El anuncio en Discord (#Subastas) se actualizó a [VENDIDO].`);
        } else {
          setBidSuccessMessage(`¡Puja registrada con éxito por ${currentMemberName}!`);
        }
        setTimeout(() => setBidSuccessMessage(null), 3500);
        return;
      }
    } catch (err) {
      console.warn('Bid sync error:', err);
    }

    // Local state fallback
    const updated = auctions.map((auc) => {
      if (auc.id === auctionId) {
        return {
          ...auc,
          currentBid: isBoughtOut ? auc.buyoutPrice! : newBid,
          highestBidder: currentMemberName,
          status: isBoughtOut ? ('sold' as const) : auc.status,
          estado: isBoughtOut ? ('Vendido' as const) : auc.estado || 'Activo',
        };
      }
      return auc;
    });

    setAuctions(updated);
    localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
    setBidSuccessMessage(`¡Puja registrada con éxito por ${currentMemberName}!`);
    setTimeout(() => setBidSuccessMessage(null), 3000);
  };

  // Delete Modal opener (replaces window.confirm completely)
  const handleOpenDeleteModal = (item: AuctionItem) => {
    setDeleteModalItem(item);
  };

  // Confirm delete auction with automatic Discord [SUBASTA ELIMINADA] announcement
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setIsDeletingLoading(true);

    try {
      const res = await fetch(`/api/auctions/${deleteModalItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data && data.success) {
        const updated = auctions.filter((a) => a.id !== deleteModalItem.id);
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
        setBidSuccessMessage(
          `¡Subasta de ${deleteModalItem.itemName} eliminada y notificada a Discord (#Subastas)!`
        );
        setTimeout(() => setBidSuccessMessage(null), 4000);
        setDeleteModalItem(null);
        return;
      }
    } catch (err) {
      console.warn('Delete sync error:', err);
    } finally {
      setIsDeletingLoading(false);
    }

    const updated = auctions.filter((a) => a.id !== deleteModalItem.id);
    setAuctions(updated);
    localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
    setBidSuccessMessage('¡Subasta eliminada de la lista!');
    setTimeout(() => setBidSuccessMessage(null), 3000);
    setDeleteModalItem(null);
  };

  // Clear all auctions handler (wipes web and deletes all from Discord)
  const handleConfirmClearAll = async () => {
    setIsClearingAllLoading(true);
    try {
      const res = await fetch('/api/auctions', { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        setAuctions([]);
        localStorage.setItem('anomaly_auctions', '[]');
        setBidSuccessMessage('¡Todas las subastas han sido eliminadas y borradas de Discord!');
        setTimeout(() => setBidSuccessMessage(null), 4000);
        setIsClearAllModalOpen(false);
      }
    } catch (e) {
      console.warn('Error clearing all auctions:', e);
    } finally {
      setIsClearingAllLoading(false);
    }
  };

  // Open sell item dialog
  const handleOpenSellModal = (item: AuctionItem) => {
    setSellingModalItem(item);
    setSellFinalPrice(item.buyoutPrice || item.currentBid);
    setSellWinnerName(
      item.highestBidder && item.highestBidder !== 'Sin pujas aún'
        ? item.highestBidder
        : currentMemberName || 'Comprador'
    );
  };

  // Confirm sell item and notify Discord
  const handleConfirmSell = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sellingModalItem) return;

    setIsSellingLoading(true);
    try {
      const res = await fetch(`/api/auctions/${sellingModalItem.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precioFinal: sellFinalPrice,
          ganador: sellWinnerName || currentMemberName,
        }),
      });

      const data = await res.json();
      if (data && data.success && data.item) {
        const updated = auctions.map((a) => (a.id === sellingModalItem.id ? data.item : a));
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
        setBidSuccessMessage(
          `¡${data.item.itemName} marcado como VENDIDO! Anuncio publicado exitosamente en Discord (#Subastas).`
        );
        setTimeout(() => setBidSuccessMessage(null), 4000);
        setSellingModalItem(null);
        return;
      }
    } catch (err: any) {
      console.error('Error confirming sell:', err);
    } finally {
      setIsSellingLoading(false);
    }
  };

  // Re-send / Force sold notification to Discord (#Subastas) with live message POST
  const handleResendSoldToDiscord = async (item: AuctionItem) => {
    setNotifyingSoldId(item.id);
    try {
      const res = await fetch(`/api/auctions/${item.id}/notify-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precioFinal: item.currentBid,
          ganador: item.highestBidder || 'Comprador',
        }),
      });
      const data = await res.json();
      if (data && data.success && data.item) {
        const updated = auctions.map((a) => (a.id === item.id ? data.item : a));
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
        setBidSuccessMessage(
          `¡Aviso oficial de venta 🔴 [VENDIDO] publicado en Discord (#Subastas)!`
        );
        setTimeout(() => setBidSuccessMessage(null), 4000);
      } else {
        setBidSuccessMessage(data?.error || 'No se pudo notificar a Discord');
        setTimeout(() => setBidSuccessMessage(null), 3500);
      }
    } catch (err) {
      console.warn('Error re-sending to Discord:', err);
      setBidSuccessMessage('Error de conexión al notificar a Discord');
      setTimeout(() => setBidSuccessMessage(null), 3000);
    } finally {
      setNotifyingSoldId(null);
    }
  };

  // Open edit / correction modal
  const handleOpenEditModal = (item: AuctionItem) => {
    setEditingItem(item);
    setEditItemName(item.itemName);
    setEditItemLevel(item.itemLevel || '+0');
    setEditTag(item.tag || '[EXC]');
    setEditRarity(item.rarity || 'uncommon');
    setEditStartingBid(item.startingBid);
    setEditBuyoutPrice(item.buyoutPrice || 0);
    setEditHarmonyOption(item.harmonyOption || '');
    setEditAdditionalStat(item.additionalStat || '');
  };

  // Save edit / correction and sync with Discord (#Subastas)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsEditLoading(true);
    try {
      const updates = {
        itemName: editItemName.trim(),
        itemLevel: editItemLevel.trim(),
        tag: editTag.trim(),
        rarity: editRarity,
        startingBid: editStartingBid,
        buyoutPrice: editBuyoutPrice > 0 ? editBuyoutPrice : undefined,
        harmonyOption: editHarmonyOption.trim() || undefined,
        additionalStat: editAdditionalStat.trim() || undefined,
      };

      const res = await fetch(`/api/auctions/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data && data.success && data.item) {
        const updated = auctions.map((a) => (a.id === editingItem.id ? data.item : a));
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
        setBidSuccessMessage(
          `¡Subasta corregida con éxito! Anuncio en Discord (#Subastas) actualizado a [SUBASTA CORREGIDA].`
        );
        setTimeout(() => setBidSuccessMessage(null), 4000);
        setEditingItem(null);
      }
    } catch (err: any) {
      console.error('Error saving auction edit:', err);
    } finally {
      setIsEditLoading(false);
    }
  };

  // Create auction handler (publishes to Discord with ?wait=true and saves discord_message_id)
  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const cleanName = cleanMuItemName(newItemName) || newItemName.trim();
    const catalogMatch = getSmashMuItemByName(cleanName);
    const sprite = catalogMatch ? getSmashMuImageUrl(catalogMatch.imagePath) : getItemSprite(cleanName, newItemCategory);
    const defaultTagForRarity =
      newRarity === 'epic'
        ? '[EPIC]'
        : newRarity === 'rare'
        ? '[RARE]'
        : newRarity === 'uncommon'
        ? '[EXC]'
        : '[LEGENDARY]';

    const newAuction: AuctionItem = {
      id: `auc-${Date.now()}`,
      es_subasta: newEsSubasta,
      estado: 'Activo',
      tag: newTag || defaultTagForRarity,
      itemName: cleanName,
      itemLevel: newItemLevel,
      slotLabel: newSlotLabel,
      category: newItemCategory,
      rarity: newRarity,
      excellentOptions: newSelectedExcOptions,
      sellerName: currentMemberName,
      currencyType: newCurrencyType,
      startingBid: newStartingBid,
      currentBid: newStartingBid,
      highestBidder: 'Sin pujas aún',
      buyoutPrice: newBuyoutPrice > 0 ? newBuyoutPrice : undefined,
      endsAt: Date.now() + newDurationHours * 3600 * 1000,
      status: 'active',
      spriteUrl: sprite,
      screenshotUrl: newUploadedImage || undefined,
      imagePath: sprite,
      linkWeb: window.location.href,
      stats: {
        damageMin: newItemCategory === 'weapon' ? newDamageMin : undefined,
        damageMax: newItemCategory === 'weapon' ? newDamageMax : undefined,
        defense: newItemCategory === 'armor' || newItemCategory === 'wings' ? newDefense : undefined,
        attackSpeed: newItemCategory === 'weapon' ? newAttackSpeed : undefined,
        durability: newDurability,
        maxDurability: newMaxDurability,
        strengthReq: newStrengthReq,
        agilityReq: newAgilityReq,
        energyReq: newEnergyReq,
      },
      classesAllowed: newClassesAllowed.length > 0 ? newClassesAllowed : undefined,
      additionalStat: newAdditionalStat || undefined,
      gearTechOption: newGearTechOption || undefined,
      gearScore: newGearScore,
      hasSkill: newHasSkill,
      hasLuck: newHasLuck,
      harmonyOption: newHarmonyOption.trim() || undefined,
    };

    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAuction),
      });
      const data = await res.json();
      if (data && data.success && data.item) {
        const finalItem = data.item;
        const updated = [finalItem, ...auctions.filter((a) => a.id !== finalItem.id)];
        setAuctions(updated);
        localStorage.setItem('anomaly_auctions', JSON.stringify(updated));
        setIsCreateModalOpen(false);
        if (finalItem.discord_message_id) {
          setBidSuccessMessage(`¡Ítem publicado con éxito en la web y anunciado en Discord (#${discordInfo?.channelName || 'Subastas'})!`);
        } else {
          setBidSuccessMessage('¡Ítem publicado con éxito con su ficha profesional oficial!');
        }
        setTimeout(() => setBidSuccessMessage(null), 3500);
        return;
      }
    } catch (err) {
      console.warn('Backend auction creation failed, saving locally:', err);
    }

    const updated = [newAuction, ...auctions];
    setAuctions(updated);
    localStorage.setItem('anomaly_auctions', JSON.stringify(updated));

    setIsCreateModalOpen(false);
    setBidSuccessMessage('¡Ítem publicado con éxito con su ficha profesional oficial!');
    setTimeout(() => setBidSuccessMessage(null), 3000);
  };

  // Preview object for the live form
  const livePreviewItem: Partial<AuctionItem> = useMemo(() => {
    const cleanName = cleanMuItemName(newItemName) || newItemName || 'Nombre del Ítem';
    const catalogMatch = getSmashMuItemByName(cleanName);
    const sprite = catalogMatch ? getSmashMuImageUrl(catalogMatch.imagePath) : getItemSprite(cleanName, newItemCategory);
    const defaultTagForRarity =
      newRarity === 'epic'
        ? '[EPIC]'
        : newRarity === 'rare'
        ? '[RARE]'
        : newRarity === 'uncommon'
        ? '[EXC]'
        : '[LEGENDARY]';

    return {
      tag: newTag || defaultTagForRarity,
      itemName: cleanName,
      itemLevel: newItemLevel || '+15',
      slotLabel: newSlotLabel,
      category: newItemCategory,
      rarity: newRarity,
      spriteUrl: sprite,
      screenshotUrl: newUploadedImage || undefined,
      imagePath: sprite,
      stats: {
        damageMin: newItemCategory === 'weapon' ? newDamageMin : undefined,
        damageMax: newItemCategory === 'weapon' ? newDamageMax : undefined,
        defense: newItemCategory === 'armor' || newItemCategory === 'wings' ? newDefense : undefined,
        attackSpeed: newItemCategory === 'weapon' ? newAttackSpeed : undefined,
        durability: newDurability,
        maxDurability: newMaxDurability,
        strengthReq: newStrengthReq,
        agilityReq: newAgilityReq,
        energyReq: newEnergyReq,
      },
      classesAllowed: newClassesAllowed.length > 0 ? newClassesAllowed : undefined,
      additionalStat: newAdditionalStat || undefined,
      gearTechOption: newGearTechOption || undefined,
      gearScore: newGearScore,
      hasSkill: newHasSkill,
      hasLuck: newHasLuck,
      excellentOptions: newSelectedExcOptions,
      harmonyOption: newHarmonyOption,
    };
  }, [
    newTag,
    newRarity,
    newItemName,
    newItemLevel,
    newSlotLabel,
    newItemCategory,
    newUploadedImage,
    newDamageMin,
    newDamageMax,
    newDefense,
    newAttackSpeed,
    newDurability,
    newMaxDurability,
    newStrengthReq,
    newAgilityReq,
    newEnergyReq,
    newClassesAllowed,
    newAdditionalStat,
    newGearTechOption,
    newGearScore,
    newHasSkill,
    newHasLuck,
    newSelectedExcOptions,
    newHarmonyOption,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0c101d] via-[#14122d] to-[#0c101d] p-6 rounded-2xl border border-pink-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-pink-300 bg-pink-500/10 px-3 py-0.5 rounded-full">
              <Gavel className="w-3.5 h-3.5 text-pink-400" />
              <span>Casa de Subastas &amp; Fichas Oficiales de Ítems</span>
            </div>
            {discordInfo?.connected ? (
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-500/50 px-3 py-0.5 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Discord Conectado (#{discordInfo.channelName || 'Subastas'})</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-700/60 px-3 py-0.5 rounded-full">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Webhook Discord</span>
              </div>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Subasta del Clan</h2>
          <p className="text-xs text-slate-400">
            Adjunta la captura o foto de tu ítem para generar la ficha táctica oficial. Las subastas se sincronizan en vivo con tu canal de Discord.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {auctions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-600 text-red-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              title="Eliminar todas las subastas para empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Limpiar Todo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Ítem con Ficha Profesional</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {bidSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 flex items-center space-x-2 text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{bidSuccessMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c101d] p-3.5 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Filter */}
          <div className="flex items-center space-x-1 bg-[#080b15] p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setFilterCurrency('all')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                filterCurrency === 'all'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterCurrency('bless')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center space-x-1 ${
                filterCurrency === 'bless'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gem className="w-3 h-3 text-cyan-300" />
              <span>En Bless</span>
            </button>
            <button
              onClick={() => setFilterCurrency('dkp')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center space-x-1 ${
                filterCurrency === 'dkp'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3 h-3 text-amber-400" />
              <span>En DKP</span>
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="bg-[#080b15] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">Todas las Categorías</option>
            <option value="weapon">Armas</option>
            <option value="armor">Armaduras</option>
            <option value="wings">Alas</option>
            <option value="pet">Mascotas (Fenrir/Caballo)</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ítem..."
            className="bg-[#080b15] border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Auction Items Grid or Clean Empty State */}
      {filteredAuctions.length === 0 ? (
        <div className="bg-[#0c101d] border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto shadow-lg shadow-pink-950/40">
            <Gavel className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No hay subastas activas en este momento</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Actualmente no hay ítems en subasta. Puedes publicar cualquier arma, armadura o ala adjuntando su imagen para generar la ficha táctica profesional en tiempo real.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Ítem en Subasta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((item) => {
            const isBless = item.currencyType === 'bless';
            const isClosed = item.status === 'sold' || item.endsAt <= Date.now();

            return (
              <div
                key={item.id}
                className="bg-[#0c101d] rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-pink-500/50 transition-all shadow-xl flex flex-col justify-between"
              >
                {/* Discord & Status Badges */}
                <div className="flex items-center justify-between text-[11px] pb-1">
                  <div className="flex items-center space-x-1.5">
                    {item.discord_message_id ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/50 px-2 py-0.5 rounded-md shadow-sm">
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span>Discord Sincronizado</span>
                      </span>
                    ) : item.es_subasta ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        <span>Web</span>
                      </span>
                    ) : null}
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isClosed || item.estado === 'Vendido'
                        ? 'bg-red-950/80 text-red-300 border-red-700/60'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    }`}
                  >
                    {isClosed || item.estado === 'Vendido' ? '🔴 Vendido' : '🟢 Activo'}
                  </span>
                </div>

                {/* Embed the Real-Time Item Tooltip Card */}
                <ItemTooltipCard item={item} />

                {/* Auction Info & Bidding Bar */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        Puja Actual:
                      </span>
                      <span className="text-lg font-black font-mono text-pink-400 tabular-nums">
                        {item.currentBid} {isBless ? 'Bless' : 'DKP'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        Mejor Postor:
                      </span>
                      <span className="font-bold text-white text-xs truncate max-w-[130px] block">
                        {item.highestBidder}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{getTimeRemaining(item.endsAt)}</span>
                    </span>
                    <span>Vendedor: <strong className="text-slate-300">{item.sellerName}</strong></span>
                  </div>

                  {item.buyoutPrice && (
                    <div className="flex items-center justify-between text-[11px] bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-500/30 font-mono">
                      <span className="text-amber-400">Compra Directa:</span>
                      <span className="font-bold text-amber-300">
                        {item.buyoutPrice} {isBless ? 'Bless' : 'DKP'}
                      </span>
                    </div>
                  )}

                  {!isClosed ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePlaceBid(item.id, isBless ? 5 : 10)}
                          className="py-2 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pujar +{isBless ? '5 Bless' : '10 DKP'}</span>
                        </button>

                        {item.buyoutPrice ? (
                          <button
                            onClick={() => handlePlaceBid(item.id, item.buyoutPrice! - item.currentBid)}
                            className="py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Comprar Ya</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSellModal(item)}
                            className="py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marcar Vendido</span>
                          </button>
                        )}
                      </div>

                      {/* Botón directo para Marcar como Vendido y notificar a Discord */}
                      {item.buyoutPrice && (
                        <button
                          type="button"
                          onClick={() => handleOpenSellModal(item)}
                          className="w-full py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          title="Cierra la subasta y envía anuncio oficial [VENDIDO] a Discord (#Subastas)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Marcar como Vendido (Avisa a Discord)</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="p-2 text-center text-xs font-bold text-red-300 bg-red-950/50 rounded-xl border border-red-700/50 space-y-0.5">
                        <div className="flex items-center justify-center space-x-1 text-red-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Subasta Finalizada / Vendido</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300">
                          Ganador: <strong className="text-white">{item.highestBidder}</strong> · {item.currentBid} {isBless ? 'Bless' : 'DKP'}
                        </div>
                      </div>

                      {/* Botón para forzar/publicar aviso de venta nuevo en Discord */}
                      <button
                        type="button"
                        onClick={() => handleResendSoldToDiscord(item)}
                        disabled={notifyingSoldId === item.id}
                        className="w-full text-[11px] font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/50 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        title="Publicar aviso oficial de venta nuevo en canal Discord #Subastas"
                      >
                        {notifyingSoldId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span>Enviando a Discord...</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Notificar Venta a Discord (#Subastas)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Bottom Action Buttons: Editar & Eliminar */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    {!isClosed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="py-1.5 px-2 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 rounded-lg transition-all flex items-center justify-center space-x-1 border border-amber-600/40 cursor-pointer"
                        title="Corregir datos o precios y actualizar en Discord #Subastas"
                      >
                        <Pencil className="w-3 h-3 text-amber-400" />
                        <span>Corregir / Editar</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(item)}
                      className={`py-1.5 px-2 text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center space-x-1 border border-slate-800 hover:border-red-600/50 cursor-pointer ${
                        isClosed ? 'col-span-2' : ''
                      }`}
                      title="Eliminar de la web y notificar cancelación a Discord #Subastas"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Eliminar Subasta</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PUBLICAR ÍTEM CON FOTO & GENERADOR AUTOMÁTICO PROFESIONAL */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div
          onPaste={handlePaste}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div className="bg-[#090d1c] border border-pink-500/40 rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg flex items-center space-x-2">
                  <Gavel className="w-5 h-5 text-pink-400" />
                  <span>Publicar Ítem en la Subasta del Clan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjunta una foto o captura de tu ítem. El sistema lo escaneará y configurará sus estadísticas y opciones automáticamente.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Auto-Configuration Status Banner */}
            {analysisStatus.type !== 'idle' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  analysisStatus.type === 'analyzing'
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 animate-pulse'
                    : analysisStatus.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {analysisStatus.type === 'analyzing' ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : analysisStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="font-medium">{analysisStatus.message}</span>
                </div>
                {analysisStatus.type === 'success' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
                    Auto-Configurado
                  </span>
                )}
              </div>
            )}

            {/* Clan Character Equipment Picker (Direct from Smash MU API) */}
            <div className="bg-[#060810] rounded-xl border border-purple-500/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                    <span>Cargar Ítem Real desde Personaje del Clan (Smash MU)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono font-bold border border-purple-700/50">
                      API Oficial
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClanPicker(!showClanPicker)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-800/40 transition-colors"
                >
                  {showClanPicker ? '▲ Ocultar Personajes' : '▼ Seleccionar Personaje del Clan'}
                </button>
              </div>

              {/* Clan Members Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 text-[11px] shrink-0 font-mono">Personaje:</span>
                {CLAN_MEMBERS.map((memberName) => (
                  <button
                    key={memberName}
                    type="button"
                    onClick={() => {
                      setSelectedClanMember(memberName);
                      setShowClanPicker(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedClanMember.toLowerCase() === memberName.toLowerCase()
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950 border border-purple-400'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {memberName}
                  </button>
                ))}
              </div>

              {/* Equipment Items List for the Selected Character */}
              {showClanPicker && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Equipamiento real de <strong className="text-purple-300 font-mono">{selectedClanMember}</strong> en Smash MU:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Haz clic en cualquier ítem para importarlo con su imagen y atributos oficiales
                    </span>
                  </div>

                  {isLoadingClanEquip ? (
                    <div className="py-4 text-center text-xs text-purple-300 flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span>Cargando inventario y sprites reales desde Smash MU...</span>
                    </div>
                  ) : clanEquipError ? (
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                      {clanEquipError}
                    </div>
                  ) : clanMemberEquipment.length === 0 ? (
                    <div className="py-2 text-center text-xs text-slate-500">
                      Este personaje no tiene piezas de equipamiento activas en este momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-1">
                      {clanMemberEquipment.map((item) => (
                        <button
                          key={`${item.slotIndex}-${item.name}-${item.level}`}
                          type="button"
                          onClick={() => handleImportClanItem(item)}
                          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-400 text-left transition-all hover:scale-[1.03] group cursor-pointer flex flex-col justify-between h-28 shadow-sm"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[9px] uppercase font-bold text-slate-500 truncate max-w-[55px]">
                              {item.slotLabel}
                            </span>
                            <span className="text-[10px] font-mono font-black text-amber-400">
                              +{item.level}
                            </span>
                          </div>

                          <div className="w-10 h-10 mx-auto my-auto flex items-center justify-center p-0.5">
                            <img
                              src={`https://www.smashmu.com${item.imagePath}`}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow group-hover:scale-115 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          <div className="w-full text-center">
                            <span className="text-[10px] font-bold text-white truncate block group-hover:text-purple-300">
                              {item.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Templates Bar */}
            <div className="bg-[#060810] p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Opciones Rápidas:</span>
              </span>
              <button
                type="button"
                onClick={() => loadPresetTemplate('magicWings')}
                className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 text-purple-300 font-bold flex items-center space-x-1 shadow-sm"
              >
                <span>🪽 Wings of Magic +15 [LEGENDARY]</span>
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('deathCloak')}
                className="px-2.5 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900 border border-teal-500/60 text-teal-300 font-bold flex items-center space-x-1 shadow-sm"
              >
                <span>🪽 Cloak of Death +9 [UNCOMMON]</span>
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('gloves')}
                className="px-2.5 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-500/60 text-blue-300 font-bold flex items-center space-x-1 shadow-sm"
              >
                <span>⭐ Legendary Gloves +7 [RARE]</span>
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('sphinx')}
                className="px-2.5 py-1 rounded-lg bg-pink-950/70 hover:bg-pink-900 border border-pink-500/60 text-pink-300 font-bold flex items-center space-x-1 shadow-sm"
              >
                <span>⭐ Sphinx Armor +13 [LEGENDARY]</span>
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('battle')}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-bold flex items-center space-x-1 shadow-sm"
              >
                <span>⭐ Battle Scepter +9</span>
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('scepter')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-semibold"
              >
                Great Scepter +15 Exc
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('staff')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 font-semibold"
              >
                Platina Staff +15 Exc
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('blade')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-semibold"
              >
                Bone Blade +15 Exc
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('armor')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-semibold"
              >
                Dragon Armor +15 Exc
              </button>
            </div>

            {/* Split Form: Left Controls + Right Live Professional Tooltip Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Controls (Left 7 Cols) */}
              <form onSubmit={handleCreateAuction} className="lg:col-span-7 space-y-4 text-xs">
                {/* 1. Image Upload Button / Input with Drag & Drop & Paste Support */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="bg-[#060810] p-3.5 rounded-xl border border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                      <span>1. Foto o Captura del Ítem (Escaner Automático)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {newUploadedImage && (
                        <button
                          type="button"
                          onClick={() => analyzeAndConfigureItem(newUploadedImage)}
                          disabled={isAnalyzing}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Re-escanear OCR</span>
                        </button>
                      )}
                      {newUploadedImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewUploadedImage('');
                            setAnalysisStatus({ type: 'idle' });
                          }}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all bg-[#080b15] space-y-1.5 ${
                      isAnalyzing
                        ? 'border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'border-slate-700 hover:border-pink-500/80'
                    }`}
                  >
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center space-y-2 py-1">
                        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                        <p className="text-cyan-300 font-bold text-xs">
                          Escaneando imagen y reconociendo todos los datos del ítem...
                        </p>
                        <p className="text-[10px] text-cyan-500/80">
                          Detectando etiqueta [LEGENDARY], defensa, durabilidad, requisitos, clases, harmony, geartech y gearscore.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-pink-400 mx-auto" />
                        <p className="text-slate-200 font-semibold">
                          Arrastra, pega (Ctrl+V) o haz clic para subir la captura
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ✨ <strong className="text-cyan-300">Detección automática:</strong> El sistema lee la imagen y llena todos los campos al instante.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Official MU Rarity Selector & Classification */}
                <div className="space-y-1.5 bg-[#060810] p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. Clasificación de Rareza Oficial</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Seleccionada: <strong className={newRarity === 'legendary' ? 'text-amber-400' : newRarity === 'epic' ? 'text-purple-400' : newRarity === 'rare' ? 'text-blue-400' : 'text-cyan-400'}>{newRarity.toUpperCase()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* Legendary */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewRarity('legendary');
                        setNewTag('[LEGENDARY]');
                      }}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all border cursor-pointer ${
                        newRarity === 'legendary'
                          ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                          : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="text-sm">🌟</span>
                      <span>[LEGENDARY]</span>
                    </button>

                    {/* Epic */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewRarity('epic');
                        setNewTag('[EPIC]');
                      }}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all border cursor-pointer ${
                        newRarity === 'epic'
                          ? 'bg-purple-950/70 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-500/40'
                      }`}
                    >
                      <span className="text-sm">🔮</span>
                      <span>[EPIC]</span>
                    </button>

                    {/* Rare */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewRarity('rare');
                        setNewTag('[RARE]');
                      }}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all border cursor-pointer ${
                        newRarity === 'rare'
                          ? 'bg-blue-950/70 border-blue-400 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                          : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/40'
                      }`}
                    >
                      <span className="text-sm">💎</span>
                      <span>[RARE]</span>
                    </button>

                    {/* Uncommon / Excelente */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewRarity('uncommon');
                        setNewTag('[EXC]');
                      }}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all border cursor-pointer ${
                        newRarity === 'uncommon'
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-[#080b15] border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'
                      }`}
                    >
                      <span className="text-sm">✨</span>
                      <span>[EXC]</span>
                    </button>
                  </div>
                </div>

                {/* 3. Basic Info: Tag, Name with Autocomplete, Level */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Etiqueta / Tag</label>
                    <input
                      type="text"
                      placeholder={newRarity === 'epic' ? '[EPIC]' : newRarity === 'rare' ? '[RARE]' : newRarity === 'uncommon' ? '[EXC]' : '[LEGENDARY]'}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className={`w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 font-bold focus:outline-none focus:border-pink-500 font-mono ${
                        newRarity === 'legendary'
                          ? 'text-amber-300'
                          : newRarity === 'epic'
                          ? 'text-purple-300'
                          : newRarity === 'rare'
                          ? 'text-blue-300'
                          : 'text-cyan-300'
                      }`}
                    />
                  </div>

                  <div className="col-span-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">Nombre del Ítem</label>
                      <span className="text-[10px] text-cyan-400 font-mono">✨ Búsqueda oficial</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Escribe: Battle Scepter, Sphinx..."
                      value={newItemName}
                      onFocus={() => setShowItemSuggestions(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewItemName(val);
                        setShowItemSuggestions(true);
                        const clean = cleanMuItemName(val);
                        if (/Armor|Armr|Pechera|Chest/i.test(clean)) {
                          setNewSlotLabel('ARMOR (CHEST)');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(67);
                        } else if (/Helm|Casco|Mask/i.test(clean)) {
                          setNewSlotLabel('HELMET');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(42);
                        } else if (/Pants|Pantalon/i.test(clean)) {
                          setNewSlotLabel('PANTS');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(48);
                        } else if (/Gloves|Guantes/i.test(clean)) {
                          setNewSlotLabel('GLOVES');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(33);
                        } else if (/Boots|Botas/i.test(clean)) {
                          setNewSlotLabel('BOOTS');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(34);
                        } else if (/Shield|Escudo/i.test(clean)) {
                          setNewSlotLabel('SHIELD');
                          setNewItemCategory('armor');
                          if (newDefense === 0) setNewDefense(55);
                        } else if (/Wings|Cape|Cloak|Alas/i.test(clean)) {
                          setNewSlotLabel('WINGS');
                          setNewItemCategory('wings');
                          if (newDefense === 0) setNewDefense(83);
                        } else if (/Staff|Scepter|Blade|Sword|Bow|Crossbow|Dagger|Mace/i.test(clean)) {
                          setNewSlotLabel('WEAPON (RIGHT)');
                          setNewItemCategory('weapon');
                        }
                      }}
                      className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-semibold"
                    />

                    {/* Autocomplete Dropdown with Official SmashMU Sprites */}
                    {showItemSuggestions && newItemName.trim().length >= 1 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#090d1c] border border-cyan-500/60 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                        {searchMuItems(newItemName, 7).map((catItem) => (
                          <button
                            key={`${catItem.name}-${catItem.group}-${catItem.index}`}
                            type="button"
                            onClick={() => {
                              setNewItemName(catItem.name);
                              setNewSlotLabel(catItem.slotLabel);
                              setNewItemCategory(catItem.category);
                              setNewRarity(catItem.defaultRarity);
                              setNewTag(catItem.defaultTag);
                              if (catItem.stats) {
                                if (catItem.stats.damageMin) setNewDamageMin(catItem.stats.damageMin);
                                if (catItem.stats.damageMax) setNewDamageMax(catItem.stats.damageMax);
                                if (catItem.stats.defense) setNewDefense(catItem.stats.defense);
                                if (catItem.stats.attackSpeed) setNewAttackSpeed(catItem.stats.attackSpeed);
                                if (catItem.stats.maxDurability) setNewMaxDurability(catItem.stats.maxDurability);
                                if (catItem.stats.strengthReq) setNewStrengthReq(catItem.stats.strengthReq);
                                if (catItem.stats.agilityReq) setNewAgilityReq(catItem.stats.agilityReq);
                                if (catItem.stats.allowedClasses) setNewClassesAllowed(catItem.stats.allowedClasses);
                              }
                              setShowItemSuggestions(false);
                            }}
                            className="w-full p-2.5 flex items-center space-x-3 text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="w-9 h-9 rounded-lg bg-black/60 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                              <img
                                src={getSmashMuImageUrl(catItem.imagePath)}
                                alt={catItem.name}
                                className="w-full h-full object-contain filter drop-shadow group-hover:scale-110 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white text-xs truncate group-hover:text-cyan-300">
                                  {catItem.name}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                    catItem.defaultRarity === 'legendary'
                                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                                      : catItem.defaultRarity === 'epic'
                                      ? 'bg-purple-950/80 text-purple-300 border border-purple-600/40'
                                      : catItem.defaultRarity === 'rare'
                                      ? 'bg-blue-950/80 text-blue-300 border border-blue-600/40'
                                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/40'
                                  }`}
                                >
                                  {catItem.defaultTag}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {catItem.slotLabel} · Rareza {catItem.defaultRarity.toUpperCase()}
                              </div>
                            </div>
                          </button>
                        ))}
                        <div className="p-1.5 text-center bg-black/50 text-[10px] text-slate-400 font-mono flex items-center justify-between px-3">
                          <span>Auto-rellena imagen y estadísticas oficiales</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowItemSuggestions(false);
                            }}
                            className="text-cyan-400 hover:underline"
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Nivel</label>
                    <input
                      type="text"
                      required
                      value={newItemLevel}
                      onChange={(e) => setNewItemLevel(e.target.value)}
                      placeholder="+13"
                      className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* 3. Combat & Equipment Stats */}
                <div className="bg-[#060810] p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-slate-400 font-bold block text-[11px] uppercase">
                    Estadísticas Principales y Requisitos
                  </span>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Categoría</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value as any)}
                        className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white focus:outline-none text-xs"
                      >
                        <option value="armor">Armadura</option>
                        <option value="weapon">Arma</option>
                        <option value="wings">Alas</option>
                        <option value="pet">Mascota</option>
                      </select>
                    </div>

                    {newItemCategory === 'weapon' ? (
                      <>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Ataque Mín</label>
                          <input
                            type="number"
                            value={newDamageMin}
                            onChange={(e) => setNewDamageMin(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Ataque Máx</label>
                          <input
                            type="number"
                            value={newDamageMax}
                            onChange={(e) => setNewDamageMax(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Vel. Ataque</label>
                          <input
                            type="number"
                            value={newAttackSpeed}
                            onChange={(e) => setNewAttackSpeed(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] text-cyan-400 block mb-0.5 font-bold">Defensa</label>
                          <input
                            type="number"
                            value={newDefense}
                            onChange={(e) => setNewDefense(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-[#080b15] border border-cyan-800/80 rounded p-1.5 text-cyan-200 font-mono text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Durab. [Act / Máx]</label>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={newDurability}
                              onChange={(e) => setNewDurability(parseInt(e.target.value, 10) || 0)}
                              className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                            />
                            <span className="text-slate-500">/</span>
                            <input
                              type="number"
                              value={newMaxDurability}
                              onChange={(e) => setNewMaxDurability(parseInt(e.target.value, 10) || 0)}
                              className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Fuerza Req.</label>
                          <input
                            type="number"
                            value={newStrengthReq || ''}
                            placeholder="152"
                            onChange={(e) => setNewStrengthReq(parseInt(e.target.value, 10) || undefined)}
                            className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Class Compatibility & Additional Stat */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Clases Compatibles (ej. Dark Wizard, Magic Gladiator)
                      </label>
                      <input
                        type="text"
                        value={newClassesAllowed.join(', ')}
                        onChange={(e) =>
                          setNewClassesAllowed(
                            e.target.value
                              .split(',')
                              .map((c) => c.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder="Dark Wizard, Magic Gladiator"
                        className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-cyan-400 block mb-0.5">
                        Opción Joya de Vida (Jewel of Life)
                      </label>
                      <input
                        type="text"
                        value={newAdditionalStat}
                        onChange={(e) => setNewAdditionalStat(e.target.value)}
                        placeholder="Additional defense +8"
                        className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-cyan-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Checkboxes for Skill & Luck */}
                <div className="flex items-center space-x-4">
                  {newItemCategory === 'weapon' && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newHasSkill}
                        onChange={(e) => setNewHasSkill(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-pink-600 focus:ring-0"
                      />
                      <span className="font-semibold text-amber-300">Habilidad de Arma (Skill)</span>
                    </label>
                  )}

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHasLuck}
                      onChange={(e) => setNewHasLuck(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span className="font-semibold text-cyan-300">Opción Luck (+25% / +5% Crítico)</span>
                  </label>
                </div>

                {/* 5. Excellent Options Multi-Select Chips */}
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-semibold text-[11px] uppercase">
                    Opciones Excelentes (Haz clic para activar/desactivar):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_EXCELLENT_OPTIONS.map((opt) => {
                      const isSelected = newSelectedExcOptions.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleExcOption(opt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            isSelected
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-sm'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Harmony, GearTech and GearScore */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-amber-300 font-semibold mb-1 text-[10px] uppercase">
                      Refuerzo Jewel of Harmony:
                    </label>
                    <input
                      type="text"
                      value={newHarmonyOption}
                      onChange={(e) => setNewHarmonyOption(e.target.value)}
                      placeholder="Damage decrement increase +5%"
                      className="w-full bg-[#080b15] border border-amber-800/80 rounded-lg p-2 text-amber-300 font-medium focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-fuchsia-400 font-semibold mb-1 text-[10px] uppercase">
                      GearScore (GS):
                    </label>
                    <input
                      type="number"
                      value={newGearScore || ''}
                      onChange={(e) => setNewGearScore(parseInt(e.target.value, 10) || undefined)}
                      placeholder="136"
                      className="w-full bg-[#080b15] border border-fuchsia-800/80 rounded-lg p-2 text-fuchsia-300 font-mono font-bold focus:outline-none focus:border-fuchsia-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-300 font-semibold mb-1 text-[10px] uppercase">
                    Optimización GearTech (Opcional):
                  </label>
                  <input
                    type="text"
                    value={newGearTechOption}
                    onChange={(e) => setNewGearTechOption(e.target.value)}
                    placeholder="All Stats +20 MAX · Armor +13%"
                    className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                {/* 7. Pricing & Auction Duration */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Moneda</label>
                    <select
                      value={newCurrencyType}
                      onChange={(e) => setNewCurrencyType(e.target.value as any)}
                      className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="bless">Jewel of Bless</option>
                      <option value="dkp">Puntos DKP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Puja Inicial</label>
                    <input
                      type="number"
                      value={newStartingBid}
                      onChange={(e) => setNewStartingBid(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Compra Directa</label>
                    <input
                      type="number"
                      value={newBuyoutPrice}
                      onChange={(e) => setNewBuyoutPrice(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#080b15] border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Discord Webhook Synchronization Toggle */}
                <div className="bg-[#0b1022] p-3 rounded-xl border border-indigo-500/40 flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="es_subasta_toggle"
                    checked={newEsSubasta}
                    onChange={(e) => setNewEsSubasta(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-800 border-indigo-500 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="es_subasta_toggle" className="cursor-pointer text-xs space-y-0.5 flex-1">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sincronizar automáticamente con Discord (#{discordInfo?.channelName || 'Subastas'})</span>
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Publica el anuncio con foto y atributos oficiales en Discord, guarda el ID de mensaje, lo actualiza a <strong className="text-red-400">[VENDIDO]</strong> al finalizar y lo elimina automáticamente si cancelas la subasta.
                    </p>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg shadow-pink-950/50"
                  >
                    Publicar Ítem en Subasta
                  </button>
                </div>
              </form>

              {/* Live Preview Column (Right 5 Cols) */}
              <div className="lg:col-span-5 bg-[#060810] p-4 rounded-2xl border border-slate-800 space-y-3 sticky top-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                  <span className="font-bold flex items-center space-x-1.5 text-pink-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista Previa en Tiempo Real:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Formato Oficial</span>
                </div>

                <div className="py-2 relative overflow-hidden rounded-2xl">
                  {isAnalyzing && (
                    <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center rounded-2xl">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                      <span className="font-bold text-cyan-300 text-xs">
                        Analizando captura con IA...
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Extrayendo nombre, nivel, daño, opciones excelentes y harmony
                      </span>
                    </div>
                  )}
                  <ItemTooltipCard item={livePreviewItem} />
                </div>

                <p className="text-[11px] text-slate-500 text-center italic">
                  Así verán los compradores el ítem en la subasta con todos sus atributos detallados.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MARCAR COMO VENDIDO Y NOTIFICAR A DISCORD (#SUBASTAS) */}
      {/* ============================================================== */}
      {sellingModalItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090d1c] border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Marcar Ítem como Vendido</h3>
                  <p className="text-[11px] text-slate-400">
                    Sincronización instantánea con canal Discord (#Subastas)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSellingModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item summary card */}
            <div className="bg-[#060810] p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-black/70 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                <img
                  src={sellingModalItem.imagePath || sellingModalItem.spriteUrl}
                  alt={sellingModalItem.itemName}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate flex items-center space-x-1.5">
                  <span className="text-pink-400">{sellingModalItem.tag}</span>
                  <span>{sellingModalItem.itemName}</span>
                  <span className="text-amber-400">{sellingModalItem.itemLevel}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Vendedor: <span className="text-slate-300 font-semibold">{sellingModalItem.sellerName}</span>
                </div>
              </div>
            </div>

            {/* Form Fields: Comprador & Precio Final */}
            <form onSubmit={handleConfirmSell} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nombre del Comprador / Ganador:
                </label>
                <input
                  type="text"
                  required
                  value={sellWinnerName}
                  onChange={(e) => setSellWinnerName(e.target.value)}
                  placeholder="Ej. UlmerMG, SkyTM..."
                  className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Precio Final de Venta ({sellingModalItem.currencyType === 'bless' ? 'Jewel of Bless' : 'DKP'}):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={sellFinalPrice}
                  onChange={(e) => setSellFinalPrice(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2.5 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Discord notice callout */}
              <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/40 text-[11px] text-indigo-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-indigo-300">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Publicación automática en Discord:</span>
                </div>
                <p className="text-slate-300 leading-snug">
                  Se enviará la tarjeta oficial <strong className="text-red-400">🔴 [VENDIDO]</strong> al canal <strong>#Subastas</strong> con el precio final, comprador, estadísticas del ítem y foto oficial.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSellingModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSellingLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSellingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando a Discord...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Notificar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CORREGIR / EDITAR SUBASTA (SINCRONIZA CON DISCORD) */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#090d1c] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Corregir / Editar Subasta</h3>
                  <p className="text-[11px] text-slate-400">
                    Actualiza los datos y notifica los cambios en Discord (#Subastas)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target item preview bar */}
            <div className="bg-[#060810] p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-black/70 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                <img
                  src={editingItem.imagePath || editingItem.spriteUrl}
                  alt={editingItem.itemName}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate flex items-center space-x-1.5">
                  <span className="text-pink-400">{editingItem.tag}</span>
                  <span>{editingItem.itemName}</span>
                  <span className="text-amber-400">{editingItem.itemLevel}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Vendedor: <span className="text-slate-300 font-semibold">{editingItem.sellerName}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Ítem</label>
                  <input
                    type="text"
                    required
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nivel</label>
                  <input
                    type="text"
                    required
                    value={editItemLevel}
                    onChange={(e) => setEditItemLevel(e.target.value)}
                    placeholder="+13"
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Etiqueta / Tag</label>
                  <input
                    type="text"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    placeholder="[EXC] o [EPIC]"
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-pink-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rareza</label>
                  <select
                    value={editRarity}
                    onChange={(e) => setEditRarity(e.target.value as any)}
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="uncommon">Excelente (Uncommon)</option>
                    <option value="rare">Raro (Rare)</option>
                    <option value="epic">Épico (Epic)</option>
                    <option value="legendary">Legendario (Legendary)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Puja Inicial ({editingItem.currencyType?.toUpperCase() || 'BLESS'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editStartingBid}
                    onChange={(e) => setEditStartingBid(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-pink-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Compra Directa (0 = Sin compra)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editBuyoutPrice}
                    onChange={(e) => setEditBuyoutPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Refuerzo Jewel of Harmony</label>
                <input
                  type="text"
                  value={editHarmonyOption}
                  onChange={(e) => setEditHarmonyOption(e.target.value)}
                  placeholder="Incremento de daño crítico +28"
                  className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Opción Joya de Vida (Adicional)</label>
                <input
                  type="text"
                  value={editAdditionalStat}
                  onChange={(e) => setEditAdditionalStat(e.target.value)}
                  placeholder="Additional defense +8"
                  className="w-full bg-[#060810] border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Discord notice callout */}
              <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/40 text-[11px] text-indigo-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-indigo-300">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sincronización con canal #Subastas:</span>
                </div>
                <p className="text-slate-300 leading-snug">
                  Al guardar, se enviará la tarjeta oficial <strong className="text-amber-400">✏️ [SUBASTA CORREGIDA]</strong> a Discord con los nuevos atributos y precios actualizados.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isEditLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando Discord...</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      <span>Guardar y Notificar Discord</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE SUBASTA (SIN WINDOW.CONFIRM) */}
      {/* ============================================================== */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090d1c] border border-red-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Eliminar Subasta</h3>
                  <p className="text-[11px] text-slate-400">
                    Sincronización con canal Discord (#Subastas)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item summary card */}
            <div className="bg-[#060810] p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-black/70 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                <img
                  src={deleteModalItem.imagePath || deleteModalItem.spriteUrl}
                  alt={deleteModalItem.itemName}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate flex items-center space-x-1.5">
                  <span className="text-pink-400">{deleteModalItem.tag}</span>
                  <span>{deleteModalItem.itemName}</span>
                  <span className="text-amber-400">{deleteModalItem.itemLevel}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Vendedor: <span className="text-slate-300 font-semibold">{deleteModalItem.sellerName}</span>
                </div>
              </div>
            </div>

            {/* Detailed warning */}
            <div className="bg-red-950/30 p-3 rounded-xl border border-red-500/30 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-red-300">
                ¿Estás seguro de que deseas eliminar esta subasta?
              </p>
              <p className="text-[11px] text-slate-400 leading-snug">
                El ítem se retirará del catálogo de la web y su anuncio se <strong className="text-red-400">eliminará por completo</strong> del canal Discord <strong>#Subastas</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={isDeletingLoading}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold transition-all shadow-lg shadow-red-950/50 flex items-center justify-center space-x-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {isDeletingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando en Discord...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar Subasta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Auctions Confirmation Modal */}
      {isClearAllModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !isClearingAllLoading && setIsClearAllModalOpen(false)}
        >
          <div
            className="bg-[#0b0e1b] border border-red-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Limpiar todas las subastas?</h3>
                <p className="text-xs text-slate-400">Empezar de cero</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#060810] p-3 rounded-xl border border-slate-800">
              Esta acción eliminará <strong>todas las subastas activas y vendidas</strong> tanto de la página web como del canal de Discord <strong>#Subastas</strong>. Podrás publicar nuevos ítems desde cero.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isClearingAllLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isClearingAllLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center space-x-1.5 shadow-lg shadow-red-950/50"
              >
                {isClearingAllLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando todo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar todo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
