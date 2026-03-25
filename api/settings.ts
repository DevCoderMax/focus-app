import type { VercelResponse } from '@vercel/node';
import db from './db/turso';
import { withAuth, type AuthenticatedRequest } from './middleware/auth';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  switch (req.method) {
    case 'GET':
      return getSettings(req, res, userId);
    case 'PUT':
      return updateSettings(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSettings(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM settings WHERE user_id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      // Create default settings
      await db.execute({
        sql: `INSERT INTO settings (user_id, pomodoro_minutes, short_break_minutes, long_break_minutes, daily_goal_minutes, enable_sounds, theme)
              VALUES (?, 25, 5, 15, 120, 1, 'dark')`,
        args: [userId],
      });

      return res.status(200).json({
        userId,
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        dailyGoalMinutes: 120,
        enableSounds: true,
        theme: 'dark',
      });
    }

    const row = result.rows[0];
    return res.status(200).json({
      userId: row.user_id,
      pomodoroMinutes: row.pomodoro_minutes,
      shortBreakMinutes: row.short_break_minutes,
      longBreakMinutes: row.long_break_minutes,
      dailyGoalMinutes: row.daily_goal_minutes,
      enableSounds: Boolean(row.enable_sounds),
      theme: row.theme,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
}

async function updateSettings(req: AuthenticatedRequest, res: VercelResponse, userId: string) {
  try {
    const {
      pomodoroMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      dailyGoalMinutes,
      enableSounds,
      theme,
    } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const args: any[] = [];

    if (pomodoroMinutes !== undefined) {
      updates.push('pomodoro_minutes = ?');
      args.push(pomodoroMinutes);
    }
    if (shortBreakMinutes !== undefined) {
      updates.push('short_break_minutes = ?');
      args.push(shortBreakMinutes);
    }
    if (longBreakMinutes !== undefined) {
      updates.push('long_break_minutes = ?');
      args.push(longBreakMinutes);
    }
    if (dailyGoalMinutes !== undefined) {
      updates.push('daily_goal_minutes = ?');
      args.push(dailyGoalMinutes);
    }
    if (enableSounds !== undefined) {
      updates.push('enable_sounds = ?');
      args.push(enableSounds ? 1 : 0);
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      args.push(theme);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    args.push(userId);

    await db.execute({
      sql: `UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`,
      args,
    });

    // Return updated settings
    const result = await db.execute({
      sql: 'SELECT * FROM settings WHERE user_id = ?',
      args: [userId],
    });

    const row = result.rows[0];
    return res.status(200).json({
      userId: row.user_id,
      pomodoroMinutes: row.pomodoro_minutes,
      shortBreakMinutes: row.short_break_minutes,
      longBreakMinutes: row.long_break_minutes,
      dailyGoalMinutes: row.daily_goal_minutes,
      enableSounds: Boolean(row.enable_sounds),
      theme: row.theme,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
}

export default withAuth(handler);
