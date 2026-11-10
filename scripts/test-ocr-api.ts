import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import app from '../api/index.ts';

const imagePath = process.argv[2];
if (!imagePath) throw new Error('Indica la ruta de una captura PNG para probar OCR.');
const imageBase64 = `data:image/png;base64,${fs.readFileSync(imagePath).toString('base64')}`;
const server = app.listen(0, '127.0.0.1');

try {
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No se abrió el servidor de prueba.');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/items/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.engine, 'ocr');
  assert.equal(result.data.itemName, 'Wings of Magic');
  assert.equal(result.data.itemLevel, '+0');
  assert.equal(result.data.defense, 37);
  assert.equal(result.data.gearScore, 152);
  assert.equal(result.data.harmonyOption, '');
  assert.equal(result.data.hasLuck, false);
  assert.equal(result.data.durability, 0);
  assert.ok(result.data.additionalStat.includes('Increase 32% of Damage'));
  assert.ok(result.data.additionalStat.includes('Absorb 39% of Damage'));
  console.log('PASS: la API reconoce Wings of Magic +0 sin atributos heredados.');
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
