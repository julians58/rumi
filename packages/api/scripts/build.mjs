#!/usr/bin/env node

/**
 * Build script for @rumi/api Lambda deployment.
 *
 * 1. Runs esbuild to bundle src/lambda.ts → dist/lambda.js (Prisma externalized)
 * 2. Builds the migration handler: src/migrate-handler.ts → dist/migrate.js
 * 3. Copies Prisma client + engine binaries into dist/node_modules/
 *    so the Lambda asset includes everything needed at runtime.
 */

import { execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '..');
const distDir = resolve(apiRoot, 'dist');
const monorepoRoot = resolve(apiRoot, '../..');

// Step 0: Clean dist
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir, { recursive: true });

// Step 1: Bundle lambda.ts with esbuild
console.log('📦 Bundling lambda.ts with esbuild...');
execSync(
  'npx esbuild src/lambda.ts --bundle --platform=node --target=node20 --outfile=dist/lambda.js --external:@prisma/client --external:@prisma/engines --sourcemap',
  { cwd: apiRoot, stdio: 'inherit' },
);

// Step 2: Bundle migrate-handler.ts with esbuild
// The migration handler uses `pg` directly (no Prisma CLI needed),
// so we can bundle everything — no externals required.
console.log('📦 Bundling migrate-handler.ts with esbuild...');
try {
  execSync(
    'npx esbuild src/migrate-handler.ts --bundle --platform=node --target=node20 --outfile=dist/migrate.js --sourcemap',
    { cwd: apiRoot, stdio: 'inherit' },
  );
} catch {
  console.log('⚠️  migrate-handler.ts not found yet, skipping...');
}

// Step 3: Copy Prisma client into dist/node_modules/
console.log('📋 Copying Prisma client to dist/node_modules/...');

// Copy the generated Prisma client (includes the query engine binary)
const prismaGenerated = resolve(monorepoRoot, 'node_modules/.prisma');
const prismaClient = resolve(monorepoRoot, 'node_modules/@prisma/client');

const distNodeModules = resolve(distDir, 'node_modules');
mkdirSync(resolve(distNodeModules, '.prisma'), { recursive: true });
mkdirSync(resolve(distNodeModules, '@prisma/client'), { recursive: true });

cpSync(prismaGenerated, resolve(distNodeModules, '.prisma'), { recursive: true });
cpSync(prismaClient, resolve(distNodeModules, '@prisma/client'), { recursive: true });

// Step 4: Copy the Prisma schema (needed for migrations Lambda)
const schemaSource = resolve(monorepoRoot, 'packages/db/prisma/schema.prisma');
const migrationsSource = resolve(monorepoRoot, 'packages/db/prisma/migrations');

mkdirSync(resolve(distDir, 'prisma'), { recursive: true });
cpSync(schemaSource, resolve(distDir, 'prisma/schema.prisma'));

if (existsSync(migrationsSource)) {
  cpSync(migrationsSource, resolve(distDir, 'prisma/migrations'), { recursive: true });
}

// Step 5: Remove non-Linux engine binaries to reduce Lambda package size
console.log('🧹 Removing non-Linux engine binaries...');
const prismaClientDir = resolve(distNodeModules, '.prisma/client');
for (const file of readdirSync(prismaClientDir)) {
  if (file.endsWith('.dylib.node') || file.includes('darwin')) {
    unlinkSync(resolve(prismaClientDir, file));
    console.log(`   Removed: ${file}`);
  }
}

// Step 6: Verify critical files exist
console.log('🔍 Verifying build output...');
const criticalFiles = [
  'lambda.js',
  'node_modules/@prisma/client/index.js',
  'node_modules/@prisma/client/package.json',
  'node_modules/.prisma/client/index.js',
  'node_modules/.prisma/client/package.json',
  'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
];
let allGood = true;
for (const f of criticalFiles) {
  const fullPath = resolve(distDir, f);
  if (!existsSync(fullPath)) {
    console.error(`❌ MISSING: ${f}`);
    allGood = false;
  }
}
if (!allGood) {
  console.error('❌ Build verification failed! Some critical files are missing.');
  process.exit(1);
}

console.log('✅ Build complete! dist/ is ready for Lambda deployment.');
