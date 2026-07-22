// Ponto de entrada do container do back-end.
//
// Na primeira subida o volume de dados está vazio, então não há banco nem
// os arquivos de demonstração. Aqui rodamos o seed uma única vez (quando o
// db.json ainda não existe) e, em seguida, iniciamos a API. Nas próximas
// subidas o banco já existe e os dados do usuário são preservados.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.TRILHA_DB_PATH || path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(dbPath)) {
  console.log('Banco não encontrado — populando dados de demonstração (seed)...');
  const result = spawnSync(process.execPath, ['seed.js'], { stdio: 'inherit', cwd: __dirname });
  if (result.status !== 0) {
    console.error('Falha ao popular o banco de demonstração.');
    process.exit(result.status || 1);
  }
}

await import('./index.js');
