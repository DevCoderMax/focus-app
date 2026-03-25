import type { VercelRequest, VercelResponse } from '@vercel/node';
import db from './turso';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST (for security)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for migration secret (optional security)
  const migrationSecret = req.headers['x-migration-secret'];
  if (process.env.MIGRATION_SECRET && migrationSecret !== process.env.MIGRATION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Read all migration files
    const migrationsDir = path.join(process.cwd(), 'api', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const allResults = [];

    for (const file of migrationFiles) {
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const fileResults = [];
      for (const statement of statements) {
        try {
          await db.execute(statement);
          fileResults.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
        } catch (error: any) {
          // Ignore "already exists" or "duplicate column name" errors
          if (
            error.message?.includes('already exists') || 
            error.message?.includes('duplicate column name') ||
            error.message?.includes('duplicate column')
          ) {
            fileResults.push({ statement: statement.substring(0, 50) + '...', status: 'skipped (already exists)' });
          } else {
            fileResults.push({ statement: statement.substring(0, 50) + '...', status: 'error', error: error.message });
          }
        }
      }
      allResults.push({ file, results: fileResults });
    }

    return res.status(200).json({
      message: 'Migration completed',
      results: allResults,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
