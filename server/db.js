// Banco de dados simples baseado em arquivo JSON.
//
// Isto é deliberadamente simples para uma demo local: leitura/escrita
// síncrona de um único arquivo. Para produção, trocar por Postgres
// (como o PRD recomenda) é o próximo passo natural — a camada de rotas
// já fala apenas com as funções deste módulo, então a troca fica isolada.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.TRILHA_DB_PATH || path.join(__dirname, 'data', 'db.json');

const EMPTY = {
  orgs: [],
  users: [],
  processos: [],
  etapas: [],
  documentos: [],
  versoes: [],
};

function ensureFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2));
  }
}

export function readDB() {
  ensureFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function resetDB() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2));
}

export function uid(prefix) {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
