import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpFile = path.join(os.tmpdir(), `trilha-test-db-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

process.env.TRILHA_DB_PATH = tmpFile;
process.env.JWT_SECRET = 'test-secret';
