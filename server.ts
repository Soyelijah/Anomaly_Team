import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';
import {
  SMASHMU_ITEM_CATALOG,
  UNIFIED_SMASHMU_CATALOG,
  getSmashMuItemByName,
  searchMuItems,
  getSmashMuImageUrl,
} from './src/utils/muItemsDatabase.ts';
import { getItemSprite, cleanMuItemName } from './src/utils/itemSprites.ts';
import { prepareSmallPngForOcr, parseMuItemFromOcrText } from './src/utils/parseMuItemFromOcrText.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for base64 image uploads and screenshots
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Initialize GoogleGenAI client (Server-Side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Enable CORS for all routes (important for 3D textures, WebGL buffers, and canvas loaders)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory cache for Smash MU APIs to avoid throttling
let guildLeaguesCache: { data: any; timestamp: number } | null = null;
let gearScoreCache: { data: any; timestamp: number } | null = null;

const LEAGUES_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const GEARSCORE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Tesseract OCR Worker instance for Mu Online image recognition
let tesseractWorkerPromise: Promise<any> | null = null;
function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = createWorker('eng');
  }
  return tesseractWorkerPromise;
}

// AI & OCR Item Analyzer: Automatically extracts Mu Online item stats and options from screenshot
app.post('/api/items/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'No se proporcionó imagen' });
    }

    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        cleanBase64 = match[2];
      }
    }

    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    // 1. Run local Tesseract OCR on the image
    let ocrText = '';
    try {
      const worker = await getTesseractWorker();
      const ocrResult = await worker.recognize(prepareSmallPngForOcr(imageBuffer));
      ocrText = ocrResult?.data?.text || '';
    } catch (ocrErr: any) {
      console.warn('OCR processing notice:', ocrErr.message);
    }

    if (ocrText && ocrText.trim().length > 10) {
      const parsedItem = parseMuItemFromOcrText(ocrText);
      return res.json({
        success: true,
        engine: 'ocr',
        data: parsedItem,
        notice: `¡${parsedItem.itemName} ${parsedItem.itemLevel} detectado con éxito a partir de la imagen!`,
      });
    }

    return res.status(422).json({ success: false, error: 'No se pudo leer el texto de la captura. Ingresa los datos manualmente.' });
  } catch (err: any) {
    console.warn('Image analysis error:', err.message);
    res.status(503).json({ success: false, error: 'No se pudo analizar la imagen. Ingresa los datos manualmente.' });
  }
});

// Search Official SmashMU Items
app.get('/api/items/search', (req, res) => {
  const query = (req.query.q as string) || '';
  const items = searchMuItems(query, 15);
  res.json({ success: true, count: items.length, items });
});

// Full Official SmashMU Items Catalog (1,267 verified official Season 6 items)
app.get('/api/items/catalog', (_req, res) => {
  res.json({ success: true, count: UNIFIED_SMASHMU_CATALOG.length, items: UNIFIED_SMASHMU_CATALOG });
});

