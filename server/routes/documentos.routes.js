import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readDB, writeDB, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_UPLOAD, CAN_VALIDATE } from '../utils/roles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']);
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — História 5.2

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uid('f')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Formato não permitido. Envie PDF, JPG ou PNG.'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

const STATUS_VALUES = ['pendente', 'enviado', 'em_analise', 'aprovado', 'correcao', 'nao_aplicavel'];

function findDoc(db, req) {
  const doc = db.documentos.find((d) => d.id === req.params.id);
  if (!doc) return null;
  const processo = db.processos.find((p) => p.id === doc.processoId && p.orgId === req.user.orgId);
  if (!processo) return null;
  return { doc, processo };
}

// PUT /api/documentos/:id/status — aprovar, pedir correção, marcar N/A etc.
// Só quem pode validar (RN03/RN05: obrigatório não pode virar N/A livremente).
router.put('/:id/status', requireRole(...CAN_VALIDATE), (req, res) => {
  const { status, comentario } = req.body || {};
  if (!STATUS_VALUES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });

  const db = readDB();
  const found = findDoc(db, req);
  if (!found) return res.status(404).json({ error: 'Documento não encontrado.' });
  const { doc } = found;

  if (status === 'correcao' && !comentario?.trim()) {
    return res.status(400).json({ error: 'Informe o motivo da correção.' });
  }
  if (status === 'nao_aplicavel' && doc.req === 'obrigatorio') {
    return res.status(403).json({ error: 'Documentos obrigatórios não podem ser marcados como não aplicável.' });
  }

  doc.status = status;
  doc.comentario = status === 'correcao' ? comentario.trim() : null;
  doc.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(doc);
});

// POST /api/documentos/:id/upload — envia um arquivo, cria nova versão vigente
// e preserva as anteriores (RN06/RN07).
router.post('/:id/upload', requireRole(...CAN_UPLOAD), (req, res) => {
  upload.single('arquivo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const db = readDB();
    const found = findDoc(db, req);
    if (!found) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }
    const { doc } = found;

    // a versão anterior deixa de ser vigente (RN06)
    db.versoes.forEach((v) => {
      if (v.documentoId === doc.id) v.vigente = false;
    });

    const versao = {
      id: uid('versao'),
      documentoId: doc.id,
      filename: req.file.filename,
      nomeOriginal: req.file.originalname,
      mimeType: req.file.mimetype,
      tamanho: req.file.size,
      vigente: true,
      enviadoPor: req.user.id,
      createdAt: new Date().toISOString(),
    };
    db.versoes.push(versao);

    doc.status = doc.status === 'aprovado' || doc.status === 'correcao' ? 'em_analise' : 'enviado';
    doc.comentario = null;
    doc.updatedAt = new Date().toISOString();

    writeDB(db);
    res.status(201).json({ doc, versao });
  });
});

router.get('/:id/versoes', (req, res) => {
  const db = readDB();
  const found = findDoc(db, req);
  if (!found) return res.status(404).json({ error: 'Documento não encontrado.' });
  const versoes = db.versoes
    .filter((v) => v.documentoId === req.params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(versoes);
});

// GET /api/documentos/versoes/:versaoId/download
router.get('/versoes/:versaoId/download', (req, res) => {
  const db = readDB();
  const versao = db.versoes.find((v) => v.id === req.params.versaoId);
  if (!versao) return res.status(404).json({ error: 'Versão não encontrada.' });
  const doc = db.documentos.find((d) => d.id === versao.documentoId);
  const processo = doc && db.processos.find((p) => p.id === doc.processoId && p.orgId === req.user.orgId);
  if (!processo) return res.status(404).json({ error: 'Arquivo não encontrado.' });

  const filePath = path.join(UPLOAD_DIR, versao.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
  res.download(filePath, versao.nomeOriginal);
});

export default router;
