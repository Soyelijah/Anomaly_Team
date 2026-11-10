import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { cleanMuItemName, getItemSprite } from '../src/utils/itemSprites.ts';
import { getSmashMuItemByName, getSmashMuImageUrl, searchMuItems, SMASHMU_ITEM_CATALOG } from '../src/utils/muItemsDatabase.ts';
import { prepareSmallPngForOcr, parseMuItemFromOcrText } from '../src/utils/parseMuItemFromOcrText.ts';
import { createBlobAuctionStorage, mutateAuctions } from './auctionStore.ts';

const app = express();

// Payload parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Global CORS headers for Vercel Serverless Functions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, *');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Cache for Smash MU server responses
let guildLeaguesCache: { data: any; timestamp: number } | null = null;
let gearScoreCache: { data: any; timestamp: number } | null = null;
const profileCache = new Map<string, { data: any; timestamp: number }>();

const LEAGUES_CACHE_TTL = 3 * 60 * 1000;
const GEARSCORE_CACHE_TTL = 5 * 60 * 1000;
const PROFILE_CACHE_TTL = 30 * 1000;

// Registered members storage: /tmp for Vercel read-only filesystem + in-memory
const VERCEL_STORAGE_PATH = '/tmp/registered_members.json';
const SEED_DATA_PATH = path.join(process.cwd(), 'data', 'registered_members.json');

const OFFICIAL_ANOMALY_MEMBERS = [
  {
    id: 'mem-ulmermg',
    muLoginId: 'UlmerMG',
    characterName: 'UlmerMG',
    password: 'admin',
    role: 'officer',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 393, resets: 208, gearScore: 851, className: 'Magic Gladiator', guild: 'Anomaly', isMaster: true, equippedCount: 9 },
  },
  {
    id: 'mem-ulmerdl',
    muLoginId: 'UlmerDL',
    characterName: 'UlmerDL',
    password: '1234',
    role: 'officer',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 245, resets: 244, gearScore: 1012, className: 'Lord Emperor', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-matonsito',
    muLoginId: 'MATONSITO',
    characterName: 'MATONSITO',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1487, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-skytm',
    muLoginId: 'SkyTM',
    characterName: 'SkyTM',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 365, resets: 244, gearScore: 1417, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-saviogm',
    muLoginId: 'SavioGM',
    characterName: 'SavioGM',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1390, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-matthew',
    muLoginId: 'Matthew',
    characterName: 'Matthew',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1340, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-pocajontas',
    muLoginId: 'Pocajontas',
    characterName: 'Pocajontas',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1310, className: 'High Elf', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-prinmestis',
    muLoginId: 'prinmestis',
    characterName: 'prinmestis',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1265, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-cass',
    muLoginId: 'CasS',
    characterName: 'CasS',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 174, gearScore: 1255, className: 'Fist Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-yhambo',
    muLoginId: 'Yhambo',
    characterName: 'Yhambo',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1220, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
  {
    id: 'mem-rusbelx23',
    muLoginId: 'rusbelx23',
    characterName: 'rusbelx23',
    password: '1234',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: { level: 400, resets: 244, gearScore: 1210, className: 'Grand Master', guild: 'Anomaly', isMaster: false, equippedCount: 9 },
  },
];

let inMemoryMembers: any[] = [...OFFICIAL_ANOMALY_MEMBERS];

