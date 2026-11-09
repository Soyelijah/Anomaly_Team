import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BlobError, BlobPreconditionFailedError } from '@vercel/blob';
import { createBlobAuctionStorage, mutateAuctions, type AuctionStorage } from './auctionStore.ts';

type Auction = { id: string; currentBid: number };

function fakeStorage(initial: Auction[]): AuctionStorage<Auction> & { current(): Auction[] } {
  let items = structuredClone(initial);
  let version = 0;
  return {
    async read() { return { items: structuredClone(items), etag: String(version) }; },
    async write(next, etag) {
      if (etag !== String(version)) throw new BlobPreconditionFailedError();
      items = structuredClone(next);
      version++;
    },
    current() { return structuredClone(items); },
  };
}

test('two simultaneous changes both survive a version conflict', async () => {
  const storage = fakeStorage([{ id: 'one', currentBid: 10 }]);
  const [bid, addition] = await Promise.all([
    mutateAuctions(storage, (items) => {
      items[0].currentBid = 20;
      return items[0].currentBid;
    }),
    mutateAuctions(storage, (items) => {
      items.push({ id: 'two', currentBid: 5 });
      return items.length;
    }),
  ]);
  assert.equal(bid, 20);
  assert.ok(addition >= 1);
  assert.deepEqual(storage.current(), [
    { id: 'one', currentBid: 20 },
    { id: 'two', currentBid: 5 },
  ]);
});

test('empty auction list remains empty after a read from another instance', async () => {
  const storage = fakeStorage([{ id: 'one', currentBid: 10 }]);
  await mutateAuctions(storage, (items) => { items.splice(0); return true; });
  const secondInstance = await storage.read();
  assert.deepEqual(secondInstance.items, []);
});

test('concurrent first writes preserve both items', async () => {
  let items: Auction[] = [];
  let etag: string | null = null;
  const storage: AuctionStorage<Auction> = {
    async read() { return { items: structuredClone(items), etag }; },
    async write(next, expected) {
      if (etag !== expected) throw new BlobError('already exists');
      items = structuredClone(next);
      etag = 'written';
    },
  };
  await Promise.all([
    mutateAuctions(storage, (current) => { current.push({ id: 'first', currentBid: 1 }); return true; }),
    mutateAuctions(storage, (current) => { current.push({ id: 'second', currentBid: 2 }); return true; }),
  ]);
  assert.deepEqual(items.map((item) => item.id), ['first', 'second']);
});

test('missing Blob token fails closed', () => {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    assert.throws(() => createBlobAuctionStorage([]), /BLOB_READ_WRITE_TOKEN/);
  } finally {
    if (previous === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previous;
  }
});
