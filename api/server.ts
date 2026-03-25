import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database - use better-sqlite3 for local development
const dbPath = path.join(process.cwd(), 'focus-local.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Wrapper to match @libsql/client interface
const turso = {
  execute: async (query: string | { sql: string; args?: any[] }) => {
    const sql = typeof query === 'string' ? query : query.sql;
    const args = typeof query === 'string' ? [] : (query.args || []);
    
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...args);
        return { rows };
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(...args);
        return { rows: [], changes: result.changes };
      }
    } catch (error) {
      throw error;
    }
  },
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Auth middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Check if user exists
    const existing = await turso.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, email.toLowerCase(), passwordHash, name, now, now],
    });

    // Create default settings
    await turso.execute({
      sql: `INSERT INTO settings (user_id) VALUES (?)`,
      args: [userId],
    });

    const token = jwt.sign({ id: userId, email: email.toLowerCase(), name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      user: { id: userId, email: email.toLowerCase(), name, createdAt: now },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await turso.execute({
      sql: 'SELECT id, email, password_hash, name, avatar, created_at FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash as string);

    if (!isValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT id, email, name, avatar, created_at, updated_at FROM users WHERE id = ?',
      args: [req.user.id],
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
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  return res.status(200).json({ message: 'Logout realizado com sucesso' });
});

// ==================== SUBJECTS ROUTES ====================

app.get('/api/subjects', authenticateToken, async (req: any, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM subjects WHERE user_id = ? ORDER BY order_num ASC',
      args: [req.user.id],
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
});

app.post('/api/subjects', authenticateToken, async (req: any, res) => {
  try {
    const { name, orderNum } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO subjects (id, user_id, name, order_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, req.user.id, name, orderNum || 0, now, now],
    });

    return res.status(201).json({
      id,
      userId: req.user.id,
      name,
      orderNum: orderNum || 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return res.status(500).json({ error: 'Erro ao criar matéria' });
  }
});

app.put('/api/subjects/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, orderNum } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const now = new Date().toISOString();

    const result = await turso.execute({
      sql: `UPDATE subjects SET name = ?, order_num = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [name, orderNum || 0, now, id, req.user.id],
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    return res.status(200).json({
      id,
      userId: req.user.id,
      name,
      orderNum: orderNum || 0,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar matéria' });
  }
});

app.delete('/api/subjects/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await turso.execute({
      sql: 'DELETE FROM subjects WHERE id = ? AND user_id = ?',
      args: [id, req.user.id],
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({ error: 'Erro ao deletar matéria' });
  }
});

// ==================== TOPICS ROUTES ====================

app.get('/api/topics', authenticateToken, async (req: any, res) => {
  try {
    const subjectId = req.query.subjectId as string | undefined;

    let sql = 'SELECT * FROM topics WHERE user_id = ?';
    const args: any[] = [req.user.id];

    if (subjectId) {
      sql += ' AND subject_id = ?';
      args.push(subjectId);
    }

    sql += ' ORDER BY order_num ASC';

    const result = await turso.execute({ sql, args });

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
});

app.post('/api/topics', authenticateToken, async (req: any, res) => {
  try {
    const { subjectId, name, orderNum, description } = req.body;

    if (!subjectId || !name) {
      return res.status(400).json({ error: 'Subject ID e nome são obrigatórios' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO topics (id, user_id, subject_id, name, order_num, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, req.user.id, subjectId, name, orderNum || 0, description || null, now, now],
    });

    return res.status(201).json({
      id,
      userId: req.user.id,
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
});

app.put('/api/topics/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, orderNum, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const now = new Date().toISOString();

    const result = await turso.execute({
      sql: `UPDATE topics SET name = ?, order_num = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [name, orderNum || 0, description || null, now, id, req.user.id],
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tópico não encontrado' });
    }

    return res.status(200).json({
      id,
      userId: req.user.id,
      name,
      orderNum: orderNum || 0,
      description: description || null,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Update topic error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar tópico' });
  }
});

app.delete('/api/topics/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await turso.execute({
      sql: 'DELETE FROM topics WHERE id = ? AND user_id = ?',
      args: [id, req.user.id],
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tópico não encontrado' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete topic error:', error);
    return res.status(500).json({ error: 'Erro ao deletar tópico' });
  }
});

// ==================== SETTINGS ROUTES ====================

app.get('/api/settings', authenticateToken, async (req: any, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM settings WHERE user_id = ?',
      args: [req.user.id],
    });

    if (result.rows.length === 0) {
      return res.status(200).json({
        userId: req.user.id,
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
});

app.put('/api/settings', authenticateToken, async (req: any, res) => {
  try {
    const { pomodoroMinutes, shortBreakMinutes, longBreakMinutes, dailyGoalMinutes, enableSounds, theme } = req.body;

    const updates: string[] = [];
    const args: any[] = [];

    if (pomodoroMinutes !== undefined) { updates.push('pomodoro_minutes = ?'); args.push(pomodoroMinutes); }
    if (shortBreakMinutes !== undefined) { updates.push('short_break_minutes = ?'); args.push(shortBreakMinutes); }
    if (longBreakMinutes !== undefined) { updates.push('long_break_minutes = ?'); args.push(longBreakMinutes); }
    if (dailyGoalMinutes !== undefined) { updates.push('daily_goal_minutes = ?'); args.push(dailyGoalMinutes); }
    if (enableSounds !== undefined) { updates.push('enable_sounds = ?'); args.push(enableSounds ? 1 : 0); }
    if (theme !== undefined) { updates.push('theme = ?'); args.push(theme); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    args.push(req.user.id);

    await turso.execute({
      sql: `UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`,
      args,
    });

    const result = await turso.execute({
      sql: 'SELECT * FROM settings WHERE user_id = ?',
      args: [req.user.id],
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
});

// ==================== SYNC ROUTES ====================

app.get('/api/sync', authenticateToken, async (req: any, res) => {
  try {
    const lastSync = req.query.lastSync as string | undefined;

    let subjectsSql = 'SELECT * FROM subjects WHERE user_id = ?';
    const subjectsArgs: any[] = [req.user.id];
    if (lastSync) {
      subjectsSql += ' AND updated_at > ?';
      subjectsArgs.push(lastSync);
    }
    const subjectsResult = await turso.execute({ sql: subjectsSql, args: subjectsArgs });

    let topicsSql = 'SELECT * FROM topics WHERE user_id = ?';
    const topicsArgs: any[] = [req.user.id];
    if (lastSync) {
      topicsSql += ' AND updated_at > ?';
      topicsArgs.push(lastSync);
    }
    const topicsResult = await turso.execute({ sql: topicsSql, args: topicsArgs });

    const subjects = subjectsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      orderNum: row.order_num,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const topics = topicsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      subjectId: row.subject_id,
      name: row.name,
      orderNum: row.order_num,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({ subjects, topics, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Pull data error:', error);
    return res.status(500).json({ error: 'Erro ao sincronizar dados' });
  }
});

app.post('/api/sync', authenticateToken, async (req: any, res) => {
  try {
    const { subjects, topics } = req.body;
    let syncedCount = 0;

    if (subjects && Array.isArray(subjects)) {
      for (const subject of subjects) {
        // Handle deletion
        if (subject.deletedAt) {
          await turso.execute({
            sql: 'DELETE FROM subjects WHERE id = ? AND user_id = ?',
            args: [subject.id, req.user.id],
          });
          syncedCount++;
          continue;
        }

        const existing = await turso.execute({
          sql: 'SELECT id, updated_at FROM subjects WHERE id = ? AND user_id = ?',
          args: [subject.id, req.user.id],
        });

        if (existing.rows.length === 0) {
          await turso.execute({
            sql: `INSERT INTO subjects (id, user_id, name, order_num, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [subject.id, req.user.id, subject.name, subject.orderNum || 0, subject.createdAt, subject.updatedAt],
          });
          syncedCount++;
        } else {
          const existingUpdatedAt = existing.rows[0].updated_at as string;
          if (new Date(subject.updatedAt) > new Date(existingUpdatedAt)) {
            await turso.execute({
              sql: `UPDATE subjects SET name = ?, order_num = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
              args: [subject.name, subject.orderNum || 0, subject.updatedAt, subject.id, req.user.id],
            });
            syncedCount++;
          }
        }
      }
    }

    if (topics && Array.isArray(topics)) {
      for (const topic of topics) {
        // Handle deletion
        if (topic.deletedAt) {
          await turso.execute({
            sql: 'DELETE FROM topics WHERE id = ? AND user_id = ?',
            args: [topic.id, req.user.id],
          });
          syncedCount++;
          continue;
        }

        const existing = await turso.execute({
          sql: 'SELECT id, updated_at FROM topics WHERE id = ? AND user_id = ?',
          args: [topic.id, req.user.id],
        });

        if (existing.rows.length === 0) {
          await turso.execute({
            sql: `INSERT INTO topics (id, user_id, subject_id, name, order_num, description, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [topic.id, req.user.id, topic.subjectId, topic.name, topic.orderNum || 0, topic.description || null, topic.createdAt, topic.updatedAt],
          });
          syncedCount++;
        } else {
          const existingUpdatedAt = existing.rows[0].updated_at as string;
          if (new Date(topic.updatedAt) > new Date(existingUpdatedAt)) {
            await turso.execute({
              sql: `UPDATE topics SET name = ?, order_num = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
              args: [topic.name, topic.orderNum || 0, topic.description || null, topic.updatedAt, topic.id, req.user.id],
            });
            syncedCount++;
          }
        }
      }
    }

    return res.status(200).json({ synced: syncedCount, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Push data error:', error);
    return res.status(500).json({ error: 'Erro ao enviar dados' });
  }
});

// ==================== MIGRATION ROUTE ====================

app.post('/api/db/migrate', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(process.cwd(), 'api', 'migrations', '001_initial.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolons, handling multi-line statements
    const statements = migrationSQL
      .split(/;\s*$/m)
      .map((s: string) => s.trim())
      .filter((s: string) => {
        // Filter out empty strings and pure comment blocks
        if (s.length === 0) return false;
        const lines = s.split('\n').filter(line => !line.trim().startsWith('--'));
        return lines.length > 0 && lines.some(line => line.trim().length > 0);
      })
      .map((s: string) => {
        // Remove comment lines from the statement
        return s.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter((s: string) => s.length > 0);

    const results = [];
    for (const statement of statements) {
      try {
        // Execute each statement individually
        await turso.execute({ sql: statement, args: [] });
        results.push({
          statement: statement.substring(0, 60).replace(/\n/g, ' ') + '...',
          status: 'success'
        });
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          results.push({
            statement: statement.substring(0, 60).replace(/\n/g, ' ') + '...',
            status: 'skipped (already exists)'
          });
        } else {
          results.push({
            statement: statement.substring(0, 60).replace(/\n/g, ' ') + '...',
            status: 'error',
            error: errorMsg
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status.includes('skipped')).length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return res.status(200).json({
      message: `Migration completed: ${successCount} success, ${skippedCount} skipped, ${errorCount} errors`,
      results
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
});

// ==================== PROFILES ROUTES ====================

app.get('/api/profiles', authenticateToken, async (req: any, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at ASC',
      args: [req.user.id],
    });

    const profiles = result.rows.map((row: any) => ({
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
});

app.post('/api/profiles', authenticateToken, async (req: any, res) => {
  try {
    const { name, avatarId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO profiles (id, user_id, name, avatar_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, req.user.id, name, avatarId || 'scholar', now, now],
    });

    return res.status(201).json({
      id,
      userId: req.user.id,
      name,
      avatarId: avatarId || 'scholar',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'Erro ao criar perfil' });
  }
});

app.put('/api/profiles', authenticateToken, async (req: any, res) => {
  try {
    const { id, name, avatarId } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID e nome são obrigatórios' });
    }

    const now = new Date().toISOString();

    await turso.execute({
      sql: `UPDATE profiles SET name = ?, avatar_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      args: [name, avatarId || 'scholar', now, id, req.user.id],
    });

    return res.status(200).json({
      id,
      userId: req.user.id,
      name,
      avatarId: avatarId || 'scholar',
      updatedAt: now,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

app.delete('/api/profiles', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    await turso.execute({
      sql: 'DELETE FROM profiles WHERE id = ? AND user_id = ?',
      args: [id, req.user.id],
    });

    return res.status(200).json({ message: 'Perfil excluído com sucesso' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ error: 'Erro ao excluir perfil' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.TURSO_DATABASE_URL || 'file:local.db'}`);
});
