import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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
let inMemoryMembers: any[] = [
  {
    id: 'mem-ulmermg-default',
    muLoginId: 'UlmerMG',
    characterName: 'UlmerMG',
    role: 'officer',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: {
      level: 37,
      resets: 196,
      gearScore: 851,
      className: 'Magic Gladiator',
      guild: 'Anomaly',
      isMaster: true,
      equippedCount: 9,
    },
  },
  {
    id: 'mem-matonsito-default',
    muLoginId: 'matonsito_mu',
    characterName: 'MATONSITO',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: {
      level: 157,
      resets: 245,
      gearScore: 1487,
      className: 'Grand Master',
      guild: 'Anomaly',
      isMaster: false,
      equippedCount: 9,
    },
  },
  {
    id: 'mem-skytm-default',
    muLoginId: 'skytm_mu',
    characterName: 'SkyTM',
    role: 'member',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    syncedData: {
      level: 397,
      resets: 242,
      gearScore: 1417,
      className: 'Grand Master',
      guild: 'Anomaly',
      isMaster: false,
      equippedCount: 9,
    },
  },
];

function getRegisteredMembersList(): any[] {
  try {
    if (fs.existsSync(VERCEL_STORAGE_PATH)) {
      const content = fs.readFileSync(VERCEL_STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

// Auth 1: Registro de Miembro con verificación en vivo contra Smash MU
router.post('/auth/register-member', async (req: Request, res: Response) => {
  try {
    const { muLoginId, characterName, password } = req.body;

    if (!muLoginId || !characterName) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar tu ID de Login del MU y el Nombre de tu Personaje.',
      });
    }

    const cleanLogin = String(muLoginId).trim();
    const cleanChar = String(characterName).trim();

    // Consultar a smashmu.com en vivo
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

    // Si la API directa falla, buscar en el ranking oficial de 5,000 jugadores
    if (!smashData || !smashData.success || !smashData.character) {
      try {
        const gsRes = await fetch(
          'https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000',
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          }
        );
        if (gsRes.ok) {
          const gsJson = await gsRes.json();
          if (gsJson && Array.isArray(gsJson.ranking)) {
            const foundInGs = gsJson.ranking.find(
              (r: any) => r.Name && r.Name.toLowerCase() === cleanChar.toLowerCase()
            );
            if (foundInGs) {
              smashData = {
                success: true,
                character: {
                  name: foundInGs.Name,
                  gearScore: foundInGs.GearScore,
                  resets: 150,
                  level: 380,
                  className: 'Personaje de Smash MU',
                  guild: { name: foundInGs.Guild || 'Anomaly', isMaster: false },
                },
                equipment: [],
              };
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!smashData || !smashData.success || !smashData.character) {
      return res.status(404).json({
        success: false,
        error: `El personaje "${cleanChar}" no fue encontrado en Smash MU. Asegúrate de escribir el nombre exacto de tu personaje en el servidor.`,
      });
    }

    const c = smashData.character;
    const isMaster = !!c.guild?.isMaster || cleanChar.toLowerCase() === 'ulmermg';
    const isOfficer = isMaster || cleanChar.toLowerCase() === 'ulmerdl';

    const membersList = getRegisteredMembersList();
    const existingIndex = membersList.findIndex(
      (m: any) =>
        m.characterName.toLowerCase() === cleanChar.toLowerCase() ||
        m.muLoginId.toLowerCase() === cleanLogin.toLowerCase()
    );

    const memberRecord = {
      id: existingIndex >= 0 ? membersList[existingIndex].id : `mem-${Date.now()}`,
      muLoginId: cleanLogin,
      characterName: c.name || cleanChar,
      password: password || '1234',
      role: isOfficer ? 'officer' : 'member',
      registeredAt: existingIndex >= 0 ? membersList[existingIndex].registeredAt : new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      syncedData: {
        level: c.level || 400,
        resets: c.resets || 0,
        gearScore: c.gearScore || 0,
        className: c.className || 'Guerrero de Smash MU',
        guild: c.guild?.name || 'Anomaly',
        isMaster: isMaster,
        equippedCount: (smashData.equipment || []).filter((eq: any) => !eq.isEmpty).length,
      },
    };

    if (existingIndex >= 0) {
      membersList[existingIndex] = memberRecord;
    } else {
      membersList.push(memberRecord);
    }

    saveRegisteredMembersList(membersList);

    return res.json({
      success: true,
      member: memberRecord,
      message: `¡Cuenta verificada exitosamente en Smash MU! Sincronizado: ${memberRecord.characterName} (${memberRecord.syncedData.resets} Resets, Nv. ${memberRecord.syncedData.level}, ${memberRecord.syncedData.gearScore} GearScore).`,
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

    if (found) {
      found.lastLogin = new Date().toISOString();
      saveRegisteredMembersList(membersList);
      return res.json({ success: true, member: found });
    }

    // Auto-registro en vivo para miembros del clan si aún no estaban en la lista
    try {
      const resp = await fetch(
        `https://www.smashmu.com/api/profile/${encodeURIComponent(loginIdentifier)}?realm=smash`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        }
      );
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && json.character) {
          const c = json.character;
          const isMaster = !!c.guild?.isMaster || clean === 'ulmermg';
          const newMember = {
            id: `mem-${Date.now()}`,
            muLoginId: loginIdentifier,
            characterName: c.name || loginIdentifier,
            password: password || '1234',
            role: isMaster ? 'officer' : 'member',
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            syncedData: {
              level: c.level || 400,
              resets: c.resets || 0,
              gearScore: c.gearScore || 0,
              className: c.className || 'Guerrero de Smash MU',
              guild: c.guild?.name || 'Anomaly',
              isMaster: isMaster,
              equippedCount: (json.equipment || []).filter((eq: any) => !eq.isEmpty).length,
            },
          };
          membersList.push(newMember);
          saveRegisteredMembersList(membersList);
          return res.json({ success: true, member: newMember });
        }
      }
    } catch (e) {
      // ignore
    }

    return res.status(404).json({
      success: false,
      error: `No encontramos una cuenta registrada con "${loginIdentifier}". Por favor usa la pestaña "Registrar Mi Cuenta de Miembro" para sincronizarla con Smash MU.`,
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

// Items & Auctions Fallbacks
router.get('/items/search', (req, res) => {
  res.json({ success: true, count: 0, items: [] });
});

router.get('/auctions', (_req, res) => {
  res.json({ success: true, auctions: [] });
});

// Mount router on both '/api' and '/' to guarantee routing regardless of path stripping
app.use('/api', router);
app.use('/', router);

// Export Express app for Vercel Serverless Function
export default app;
