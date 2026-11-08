async function main() {
  const r = await fetch('https://www.smashmu.com/es/informacion');
  const text = await r.text();
  
  // Find all text inside tags
  const matches = [...text.matchAll(/>([^<]+)</g)].map(m => m[1].trim()).filter(t => t.length > 2);

  console.log('Total matches:', matches.length);
  for (let i = 0; i < matches.length; i++) {
    const l = matches[i];
    if (/reset|stat|punto|nivel|master|borra|acumula|límite|max|experiencia/i.test(l)) {
      console.log(`[${i}] ${l}`);
      if (matches[i+1]) console.log(`   +1: ${matches[i+1]}`);
      if (matches[i+2]) console.log(`   +2: ${matches[i+2]}`);
    }
  }
}

main().catch(console.error);
