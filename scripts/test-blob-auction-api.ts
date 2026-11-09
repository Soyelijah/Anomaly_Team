import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { del, get } from '@vercel/blob';
import app from '../api/index.ts';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) throw new Error('Falta BLOB_READ_WRITE_TOKEN.');
process.env.NODE_ENV = 'test';
const pathname = `anomaly-team/tests/auction-api-${randomUUID()}.json`;
process.env.AUCTIONS_BLOB_PATH = pathname;
const webhook = process.env.DISCORD_AUCTION_WEBHOOK_URL;
let discordMessageId: string | undefined;

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No se abrió el servidor de prueba.');
const base = `http://127.0.0.1:${address.port}/api/auctions`;

async function request(method: string, suffix = '', body?: unknown) {
  const response = await fetch(`${base}${suffix}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  assert.ok(response.ok, `${method} ${suffix}: ${response.status} ${JSON.stringify(result)}`);
  return result;
}

try {
  const before = await request('GET');
  assert.equal(before.auctions.length, 2);

  const created = await request('POST', '', {
    id: `test-${randomUUID()}`,
    itemName: 'Prueba de persistencia',
    es_subasta: false,
    startingBid: 10,
  });
  const id = created.item.id;
  assert.equal((await request('GET')).auctions.length, 3);

  const bid = await request('POST', `/${id}/bid`, { amount: 15, bidder: 'Prueba' });
  assert.equal(bid.item.currentBid, 15);
  const edited = await request('PUT', `/${id}`, { buyoutPrice: 30 });
  assert.equal(edited.item.buyoutPrice, 30);
  const sold = await request('POST', `/${id}/sell`, { precioFinal: 20, ganador: 'Prueba' });
  assert.equal(sold.item.status, 'sold');

  await request('DELETE', `/${id}`);
  const after = await request('GET');
  assert.equal(after.auctions.length, 2);
  assert.ok(!after.auctions.some((item: { id: string }) => item.id === id));
  console.log('PASS: API real de subastas guarda, puja, edita, vende y borra en Blob privado.');

  if (process.env.TEST_DISCORD === '1') {
    assert.ok(webhook, 'Falta DISCORD_AUCTION_WEBHOOK_URL para la prueba de Discord.');
    const announced = await request('POST', '', {
      id: `test-discord-${randomUUID()}`,
      itemName: '[PRUEBA TEMPORAL] Subasta Blob',
      es_subasta: true,
      startingBid: 10,
    });
    discordMessageId = announced.item.discord_message_id;
    assert.ok(discordMessageId);
    assert.equal((await fetch(`${webhook}/messages/${discordMessageId}`)).status, 200);

    const discordBid = await request('POST', `/${announced.item.id}/bid`, { amount: 15, bidder: 'Prueba Discord' });
    assert.equal(discordBid.item.discord_message_id, discordMessageId);
    const bidMessage = await (await fetch(`${webhook}/messages/${discordMessageId}`)).text();
    assert.ok(bidMessage.includes('Prueba Discord'));

    const discordEdit = await request('PUT', `/${announced.item.id}`, { buyoutPrice: 30 });
    assert.equal(discordEdit.item.discord_message_id, discordMessageId);
    const editedMessage = await (await fetch(`${webhook}/messages/${discordMessageId}`)).text();
    assert.ok(editedMessage.includes('30'));

    const discordSold = await request('POST', `/${announced.item.id}/sell`, { precioFinal: 20, ganador: 'Ganador Prueba' });
    assert.equal(discordSold.item.discord_message_id, discordMessageId);
    const soldMessage = await (await fetch(`${webhook}/messages/${discordMessageId}`)).text();
    assert.ok(soldMessage.includes('Ganador Prueba'));

    const notified = await request('POST', `/${announced.item.id}/notify-sold`, { precioFinal: 20, ganador: 'Ganador Prueba' });
    assert.equal(notified.item.discord_message_id, discordMessageId);

    await request('DELETE', `/${announced.item.id}`);
    assert.equal((await fetch(`${webhook}/messages/${discordMessageId}`)).status, 404);
    discordMessageId = undefined;
    console.log('PASS: anuncio temporal creado, actualizado por puja/edición/venta y eliminado en Discord.');
  }
} finally {
  if (discordMessageId && webhook) {
    const cleanup = await fetch(`${webhook}/messages/${discordMessageId}`, { method: 'DELETE' });
    assert.ok(cleanup.ok || cleanup.status === 404, 'No se pudo limpiar el anuncio temporal de Discord.');
  }
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await del(pathname, { token });
  assert.equal(await get(pathname, { access: 'private', token, useCache: false }), null);
  console.log('PASS: archivo temporal de API eliminado.');
}