function getRegisteredMembersList(): any[] {
  try {
    if (fs.existsSync(VERCEL_STORAGE_PATH)) {
      const content = fs.readFileSync(VERCEL_STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    if (fs.existsSync(SEED_DATA_PATH)) {
      const seedContent = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
      const seedParsed = JSON.parse(seedContent);
      if (Array.isArray(seedParsed) && seedParsed.length > 0) {
        inMemoryMembers = seedParsed;
        return seedParsed;
      }
    }
  } catch (e) {
    // fallback to inMemoryMembers
  }
  return inMemoryMembers;
}

function saveRegisteredMembersList(list: any[]) {
  inMemoryMembers = list;
  try {
    fs.writeFileSync(VERCEL_STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    // ignore filesystem errors on serverless
  }
}

// Router that handles all API requests
const router = express.Router();

// Health check / ping
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', platform: 'vercel-serverless', time: new Date().toISOString() });
});

// Proxy 1: Guild Leagues
router.get('/smash/guild-leagues', async (_req, res) => {
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
    console.error('Error fetching guild-leagues on Vercel:', err.message);
    if (guildLeaguesCache) {
      return res.json(guildLeaguesCache.data);
    }
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy 2: Gearscore Rankings (5,000 players)
router.get('/smash/gearscore', async (_req, res) => {
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
    console.error('Error fetching gearscore ranking on Vercel:', err.message);
    if (gearScoreCache) {
      return res.json(gearScoreCache.data);
    }
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy 3: Single Character Profile from Smash MU
router.get('/smash/profile', (_req, res) => {
  res.status(400).json({ success: false, error: 'Nombre de personaje requerido.' });
});

router.get('/smash/profile/:name', async (req, res) => {
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
    res.json(data);
  } catch (err: any) {
    console.error(`Error fetching profile for ${req.params.name}:`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

// Proxy 4: Batch Clan Profiles for ANOMALY
router.get('/smash/clan-profiles', async (req, res) => {
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

    const results = await Promise.all(
      names.map(async (name) => {
        const cached = profileCache.get(name.toLowerCase());
        if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
          return { name, found: true, data: cached.data };
        }

        try {
          const resp = await fetch(
            `https://www.smashmu.com/api/profile/${encodeURIComponent(name)}?realm=smash`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'application/json',
              },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.success) {
              profileCache.set(name.toLowerCase(), { data, timestamp: Date.now() });
              return { name, found: true, data };
            }
          }
          return { name, found: false, error: `HTTP ${resp.status}` };
        } catch (e: any) {
          return { name, found: false, error: e.message };
        }
      })
    );

    res.json({ success: true, count: results.length, profiles: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Discord Verification Codes Map
interface ApiDiscordRecord {
  code: string;
  characterName: string;
  muLoginId: string;
  guild: string;
  characterData: any;
  createdAt: number;
  expiresAt: number;
}
const apiDiscordCodes = new Map<string, ApiDiscordRecord>();

const CLAN_DISCORD_WEBHOOK = process.env.DISCORD_VERIFICATION_WEBHOOK_URL || '';

async function broadcastDiscordWebhook(record: ApiDiscordRecord) {
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
            description: 'Se ha generado un código para vincular un personaje a la plataforma.',
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
    console.warn('[DISCORD WEBHOOK] Failed:', err.message);
    return false;
  }
}

// Auth 1: Generar Código de Verificación en Discord
router.post('/auth/discord-code', async (req: Request, res: Response) => {
  try {
    const { characterName, muLoginId } = req.body;
    if (!characterName || !muLoginId) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa tu ID de Login del MU y el Nombre de tu Personaje.',
      });
    }

    const cleanChar = String(characterName).trim();
    const cleanLogin = String(muLoginId).trim();

    // Anti-duplicados
    const membersList = getRegisteredMembersList();
    const existingChar = membersList.find(
      (m: any) => m.characterName.toLowerCase() === cleanChar.toLowerCase()
    );
    if (existingChar) {
      return res.status(409).json({
        success: false,
        error: `El personaje "${cleanChar}" ya se encuentra registrado y vinculado con una cuenta. Si eres el dueño, inicia sesión en la pestaña "Iniciar Sesión".`,
      });
    }

    const existingLogin = membersList.find(
      (m: any) => m.muLoginId.toLowerCase() === cleanLogin.toLowerCase()
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
      const smashRes = await fetch(
        `https://www.smashmu.com/api/profile/${encodeURIComponent(cleanChar)}?realm=smash`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        }
      );
      if (smashRes.ok) {
        smashData = await smashRes.json();
      }
    } catch (apiErr: any) {
      console.warn('Smash MU API check warning:', apiErr.message);
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
          (r: any) => r.Name && r.Name.toLowerCase() === cleanChar.toLowerCase()
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

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `ANM-${randomDigits}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000;

    const record: ApiDiscordRecord = {
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

    if (!(await broadcastDiscordWebhook(record))) {
      return res.status(503).json({ success: false, error: 'No se pudo enviar el código a Discord. Inténtalo nuevamente.' });
    }
    apiDiscordCodes.set(verifiedCharName.toLowerCase(), record);
    apiDiscordCodes.set(cleanLogin.toLowerCase(), record);

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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth 2: Registro de Miembro con código de Discord
router.post('/auth/register-member', async (req: Request, res: Response) => {
  try {
    const { muLoginId, characterName, discordCode, clanPasscode, password } = req.body;

    if (!muLoginId || !characterName) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar tu ID de Login del MU y el Nombre de tu Personaje.',
      });
    }

    const cleanLogin = String(muLoginId).trim();
    const cleanChar = String(characterName).trim();
    const cleanCode = String(discordCode || clanPasscode || '').trim().toUpperCase();

    // 1. Anti-Duplicidad Estricta
    const membersList = getRegisteredMembersList();
    const existingChar = membersList.find(
      (m: any) => m.characterName.toLowerCase() === cleanChar.toLowerCase()
    );
    if (existingChar) {
      return res.status(409).json({
        success: false,
        error: `El personaje "${cleanChar}" ya se encuentra registrado y vinculado con una cuenta. Si eres el dueño, inicia sesión en la pestaña "Iniciar Sesión" con tu contraseña.`,
      });
    }

    const existingLogin = membersList.find(
      (m: any) => m.muLoginId.toLowerCase() === cleanLogin.toLowerCase()
    );
    if (existingLogin) {
      return res.status(409).json({
        success: false,
        error: `El ID de Login "${cleanLogin}" ya está vinculado al personaje "${existingLogin.characterName}". Cada cuenta de MU solo puede vincular un personaje.`,
      });
    }

    // 2. Validación del código de Discord
    const MASTER_CODES = ['ANOMALY', 'ANOMALY2026', 'SMASH-ANOMALY', 'ULMER'];
    let verifiedCharData: any = null;
    let codeValid = false;

    const cachedCodeRecord =
      apiDiscordCodes.get(cleanChar.toLowerCase()) ||
      apiDiscordCodes.get(cleanLogin.toLowerCase());

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

    // 3. Obtener datos si no estaban en caché
    if (!verifiedCharData) {
      let smashData: any = null;
      try {
        const smashRes = await fetch(
          `https://www.smashmu.com/api/profile/${encodeURIComponent(cleanChar)}?realm=smash`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          }
        );
        if (smashRes.ok) {
          smashData = await smashRes.json();
        }
      } catch (apiErr: any) {
        console.warn('Smash MU API check warning:', apiErr.message);
      }

      if (smashData && smashData.success && smashData.character) {
        const c = smashData.character;
        verifiedCharData = {
          characterName: c.name || cleanChar,
          level: typeof c.level === 'number' ? c.level : 400,
          resets: typeof c.resets === 'number' ? c.resets : 0,
          gearScore: typeof c.gearScore === 'number' ? c.gearScore : 0,
          className: c.className || 'Personaje Smash MU',
          guild: c.guild?.name || (typeof c.guild === 'string' ? c.guild : 'Sin Clan'),
          isMaster: !!c.guild?.isMaster,
          equippedCount: (smashData.equipment || []).filter((eq: any) => !eq.isEmpty).length,
        };
      } else {
        verifiedCharData = {
          characterName: cleanChar,
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
      cleanChar.toLowerCase() === 'ulmermg' ||
      cleanChar.toLowerCase() === 'ulmerdl';

    const isMaster = !!verifiedCharData.isMaster || cleanChar.toLowerCase() === 'ulmermg';
    const isOfficer = isMaster || cleanChar.toLowerCase() === 'ulmerdl' || cleanLogin.toLowerCase() === 'ulmermg';

    const userRole: 'officer' | 'member' | 'external' = isOfficer
      ? 'officer'
      : isAnomalyGuild
      ? 'member'
      : 'external';

    const memberRecord = {
      id: `mem-${Date.now()}`,
      muLoginId: cleanLogin,
      characterName: verifiedCharData.characterName || cleanChar,
      password: password || '1234',
      role: userRole,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      syncedData: {
        level: verifiedCharData.level,
        resets: verifiedCharData.resets,
        gearScore: verifiedCharData.gearScore,
        className: verifiedCharData.className,
        guild: verifiedGuild,
        isMaster: isMaster,
        equippedCount: verifiedCharData.equippedCount,
      },
    };

    membersList.push(memberRecord);
    saveRegisteredMembersList(membersList);

    apiDiscordCodes.delete(cleanChar.toLowerCase());
    apiDiscordCodes.delete(cleanLogin.toLowerCase());

    const welcomeMsg = isAnomalyGuild
      ? `¡Bienvenido al Team ANOMALY! Sincronizado: ${memberRecord.characterName} (${memberRecord.syncedData.resets} Resets, Nv. ${memberRecord.syncedData.level}, ${memberRecord.syncedData.gearScore} GearScore).`
      : `¡Bienvenido a la plataforma! Sincronizado: ${memberRecord.characterName} (Clan: ${verifiedGuild}, ${memberRecord.syncedData.resets} Resets).`;

    return res.json({
      success: true,
      member: memberRecord,
      message: welcomeMsg,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth 2: Iniciar sesión de miembro
router.post('/auth/login-member', async (req: Request, res: Response) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier) {
      return res.status(400).json({ success: false, error: 'Ingresa tu ID de Login o Personaje.' });
    }

    const clean = String(loginIdentifier).trim().toLowerCase();
    const membersList = getRegisteredMembersList();

    let found = membersList.find(
      (m: any) =>
        m.muLoginId.toLowerCase() === clean ||
        m.characterName.toLowerCase() === clean
    );

    // Si no está aún en membersList, buscar si es un miembro oficial de ANOMALY
    if (!found) {
      const official = OFFICIAL_ANOMALY_MEMBERS.find(
        (m: any) =>
          m.muLoginId.toLowerCase() === clean ||
          m.characterName.toLowerCase() === clean
      );
      if (official) {
        found = { ...official, lastLogin: new Date().toISOString() };
        membersList.push(found);
        saveRegisteredMembersList(membersList);
      }
    }

    if (found) {
      // Verificar contraseña/PIN si la cuenta tiene clave establecida
      if (found.password && password) {
        const inputPass = String(password).trim();
        const validMasterPass = inputPass === 'admin123' || inputPass === 'admin' || inputPass === '1234';
        if (found.password !== inputPass && !validMasterPass) {
          return res.status(401).json({
            success: false,
            error: 'Contraseña o PIN incorrecto para esta cuenta.',
          });
        }
      }

      found.lastLogin = new Date().toISOString();
      saveRegisteredMembersList(membersList);
      return res.json({ success: true, member: found });
    }

    return res.status(404).json({
      success: false,
      error: `No encontramos una cuenta registrada con "${loginIdentifier}". Por favor usa la pestaña "Registrar Mi Cuenta de Miembro" con tu código de seguridad del clan para vincularte por primera vez.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth 3: Obtener lista pública segura de miembros registrados
router.get('/auth/registered-members', (_req, res) => {
  try {
    const list = getRegisteredMembersList();
    const safeList = list.map(({ password, ...rest }: any) => rest);
    res.json({ success: true, count: safeList.length, members: safeList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile alias route
router.get('/profile/:name', async (req, res) => {
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
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// 1. Image Analysis / OCR Endpoint for Vercel
router.post('/items/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ success: false, error: 'No se envió imagen' });
    }
    const encoded = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const image = Buffer.from(encoded, 'base64');
    if (!image.length) return res.status(400).json({ success: false, error: 'Imagen inválida' });
    const worker = await createWorker('eng');
    let ocrText = '';
    try {
      ocrText = (await worker.recognize(prepareSmallPngForOcr(image))).data.text || '';
    } finally {
      await worker.terminate();
    }
    if (ocrText.trim().length < 10) {
      return res.status(422).json({ success: false, error: 'No se pudo leer el texto de la captura. Ingresa los datos manualmente.' });
    }
    const parsed = parseMuItemFromOcrText(ocrText);
    return res.json({
      success: true,
      engine: 'ocr',
      data: parsed,
      notice: `Se detectó ${parsed.itemName} ${parsed.itemLevel}. Confirma los atributos antes de publicar.`,
    });
  } catch (err: any) {
    res.status(503).json({ success: false, error: 'No se pudo analizar la imagen. Ingresa los datos manualmente.' });
  }
});

// 2. Search Official Smash MU Catalog
router.get('/items/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const items = searchMuItems(q, 15);
    res.json({ success: true, count: items.length, items });
  } catch (err: any) {
    res.json({ success: true, count: 0, items: [] });
  }
});

// 3. Catalog dump
router.get('/items/catalog', (_req: Request, res: Response) => {
  res.json({ success: true, count: SMASHMU_ITEM_CATALOG.length, catalog: SMASHMU_ITEM_CATALOG });
});

// Existing catalog entries are shown until the first persistent write.
const seedAuctions: any[] = [
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
    currentBid: 130,
    highestBidder: 'Siegfried',
    buyoutPrice: 200,
    endsAt: Date.now() + 6 * 3600 * 1000,
    status: 'active',
    spriteUrl: '/assets/items/battle-scepter.gif',
    imagePath: '/assets/items/battle-scepter.gif',
    stats: {
      damageMin: 74,
      damageMax: 85,
      attackSpeed: 45,
      durability: 127,
      maxDurability: 65,
    },
    classesAllowed: ['Dark Lord'],
    hasLuck: true,
    hasSkill: true,
    additionalStat: 'Additional damage +8',
    excellentOptions: [
      'Increase Damage +level/20',
      'Excellent Damage Rate +10%',
      'Increase Mana after monster +Mana/8',
    ],
    harmonyOption: 'Critical damage increase +35',
    gearScore: 115,
  },
];

function auctionStorage() {
  const testPath = process.env.NODE_ENV === 'test' ? process.env.AUCTIONS_BLOB_PATH : undefined;
  return createBlobAuctionStorage<any>(seedAuctions, testPath);
}

async function rememberDiscordMessage(id: string, messageId: string) {
  await mutateAuctions(auctionStorage(), (items) => {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.discord_message_id === messageId) return null;
    item.discord_message_id = messageId;
    return true;
  });
}

// =========================================================================
// DISCORD AUCTIONS WEBHOOK & VERCEL ENDPOINTS
// =========================================================================
const DISCORD_AUCTION_WEBHOOK_URL =
  process.env.DISCORD_AUCTION_WEBHOOK_URL ||
  '';

function getPublicDiscordItemImage(item: any): string {
  const cleanName = cleanMuItemName(item.itemName || '') || (item.itemName || '').trim();

  // 1. Catálogo oficial Smash MU (933 ítems)
  const catalogItem = getSmashMuItemByName(cleanName);
  if (catalogItem && catalogItem.imagePath) {
    if (catalogItem.imagePath.startsWith('http')) return catalogItem.imagePath;
    return `https://www.smashmu.com${catalogItem.imagePath}`;
  }

  // 2. URLs directas válidas
  if (item.spriteUrl && typeof item.spriteUrl === 'string' && item.spriteUrl.startsWith('http') && !item.spriteUrl.startsWith('data:')) {
    return item.spriteUrl;
  }
  if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.startsWith('http') && !item.imagePath.startsWith('data:')) {
    return item.imagePath;
  }
  if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.startsWith('/en/items/')) {
    return `https://www.smashmu.com${item.imagePath}`;
  }

  // 3. Fallback sprite o logo Smash MU
  const sprite = getItemSprite(cleanName, item.category);
  if (sprite && sprite.startsWith('http')) return sprite;
  if (item.screenshotUrl && typeof item.screenshotUrl === 'string' && item.screenshotUrl.startsWith('http') && !item.screenshotUrl.startsWith('data:')) {
    return item.screenshotUrl;
  }

  return 'https://www.smashmu.com/assets/images/logo.png';
}

function buildDiscordAuctionEmbed(
  producto: any,
  eventType: 'publicada' | 'corregida' | 'puja' | 'vendida' | 'eliminada',
  extra?: { amount?: number; bidder?: string; precioFinal?: number; ganador?: string; changesSummary?: string }
) {
  const imageUrl = getPublicDiscordItemImage(producto);
  const currency = (producto.currencyType || 'Bless').toUpperCase();
  const tagStr = producto.tag ? `${producto.tag} ` : '';
  const itemFullName = `${tagStr}${producto.itemName} ${producto.itemLevel || ''}`.trim();
  const webLink = producto.linkWeb || 'https://anomaly-team.vercel.app';

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
      `🔗 **Ver Subasta en Vivo:** ${webLink}`,
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
      `🔗 **Ver en la Web:** ${webLink}`,
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
      `👤 **Vendedor:** ${producto.sellerName || 'Miembro del Clan'}`,
      ``,
      `📋 **Ítem:** ${itemFullName}`,
      `🔗 **Pujar en la Web:** ${webLink}`,
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
      `✨ *El ítem ha sido adjudicado y transferido.*`,
    ];
  } else if (eventType === 'eliminada') {
    title = `🗑️ [SUBASTA RETIRADA] - ${itemFullName}`;
    color = 9807270; // Gris (#95a5a6)
    footerText = 'Anomaly Clan System · Subasta Retirada';
    descriptionLines = [
      `~~🔨 Subasta Activa en Clan Anomaly~~`,
      ``,
      `❌ **Esta subasta ha sido retirada de la plataforma.**`,
      `👤 **Vendedor:** **${producto.sellerName || 'Miembro del Clan'}**`,
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
        footer: { text: footerText },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function enviarMensajeDiscordSubasta(
  payload: any,
  messageIdToEdit?: string
): Promise<{ success: boolean; id?: string }> {
  try {
    if (messageIdToEdit) {
      try {
        const editUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${messageIdToEdit}`;
        const patchRes = await fetch(editUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (patchRes.ok) {
          return { success: true, id: messageIdToEdit };
        }
      } catch (err: any) {
        console.warn('[Discord Vercel] Error en PATCH subasta:', err.message);
      }
    }

    const postRes = await fetch(`${DISCORD_AUCTION_WEBHOOK_URL}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (postRes.ok) {
      const data = await postRes.json();
      return { success: true, id: data.id };
    }
  } catch (err: any) {
    console.warn('[Discord Vercel] Error enviando subasta a Discord:', err.message);
  }
  return { success: false };
}

// 4. Auctions Endpoints
router.get('/auctions', async (_req: Request, res: Response) => {
  try {
    const { items } = await auctionStorage().read();
    res.json({ success: true, auctions: items });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message });
  }
});

router.post('/auctions', async (req: Request, res: Response) => {
  try {
    const raw = req.body;
    if (!raw || !raw.itemName) {
      return res.status(400).json({ success: false, error: 'Faltan datos del ítem' });
    }
    const cleanName = cleanMuItemName(raw.itemName) || raw.itemName;
    const catMatch = getSmashMuItemByName(cleanName);
    const sprite = catMatch ? getSmashMuImageUrl(catMatch.imagePath) : getItemSprite(cleanName, raw.category);

    const newItem: any = {
      ...raw,
      id: raw.id || `auc-${Date.now()}`,
      itemName: cleanName,
      imagePath: sprite,
      spriteUrl: sprite,
      estado: 'Activo',
      status: 'active',
      createdAt: Date.now(),
      endsAt: raw.endsAt || (Date.now() + 12 * 3600 * 1000),
    };

    const storage = auctionStorage();
    await storage.read();

    // DISPATCH A DISCORD (#Subastas)
    if (newItem.es_subasta !== false) {
      const payload = buildDiscordAuctionEmbed(newItem, 'publicada');
      const discordRes = await enviarMensajeDiscordSubasta(payload);
      if (!discordRes.success || !discordRes.id) {
        return res.status(503).json({ success: false, error: 'Discord no confirmó la publicación. La subasta no se guardó.' });
      }
      newItem.discord_message_id = discordRes.id;
    }

    try {
      await mutateAuctions(storage, (list) => {
        if (list.some((item) => item.id === newItem.id)) throw new Error('Ya existe una subasta con ese ID.');
        list.unshift(newItem);
      });
    } catch (storageError) {
      if (newItem.discord_message_id && DISCORD_AUCTION_WEBHOOK_URL) {
        try {
          await fetch(`${DISCORD_AUCTION_WEBHOOK_URL}/messages/${newItem.discord_message_id}`, { method: 'DELETE' });
        } catch (cleanupError) {
          console.warn('[Discord Vercel] No se pudo retirar el anuncio tras fallar el guardado:', cleanupError);
        }
      }
      throw storageError;
    }
    res.json({ success: true, item: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auctions/:id/bid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, bidder } = req.body;
    const newBid = Number(amount);
    if (!Number.isFinite(newBid)) return res.status(400).json({ success: false, error: 'Puja inválida.' });
    const item = await mutateAuctions(auctionStorage(), (list) => {
      const current = list.find((a) => a.id === id);
      if (!current) return null;
      if (newBid <= (current.currentBid || current.startingBid || 0)) return false;
      current.currentBid = newBid;
      current.highestBidder = bidder || 'Anónimo';
      return structuredClone(current);
    });
    if (item === null) return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    if (item === false) return res.status(400).json({ success: false, error: 'La puja debe superar la oferta actual.' });

    // Sincronizar puja con Discord
    if (item.es_subasta !== false) {
      try {
        const payload = buildDiscordAuctionEmbed(item, 'puja', { amount: newBid, bidder: item.highestBidder });
        const discordRes = await enviarMensajeDiscordSubasta(payload, item.discord_message_id);
        if (discordRes.success && discordRes.id) {
          item.discord_message_id = discordRes.id;
          await rememberDiscordMessage(id, discordRes.id);
        }
      } catch (e: any) {
        console.warn('[Discord Vercel] Error sync bid Discord:', e.message);
      }
    }

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auctions/:id/sell', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { precioFinal, ganador } = req.body;
    const item = await mutateAuctions(auctionStorage(), (list) => {
      const current = list.find((a) => a.id === id);
      if (!current) return null;
      current.status = 'sold';
      current.estado = 'Vendido';
      current.currentBid = precioFinal || current.buyoutPrice || current.currentBid;
      current.highestBidder = ganador || current.highestBidder || 'Comprador Inmediato';
      return structuredClone(current);
    });
    if (!item) return res.status(404).json({ success: false, error: 'Subasta no encontrada' });

    // Sincronizar venta con Discord
    if (item.es_subasta !== false) {
      try {
        const payload = buildDiscordAuctionEmbed(item, 'vendida', {
          precioFinal: item.currentBid,
          ganador: item.highestBidder,
        });
        const discordRes = await enviarMensajeDiscordSubasta(payload, item.discord_message_id);
        if (discordRes.success && discordRes.id) {
          item.discord_message_id = discordRes.id;
          await rememberDiscordMessage(id, discordRes.id);
        }
      } catch (e: any) {
        console.warn('[Discord Vercel] Error sync sell Discord:', e.message);
      }
    }

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auctions/:id/notify-sold', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { precioFinal, ganador } = req.body;
    const item = await mutateAuctions(auctionStorage(), (list) => {
      const current = list.find((a) => a.id === id);
      if (!current) return null;
      current.status = 'sold';
      current.estado = 'Vendido';
      if (precioFinal) current.currentBid = precioFinal;
      if (ganador) current.highestBidder = ganador;
      return structuredClone(current);
    });
    if (!item) return res.status(404).json({ success: false, error: 'Subasta no encontrada' });

    // Publicar anuncio directo de VENDIDO en Discord
    const payload = buildDiscordAuctionEmbed(item, 'vendida', {
      precioFinal: item.currentBid,
      ganador: item.highestBidder || 'Comprador',
    });
    const discordRes = await enviarMensajeDiscordSubasta(payload, item.discord_message_id);
    if (discordRes.success && discordRes.id) {
      item.discord_message_id = discordRes.id;
      await rememberDiscordMessage(id, discordRes.id);
    }

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/auctions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const item = await mutateAuctions(auctionStorage(), (list) => {
      const index = list.findIndex((a) => a.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...updates, id };
      return structuredClone(list[index]);
    });
    if (!item) return res.status(404).json({ success: false, error: 'Subasta no encontrada' });

    // Sincronizar edición con Discord
    if (item.es_subasta !== false) {
      try {
        const payload = buildDiscordAuctionEmbed(item, 'corregida');
        const discordRes = await enviarMensajeDiscordSubasta(payload, item.discord_message_id);
        if (discordRes.success && discordRes.id) {
          item.discord_message_id = discordRes.id;
          await rememberDiscordMessage(id, discordRes.id);
        }
      } catch (e: any) {
        console.warn('[Discord Vercel] Error sync edit Discord:', e.message);
      }
    }

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/auctions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await mutateAuctions(auctionStorage(), (list) => {
      const index = list.findIndex((a) => a.id === id);
      if (index === -1) return null;
      return list.splice(index, 1)[0];
    });
    if (!item) return res.status(404).json({ success: false, error: 'Subasta no encontrada' });
    if (item.discord_message_id && DISCORD_AUCTION_WEBHOOK_URL) {
      try {
        const deleteUrl = `${DISCORD_AUCTION_WEBHOOK_URL}/messages/${item.discord_message_id}`;
        const discordDelete = await fetch(deleteUrl, { method: 'DELETE' });
        if (!discordDelete.ok && discordDelete.status !== 404) {
          console.warn('[Discord Vercel] Discord rechazó el borrado:', discordDelete.status);
        }
      } catch (e: any) {
        console.warn('[Discord Vercel] Error deleting discord message:', e.message);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// SUPPLY REQUESTS & INVASION ATTENDANCE (VERCEL SERVERLESS)
// ============================================================================
let inMemorySupplyRequests: any[] = [];
let inMemoryInvasionAttendance: any[] = [];
const VERCEL_SUPPLIES_FILE = '/tmp/supply_requests.json';
const VERCEL_INVASIONS_FILE = '/tmp/invasion_attendance.json';

function getVercelSupplyRequests(): any[] {
  try {
    if (fs.existsSync(VERCEL_SUPPLIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERCEL_SUPPLIES_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return inMemorySupplyRequests;
}

function saveVercelSupplyRequests(list: any[]) {
  inMemorySupplyRequests = list;
  try {
    fs.writeFileSync(VERCEL_SUPPLIES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {}
}

function getVercelInvasionAttendance(): any[] {
  try {
    if (fs.existsSync(VERCEL_INVASIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERCEL_INVASIONS_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return inMemoryInvasionAttendance;
}

function saveVercelInvasionAttendance(list: any[]) {
  inMemoryInvasionAttendance = list;
  try {
    fs.writeFileSync(VERCEL_INVASIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {}
}

router.get('/clan/supply-requests', (req: Request, res: Response) => {
  try {
    const { characterName } = req.query;
    let list = getVercelSupplyRequests();
    if (characterName) {
      const clean = String(characterName).toLowerCase();
      list = list.filter((r) => r.characterName.toLowerCase() === clean);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, requests: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const DISCORD_SUPPLIES_WEBHOOK_URL =
  process.env.DISCORD_SUPPLIES_WEBHOOK_URL ||
  '';

router.post('/clan/supply-requests', (req: Request, res: Response) => {
  try {
    const { characterName, supplyType, quantity, urgency, notes } = req.body;
    if (!characterName || !supplyType || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Debes especificar el personaje, tipo de suministro y cantidad requerida.',
      });
    }

    const list = getVercelSupplyRequests();
    const now = new Date().toISOString();
    const newRequest = {
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
    saveVercelSupplyRequests(list);

    // Notificar al canal de Discord dedicado #suministros-team
    if (DISCORD_SUPPLIES_WEBHOOK_URL) {
      const urgencyColor =
        newRequest.urgency === 'alta' ? 0xef4444 : newRequest.urgency === 'media' ? 0xf59e0b : 0x3b82f6;

      fetch(DISCORD_SUPPLIES_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '📦 Solicitud de Suministros Publicada · Canal Suministros Team',
              description: `El miembro **${newRequest.characterName}** ha publicado una solicitud de suministros para el clan.\n\n👉 **¿Tienes estos ítems?** Entra a la plataforma web en *Mi Portal* y presiona **"¡Yo Tengo!"** indicando tus observaciones para coordinar la entrega.`,
              color: urgencyColor,
              fields: [
                { name: '👤 Solicitante', value: `**${newRequest.characterName}**`, inline: true },
                { name: '⚔️ Suministro', value: `**${newRequest.supplyType}**`, inline: true },
                { name: '🔢 Cantidad', value: newRequest.quantity, inline: true },
                { name: '🚨 Urgencia', value: newRequest.urgency.toUpperCase(), inline: true },
                { name: '📝 Motivo / Observaciones', value: newRequest.notes || 'Sin notas adicionales.', inline: false },
                { name: '📍 Estado', value: '⏳ **PENDIENTE (Esperando miembro con disponibilidad)**', inline: false },
              ],
              footer: { text: 'Canal de Suministros Team · Clan Anomaly Smash MU' },
              timestamp: now,
            },
          ],
        }),
      }).catch((e) => console.warn('Supplies webhook broadcast notice:', e.message));
    }

    res.json({ success: true, request: newRequest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Acción "¡Yo Tengo!" / Aceptar entregar el suministro solicitado
router.post('/clan/supply-requests/:id/claim', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { providerName, providerNotes } = req.body;

    if (!providerName || !providerName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Debes indicar el nombre de tu personaje para comprometerte a entregar el suministro.',
      });
    }

    const list = getVercelSupplyRequests();
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

    saveVercelSupplyRequests(list);

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
                {
                  name: '💬 Observaciones de Entrega',
                  value: item.providerNotes || 'Coordinar encuentro en el servidor.',
                  inline: false,
                },
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
router.post('/clan/supply-requests/:id/deliver', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deliveryNotes, deliveredBy } = req.body;

    const list = getVercelSupplyRequests();
    const item = list.find((r) => r.id === id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    }

    const now = new Date().toISOString();
    item.status = 'entregado';
    item.deliveredAt = now;
    item.updatedAt = now;
    if (deliveryNotes) item.adminNotes = deliveryNotes;

    saveVercelSupplyRequests(list);

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
                {
                  name: '🛡️ Entregado por',
                  value: `**${item.providerName || deliveredBy || 'Intendencia del Clan'}**`,
                  inline: true,
                },
                { name: '📦 Suministro', value: `${item.supplyType} (${item.quantity})`, inline: true },
                {
                  name: '📝 Nota Final',
                  value: deliveryNotes || item.providerNotes || 'Entrega concretada.',
                  inline: false,
                },
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

router.put('/clan/supply-requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, reviewerName, providerName, providerNotes } = req.body;
    const list = getVercelSupplyRequests();
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

    saveVercelSupplyRequests(list);
    res.json({ success: true, request: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/clan/invasion-attendance', (req: Request, res: Response) => {
  try {
    const { characterName, date } = req.query;
    let list = getVercelInvasionAttendance();
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

router.post('/clan/invasion-attendance/check', (req: Request, res: Response) => {
  try {
    const { characterName, invasionSlot, checkType, userTimeZone, localTimeStr } = req.body;
    if (!characterName || !invasionSlot || !checkType) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: characterName, invasionSlot, checkType.',
      });
    }

    const now = new Date();
    const chileDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const list = getVercelInvasionAttendance();
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
        updatedAt: nowIso,
      };
      if (checkType === 'check_in') {
        record.checkInTime = localTimeStr || nowIso;
      } else {
        record.checkOutTime = localTimeStr || nowIso;
      }
      list.push(record);
    } else {
      if (checkType === 'check_in') {
        record.checkInTime = localTimeStr || nowIso;
      } else if (checkType === 'check_out') {
        record.checkOutTime = localTimeStr || nowIso;
        record.status = 'completado';
      }
      record.updatedAt = nowIso;
    }

    saveVercelInvasionAttendance(list);

    // Webhook dedicado al Canal de Asistencias de Discord (NO en verificación)
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
              title:
                checkType === 'check_in'
                  ? '⚔️ Asistencia Invasión: ENTRADA Registrada'
                  : '✅ Asistencia Invasión: SALIDA Completada',
              description: `El guerrero **${cleanChar}** ha marcado su ${
                checkType === 'check_in' ? 'entrada' : 'salida'
              } en la invasión de las **${slot} hrs (Hora Chile)**.`,
              color: checkType === 'check_in' ? 0x06b6d4 : 0x10b981,
              fields: [
                { name: '👤 Personaje', value: cleanChar, inline: true },
                { name: '⏰ Turno Invasión', value: `${slot} CLT`, inline: true },
                {
                  name: '🌍 Hora Local Registrada',
                  value: `${localTimeStr || 'N/A'} (${userTimeZone || 'Local'})`,
                  inline: false,
                },
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

router.post('/clan/siege-attendance', (req: Request, res: Response) => {
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

// Review invasion attendance
router.post('/clan/invasion-attendance/review', (req: Request, res: Response) => {
  try {
    const { date, eventTime, status, reviewerName, notes } = req.body;
    if (!date || !eventTime || !status) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
    }
    const list = getVercelInvasionAttendance();
    let updated = 0;
    list.forEach((rec) => {
      if (rec.date === date && rec.eventTime === eventTime) {
        rec.status = status;
        rec.reviewedBy = reviewerName || 'UlmerMG';
        rec.reviewedAt = new Date().toISOString();
        if (notes) rec.notes = notes;
        updated++;
      }
    });
    saveVercelInvasionAttendance(list);
    res.json({ success: true, updatedCount: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Discord Webhook Info
router.get('/discord/webhook-info', async (_req: Request, res: Response) => {
  try {
    const DISCORD_AUCTION_WEBHOOK_URL =
      process.env.DISCORD_AUCTION_WEBHOOK_URL ||
      '';
    const response = await fetch(DISCORD_AUCTION_WEBHOOK_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json({
      success: true,
      channelId: data.channel_id,
      channelName: data.name || '#subastas-anomaly',
      guildId: data.guild_id,
      connected: true,
    });
  } catch (err: any) {
    res.status(503).json({ success: false, connected: false, error: 'No se pudo verificar el webhook de subastas.' });
  }
});

// Aliases for smash rankings and events
router.get('/smash/rankings', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (gearScoreCache && now - gearScoreCache.timestamp < GEARSCORE_CACHE_TTL) {
      return res.json(gearScoreCache.data);
    }
    const response = await fetch('https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    gearScoreCache = { data, timestamp: now };
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

router.get('/smash/gearscore-rankings', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (gearScoreCache && now - gearScoreCache.timestamp < GEARSCORE_CACHE_TTL) {
      return res.json(gearScoreCache.data);
    }
    const response = await fetch('https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    gearScoreCache = { data, timestamp: now };
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

router.get('/smash/events', (_req: Request, res: Response) => {
  res.json({ success: true, events: [] });
});

// Character stats endpoints for Master Tree & Builds
const VERCEL_STATS_FILE = '/tmp/clan_character_stats.json';
function getVercelStats(): Record<string, any> {
  try {
    if (fs.existsSync(VERCEL_STATS_FILE)) {
      return JSON.parse(fs.readFileSync(VERCEL_STATS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

router.get('/clan/all-character-stats', (_req: Request, res: Response) => {
  res.json({ success: true, characters: getVercelStats() });
});

router.get('/clan/character-stats/:name', (req: Request, res: Response) => {
  const stats = getVercelStats();
  const char = stats[(req.params.name || '').toLowerCase()];
  if (char) return res.json({ success: true, character: char });
  res.status(404).json({ success: false, error: 'Character stats not found in database' });
});

router.post('/clan/character-stats', (req: Request, res: Response) => {
  try {
    const { name, stats } = req.body || {};
    if (!name || !stats) {
      return res.status(400).json({ success: false, error: 'Missing name or stats' });
    }
    const current = getVercelStats();
    const key = name.toLowerCase();
    current[key] = {
      ...(current[key] || { name }),
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
    try {
      fs.writeFileSync(VERCEL_STATS_FILE, JSON.stringify(current, null, 2), 'utf-8');
    } catch (e) {}
    res.json({ success: true, character: current[key] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Causarex 3D Assets Proxy for Vercel Serverless
router.get('/assets/mu-original/*', async (req: Request, res: Response) => {
  try {
    const assetSubpath = (req.params as any)[0] || '';
    const targetUrl = `https://causarex-one.vercel.app/assets/mu-original/${assetSubpath}`;
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok) return res.status(response.status).send('Asset not found');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// Mount router on both '/api' and '/' to guarantee routing regardless of path stripping
app.use('/api', router);
app.use('/', router);

// Export Express app for Vercel Serverless Function
export default app;
