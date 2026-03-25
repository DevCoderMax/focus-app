import type { VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import db from './db/turso';
import { withAuth, type AuthenticatedRequest } from './middleware/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  switch (req.method) {
    case 'GET':
      return getTopics(req, res, userId);
    case 'POST':
      return createTopic(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTopics(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const subjectId = req.query?.subjectId as string | undefined;
    
    let sql = 'SELECT * FROM topics WHERE user_id = ?';
    const args: any[] = [userId];

    if (subjectId) {
      sql += ' AND subject_id = ?';
      args.push(subjectId);
    }

    sql += ' ORDER BY order_num ASC';

    const result = await db.execute({ sql, args });

    const topics = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      subjectId: row.subject_id,
      name: row.name,
      orderNum: row.order_num,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    return res.status(500).json({ error: 'Erro ao buscar tópicos' });
  }
}

async function createTopic(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { subjectId, name, orderNum, description } = req.body;

    if (!subjectId || !name) {
      return res.status(400).json({ error: 'Subject ID e nome são obrigatórios' });
    }

    // Verify subject belongs to user
    const subjectCheck = await db.execute({
      sql: 'SELECT id FROM subjects WHERE id = ? AND user_id = ?',
      args: [subjectId, userId],
    });

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO topics (id, user_id, subject_id, name, order_num, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, subjectId, name, orderNum || 0, description || null, now, now],
    });

    return res.status(201).json({
      id,
      userId,
      subjectId,
      name,
      orderNum: orderNum || 0,
      description: description || null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Create topic error:', error);
    return res.status(500).json({ error: 'Erro ao criar tópico' });
  }
}

export default withAuth(handler);
