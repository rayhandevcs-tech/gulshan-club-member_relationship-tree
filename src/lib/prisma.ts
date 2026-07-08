import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
