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
      return getProfiles(req, res, userId);
    case 'POST':
      return createProfile(req, res, userId);
    case 'PUT':
      return updateProfile(req, res, userId);
    case 'DELETE':
      return deleteProfile(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getProfiles(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at ASC',
      args: [userId],
    });

    const profiles = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      avatarId: row.avatar_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json(profiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    return res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
}

async function createProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { name, avatarId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO profiles (id, user_id, name, avatar_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, userId, name, avatarId || 'scholar', now, now],
    });

    return res.status(201).json({
      id,
      userId,
      name,
      avatarId: avatarId || 'scholar',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'Erro ao criar perfil' });
  }
}

async function updateProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { id, name, avatarId } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID e nome são obrigatórios' });
    }

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE profiles SET name = ?, avatar_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [name, avatarId || 'scholar', now, id, userId],
    });

    return res.status(200).json({
      id,
      userId,
      name,
      avatarId: avatarId || 'scholar',
      updatedAt: now,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

async function deleteProfile(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    await db.execute({
      sql: 'DELETE FROM profiles WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    return res.status(200).json({ message: 'Perfil excluído com sucesso' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ error: 'Erro ao excluir perfil' });
  }
}

export default withAuth(handler);
