const fs = require('fs');

async function main() {
  const r = await fetch('https://www.smashmu.com/es/informacion');
  const text = await r.text();
  fs.writeFileSync('smash-info.html', text);
  
  // Find all visible text by stripping tags
  const clean = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log('Total non-empty lines:', clean.length);
  for (let i = 0; i < clean.length; i++) {
    const l = clean[i];
    if (/reset|stats|punto|nivel|master|borra|acumula|límite|max/i.test(l)) {
      console.log(`[${i}] ${l}`);
      if (clean[i+1]) console.log(`   +1: ${clean[i+1]}`);
      if (clean[i+2]) console.log(`   +2: ${clean[i+2]}`);
    }
  }
}

main().catch(console.error);
