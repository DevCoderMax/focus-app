import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/turso';
import { generateToken } from '../middleware/auth';

const SALT_ROUNDS = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Check if user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, email.toLowerCase(), passwordHash, name, now, now],
    });

    // Create default settings for user
    await db.execute({
      sql: `INSERT INTO settings (user_id, pomodoro_minutes, short_break_minutes, long_break_minutes, daily_goal_minutes, enable_sounds, theme)
            VALUES (?, 25, 5, 15, 120, 1, 'dark')`,
      args: [userId],
    });

    // Generate token
    const token = generateToken({ id: userId, email: email.toLowerCase(), name });

    return res.status(201).json({
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        createdAt: now,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
