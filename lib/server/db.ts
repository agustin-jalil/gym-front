import "server-only";
import { Pool } from "pg";

declare global {
  var __gymPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return new Pool({ connectionString });
}

export function getPool(): Pool {
  globalThis.__gymPool ??= createPool();
  return globalThis.__gymPool;
}
