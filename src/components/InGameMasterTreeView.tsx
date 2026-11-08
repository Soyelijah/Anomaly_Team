import React, { useState, useMemo } from 'react';
import {
  Shield,
  Zap,
  Sparkles,
  Flame,
  Target,
  Crosshair,
  Lock,
  Swords,
  Snowflake,
  RotateCcw,
  Check,
  Save,
  Info,
  Maximize2,
  Copy,
  Layers,
  Heart,
  Droplets,
  Wrench,
  HelpCircle,
  Eye,
  ChevronDown,
} from 'lucide-react';

export interface InGameSkillNode {
  id: string;
  name: string;
  branch: 'peace' | 'wisdom' | 'overcome';
  col: number; // 1 to 4
  row: number; // 1 to 9
  maxPoints: number;
  iconType: string;
  colorTheme: 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'cyan' | 'gray';
  description: string;
  bonusFormula: string;
  arrowDownToRow?: number;
  arrowRightToCol?: number;
  requiredParentId?: string;
}

// ---------------------------------------------------------------------
// Grand Master Season 6 Official Tree Nodes (Pixel-matched with in-game)
// ---------------------------------------------------------------------
export const GM_TREE_NODES: InGameSkillNode[] = [
  // ==================== BRANCH 1: PEACE ====================
  // Column 1
  {
    id: 'peace_weapon_mastery',
    name: 'Maestría de Armas Mágicas',
    branch: 'peace',
    col: 1,
    row: 1,
    maxPoints: 10,
    iconType: 'sword_purple',
    colorTheme: 'purple',
    description: 'Incrementa la durabilidad de báculos y varitas de hechicero.',
    bonusFormula: '+10% Resistencia a daño de báculo',
    arrowDownToRow: 3,
  },
  {
    id: 'peace_ring_durability',
    name: 'Durabilidad de Joyería & Anillos',
    branch: 'peace',
    col: 1,
    row: 3,
    maxPoints: 10,
    iconType: 'ring',
    colorTheme: 'gray',
    description: 'Reduce el desgaste de anillos y colgantes mágicos.',
    bonusFormula: '-30% Pérdida de durabilidad en accesorios',
    arrowDownToRow: 5,
    requiredParentId: 'peace_weapon_mastery',
  },
  {
    id: 'peace_poison_resistance',
    name: 'Resistencia a Veneno / Iron Skin',
    branch: 'peace',
    col: 1,
    row: 5,
    maxPoints: 10,
    iconType: 'shield_fire',
    colorTheme: 'gray',
    description: 'Mitiga el daño por segundo de hechizos de envenenamiento.',
    bonusFormula: '+20% Resistencia a Poison / Decay',
  },
  {
    id: 'peace_cross_resistance',
    name: 'Resistencia Elemental Divina',
    branch: 'peace',
    col: 1,
    row: 7,
    maxPoints: 10,
    iconType: 'cross',
    colorTheme: 'gray',
    description: 'Aumenta la absorción elemental general.',
    bonusFormula: '+15% Resistencia elemental',
  },
  {
    id: 'peace_wing_defense_1',
    name: 'Defensa de Alas Nivel 3 (Tier 1)',
    branch: 'peace',
    col: 1,
    row: 8,
    maxPoints: 10,
    iconType: 'wing_up',
    colorTheme: 'gray',
    description: 'Incrementa la defensa pasiva otorgada por Wings of Space-Time.',
    bonusFormula: '+30 Defensa de Alas Nivel 3',
    arrowDownToRow: 9,
  },
  {
    id: 'peace_wing_defense_2',
    name: 'Refuerzo de Alas Nivel 3 (Tier 2)',
    branch: 'peace',
    col: 1,
    row: 9,
    maxPoints: 10,
    iconType: 'wing_down',
    colorTheme: 'gray',
    description: 'Eleva la absorción porcentual de daño de las alas.',
    bonusFormula: '+5% Absorción de daño de Alas',
    requiredParentId: 'peace_wing_defense_1',
  },

  // Column 2
  {
    id: 'peace_armor_durability',
    name: 'Durabilidad de Armaduras (Sets)',
    branch: 'peace',
    col: 2,
    row: 2,
    maxPoints: 10,
    iconType: 'lightning_green',
    colorTheme: 'green',
    description: 'Reduce la pérdida de durabilidad de armaduras Sphinx, Legendary y Grand Soul.',
    bonusFormula: '-50% Pérdida de durabilidad del set',
    arrowDownToRow: 3,
  },
  {
    id: 'peace_defense_increase',
    name: 'Incremento de Defensa Base',
    branch: 'peace',
    col: 2,
    row: 3,
    maxPoints: 10,
    iconType: 'arch_keyhole_green',
    colorTheme: 'green',
    description: 'Otorga defensa pura para mitigar daño de monstruos y jugadores.',
    bonusFormula: '+100 Defensa básica total',
    arrowDownToRow: 4,
    requiredParentId: 'peace_armor_durability',
  },
  {
    id: 'peace_shield_defense',
    name: 'Defensa de Escudo Arcano',
    branch: 'peace',
    col: 2,
    row: 4,
    maxPoints: 10,
    iconType: 'shield_num1_green',
    colorTheme: 'green',
    description: 'Multiplica la defensa del escudo equipado (Legendary Shield +13/+15).',
    bonusFormula: '+60 Defensa de Escudo equipado',
    arrowDownToRow: 5,
    requiredParentId: 'peace_defense_increase',
  },
  {
    id: 'peace_shield_block',
    name: 'Bloqueo Absoluto de Escudo',
    branch: 'peace',
    col: 2,
    row: 5,
    maxPoints: 10,
    iconType: 'shield_broken',
    colorTheme: 'gray',
    description: 'Probabilidad de desviar por completo un ataque entrante.',
    bonusFormula: '+5% Bloqueo con escudo',
    requiredParentId: 'peace_shield_defense',
  },

  // Column 3
  {
    id: 'peace_two_swords',
    name: 'Equilibrio de Bastón y Escudo',
    branch: 'peace',
    col: 3,
    row: 2,
    maxPoints: 10,
    iconType: 'crossed_swords',
    colorTheme: 'gray',
    description: 'Mejora la estabilidad de agarre y reduce penalización de peso.',
    bonusFormula: '+10 Tasa de defensa',
  },
  {
    id: 'peace_helm_defense',
    name: 'Defensa de Casco / Máscara',
    branch: 'peace',
    col: 3,
    row: 3,
    maxPoints: 10,
    iconType: 'helm',
    colorTheme: 'gray',
    description: 'Incrementa la defensa del casco equipado.',
    bonusFormula: '+25 Defensa de casco',
  },
  {
    id: 'peace_pants_defense',
    name: 'Defensa de Pantalones & Botas',
    branch: 'peace',
    col: 3,
    row: 4,
    maxPoints: 10,
    iconType: 'gem_shield',
    colorTheme: 'gray',
    description: 'Aumenta la armadura de las extremidades inferiores.',
    bonusFormula: '+30 Defensa de botas y pantalones',
  },
  {
    id: 'peace_iron_defense',
    name: 'Iron Defense (Bastión de Asedio)',
    branch: 'peace',
    col: 3,
    row: 6,
    maxPoints: 10,
    iconType: 'knight_shield',
    colorTheme: 'gray',
    description: 'Postura inamovible que otorga absorción masiva en Castle Siege.',
    bonusFormula: '+50% Absorción de daño total (modo asedio)',
    arrowRightToCol: 4,
  },
  {
    id: 'peace_set_harmony',
    name: 'Defensa de Set Completo',
    branch: 'peace',
    col: 3,
    row: 7,
    maxPoints: 10,
    iconType: 'armor_suit',
    colorTheme: 'gray',
    description: 'Bono multiplicativo de armadura al usar las 5 piezas del mismo set.',
    bonusFormula: '+15% Defensa por Set Completo',
  },
  {
    id: 'peace_wings_absorb',
    name: 'Alas Cósmicas: Absorción',
    branch: 'peace',
    col: 3,
    row: 8,
    maxPoints: 10,
    iconType: 'wings_solo',
    colorTheme: 'gray',
    description: 'Aumenta la mitigación pasiva contra ataques críticos.',
    bonusFormula: '+8% Mitigación crítica',
  },

  // Column 4
  {
    id: 'peace_strength_increase',
    name: 'Incremento de Fuerza (STR Base)',
    branch: 'peace',
    col: 4,
    row: 1,
    maxPoints: 10,
    iconType: 'bicep_green',
    colorTheme: 'green',
    description: 'Otorga puntos pasivos de Fuerza para cumplir requisitos de equipo sin gastar stats.',
    bonusFormula: '+30 Fuerza gratuita para requisitos de equipo',
    arrowDownToRow: 2,
  },
  {
    id: 'peace_hp_recovery',
    name: 'Recuperación de Vida al Eliminar Monstruo',
    branch: 'peace',
    col: 4,
    row: 2,
    maxPoints: 10,
    iconType: 'skull_green',
    colorTheme: 'green',
    description: 'Restaura vida instantáneamente tras abatir a cualquier enemigo.',
    bonusFormula: '+5% HP máximo restaurado por muerte',
    arrowDownToRow: 3,
    requiredParentId: 'peace_strength_increase',
  },
  {
    id: 'peace_mana_recovery',
    name: 'Recuperación de Maná al Eliminar Monstruo',
    branch: 'peace',
    col: 4,
    row: 3,
    maxPoints: 10,
    iconType: 'lightning_mana_green',
    colorTheme: 'green',
    description: 'Restaura maná tras cada baja, permitiendo farmear Evil Spirit sin pociones.',
    bonusFormula: '+5% Maná máximo restaurado por muerte',
    arrowDownToRow: 4,
    requiredParentId: 'peace_hp_recovery',
  },
  {
    id: 'peace_sd_recovery',
    name: 'Recuperación de SD al Eliminar Enemigo',
    branch: 'peace',
    col: 4,
    row: 4,
    maxPoints: 10,
    iconType: 'crystal_green',
    colorTheme: 'green',
    description: 'Restaura Shield Gauge (SD) por baja, vital para aguantar oleadas PvP.',
    bonusFormula: '+5% SD máximo restaurado por baja',
    requiredParentId: 'peace_mana_recovery',
  },
  {
    id: 'peace_max_hp_increase',
    name: 'Incremento de Vida Máxima',
    branch: 'peace',
    col: 4,
    row: 7,
    maxPoints: 10,
    iconType: 'warrior_stand',
    colorTheme: 'gray',
    description: 'Aumenta el tamaño total de la barra de vida.',
    bonusFormula: '+500 Vida máxima',
  },
  {
    id: 'peace_max_mana_increase',
    name: 'Incremento de Maná Máximo',
    branch: 'peace',
    col: 4,
    row: 8,
    maxPoints: 10,
    iconType: 'shield_plain',
    colorTheme: 'gray',
    description: 'Amplía la reserva total de maná mágico.',
    bonusFormula: '+1,000 Maná máximo',
    arrowDownToRow: 9,
  },
  {
    id: 'peace_max_sd_increase',
    name: 'Incremento de Escudo SD Máximo',
    branch: 'peace',
    col: 4,
    row: 9,
    maxPoints: 10,
    iconType: 'shield_double',
    colorTheme: 'gray',
    description: 'Expande la barra de SD protectora para absorber el 90% del daño en PvP.',
    bonusFormula: '+2,500 SD máxima',
    requiredParentId: 'peace_max_mana_increase',
  },

  // ==================== BRANCH 2: WISDOM ====================
  // Column 1
  {
    id: 'wisdom_attack_rate',
    name: 'Tasa de Éxito de Ataque Mágico (Attack Rate)',
    branch: 'wisdom',
    col: 1,
    row: 1,
    maxPoints: 10,
    iconType: 'target_blue',
    colorTheme: 'cyan',
    description: 'Garantiza que los impactos mágicos no fallen ("MISS") en monstruos y rivales.',
    bonusFormula: '+120 Tasa de Ataque Mágico',
  },
  {
    id: 'wisdom_skill_mastery',
    name: 'Maestría Elemental Primaria',
    branch: 'wisdom',
    col: 1,
    row: 2,
    maxPoints: 10,
    iconType: 'grey_pillar',
    colorTheme: 'gray',
    description: 'Aumenta el poder de hechizos básicos.',
    bonusFormula: '+15 Daño elemental',
  },
  {
    id: 'wisdom_teleport_enhancement',
    name: 'Potenciación de Teleport',
    branch: 'wisdom',
    col: 1,
    row: 3,
    maxPoints: 10,
    iconType: 'hands_magic',
    colorTheme: 'gray',
    description: 'Reduce el retraso de teletransporte y otorga inmunidad temporal.',
    bonusFormula: '-0.3s Cast Delay en Teleport',
  },
  {
    id: 'wisdom_flame_skill',
    name: 'Maestría de Hechizo Flame',
    branch: 'wisdom',
    col: 1,
    row: 4,
    maxPoints: 10,
    iconType: 'boots_flame',
    colorTheme: 'orange',
    description: 'Eleva el área e impacto del hechizo Flame.',
    bonusFormula: '+25% Daño de Flame',
    arrowRightToCol: 2,
  },
  {
    id: 'wisdom_evil_spirits',
    name: 'Poder de Evil Spirit',
    branch: 'wisdom',
    col: 1,
    row: 5,
    maxPoints: 10,
    iconType: 'fire_demon',
    colorTheme: 'gray',
    description: 'Aumenta la fuerza de las almas invocadas por Evil Spirit.',
    bonusFormula: '+20% Daño de Evil Spirits',
  },
  {
    id: 'wisdom_dark_crescent',
    name: 'Barrera Umbría Arcana',
    branch: 'wisdom',
    col: 1,
    row: 6,
    maxPoints: 10,
    iconType: 'dark_crescent',
    colorTheme: 'purple',
    description: 'Refuerzo de resistencia ante maldiciones de Summoner y venenos.',
    bonusFormula: '+15% Resistencia a debuffs',
    arrowDownToRow: 7,
  },
  {
    id: 'wisdom_grand_wizard',
    name: 'Trascendencia de Grand Master',
    branch: 'wisdom',
    col: 1,
    row: 7,
    maxPoints: 10,
    iconType: 'shield_silver',
    colorTheme: 'gray',
    description: 'Corona el poder del Mago Supremo.',
    bonusFormula: '+30 Daño Mágico General',
    requiredParentId: 'wisdom_dark_crescent',
  },

  // Column 2
  {
    id: 'wisdom_lightning_strike',
    name: 'Hechizo Lightning / Rayo',
    branch: 'wisdom',
    col: 2,
    row: 2,
    maxPoints: 10,
    iconType: 'lightning_blue',
    colorTheme: 'gray',
    description: 'Aumenta la fuerza del rayo eléctrico.',
    bonusFormula: '+20% Daño de Lightning',
    arrowDownToRow: 3,
  },
  {
    id: 'wisdom_lightning_mastery',
    name: 'Cadena de Rayos Arcana',
    branch: 'wisdom',
    col: 2,
    row: 3,
    maxPoints: 10,
    iconType: 'lightning_dim',
    colorTheme: 'gray',
    description: 'Encadena el impacto eléctrico hacia enemigos cercanos.',
    bonusFormula: '+15% Rebote de relámpago',
    requiredParentId: 'wisdom_lightning_strike',
  },
  {
    id: 'wisdom_flame_core',
    name: 'Núcleo Ígneo de Flame',
    branch: 'wisdom',
    col: 2,
    row: 4,
    maxPoints: 10,
    iconType: 'grey_dot',
    colorTheme: 'gray',
    description: 'Explosión concentrada de daño de fuego.',
    bonusFormula: '+30 Daño ígneo',
    requiredParentId: 'wisdom_flame_skill',
  },
  {
    id: 'wisdom_inferno_skill',
    name: 'Maestría de Hechizo Inferno',
    branch: 'wisdom',
    col: 2,
    row: 5,
    maxPoints: 10,
    iconType: 'starburst_purple',
    colorTheme: 'gray',
    description: 'Anillo de fuego destructivo a corta distancia.',
    bonusFormula: '+25% Daño de Inferno',
  },
  {
    id: 'wisdom_shuriken_stars',
    name: 'Estrella Arcana Concentrada',
    branch: 'wisdom',
    col: 2,
    row: 6,
    maxPoints: 10,
    iconType: 'silver_shuriken',
    colorTheme: 'gray',
    description: 'Velocidad de conjuro en habilidades directas.',
    bonusFormula: '+5 Velocidad de ataque mágico',
  },

  // Column 3
  {
    id: 'wisdom_mana_reduction',
    name: 'Reducción de Consumo de Maná (Mana Mastery)',
    branch: 'wisdom',
    col: 3,
    row: 2,
    maxPoints: 10,
    iconType: 'star_david_blue',
    colorTheme: 'blue',
    description: 'Disminuye drásticamente el consumo de maná y AG de todos los conjuros.',
    bonusFormula: '-35% Coste de Maná en todas las habilidades',
    arrowDownToRow: 3,
  },
  {
    id: 'wisdom_soul_barrier',
    name: 'Potenciación de Soul Barrier (Mana Shield)',
    branch: 'wisdom',
    col: 3,
    row: 3,
    maxPoints: 10,
    iconType: 'star_david_pink',
    colorTheme: 'pink',
    description: 'Habilidad reina del Grand Master: eleva la duración y absorción de daño para toda la party.',
    bonusFormula: '+10% Absorción de Daño y +60s duración de Mana Shield',
    arrowDownToRow: 4,
    requiredParentId: 'wisdom_mana_reduction',
  },
  {
    id: 'wisdom_lightning_thunder',
    name: 'Poder de Impacto de Hechicero (Wizardry Power)',
    branch: 'wisdom',
    col: 3,
    row: 4,
    maxPoints: 10,
    iconType: 'lightning_orange_cyan',
    colorTheme: 'orange',
    description: 'Aumenta el multiplicador de daño mágico de bastones equipados.',
    bonusFormula: '+40 Wizardry Damage porcentual',
    requiredParentId: 'wisdom_soul_barrier',
  },
  {
    id: 'wisdom_blast_power',
    name: 'Poder de Hechizo Blast',
    branch: 'wisdom',
    col: 3,
    row: 5,
    maxPoints: 10,
    iconType: 'purple_blast_glow',
    colorTheme: 'purple',
    description: 'Aumenta el poder de impacto de hechizos de energía arcana y Blast.',
    bonusFormula: '+25% Daño de Blast',
  },

  // Column 4
  {
    id: 'wisdom_meteor_mastery',
    name: 'Impacto de Meteorito',
    branch: 'wisdom',
    col: 4,
    row: 3,
    maxPoints: 10,
    iconType: 'grey_meteor',
    colorTheme: 'gray',
    description: 'Cae un meteorito ardiente que aturde a los enemigos.',
    bonusFormula: '+20% Daño de Meteor',
  },
  {
    id: 'wisdom_ice_storm_mastery',
    name: 'Maestría de Hechizo Ice Storm',
    branch: 'wisdom',
    col: 4,
    row: 5,
    maxPoints: 10,
    iconType: 'ice_storm_blue',
    colorTheme: 'cyan',
    description: 'Habilidad de ataque principal en PvP/Siege: expande el área y ralentización de Ice Storm.',
    bonusFormula: '+30% Daño de Ice Storm y +20% Probabilidad de Congelar',
    arrowDownToRow: 6,
  },
  {
    id: 'wisdom_decay_mastery',
    name: 'Maestría de Hechizo Decay & Nova',
    branch: 'wisdom',
    col: 4,
    row: 6,
    maxPoints: 10,
    iconType: 'nova_star_blue',
    colorTheme: 'cyan',
    description: 'Potencia el daño por segundo de veneno corrosivo en objetivos de alto aguante.',
    bonusFormula: '+35% Daño de Decay y Nova concentrada',
    arrowDownToRow: 7,
    requiredParentId: 'wisdom_ice_storm_mastery',
  },
  {
    id: 'wisdom_arcane_core',
    name: 'Núcleo Arcano Supremo (Arcane Mastery Cap)',
    branch: 'wisdom',
    col: 4,
    row: 7,
    maxPoints: 20,
    iconType: 'purple_nova_burst',
    colorTheme: 'purple',
    description: 'El ápice ofensivo del Grand Master: 20 puntos asignados para maximizar daño destructivo.',
    bonusFormula: '+60 Daño Mágico Crítico Supremo (+20 Pts Maxeados)',
    requiredParentId: 'wisdom_decay_mastery',
  },

  // ==================== BRANCH 3: OVERCOME ====================
  // Column 1
  {
    id: 'overcome_attack_power',
    name: 'Potencia Física Ofensiva',
    branch: 'overcome',
    col: 1,
    row: 1,
    maxPoints: 10,
    iconType: 'fist_orange',
    colorTheme: 'gray',
    description: 'Aumenta el poder de impacto cuerpo a cuerpo.',
    bonusFormula: '+20 Poder de ataque físico',
  },
  {
    id: 'overcome_staff_power',
    name: 'Fuerza de Báculo Ofensivo',
    branch: 'overcome',
    col: 1,
    row: 2,
    maxPoints: 10,
    iconType: 'staff_mace',
    colorTheme: 'gray',
    description: 'Aumenta la fuerza de golpe.',
    bonusFormula: '+15 Daño',
  },
  {
    id: 'overcome_staff_master',
    name: 'Maestría de Impacto Contundente',
    branch: 'overcome',
    col: 1,
    row: 3,
    maxPoints: 10,
    iconType: 'staff_mace_2',
    colorTheme: 'gray',
    description: 'Probabilidad de aturdimiento con arma.',
    bonusFormula: '+5% Aturdimiento',
  },
  {
    id: 'overcome_pvp_cube_1',
    name: 'Concentración de Ataque PvP',
    branch: 'overcome',
    col: 1,
    row: 4,
    maxPoints: 10,
    iconType: 'cube_1',
    colorTheme: 'gray',
    description: 'Eleva la precisión contra otros personajes.',
    bonusFormula: '+25 Tasa de ataque PvP',
  },
  {
    id: 'overcome_pvp_cube_2',
    name: 'Especialización de Combate',
    branch: 'overcome',
    col: 1,
    row: 5,
    maxPoints: 10,
    iconType: 'cube_2',
    colorTheme: 'gray',
    description: 'Aumenta el daño en duelos oficiales.',
    bonusFormula: '+20 Daño en duelo',
  },
  {
    id: 'overcome_pvp_orb',
    name: 'Esfera de Combate',
    branch: 'overcome',
    col: 1,
    row: 6,
    maxPoints: 10,
    iconType: 'orb_dim',
    colorTheme: 'gray',
    description: 'Aumenta la tasa de impacto crítico.',
    bonusFormula: '+3% Crítico',
  },

  // Column 2
  {
    id: 'overcome_wizardry_min',
    name: 'Daño Mágico Mínimo PvP',
    branch: 'overcome',
    col: 2,
    row: 2,
    maxPoints: 10,
    iconType: 'drill_1',
    colorTheme: 'gray',
    description: 'Eleva el daño base mínimo para garantizar golpes fuertes constantes.',
    bonusFormula: '+20 Daño mínimo',
    arrowDownToRow: 3,
  },
  {
    id: 'overcome_wizardry_max',
    name: 'Daño Mágico Máximo PvP',
    branch: 'overcome',
    col: 2,
    row: 3,
    maxPoints: 10,
    iconType: 'drill_2',
    colorTheme: 'gray',
    description: 'Eleva el techo de daño máximo en ataques contra jugadores.',
    bonusFormula: '+30 Daño máximo',
    requiredParentId: 'overcome_wizardry_min',
  },
  {
    id: 'overcome_atom_power',
    name: 'Disolución Atómica Mágica',
    branch: 'overcome',
    col: 2,
    row: 4,
    maxPoints: 10,
    iconType: 'atom_dim',
    colorTheme: 'gray',
    description: 'Penetra barreras mágicas enemigas.',
    bonusFormula: '+5% Ignorar resistencia elemental',
  },
  {
    id: 'overcome_mana_drain',
    name: 'Drenaje de Maná Rival',
    branch: 'overcome',
    col: 2,
    row: 5,
    maxPoints: 10,
    iconType: 'dome_dim',
    colorTheme: 'gray',
    description: 'Quema maná del objetivo al impactar con hechizos de área.',
    bonusFormula: '+3% Robo de Maná',
  },
  {
    id: 'overcome_heart_drain',
    name: 'Robo de Vida en PvP',
    branch: 'overcome',
    col: 2,
    row: 6,
    maxPoints: 10,
    iconType: 'heart_dim',
    colorTheme: 'gray',
    description: 'Restaura vida absorbiendo vitalidad de oponentes caídos.',
    bonusFormula: '+3% Robo de Vida',
    arrowDownToRow: 7,
  },
  {
    id: 'overcome_fire_soul',
    name: 'Furia del Alma Ardiente',
    branch: 'overcome',
    col: 2,
    row: 7,
    maxPoints: 10,
    iconType: 'fire_soul_dim',
    colorTheme: 'gray',
    description: 'Aumenta el daño en proporción a la vida perdida.',
    bonusFormula: '+10% Daño bajo en vida',
    requiredParentId: 'overcome_heart_drain',
  },

  // Column 3
  {
    id: 'overcome_shield_pierce_1',
    name: 'Penetración de Escudo (Tier 1)',
    branch: 'overcome',
    col: 3,
    row: 2,
    maxPoints: 10,
    iconType: 'shield_dim_1',
    colorTheme: 'gray',
    description: 'Ignora una porción de la defensa de escudo del rival.',
    bonusFormula: '+5% Penetración de escudo',
    arrowDownToRow: 3,
  },
  {
    id: 'overcome_shield_pierce_2',
    name: 'Penetración de Escudo (Tier 2)',
    branch: 'overcome',
    col: 3,
    row: 3,
    maxPoints: 10,
    iconType: 'shield_dim_2',
    colorTheme: 'gray',
    description: 'Reduce la efectividad del bloqueo de escudo oponente.',
    bonusFormula: '-10% Bloqueo enemigo',
    requiredParentId: 'overcome_shield_pierce_1',
  },
  {
    id: 'overcome_critical_rate',
    name: 'Tasa de Daño Crítico',
    branch: 'overcome',
    col: 3,
    row: 4,
    maxPoints: 10,
    iconType: 'cross_circle_1',
    colorTheme: 'gray',
    description: 'Probabilidad de asestar daño crítico (números azules).',
    bonusFormula: '+10% Probabilidad de Daño Crítico',
  },
  {
    id: 'overcome_pvp_stand',
    name: 'Especialista en Asedio Loren Deep',
    branch: 'overcome',
    col: 3,
    row: 6,
    maxPoints: 10,
    iconType: 'standing_man_dim',
    colorTheme: 'gray',
    description: 'Aumenta el daño contra jugadores dentro del castillo.',
    bonusFormula: '+15% Daño en Castle Siege',
    arrowDownToRow: 7,
  },
  {
    id: 'overcome_sd_auto_regen',
    name: 'Regeneración Pasiva de SD en Batalla',
    branch: 'overcome',
    col: 3,
    row: 7,
    maxPoints: 10,
    iconType: 'shield_regen_dim',
    colorTheme: 'gray',
    description: 'Permite recuperar SD automáticamente en combate continuo.',
    bonusFormula: '+30 SD / segundo en combate',
    requiredParentId: 'overcome_pvp_stand',
    arrowDownToRow: 9,
  },
  {
    id: 'overcome_berserk_pose',
    name: 'Postura de Dominio Mágico',
    branch: 'overcome',
    col: 3,
    row: 9,
    maxPoints: 10,
    iconType: 'praise_arms_dim',
    colorTheme: 'gray',
    description: 'Aumenta el daño infligido a expensas de un 5% de defensa.',
    bonusFormula: '+20% Daño definitivo',
    requiredParentId: 'overcome_sd_auto_regen',
  },

  // Column 4
  {
    id: 'overcome_excellent_rate',
    name: 'Tasa de Daño Excelente',
    branch: 'overcome',
    col: 4,
    row: 4,
    maxPoints: 10,
    iconType: 'cross_circle_2',
    colorTheme: 'gray',
    description: 'Probabilidad de asestar daño excelente (números verdes fluorescentes).',
    bonusFormula: '+10% Probabilidad de Daño Excelente',
  },
  {
    id: 'overcome_double_damage',
    name: 'Probabilidad de Daño Doble',
    branch: 'overcome',
    col: 4,
    row: 6,
    maxPoints: 10,
    iconType: 'target_bullseye_dim',
    colorTheme: 'gray',
    description: 'Probabilidad de que un golpe impacte dos veces al mismo tiempo.',
    bonusFormula: '+8% Probabilidad de Daño Doble',
  },
  {
    id: 'overcome_ignore_defense',
    name: 'Probabilidad de Ignorar Defensa (Ignore Defense)',
    branch: 'overcome',
    col: 4,
    row: 7,
    maxPoints: 10,
    iconType: 'skull_fire_dim',
    colorTheme: 'gray',
    description: 'El atributo más letal de Mu Online: ignora el 100% de la defensa enemiga.',
    bonusFormula: '+5% Probabilidad de Ignorar Defensa Total',
  },
  {
    id: 'overcome_sd_reduction',
    name: 'Reducción de SD Enemigo (SD Bypass)',
    branch: 'overcome',
    col: 4,
    row: 9,
    maxPoints: 10,
    iconType: 'shield_broken_final',
    colorTheme: 'gray',
    description: 'Traspasa el escudo SD para dañar directamente la barra de vida del rival.',
    bonusFormula: '+10% Daño directo a HP ignorando SD',
  },
];

