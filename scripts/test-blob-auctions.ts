import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { del, get } from '@vercel/blob';
import { createBlobAuctionStorage, mutateAuctions } from '../api/auctionStore.ts';

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) throw new Error('Falta BLOB_READ_WRITE_TOKEN.');

const pathname = `anomaly-team/tests/auction-store-${randomUUID()}.json`;
const storage = createBlobAuctionStorage<{ id: string; currentBid: number }>([], pathname);

try {
  assert.deepEqual((await storage.read()).items, []);
  await mutateAuctions(storage, (items) => {
    items.push({ id: 'test-auction', currentBid: 10 });
    return true;
  });
  assert.equal((await storage.read()).items[0].currentBid, 10);

  await Promise.all([
    mutateAuctions(storage, (items) => { items[0].currentBid += 5; return true; }),
    mutateAuctions(storage, (items) => { items[0].currentBid += 7; return true; }),
  ]);
  assert.equal((await storage.read()).items[0].currentBid, 22);

  await mutateAuctions(storage, (items) => { items.splice(0); return true; });
  assert.deepEqual((await storage.read()).items, []);
  console.log('PASS: Blob privado conserva alta, pujas simultáneas y lista vacía.');
} finally {
  await del(pathname, { token });
  assert.equal(await get(pathname, { access: 'private', token, useCache: false }), null);
  console.log('PASS: archivo temporal de prueba eliminado.');
}
