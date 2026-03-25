import type { VercelResponse } from '@vercel/node';
import db from './db/turso';
import { withAuth, type AuthenticatedRequest } from './middleware/auth';

const SYNC_TABLES = [
  'subjects',
  'topics',
  'subtopics',
  'notes',
  'questions',
  'study_sessions',
  'review_schedules',
  'review_attempts',
  'question_history',
  'activity_plan_items',
  'settings'
];

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  switch (req.method) {
    case 'GET':
      return pullData(req, res, userId);
    case 'POST':
      return pushData(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function pullData(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const lastSync = req.query?.lastSync as string | undefined;
    const responseData: any = {
      syncedAt: new Date().toISOString(),
    };

    for (const table of SYNC_TABLES) {
      let sql = `SELECT * FROM ${table} WHERE user_id = ?`;
      const args: any[] = [userId];

      if (lastSync) {
        sql += ' AND updated_at > ?';
        args.push(lastSync);
      } else {
        // If it's a fresh sync, don't even send things that are already deleted
        sql += ' AND deleted_at IS NULL';
      }

      const result = await db.execute({ sql, args });
      
      // CamelCase conversion for frontend
      const camelTable = table.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      responseData[camelTable] = result.rows.map((row) => {
        const entry: any = {};
        for (const [key, value] of Object.entries(row)) {
          const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          entry[camelKey] = value;
        }
        return entry;
      });
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Pull data error:', error);
    return res.status(500).json({ error: 'Erro ao sincronizar dados' });
  }
}

async function pushData(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const data = req.body;
    let syncedCount = 0;

    // We'll use a transaction for all updates
    const statements: any[] = [];

    for (const table of SYNC_TABLES) {
      const camelTable = table.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const items = data[camelTable];

      if (items && Array.isArray(items)) {
        for (const item of items) {
          // Special case for settings (primary key is user_id)
          const isSettings = table === 'settings';
          const id = isSettings ? userId : item.id;

          // 1. Check if newer exists
          const existing = await db.execute({
            sql: `SELECT updated_at FROM ${table} WHERE ${isSettings ? 'user_id' : 'id'} = ? AND user_id = ?`,
            args: [id, userId],
          });

          // Build statement based on whether it's an update or insert
          if (existing.rows.length > 0) {
            const remoteUpdatedAt = existing.rows[0].updated_at as string;
            if (new Date(item.updatedAt) <= new Date(remoteUpdatedAt)) {
              continue; // Skip if remote is newer or same age
            }

            // Update
            const sets: string[] = [];
            const args: any[] = [];

            for (const [key, value] of Object.entries(item)) {
              if (key === 'id' || key === 'userId' || key === 'createdAt') continue;
              const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
              sets.push(`${snakeKey} = ?`);
              args.push(
                value === undefined || value === null
                  ? null
                  : typeof value === 'object'
                  ? JSON.stringify(value)
                  : value
              );
            }

            if (sets.length > 0) {
              statements.push({
                sql: `UPDATE ${table} SET ${sets.join(', ')} WHERE ${isSettings ? 'user_id' : 'id'} = ? AND user_id = ?`,
                args: [...args, id, userId],
              });
              syncedCount++;
            }
          } else if (!item.deletedAt) {
            // Insert (only if not already deleted)
            const cols: string[] = ['user_id'];
            const placeholders: string[] = ['?'];
            const args: any[] = [userId];

            if (!isSettings) {
              cols.push('id');
              placeholders.push('?');
              args.push(item.id);
            }

            for (const [key, value] of Object.entries(item)) {
              if (key === 'id' || key === 'userId') continue;
              const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
              cols.push(snakeKey);
              placeholders.push('?');
              args.push(
                value === undefined || value === null
                  ? null
                  : typeof value === 'object'
                  ? JSON.stringify(value)
                  : value
              );
            }

            statements.push({
              sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
              args,
            });
            syncedCount++;
          }
        }
      }
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return res.status(200).json({
      synced: syncedCount,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Push data error:', error);
    return res.status(500).json({ error: 'Erro ao enviar dados' });
  }
}

export default withAuth(handler);