// Exact points allocated in the user's screenshot: 70 Peace / 80 Wisdom / 0 Overcome
export const SCREENSHOT_EXACT_BUILD: Record<string, number> = {
  // Peace: 70
  peace_armor_durability: 10,
  peace_defense_increase: 10,
  peace_shield_defense: 10,
  peace_strength_increase: 10,
  peace_hp_recovery: 10,
  peace_mana_recovery: 10,
  peace_sd_recovery: 10,

  // Wisdom: 80
  wisdom_attack_rate: 10,
  wisdom_mana_reduction: 10,
  wisdom_soul_barrier: 10,
  wisdom_lightning_thunder: 10,
  wisdom_ice_storm_mastery: 10,
  wisdom_decay_mastery: 10,
  wisdom_arcane_core: 20, // Max 20 points!
};

// Alternative PvP / Castle Siege Focus build for Grand Master (70 Peace / 40 Wisdom / 40 Overcome)
export const PVP_SIEGE_BUILD: Record<string, number> = {
  // Peace: 70
  peace_armor_durability: 10,
  peace_defense_increase: 10,
  peace_shield_defense: 10,
  peace_strength_increase: 10,
  peace_hp_recovery: 10,
  peace_mana_recovery: 10,
  peace_sd_recovery: 10,

  // Wisdom: 40
  wisdom_attack_rate: 10,
  wisdom_mana_reduction: 10,
  wisdom_soul_barrier: 10,
  wisdom_lightning_thunder: 10,

  // Overcome: 40
  overcome_attack_power: 10,
  overcome_double_damage: 10,
  overcome_ignore_defense: 10,
  overcome_sd_reduction: 10,
};

