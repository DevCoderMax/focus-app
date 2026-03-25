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
      return getSubjects(req, res, userId);
    case 'POST':
      return createSubject(req, res, userId);
    case 'PUT':
      return updateSubject(req, res, userId);
    case 'DELETE':
      return deleteSubject(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSubjects(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM subjects WHERE user_id = ? ORDER BY order_num ASC',
      args: [userId],
    });

    const subjects = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      orderNum: row.order_num,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({ error: 'Erro ao buscar matérias' });
  }
}

async function createSubject(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { name, orderNum } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO subjects (id, user_id, name, order_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, userId, name, orderNum || 0, now, now],
    });

    return res.status(201).json({
      id,
      userId,
      name,
      orderNum: orderNum || 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return res.status(500).json({ error: 'Erro ao criar matéria' });
  }
}

async function updateSubject(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { id } = req.query;
    const { name, orderNum } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const now = new Date().toISOString();

    const result = await db.execute({
      sql: `UPDATE subjects SET name = ?, order_num = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
      args: [name, orderNum || 0, now, id, userId],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    return res.status(200).json({
      id,
      userId,
      name,
      orderNum: orderNum || 0,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar matéria' });
  }
}

async function deleteSubject(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    const result = await db.execute({
      sql: 'DELETE FROM subjects WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({ error: 'Erro ao deletar matéria' });
  }
}

export default withAuth(handler);
