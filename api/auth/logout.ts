import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractToken } from '../middleware/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token (optional - for future session management)
    const token = extractToken(req);

    // For now, logout is handled client-side by removing the token
    // In the future, we could invalidate the token in the database

    return res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
