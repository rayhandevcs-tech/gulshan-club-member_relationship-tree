import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  // Supabase's pooler presents a certificate chain Node's default CA store
  // doesn't trust as a public root, which fails as P1011 "self-signed
  // certificate in certificate chain". A `ssl` object alone doesn't fix it —
  // pg's own sslmode=require parsing (from the connection string) overrides it
  // and forces full chain verification, so sslmode must be stripped from the
  // URL first for the explicit `ssl` config below to actually take effect.
  // The connection is still encrypted; this only skips chain verification.
  const connectionUrl = new URL(process.env.DATABASE_URL!);
  connectionUrl.searchParams.delete('sslmode');
  const adapter = new PrismaPg({
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
}

// Only 'database' mode (see dataSource.ts) ever actually queries through
// this — 'static'/'api' mode never call the /api/members routes that import
// it. Deferring the DATABASE_URL parsing + client construction until the
// first real property access (instead of at module load) means this file
// can be imported with no DATABASE_URL set at all — e.g. during Next's
// build-time route analysis, or on a machine only running 'api' mode,
// which has no reason to hold Postgres credentials.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = globalForPrisma.prisma ?? createPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
