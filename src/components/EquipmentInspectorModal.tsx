import React, { useState, useEffect, useMemo } from 'react';
import { SmashMUCharacterProfile, SmashMUEquipmentItem, decodeMuClass } from '../types/clan';
import { GuildMark } from './GuildMark';
import { Character3DViewer } from './Character3DViewer';
import {
  X,
  Shield,
  Sparkles,
  Sword,
  Heart,
  Zap,
  RefreshCw,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle,
  Gem,
  Award,
  Users,
  Sun,
  Flame,
  Loader2,
} from 'lucide-react';
import { useItemSprite, preloadItemSprites } from '../hooks/useItemSprite';

interface EquipmentInspectorModalProps {
  characterName: string | null;
  onClose: () => void;
  onSelectCharacter?: (name: string) => void;
}

const SLOT_LABELS: Record<number, string> = {
  0: 'Arma D.',
  1: 'Arma I.',
  2: 'Casco',
  3: 'Armor',
  4: 'Pants',
  5: 'Gloves',
  6: 'Boots',
  7: 'Alas',
  8: 'Pet',
  9: 'Pendant',
  10: 'Ring I.',
  11: 'Ring D.',
};

const getSlotCategory = (slotIndex: number): string => {
  if (slotIndex === 0 || slotIndex === 1) return 'weapon';
  if (slotIndex >= 2 && slotIndex <= 6) return 'armor';
  if (slotIndex === 7) return 'wings';
  if (slotIndex === 8) return 'pet';
  if (slotIndex >= 9 && slotIndex <= 11) return 'accessory';
  return 'armor';
};

export interface EnhancementRarityStyle {
  border: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  glowClass: string;
  badgeClass: string;
  label: string;
  tier: 'transcendent' | 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
}

/**
 * Calculates dynamic reactive border color and glowing effects based on the item enhancement
 * level (+0 to +15) and rarity tier.
 */
