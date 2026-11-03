const fs = require('fs');

async function test() {
  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
  const url = 'https://www.smashmu.com/_next/static/chunks/25949.9422ec045695dbf1.js';
  const r = await fetch(url);
  console.log('Status:', r.status);
  const text = await r.text();
  console.log('Length:', text.length);

  fs.writeFileSync('scene_chunk.txt', text);

  // Search for how assets are fetched inside CharacterScene
  const fetches = [...text.matchAll(/fetch\s*\(\s*`([^`]+)`/g)].map(m => m[1]);
  console.log('Template fetch URLs:', fetches);

  // Search for paths containing Item or Player or Data or bmd or glb
  const assetPaths = [...text.matchAll(/["'\`]([^"'`]*(?:Player|Item|Skill|Effect|data|\.bmd|\.glb|\.json)[^"'`]*)/gi)].map(m => m[1]);
  console.log('Asset path references:', [...new Set(assetPaths)].slice(0, 30));
}

test().catch(console.error);
