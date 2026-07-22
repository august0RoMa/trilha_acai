import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDB, writeDB, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_MANAGE_PROCESSO } from '../utils/roles.js';
import { etapasTemplate, documentosTemplate } from '../utils/checklistTemplate.js';
import { buildChecklistDoc } from '../utils/checklistPdf.js';
import { buildDossie } from '../utils/dossiePdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const router = Router();
router.use(requireAuth);

/** Nome seguro para arquivos/pastas dentro do ZIP e no Content-Disposition. */
function sanitizeName(name) {
  return (
    String(name)
      .normalize('NFC')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'arquivo'
  );
}

function findProcesso(req, db) {
  return db.processos.find((p) => p.id === req.params.id && p.orgId === req.user.orgId) || null;
}

function serializeProcesso(db, processo) {
  const etapas = db.etapas.filter((e) => e.processoId === processo.id).sort((a, b) => a.ordem - b.ordem);
  const documentos = db.documentos
    .filter((d) => d.processoId === processo.id)
    .map((d) => attachVersaoVigente(db, d));
  return { ...processo, etapas, docs: documentos };
}

function attachVersaoVigente(db, doc) {
  const versoes = db.versoes.filter((v) => v.documentoId === doc.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const vigente = versoes.find((v) => v.vigente) || null;
  return { ...doc, versaoVigente: vigente, totalVersoes: versoes.length };
}

router.get('/', (req, res) => {
  const db = readDB();
  const processos = db.processos.filter((p) => p.orgId === req.user.orgId).map((p) => serializeProcesso(db, p));
  res.json(processos);
});

router.get('/:id', (req, res) => {
  const db = readDB();
  const processo = db.processos.find((p) => p.id === req.params.id && p.orgId === req.user.orgId);
  if (!processo) return res.status(404).json({ error: 'Processo não encontrado.' });
  res.json(serializeProcesso(db, processo));
});

router.post('/', requireRole(...CAN_MANAGE_PROCESSO), (req, res) => {
  const { nome, tipo, entidade, territorio, uf } = req.body || {};
  if (!nome || !entidade || !territorio) {
    return res.status(400).json({ error: 'Informe nome, entidade requerente e território.' });
  }
  const tipoFinal = ['IP', 'DO'].includes(tipo) ? tipo : 'A_DEFINIR';

  const db = readDB();
  const processo = {
    id: uid('proc'),
    orgId: req.user.orgId,
    nome,
    tipo: tipoFinal,
    entidade,
    territorio,
    uf: uf || 'PA',
    protocolo: null,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  db.processos.push(processo);

  const etapaIdByOrdem = {};
  for (const et of etapasTemplate(tipoFinal)) {
    const etapa = { id: uid('etapa'), processoId: processo.id, ...et };
    db.etapas.push(etapa);
    etapaIdByOrdem[et.ordem] = etapa.id;
  }
  for (const docTpl of documentosTemplate(tipoFinal)) {
    db.documentos.push({
      id: uid('doc'),
      processoId: processo.id,
      etapaId: etapaIdByOrdem[docTpl.etapaOrdem],
      categoria: docTpl.categoria,
      nome: docTpl.nome,
      req: docTpl.req,
      status: 'pendente',
      comentario: null,
      responsavelId: null,
      updatedAt: new Date().toISOString(),
    });
  }
  writeDB(db);
  res.status(201).json(serializeProcesso(db, processo));
});

router.put('/:id', requireRole(...CAN_MANAGE_PROCESSO), (req, res) => {
  const db = readDB();
  const processo = db.processos.find((p) => p.id === req.params.id && p.orgId === req.user.orgId);
  if (!processo) return res.status(404).json({ error: 'Processo não encontrado.' });

  const { nome, entidade, territorio } = req.body || {};
  if (nome) processo.nome = nome;
  if (entidade) processo.entidade = entidade;
  if (territorio) processo.territorio = territorio;
  writeDB(db);
  res.json(serializeProcesso(db, processo));
});

// História 11.2 — registrar protocolo no e-IG
router.post('/:id/protocolo', requireRole(...CAN_MANAGE_PROCESSO), (req, res) => {
  const { numero, data } = req.body || {};
  if (!numero || !data) return res.status(400).json({ error: 'Informe número e data do protocolo.' });

  const db = readDB();
  const processo = db.processos.find((p) => p.id === req.params.id && p.orgId === req.user.orgId);
  if (!processo) return res.status(404).json({ error: 'Processo não encontrado.' });

  const documentos = db.documentos.filter((d) => d.processoId === processo.id);
  const bloqueando = documentos.some((d) => d.req === 'obrigatorio' && d.status !== 'aprovado' && d.status !== 'nao_aplicavel');
  if (bloqueando) {
    return res.status(409).json({ error: 'Ainda há documentos obrigatórios pendentes. Conclua a conferência antes de registrar o protocolo.' });
  }

  processo.protocolo = { numero, data };
  writeDB(db);
  res.json(serializeProcesso(db, processo));
});

// GET /api/processos/:id/checklist.pdf — checklist final do processo em PDF
router.get('/:id/checklist.pdf', (req, res) => {
  const db = readDB();
  const processo = findProcesso(req, db);
  if (!processo) return res.status(404).json({ error: 'Processo não encontrado.' });

  const full = serializeProcesso(db, processo);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Checklist - ${sanitizeName(processo.nome)}.pdf"`);
  const doc = buildChecklistDoc(full);
  doc.pipe(res);
  doc.end();
});

// GET /api/processos/:id/pacote.pdf — dossiê completo: um único PDF com o
// checklist na capa seguido de todos os documentos enviados convertidos em PDF.
router.get('/:id/pacote.pdf', async (req, res) => {
  const db = readDB();
  const processo = findProcesso(req, db);
  if (!processo) return res.status(404).json({ error: 'Processo não encontrado.' });

  const full = serializeProcesso(db, processo);
  try {
    const pdf = await buildDossie(full, UPLOAD_DIR);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Dossie - ${sanitizeName(processo.nome)}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('Erro ao montar o dossiê:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao montar o dossiê documental.' });
  }
});

export default router;
