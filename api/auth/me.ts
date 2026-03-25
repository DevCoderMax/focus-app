import type { VercelResponse } from '@vercel/node';
import db from '../db/turso';
import { withAuth, type AuthenticatedRequest } from '../middleware/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Get user data
    const result = await db.execute({
      sql: 'SELECT id, email, name, avatar, created_at, updated_at FROM users WHERE id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export default withAuth(handler);
