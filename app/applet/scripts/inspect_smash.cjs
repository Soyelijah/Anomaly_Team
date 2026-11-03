const fs = require('fs');

async function run() {
  const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
  const url = "https://www.smashmu.com/_next/static/chunks/app/%5Blang%5D/profile/%5Bname%5D/page-85fcb4e1c3d7aec7.js?dpl=dpl_FRBMhyf56nYsh9xUALahkB4CBPLN";
  const r = await fetch(url);
  const text = await r.text();
  
  const idx = text.indexOf("El modelo y sus texturas");
  fs.writeFileSync('smash_snippet.txt', text.slice(Math.max(0, idx - 600), idx + 1200));
  
  // also find all occurrences of .e( or webpack_require
  const dynMatches = [...text.matchAll(/__webpack_require__\.e\(([^\)]+)\)/g)].map(m => m[1]);
  fs.writeFileSync('smash_chunks.json', JSON.stringify(dynMatches, null, 2));
}

run().catch(err => fs.writeFileSync('smash_err.txt', String(err)));
