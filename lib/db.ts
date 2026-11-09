
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is niet ingesteld.");
}

const globalForPool = globalThis as unknown as {
  databasePool?: Pool;
};

export const db =
  globalForPool.databasePool ??
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.databasePool = db;
}
