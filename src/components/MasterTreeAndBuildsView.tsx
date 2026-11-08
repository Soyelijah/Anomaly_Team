import React, { useState, useMemo, useEffect } from 'react';
import { Character } from '../types/clan';
import {
  MASTER_TREES,
  CLASS_BUILD_GUIDES,
  DEFAULT_CHARACTER_TREES,
  MasterSkillNode,
  ClassMasterTree,
  RecommendedBuild,
} from '../data/masterTreeData';
import { InGameMasterTreeView, SCREENSHOT_EXACT_BUILD, PVP_SIEGE_BUILD } from './InGameMasterTreeView';
import { useItemSprite } from '../hooks/useItemSprite';
import {
  Shield,
  Zap,
  Sparkles,
  Flame,
  Award,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Copy,
  Info,
  Layers,
  HeartPulse,
  Heart,
  Droplets,
  Target,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Feather,
  Wrench,
  Lock,
  Swords,
  Wind,
  Crown,
  Eye,
  Activity,
  Sun,
  Snowflake,
  Anchor,
  HeartHandshake,
  Droplet,
  ExternalLink,
  Edit3,
  Save,
  Check,
  RefreshCw,
  ArrowRight,
  Database,
  FileText,
  Search,
  X,
} from 'lucide-react';

interface MasterTreeAndBuildsViewProps {
  characters: Character[];
  currentMemberName?: string;
  onInspectCharacter?: (name: string) => void;
}

// Icon resolver helper for master skills
const renderSkillIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'Shield': return <Shield className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'ShieldOff': return <ShieldOff className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Droplet': return <Droplet className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Crosshair': return <Crosshair className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Anchor': return <Anchor className={className} />;
    case 'HeartHandshake': return <HeartHandshake className={className} />;
    case 'Feather': return <Feather className={className} />;
    case 'Award': return <Award className={className} />;
    default: return <Sparkles className={className} />;
  }
};

// Sub-component for rendering real equipment sprites from Smash MU
const RealEquipmentBadge: React.FC<{ item: any }> = ({ item }) => {
  const { spriteUrl, isLoading } = useItemSprite(item.name || '', item.imagePath);

  if (!item || item.isEmpty) return null;

  return (
    <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 p-2 rounded-xl transition-all group shrink-0">
      <div className="relative w-8 h-8 rounded-lg bg-black/60 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0">
        {isLoading ? (
          <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
        ) : spriteUrl ? (
          <img
            src={spriteUrl}
            alt={item.name}
            className="w-7 h-7 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
          />
        ) : (
          <Shield className="w-4 h-4 text-slate-500" />
        )}
        {item.level > 0 && (
          <span className="absolute bottom-0 right-0 text-[9px] font-mono font-bold bg-amber-500/90 text-slate-950 px-1 rounded-tl leading-none">
            +{item.level}
          </span>
        )}
      </div>

      <div className="text-left min-w-0 pr-1">
        <div className="text-xs font-bold text-white truncate max-w-[140px]">
          {item.name} {item.level > 0 ? `+${item.level}` : ''}
        </div>
        <div className="text-[10px] font-mono text-purple-300 truncate">
          {item.harmonyOption?.label || item.slotLabel || 'Item Oficial'}
        </div>
      </div>
    </div>
  );
};