export const getItemEnhancementRarityStyle = (
  level: number = 0,
  rarity: string = 'common',
  excellent: number = 0
): EnhancementRarityStyle => {
  // +15: Transcendent Celestial Gold (Supreme MU Max Level)
  if (level >= 15) {
    return {
      border: '#f59e0b',
      borderClass: 'border-amber-400',
      bgClass: 'bg-gradient-to-b from-amber-950/40 via-amber-900/20 to-[#080b15]',
      textClass: 'text-amber-300',
      glowClass: 'shadow-[0_0_16px_rgba(245,158,11,0.55)]',
      badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/50',
      label: 'MÁXIMO +15',
      tier: 'transcendent',
    };
  }
  // +13 - +14: Mythic Magenta / Fuchsia (High Season 6 Top Tier)
  if (level >= 13) {
    return {
      border: '#d946ef',
      borderClass: 'border-fuchsia-500',
      bgClass: 'bg-gradient-to-b from-fuchsia-950/40 via-purple-900/20 to-[#080b15]',
      textClass: 'text-fuchsia-300',
      glowClass: 'shadow-[0_0_14px_rgba(217,70,239,0.5)]',
      badgeClass: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black shadow-md shadow-fuchsia-500/50',
      label: `MÍTICO +${level}`,
      tier: 'mythic',
    };
  }
  // +10 - +12: Epic Violet (Upper Tier)
  if (level >= 10) {
    return {
      border: '#a855f7',
      borderClass: 'border-purple-500',
      bgClass: 'bg-gradient-to-b from-purple-950/40 via-indigo-950/20 to-[#080b15]',
      textClass: 'text-purple-300',
      glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.45)]',
      badgeClass: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/40',
      label: `ÉPICO +${level}`,
      tier: 'epic',
    };
  }
  // +7 - +9: Rare Cyan / Sky Blue (Jewel of Soul Luck Threshold)
  if (level >= 7) {
    return {
      border: '#06b6d4',
      borderClass: 'border-cyan-400',
      bgClass: 'bg-gradient-to-b from-cyan-950/40 via-sky-950/20 to-[#080b15]',
      textClass: 'text-cyan-300',
      glowClass: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      badgeClass: 'bg-cyan-600 text-slate-950 font-black shadow-md shadow-cyan-500/40',
      label: `AVANZADO +${level}`,
      tier: 'rare',
    };
  }
  // +4 - +6: Uncommon Emerald
  if (level >= 4) {
    return {
      border: '#10b981',
      borderClass: 'border-emerald-500',
      bgClass: 'bg-gradient-to-b from-emerald-950/30 via-slate-900/20 to-[#080b15]',
      textClass: 'text-emerald-300',
      glowClass: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      badgeClass: 'bg-emerald-700 text-white font-bold',
      label: `MEJORADO +${level}`,
      tier: 'uncommon',
    };
  }
  // Base Item Rarity for level 0-3
  if (rarity === 'legendary') {
    return {
      border: '#f59e0b',
      borderClass: 'border-amber-500/60',
      bgClass: 'bg-amber-950/20',
      textClass: 'text-amber-300',
      glowClass: 'shadow-[0_0_8px_rgba(245,158,11,0.25)]',
      badgeClass: 'bg-amber-600 text-slate-950 font-bold',
      label: `LEGENDARY +${level}`,
      tier: 'legendary',
    };
  }
  if (rarity === 'epic') {
    return {
      border: '#a855f7',
      borderClass: 'border-purple-500/60',
      bgClass: 'bg-purple-950/20',
      textClass: 'text-purple-300',
      glowClass: 'shadow-[0_0_8px_rgba(168,85,247,0.25)]',
      badgeClass: 'bg-purple-700 text-white font-bold',
      label: `EPIC +${level}`,
      tier: 'epic',
    };
  }
  if (rarity === 'rare' || excellent > 0) {
    return {
      border: '#3b82f6',
      borderClass: 'border-blue-500/60',
      bgClass: 'bg-blue-950/20',
      textClass: 'text-blue-300',
      glowClass: 'shadow-[0_0_8px_rgba(59,130,246,0.25)]',
      badgeClass: 'bg-blue-600 text-white font-bold',
      label: `RARE +${level}`,
      tier: 'rare',
    };
  }
  return {
    border: '#64748b',
    borderClass: 'border-slate-700',
    bgClass: 'bg-slate-900/40',
    textClass: 'text-slate-300',
    glowClass: '',
    badgeClass: 'bg-slate-800 text-slate-300 font-medium',
    label: `+${level}`,
    tier: 'common',
  };
};

/**
 * Visual Equipment Slot Card component using useItemSprite with reactive enhancement border.
 */
interface EquipmentSlotVisualItemProps {
  item: SmashMUEquipmentItem;
  isSelected: boolean;
  onSelect: () => void;
}

