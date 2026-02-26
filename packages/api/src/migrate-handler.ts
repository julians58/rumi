import { createHash, randomUUID } from 'crypto';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';
import { resolveDatabaseUrl } from './lib/secrets';

/**
 * Lambda handler for running Prisma migrations via CDK Custom Resource.
 * Executes migration SQL files directly against the database using
 * raw SQL — no Prisma CLI or schema engine binary needed.
 *
 * This handler is invoked as a CloudFormation Custom Resource:
 * - On CREATE: runs pending migrations
 * - On UPDATE: runs pending migrations (timestamp property forces re-execution)
 * - On DELETE: no-op
 */
export async function handler(event: {
  RequestType: 'Create' | 'Update' | 'Delete';
  PhysicalResourceId?: string;
}) {
  console.log('Migration handler invoked:', event.RequestType);

  if (event.RequestType === 'Delete') {
    console.log('Delete event — skipping migrations');
    return {
      PhysicalResourceId: event.PhysicalResourceId || 'migrations',
    };
  }

  // Resolve DATABASE_URL from Secrets Manager
  await resolveDatabaseUrl();

  // Use pg directly to handle multi-statement SQL (no Prisma CLI needed)
  // Strip sslmode from connection string — pg's connection string parser overrides
  // the ssl config object. We handle SSL explicitly via the ssl option instead.
  const connectionString = (process.env.DATABASE_URL || '').replace(/[&?]sslmode=[^&]*/g, '');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    // Ensure _prisma_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum"            VARCHAR(64) NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255) NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query<{ migration_name: string }>(
      `SELECT "migration_name" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL AND "finished_at" IS NOT NULL`,
    );
    const appliedNames = new Set(applied.map((m) => m.migration_name));

    // Read migration directories (sorted chronologically by folder name)
    const migrationsDir = resolve(__dirname, 'prisma/migrations');

    if (!existsSync(migrationsDir)) {
      console.log('No migrations directory found at:', migrationsDir);
      return { PhysicalResourceId: 'migrations' };
    }

    const dirs = readdirSync(migrationsDir)
      .filter((d) => !d.startsWith('_') && d !== 'migration_lock.toml')
      .sort();

    console.log(`Found ${dirs.length} migrations, ${appliedNames.size} already applied`);

    let newMigrations = 0;

    for (const dir of dirs) {
      if (appliedNames.has(dir)) continue;

      const sqlPath = resolve(migrationsDir, dir, 'migration.sql');
      if (!existsSync(sqlPath)) {
        console.warn(`Skipping ${dir}: no migration.sql found`);
        continue;
      }

      const sql = readFileSync(sqlPath, 'utf-8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const id = randomUUID();

      console.log(`Applying migration: ${dir}`);

      // Record migration start
      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at")
         VALUES ($1, $2, $3, NOW())`,
        [id, checksum, dir],
      );

      try {
        // Execute migration SQL (may contain multiple statements)
        await client.query(sql);

        // Mark migration as completed
        await client.query(
          `UPDATE "_prisma_migrations"
           SET "finished_at" = NOW(), "applied_steps_count" = 1
           WHERE "id" = $1`,
          [id],
        );

        console.log(`Migration applied: ${dir}`);
        newMigrations++;
      } catch (error: unknown) {
        const err = error as Error;
        console.error(`Migration failed: ${dir}`, err.message);

        // Record failure in logs column
        await client.query(
          `UPDATE "_prisma_migrations" SET "logs" = $1 WHERE "id" = $2`,
          [err.message, id],
        );

        throw new Error(`Migration ${dir} failed: ${err.message}`);
      }
    }

    console.log(
      newMigrations > 0
        ? `Applied ${newMigrations} new migration(s)`
        : 'No new migrations to apply',
    );
  } finally {
    await client.end();
  }

  return {
    PhysicalResourceId: 'migrations',
  };
}