interface InGameMasterTreeViewProps {
  characterName: string;
  classNameTitle: string;
  masterLevel: number;
  allocatedPoints: Record<string, number>;
  onUpdatePoints: (newPoints: Record<string, number>) => void;
  onClose?: () => void;
}

export const InGameMasterTreeView: React.FC<InGameMasterTreeViewProps> = ({
  characterName,
  classNameTitle,
  masterLevel = 150,
  allocatedPoints,
  onUpdatePoints,
  onClose,
}) => {
  const [hoveredSkill, setHoveredSkill] = useState<InGameSkillNode | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Group nodes by branch
  const peaceNodes = useMemo(() => GM_TREE_NODES.filter((n) => n.branch === 'peace'), []);
  const wisdomNodes = useMemo(() => GM_TREE_NODES.filter((n) => n.branch === 'wisdom'), []);
  const overcomeNodes = useMemo(() => GM_TREE_NODES.filter((n) => n.branch === 'overcome'), []);

  // Compute branch totals
  const peaceTotal = useMemo(() => {
    return peaceNodes.reduce((acc, n) => acc + (allocatedPoints[n.id] || 0), 0);
  }, [peaceNodes, allocatedPoints]);

  const wisdomTotal = useMemo(() => {
    return wisdomNodes.reduce((acc, n) => acc + (allocatedPoints[n.id] || 0), 0);
  }, [wisdomNodes, allocatedPoints]);

  const overcomeTotal = useMemo(() => {
    return overcomeNodes.reduce((acc, n) => acc + (allocatedPoints[n.id] || 0), 0);
  }, [overcomeNodes, allocatedPoints]);

  const totalSpent = peaceTotal + wisdomTotal + overcomeTotal;
  const remainingPoints = Math.max(0, masterLevel - totalSpent);

  // Add 1 point (or up to max)
  const handleAdd = (skill: InGameSkillNode, amount = 1) => {
    const current = allocatedPoints[skill.id] || 0;
    if (current >= skill.maxPoints) return;
    if (remainingPoints <= 0) return;

    // Check prerequisites
    if (skill.requiredParentId) {
      const parentPts = allocatedPoints[skill.requiredParentId] || 0;
      if (parentPts < 10) return;
    }

    const toAdd = Math.min(amount, skill.maxPoints - current, remainingPoints);
    if (toAdd > 0) {
      onUpdatePoints({
        ...allocatedPoints,
        [skill.id]: current + toAdd,
      });
    }
  };

  // Remove 1 point
  const handleSubtract = (skill: InGameSkillNode, amount = 1) => {
    const current = allocatedPoints[skill.id] || 0;
    if (current <= 0) return;

    // Check if any child depends on this skill having 10 points
    const childDependent = GM_TREE_NODES.find(
      (n) => n.requiredParentId === skill.id && (allocatedPoints[n.id] || 0) > 0
    );
    if (childDependent && current - amount < 10) {
      // Cannot drop below 10 while child has points
      return;
    }

    const toRemove = Math.min(amount, current);
    const newPoints = { ...allocatedPoints };
    if (current - toRemove <= 0) {
      delete newPoints[skill.id];
    } else {
      newPoints[skill.id] = current - toRemove;
    }
    onUpdatePoints(newPoints);
  };

  // Load exact screenshot build
  const handleLoadScreenshotBuild = () => {
    onUpdatePoints({ ...SCREENSHOT_EXACT_BUILD });
    setSuccessMsg('¡Cargada la Build de la Captura! (70 Peace / 80 Wisdom · 150 ML)');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Load PvP / Castle Siege focus build
  const handleLoadPvPBuild = () => {
    onUpdatePoints({ ...PVP_SIEGE_BUILD });
    setSuccessMsg('¡Cargada la Build Full PvP / Asedio! (70 Peace / 40 Wisdom / 40 Overcome · 150 ML)');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Clear all points
  const handleReset = () => {
    onUpdatePoints({});
    setSuccessMsg('Árbol reseteado a 0 puntos. ¡Haz clic en las habilidades para asignar tus puntos reales!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Render individual skill node icon matching screenshot visuals
  const renderSkillVisualIcon = (skill: InGameSkillNode, points: number) => {
    const isActive = points > 0;

    switch (skill.iconType) {
      case 'bicep_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-950 border border-emerald-400">
            <span className="text-xl select-none">💪</span>
          </div>
        );
      case 'lightning_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/30 to-green-950 border border-green-400">
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-400" />
          </div>
        );
      case 'arch_keyhole_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/30 to-emerald-950 border border-green-400">
            <Shield className="w-5 h-5 text-emerald-300 fill-emerald-500/40" />
          </div>
        );
      case 'shield_num1_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600/30 to-green-950 border border-green-400 relative">
            <Shield className="w-5 h-5 text-yellow-300" />
            <span className="absolute font-black text-[10px] text-white font-mono">1</span>
          </div>
        );
      case 'skull_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-green-950 border border-green-400">
            <span className="text-xl select-none">👽</span>
          </div>
        );
      case 'lightning_mana_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-green-950 border border-green-400">
            <Zap className="w-5 h-5 text-emerald-300 fill-emerald-400" />
          </div>
        );
      case 'crystal_green':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-emerald-950 border border-green-400">
            <div className="w-3.5 h-4.5 bg-gradient-to-t from-cyan-400 to-emerald-300 rotate-45 rounded-[2px] shadow-sm shadow-cyan-300" />
          </div>
        );
      case 'target_blue':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-blue-950 border border-cyan-400">
            <Target className="w-5 h-5 text-cyan-300" />
          </div>
        );
      case 'star_david_blue':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/30 to-indigo-950 border border-blue-400">
            <span className="text-xl text-blue-300 select-none">✡</span>
          </div>
        );
      case 'star_david_pink':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-600/30 to-fuchsia-950 border border-pink-400">
            <span className="text-xl text-pink-300 select-none font-bold">✡</span>
          </div>
        );
      case 'lightning_orange_cyan':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-cyan-950 border border-cyan-400">
            <Zap className="w-5 h-5 text-orange-400 fill-orange-500" />
          </div>
        );
      case 'ice_storm_blue':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-blue-950 border border-cyan-400">
            <Snowflake className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
        );
      case 'nova_star_blue':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-400/30 to-blue-950 border border-cyan-300">
            <Sparkles className="w-5 h-5 text-cyan-200" />
          </div>
        );
      case 'purple_nova_burst':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/40 to-fuchsia-950 border border-purple-300 shadow-md shadow-purple-500/50">
            <Sparkles className="w-6 h-6 text-fuchsia-200" />
          </div>
        );
      case 'purple_blast_glow':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-fuchsia-950 border border-purple-500/60">
            <Sparkles className="w-4 h-4 text-fuchsia-300" />
          </div>
        );
      case 'sword_purple':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-slate-900 border border-purple-500/60">
            <span className="text-sm select-none">🗡️</span>
          </div>
        );
      case 'boots_flame':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600/30 to-amber-950 border border-amber-500/80">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
        );
      case 'fist_orange':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600/30 to-red-950 border border-orange-500/60">
            <span className="text-base select-none">👊</span>
          </div>
        );
      default:
        return (
          <div
            className={`w-full h-full flex items-center justify-center border ${
              isActive
                ? 'bg-slate-800 border-yellow-500/70 text-yellow-300'
                : 'bg-[#12141a] border-slate-700/60 text-slate-500'
            }`}
          >
            <Shield className="w-4 h-4 opacity-70" />
          </div>
        );
    }
  };

  // Render a branch grid (4 columns × 9 rows)
  const renderBranchGrid = (nodes: InGameSkillNode[], branchKey: 'peace' | 'wisdom' | 'overcome') => {
    // Generate 9 rows x 4 columns grid
    const grid: (InGameSkillNode | null)[][] = Array.from({ length: 9 }, () =>
      Array.from({ length: 4 }, () => null)
    );

    nodes.forEach((n) => {
      if (n.row >= 1 && n.row <= 9 && n.col >= 1 && n.col <= 4) {
        grid[n.row - 1][n.col - 1] = n;
      }
    });

    return (
      <div className="flex-1 flex flex-col min-w-[260px] bg-[#0c0d12]/90 border border-[#4a3b1d] rounded-lg p-2.5 relative">
        {/* Branch Title Bar */}
        <div className="text-center pb-2 mb-2 border-b border-[#3d3119]">
          <span className="font-mono text-xs sm:text-sm font-extrabold text-[#e5a823] tracking-widest uppercase">
            {branchKey === 'peace' && `Peace: ${peaceTotal}`}
            {branchKey === 'wisdom' && `Wisdom: ${wisdomTotal}`}
            {branchKey === 'overcome' && `Overcome: ${overcomeTotal}`}
          </span>
        </div>

        {/* 9 Rows */}
        <div className="flex flex-col space-y-1.5 flex-1 justify-between">
          {grid.map((rowCells, rowIdx) => {
            const rowNumber = rowIdx + 1;
            return (
              <div key={rowNumber} className="grid grid-cols-4 gap-1.5 relative items-center">
                {rowCells.map((skill, colIdx) => {
                  const colNumber = colIdx + 1;

                  if (!skill) {
                    return (
                      <div
                        key={`empty-${rowNumber}-${colNumber}`}
                        className="h-10 sm:h-11 w-full rounded border border-transparent"
                      />
                    );
                  }

                  const points = allocatedPoints[skill.id] || 0;
                  const isActive = points > 0;
                  const isMax = points >= skill.maxPoints;
                  const isUnlocked =
                    !skill.requiredParentId || (allocatedPoints[skill.requiredParentId] || 0) >= 10;

                  return (
                    <div
                      key={skill.id}
                      className="relative flex items-center space-x-1 group"
                      onMouseEnter={() => setHoveredSkill(skill)}
                      onMouseLeave={() => setHoveredSkill(null)}
                    >
                      {/* Skill Slot Button */}
                      <button
                        type="button"
                        onClick={() => handleAdd(skill, 1)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleSubtract(skill, 1);
                        }}
                        disabled={!isUnlocked && !isActive}
                        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded shrink-0 p-[2px] transition-all cursor-pointer ${
                          isActive
                            ? 'ring-1 ring-[#e5a823] shadow-md shadow-amber-500/30'
                            : isUnlocked
                            ? 'border border-[#423926] hover:border-[#8f743c] opacity-80'
                            : 'border border-[#26262b] opacity-40 grayscale cursor-not-allowed'
                        }`}
                        title={`${skill.name} (${points}/${skill.maxPoints}) - Clic izquierdo (+1), Clic derecho (-1)`}
                      >
                        {renderSkillVisualIcon(skill, points)}

                        {/* Lock Icon overlay if locked */}
                        {!isUnlocked && !isActive && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-slate-500" />
                          </div>
                        )}
                      </button>

                      {/* Point number to the right matching in-game UI */}
                      <span
                        className={`text-[11px] font-mono font-bold select-none cursor-pointer ${
                          isActive
                            ? isMax
                              ? 'text-[#e5a823]'
                              : 'text-amber-200'
                            : 'text-slate-500'
                        }`}
                        onClick={() => handleAdd(skill, 1)}
                      >
                        {points}
                      </span>

                      {/* Downward Connector Arrow */}
                      {skill.arrowDownToRow && (
                        <div className="absolute -bottom-2 left-3.5 z-10 pointer-events-none text-[#e5a823]/80 text-[10px] leading-none">
                          ↓
                        </div>
                      )}

                      {/* Right Connector Arrow */}
                      {skill.arrowRightToCol && (
                        <div className="absolute right-0 top-2.5 z-10 pointer-events-none text-[#e5a823]/80 text-[10px] leading-none">
                          →
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#181920] via-[#0f1015] to-[#0a0a0d] border-2 border-[#5a4825] shadow-2xl p-4 sm:p-6 overflow-hidden">
      {/* Stone / Granite Texture Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #888 1px, transparent 1px), radial-gradient(circle at 20% 20%, #666 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* ============================================================== */}
      {/* TOP HEADER: Pixel-accurate with in-game Client screenshot      */}
      {/* ============================================================== */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-[#4a3b1d] mb-4">
        {/* Class Name in Classic Gold Box */}
        <div className="px-5 py-1.5 bg-[#0e0f14] border border-[#5a4825] rounded shadow-inner text-center">
          <span className="font-mono text-sm sm:text-base font-extrabold text-[#e5a823] tracking-widest uppercase">
            {classNameTitle || 'Grand Master'}
          </span>
        </div>

        {/* Master Telemetry Pills */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-3 py-1 bg-[#0a0b0e] border border-[#4a3b1d] rounded text-slate-300">
            <span className="text-slate-400">Master level: </span>
            <span className="text-[#e5a823] font-bold">{masterLevel}</span>
          </div>

          <div className="px-3 py-1 bg-[#0a0b0e] border border-[#4a3b1d] rounded text-slate-300">
            <span className="text-slate-400">Level point: </span>
            <span
              className={`font-bold ${
                remainingPoints > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
              }`}
            >
              {remainingPoints}
            </span>
          </div>

          <div className="px-3 py-1 bg-[#0a0b0e] border border-[#4a3b1d] rounded text-slate-300">
            <span className="text-slate-400">EXP: </span>
            <span className="text-slate-300 font-bold">0.00%</span>
          </div>
        </div>

        {/* Action Controls & Close [X] */}
        <div className="flex items-center space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded border border-[#5a4825] bg-[#1a1b24] hover:bg-rose-950 text-[#e5a823] hover:text-white font-mono font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Control Banner for Smash MU clan Anomaly */}
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2.5 bg-[#0a0b0f]/80 border border-[#3b3017] rounded-xl p-2.5">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
          <Sparkles className="w-4 h-4 text-[#e5a823]" />
          <span>
            Personaje: <strong className="text-white">{characterName}</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Puntos Usados: <strong className="text-[#e5a823]">{totalSpent}</strong> / {masterLevel}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadScreenshotBuild}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-900/60 to-yellow-900/40 hover:from-amber-800/80 hover:to-yellow-800/60 border border-[#e5a823] text-[#fcd34d] font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            title="Carga la distribución de la captura del juego (70 Peace / 80 Wisdom)"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Build Captura (70 Peace / 80 Wisdom)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadPvPBuild}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-950/60 to-rose-900/40 hover:from-red-900/80 hover:to-rose-800/60 border border-rose-500/60 text-rose-300 font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            title="Carga la build con Ignore Defense y Double Damage para Castle Siege y PvP"
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>Build PvP / Asedio</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
            title="Limpiar todos los puntos a 0 para que puedas asignar exactamente los de tu juego"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="ml-1">Limpiar a 0 (Asignar Mis Puntos)</span>
          </button>
        </div>
      </div>

      {/* Informative transparency banner */}
      <div className="mb-4 p-3 bg-[#0a0b0f] border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-xs font-mono text-amber-200/90">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="text-amber-300 font-bold">
            Transparencia de Datos Smash MU:
          </div>
          <p className="text-slate-300 font-sans text-xs leading-relaxed">
            La API pública de Smash MU confirma tu nivel y tu total de <strong className="text-white">{masterLevel} Master Level</strong>, pero <strong className="text-amber-300">no expone qué habilidades específicas tiene asignadas cada jugador</strong> (el servidor oculta estos datos por privacidad táctica en Castle Siege).
            La build precargada (70 Peace / 80 Wisdom) corresponde a la captura de ejemplo. Si tu personaje en el juego tiene otra distribución, haz clic en <strong className="text-white">"Limpiar a 0"</strong> y asigna tus puntos reales con clic izquierdo (+1) y clic derecho (-1).
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-4 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3 PANELS: PEACE (Left), WISDOM (Center), OVERCOME (Right)       */}
      {/* ============================================================== */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderBranchGrid(peaceNodes, 'peace')}
        {renderBranchGrid(wisdomNodes, 'wisdom')}
        {renderBranchGrid(overcomeNodes, 'overcome')}
      </div>

      {/* ============================================================== */}
      {/* FOOTER TOOLTIP / SKILL DETAILS CARD                            */}
      {/* ============================================================== */}
      <div className="mt-4 p-3.5 bg-[#0a0b0e] border border-[#4a3b1d] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        {hoveredSkill ? (
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#e5a823] text-sm">{hoveredSkill.name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                Puntos: {allocatedPoints[hoveredSkill.id] || 0} / {hoveredSkill.maxPoints}
              </span>
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider">
                Rama {hoveredSkill.branch}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">{hoveredSkill.description}</p>
            <div className="text-emerald-400 text-xs font-bold mt-1">
              Efecto: {hoveredSkill.bonusFormula}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400">
            <Info className="w-4 h-4 text-[#e5a823] shrink-0" />
            <span>
              Pasa el cursor sobre cualquier habilidad para ver su descripción y efecto.
              Haz <strong className="text-white">clic izquierdo</strong> para agregar puntos (+1) o{' '}
              <strong className="text-white">clic derecho</strong> para restar puntos (-1).
            </span>
          </div>
        )}

        <div className="shrink-0 text-slate-500 text-[11px]">
          Fiel al cliente oficial de <strong className="text-slate-400">Smash MU Season 6</strong>
        </div>
      </div>
    </div>
  );
};
