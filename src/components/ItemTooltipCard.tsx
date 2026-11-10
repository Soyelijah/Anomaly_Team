import React, { useState, useEffect } from 'react';
import { AuctionItem } from '../types/clan';
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Gem,
  Sun,
  Flame,
  Award,
  Layers,
  UserCheck,
  Eye,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getItemSprite, cleanMuItemName } from '../utils/itemSprites';
import { getSmashMuImageUrl, getSmashMuItemByName } from '../utils/muItemsDatabase';
import { useItemSprite } from '../hooks/useItemSprite';

interface ItemTooltipCardProps {
  item: Partial<AuctionItem>;
  className?: string;
  compact?: boolean;
}

export const ItemTooltipCard: React.FC<ItemTooltipCardProps> = ({
  item,
  className = '',
  compact = false,
}) => {
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const isExcellent = Boolean(item.excellentOptions && item.excellentOptions.length > 0);
  const isWeapon =
    item.category === 'weapon' ||
    item.slotLabel?.toLowerCase().includes('weapon') ||
    item.slotLabel?.toLowerCase().includes('arma');
  const isArmor =
    item.category === 'armor' ||
    item.slotLabel?.toLowerCase().includes('armor') ||
    item.slotLabel?.toLowerCase().includes('armadura') ||
    item.slotLabel?.toLowerCase().includes('casco') ||
    item.slotLabel?.toLowerCase().includes('pants') ||
    item.slotLabel?.toLowerCase().includes('boots') ||
    item.slotLabel?.toLowerCase().includes('gloves');

  // Determine effective rarity
  const rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' = (() => {
    if (item.rarity) return item.rarity;
    const tagUpper = (item.tag || '').toUpperCase();
    if (tagUpper.includes('EPIC')) return 'epic';
    if (tagUpper.includes('RARE')) return 'rare';
    if (tagUpper.includes('EXC') || tagUpper.includes('EXE') || tagUpper.includes('UNCOMMON')) return 'uncommon';
    if (tagUpper.includes('LEGENDARY')) return 'legendary';
    return isExcellent ? 'uncommon' : 'legendary';
  })();

  // Determine tag: [LEGENDARY], [EPIC], [RARE], [EXC]
  const tag = (() => {
    if (item.tag && item.tag.trim()) return item.tag.trim();
    switch (rarity) {
      case 'epic':
        return '[EPIC]';
      case 'rare':
        return '[RARE]';
      case 'uncommon':
        return '[EXC]';
      case 'legendary':
      default:
        return '[LEGENDARY]';
    }
  })();

  // Visual color theme according to authentic MU rarity
  const getRarityConfig = (r: string, tagStr: string) => {
    const t = tagStr.toUpperCase();
    if (t.includes('EPIC') || r === 'epic') {
      return {
        key: 'epic',
        tagColor: 'text-purple-400',
        titleColor: 'text-purple-300',
        glow: 'drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]',
        subtitleColor: 'text-purple-400',
        boxBorder: 'border-purple-500/50',
        boxGlow: 'shadow-[inset_0_0_20px_rgba(168,85,247,0.25)]',
        badgeBg: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
        label: 'EPIC',
      };
    }
    if (t.includes('RARE') || r === 'rare') {
      return {
        key: 'rare',
        tagColor: 'text-blue-400',
        titleColor: 'text-blue-300',
        glow: 'drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]',
        subtitleColor: 'text-blue-400',
        boxBorder: 'border-blue-500/50',
        boxGlow: 'shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]',
        badgeBg: 'bg-blue-950/80 border-blue-500/50 text-blue-300',
        label: 'RARE',
      };
    }
    if (t.includes('EXC') || t.includes('EXE') || t.includes('UNCOMMON') || r === 'uncommon') {
      return {
        key: 'uncommon',
        tagColor: 'text-cyan-400',
        titleColor: 'text-cyan-300',
        glow: 'drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]',
        subtitleColor: 'text-cyan-400',
        boxBorder: 'border-cyan-500/50',
        boxGlow: 'shadow-[inset_0_0_20px_rgba(6,182,212,0.25)]',
        badgeBg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
        label: 'UNCOMMON',
      };
    }
    return {
      key: 'legendary',
      tagColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      glow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]',
      subtitleColor: 'text-amber-400',
      boxBorder: 'border-amber-500/50',
      boxGlow: 'shadow-[inset_0_0_20px_rgba(245,158,11,0.25)]',
      badgeBg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      label: 'LEGENDARY',
    };
  };

  const rarityConfig = getRarityConfig(rarity, tag);

  // Check if a path is an uploaded image, screenshot, or dataUrl
  const isCustomUserImage = (path?: string) =>
    Boolean(
      path &&
        (path.startsWith('data:') ||
          path.includes('/assets/aistudio/') ||
          path.includes('image_') ||
          path.includes('/uploads/'))
    );

  // User attached or pasted image (takes full precedence if provided)
  const attachedImage =
    (item.screenshotUrl && isCustomUserImage(item.screenshotUrl) ? item.screenshotUrl : undefined) ||
    (item.imagePath && isCustomUserImage(item.imagePath) ? item.imagePath : undefined) ||
    (item.spriteUrl && isCustomUserImage(item.spriteUrl) ? item.spriteUrl : undefined) ||
    item.screenshotUrl;

  // Manage sprite pre-loading and Smash MU CDN loading/error states via useItemSprite hook
  const {
    spriteUrl: catalogSprite,
    isLoading: isSpriteLoading,
    isError: isSpriteError,
    hasFallback: isUsingFallback,
    reload: reloadSprite,
  } = useItemSprite({
    itemName: item.itemName,
    category: item.category,
    imagePath: item.imagePath,
  });

  // Default to showing official catalog sprite in the frame (like in MU inventory / inspector)
  const [showAttachedImage, setShowAttachedImage] = useState<boolean>(false);

  // The active image source displayed in the box (prioritizes official sprite)
  const activeImageSrc =
    (showAttachedImage && attachedImage)
      ? attachedImage
      : catalogSprite || attachedImage || '/assets/items/battle-scepter.gif';

  // Full screenshot proof for lightbox inspection
  const screenshotSrc = attachedImage;

  const displayName = cleanMuItemName(item.itemName) || item.itemName || 'Nombre del Ítem';

  return (
    <div
      className={`rounded-2xl bg-[#070a14] border border-[#1b223c] p-4 text-xs font-sans text-slate-200 shadow-2xl relative select-none flex flex-col space-y-3 ${className}`}
    >
      {/* Top Frame with Item Image & Level Badge */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1">
        <div className="relative">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-[#0e1428] via-[#090e1f] to-[#04060d] border-2 ${rarityConfig.boxBorder} flex items-center justify-center p-2 ${rarityConfig.boxGlow} overflow-hidden group transition-all duration-300 relative`}>
            {/* Loading Skeleton / Spinner Overlay */}
            {isSpriteLoading && !showAttachedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070a14]/80 z-20 backdrop-blur-xs">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-[9px] text-cyan-300 font-mono mt-1 font-semibold">Cargando CDN...</span>
              </div>
            )}

            {/* Fallback Recovery Badge */}
            {isUsingFallback && !showAttachedImage && (
              <button
                type="button"
                title="Sprite cargado con alternativa oficial de categoría. Haz clic para reintentar desde CDN."
                onClick={(e) => {
                  e.stopPropagation();
                  reloadSprite();
                }}
                className="absolute top-1 right-1 z-20 px-1 py-0.5 rounded bg-amber-950/90 border border-amber-600/60 text-[8px] font-mono text-amber-300 flex items-center space-x-0.5 cursor-pointer hover:bg-amber-900 transition-colors shadow"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reintentar</span>
              </button>
            )}

            <img
              src={activeImageSrc}
              alt={displayName}
              onError={() => {
                if (!isUsingFallback) {
                  reloadSprite();
                }
              }}
              className={`w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(56,189,248,0.7)] group-hover:scale-110 transition-transform duration-300 ${
                isSpriteLoading && !showAttachedImage ? 'opacity-30' : 'opacity-100'
              }`}
            />
          </div>

          {/* Level Pill */}
          {item.itemLevel && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-950/80 border border-amber-300 font-mono tracking-wider z-10">
              {item.itemLevel.startsWith('+') ? item.itemLevel : `+${item.itemLevel}`}
            </div>
          )}
        </div>

        {/* View mode toggle button if both attached image and official sprite exist */}
        {attachedImage && catalogSprite && attachedImage !== catalogSprite && (
          <div className="flex items-center space-x-1 mt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachedImage(true);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                showAttachedImage
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              📷 Foto/Captura
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachedImage(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                !showAttachedImage
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              🛡️ Sprite 3D
            </button>
          </div>
        )}

        {/* Slot Category & Rarity Subtitle */}
        <div className="mt-3 text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase text-center">
          {item.slotLabel || (isWeapon ? 'WEAPON (RIGHT)' : isArmor ? 'ARMOR SET' : 'ITEM')} · RAREZA{' '}
          <span className={`font-black ${rarityConfig.subtitleColor}`}>{rarityConfig.label}</span>
        </div>

        {/* Item Title with accurate Rarity Color & Tag */}
        <h4 className={`text-base sm:text-lg font-black text-center tracking-wide mt-1 ${rarityConfig.titleColor} ${rarityConfig.glow}`}>
          <span className={rarityConfig.tagColor}>
            {tag}{' '}
          </span>
          {displayName}{' '}
          {item.itemLevel
            ? item.itemLevel.startsWith('+')
              ? item.itemLevel
              : `+${item.itemLevel}`
            : ''}
        </h4>

        {/* View Original Scanned Screenshot Proof Button */}
        {screenshotSrc && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsScreenshotModalOpen(true);
            }}
            className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors cursor-pointer shadow-sm"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Ver captura original completa</span>
          </button>
        )}
      </div>

      {/* Screenshot Modal Viewer */}
      {isScreenshotModalOpen && screenshotSrc && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsScreenshotModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#090d1c] border border-cyan-500/50 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl relative cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center space-x-1.5 text-cyan-300">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Captura Oficial Escaneada de {item.itemName}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsScreenshotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-black/60 rounded-xl p-2 border border-slate-800">
              <img
                src={screenshotSrc}
                alt={`Captura ${item.itemName}`}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-mono">
              Comprobante de autenticidad escaneado en tiempo real.
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#232b4d] to-transparent" />

      {/* Combat Properties Box (Poder de Ataque / Defensa, Requisitos, Durabilidad) */}
      <div className="bg-[#0b1022] p-3 rounded-xl border border-[#1b223c] space-y-2 text-xs">
        {/* Weapon Attack */}
        {isWeapon && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Sword className="w-3.5 h-3.5 text-red-400" />
              <span>Poder de Ataque:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {item.stats?.damageMin || 74} ~ {item.stats?.damageMax || 85}
            </span>
          </div>
        )}

        {/* Armor Defense */}
        {isArmor && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Defensa:</span>
            </span>
            <span className="font-mono font-bold text-white">
              +{item.stats?.defense || 67}
            </span>
          </div>
        )}

        {/* Attack Speed (Only for Weapons) */}
        {isWeapon && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Velocidad de Ataque:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {item.stats?.attackSpeed || 45}
            </span>
          </div>
        )}

        {/* Durability */}
        <div className="pt-1.5 border-t border-[#1b223c]/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Durabilidad:</span>
            <span className="font-mono text-slate-200">
              {item.stats?.durability && item.stats?.maxDurability
                ? `[${item.stats.durability} / ${item.stats.maxDurability}]`
                : 'No detectada'}
            </span>
          </div>
          {item.stats?.durability && item.stats?.maxDurability ? (
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                style={{ width: `${Math.min(100, Math.round(item.stats.durability / item.stats.maxDurability * 100))}%` }}
              />
            </div>
          ) : null}
        </div>

        {/* Requirements (Strength / Agility) */}
        {(item.stats?.strengthReq || item.stats?.agilityReq) ? (
          <div className="pt-1.5 border-t border-[#1b223c]/80 space-y-1 text-[11px]">
            {item.stats?.strengthReq ? (
              <div className="flex items-center justify-between text-slate-400">
                <span>Strength Requirement:</span>
                <span className="font-mono font-bold text-amber-200">
                  {item.stats.strengthReq}
                </span>
              </div>
            ) : null}
            {item.stats?.agilityReq ? (
              <div className="flex items-center justify-between text-slate-400">
                <span>Agility Requirement:</span>
                <span className="font-mono font-bold text-amber-200">
                  {item.stats.agilityReq}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Class Compatibility Requirements */}
      {item.classesAllowed && item.classesAllowed.length > 0 && (
        <div className="bg-[#0b0e1a] border border-slate-800 p-2.5 rounded-xl space-y-1 text-[11px]">
          <div className="text-slate-400 font-semibold flex items-center space-x-1.5 mb-0.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Equipable por:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.classesAllowed.map((cl, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium border border-slate-700/60"
              >
                {cl}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Harmony Reinforcement & GearTech Optimization Blocks */}
      {(item.harmonyOption || item.gearTechOption) && (
        <div className="bg-[#120d1c] border border-purple-800/50 p-2.5 rounded-xl space-y-2 text-xs">
          {item.harmonyOption && (
            <div className="space-y-0.5">
              <div className="font-bold text-[10px] text-purple-300 uppercase tracking-wider font-mono flex items-center space-x-1">
                <Sun className="w-3 h-3 text-purple-400" />
                <span>Harmony Reinforcement:</span>
              </div>
              <p className="text-amber-300 text-[11px] font-semibold pl-4">
                {item.harmonyOption}
              </p>
            </div>
          )}

          {item.gearTechOption && (
            <div className="space-y-0.5 pt-1.5 border-t border-purple-900/40">
              <div className="font-bold text-[10px] text-cyan-300 uppercase tracking-wider font-mono flex items-center space-x-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>GearTech Optimization:</span>
              </div>
              <p className="text-cyan-200 text-[11px] font-semibold pl-4">
                {item.gearTechOption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Special Skill Badge */}
      {item.hasSkill && (
        <div className="bg-[#1a1409] border border-amber-600/40 text-amber-300 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Habilidad Especial de Arma (Skill)</span>
        </div>
      )}

      {/* Opción Luck & Additional Stat Box (Jewel of Life) */}
      {(item.hasLuck !== false || item.additionalStat || isExcellent || Boolean(item.itemLevel && parseInt(item.itemLevel.replace(/\D/g, ''), 10) >= 7)) && (
        <div className="bg-[#081525] border border-cyan-800/70 p-3 rounded-xl space-y-2 text-xs shadow-md">
          {/* Always display Luck if hasLuck is true or not explicitly disabled on upgraded/excellent items */}
          {item.hasLuck !== false && (
            <div className="space-y-1">
              <div className="font-bold text-[11px] text-cyan-300 uppercase tracking-wider font-mono flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>OPCIÓN LUCK</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700/60 font-semibold">
                  +25% / +5%
                </span>
              </div>
              <ul className="text-cyan-100 text-[11px] space-y-1 pl-1">
                <li className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">▪</span>
                  <span>Luck (success rate of Jewel of Soul +25%)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">▪</span>
                  <span>Luck (critical damage rate +5%)</span>
                </li>
              </ul>
            </div>
          )}

          {item.additionalStat && (
            <div className={`text-sky-300 font-semibold text-[11px] flex items-center space-x-1.5 ${item.hasLuck !== false ? 'pt-1.5 border-t border-cyan-900/60' : ''}`}>
              <span className="text-sky-400 font-bold">+</span>
              <span>{item.additionalStat}</span>
            </div>
          )}
        </div>
      )}

      {/* Opciones Excelentes Box */}
      {isExcellent && item.excellentOptions && item.excellentOptions.length > 0 && (
        <div className="bg-[#141006] border border-amber-500/40 p-2.5 rounded-xl space-y-1.5 text-xs">
          <div className="font-bold text-[11px] text-amber-400 uppercase tracking-wider flex items-center space-x-1 font-mono">
            <Gem className="w-3.5 h-3.5 text-amber-400" />
            <span>OPCIONES EXCELENTES:</span>
          </div>
          <ul className="text-amber-200 text-[11px] space-y-1">
            {item.excellentOptions.map((opt, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-amber-400 shrink-0">▪</span>
                <span className="leading-snug font-medium">{opt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Highlight: GEARSCORE Banner */}
      {item.gearScore !== undefined && item.gearScore > 0 && (
        <div className="bg-gradient-to-r from-fuchsia-950/40 via-purple-900/30 to-fuchsia-950/40 border border-fuchsia-500/40 rounded-xl p-2.5 text-center shadow-lg">
          <span className="font-mono text-xs font-black tracking-widest text-fuchsia-300 uppercase drop-shadow-[0_0_8px_rgba(217,70,239,0.7)] flex items-center justify-center space-x-2">
            <Award className="w-4 h-4 text-fuchsia-400" />
            <span>GEARSCORE: {item.gearScore}</span>
          </span>
        </div>
      )}
    </div>
  );
};
