import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const AUCTIONS_PATH = 'anomaly-team/auctions.json';

export class AuctionStorageConflictError extends Error {
  constructor() {
    super('La subasta cambió mientras se guardaba. Inténtalo de nuevo.');
  }
}

type Snapshot<T> = { items: T[]; etag: string | null };

export interface AuctionStorage<T> {
  read(): Promise<Snapshot<T>>;
  write(items: T[], etag: string | null): Promise<void>;
}

export function createBlobAuctionStorage<T>(seed: T[], pathname = AUCTIONS_PATH): AuctionStorage<T> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Falta BLOB_READ_WRITE_TOKEN para guardar las subastas.');

  return {
    async read() {
      const result = await get(pathname, { access: 'private', token, useCache: false });
      if (!result) return { items: structuredClone(seed), etag: null };
      if (!result.stream) throw new Error('No se pudo leer el contenido de subastas.');
      const parsed: unknown = JSON.parse(await new Response(result.stream).text());
      if (!Array.isArray(parsed)) throw new Error('El almacén de subastas contiene datos inválidos.');
      // Origin reads may return a weak HTTP ETag (W/"..."); Blob's ifMatch
      // requires the corresponding strong ETag.
      return { items: parsed as T[], etag: result.blob.etag.replace(/^W\//, '') };
    },
    async write(items, etag) {
      await put(pathname, JSON.stringify(items), {
        access: 'private',
        token,
        addRandomSuffix: false,
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : {}),
      });
    },
  };
}

export async function mutateAuctions<T, R>(
  storage: AuctionStorage<T>,
  mutation: (items: T[]) => R,
  attempts = 5,
): Promise<R> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { items, etag } = await storage.read();
    const result = mutation(items);
    if (result === null || result === false) return result;
    try {
      await storage.write(items, etag);
      return result;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      // Two requests can both see an absent file. Only the first create wins.
      if (etag === null && (await storage.read()).etag !== null) continue;
      throw error;
    }
  }
  throw new AuctionStorageConflictError();
}