const EquipmentSlotVisualItem: React.FC<EquipmentSlotVisualItemProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const category = getSlotCategory(item.slotIndex);
  const { spriteUrl, isLoading, hasFallback, reload } = useItemSprite({
    itemName: item.name,
    category,
    imagePath: item.imagePath,
  });

  const rarityStyle = getItemEnhancementRarityStyle(item.level, item.rarity, item.excellent);

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        borderColor: isSelected ? '#c084fc' : rarityStyle.border,
      }}
      className={`group relative h-28 rounded-xl border p-2 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer ${
        rarityStyle.bgClass
      } ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-xl shadow-purple-900/60 scale-[1.03]'
          : `${rarityStyle.glowClass} hover:scale-[1.02] hover:border-slate-400`
      }`}
    >
      {/* Top Header: Slot Label + Enhancement Level Pill */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 truncate max-w-[62px]">
          {SLOT_LABELS[item.slotIndex] || item.slotLabel}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black ${rarityStyle.badgeClass}`}
        >
          +{item.level}
        </span>
      </div>

      {/* Visual Sprite Stage with loading skeleton */}
      <div className="relative h-12 w-full flex items-center justify-center my-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded z-10 animate-pulse">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
        )}
        <img
          src={spriteUrl}
          alt={item.name}
          onError={() => {
            if (!hasFallback) reload();
          }}
          className={`max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform duration-200 ${
            isLoading ? 'opacity-30' : 'opacity-100'
          }`}
        />
        {hasFallback && (
          <span
            title="Sprite alternativo cargado"
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-black"
          />
        )}
      </div>

      {/* Visual Item Name with reactive rarity color */}
      <div className="w-full">
        <div
          title={item.name}
          className={`text-[10.5px] font-black truncate leading-tight transition-colors ${rarityStyle.textClass} group-hover:brightness-125`}
        >
          {item.name}
        </div>

        {/* Bottom Tags: EXC, Harmony, Durability */}
        <div className="flex items-center justify-between w-full text-[9px] font-mono mt-0.5">
          <div className="flex items-center space-x-1">
            {item.excellent > 0 && (
              <span className="px-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[8px]">
                EXC
              </span>
            )}
            {item.harmonyOption && (
              <span className="px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[8px]">
                H
              </span>
            )}
            {item.skill && (
              <span className="px-1 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-[8px]">
                S
              </span>
            )}
          </div>
          <span className="text-slate-400 truncate text-[9px]">
            {item.durability > 0 ? `${item.durability}d` : ''}
          </span>
        </div>
      </div>
    </button>
  );
};

/**
 * Visual Selected Item Card for Column 3 using useItemSprite with reactive border.
 */
const EquipmentSelectedItemView: React.FC<{ item: SmashMUEquipmentItem }> = ({ item }) => {
  const category = getSlotCategory(item.slotIndex);
  const { spriteUrl, isLoading, hasFallback, reload } = useItemSprite({
    itemName: item.name,
    category,
    imagePath: item.imagePath,
  });

  const rarityStyle = getItemEnhancementRarityStyle(item.level, item.rarity, item.excellent);

  return (
    <div className="space-y-4">
      {/* Header Visual Item Card with Reactive Rarity Border */}
      <div className="text-center pb-3 border-b border-slate-800/80 space-y-2">
        <div
          style={{ borderColor: rarityStyle.border }}
          className={`relative w-24 h-24 mx-auto rounded-2xl border-2 flex items-center justify-center p-2.5 transition-all duration-300 ${rarityStyle.bgClass} ${rarityStyle.glowClass}`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl z-10 backdrop-blur-xs">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-[9px] text-cyan-300 font-mono mt-1 font-semibold">Cargando...</span>
            </div>
          )}

          <img
            src={spriteUrl}
            alt={item.name}
            onError={() => {
              if (!hasFallback) reload();
            }}
            className={`max-h-full max-w-full object-contain filter drop-shadow-[0_0_14px_rgba(192,132,252,0.6)] hover:scale-110 transition-transform duration-300 ${
              isLoading ? 'opacity-30' : 'opacity-100'
            }`}
          />

          {/* Reactive Enhancement Level Pill */}
          <div
            className={`absolute -bottom-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono shadow-md ${rarityStyle.badgeClass}`}
          >
            +{item.level}
          </div>

          {hasFallback && (
            <button
              type="button"
              title="Sprite alternativo activo. Haz clic para reintentar desde CDN."
              onClick={reload}
              className="absolute top-1 right-1 p-1 rounded bg-black/80 text-amber-400 hover:text-amber-200 text-[8px]"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Visual Item Title Header */}
        <div className="pt-2">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center justify-center space-x-1.5">
            <span>{item.slotLabel || SLOT_LABELS[item.slotIndex]}</span>
            <span>•</span>
            <span
              style={{ color: rarityStyle.border }}
              className="font-black font-mono tracking-wider"
            >
              {rarityStyle.label}
            </span>
          </div>

          <h4
            className={`text-base font-black tracking-wide mt-1 ${
              item.excellent > 0
                ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : rarityStyle.textClass
            }`}
          >
            {item.excellent > 0 && (
              <span className="text-cyan-400 font-mono text-sm mr-1 font-black">[EXC]</span>
            )}
            {item.name} +{item.level}
          </h4>
        </div>
      </div>

      {/* Combat Properties */}
      {item.stats && (
        <div className="space-y-1.5 text-xs text-slate-300 bg-[#0a0e1c] p-3 rounded-lg border border-slate-800/80">
          {item.stats.damageMin !== undefined && item.stats.damageMax !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Sword className="w-3.5 h-3.5 text-red-400" />
                <span>Poder de Ataque:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {item.stats.damageMin} ~ {item.stats.damageMax}
              </span>
            </div>
          )}

          {item.stats.defense !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Defensa Física:</span>
              </span>
              <span className="font-mono font-bold text-white">
                +{item.stats.defense}
              </span>
            </div>
          )}

          {item.stats.attackSpeed !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Velocidad de Ataque:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {item.stats.attackSpeed}
              </span>
            </div>
          )}

          {item.durability > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Durabilidad:</span>
                <span className="font-mono text-slate-200">
                  {item.durability} / {item.stats.maxDurability || 255}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (item.durability / (item.stats.maxDurability || 255)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authentic MU Options: Luck, Excellent, Harmony */}
      <div className="space-y-2 text-xs">
        {item.skill && (
          <div className="text-amber-300 font-semibold flex items-center space-x-1.5 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Habilidad Especial de Arma (Skill)</span>
          </div>
        )}

        {item.luck && (
          <div className="text-sky-300 space-y-0.5 bg-sky-950/30 p-2 rounded border border-sky-800/30">
            <div className="font-bold text-[11px] text-sky-400 uppercase font-mono">
              Opción Luck
            </div>
            <div className="text-sky-200">• Tasa de éxito con Jewel of Soul +25%</div>
            <div className="text-sky-200">• Tasa de Daño Crítico +5%</div>
          </div>
        )}

        {item.additionalOption && (
          <div className="text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-950/30 border border-emerald-800/30">
            Recuperación Adicional: +{item.additionalOption}
          </div>
        )}

        {item.excellentOptions && item.excellentOptions.length > 0 && (
          <div className="space-y-1 bg-cyan-950/25 p-2.5 rounded-lg border border-cyan-500/30">
            <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center space-x-1">
              <Gem className="w-3 h-3 text-cyan-400" />
              <span>Opciones Excelentes:</span>
            </div>
            {item.excellentOptions.map((opt, i) => (
              <div key={i} className="text-cyan-200 text-xs flex items-center space-x-1.5">
                <span className="text-cyan-400">•</span>
                <span className="font-medium">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {item.harmonyOption && (
          <div className="space-y-1 bg-amber-950/25 p-2.5 rounded-lg border border-amber-500/30">
            <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Refuerzo Jewel of Harmony:</span>
            </div>
            <div className="text-amber-200 text-xs font-semibold">
              {item.harmonyOption.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export const EquipmentInspectorModal: React.FC<EquipmentInspectorModalProps> = ({
  characterName: initialCharacterName,
  onClose,
  onSelectCharacter,
}) => {
  const [activeName, setActiveName] = useState<string | null>(initialCharacterName);
  const [profile, setProfile] = useState<SmashMUCharacterProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'3d' | 'equipment' | 'details'>('3d');

  useEffect(() => {
    setActiveName(initialCharacterName);
  }, [initialCharacterName]);

  useEffect(() => {
    if (!activeName) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);

    const loadProfile = async () => {
      try {
        if (!activeName || !activeName.trim()) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/smash/profile/${encodeURIComponent(activeName.trim())}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (isCancelled) return;
          if (data && data.success && data.character) {
            setProfile(data);
            if (Array.isArray(data.equipment)) {
              const activeItems = data.equipment.filter((e: SmashMUEquipmentItem) => !e.isEmpty);
              preloadItemSprites(
                activeItems.map((e: SmashMUEquipmentItem) => ({
                  itemName: e.name,
                  category: getSlotCategory(e.slotIndex),
                  imagePath: e.imagePath,
                }))
              );
            }
            // Auto select first non-empty slot
            const firstItem = (data.equipment || []).find(
              (e: SmashMUEquipmentItem) => !e.isEmpty
            );
            if (firstItem) setSelectedSlot(firstItem.slotIndex);
          } else {
            setError(data.error || 'No se pudo obtener el perfil de este personaje.');
          }
        } else {
          setError('No se pudo conectar con el servidor para obtener este personaje.');
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Error de conexión con el servidor Smash MU.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [activeName]);

  const character = profile?.character;
  const equipment = profile?.equipment || [];
  const selectedItem = equipment.find((e) => e.slotIndex === selectedSlot && !e.isEmpty);

  // Analyze equipped set and total stats without repeating data
  const armorSlots = [2, 3, 4, 5, 6];
  const activeArmorPieces = equipment.filter((e) => armorSlots.includes(e.slotIndex) && !e.isEmpty);

  const detectedSetName = useMemo(() => {
    if (activeArmorPieces.length === 0) return 'Sin armadura equipada';
    const names = activeArmorPieces.map((p) => p.name.split(' ')[0]);
    const counts = names.reduce((acc, n) => {
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      return `Set ${mostCommon[0]} (${mostCommon[1]}/5)`;
    }
    return 'Set Mixto';
  }, [activeArmorPieces]);

  const isFullSet = activeArmorPieces.length === 5;

  const totalDefense = useMemo(() => {
    return equipment.reduce((sum, item) => sum + (item.stats?.defense || 0), 0);
  }, [equipment]);

  const totalExcellentCount = useMemo(() => {
    return equipment.reduce((sum, item) => sum + (item.excellentOptions?.length || 0), 0);
  }, [equipment]);

  const totalHarmonyCount = useMemo(() => {
    return equipment.filter((item) => !!item.harmonyOption).length;
  }, [equipment]);

  const activeWing = equipment.find((e) => e.slotIndex === 7 && !e.isEmpty);

  if (!activeName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#090c16] border border-purple-500/40 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#060810]">
          <div className="flex items-center space-x-3">
            {character?.guild?.mark && (
              <GuildMark mark={character.guild.mark} size={4} />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white tracking-wide">{activeName}</span>
                {character?.guild && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 font-semibold">
                    {character.guild.name}
                  </span>
                )}
                {character?.guild?.isMaster && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                    GUILD MASTER
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                <span className="text-purple-300 font-semibold">
                  {character?.className || 'Personaje MU'}
                </span>
                <span>·</span>
                <span className="text-cyan-300">Nivel {character?.level ?? 400}</span>
                <span>·</span>
                <span className="text-amber-400 font-bold">{character?.resets ?? '—'} Resets</span>
                <span>·</span>
                <span className="text-purple-300 font-bold">{character?.gearScore ?? '—'} GS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Clan Roster Switcher Bar */}
        <div className="bg-[#070912] border-b border-slate-800/80 px-4 py-1.5 flex items-center space-x-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-500 shrink-0 text-[11px] flex items-center space-x-1">
            <Users className="w-3 h-3 text-purple-400" />
            <span>Miembros ANOMALY:</span>
          </span>
          <div className="flex items-center space-x-1.5">
            {CLAN_MEMBERS.map((name) => {
              const isActive = activeName.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  onClick={() => {
                    setActiveName(name);
                    onSelectCharacter?.(name);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile View Selector Bar */}
        {!loading && !error && profile && (
          <div className="lg:hidden flex border-b border-slate-800 bg-[#070a14] px-4 py-2 space-x-2">
            <button
              onClick={() => setMobileTab('3d')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                mobileTab === '3d'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visor 3D</span>
            </button>
            <button
              onClick={() => setMobileTab('equipment')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                mobileTab === 'equipment'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Slots ({equipment.filter((e) => !e.isEmpty).length})</span>
            </button>
            <button
              onClick={() => setMobileTab('details')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                mobileTab === 'details'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atributos</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-9 h-9 text-purple-400 animate-spin" />
              <div className="text-base font-bold text-white">
                Sincronizando modelo 3D y ranuras de {activeName}...
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Cargando equipamiento real desde Smash MU API
              </div>
            </div>
          )}

          {error && (
            <div className="py-20 text-center space-y-3">
              <AlertCircle className="w-11 h-11 text-red-400 mx-auto" />
              <div className="text-base font-bold text-white">No se pudo cargar el equipamiento</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Column 1: Dominant 3D Character Model Stage */}
              <div
                className={`lg:col-span-5 space-y-3 ${
                  mobileTab !== '3d' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Visor 3D MU Online (Animación en Play)</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                    Cámara 360° Libre
                  </span>
                </div>

                {/* 3D Model Stage */}
                <Character3DViewer profile={profile} selectedSlotIndex={selectedSlot} />

                {/* Tactical Build Synergy Strip (Non-repetitive, real combat values) */}
                <div className="bg-[#070a14] border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white tracking-wide">{detectedSetName}</span>
                    </div>
                    {isFullSet ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Bono de Set Completo Activo
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {activeArmorPieces.length} / 5 Piezas
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-center">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                      <div className="text-[9px] text-slate-400 uppercase font-mono">Defensa Armadura</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">
                        +{totalDefense} Def
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                      <div className="text-[9px] text-cyan-400 uppercase font-mono">Opc. Excelentes</div>
                      <div className="text-xs font-black text-cyan-300 font-mono mt-0.5">
                        {totalExcellentCount} Activas
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                      <div className="text-[9px] text-amber-400 uppercase font-mono">Joyas Harmony</div>
                      <div className="text-xs font-black text-amber-300 font-mono mt-0.5">
                        {totalHarmonyCount} Refuerzos
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: 12 Equipment Slots Grid */}
              <div
                className={`lg:col-span-4 space-y-3 ${
                  mobileTab !== 'equipment' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Equipamiento Oficial</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {equipment.filter((e) => !e.isEmpty).length} / 12 Ranuras
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {equipment.map((item) => {
                    if (item.isEmpty) {
                      return (
                        <div
                          key={item.slotIndex}
                          className="h-28 rounded-xl border border-white/[0.04] bg-black/25 p-2 flex flex-col justify-between opacity-50"
                        >
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                            {SLOT_LABELS[item.slotIndex] || `Slot ${item.slotIndex}`}
                          </span>
                          <div className="text-center text-slate-700 text-xs font-mono my-auto">— Vacío —</div>
                          <div />
                        </div>
                      );
                    }

                    return (
                      <EquipmentSlotVisualItem
                        key={item.slotIndex}
                        item={item}
                        isSelected={selectedSlot === item.slotIndex}
                        onSelect={() => {
                          setSelectedSlot(item.slotIndex);
                          if (window.innerWidth < 1024) {
                            setMobileTab('details');
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Professional In-Game Item Card */}
              <div
                className={`lg:col-span-3 bg-[#070914] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 ${
                  mobileTab !== 'details' ? 'hidden lg:block' : 'block'
                }`}
              >
                {selectedItem ? (
                  <EquipmentSelectedItemView item={selectedItem} />
                ) : (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    Selecciona una ranura del equipamiento para inspeccionar sus atributos.
                  </div>
                )}

                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 text-center font-mono">
                  Sincronizado en tiempo real con Smash MU
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