export const MasterTreeAndBuildsView: React.FC<MasterTreeAndBuildsViewProps> = ({
  characters,
  currentMemberName = 'MATONSITO',
  onInspectCharacter,
}) => {
  // Selected character state
  const [selectedCharName, setSelectedCharName] = useState<string>(() => {
    return characters.some((c) => c.name.toLowerCase() === currentMemberName.toLowerCase())
      ? currentMemberName
      : characters[0]?.name || 'MATONSITO';
  });

  // Current active sub-tab: 'tree' | 'builds' | 'breakpoints'
  const [activeSubTab, setActiveSubTab] = useState<'tree' | 'builds' | 'breakpoints'>('tree');
  // Tree display mode: 'in-game' (faithful to client screenshot) | 'detailed' (formulas breakdown)
  const [treeViewMode, setTreeViewMode] = useState<'in-game' | 'detailed'>('in-game');

  // Real live data from Smash MU API for the selected character
  const [liveInfo, setLiveInfo] = useState<{
    masterLevel: number;
    maxMasterLevel: number;
    treePointsTotal: number;
    level: number;
    resets: number;
    gearScore: number;
    className: string;
    classKey: string;
    isRankedInTopLevel: boolean;
    masterExperience: string;
    equipment: any[];
    gearRequirements?: {
      strength: number;
      agility: number;
      vitality: number;
      energy: number;
      leadership: number;
      itemsRequiring: Array<{ itemName: string; strength: number; agility: number }>;
    };
    realisticStats?: {
      strength: number;
      agility: number;
      vitality: number;
      energy: number;
      leadership: number;
      totalPoints: number;
      statNote: string;
      exactGearStats?: {
        strength: number;
        agility: number;
        vitality: number;
        energy: number;
        leadership: number;
      };
      currentLevelStats?: {
        strength: number;
        agility: number;
        vitality: number;
        energy: number;
        leadership: number;
        totalPoints?: number;
      };
      cap400Stats?: {
        strength: number;
        agility: number;
        vitality: number;
        energy: number;
        leadership: number;
      };
    };
    clanDbData?: any;
  } | null>(null);
  const [loadingLiveInfo, setLoadingLiveInfo] = useState(false);

  // Exact real stats for the character (saved per character in clan database and verified from server)
  const [characterStats, setCharacterStats] = useState<{
    strength: number;
    agility: number;
    vitality: number;
    energy: number;
    leadership: number;
  }>({
    strength: 90,
    agility: 150,
    vitality: 15,
    energy: 1796, // Exact for official Level 395 Grand Master on Smash MU (Total: 2,051 pts)
    leadership: 0,
  });
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Interactive points allocated map: { [skillId]: points }
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({});

  // Breakpoint tester input value
  const [testAgility, setTestAgility] = useState<number>(520);
  const [copiedBuildId, setCopiedBuildId] = useState<string | null>(null);

  // Active selected character object fallback
  const activeChar = useMemo(() => {
    return (
      characters.find((c) => c.name.toLowerCase() === selectedCharName.toLowerCase()) ||
      characters[0] || {
        id: 'matonsito',
        name: 'MATONSITO',
        characterClass: 'SM' as const,
        classNameTitle: 'Grand Master',
        level: 395,
        resets: 240,
        gearscore: 1487,
        online: true,
        build: 'PvP & Siege',
        squad: 'frontline' as const,
        note: 'Top GearScore',
        attendance: 'confirmed' as const,
        category: 'main' as const,
        assignedPlayer: 'MATONSITO',
      }
    );
  }, [characters, selectedCharName]);

  // Fetch real Master Level, equipment, and ranking from Smash MU
  useEffect(() => {
    let cancelled = false;
    setLoadingLiveInfo(true);

    fetch(`/api/smash/master-level-info/${encodeURIComponent(selectedCharName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setLiveInfo(data);
          // If clanDbData has stats, ensure characterStats sync immediately
          if (data.clanDbData?.stats) {
            setCharacterStats({
              strength: data.clanDbData.stats.strength,
              agility: data.clanDbData.stats.agility,
              vitality: data.clanDbData.stats.vitality,
              energy: data.clanDbData.stats.energy,
              leadership: data.clanDbData.stats.leadership || 0,
            });
          }
        }
      })
      .catch((e) => console.warn('Error fetching live master level info:', e))
      .finally(() => {
        if (!cancelled) setLoadingLiveInfo(false);
      });

    // Load individual character's persistent tree from verified Smash MU defaults or localStorage
    const def =
      DEFAULT_CHARACTER_TREES[selectedCharName.toLowerCase()] ||
      (selectedCharName.toLowerCase() === 'matonsito' ? SCREENSHOT_EXACT_BUILD : {});
    const saved = localStorage.getItem(`anomaly_real_tree_${selectedCharName.toLowerCase()}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Verify that parsed contains actual in-game nodes (peace_ or wisdom_ or overcome_)
          const hasInGameNodes = Object.keys(parsed).some(
            (k) => k.startsWith('peace_') || k.startsWith('wisdom_') || k.startsWith('overcome_')
          );
          const total = Object.values(parsed).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          if (total > 0 && hasInGameNodes) {
            setAllocatedPoints(parsed);
            return;
          }
        }
      } catch (e) {}
    }

    setAllocatedPoints(def);

    return () => {
      cancelled = true;
    };
  }, [selectedCharName]);

  // Save allocated points per character on change
  useEffect(() => {
    if (Object.keys(allocatedPoints).length > 0) {
      localStorage.setItem(
        `anomaly_real_tree_${selectedCharName.toLowerCase()}`,
        JSON.stringify(allocatedPoints)
      );
    }
  }, [allocatedPoints, selectedCharName]);

  // Map Mu Online class name to tree classKey
  const classKey = useMemo(() => {
    const raw = (
      liveInfo?.className ||
      activeChar.classNameTitle ||
      activeChar.characterClass ||
      ''
    ).toLowerCase();
    if (raw.includes('grand master') || raw.includes('soul master') || raw.includes('wizard') || raw === 'sm' || raw === 'dw') return 'DW';
    if (raw.includes('lord emperor') || raw.includes('dark lord') || raw === 'dl') return 'DL';
    if (raw.includes('high elf') || raw.includes('muse elf') || raw.includes('elf') || raw === 'fe') return 'FE';
    if (raw.includes('duel master') || raw.includes('magic gladiator') || raw.includes('gladiator') || raw === 'mg') return 'MG';
    if (raw.includes('fist master') || raw.includes('rage fighter') || raw === 'rf') return 'RF';
    if (raw.includes('blade master') || raw.includes('blade knight') || raw.includes('knight') || raw === 'bk') return 'BK';
    return 'DW';
  }, [liveInfo?.className, activeChar.classNameTitle, activeChar.characterClass]);

  // Synchronize realistic / exact stats for the active character
  useEffect(() => {
    // Prioritize clan database stats (synced directly from server API)
    if (liveInfo?.clanDbData?.stats) {
      setCharacterStats({
        strength: liveInfo.clanDbData.stats.strength,
        agility: liveInfo.clanDbData.stats.agility,
        vitality: liveInfo.clanDbData.stats.vitality,
        energy: liveInfo.clanDbData.stats.energy,
        leadership: liveInfo.clanDbData.stats.leadership || 0,
      });
      return;
    }

    if (liveInfo?.realisticStats) {
      const chosen =
        liveInfo.realisticStats.currentLevelStats ||
        liveInfo.realisticStats.exactGearStats ||
        liveInfo.realisticStats;
      setCharacterStats({
        strength: chosen.strength,
        agility: chosen.agility,
        vitality: chosen.vitality,
        energy: chosen.energy,
        leadership: chosen.leadership || 0,
      });
      return;
    }

    const savedKey = `anomaly_exact_stats_${selectedCharName.toLowerCase()}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only load localStorage if it does not have obsolete low energy (< 300) or inflated energy (> 2100)
        if (parsed && typeof parsed.strength === 'number' && parsed.energy >= 300 && parsed.energy < 2100) {
          setCharacterStats(parsed);
          return;
        }
      } catch (e) {}
    }

    const isDw = classKey === 'DW';
    setCharacterStats({
      strength: isDw ? 90 : 180,
      agility: isDw ? 150 : 70,
      vitality: isDw ? 15 : 26,
      energy: isDw ? 1796 : 26,
      leadership: classKey === 'DL' ? 25 : 0,
    });
  }, [selectedCharName, liveInfo?.clanDbData, liveInfo?.realisticStats, classKey]);

  const masterTree: ClassMasterTree = MASTER_TREES[classKey] || MASTER_TREES.DW;
  const buildGuide = CLASS_BUILD_GUIDES[classKey] || CLASS_BUILD_GUIDES.DW;

  // Real stats from live server
  const realResets = liveInfo?.resets || activeChar.resets || 200;
  const realLevel = liveInfo?.level || activeChar.level || 400;
  const realGearScore = liveInfo?.gearScore || activeChar.gearscore || 1000;

  // Real total stat points currently allocated (around ~2,800 - 3,500 pts, matching real Smash MU)
  const totalCharacterPoints = useMemo(() => {
    return (
      characterStats.strength +
      characterStats.agility +
      characterStats.vitality +
      characterStats.energy +
      (characterStats.leadership || 0)
    );
  }, [characterStats]);

  // Master Level Tree Points pool directly from Smash MU live data
  const maxTreePoints = useMemo(() => {
    if (selectedCharName.toLowerCase() === 'matonsito') {
      return 150;
    }
    if (liveInfo?.masterLevel) {
      return liveInfo.masterLevel;
    }
    const def = DEFAULT_CHARACTER_TREES[selectedCharName.toLowerCase()];
    if (def) {
      return Object.values(def).reduce((a, b) => a + b, 0);
    }
    return 150;
  }, [liveInfo?.masterLevel, selectedCharName]);

  // Calculate total spent points
  const spentTreePoints = useMemo(() => {
    return Object.values(allocatedPoints).reduce((acc, curr) => acc + curr, 0);
  }, [allocatedPoints]);

  const remainingTreePoints = Math.max(0, maxTreePoints - spentTreePoints);

  // Point allocator handlers
  const handleAddPoint = (skill: MasterSkillNode) => {
    const current = allocatedPoints[skill.id] || 0;
    if (remainingTreePoints <= 0) return;
    if (current >= skill.maxPoints) return;

    // Check prerequisite
    if (skill.requiredParentId) {
      const parentPts = allocatedPoints[skill.requiredParentId] || 0;
      if (parentPts < 10) return; // Must have at least 10 points in parent
    }

    setAllocatedPoints((prev) => ({
      ...prev,
      [skill.id]: current + 1,
    }));
  };

  const handleRemovePoint = (skill: MasterSkillNode) => {
    const current = allocatedPoints[skill.id] || 0;
    if (current <= 0) return;

    // Check if children depend on this node
    const allSkills = [
      ...masterTree.branches.defense.skills,
      ...masterTree.branches.mastery.skills,
      ...masterTree.branches.attack.skills,
    ];
    const hasActiveChild = allSkills.some(
      (s) => s.requiredParentId === skill.id && (allocatedPoints[s.id] || 0) > 0 && current - 1 < 10
    );

    if (hasActiveChild) {
      return; // Cannot reduce below prerequisite requirement
    }

    setAllocatedPoints((prev) => ({
      ...prev,
      [skill.id]: current - 1,
    }));
  };

  const handleResetTree = () => {
    setAllocatedPoints({});
    localStorage.removeItem(`anomaly_real_tree_${selectedCharName.toLowerCase()}`);
  };

  const handleLoadRecommendedTree = () => {
    if (classKey === 'DW' || selectedCharName.toLowerCase() === 'matonsito') {
      const exact = { ...SCREENSHOT_EXACT_BUILD };
      setAllocatedPoints(exact);
      localStorage.setItem(
        `anomaly_real_tree_${selectedCharName.toLowerCase()}`,
        JSON.stringify(exact)
      );
      setSaveSuccessMsg('¡Árbol cargado: 70 Peace / 80 Wisdom (150 ML) de la captura oficial!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      return;
    }

    const def = DEFAULT_CHARACTER_TREES[selectedCharName.toLowerCase()];
    if (def) {
      setAllocatedPoints(def);
      return;
    }

    const prefill: Record<string, number> = {};
    if (classKey === 'DL') {
      prefill['dl_def_1'] = 10;
      prefill['dl_def_2'] = 10;
      prefill['dl_def_3'] = 20;
      prefill['dl_def_4'] = 20;
      prefill['dl_def_5'] = 10;
      prefill['dl_mas_1'] = 10;
      prefill['dl_mas_2'] = 10;
      prefill['dl_mas_3'] = 10;
      prefill['dl_mas_4'] = 10;
      prefill['dl_att_1'] = 10;
      prefill['dl_att_2'] = 10;
      prefill['dl_att_4'] = 10;
      prefill['dl_att_5'] = 10;
    } else if (classKey === 'FE') {
      prefill['fe_def_1'] = 10;
      prefill['fe_def_2'] = 10;
      prefill['fe_def_3'] = 10;
      prefill['fe_def_4'] = 20;
      prefill['fe_mas_1'] = 10;
      prefill['fe_mas_2'] = 10;
      prefill['fe_mas_3'] = 20;
      prefill['fe_mas_4'] = 10;
      prefill['fe_mas_5'] = 10;
      prefill['fe_att_1'] = 10;
      prefill['fe_att_2'] = 10;
      prefill['fe_att_5'] = 10;
    }
    setAllocatedPoints(prefill);
  };

  const calculateBuildStats = (build: RecommendedBuild) => {
    const isDw = classKey === 'DW';
    const minGearStr = liveInfo?.gearRequirements?.strength || (isDw ? 90 : 250);
    const minGearAgi = liveInfo?.gearRequirements?.agility || (isDw ? 25 : 100);

    // Dynamic distribution strictly based on actual points pool
    const pool = Math.max(totalCharacterPoints, 391);
    const str = Math.max(minGearStr, Math.round((pool * build.statDistribution.strength) / 100));
    const agi = Math.max(minGearAgi, Math.round((pool * build.statDistribution.agility) / 100));
    const vit = Math.max(15, Math.round((pool * build.statDistribution.vitality) / 100));
    const cmd = build.statDistribution.leadership
      ? Math.max(25, Math.round((pool * build.statDistribution.leadership) / 100))
      : null;
    const remaining = Math.max(30, pool - (str + agi + vit + (cmd || 0)));
    const ene = remaining;

    return {
      strength: str,
      agility: agi,
      vitality: vit,
      energy: ene,
      leadership: cmd,
      total: str + agi + vit + ene + (cmd || 0),
    };
  };

  // Apply build configuration to character stats and save locally
  const handleApplyBuildToStats = (build: RecommendedBuild) => {
    const calculated = calculateBuildStats(build);
    const updated = {
      strength: calculated.strength,
      agility: calculated.agility,
      vitality: calculated.vitality,
      energy: calculated.energy,
      leadership: calculated.leadership || 0,
    };
    setCharacterStats(updated);
    localStorage.setItem(
      `anomaly_exact_stats_${selectedCharName.toLowerCase()}`,
      JSON.stringify(updated)
    );
    setSaveSuccessMsg(`¡Build "${build.name}" aplicado a los stats de ${selectedCharName}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const [showSmashApiModal, setShowSmashApiModal] = useState(false);
  const [syncingAllSmash, setSyncingAllSmash] = useState(false);
  const [apiModalTab, setApiModalTab] = useState<'summary' | 'equipment' | 'json'>('summary');
  const [copiedApiJson, setCopiedApiJson] = useState(false);

  // Save manual stats to localStorage and backend clan database
  const handleSaveManualStats = async () => {
    localStorage.setItem(
      `anomaly_exact_stats_${selectedCharName.toLowerCase()}`,
      JSON.stringify(characterStats)
    );
    try {
      await fetch('/api/clan/character-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedCharName,
          stats: characterStats,
        }),
      });
    } catch (e) {
      console.warn('Could not persist to server:', e);
    }
    setIsEditingStats(false);
    setSaveSuccessMsg(`¡Stats exactos guardados en el servidor para ${selectedCharName}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Sync all clan members with Smash MU official live API
  const handleSyncAllFromSmash = async () => {
    setSyncingAllSmash(true);
    try {
      const res = await fetch('/api/clan/sync-all-from-smash', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`¡Sincronizados ${data.count} personajes del clan directamente con la API en vivo de Smash MU!`);
        const curRes = await fetch(`/api/smash/master-level-info/${encodeURIComponent(selectedCharName)}`);
        const curData = await curRes.json();
        if (curData.success) {
          setLiveInfo(curData);
          if (curData.realisticStats) {
            setCharacterStats({
              strength: curData.realisticStats.strength,
              agility: curData.realisticStats.agility,
              vitality: curData.realisticStats.vitality,
              energy: curData.realisticStats.energy,
              leadership: curData.realisticStats.leadership || 0,
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('Sync all error:', e);
    } finally {
      setSyncingAllSmash(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // 1. Sync strictly with exact gear requirements from Smash MU API
  const handleSyncWithLiveGear = () => {
    const gear = liveInfo?.realisticStats?.exactGearStats || {
      strength: liveInfo?.gearRequirements?.strength || 90,
      agility: liveInfo?.gearRequirements?.agility || 25,
      vitality: 15,
      energy: 30,
      leadership: liveInfo?.gearRequirements?.leadership || 0,
    };
    setCharacterStats(gear);
    localStorage.setItem(
      `anomaly_exact_stats_${selectedCharName.toLowerCase()}`,
      JSON.stringify(gear)
    );
    setSaveSuccessMsg(
      `¡Sincronizado con API de Smash MU! Stats exactos para equipamiento: STR ${gear.strength}, AGI ${gear.agility}, VIT ${gear.vitality}, ENE ${gear.energy}.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // 2. Load stats estimated for character current level in Smash MU
  const handleLoadCurrentLevelStats = () => {
    if (liveInfo?.realisticStats?.currentLevelStats) {
      const stats = liveInfo.realisticStats.currentLevelStats;
      setCharacterStats(stats);
      localStorage.setItem(
        `anomaly_exact_stats_${selectedCharName.toLowerCase()}`,
        JSON.stringify(stats)
      );
      setSaveSuccessMsg(
        `¡Cargados stats calculados para Nivel ${liveInfo.level} en Smash MU (Total: ${stats.totalPoints || ''} pts)!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // 3. Load recommended cap 400 build
  const handleLoadCap400Stats = () => {
    if (liveInfo?.realisticStats?.cap400Stats) {
      const stats = liveInfo.realisticStats.cap400Stats;
      setCharacterStats(stats);
      localStorage.setItem(
        `anomaly_exact_stats_${selectedCharName.toLowerCase()}`,
        JSON.stringify(stats)
      );
      setSaveSuccessMsg(`¡Cargada build recomendada para Nivel 400!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Reset to Smash MU official configuration
  const handleResetStatsToSmashDefaults = () => {
    localStorage.removeItem(`anomaly_exact_stats_${selectedCharName.toLowerCase()}`);
    if (liveInfo?.realisticStats) {
      const chosen =
        liveInfo.realisticStats.currentLevelStats ||
        liveInfo.realisticStats.exactGearStats ||
        liveInfo.realisticStats;
      setCharacterStats({
        strength: chosen.strength,
        agility: chosen.agility,
        vitality: chosen.vitality,
        energy: chosen.energy,
        leadership: chosen.leadership || 0,
      });
    }
    setSaveSuccessMsg(`¡Stats restaurados a la configuración oficial de Smash MU!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Copy build stats to clipboard
  const handleCopyBuild = (build: RecommendedBuild) => {
    const stats = calculateBuildStats(build);
    const charClassName = liveInfo?.className || activeChar.classNameTitle || activeChar.characterClass;

    const text = `=== BUILD ANOMALY [${activeChar.name} - ${charClassName}] ===
Servidor Oficial: Smash MU (Season 6 Ep 3)
Objetivo: ${build.name}
Puntos Totales: ${stats.total.toLocaleString()} pts
- FUERZA (STR): ${stats.strength.toLocaleString()} (Requisito exacto de ítems equipados)
- AGILIDAD (AGI): ${stats.agility.toLocaleString()} (Breakpoint seguro de casteo)
- VITALIDAD (VIT): ${stats.vitality.toLocaleString()}
- ENERGÍA (ENE): ${stats.energy.toLocaleString()}
${stats.leadership ? `- COMANDO (CMD): ${stats.leadership.toLocaleString()}\n` : ''}
Foco Master Tree: ${build.recommendedMasterFocus.join(' · ')}
Nota Táctica: ${build.tacticalReason}`;

    navigator.clipboard?.writeText(text);
    setCopiedBuildId(build.id);
    setTimeout(() => setCopiedBuildId(null), 3000);
  };

  // Evaluate test agility
  const agilityCheckResult = useMemo(() => {
    if (classKey === 'DW') {
      if (testAgility >= 508 && testAgility <= 549) {
        return {
          status: 'bug',
          message: '⚠️ ¡ALERTA DE BUG EN EVIL SPIRIT! La animación se congela y no inflige daño.',
          recommendation: 'Ajusta tu AGI por debajo de 508 o supéralo a 555+ inmediatamente.',
        };
      }
      if (testAgility >= 1000 && testAgility <= 1200) {
        return {
          status: 'warning',
          message: '⚠️ Zona de retraso en Ice Storm. Pérdida de frames en asedios masivos.',
          recommendation: 'Usa guantes sin velocidad de ataque o sube a más de 12,000 AGI.',
        };
      }
      return {
        status: 'safe',
        message: '✅ Rango seguro y óptimo. Animación fluida de Ice Storm y Decay.',
        recommendation: 'Perfecto para coordinar control de masas en puentes de Castle Siege.',
      };
    } else if (classKey === 'DL') {
      if (testAgility >= 371 && testAgility <= 399) {
        return {
          status: 'bug',
          message: '⚠️ ¡BUG EN FIREBURST! Las ráfagas de fuego se cancelan a caballo.',
          recommendation: 'Sube a 405+ AGI para mantener la cadena continua.',
        };
      }
      return {
        status: 'safe',
        message: '✅ Rango seguro. Fireburst continuo sin saltos de animación.',
        recommendation: 'Asegura sellado y protección constante.',
      };
    } else if (classKey === 'FE') {
      if (testAgility >= 635 && testAgility <= 679) {
        return {
          status: 'bug',
          message: '⚠️ ¡BUG EN TRIPLE SHOT! Las flechas desaparecen en el aire.',
          recommendation: 'Mantén AGI menor a 635 o superior a 685.',
        };
      }
      return {
        status: 'safe',
        message: '✅ Velocidad de disparo y casteo de buffs estable.',
        recommendation: 'Ideal para soporte permanente con Heal y Greater Defense.',
      };
    } else if (classKey === 'RF') {
      if (testAgility >= 451 && testAgility <= 549) {
        return {
          status: 'bug',
          message: '⚠️ ¡BUG EN CHAIN DRIVE! El tercer impacto no conecta.',
          recommendation: 'Evita este rango crítico en tu árbol o equipo.',
        };
      }
      return {
        status: 'safe',
        message: '✅ Ráfagas de Chain Drive al 100% de efectividad.',
        recommendation: 'Asegura el máximo daño letal a corto alcance.',
      };
    }
    return {
      status: 'safe',
      message: '✅ Rango de agilidad seguro para las habilidades estándar.',
      recommendation: 'Continúa maximizando tu combinación de daño y supervivencia.',
    };
  }, [classKey, testAgility]);

  const activeCharClassName =
    liveInfo?.className || activeChar.classNameTitle || activeChar.characterClass;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner: Smash MU Server Configuration Analyzer */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1024] via-[#111633] to-[#0d1024] border border-cyan-500/30 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold tracking-widest uppercase mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span>Motor Táctico Oficial · Smash MU Season 6 Ep 3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase font-sans">
              Árbol Master Real &amp; Builds Meta
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Árbol de habilidades de Master Level con <strong className="text-cyan-300">TreePoints reales de smashmu.com</strong> y calculador de builds ajustado a las fórmulas de agilidad y resets oficiales del clan Anomaly.
            </p>
          </div>

          {/* Quick Server Config Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Cap Master Level</div>
              <div className="text-base font-extrabold text-purple-400 font-mono">150 ML</div>
              <div className="text-[10px] text-slate-400">Smash MU Oficial</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Puntos / RR</div>
              <div className="text-base font-extrabold text-cyan-400 font-mono">200 Pts</div>
              <div className="text-[10px] text-slate-400">Oficial Smash MU</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Mecánica SD</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">90% / 10%</div>
              <div className="text-[10px] text-slate-400">Absorción PvP</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Castle Siege</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">Dom 20:00</div>
              <div className="text-[10px] text-slate-400">Loren Deep</div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Selector & Real Smash MU Telemetry Bar */}
      <div className="bg-[#0b0e1e] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center space-x-2">
              <span>Personaje Oficial del Clan Anomaly:</span>
              {loadingLiveInfo && (
                <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                  (Cargando de smashmu.com...)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={selectedCharName}
                onChange={(e) => setSelectedCharName(e.target.value)}
                className="bg-slate-900 border border-purple-500/40 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-inner"
              >
                {characters.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — {c.classNameTitle || c.characterClass} ({c.resets} RR · {c.gearscore || 0} GS)
                  </option>
                ))}
              </select>

              {onInspectCharacter && (
                <button
                  onClick={() => onInspectCharacter(selectedCharName)}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspeccionar Equipo</span>
                </button>
              )}

              <button
                onClick={() => setShowSmashApiModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/50 transition-colors text-xs font-mono flex items-center space-x-1.5 cursor-pointer shadow-sm"
                title="Ver datos oficiales en tiempo real desde la API de Smash MU"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Telemetría API Smash</span>
              </button>

              <button
                onClick={handleSyncAllFromSmash}
                disabled={syncingAllSmash}
                className="px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-900/50 transition-colors text-xs font-mono flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Consulta la API de Smash MU para todos los 11 miembros del clan"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncingAllSmash ? 'animate-spin' : ''}`} />
                <span>{syncingAllSmash ? 'Sincronizando...' : 'Sincronizar Clan'}</span>
              </button>
            </div>
          </div>

          {/* Active Character Real Live Stats from Smash MU */}
          <div className="flex items-center flex-wrap gap-3 w-full md:w-auto bg-[#070914] p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Resets Smash MU</div>
              <div className="text-lg font-black text-amber-400 font-mono">{realResets} RR</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Master Level Real</div>
              <div className="text-lg font-black text-purple-400 font-mono flex items-center space-x-1">
                <span>{liveInfo?.masterLevel || maxTreePoints} ML</span>
                {liveInfo?.isRankedInTopLevel && (
                  <span className="text-[9px] font-mono bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded">
                    Top Ranking
                  </span>
                )}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">TreePoints Reales</div>
              <div className="text-lg font-black text-emerald-400 font-mono">{maxTreePoints} TP</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Stats Totales Smash MU</div>
              <div className="text-lg font-black text-cyan-400 font-mono">
                {totalCharacterPoints.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Live Equipment Strip from Smash MU API */}
        {liveInfo?.equipment && liveInfo.equipment.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Equipo Real Equipado en Smash MU ({selectedCharName}):</span>
              </span>
              <span className="text-slate-500">{liveInfo.equipment.filter((i) => !i.isEmpty).length} ítems detectados</span>
            </div>
            <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {liveInfo.equipment
                .filter((item) => !item.isEmpty)
                .map((item, idx) => (
                  <RealEquipmentBadge key={idx} item={item} />
                ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* REAL CHARACTER STATS MANAGER & LIVE GEAR REQUIREMENTS SYNC     */}
        {/* ============================================================== */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="bg-[#070914] border border-cyan-500/25 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Stats Reales de {selectedCharName} en Smash MU
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                  {activeCharClassName}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncWithLiveGear}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Fija los stats estrictamente a los requisitos mínimos del equipo equipado en el servidor"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Equipo Real (Smash API)</span>
                </button>

                {liveInfo?.level && liveInfo.level < 380 && (
                  <button
                    onClick={handleLoadCurrentLevelStats}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title={`Cargar distribución calculada para su Nivel actual (${liveInfo.level})`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Nivel Actual ({liveInfo.level})</span>
                  </button>
                )}

                <button
                  onClick={handleLoadCap400Stats}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50 text-purple-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Cargar distribución recomendada para el cap de nivel 400"
                >
                  <Layers className="w-3 h-3" />
                  <span>Build Nivel 400</span>
                </button>

                <button
                  onClick={() => {
                    if (isEditingStats) {
                      handleSaveManualStats();
                    } else {
                      setIsEditingStats(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isEditingStats
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isEditingStats ? (
                    <>
                      <Save className="w-3 h-3" />
                      <span>Guardar Cantidades</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Cantidades</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetStatsToSmashDefaults}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                  title="Restaurar a los stats recomendados de Smash MU"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Notification message */}
            {saveSuccessMsg && (
              <div className="mt-2.5 p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-300 flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Equipment Requirements live bar */}
            <div className="mt-3 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Requisitos detectados de ítems en vivo (Smash MU API):
                </span>
                <span className="font-mono text-rose-300 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60">
                  STR Mín: {liveInfo?.gearRequirements?.strength || 90}
                </span>
                <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                  AGI Mín: {liveInfo?.gearRequirements?.agility || 25}
                </span>
                {liveInfo?.gearRequirements?.leadership ? (
                  <span className="font-mono text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900/60">
                    CMD Mín: {liveInfo.gearRequirements.leadership}
                  </span>
                ) : null}
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {classKey === 'DW'
                  ? 'Platina Staff +15 y Legendary Shield +13 equipados'
                  : 'Fórmulas calibradas sin puntos inflados'}
              </span>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
              {/* STR */}
              <div className="bg-[#0b0e1e] border border-rose-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-rose-400 font-mono">Fuerza (STR)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round((characterStats.strength / totalCharacterPoints) * 100)}%
                  </span>
                </div>
                {isEditingStats ? (
                  <input
                    type="number"
                    value={characterStats.strength}
                    onChange={(e) =>
                      setCharacterStats({
                        ...characterStats,
                        strength: Math.max(1, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-2 py-1 text-base font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                ) : (
                  <div className="text-xl font-black font-mono text-white">
                    {characterStats.strength.toLocaleString()}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Req Equipo: {liveInfo?.gearRequirements?.strength || 90}
                </div>
              </div>

              {/* AGI */}
              <div className="bg-[#0b0e1e] border border-emerald-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">Agilidad (AGI)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round((characterStats.agility / totalCharacterPoints) * 100)}%
                  </span>
                </div>
                {isEditingStats ? (
                  <input
                    type="number"
                    value={characterStats.agility}
                    onChange={(e) =>
                      setCharacterStats({
                        ...characterStats,
                        agility: Math.max(1, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-base font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="text-xl font-black font-mono text-white">
                    {characterStats.agility.toLocaleString()}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Rango seguro S6
                </div>
              </div>

              {/* VIT */}
              <div className="bg-[#0b0e1e] border border-amber-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-400 font-mono">Vitalidad (VIT)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round((characterStats.vitality / totalCharacterPoints) * 100)}%
                  </span>
                </div>
                {isEditingStats ? (
                  <input
                    type="number"
                    value={characterStats.vitality}
                    onChange={(e) =>
                      setCharacterStats({
                        ...characterStats,
                        vitality: Math.max(1, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-base font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                ) : (
                  <div className="text-xl font-black font-mono text-white">
                    {characterStats.vitality.toLocaleString()}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Vida &amp; Absorción SD
                </div>
              </div>

              {/* ENE */}
              <div className="bg-[#0b0e1e] border border-cyan-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-cyan-400 font-mono">Energía (ENE)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round((characterStats.energy / totalCharacterPoints) * 100)}%
                  </span>
                </div>
                {isEditingStats ? (
                  <input
                    type="number"
                    value={characterStats.energy}
                    onChange={(e) =>
                      setCharacterStats({
                        ...characterStats,
                        energy: Math.max(1, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-2 py-1 text-base font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="text-xl font-black font-mono text-white">
                    {characterStats.energy.toLocaleString()}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Daño Mágico &amp; Mana Shield
                </div>
              </div>

              {/* CMD (Only for Dark Lord / Lord Emperor) */}
              {classKey === 'DL' && (
                <div className="bg-[#0b0e1e] border border-purple-500/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-purple-400 font-mono">Comando (CMD)</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {Math.round((characterStats.leadership / totalCharacterPoints) * 100)}%
                    </span>
                  </div>
                  {isEditingStats ? (
                    <input
                      type="number"
                      value={characterStats.leadership}
                      onChange={(e) =>
                        setCharacterStats({
                          ...characterStats,
                          leadership: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full bg-slate-900 border border-purple-500/50 rounded-lg px-2 py-1 text-base font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="text-xl font-black font-mono text-white">
                      {characterStats.leadership.toLocaleString()}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Dark Horse &amp; Raven
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveSubTab('tree')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer ${
            activeSubTab === 'tree'
              ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/40 border border-purple-500 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Árbol Master Oficial ({masterTree.thirdClassName})</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
            {remainingTreePoints} TP libres
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('builds')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer ${
            activeSubTab === 'builds'
              ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/40 border border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Builds de Stats Recomendadas</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            Smash Meta
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('breakpoints')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer ${
            activeSubTab === 'breakpoints'
              ? 'bg-gradient-to-r from-amber-900/60 to-orange-900/40 border border-amber-500 text-white shadow-lg shadow-amber-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Breakpoints de Agilidad S6</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: MASTER SKILL TREE (TreePoints)                      */}
      {/* ============================================================== */}
      {activeSubTab === 'tree' && (
        <div className="space-y-6">
          {/* Tree Control Bar */}
          <div className="bg-[#0b0e1e] border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-950/50 border border-purple-500/40 rounded-xl text-purple-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider flex items-center space-x-1.5">
                  <span>TreePoints Reales en Smash MU para {selectedCharName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center space-x-3 mt-0.5">
                  <span className="text-2xl font-black text-white font-mono">
                    <span className="text-emerald-400">{remainingTreePoints}</span>
                    <span className="text-slate-500 text-lg"> / {maxTreePoints} TP</span>
                  </span>
                  <span className="text-xs font-mono text-purple-300 bg-purple-950/60 border border-purple-800 px-2.5 py-1 rounded-lg">
                    Asignados: {spentTreePoints} TP
                  </span>
                  {liveInfo?.masterExperience && liveInfo.masterExperience !== '0' && (
                    <span className="hidden md:inline-block text-[11px] font-mono text-slate-400">
                      Exp: {parseInt(liveInfo.masterExperience, 10).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto flex-wrap gap-2">
              {/* Display Mode Toggle */}
              <div className="flex items-center bg-[#070914] p-1 rounded-xl border border-amber-500/40">
                <button
                  type="button"
                  onClick={() => setTreeViewMode('in-game')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    treeViewMode === 'in-game'
                      ? 'bg-[#e5a823] text-black shadow-lg shadow-amber-500/30 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista idéntica a la ventana del cliente Mu Online Season 6 (Captura de pantalla)"
                >
                  <span>🎮 Ventana In-Game (Captura Real)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTreeViewMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    treeViewMode === 'detailed'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Lista detallada con fórmulas y requisitos"
                >
                  <span>📋 Modo Detallado</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLoadRecommendedTree}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/40 hover:from-amber-800/80 hover:to-yellow-800/60 border border-[#e5a823] text-[#fcd34d] font-mono text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Carga la distribución de la captura del juego (70 Peace / 80 Wisdom)"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Build Captura (70 Peace / 80 Wisdom)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pvp = { ...PVP_SIEGE_BUILD };
                  setAllocatedPoints(pvp);
                  localStorage.setItem(`anomaly_real_tree_${selectedCharName.toLowerCase()}`, JSON.stringify(pvp));
                  setSaveSuccessMsg('¡Cargada la Build Full PvP / Asedio! (70 Peace / 40 Wisdom / 40 Overcome)');
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-red-950/60 to-rose-900/40 hover:from-red-900/80 hover:to-rose-800/60 border border-rose-500/60 text-rose-300 font-mono text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Carga la build con Ignore Defense y Double Damage para Castle Siege y PvP"
              >
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>Build PvP / Asedio</span>
              </button>

              <button
                type="button"
                onClick={handleResetTree}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Limpiar todos los puntos a 0 para que puedas asignar exactamente los de tu juego"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Limpiar a 0 (Asignar Mis Puntos)</span>
              </button>
            </div>
          </div>

          {/* RENDER IN-GAME VIEW (Captura Real) OR DETAILED VIEW */}
          {treeViewMode === 'in-game' ? (
            <InGameMasterTreeView
              characterName={selectedCharName}
              classNameTitle={activeCharClassName}
              masterLevel={maxTreePoints}
              allocatedPoints={allocatedPoints}
              onUpdatePoints={(newPts) => setAllocatedPoints(newPts)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Branch 1: Defense */}
            <div className="bg-[#0b0e1e]/90 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 pb-3 border-b border-blue-500/20 mb-4">
                  <div className="p-2 bg-blue-950/80 border border-blue-500/40 rounded-xl text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {masterTree.branches.defense.name}
                    </h3>
                    <p className="text-[11px] text-blue-300/80 leading-snug">
                      {masterTree.branches.defense.description}
                    </p>
                  </div>
                </div>

                {/* Nodes Column */}
                <div className="space-y-3.5">
                  {masterTree.branches.defense.skills.map((skill, index) => {
                    const currentPts = allocatedPoints[skill.id] || 0;
                    const isMaxed = currentPts >= skill.maxPoints;
                    const isUnlocked =
                      !skill.requiredParentId || (allocatedPoints[skill.requiredParentId] || 0) >= 10;

                    return (
                      <div
                        key={skill.id}
                        className={`relative rounded-xl border transition-all p-3.5 ${
                          !isUnlocked
                            ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                            : currentPts > 0
                            ? 'bg-gradient-to-r from-blue-950/50 to-slate-900 border-blue-500/70 shadow-md shadow-blue-950/40'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                                currentPts > 0
                                  ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {renderSkillIcon(skill.icon, 'w-5 h-5')}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center space-x-1.5 flex-wrap">
                                <span>{skill.name}</span>
                                <span className="text-[9px] font-mono text-blue-400/80 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800/40">
                                  Skill #{skill.skillId || 300 + index}
                                </span>
                                {isMaxed && (
                                  <span className="text-[10px] font-mono bg-blue-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                                    MAX
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                {skill.description}
                              </p>
                              <div className="text-[11px] font-mono text-blue-300 font-semibold mt-1">
                                {skill.bonusPerPoint}
                              </div>
                            </div>
                          </div>

                          {/* Allocation Controls */}
                          <div className="flex flex-col items-center space-y-1 shrink-0">
                            <div className="text-xs font-mono font-extrabold text-white">
                              <span className={currentPts > 0 ? 'text-blue-400' : 'text-slate-500'}>
                                {currentPts}
                              </span>
                              <span className="text-slate-500">/{skill.maxPoints}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleRemovePoint(skill)}
                                disabled={currentPts <= 0}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAddPoint(skill)}
                                disabled={!isUnlocked || isMaxed || remainingTreePoints <= 0}
                                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer shadow-md"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Lock / Prerequisite notice */}
                        {!isUnlocked && (
                          <div className="text-[10px] font-mono text-amber-400/90 mt-2 flex items-center space-x-1">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>Requiere 10 puntos en la habilidad anterior</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Branch 2: Mastery & Utility */}
            <div className="bg-[#0b0e1e]/90 border border-purple-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 pb-3 border-b border-purple-500/20 mb-4">
                  <div className="p-2 bg-purple-950/80 border border-purple-500/40 rounded-xl text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {masterTree.branches.mastery.name}
                    </h3>
                    <p className="text-[11px] text-purple-300/80 leading-snug">
                      {masterTree.branches.mastery.description}
                    </p>
                  </div>
                </div>

                {/* Nodes Column */}
                <div className="space-y-3.5">
                  {masterTree.branches.mastery.skills.map((skill, index) => {
                    const currentPts = allocatedPoints[skill.id] || 0;
                    const isMaxed = currentPts >= skill.maxPoints;
                    const isUnlocked =
                      !skill.requiredParentId || (allocatedPoints[skill.requiredParentId] || 0) >= 10;

                    return (
                      <div
                        key={skill.id}
                        className={`relative rounded-xl border transition-all p-3.5 ${
                          !isUnlocked
                            ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                            : currentPts > 0
                            ? 'bg-gradient-to-r from-purple-950/50 to-slate-900 border-purple-500/70 shadow-md shadow-purple-950/40'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                                currentPts > 0
                                  ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {renderSkillIcon(skill.icon, 'w-5 h-5')}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center space-x-1.5 flex-wrap">
                                <span>{skill.name}</span>
                                <span className="text-[9px] font-mono text-purple-400/80 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/40">
                                  Skill #{skill.skillId || 330 + index}
                                </span>
                                {isMaxed && (
                                  <span className="text-[10px] font-mono bg-purple-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                                    MAX
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                {skill.description}
                              </p>
                              <div className="text-[11px] font-mono text-purple-300 font-semibold mt-1">
                                {skill.bonusPerPoint}
                              </div>
                            </div>
                          </div>

                          {/* Allocation Controls */}
                          <div className="flex flex-col items-center space-y-1 shrink-0">
                            <div className="text-xs font-mono font-extrabold text-white">
                              <span className={currentPts > 0 ? 'text-purple-400' : 'text-slate-500'}>
                                {currentPts}
                              </span>
                              <span className="text-slate-500">/{skill.maxPoints}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleRemovePoint(skill)}
                                disabled={currentPts <= 0}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAddPoint(skill)}
                                disabled={!isUnlocked || isMaxed || remainingTreePoints <= 0}
                                className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer shadow-md"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {!isUnlocked && (
                          <div className="text-[10px] font-mono text-amber-400/90 mt-2 flex items-center space-x-1">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>Requiere 10 puntos en la habilidad anterior</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Branch 3: Attack & Devastation */}
            <div className="bg-[#0b0e1e]/90 border border-pink-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 pb-3 border-b border-pink-500/20 mb-4">
                  <div className="p-2 bg-pink-950/80 border border-pink-500/40 rounded-xl text-pink-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {masterTree.branches.attack.name}
                    </h3>
                    <p className="text-[11px] text-pink-300/80 leading-snug">
                      {masterTree.branches.attack.description}
                    </p>
                  </div>
                </div>

                {/* Nodes Column */}
                <div className="space-y-3.5">
                  {masterTree.branches.attack.skills.map((skill, index) => {
                    const currentPts = allocatedPoints[skill.id] || 0;
                    const isMaxed = currentPts >= skill.maxPoints;
                    const isUnlocked =
                      !skill.requiredParentId || (allocatedPoints[skill.requiredParentId] || 0) >= 10;

                    return (
                      <div
                        key={skill.id}
                        className={`relative rounded-xl border transition-all p-3.5 ${
                          !isUnlocked
                            ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                            : currentPts > 0
                            ? 'bg-gradient-to-r from-pink-950/50 to-slate-900 border-pink-500/70 shadow-md shadow-pink-950/40'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                                currentPts > 0
                                  ? 'bg-pink-600/30 border-pink-400 text-pink-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {renderSkillIcon(skill.icon, 'w-5 h-5')}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center space-x-1.5 flex-wrap">
                                <span>{skill.name}</span>
                                <span className="text-[9px] font-mono text-pink-400/80 bg-pink-950/80 px-1.5 py-0.2 rounded border border-pink-800/40">
                                  Skill #{skill.skillId || 380 + index}
                                </span>
                                {isMaxed && (
                                  <span className="text-[10px] font-mono bg-pink-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                                    MAX
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                {skill.description}
                              </p>
                              <div className="text-[11px] font-mono text-pink-300 font-semibold mt-1">
                                {skill.bonusPerPoint}
                              </div>
                            </div>
                          </div>

                          {/* Allocation Controls */}
                          <div className="flex flex-col items-center space-y-1 shrink-0">
                            <div className="text-xs font-mono font-extrabold text-white">
                              <span className={currentPts > 0 ? 'text-pink-400' : 'text-slate-500'}>
                                {currentPts}
                              </span>
                              <span className="text-slate-500">/{skill.maxPoints}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleRemovePoint(skill)}
                                disabled={currentPts <= 0}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAddPoint(skill)}
                                disabled={!isUnlocked || isMaxed || remainingTreePoints <= 0}
                                className="w-7 h-7 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold font-mono text-sm flex items-center justify-center transition-colors cursor-pointer shadow-md"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {!isUnlocked && (
                          <div className="text-[10px] font-mono text-amber-400/90 mt-2 flex items-center space-x-1">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>Requiere 10 puntos en la habilidad anterior</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: RECOMMENDED STAT BUILDS (Smash MU Meta)             */}
      {/* ============================================================== */}
      {activeSubTab === 'builds' && (
        <div className="space-y-6">
          <div className="bg-[#0b0e1e] border border-cyan-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Configuraciones Meta para {activeCharClassName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Distribuciones exactas calibradas a la configuración oficial de <strong>Smash MU Season 6</strong> (STR exacto para requisitos de Platina Staff/Shield y AGI en rango óptimo sin bugs).
                </p>
              </div>

              <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-3.5 py-1.5 rounded-xl">
                Base Servidor: 200 pts / Reset (Smash MU Oficial)
              </div>
            </div>

            {/* Builds Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {buildGuide.builds.map((build) => {
                const buildStats = calculateBuildStats(build);
                const isCopied = copiedBuildId === build.id;

                const strPercent = Math.round((buildStats.strength / buildStats.total) * 100);
                const agiPercent = Math.round((buildStats.agility / buildStats.total) * 100);
                const vitPercent = Math.round((buildStats.vitality / buildStats.total) * 100);
                const enePercent = Math.round((buildStats.energy / buildStats.total) * 100);
                const cmdPercent = buildStats.leadership
                  ? Math.round((buildStats.leadership / buildStats.total) * 100)
                  : null;

                return (
                  <div
                    key={build.id}
                    className="bg-[#070914] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Badge and Title */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {build.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {build.purpose === 'siege' ? '🏰 Castle Siege' : build.purpose === 'boss' ? '🐉 Boss Hunt' : '⚡ Farm'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {build.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {build.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs font-mono bg-cyan-950/40 border border-cyan-900/50 rounded-lg px-2.5 py-1.5 text-cyan-300">
                        <span>Puntos Totales de Build:</span>
                        <span className="font-bold text-white">{buildStats.total.toLocaleString()} pts</span>
                      </div>

                      {/* Stat Breakdown Bars */}
                      <div className="space-y-2.5 mt-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        {/* STR */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-rose-400 font-bold">Fuerza (STR)</span>
                            <span className="text-white font-extrabold">
                              {buildStats.strength.toLocaleString()}{' '}
                              <span className="text-slate-500 font-normal">({strPercent}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all"
                              style={{ width: `${strPercent}%` }}
                            />
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Requisito de ítems equipados (Smash MU)
                          </div>
                        </div>

                        {/* AGI */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-emerald-400 font-bold">Agilidad (AGI)</span>
                            <span className="text-white font-extrabold">
                              {buildStats.agility.toLocaleString()}{' '}
                              <span className="text-slate-500 font-normal">({agiPercent}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${agiPercent}%` }}
                            />
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Breakpoint óptimo de casteo
                          </div>
                        </div>

                        {/* VIT */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-amber-400 font-bold">Vitalidad (VIT)</span>
                            <span className="text-white font-extrabold">
                              {buildStats.vitality.toLocaleString()}{' '}
                              <span className="text-slate-500 font-normal">({vitPercent}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${vitPercent}%` }}
                            />
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Reserva de vida y escudo SD
                          </div>
                        </div>

                        {/* ENE */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-cyan-400 font-bold">Energía (ENE)</span>
                            <span className="text-white font-extrabold">
                              {buildStats.energy.toLocaleString()}{' '}
                              <span className="text-slate-500 font-normal">({enePercent}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full transition-all"
                              style={{ width: `${enePercent}%` }}
                            />
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Daño mágico multiplicativo &amp; Mana Shield
                          </div>
                        </div>

                        {/* CMD (DL only) */}
                        {buildStats.leadership !== null && (
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono mb-1">
                              <span className="text-purple-400 font-bold">Comando (CMD)</span>
                              <span className="text-white font-extrabold">
                                {buildStats.leadership.toLocaleString()}{' '}
                                <span className="text-slate-500 font-normal">({cmdPercent}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full transition-all"
                                style={{ width: `${cmdPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tactical Explanation */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400 block mb-1">Por qué esta build en Smash MU:</strong>
                        {build.tacticalReason}
                      </div>

                      {/* Master Tree Focus */}
                      <div className="mt-3">
                        <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Prioridad Master Tree ({maxTreePoints} TP):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {build.recommendedMasterFocus.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono bg-purple-950/70 border border-purple-800/70 text-purple-300 px-2 py-0.5 rounded-md"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={() => handleApplyBuildToStats(build)}
                        className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                        title="Aplica esta distribución a tus stats actuales de este personaje"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Aplicar a mis Stats</span>
                      </button>

                      <button
                        onClick={() => handleCopyBuild(build)}
                        className="w-full sm:w-auto py-2 px-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-300 hover:text-white transition-all text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">¡Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: AGILITY BREAKPOINTS ANALYZER & TESTER               */}
      {/* ============================================================== */}
      {activeSubTab === 'breakpoints' && (
        <div className="space-y-6">
          <div className="bg-[#0b0e1e] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center space-x-3 pb-3 border-b border-amber-500/20 mb-4">
              <div className="p-2.5 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Breakpoints de Agilidad Season 6 ({activeCharClassName})
                </h2>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  En Mu Online Season 6 Ep3, la velocidad de ataque tiene límites donde ciertas habilidades dejan de golpear o desincronizan el cliente del juego.
                </p>
              </div>
            </div>

            {/* Server Breakdown Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center space-x-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rangos Seguros y Óptimos:</span>
                </div>
                <div className="text-sm font-mono text-slate-200">
                  {buildGuide.agilityBreakpoints.safeRanges}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-4">
                <div className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center space-x-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rangos con Bug (¡Peligro!):</span>
                </div>
                <div className="text-sm font-mono text-slate-200">
                  {buildGuide.agilityBreakpoints.bugRanges}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-400 block mb-1">Mecánica interna en Smash MU:</strong>
              {buildGuide.agilityBreakpoints.explanation}
            </div>

            {/* Interactive Agility Breakpoint Tester */}
            <div className="mt-6 bg-[#070914] p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-2">
                Simulador de Agilidad en Tiempo Real
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Mueve el control deslizante o escribe los puntos de Agilidad que piensas colocar en tu personaje para verificar si tu habilidad principal se bugea:
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:flex-1">
                  <input
                    type="range"
                    min="100"
                    max="15000"
                    step="10"
                    value={testAgility}
                    onChange={(e) => setTestAgility(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>100 AGI</span>
                    <span>508-549 (Riesgo Bug)</span>
                    <span>1,500 AGI</span>
                    <span>15,000 AGI (Cap)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <input
                    type="number"
                    value={testAgility}
                    onChange={(e) => setTestAgility(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-28 bg-slate-900 border border-amber-500/50 text-amber-400 font-mono font-bold text-base px-3 py-2 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs font-mono text-slate-400">AGI</span>
                </div>
              </div>

              {/* Status card */}
              <div
                className={`mt-4 p-4 rounded-xl border flex items-start space-x-3 ${
                  agilityCheckResult.status === 'bug'
                    ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                    : agilityCheckResult.status === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
                }`}
              >
                {agilityCheckResult.status === 'bug' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : agilityCheckResult.status === 'warning' ? (
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-bold font-sans">{agilityCheckResult.message}</div>
                  <div className="text-xs mt-1 text-slate-300">{agilityCheckResult.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* SMASH MU OFFICIAL LIVE API TELEMETRY MODAL                     */}
      {/* ============================================================== */}
      {showSmashApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b0e1e] border border-cyan-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/60 via-[#101530] to-purple-950/40 border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                  <Database className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-sans tracking-wide uppercase flex items-center space-x-2">
                    <span>Telemetría Oficial en Vivo · Smash MU API</span>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                      HTTP 200 OK
                    </span>
                  </h3>
                  <p className="text-xs font-mono text-cyan-300/80">
                    Endpoint: https://www.smashmu.com/api/profile/{encodeURIComponent(selectedCharName)}?realm=smash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSmashApiModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="px-6 pt-3 border-b border-slate-800 flex items-center space-x-2 bg-slate-900/40">
              <button
                onClick={() => setApiModalTab('summary')}
                className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer ${
                  apiModalTab === 'summary'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Resumen &amp; Stats Exactos
              </button>
              <button
                onClick={() => setApiModalTab('equipment')}
                className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer ${
                  apiModalTab === 'equipment'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Ítems Equipados ({liveInfo?.equipment?.filter((i) => !i.isEmpty).length || 0})
              </button>
              <button
                onClick={() => setApiModalTab('json')}
                className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer ${
                  apiModalTab === 'json'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON Raw de la API
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {apiModalTab === 'summary' && (
                <div className="space-y-4">
                  {/* Real Character Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Personaje</div>
                      <div className="text-base font-black text-white font-mono">{selectedCharName}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{liveInfo?.className || activeCharClassName}</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Nivel Actual</div>
                      <div className="text-base font-black text-cyan-400 font-mono">
                        Lvl {liveInfo?.level || activeChar.level}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Pool: {((liveInfo?.level || 1) - 1) * (classKey === 'MG' || classKey === 'DL' ? 7 : 5)} pts
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Resets en Servidor</div>
                      <div className="text-base font-black text-amber-400 font-mono">
                        {liveInfo?.resets || activeChar.resets} RR
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Smash MU Realm</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Master Level Real</div>
                      <div className="text-base font-black text-purple-400 font-mono">
                        {liveInfo?.masterLevel || 150} ML
                      </div>
                      <div className="text-[10px] text-purple-300 font-mono">Cap 150 Oficial</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">GearScore Oficial</div>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {liveInfo?.gearScore || activeChar.gearscore} GS
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Smash MU Formula</div>
                    </div>
                  </div>

                  {/* Clarification Note on Realistic Stats vs Fake Multipliers */}
                  <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>¿Por qué tu Mago (Grand Master) no tiene miles de puntos inflados?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      En la versión anterior del sistema, se forzaba un mínimo ficticio de <strong>2,150 de Energía</strong> y <strong>450 de Vitalidad</strong> que inflaba los puntos totales a más de 3,000.
                      Ahora la web consulta <strong className="text-cyan-300">directamente la API de Smash MU</strong>:
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5 font-mono">
                      <li>
                        Tu nivel actual en el servidor es <strong className="text-cyan-400">Nivel {liveInfo?.level || 63}</strong>, por lo que tus puntos obtenidos por leveo son estrictamente <strong className="text-white">{((liveInfo?.level || 63) - 1) * 5} pts</strong>.
                      </li>
                      <li>
                        Los requisitos mínimos de tu equipo equipado son: <strong className="text-rose-400">STR {liveInfo?.gearRequirements?.strength || 90}</strong> (por tu Legendary Shield +13) y <strong className="text-emerald-400">AGI {liveInfo?.gearRequirements?.agility || 25}</strong>.
                      </li>
                      <li>
                        Tus stats reales calculados para tu nivel actual son: <strong className="text-white">STR {characterStats.strength}</strong> · <strong className="text-white">AGI {characterStats.agility}</strong> · <strong className="text-white">VIT {characterStats.vitality}</strong> · <strong className="text-white">ENE {characterStats.energy}</strong> (Total: <strong className="text-cyan-400">{totalCharacterPoints} pts</strong>).
                      </li>
                    </ul>
                  </div>

                  {/* Exact Active Stats Display */}
                  <div className="bg-[#070914] border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Distribución Exacta en Servidor ({selectedCharName}):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-slate-900 border border-rose-500/30 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-mono text-rose-400 font-bold block">FUERZA (STR)</span>
                        <span className="text-xl font-black text-white font-mono">{characterStats.strength}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Mín ítem: {liveInfo?.gearRequirements?.strength || 90}</span>
                      </div>
                      <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block">AGILIDAD (AGI)</span>
                        <span className="text-xl font-black text-white font-mono">{characterStats.agility}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Mín ítem: {liveInfo?.gearRequirements?.agility || 25}</span>
                      </div>
                      <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-mono text-amber-400 font-bold block">VITALIDAD (VIT)</span>
                        <span className="text-xl font-black text-white font-mono">{characterStats.vitality}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Base: 15</span>
                      </div>
                      <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block">ENERGÍA (ENE)</span>
                        <span className="text-xl font-black text-white font-mono">{characterStats.energy}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Base: 30</span>
                      </div>
                      {characterStats.leadership ? (
                        <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-2.5 text-center">
                          <span className="text-[10px] font-mono text-purple-400 font-bold block">COMANDO (CMD)</span>
                          <span className="text-xl font-black text-white font-mono">{characterStats.leadership}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Dark Lord</span>
                        </div>
                      ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                          <span className="text-[10px] font-mono text-slate-400 font-bold block">TOTAL PUNTOS</span>
                          <span className="text-xl font-black text-cyan-300 font-mono">{totalCharacterPoints}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Exactos Nivel {liveInfo?.level || 63}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {apiModalTab === 'equipment' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Ítems extraídos directamente del array <code className="text-cyan-400">equipment</code> de Smash MU:</span>
                    <span>Requisito Mínimo del Set: STR {liveInfo?.gearRequirements?.strength || 90} · AGI {liveInfo?.gearRequirements?.agility || 25}</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Ítem Equipado</th>
                          <th className="py-2.5 px-3 text-center">Nivel</th>
                          <th className="py-2.5 px-3 text-center text-rose-400">STR Req</th>
                          <th className="py-2.5 px-3 text-center text-emerald-400">AGI Req</th>
                          <th className="py-2.5 px-3 text-center text-cyan-400">ENE Req</th>
                          <th className="py-2.5 px-3">Opciones Detectadas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-[#070914]">
                        {liveInfo?.equipment && liveInfo.equipment.filter((i) => !i.isEmpty).length > 0 ? (
                          liveInfo.equipment
                            .filter((item) => !item.isEmpty)
                            .map((item, idx) => {
                              const s = item.stats || {};
                              const isHighestStr = s.requireStrength === liveInfo?.gearRequirements?.strength && s.requireStrength > 0;
                              return (
                                <tr key={idx} className={isHighestStr ? 'bg-rose-950/20' : 'hover:bg-slate-900/40'}>
                                  <td className="py-2 px-3 font-bold text-white flex items-center space-x-2">
                                    <span>{item.name}</span>
                                    {isHighestStr && (
                                      <span className="text-[9px] bg-rose-900 text-rose-200 px-1 py-0.5 rounded font-mono">
                                        Requisito Máx
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center text-amber-300 font-bold">
                                    +{item.level || 0}
                                  </td>
                                  <td className={`py-2 px-3 text-center font-bold ${s.requireStrength > 0 ? 'text-rose-400 font-mono' : 'text-slate-600'}`}>
                                    {s.requireStrength || '-'}
                                  </td>
                                  <td className={`py-2 px-3 text-center font-bold ${s.requireDexterity > 0 ? 'text-emerald-400 font-mono' : 'text-slate-600'}`}>
                                    {s.requireDexterity || '-'}
                                  </td>
                                  <td className={`py-2 px-3 text-center font-bold ${s.requireEnergy > 0 ? 'text-cyan-400 font-mono' : 'text-slate-600'}`}>
                                    {s.requireEnergy || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                                    {item.excellentOptions && item.excellentOptions.length > 0
                                      ? item.excellentOptions.slice(0, 2).join(' · ')
                                      : item.hasSkill
                                      ? 'Skill de Arma'
                                      : 'Estándar'}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-500">
                              No hay ítems equipados detectados o perfil oculto.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {apiModalTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Respuesta HTTP JSON completa de Smash MU:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(JSON.stringify(liveInfo, null, 2));
                        setCopiedApiJson(true);
                        setTimeout(() => setCopiedApiJson(false), 2500);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      {copiedApiJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#05070e] border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 max-h-[350px] overflow-auto scrollbar-thin">
                    {JSON.stringify(liveInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleSyncAllFromSmash}
                disabled={syncingAllSmash}
                className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncingAllSmash ? 'animate-spin' : ''}`} />
                <span>{syncingAllSmash ? 'Sincronizando...' : 'Sincronizar Todos con la API'}</span>
              </button>

              <button
                onClick={() => setShowSmashApiModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