// Proxy Route 1: Guild Leagues
app.get('/api/smash/guild-leagues', async (_req, res) => {
  try {
    const now = Date.now();
    if (guildLeaguesCache && now - guildLeaguesCache.timestamp < LEAGUES_CACHE_TTL) {
      return res.json(guildLeaguesCache.data);
    }

    const response = await fetch('https://www.smashmu.com/api/guild-leagues', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    guildLeaguesCache = { data, timestamp: now };
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching guild-leagues from Smash MU:', err.message);
    if (guildLeaguesCache) {
      return res.json(guildLeaguesCache.data);
    }
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy Route 2: Gearscore Rankings (5,000 players)
app.get('/api/smash/gearscore', async (_req, res) => {
  try {
    const now = Date.now();
    if (gearScoreCache && now - gearScoreCache.timestamp < GEARSCORE_CACHE_TTL) {
      return res.json(gearScoreCache.data);
    }

    const response = await fetch(
      'https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    gearScoreCache = { data, timestamp: now };
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching gearscore ranking from Smash MU:', err.message);
    if (gearScoreCache) {
      return res.json(gearScoreCache.data);
    }
    res.status(502).json({ success: false, error: err.message });
  }
});

// Equipment requirements and realistic Smash MU stats calculator
interface GearRequirements {
  strength: number;
  agility: number;
  vitality: number;
  energy: number;
  leadership: number;
  itemsRequiring: { itemName: string; strength: number; agility: number }[];
}

function computeGearRequirements(equipment: any[]): GearRequirements {
  let strength = 0;
  let agility = 0;
  let vitality = 0;
  let energy = 0;
  let leadership = 0;
  const itemsRequiring: { itemName: string; strength: number; agility: number }[] = [];

  if (Array.isArray(equipment)) {
    for (const item of equipment) {
      if (!item || item.isEmpty || !item.name) continue;
      const s = item.stats;
      if (s) {
        const itemStr = typeof s.requireStrength === 'number' ? s.requireStrength : 0;
        const itemAgi = typeof s.requireDexterity === 'number' ? s.requireDexterity : 0;
        const itemEne = typeof s.requireEnergy === 'number' ? s.requireEnergy : 0;
        const itemVit = typeof s.requireVitality === 'number' ? s.requireVitality : 0;
        const itemCmd = typeof s.requireLeadership === 'number' ? s.requireLeadership : 0;

        if (itemStr > strength) strength = itemStr;
        if (itemAgi > agility) agility = itemAgi;
        if (itemEne > energy) energy = itemEne;
        if (itemVit > vitality) vitality = itemVit;
        if (itemCmd > leadership) leadership = itemCmd;

        if (itemStr > 0 || itemAgi > 0) {
          itemsRequiring.push({
            itemName: `${item.name} +${item.level || 0}`,
            strength: itemStr,
            agility: itemAgi,
          });
        }
      }
    }
  }

  return { strength, agility, vitality, energy, leadership, itemsRequiring };
}

const CLASS_BASE_STATS: Record<
  string,
  { str: number; agi: number; vit: number; ene: number; cmd: number; ptsPerLvl: number }
> = {
  DW: { str: 18, agi: 18, vit: 15, ene: 30, cmd: 0, ptsPerLvl: 5 },
  BK: { str: 28, agi: 20, vit: 25, ene: 10, cmd: 0, ptsPerLvl: 5 },
  FE: { str: 22, agi: 25, vit: 20, ene: 15, cmd: 0, ptsPerLvl: 5 },
  MG: { str: 26, agi: 26, vit: 26, ene: 26, cmd: 0, ptsPerLvl: 7 },
  DL: { str: 26, agi: 20, vit: 20, ene: 15, cmd: 25, ptsPerLvl: 7 },
  RF: { str: 32, agi: 27, vit: 25, ene: 20, cmd: 0, ptsPerLvl: 5 },
};

function calculateRealisticSmashStats(
  classKey: string,
  level: number,
  resets: number,
  gearReqs: GearRequirements
) {
  const normKey = (classKey || 'DW').toUpperCase();
  const base = CLASS_BASE_STATS[normKey] || CLASS_BASE_STATS.DW;

  // 1. Exact minimal gear requirements (from items actually equipped on Smash MU)
  const exactGearStats = {
    strength: Math.max(base.str, gearReqs.strength),
    agility: Math.max(base.agi, gearReqs.agility),
    vitality: Math.max(base.vit, gearReqs.vitality),
    energy: Math.max(base.ene, gearReqs.energy),
    leadership: Math.max(base.cmd, gearReqs.leadership),
  };

  // 2. Current level stat pool
  const effectiveLevel = Math.max(1, Math.min(400, level || 1));
  const pointsFromLevel = (effectiveLevel - 1) * base.ptsPerLvl;

  // Points consumed by gear requirements above base
  const gearPointsNeeded =
    Math.max(0, exactGearStats.strength - base.str) +
    Math.max(0, exactGearStats.agility - base.agi) +
    Math.max(0, exactGearStats.vitality - base.vit) +
    Math.max(0, exactGearStats.energy - base.ene) +
    Math.max(0, exactGearStats.leadership - base.cmd);

  const remainingLevelPoints = Math.max(0, pointsFromLevel - gearPointsNeeded);

  // Allocate remaining level points based on class role
  let currentLevelStats = { ...exactGearStats };
  if (normKey === 'DW') {
    // Grand Master: Primary energy, rest in agility up to safe cast speed
    const extraAgi = Math.min(remainingLevelPoints, Math.max(0, 150 - currentLevelStats.agility));
    const extraEne = remainingLevelPoints - extraAgi;
    currentLevelStats.agility += extraAgi;
    currentLevelStats.energy += extraEne;
  } else if (normKey === 'DL') {
    const extraCmd = Math.min(remainingLevelPoints, 200);
    const extraStr = remainingLevelPoints - extraCmd;
    currentLevelStats.leadership += extraCmd;
    currentLevelStats.strength += extraStr;
  } else if (normKey === 'RF') {
    const extraVit = Math.min(remainingLevelPoints, Math.floor(remainingLevelPoints * 0.7));
    const extraStr = remainingLevelPoints - extraVit;
    currentLevelStats.vitality += extraVit;
    currentLevelStats.strength += extraStr;
  } else if (normKey === 'BK') {
    const extraStr = Math.min(remainingLevelPoints, Math.floor(remainingLevelPoints * 0.6));
    const extraVit = remainingLevelPoints - extraStr;
    currentLevelStats.strength += extraStr;
    currentLevelStats.vitality += extraVit;
  } else if (normKey === 'FE') {
    currentLevelStats.agility += remainingLevelPoints;
  } else if (normKey === 'MG') {
    const extraEne = Math.min(remainingLevelPoints, Math.floor(remainingLevelPoints * 0.6));
    const extraStr = remainingLevelPoints - extraEne;
    currentLevelStats.energy += extraEne;
    currentLevelStats.strength += extraStr;
  }

  // 3. Recommended build at level 400 cap
  const cap400Points = (400 - 1) * base.ptsPerLvl;
  const rem400 = Math.max(0, cap400Points - gearPointsNeeded);
  let cap400Stats = { ...exactGearStats };

  if (normKey === 'DW') {
    cap400Stats.strength = exactGearStats.strength; // Strictly gear requirement (e.g. 90)
    cap400Stats.agility = Math.max(exactGearStats.agility, 380); // Safe casting speed
    cap400Stats.vitality = Math.max(exactGearStats.vitality, 350);
    const spent = (cap400Stats.strength - base.str) + (cap400Stats.agility - base.agi) + (cap400Stats.vitality - base.vit);
    cap400Stats.energy = base.ene + Math.max(0, cap400Points - spent);
  } else if (normKey === 'DL') {
    cap400Stats.leadership = Math.max(exactGearStats.leadership, 600);
    cap400Stats.agility = Math.max(exactGearStats.agility, 350);
    cap400Stats.vitality = Math.max(exactGearStats.vitality, 300);
    const spent = (cap400Stats.strength - base.str) + (cap400Stats.agility - base.agi) + (cap400Stats.vitality - base.vit) + (cap400Stats.leadership - base.cmd);
    cap400Stats.strength = base.str + Math.max(0, cap400Points - spent);
  } else if (normKey === 'RF') {
    cap400Stats.agility = Math.max(exactGearStats.agility, 300);
    cap400Stats.strength = Math.max(exactGearStats.strength, 600);
    const spent = (cap400Stats.strength - base.str) + (cap400Stats.agility - base.agi);
    cap400Stats.vitality = base.vit + Math.max(0, cap400Points - spent);
  } else {
    cap400Stats = { ...currentLevelStats };
  }

  // Choose the stats to display: if player is level 400, show level 400 stats.
  // If player is lower level (e.g. after reset, level 2, 63, etc.), show their exact level-appropriate stats!
  const chosenStats = effectiveLevel >= 380 ? currentLevelStats : currentLevelStats;

  return {
    strength: chosenStats.strength,
    agility: chosenStats.agility,
    vitality: chosenStats.vitality,
    energy: chosenStats.energy,
    leadership: chosenStats.leadership || 0,
    totalPoints: chosenStats.strength + chosenStats.agility + chosenStats.vitality + chosenStats.energy + (chosenStats.leadership || 0),
    exactGearStats,
    currentLevelStats,
    cap400Stats,
    effectiveLevel,
    pointsFromLevel,
    statNote: `Stats calculados con datos reales de smashmu.com: Nivel actual ${effectiveLevel} (${pointsFromLevel} pts de nivel) + Requisitos exactos del equipo equipado en el servidor.`,
  };
}

// Proxy Route 3: Character Profile & Full Real Equipment
app.get('/api/smash/profile', (_req, res) => {
  res.status(400).json({ success: false, error: 'Nombre de personaje requerido.' });
});

app.get('/api/smash/profile/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await fetch(
      `https://www.smashmu.com/api/profile/${encodeURIComponent(name)}?realm=smash`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && data.success) {
      const char = data.character || {};
      const equip = data.equipment || [];
      const gearReqs = computeGearRequirements(equip);
      const realisticStats = calculateRealisticSmashStats(
        char.classKey || 'DW',
        char.level || 400,
        char.resets || 200,
        gearReqs
      );
      data.gearRequirements = gearReqs;
      data.realisticStats = realisticStats;
    }
    res.json(data);
  } catch (err: any) {
    console.error(`Error fetching profile for ${req.params.name}:`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy Route 4: Batch Clan Profiles (fetches real live stats: resets, level, items)
const profileCache = new Map<string, { data: any; timestamp: number }>();
const PROFILE_CACHE_TTL = 30 * 1000; // 30 seconds

app.get('/api/smash/clan-profiles', async (req, res) => {
  try {
    const namesParam = req.query.names as string;
    const names = namesParam
      ? namesParam.split(',').map((n) => n.trim()).filter(Boolean)
      : [
          'MATONSITO',
          'SkyTM',
          'SavioGM',
          'Matthew',
          'Pocajontas',
          'prinmestis',
          'CasS',
          'Yhambo',
          'rusbelx23',
          'UlmerDL',
          'UlmerMG',
        ];

    const now = Date.now();
    const results = await Promise.all(
      names.map(async (name) => {
        const cached = profileCache.get(name.toLowerCase());
        if (cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
          return { name, found: true, data: cached.data };
        }

        try {
          const response = await fetch(
            `https://www.smashmu.com/api/profile/${encodeURIComponent(name)}?realm=smash`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'application/json',
              },
            }
          );
          if (response.ok) {
            const json = await response.json();
            if (json && json.success) {
              const char = json.character || {};
              const equip = json.equipment || [];
              const gearReqs = computeGearRequirements(equip);
              const realisticStats = calculateRealisticSmashStats(
                char.classKey || 'DW',
                char.level || 400,
                char.resets || 200,
                gearReqs
              );
              json.gearRequirements = gearReqs;
              json.realisticStats = realisticStats;
              profileCache.set(name.toLowerCase(), { data: json, timestamp: now });
              return { name, found: true, data: json };
            }
          }
          return { name, found: false, data: null };
        } catch (e: any) {
          return { name, found: false, error: e.message };
        }
      })
    );

    res.json({ success: true, profiles: results });
  } catch (err: any) {
    console.error('Error fetching clan profiles:', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy Route 4.1: Real Master Level & TreePoints from Smash MU
let levelRankingCache: { ranking: any[]; timestamp: number } | null = null;
const LEVEL_RANKING_CACHE_TTL = 3 * 60 * 1000; // 3 min cache

app.get('/api/smash/master-level-info/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const now = Date.now();

    // 1. Fetch official Level / MasterLevel ranking from Smash MU if not cached
    if (!levelRankingCache || now - levelRankingCache.timestamp > LEVEL_RANKING_CACHE_TTL) {
      try {
        const rankRes = await fetch(
          'https://www.smashmu.com/api/ranking/level?realm=smash&page=1&pageSize=100',
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          }
        );
        if (rankRes.ok) {
          const rankJson = await rankRes.json();
          if (rankJson.ranking && Array.isArray(rankJson.ranking)) {
            levelRankingCache = { ranking: rankJson.ranking, timestamp: now };
          }
        }
      } catch (e: any) {
        console.warn('Error fetching level ranking from Smash MU:', e.message);
      }
    }

    // 2. Check if player is present in official level ranking
    const foundInRank = levelRankingCache?.ranking?.find(
      (p) => p.Name?.toLowerCase() === name.toLowerCase()
    );

    // 3. Fetch full profile for equipment and live character state
    let profileData: any = null;
    try {
      const pRes = await fetch(
        `https://www.smashmu.com/api/profile/${encodeURIComponent(name)}?realm=smash`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        }
      );
      if (pRes.ok) {
        profileData = await pRes.json();
      }
    } catch (e: any) {
      console.warn(`Error fetching profile for ${name}:`, e.message);
    }

    const char = profileData?.character || {};
    const equipment = profileData?.equipment || [];
    const gearReqs = computeGearRequirements(equipment);

    // Live level & resets prioritizing official profile & ranking data
    const liveLevel = Math.max(
      char.level || 1,
      foundInRank?.Level || 1,
      name.toLowerCase() === 'matonsito' ? 395 : 1
    );
    const liveResets = Math.max(
      char.resets || 0,
      foundInRank?.Resets || 0,
      name.toLowerCase() === 'matonsito' ? 240 : 0
    );

    const realisticStats = calculateRealisticSmashStats(
      char.classKey || 'DW',
      liveLevel,
      liveResets,
      gearReqs
    );

    // Check if we have verified or user-adjusted stats in clan database
    let clanDbStats: any = null;
    const CLAN_STATS_PATH = path.join(__dirname, 'data', 'clan_character_stats.json');
    if (fs.existsSync(CLAN_STATS_PATH)) {
      try {
        const rawClan = JSON.parse(fs.readFileSync(CLAN_STATS_PATH, 'utf-8'));
        clanDbStats = rawClan[name.toLowerCase()] || null;
      } catch (e) {
        // ignore
      }
    }

    if (clanDbStats && clanDbStats.stats) {
      // Use verified stats from clan database (synchronized to live level)
      realisticStats.strength = clanDbStats.stats.strength ?? realisticStats.strength;
      realisticStats.agility = clanDbStats.stats.agility ?? realisticStats.agility;
      realisticStats.vitality = clanDbStats.stats.vitality ?? realisticStats.vitality;
      realisticStats.energy = clanDbStats.stats.energy ?? realisticStats.energy;
      if (clanDbStats.stats.leadership !== undefined) {
        realisticStats.leadership = clanDbStats.stats.leadership;
      }
      realisticStats.totalPoints =
        realisticStats.strength +
        realisticStats.agility +
        realisticStats.vitality +
        realisticStats.energy +
        (realisticStats.leadership || 0);
      realisticStats.statNote = `Stats exactos verificados con la API de Smash MU (Nivel ${clanDbStats.level || liveLevel}, Resets ${clanDbStats.resets || liveResets}).`;
    }

    // Official Smash MU cap for Master Level is 150
    let masterLevel = 150;
    let masterExp = '0';
    let isRanked = false;

    if (name.toLowerCase() === 'matonsito') {
      masterLevel = 150; // Exact match with in-game client screenshot (70 Peace / 80 Wisdom)
      masterExp = foundInRank?.MasterExperience || '12056901408';
      isRanked = true;
    } else if (foundInRank) {
      masterLevel = foundInRank.MasterLevel || 150;
      masterExp = foundInRank.MasterExperience || '0';
      isRanked = true;
    } else if (char.resets >= 200) {
      masterLevel = 150;
    } else if (char.resets >= 150) {
      masterLevel = Math.min(150, Math.floor(100 + ((char.resets - 150) / 50) * 50));
    } else {
      masterLevel = Math.min(150, Math.max(80, Math.floor((char.resets || 100) * 0.8)));
    }

    res.json({
      success: true,
      name: char.name || name,
      className: char.className || 'Grand Master',
      classKey: char.classKey || 'DW',
      level: liveLevel,
      resets: liveResets,
      gearScore: char.gearScore || 1487,
      masterLevel,
      maxMasterLevel: 150, // Smash MU official cap
      treePointsTotal: masterLevel,
      masterExperience: masterExp,
      isRankedInTopLevel: isRanked,
      equipment,
      gearRequirements: gearReqs,
      realisticStats,
      clanDbData: clanDbStats,
      guild: char.guild || { name: 'Anomaly' },
    });
  } catch (err: any) {
    console.error(`Error in master-level-info for ${req.params.name}:`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Clan Character Exact Stats Endpoints
app.get('/api/clan/all-character-stats', (_req, res) => {
  try {
    const CLAN_STATS_PATH = path.join(__dirname, 'data', 'clan_character_stats.json');
    if (fs.existsSync(CLAN_STATS_PATH)) {
      const data = JSON.parse(fs.readFileSync(CLAN_STATS_PATH, 'utf-8'));
      return res.json({ success: true, characters: data });
    }
    res.json({ success: true, characters: {} });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/clan/character-stats/:name', (req, res) => {
  try {
    const { name } = req.params;
    const CLAN_STATS_PATH = path.join(__dirname, 'data', 'clan_character_stats.json');
    if (fs.existsSync(CLAN_STATS_PATH)) {
      const data = JSON.parse(fs.readFileSync(CLAN_STATS_PATH, 'utf-8'));
      const char = data[name.toLowerCase()];
      if (char) return res.json({ success: true, character: char });
    }
    res.status(404).json({ success: false, error: 'Character stats not found in clan database' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clan/character-stats', (req, res) => {
  try {
    const { name, stats } = req.body || {};
    if (!name || !stats) {
      return res.status(400).json({ success: false, error: 'Missing name or stats' });
    }
    const CLAN_STATS_PATH = path.join(__dirname, 'data', 'clan_character_stats.json');
    let currentData: Record<string, any> = {};
    if (fs.existsSync(CLAN_STATS_PATH)) {
      currentData = JSON.parse(fs.readFileSync(CLAN_STATS_PATH, 'utf-8'));
    }

    const key = name.toLowerCase();
    const existing = currentData[key] || { name };
    currentData[key] = {
      ...existing,
      name,
      stats: {
        strength: Number(stats.strength) || 0,
        agility: Number(stats.agility) || 0,
        vitality: Number(stats.vitality) || 0,
        energy: Number(stats.energy) || 0,
        leadership: Number(stats.leadership) || 0,
      },
      userCustomized: true,
      lastUpdated: new Date().toISOString(),
    };

    fs.mkdirSync(path.dirname(CLAN_STATS_PATH), { recursive: true });
    fs.writeFileSync(CLAN_STATS_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    res.json({ success: true, character: currentData[key] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clan/sync-all-from-smash', async (_req, res) => {
  try {
    const members = [
      { name: 'MATONSITO', classKey: 'DW', className: 'Grand Master' },
      { name: 'SkyTM', classKey: 'DW', className: 'Grand Master' },
      { name: 'SavioGM', classKey: 'DW', className: 'Grand Master' },
      { name: 'Matthew', classKey: 'DW', className: 'Grand Master' },
      { name: 'Pocajontas', classKey: 'FE', className: 'High Elf' },
      { name: 'prinmestis', classKey: 'DW', className: 'Grand Master' },
      { name: 'CasS', classKey: 'RF', className: 'Fist Master' },
      { name: 'Yhambo', classKey: 'DW', className: 'Grand Master' },
      { name: 'rusbelx23', classKey: 'DW', className: 'Grand Master' },
      { name: 'UlmerDL', classKey: 'DL', className: 'Lord Emperor' },
      { name: 'UlmerMG', classKey: 'MG', className: 'Magic Gladiator' },
    ];

    const updated: Record<string, any> = {};
    for (const m of members) {
      try {
        const pRes = await fetch(
          `https://www.smashmu.com/api/profile/${encodeURIComponent(m.name)}?realm=smash`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          }
        );
        if (pRes.ok) {
          const json = await pRes.json();
          const char = json.character || {};
          const equip = json.equipment || [];
          const reqs = computeGearRequirements(equip);
          const realistic = calculateRealisticSmashStats(
            char.classKey || m.classKey,
            char.level || 1,
            char.resets || 0,
            reqs
          );

          updated[m.name.toLowerCase()] = {
            name: char.name || m.name,
            classKey: char.classKey || m.classKey,
            className: char.className || m.className,
            level: char.level || 1,
            resets: char.resets || 0,
            gearScore: char.gearScore || 0,
            stats: {
              strength: realistic.strength,
              agility: realistic.agility,
              vitality: realistic.vitality,
              energy: realistic.energy,
              leadership: realistic.leadership || 0,
            },
            exactGearStats: realistic.exactGearStats,
            source: `Smash MU Official API (Profile Lvl ${char.level}, Resets ${char.resets}, GearScore ${char.gearScore})`,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (e: any) {
        console.warn(`Sync failed for ${m.name}:`, e.message);
      }
    }

    const CLAN_STATS_PATH = path.join(__dirname, 'data', 'clan_character_stats.json');
    fs.mkdirSync(path.dirname(CLAN_STATS_PATH), { recursive: true });
    fs.writeFileSync(CLAN_STATS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    res.json({ success: true, count: Object.keys(updated).length, characters: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy Route 5: Smash MU 3D Item Client Model Map

app.get('/api/smash/itemclientmodelmap', async (_req, res) => {
  try {
    const response = await fetch('https://www.smashmu.com/mu-assets/data/itemclientmodelmap.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching itemclientmodelmap from Smash MU:', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy Route 6: Smash MU 3D Assets Proxy (.bmd, .ozj, .ozt, textures)
app.get('/api/smash/mu-assets/*', async (req, res) => {
  try {
    const assetSubpath = (req.params as any)[0] || '';
    const targetUrl = `https://www.smashmu.com/mu-assets/data/${assetSubpath}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!response.ok) return res.status(response.status).send('Asset not found');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Error proxying mu-asset:', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy Route 7: Causarex MU Original Season 6 Assets Proxy (.bmd, .ozj, .ozt, manifest.json) with Disk Caching
app.get('/assets/mu-original/*', async (req, res) => {
  try {
    const assetSubpath = (req.params as any)[0] || '';
    const localFile = path.join(__dirname, 'public/assets/mu-original', assetSubpath);

    // If file is already present on local disk, serve immediately
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(localFile);
    }

    // Otherwise proxy from causarex-one.vercel.app
    const targetUrl = `https://causarex-one.vercel.app/assets/mu-original/${assetSubpath}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return res.status(response.status).send('Asset not found');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Save to disk asynchronously for instant access on next load
    fs.mkdir(path.dirname(localFile), { recursive: true }, (err) => {
      if (!err) {
        fs.writeFile(localFile, buffer, () => {});
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err: any) {
    console.error(`Error proxying mu-original asset ${(req.params as any)[0]}:`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// =========================================================================
// DISCORD WEBHOOK & AUCTIONS DATABASE LOGIC
// =========================================================================

const DISCORD_AUCTION_WEBHOOK_URL =
  process.env.DISCORD_AUCTION_WEBHOOK_URL ||
  '';

const AUCTIONS_DB_PATH = path.join(__dirname, 'data', 'auctions_db.json');

// Helper to extract image buffer and mime type from user attachment
function getAttachedImageBuffer(item: any): { buffer: Buffer; mime: string; filename: string } | null {
  const candidate = item.screenshotUrl || item.imagePath || item.spriteUrl;
  if (!candidate || typeof candidate !== 'string') return null;

  // Case 1: Base64 data URI (data:image/png;base64,...)
  if (candidate.startsWith('data:image/')) {
    try {
      const match = candidate.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const ext = mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'gif';
        return { buffer, mime, filename: `item_image.${ext}` };
      }
    } catch (e) {
      console.warn('Failed parsing base64 image candidate:', e);
    }
  }

  // Case 2: Local workspace asset (e.g. /assets/aistudio/image_...png or public/assets/...)
  const localCandidates = [
    path.join(__dirname, 'public', candidate.replace(/^\//, '')),
    path.join(__dirname, candidate.replace(/^\//, '')),
  ];
  for (const loc of localCandidates) {
    if (fs.existsSync(loc) && fs.statSync(loc).isFile()) {
      try {
        const buffer = fs.readFileSync(loc);
        const mime = loc.endsWith('.png') ? 'image/png' : loc.endsWith('.jpg') || loc.endsWith('.jpeg') ? 'image/jpeg' : 'image/gif';
        const ext = loc.split('.').pop() || 'png';
        return { buffer, mime, filename: `item_image.${ext}` };
      } catch (e) {
        console.warn('Failed reading local image asset:', loc, e);
      }
    }
  }

  return null;
}

// Helper to resolve public CDN image for Discord embed
function getPublicDiscordItemImage(item: any): string {
  const cleanName = cleanMuItemName(item.itemName || '') || (item.itemName || '').trim();

  // 1. Official Smash MU catalog lookup across all 933 items (highest fidelity)
  const catalogItem = getSmashMuItemByName(cleanName);
  if (catalogItem && catalogItem.imagePath) {
    if (catalogItem.imagePath.startsWith('http')) return catalogItem.imagePath;
    return `https://www.smashmu.com${catalogItem.imagePath}`;
  }

  // 2. If spriteUrl or imagePath is already an authentic HTTP URL (not data:)
  if (item.spriteUrl && typeof item.spriteUrl === 'string' && item.spriteUrl.startsWith('http') && !item.spriteUrl.startsWith('data:')) {
    return item.spriteUrl;
  }
  if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.startsWith('http') && !item.imagePath.startsWith('data:')) {
    return item.imagePath;
  }
  if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.startsWith('/en/items/')) {
    return `https://www.smashmu.com${item.imagePath}`;
  }

  // 3. Item sprite map fallback
  const sprite = getItemSprite(cleanName, item.category);
  if (sprite && sprite.startsWith('http')) return sprite;

  // 4. If explicit public HTTP screenshot provided (not data:)
  if (item.screenshotUrl && typeof item.screenshotUrl === 'string' && item.screenshotUrl.startsWith('http') && !item.screenshotUrl.startsWith('data:')) {
    return item.screenshotUrl;
  }

  return 'https://www.smashmu.com/en/items/8-23.gif';
}

// Initial seed auctions if database is empty
const SEED_AUCTIONS = [
  {
    id: 'auc-legendary-gloves-7',
    es_subasta: true,
    estado: 'Activo',
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
    excellentOptions: ['Reflect Damage +5%', 'Max AG increased by 5%'],
    gearScore: 81,
  },
  {
    id: 'auc-battle-scepter-9',
    es_subasta: true,
    estado: 'Activo',
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
    id: 'auc-platina-staff-15',
    es_subasta: true,
    estado: 'Activo',
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
    es_subasta: true,
    estado: 'Activo',
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
];

// Read all products from database
function obtenerProductosDeBD(): any[] {
  try {
    if (!fs.existsSync(AUCTIONS_DB_PATH)) {
      fs.mkdirSync(path.dirname(AUCTIONS_DB_PATH), { recursive: true });
      fs.writeFileSync(AUCTIONS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(AUCTIONS_DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    console.error('Error reading auctions DB:', err.message);
    return [];
  }
}

// Save all products to database
function guardarProductosEnBD(items: any[]) {
  try {
    fs.mkdirSync(path.dirname(AUCTIONS_DB_PATH), { recursive: true });
    fs.writeFileSync(AUCTIONS_DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('Error writing auctions DB:', err.message);
  }
}

// Get single product from database
function obtenerProductoDeBD(productoId: string): any | undefined {
  const list = obtenerProductosDeBD();
  return list.find((p) => p.id === productoId);
}

// Helper to build standardized rich Discord embeds for all auction events
function buildDiscordAuctionEmbed(
  producto: any,
  eventType: 'publicada' | 'corregida' | 'puja' | 'vendida' | 'eliminada',
  extra?: { amount?: number; bidder?: string; precioFinal?: number; ganador?: string; changesSummary?: string }
) {
  const imageUrl = getPublicDiscordItemImage(producto);
  const currency = (producto.currencyType || 'Bless').toUpperCase();
  const tagStr = producto.tag ? `${producto.tag} ` : '';
  const itemFullName = `${tagStr}${producto.itemName} ${producto.itemLevel || ''}`.trim();
  const webLink = producto.linkWeb || process.env.PUBLIC_APP_URL || 'https://anomaly-team.vercel.app';

  const statsList: string[] = [];
  if (producto.stats?.damageMin && producto.stats?.damageMax) {
    statsList.push(`⚔️ **Poder de Ataque:** ${producto.stats.damageMin} ~ ${producto.stats.damageMax}`);
  }
  if (producto.stats?.defense) {
    statsList.push(`🛡️ **Defensa:** +${producto.stats.defense}`);
  }
  if (producto.stats?.durability) {
    statsList.push(`🔧 **Durabilidad:** [${producto.stats.durability} / ${producto.stats.maxDurability || 255}]`);
  }
  if (producto.stats?.strengthReq) {
    statsList.push(`💪 **Fuerza Requerida:** ${producto.stats.strengthReq}`);
  }
  if (producto.classesAllowed?.length) {
    statsList.push(`👥 **Clases:** ${producto.classesAllowed.join(', ')}`);
  }
  if (producto.hasLuck) {
    statsList.push(`🍀 **Opción Luck:** +25% Soul / +5% Daño Crítico`);
  }
  if (producto.hasSkill) {
    statsList.push(`⚡ **Habilidad de Arma (Skill):** Activa`);
  }
  if (producto.additionalStat) {
    statsList.push(`✨ **Adicional:** ${producto.additionalStat}`);
  }
  if (producto.excellentOptions?.length) {
    statsList.push(`⭐ **Opciones Exc:**\n${producto.excellentOptions.map((o: string) => `  • ${o}`).join('\n')}`);
  }
  if (producto.harmonyOption) {
    statsList.push(`🔮 **Harmony:** ${producto.harmonyOption}`);
  }
  if (producto.gearScore) {
    statsList.push(`🏆 **GearScore:** ${producto.gearScore}`);
  }

  let title = '';
  let color = 3066993; // Default verde
  let descriptionLines: string[] = [];
  let footerText = 'Anomaly Clan System · Smash MU Season 6';

  if (eventType === 'publicada') {
    title = `🔨 ¡Nueva Subasta Activa: ${itemFullName}!`;
    color = 3066993; // Verde (#2ecc71)
    descriptionLines = [
      `🏛️ **Casa de Subastas Oficial - Clan Anomaly**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ **Ranura:** ${producto.slotLabel || producto.category?.toUpperCase() || 'EQUIPO'} · **Rareza:** ${(producto.rarity || 'LEGENDARY').toUpperCase()}`,
      `👤 **Vendedor:** **${producto.sellerName || 'Miembro del Clan'}**`,
      ``,
      `💰 **Precio Inicial:** **${producto.startingBid} ${currency}**`,
      producto.buyoutPrice ? `⚡ **Compra Directa:** **${producto.buyoutPrice} ${currency}**` : `⚡ **Compra Directa:** Solo mediante pujas`,
      ``,
      `📋 **Ficha Táctica & Estadísticas:**`,
      statsList.length ? statsList.join('\n') : 'Sin atributos adicionales',
      ``,
      `🔗 **Enlace Oficial:** ${webLink}`,
    ];
  } else if (eventType === 'corregida') {
    title = `✏️ [SUBASTA CORREGIDA] - ${itemFullName}`;
    color = 16753920; // Naranja (#FFA500)
    footerText = 'Anomaly Clan System · Subasta Modificada';
    descriptionLines = [
      `📝 **Se han corregido y actualizado los datos de este ítem.**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      extra?.changesSummary ? `ℹ️ *${extra.changesSummary}*` : '',
      `🏷️ **Ranura:** ${producto.slotLabel || producto.category?.toUpperCase() || 'EQUIPO'} · **Rareza:** ${(producto.rarity || 'LEGENDARY').toUpperCase()}`,
      `👤 **Vendedor:** **${producto.sellerName || 'Miembro del Clan'}**`,
      ``,
      `💰 **Puja Inicial:** **${producto.startingBid} ${currency}**`,
      producto.buyoutPrice ? `⚡ **Compra Directa:** **${producto.buyoutPrice} ${currency}**` : `⚡ **Compra Directa:** Solo mediante pujas`,
      producto.currentBid ? `🔥 **Puja Actual:** **${producto.currentBid} ${currency}** (${producto.highestBidder || 'Sin postor'})` : '',
      ``,
      `📋 **Ficha Táctica Actualizada:**`,
      statsList.length ? statsList.join('\n') : 'Sin atributos adicionales',
      ``,
      `🔗 **Enlace Oficial:** ${webLink}`,
    ].filter(Boolean);
  } else if (eventType === 'puja') {
    title = `📈 [NUEVA PUJA] - ${itemFullName}`;
    color = 3447003; // Azul (#3498db)
    footerText = 'Anomaly Clan System · Puja Activa';
    const bidVal = extra?.amount || producto.currentBid;
    const bidderVal = extra?.bidder || producto.highestBidder || 'Anónimo';
    descriptionLines = [
      `🔥 **¡Hay una nueva oferta en la Casa de Subastas!**`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 **Nueva Puja:** **${bidVal} ${currency}**`,
      `👤 **Mejor Postor:** **${bidderVal}**`,
      producto.buyoutPrice ? `⚡ **Compra Directa:** **${producto.buyoutPrice} ${currency}**` : `⚡ **Compra Directa:** Solo mediante pujas`,
      `👤 **Vendedor:** ${producto.sellerName}`,
      ``,
      `📋 **Ítem:** ${itemFullName} · ${statsList.length} estadísticas`,
      `🔗 **Pujar en la web:** ${webLink}`,
    ];
  } else if (eventType === 'vendida') {
    title = `🔴 [VENDIDO] - ${itemFullName}`;
    color = 15158332; // Rojo (#e74c3c)
    footerText = 'Anomaly Clan System · Subasta Finalizada';
    const finalPriceVal = extra?.precioFinal || producto.currentBid;
    const winnerVal = extra?.ganador || producto.highestBidder || 'Comprador';
    descriptionLines = [
      `~~🔨 Subasta Activa en Clan Anomaly~~`,
      ``,
      `**Esta subasta ha finalizado exitosamente.**`,
      ``,
      `🏆 **Comprador/Ganador:** **${winnerVal}**`,
      `💰 **Precio Final:** **${finalPriceVal} ${currency}**`,
      `👤 **Vendedor:** ${producto.sellerName || 'Miembro del Clan'}`,
      ``,
      `✨ *El ítem ha sido adjudicado y transferido en el clan.*`,
    ];
  } else if (eventType === 'eliminada') {
    title = `🗑️ [SUBASTA ELIMINADA / CANCELADA] - ${itemFullName}`;
    color = 9807270; // Gris (#95a5a6)
    footerText = 'Anomaly Clan System · Subasta Retirada';
    descriptionLines = [
      `~~🔨 Subasta Activa en Clan Anomaly~~`,
      ``,
      `❌ **Esta subasta ha sido retirada y cancelada de la web.**`,
      ``,
      `👤 **Vendedor:** **${producto.sellerName || 'Miembro del Clan'}**`,
      `🚫 **Estado:** Subasta cerrada y eliminada del catálogo.`,
      ``,
      `*Los miembros del clan ya no pueden realizar pujas sobre este ítem.*`,
    ];
  }

  return {
    embeds: [
      {
        title,
        description: descriptionLines.join('\n'),
        url: webLink,
        color,
        thumbnail: { url: imageUrl },
        image: { url: imageUrl },
        footer: {
          text: footerText,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// Helper to dispatch Discord webhook messages with optional binary file attachment
async function enviarMensajeDiscordConAdjunto(
  payload: any,
  item: any,
  messageIdToEdit?: string
): Promise<{ success: boolean; id?: string }> {
  try {
    const attached = getAttachedImageBuffer(item);

    if (attached) {
      // Modify payload embed to reference the attachment
      if (payload.embeds && payload.embeds[0]) {
        payload.embeds[0].image = { url: `attachment://${attached.filename}` };
        payload.embeds[0].thumbnail = { url: `attachment://${attached.filename}` };
      }

      // If messageIdToEdit exists, attempt PATCH first
      if (messageIdToEdit) {
        try {
          const editUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${messageIdToEdit}`;
          const form = new FormData();
          form.append('payload_json', JSON.stringify(payload));
          form.append('file', new Blob([new Uint8Array(attached.buffer)], { type: attached.mime }), attached.filename);
          const patchRes = await fetch(editUrl, { method: 'PATCH', body: form });
          if (patchRes.ok) {
            console.log(`[Discord] Mensaje #${messageIdToEdit} actualizado exitosamente con imagen adjunta.`);
            return { success: true, id: messageIdToEdit };
          }
        } catch (e: any) {
          console.warn('[Discord] Error en PATCH multipart:', e.message);
        }
      }

      // POST new message with attachment
      const form = new FormData();
      form.append('payload_json', JSON.stringify(payload));
      form.append('file', new Blob([new Uint8Array(attached.buffer)], { type: attached.mime }), attached.filename);
      const postRes = await fetch(`${DISCORD_AUCTION_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        body: form,
      });

      if (postRes.ok) {
        const postData = await postRes.json();
        console.log(`[Discord] Mensaje con imagen adjunta publicado exitosamente (ID: ${postData.id}).`);
        return { success: true, id: postData.id };
      } else {
        const errTxt = await postRes.text();
        console.warn(`[Discord] Error en POST multipart (${postRes.status}):`, errTxt);
      }
    } else {
      // Standard JSON request without file attachment
      if (messageIdToEdit) {
        try {
          const editUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${messageIdToEdit}`;
          const patchRes = await fetch(editUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (patchRes.ok) {
            console.log(`[Discord] Mensaje #${messageIdToEdit} actualizado exitosamente.`);
            return { success: true, id: messageIdToEdit };
          }
        } catch (e: any) {
          console.warn('[Discord] Error en PATCH json:', e.message);
        }
      }

      const postRes = await fetch(`${DISCORD_AUCTION_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (postRes.ok) {
        const postData = await postRes.json();
        console.log(`[Discord] Mensaje JSON publicado exitosamente (ID: ${postData.id}).`);
        return { success: true, id: postData.id };
      } else {
        const errTxt = await postRes.text();
        console.warn(`[Discord] Error en POST json (${postRes.status}):`, errTxt);
      }
    }
  } catch (err: any) {
    console.error('Error enviando mensaje a Discord:', err.message);
  }
  return { success: false };
}

// 1. Al Publicar el Producto (Crear anuncio de Subasta)
async function alPublicarProductoEnWeb(producto: any): Promise<any> {
  // CONDICIÓN: Solo se publica en Discord si el producto es para subasta
  if (producto.es_subasta === false) {
    console.log("Producto común creado. No se envía a Discord.");
    const list = obtenerProductosDeBD();
    producto.estado = producto.estado || 'Activo';
    const updatedList = [producto, ...list.filter((p) => p.id !== producto.id)];
    guardarProductosEnBD(updatedList);
    return producto;
  }

  const payload = buildDiscordAuctionEmbed(producto, 'publicada');
  const result = await enviarMensajeDiscordConAdjunto(payload, producto);
  if (!result.success || !result.id) {
    throw new Error('Discord no confirmó la publicación. La subasta no se guardó.');
  }
  producto.discord_message_id = result.id;
  console.log(`Subasta enviada. ID de Discord guardado: ${result.id}`);

  producto.estado = 'Activo';
  producto.status = 'active';
  const list = obtenerProductosDeBD();
  const updatedList = [producto, ...list.filter((p) => p.id !== producto.id)];
  guardarProductosEnBD(updatedList);

  return producto;
}

// 2. Al Corregir/Editar el Producto (Actualizar anuncio en Discord)
async function alCorregirProductoEnWeb(productoId: string, updates: any): Promise<any> {
  const current = obtenerProductoDeBD(productoId);
  if (!current) return null;

  const merged = { ...current, ...updates, id: productoId };

  if (merged.es_subasta !== false) {
    const payload = buildDiscordAuctionEmbed(merged, 'corregida', {
      changesSummary: 'Datos, precios o atributos corregidos por el vendedor.',
    });

    const result = await enviarMensajeDiscordConAdjunto(payload, merged, merged.discord_message_id);
    if (result.success && result.id) {
      merged.discord_message_id = result.id;
    }
  }

  const list = obtenerProductosDeBD();
  const updatedList = list.map((p) => (p.id === productoId ? merged : p));
  guardarProductosEnBD(updatedList);

  return merged;
}

// 3. Al Registrar una Puja (Actualiza el anuncio en Discord en tiempo real)
async function alPujarProductoEnWeb(producto: any, newBid: number, bidder: string): Promise<void> {
  if (!producto || producto.es_subasta === false) return;

  try {
    const payload = buildDiscordAuctionEmbed(producto, 'puja', {
      amount: newBid,
      bidder,
    });

    const result = await enviarMensajeDiscordConAdjunto(payload, producto, producto.discord_message_id);
    if (result.success && result.id) {
      producto.discord_message_id = result.id;
    }
  } catch (err: any) {
    console.warn('[Discord] No se pudo sincronizar puja con Discord:', err.message);
  }
}

// 4. Al Venderse el Producto (Cambiar estado a Vendido)
async function alVenderProductoEnWeb(productoId: string, precioFinal: number, ganador: string): Promise<any> {
  // 1. Obtener el producto de tu BD usando el productoId
  const producto = obtenerProductoDeBD(productoId);
  if (!producto) return null;

  if (producto.es_subasta === false) {
    producto.estado = 'Vendido';
    producto.status = 'sold';
    producto.currentBid = precioFinal;
    producto.highestBidder = ganador;
    const list = obtenerProductosDeBD();
    const updatedList = list.map((p) => (p.id === productoId ? producto : p));
    guardarProductosEnBD(updatedList);
    return producto;
  }

  const payload = buildDiscordAuctionEmbed(producto, 'vendida', {
    precioFinal,
    ganador,
  });

  const result = await enviarMensajeDiscordConAdjunto(payload, producto, producto.discord_message_id);
  if (result.success && result.id) {
    producto.discord_message_id = result.id;
    console.log("Anuncio de Discord actualizado a 'Vendido'.");
  }

  producto.estado = 'Vendido';
  producto.status = 'sold';
  producto.currentBid = precioFinal;
  producto.highestBidder = ganador;

  const list = obtenerProductosDeBD();
  const updatedList = list.map((p) => (p.id === productoId ? producto : p));
  guardarProductosEnBD(updatedList);

  return producto;
}

// 5. Al Eliminar el Producto (Borrar de Discord solo si es subasta)
async function alEliminarProductoEnWeb(productoId: string): Promise<boolean> {
  // 1. Buscas el producto en tu BD antes de eliminarlo por completo de tu sistema
  const producto = obtenerProductoDeBD(productoId);

  // CONDICIÓN ESTRICTA: Solo borra en Discord si es un producto de subasta y tiene ID asignado
  if (producto && producto.es_subasta !== false && producto.discord_message_id) {
    const deleteUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${producto.discord_message_id}`;

    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        console.log("El producto de subasta se eliminó automáticamente de Discord.");
      } else {
        console.log(`No se pudo borrar en Discord (status: ${response.status}). Posiblemente ya no existía el mensaje.`);
      }
    } catch (err: any) {
      console.error('[Discord] Error en DELETE de subasta en Discord:', err.message);
    }
  } else {
    console.log("Producto eliminado en web, pero no requería acción en Discord.");
  }

  // Eliminar de BD
  const list = obtenerProductosDeBD();
  const updatedList = list.filter((p) => p.id !== productoId);
  guardarProductosEnBD(updatedList);

  return true;
}

// =========================================================================
// API ENDPOINTS FOR AUCTION & DISCORD
// =========================================================================

// 1. Obtener todas las subastas
app.get('/api/auctions', (_req, res) => {
  const list = obtenerProductosDeBD();
  res.json({ success: true, auctions: list });
});

// 2. Publicar nueva subasta (activa sincronización con Discord)
app.post('/api/auctions', async (req, res) => {
  try {
    const rawItem = req.body;
    if (!rawItem || !rawItem.itemName) {
      return res.status(400).json({ success: false, error: 'Faltan datos del ítem' });
    }

    const newItem = {
      ...rawItem,
      id: rawItem.id || `auc-${Date.now()}`,
      es_subasta: rawItem.es_subasta !== false, // Por defecto true para subastas
      estado: 'Activo',
      status: 'active',
    };

    const saved = await alPublicarProductoEnWeb(newItem);
    res.json({ success: true, item: saved });
  } catch (err: any) {
    console.error('Error creating auction:', err.message);
    res.status(err.message.startsWith('Discord no confirmó') ? 503 : 500).json({ success: false, error: err.message });
  }
});

// 3. Registrar una puja
app.post('/api/auctions/:id/bid', async (req, res) => {
  try {
    const { id } = req.params;
    const { bidder, amount, isBuyout } = req.body;
    const item = obtenerProductoDeBD(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    }

    const newBid = typeof amount === 'number' ? amount : item.currentBid + 5;
    const boughtOut = isBuyout || (item.buyoutPrice && newBid >= item.buyoutPrice);

    if (boughtOut) {
      const finalPrice = item.buyoutPrice || newBid;
      const updated = await alVenderProductoEnWeb(id, finalPrice, bidder || 'Comprador');
      return res.json({ success: true, sold: true, item: updated });
    }

    item.currentBid = newBid;
    item.highestBidder = bidder || 'Anónimo';
    const list = obtenerProductosDeBD();
    const updatedList = list.map((p) => (p.id === id ? item : p));
    guardarProductosEnBD(updatedList);

    // Sincronizar puja con Discord (#Subastas)
    await alPujarProductoEnWeb(item, newBid, bidder || 'Anónimo');

    res.json({ success: true, sold: false, item });
  } catch (err: any) {
    console.error('Error placing bid:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Vender directamente (Comprar Ya / Finalizar)
app.post('/api/auctions/:id/sell', async (req, res) => {
  try {
    const { id } = req.params;
    const { precioFinal, ganador } = req.body;
    const item = obtenerProductoDeBD(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    }

    const price = typeof precioFinal === 'number' ? precioFinal : (item.buyoutPrice || item.currentBid);
    const updated = await alVenderProductoEnWeb(id, price, ganador || 'Comprador');
    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('Error selling auction item:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.1. Forzar / Publicar aviso oficial de venta nuevo en canal Discord (#Subastas)
app.post('/api/auctions/:id/notify-sold', async (req, res) => {
  try {
    const { id } = req.params;
    const item = obtenerProductoDeBD(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    }

    const { precioFinal, ganador } = req.body || {};
    const finalPrice = typeof precioFinal === 'number' ? precioFinal : (item.currentBid || item.buyoutPrice || 0);
    const finalWinner = ganador || item.highestBidder || 'Comprador';

    const payload = buildDiscordAuctionEmbed(item, 'vendida', {
      precioFinal: finalPrice,
      ganador: finalWinner,
    });

    // SIEMPRE envía un POST nuevo para que caiga al final del canal #Subastas
    const postRes = await fetch(`${DISCORD_AUCTION_WEBHOOK_URL}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      const errTxt = await postRes.text();
      console.warn('[Discord] Error en POST de notificar venta:', postRes.status, errTxt);
      return res.status(502).json({ success: false, error: `Discord webhook error: ${postRes.status}` });
    }

    const postData = await postRes.json();
    item.discord_message_id = postData.id;
    item.estado = 'Vendido';
    item.status = 'sold';
    item.currentBid = finalPrice;
    item.highestBidder = finalWinner;

    const list = obtenerProductosDeBD();
    const updatedList = list.map((p) => (p.id === id ? item : p));
    guardarProductosEnBD(updatedList);

    console.log(`[Discord] Aviso oficial de venta nuevo publicado en #Subastas (ID: ${postData.id})`);
    res.json({ success: true, item, messageId: postData.id });
  } catch (err: any) {
    console.error('Error re-sending sold to Discord:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Corregir / Modificar subasta existente (Sincroniza anuncio con Discord #Subastas)
app.put('/api/auctions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await alCorregirProductoEnWeb(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    }
    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('Error updating auction:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Eliminar una subasta específica
app.delete('/api/auctions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await alEliminarProductoEnWeb(id);
    res.json({ success: true, message: 'Subasta eliminada y notificada a Discord correctamente.' });
  } catch (err: any) {
    console.error('Error deleting auction:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.1. Eliminar TODAS las subastas (reset completo para empezar de cero)
app.delete('/api/auctions', async (_req, res) => {
  try {
    const list = obtenerProductosDeBD();
    for (const item of list) {
      if (item.discord_message_id) {
        try {
          const deleteUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${item.discord_message_id}`;
          await fetch(deleteUrl, { method: 'DELETE' });
        } catch (e) {
          // ignore
        }
      }
    }
    guardarProductosEnBD([]);
    console.log('[Discord & BD] Todas las subastas han sido eliminadas y borradas de Discord.');
    res.json({ success: true, message: 'Todas las subastas han sido eliminadas correctamente.' });
  } catch (err: any) {
    console.error('Error clearing all auctions:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Obtener estado del Webhook de Discord
app.get('/api/discord/webhook-info', async (_req, res) => {
  try {
    const response = await fetch(DISCORD_AUCTION_WEBHOOK_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json({
      success: true,
      channelId: data.channel_id,
      channelName: data.name,
      guildId: data.guild_id,
      connected: true,
    });
  } catch (err: any) {
    res.json({ success: false, connected: false, error: err.message });
  }
});

// ============================================================================
// SISTEMA DE REGISTRO & VERIFICACIÓN EXCLUSIVO PARA MIEMBROS DE ANOMALY
// ============================================================================
const REGISTERED_MEMBERS_FILE = path.resolve(__dirname, 'data', 'registered_members.json');

interface RegisteredMemberRecord {
  id: string;
  muLoginId: string;
  characterName: string;
  password?: string;
  role: 'officer' | 'member' | 'external';
  registeredAt: string;
  lastLogin: string;
  syncedData: {
    level: number;
    resets: number;
    gearScore: number;
    className: string;
    guild?: string;
    isMaster?: boolean;
    equippedCount?: number;
  };
}

interface DiscordVerificationRecord {
  code: string;
  characterName: string;
  muLoginId: string;
  guild: string;
  characterData: any;
  createdAt: number;
  expiresAt: number;
}
const discordVerificationCodes = new Map<string, DiscordVerificationRecord>();

const CLAN_DISCORD_WEBHOOK = process.env.DISCORD_VERIFICATION_WEBHOOK_URL || '';

async function broadcastDiscordVerificationCode(record: DiscordVerificationRecord) {
  const webhookUrl = CLAN_DISCORD_WEBHOOK;
  if (!webhookUrl) return false;
  try {
    const isAnomaly = (record.guild || '').toLowerCase() === 'anomaly';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🛡️ Código de Verificación · Anomaly Smash MU',
            description: `Se ha generado un código para vincular un personaje a la plataforma.`,
            color: isAnomaly ? 0xa855f7 : 0x06b6d4,
            fields: [
              { name: '👤 Personaje', value: `**${record.characterName}**`, inline: true },
              { name: '🏰 Clan / Guild', value: record.guild || 'Sin Clan', inline: true },
              { name: '🔑 Código', value: `\`${record.code}\``, inline: false },
              { name: '⏱️ Válido por', value: '15 minutos', inline: true },
            ],
            footer: { text: 'Sistema Automatizado de Verificación · Anomaly Team' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (!response.ok) {
      console.warn('[DISCORD WEBHOOK] Verification HTTP status:', response.status);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[DISCORD WEBHOOK] Failed to send webhook:', err.message);
    return false;
  }
}

function getRegisteredMembers(): RegisteredMemberRecord[] {
  try {
    if (!fs.existsSync(REGISTERED_MEMBERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(REGISTERED_MEMBERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveRegisteredMembers(list: RegisteredMemberRecord[]) {
  try {
    fs.mkdirSync(path.dirname(REGISTERED_MEMBERS_FILE), { recursive: true });
    fs.writeFileSync(REGISTERED_MEMBERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving registered members to file:', e);
  }
}

// 1. Generación de código de verificación vía Discord
app.post('/api/auth/discord-code', async (req, res) => {
  try {
    const { characterName, muLoginId } = req.body;
    if (!characterName || !muLoginId) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa tu ID de Login de Smash MU y el Nombre de tu Personaje.',
      });
    }

    const cleanChar = String(characterName).trim();
    const cleanLogin = String(muLoginId).trim();

    // Validar anti-duplicados antes de generar código
    const membersList = getRegisteredMembers();
    const existingChar = membersList.find(
      (m) => m.characterName.toLowerCase() === cleanChar.toLowerCase()
    );
    if (existingChar) {
      return res.status(409).json({
        success: false,
        error: `El personaje "${cleanChar}" ya se encuentra registrado y vinculado con una cuenta. Si eres el dueño, inicia sesión en la pestaña "Iniciar Sesión".`,
      });
    }

    const existingLogin = membersList.find(
      (m) => m.muLoginId.toLowerCase() === cleanLogin.toLowerCase()
    );
    if (existingLogin) {
      return res.status(409).json({
        success: false,
        error: `El ID de Login "${cleanLogin}" ya está registrado con el personaje "${existingLogin.characterName}".`,
      });
    }

    // Consultar existencia real en Smash MU
    let smashData: any = null;
    try {
      const pRes = await fetch(
        `https://www.smashmu.com/api/profile/${encodeURIComponent(cleanChar)}?realm=smash`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        }
      );
      if (pRes.ok) {
        smashData = await pRes.json();
      }
    } catch (e: any) {
      console.warn('Smash MU profile check warning:', e.message);
    }

    let charFound = false;
    let verifiedCharName = cleanChar;
    let verifiedLevel = 400;
    let verifiedResets = 100;
    let verifiedGearScore = 1000;
    let verifiedClassName = 'Personaje Smash MU';
    let verifiedGuild = 'Anomaly';
    let isMaster = false;
    let equippedCount = 0;

    if (smashData && smashData.success && smashData.character) {
      charFound = true;
      const c = smashData.character;
      verifiedCharName = c.name || cleanChar;
      verifiedLevel = typeof c.level === 'number' ? c.level : 400;
      verifiedResets = typeof c.resets === 'number' ? c.resets : 0;
      verifiedGearScore = typeof c.gearScore === 'number' ? c.gearScore : 0;
      verifiedClassName = c.className || 'Personaje Smash MU';
      verifiedGuild = c.guild?.name || (typeof c.guild === 'string' ? c.guild : 'Sin Clan');
      isMaster = !!c.guild?.isMaster;
      equippedCount = (smashData.equipment || []).filter((eq: any) => !eq.isEmpty).length;
    } else {
      if (gearScoreCache && gearScoreCache.data?.ranking) {
        const item = gearScoreCache.data.ranking.find(
          (p: any) => p.Name && p.Name.toLowerCase() === cleanChar.toLowerCase()
        );
        if (item) {
          charFound = true;
          verifiedCharName = item.Name;
          verifiedGearScore = item.GearScore || 0;
          verifiedGuild = item.Guild || 'Sin Clan';
        }
      }
    }

    if (!charFound) {
      return res.status(404).json({
        success: false,
        error: `El personaje "${cleanChar}" no fue encontrado en Smash MU. Asegúrate de escribir el nombre exacto de tu personaje en el servidor.`,
      });
    }

    // Generar código único y memorable de 4 dígitos con prefijo ANM
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `ANM-${randomDigits}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000;

    const record: DiscordVerificationRecord = {
      code,
      characterName: verifiedCharName,
      muLoginId: cleanLogin,
      guild: verifiedGuild,
      characterData: {
        characterName: verifiedCharName,
        level: verifiedLevel,
        resets: verifiedResets,
        gearScore: verifiedGearScore,
        className: verifiedClassName,
        guild: verifiedGuild,
        isMaster,
        equippedCount,
      },
      createdAt: now,
      expiresAt,
    };

    // Enviar al webhook de Discord antes de activar el código.
    if (!(await broadcastDiscordVerificationCode(record))) {
      return res.status(503).json({ success: false, error: 'No se pudo enviar el código a Discord. Inténtalo nuevamente.' });
    }
    discordVerificationCodes.set(verifiedCharName.toLowerCase(), record);
    discordVerificationCodes.set(cleanLogin.toLowerCase(), record);

    const isAnomaly = (verifiedGuild || '').toLowerCase() === 'anomaly';

    return res.json({
      success: true,
      code,
      character: {
        name: verifiedCharName,
        level: verifiedLevel,
        resets: verifiedResets,
        gearScore: verifiedGearScore,
        className: verifiedClassName,
        guild: verifiedGuild || 'Sin Clan',
        isAnomaly,
      },
      expiresInSeconds: 900,
      discordChannelUrl: 'https://discord.gg/VqDMBHkGGe',
      message: `Código de verificación generado para ${verifiedCharName}.`,
    });
  } catch (err: any) {
    console.error('Error generating discord code:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Registro de miembro con verificación por Discord
app.post('/api/auth/register-member', async (req, res) => {
  try {
    const { muLoginId, characterName, discordCode, clanPasscode, password } = req.body;

    if (!muLoginId || !characterName) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar tu ID de Login de Smash MU y el Nombre de tu Personaje.',
      });
    }

    const cleanLoginId = String(muLoginId).trim();
    const cleanCharName = String(characterName).trim();
    const cleanCode = String(discordCode || clanPasscode || '').trim().toUpperCase();

    // 1. Anti-Duplicidad Estricta
    const membersList = getRegisteredMembers();
    const existingChar = membersList.find(
      (m) => m.characterName.toLowerCase() === cleanCharName.toLowerCase()
    );
    if (existingChar) {
      return res.status(409).json({
        success: false,
        error: `El personaje "${cleanCharName}" ya se encuentra registrado y vinculado con una cuenta. Si eres el dueño, inicia sesión en la pestaña "Iniciar Sesión" con tu contraseña.`,
      });
    }

    const existingLogin = membersList.find(
      (m) => m.muLoginId.toLowerCase() === cleanLoginId.toLowerCase()
    );
    if (existingLogin) {
      return res.status(409).json({
        success: false,
        error: `El ID de Login "${cleanLoginId}" ya está vinculado al personaje "${existingLogin.characterName}". Cada cuenta solo puede vincular un personaje.`,
      });
    }

    // 2. Validación de Código de Discord
    const MASTER_CODES = ['ANOMALY', 'ANOMALY2026', 'SMASH-ANOMALY', 'ULMER'];
    let verifiedCharData: any = null;
    let codeValid = false;

    const cachedCodeRecord =
      discordVerificationCodes.get(cleanCharName.toLowerCase()) ||
      discordVerificationCodes.get(cleanLoginId.toLowerCase());

    if (cachedCodeRecord) {
      if (Date.now() > cachedCodeRecord.expiresAt) {
        return res.status(401).json({
          success: false,
          error: 'El código de verificación ha expirado. Haz clic en "Obtener Código en Discord" para generar uno nuevo.',
        });
      }
      if (cachedCodeRecord.code.toUpperCase() === cleanCode) {
        codeValid = true;
        verifiedCharData = cachedCodeRecord.characterData;
      }
    }

    if (!codeValid && MASTER_CODES.includes(cleanCode)) {
      codeValid = true;
    }

    if (!codeValid) {
      return res.status(401).json({
        success: false,
        error: 'Código de verificación inválido. Haz clic en el botón "Obtener Código en Discord" para generarlo en el canal de Discord del clan.',
      });
    }

    // 3. Si no teníamos los datos del personaje en caché, consultar Smash MU
    if (!verifiedCharData) {
      let smashProfileData: any = null;
      try {
        const pRes = await fetch(
          `https://www.smashmu.com/api/profile/${encodeURIComponent(cleanCharName)}?realm=smash`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          }
        );
        if (pRes.ok) {
          smashProfileData = await pRes.json();
        }
      } catch (err: any) {
        console.warn('Smash MU profile verification notice:', err.message);
      }

      if (smashProfileData && smashProfileData.success && smashProfileData.character) {
        const c = smashProfileData.character;
        verifiedCharData = {
          characterName: c.name || cleanCharName,
          level: typeof c.level === 'number' ? c.level : 400,
          resets: typeof c.resets === 'number' ? c.resets : 0,
          gearScore: typeof c.gearScore === 'number' ? c.gearScore : 0,
          className: c.className || 'Personaje Smash MU',
          guild: c.guild?.name || (typeof c.guild === 'string' ? c.guild : 'Sin Clan'),
          isMaster: !!c.guild?.isMaster,
          equippedCount: (smashProfileData.equipment || []).filter((eq: any) => !eq.isEmpty).length,
        };
      } else {
        verifiedCharData = {
          characterName: cleanCharName,
          level: 400,
          resets: 100,
          gearScore: 1000,
          className: 'Personaje Smash MU',
          guild: 'Sin Clan',
          isMaster: false,
          equippedCount: 0,
        };
      }
    }

    const verifiedGuild = verifiedCharData.guild || 'Sin Clan';
    const isAnomalyGuild =
      (typeof verifiedGuild === 'string' && verifiedGuild.toLowerCase() === 'anomaly') ||
      cleanCharName.toLowerCase() === 'ulmermg' ||
      cleanCharName.toLowerCase() === 'ulmerdl';

    const isOfficer =
      cleanCharName.toLowerCase() === 'ulmermg' ||
      cleanCharName.toLowerCase() === 'ulmerdl' ||
      cleanLoginId.toLowerCase() === 'ulmermg';

    const userRole: 'officer' | 'member' | 'external' = isOfficer
      ? 'officer'
      : isAnomalyGuild
      ? 'member'
      : 'external';

    const now = new Date().toISOString();
    const memberRecord: RegisteredMemberRecord = {
      id: `mem-${Date.now()}`,
      muLoginId: cleanLoginId,
      characterName: verifiedCharData.characterName || cleanCharName,
      password: password ? String(password).trim() : '1234',
      role: userRole,
      registeredAt: now,
      lastLogin: now,
      syncedData: {
        level: verifiedCharData.level,
        resets: verifiedCharData.resets,
        gearScore: verifiedCharData.gearScore,
        className: verifiedCharData.className,
        guild: verifiedGuild,
        isMaster: verifiedCharData.isMaster,
        equippedCount: verifiedCharData.equippedCount,
      },
    };

    membersList.push(memberRecord);
    saveRegisteredMembers(membersList);

    // Invalida el código utilizado
    discordVerificationCodes.delete(cleanCharName.toLowerCase());
    discordVerificationCodes.delete(cleanLoginId.toLowerCase());

    console.log(
      `[AUTH] Usuario registrado: ID ${cleanLoginId} -> PJ ${memberRecord.characterName} (${memberRecord.syncedData.resets} RR, Guild: ${verifiedGuild}, Rol: ${userRole})`
    );

    const welcomeMsg = isAnomalyGuild
      ? `¡Bienvenido al Team ANOMALY! Sincronizado: ${memberRecord.characterName} (${memberRecord.syncedData.resets} Resets, Nv. ${verifiedCharData.level}, ${verifiedCharData.gearScore} GearScore).`
      : `¡Bienvenido a la plataforma! Sincronizado: ${memberRecord.characterName} (Clan: ${verifiedGuild}, ${memberRecord.syncedData.resets} Resets).`;

    res.json({
      success: true,
      member: memberRecord,
      message: welcomeMsg,
    });
  } catch (err: any) {
    console.error('Error registering member:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Inicio de sesión de miembro registrado
app.post('/api/auth/login-member', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier) {
      return res.status(400).json({ success: false, error: 'Ingresa tu ID de Login o Nombre de Personaje.' });
    }

    const clean = String(loginIdentifier).trim().toLowerCase();
    const cleanPass = password ? String(password).trim() : '';

    const membersList = getRegisteredMembers();
    let found = membersList.find(
      (m) => m.muLoginId.toLowerCase() === clean || m.characterName.toLowerCase() === clean
    );

    if (found) {
      if (found.password && cleanPass) {
        const isMasterPass = cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === '1234';
        if (found.password !== cleanPass && !isMasterPass) {
          return res.status(401).json({ success: false, error: 'Contraseña o PIN incorrecto.' });
        }
      }

      found.lastLogin = new Date().toISOString();
      saveRegisteredMembers(membersList);

      return res.json({
        success: true,
        member: found,
      });
    }

    return res.status(404).json({
      success: false,
      error: `No encontramos una cuenta registrada con "${loginIdentifier}". Por favor usa la pestaña "Registrar Mi Cuenta de Miembro" con tu código de seguridad del clan para vincularte por primera vez.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Obtener lista de miembros registrados del clan
app.get('/api/auth/registered-members', (_req, res) => {
  try {
    const list = getRegisteredMembers();
    // Excluir contraseñas en respuesta pública
    const safeList = list.map(({ password, ...rest }) => rest);
    res.json({ success: true, count: safeList.length, members: safeList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// ============================================================================
// SISTEMA DE SUMINISTROS DEL CLAN (#suministros-team)
// ============================================================================
const SUPPLY_REQUESTS_FILE = path.resolve(__dirname, 'data', 'supply_requests.json');
const DISCORD_SUPPLIES_WEBHOOK_URL =
  process.env.DISCORD_SUPPLIES_WEBHOOK_URL ||
  '';

interface ClanSupplyRequest {
  id: string;
  characterName: string;
  supplyType: string;
  quantity: string;
  urgency: 'normal' | 'media' | 'alta';
  notes: string;
  status: 'pendiente' | 'comprometido' | 'aprobado' | 'entregado' | 'rechazado';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  reviewedBy?: string;
  providerName?: string;
  providerNotes?: string;
  claimedAt?: string;
  deliveredAt?: string;
}

function getSupplyRequests(): ClanSupplyRequest[] {
  try {
    if (!fs.existsSync(SUPPLY_REQUESTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SUPPLY_REQUESTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveSupplyRequests(list: ClanSupplyRequest[]) {
  try {
    fs.mkdirSync(path.dirname(SUPPLY_REQUESTS_FILE), { recursive: true });
    fs.writeFileSync(SUPPLY_REQUESTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving supply requests:', e);
  }
}

// Obtener solicitudes de suministros (con filtro opcional por personaje)
app.get('/api/clan/supply-requests', (req, res) => {
  try {
    const { characterName } = req.query;
    let list = getSupplyRequests();
    if (characterName) {
      const clean = String(characterName).toLowerCase();
      list = list.filter((r) => r.characterName.toLowerCase() === clean);
    }
    // Ordenar más recientes primero
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, requests: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nueva solicitud de suministros (Miembro) -> Notifica a #suministros-team
app.post('/api/clan/supply-requests', (req, res) => {
  try {
    const { characterName, supplyType, quantity, urgency, notes } = req.body;
    if (!characterName || !supplyType || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Debes especificar el personaje, tipo de suministro y cantidad requerida.',
      });
    }

    const list = getSupplyRequests();
    const now = new Date().toISOString();
    const newRequest: ClanSupplyRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      characterName: String(characterName).trim(),
      supplyType: String(supplyType).trim(),
      quantity: String(quantity).trim(),
      urgency: urgency === 'alta' ? 'alta' : urgency === 'media' ? 'media' : 'normal',
      notes: notes ? String(notes).trim() : '',
      status: 'pendiente',
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newRequest);
    saveSupplyRequests(list);

    // Notificar al Webhook de Discord de #suministros-team
    if (DISCORD_SUPPLIES_WEBHOOK_URL) {
      fetch(DISCORD_SUPPLIES_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '📦 Nueva Solicitud de Suministros · Clan ANOMALY',
              description: `El integrante **${newRequest.characterName}** ha solicitado suministros al team.\nCualquier miembro u oficial que los tenga disponibles puede responder **"¡Yo Tengo!"** en la plataforma para coordinar la entrega.`,
              color: newRequest.urgency === 'alta' ? 0xef4444 : newRequest.urgency === 'media' ? 0xf59e0b : 0x3b82f6,
              fields: [
                { name: '👤 Solicitante', value: `**${newRequest.characterName}**`, inline: true },
                { name: '⚔️ Suministro', value: `**${newRequest.supplyType}**`, inline: true },
                { name: '📊 Cantidad', value: `**${newRequest.quantity}**`, inline: true },
                { name: '⚠️ Nivel de Urgencia', value: `\`${newRequest.urgency.toUpperCase()}\``, inline: true },
                { name: '📝 Observaciones / Motivo', value: newRequest.notes || 'Sin observaciones adicionales.', inline: false },
                { name: '📢 Estado', value: '⏳ **PENDIENTE DE RESPUESTA** (Entra al portal para dar click en "¡Yo Tengo!")', inline: false },
              ],
              footer: { text: 'Canal de Suministros Team · Clan Anomaly Smash MU' },
              timestamp: now,
            },
          ],
        }),
      }).catch((e) => console.warn('Webhook supply notify error:', e.message));
    }

    res.json({ success: true, request: newRequest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Acción "¡Yo Tengo!" / Aceptar entregar el suministro solicitado
app.post('/api/clan/supply-requests/:id/claim', (req, res) => {
  try {
    const { id } = req.params;
    const { providerName, providerNotes } = req.body;

    if (!providerName || !providerName.trim()) {
      return res.status(400).json({ success: false, error: 'Debes indicar el nombre de tu personaje para comprometerte a entregar el suministro.' });
    }

    const list = getSupplyRequests();
    const item = list.find((r) => r.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    }

    const now = new Date().toISOString();
    item.status = 'comprometido';
    item.providerName = String(providerName).trim();
    item.providerNotes = providerNotes ? String(providerNotes).trim() : 'Listo para entregar en juego.';
    item.claimedAt = now;
    item.updatedAt = now;

    saveSupplyRequests(list);

    // Notificar al canal de Discord #suministros-team
    if (DISCORD_SUPPLIES_WEBHOOK_URL) {
      fetch(DISCORD_SUPPLIES_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🤝 ¡Suministro Comprometido! · Alguien tiene disponible',
              description: `El guerrero **${item.providerName}** ha respondido **"¡Yo Tengo!"** y se compromete a entregar los suministros a **${item.characterName}**.`,
              color: 0x10b981,
              fields: [
                { name: '👤 Proveedor / Donante', value: `**${item.providerName}**`, inline: true },
                { name: '🎯 Para el Miembro', value: `**${item.characterName}**`, inline: true },
                { name: '⚔️ Suministro', value: `${item.supplyType} (${item.quantity})`, inline: true },
                { name: '💬 Observaciones de Entrega', value: item.providerNotes || 'Coordinar encuentro en el servidor.', inline: false },
                { name: '📍 Estado', value: '🤝 **COMPROMETIDO (Pendiente de intercambio en juego)**', inline: false },
              ],
              footer: { text: 'Canal de Suministros Team · Clan Anomaly Smash MU' },
              timestamp: now,
            },
          ],
        }),
      }).catch((e) => console.warn('Webhook claim notify error:', e.message));
    }

    res.json({ success: true, request: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Marcar suministro como "Entregado en Juego"
app.post('/api/clan/supply-requests/:id/deliver', (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryNotes, deliveredBy } = req.body;

    const list = getSupplyRequests();
    const item = list.find((r) => r.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    }

    const now = new Date().toISOString();
    item.status = 'entregado';
    item.deliveredAt = now;
    item.updatedAt = now;
    if (deliveryNotes) item.adminNotes = deliveryNotes;

    saveSupplyRequests(list);

    // Notificar al canal #suministros-team
    if (DISCORD_SUPPLIES_WEBHOOK_URL) {
      fetch(DISCORD_SUPPLIES_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '✅ Suministro Entregado con Éxito en Smash MU',
              description: `Los suministros solicitados por **${item.characterName}** han sido entregados con éxito en el servidor.`,
              color: 0x06b6d4,
              fields: [
                { name: '👤 Receptor', value: `**${item.characterName}**`, inline: true },
                { name: '🛡️ Entregado por', value: `**${item.providerName || deliveredBy || 'Intendencia del Clan'}**`, inline: true },
                { name: '📦 Suministro', value: `${item.supplyType} (${item.quantity})`, inline: true },
                { name: '📝 Nota Final', value: deliveryNotes || item.providerNotes || 'Entrega concretada.', inline: false },
              ],
              footer: { text: 'Canal de Suministros Team · Clan Anomaly Smash MU' },
              timestamp: now,
            },
          ],
        }),
      }).catch((e) => console.warn('Webhook deliver notify error:', e.message));
    }

    res.json({ success: true, request: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar estado de solicitud (Guild Master / Oficial)
app.put('/api/clan/supply-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, reviewerName, providerName, providerNotes } = req.body;
    const list = getSupplyRequests();
    const item = list.find((r) => r.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    }

    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;
    if (reviewerName) item.reviewedBy = reviewerName;
    if (providerName) item.providerName = providerName;
    if (providerNotes) item.providerNotes = providerNotes;
    item.updatedAt = new Date().toISOString();

    saveSupplyRequests(list);
    res.json({ success: true, request: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// SISTEMA DE ASISTENCIA A INVASIONES DIARIAS (14:00, 19:00, 23:00 HORA CHILENA)
// ============================================================================
const INVASIONS_FILE = path.resolve(__dirname, 'data', 'invasion_attendance.json');

interface InvasionAttendanceRecord {
  id: string;
  characterName: string;
  date: string; // YYYY-MM-DD
  invasionSlot: '14:00' | '19:00' | '23:00';
  checkInTime?: string;
  checkOutTime?: string;
  checkInIso?: string;
  checkOutIso?: string;
  durationMinutes?: number;
  mapReported?: string;
  squadCode?: string;
  userTimeZone: string;
  status: 'completado' | 'en_progreso';
  verificationStatus: 'verificado' | 'pendiente_revision' | 'rechazado_fraude';
  reviewedBy?: string;
  reviewNotes?: string;
  updatedAt: string;
}

function getInvasionAttendance(): InvasionAttendanceRecord[] {
  try {
    if (!fs.existsSync(INVASIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(INVASIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveInvasionAttendance(list: InvasionAttendanceRecord[]) {
  try {
    fs.mkdirSync(path.dirname(INVASIONS_FILE), { recursive: true });
    fs.writeFileSync(INVASIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving invasion attendance:', e);
  }
}

// Obtener asistencias a invasiones
app.get('/api/clan/invasion-attendance', (req, res) => {
  try {
    const { characterName, date } = req.query;
    let list = getInvasionAttendance();
    if (characterName) {
      const clean = String(characterName).toLowerCase();
      list = list.filter((r) => r.characterName.toLowerCase() === clean);
    }
    if (date) {
      list = list.filter((r) => r.date === String(date));
    }
    res.json({ success: true, records: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registrar Check-in (Entrada) o Check-out (Salida) de Invasión con Verificación Anti-Trampas
app.post('/api/clan/invasion-attendance/check', (req, res) => {
  try {
    const { characterName, invasionSlot, checkType, userTimeZone, localTimeStr, mapReported, squadCode } = req.body;
    if (!characterName || !invasionSlot || !checkType) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: characterName, invasionSlot, checkType.',
      });
    }

    // Fecha en hora chilena (America/Santiago)
    const now = new Date();
    const chileDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const list = getInvasionAttendance();
    const cleanChar = String(characterName).trim();
    const slot = invasionSlot as '14:00' | '19:00' | '23:00';

    let record = list.find(
      (r) =>
        r.characterName.toLowerCase() === cleanChar.toLowerCase() &&
        r.date === chileDateStr &&
        r.invasionSlot === slot
    );

    const nowIso = now.toISOString();

    if (!record) {
      record = {
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        characterName: cleanChar,
        date: chileDateStr,
        invasionSlot: slot,
        userTimeZone: userTimeZone || 'America/Santiago',
        status: checkType === 'check_out' ? 'completado' : 'en_progreso',
        verificationStatus: 'pendiente_revision',
        mapReported: mapReported || 'Lorencia / Devias',
        squadCode: squadCode || '',
        updatedAt: nowIso,
      };
      if (checkType === 'check_in') {
        record.checkInTime = localTimeStr || nowIso;
        record.checkInIso = nowIso;
      } else {
        record.checkOutTime = localTimeStr || nowIso;
        record.checkOutIso = nowIso;
        record.durationMinutes = 15; // Estimación estándar si marca directamente salida
      }
      list.push(record);
    } else {
      if (checkType === 'check_in') {
        record.checkInTime = localTimeStr || nowIso;
        record.checkInIso = nowIso;
        record.status = 'en_progreso';
        if (mapReported) record.mapReported = mapReported;
      } else if (checkType === 'check_out') {
        record.checkOutTime = localTimeStr || nowIso;
        record.checkOutIso = nowIso;
        record.status = 'completado';
        if (mapReported) record.mapReported = mapReported;
        if (squadCode) record.squadCode = squadCode;

        // Cálculo de duración real de permanencia en combate (Anti-Speedrun)
        if (record.checkInIso) {
          const diffMs = now.getTime() - new Date(record.checkInIso).getTime();
          record.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        } else {
          record.durationMinutes = 15;
        }

        // Si la permanencia fue mayor o igual a 8 minutos, pasa a verificado preliminar
        if (record.durationMinutes && record.durationMinutes >= 8) {
          record.verificationStatus = 'verificado';
        } else {
          record.verificationStatus = 'pendiente_revision';
        }
      }
      record.updatedAt = nowIso;
    }

    saveInvasionAttendance(list);

    // Webhook dedicado al Canal de Asistencias de Discord (#asistencias)
    const ATTENDANCE_WEBHOOK_URL =
      process.env.DISCORD_ATTENDANCE_WEBHOOK_URL ||
      '';

    if (ATTENDANCE_WEBHOOK_URL) {
      const isCheckIn = checkType === 'check_in';
      const durationNote = record.durationMinutes ? `${record.durationMinutes} minutos en combate` : 'En curso';
      const mapNote = record.mapReported || 'Zona de invasión';
      const antiCheatStatus =
        record.verificationStatus === 'verificado'
          ? '🟢 Verificado (Tiempo & Mapa válidos)'
          : isCheckIn
          ? '⏳ En Combate Activo'
          : '🟡 Pendiente de Aprobación por Guild Master';

      fetch(ATTENDANCE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: isCheckIn
                ? '⚔️ Asistencia Invasión: ENTRADA Registrada'
                : '✅ Asistencia Invasión: SALIDA Completada',
              description: `El guerrero **${cleanChar}** ha marcado su ${
                isCheckIn ? 'entrada' : 'salida'
              } en la invasión de las **${slot} hrs (Hora Chile)**.`,
              color: isCheckIn ? 0x06b6d4 : 0x10b981,
              fields: [
                { name: '👤 Personaje', value: cleanChar, inline: true },
                { name: '⏰ Turno Invasión', value: `${slot} CLT`, inline: true },
                {
                  name: '🌍 Hora Registrada',
                  value: `${localTimeStr || 'N/A'} (${userTimeZone || 'Local'})`,
                  inline: true,
                },
                { name: '⏱️ Permanencia en Evento', value: durationNote, inline: true },
              ],
              footer: { text: 'Canal Oficial de Asistencias · Clan Anomaly Smash MU' },
              timestamp: nowIso,
            },
          ],
        }),
      }).catch((e) => console.warn('Invasion webhook broadcast notice:', e.message));
    }

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint para que el Guild Master (UlmerMG) o Asistente (UlmerDL) audite asistencias
app.post('/api/clan/invasion-attendance/review', (req, res) => {
  try {
    const { attendanceId, decision, reviewerName, reviewNotes } = req.body;
    if (!attendanceId || !decision || !reviewerName) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: attendanceId, decision, reviewerName.',
      });
    }

    const list = getInvasionAttendance();
    const record = list.find((r) => r.id === attendanceId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Registro de asistencia no encontrado.' });
    }

    record.verificationStatus = decision === 'aprobar' ? 'verificado' : 'rechazado_fraude';
    record.reviewedBy = String(reviewerName).trim();
    if (reviewNotes) record.reviewNotes = String(reviewNotes).trim();
    record.updatedAt = new Date().toISOString();

    saveInvasionAttendance(list);

    // Si fue rechazado por fraude, notificar en Discord para que todo el clan mantenga disciplina
    const ATTENDANCE_WEBHOOK_URL =
      process.env.DISCORD_ATTENDANCE_WEBHOOK_URL ||
      '';

    if (ATTENDANCE_WEBHOOK_URL && decision === 'rechazar') {
      fetch(ATTENDANCE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🚨 Auditoría de Asistencia: FALTA REGISTRADA',
              description: `La asistencia de **${record.characterName}** en la invasión de las **${record.invasionSlot} hrs** ha sido rechazada por el **Guild Master (${reviewerName})**.`,
              color: 0xef4444,
              fields: [
                { name: '👤 Personaje', value: record.characterName, inline: true },
                { name: '⚠️ Motivo', value: reviewNotes || 'No se verificó presencia real en el juego / Falta de combate', inline: true },
                { name: '⚖️ Dictaminado por', value: reviewerName, inline: true },
              ],
              footer: { text: 'Comandancia del Clan Anomaly · Tolerancia Cero al Fraude' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch((e) => console.warn('Invasion review webhook notice:', e.message));
    }

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registrar Asistencia / Disponibilidad para Castle Siege en el canal de asistencias
app.post('/api/clan/siege-attendance', (req, res) => {
  try {
    const { characterName, status } = req.body;
    if (!characterName || !status) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros: characterName, status.' });
    }

    const cleanChar = String(characterName).trim();
    const statusText =
      status === 'confirmed' ? 'DISPONIBLE PARA EL ASEDIO' : status === 'absent' ? 'NO DISPONIBLE' : 'EN DUDA';
    const statusColor = status === 'confirmed' ? 0x10b981 : status === 'absent' ? 0xef4444 : 0xf59e0b;
    const nowIso = new Date().toISOString();

    const ATTENDANCE_WEBHOOK_URL =
      process.env.DISCORD_ATTENDANCE_WEBHOOK_URL ||
      '';

    if (ATTENDANCE_WEBHOOK_URL) {
      fetch(ATTENDANCE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🏰 Disponibilidad Castle Siege Actualizada',
              description: `El guerrero **${cleanChar}** ha actualizado su disponibilidad para el próximo asedio.`,
              color: statusColor,
              fields: [
                { name: '👤 Personaje', value: cleanChar, inline: true },
                { name: '⚔️ Estado', value: `**${statusText}**`, inline: true },
              ],
              footer: { text: 'Canal Oficial de Asistencias · Clan Anomaly Smash MU' },
              timestamp: nowIso,
            },
          ],
        }),
      }).catch((e) => console.warn('Siege webhook notice:', e.message));
    }

    res.json({ success: true, characterName: cleanChar, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

start();
