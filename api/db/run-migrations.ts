import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSQL(url: string, authToken: string, sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql } },
          { type: 'close' }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    
    // Verificar erros dentro do payload de resposta
    if (data.results && data.results[0] && data.results[0].type === 'error') {
      return { success: false, error: data.results[0].error?.message || 'Erro desconhecido no banco' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runMigrations() {
  console.log('🚀 Iniciando migrações automáticas (Modo HTTP Raw)...');

  let url = process.env.TURSO_DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';

  if (!url) {
    console.error('❌ Erro: TURSO_DATABASE_URL não definida.');
    process.exit(1);
  }

  if (!authToken) {
    console.error('❌ Erro: TURSO_AUTH_TOKEN não definida.');
    process.exit(1);
  }

  // Converter libsql:// para https:// para usar a API HTTP
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://');
  }

  console.log(`📡 Conectando a: ${url}`);

  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️ Diretório de migrações não encontrado.');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📦 Processando arquivo: ${file}`);
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Limpeza do SQL
      const cleanSQL = migrationSQL
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/[\r\n]+/g, ' ');

      const statements = cleanSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (statements.length === 0) continue;

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        const result = await executeSQL(url, authToken, statement);
        
        if (result.success) {
          successCount++;
        } else {
          const msg = result.error?.toLowerCase() || '';
          
          // Ignorar erros de duplicação
          if (
            msg.includes('already exists') || 
            msg.includes('duplicate column') ||
            msg.includes('duplicate column name')
          ) {
            continue;
          }
 
          console.error(`❌ Erro no SQL: "${statement.substring(0, 50)}..."`);
          console.error(`   Motivo: ${result.error}`);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        console.log(`⚠️ Migração ${file} com ${errorCount} erros.`);
      } else {
        console.log(`✅ Migração ${file} OK (${successCount} statements).`);
      }
    }

    console.log('🎉 Todas as migrações foram processadas.');
  } catch (error: any) {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

runMigrations();
