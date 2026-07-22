// Monta o "dossiê" do processo: um único PDF com o checklist na capa seguido de
// todos os documentos enviados, cada um convertido para PDF —
//   • PDF  → páginas mescladas na íntegra (pdf-lib)
//   • JPG/PNG → incorporado como página (pdfkit)
//   • texto/outros → conteúdo renderizado como página (pdfkit)
// Assim o pacote documental inteiro sai em PDF, pronto para o e-IG.

import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { PDFDocument as LibPDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { C, STATUS_LABEL, REQ_LABEL, statusColor, checklistToBuffer, bufferFromDoc } from './checklistPdf.js';

const M = 50;
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Cabeçalho comum de uma página de documento dentro do dossiê. Retorna o y livre. */
function drawDocHeader(doc, meta) {
  const W = doc.page.width;
  const contentW = W - M * 2;
  doc.rect(0, 0, W, 66).fill(C.acaiTint);
  doc.fillColor(C.acai).font('Helvetica-Bold').fontSize(8).text(`ETAPA ${meta.etapaNum} · ${meta.etapaNome.toUpperCase()}`, M, 18, { width: contentW, characterSpacing: 0.5, lineBreak: false, ellipsis: true });
  doc.fillColor(C.deep).font('Helvetica-Bold').fontSize(13).text(meta.docNome, M, 32, { width: contentW, lineBreak: false, ellipsis: true });
  doc.fillColor(statusColor(meta.status)).font('Helvetica-Bold').fontSize(8).text(`${REQ_LABEL[meta.req]} · ${STATUS_LABEL[meta.status]}`, M, 50, { width: contentW, lineBreak: false });
  doc.fillColor(C.ink);
  return 86;
}

function pdfkitBuffer(drawFn) {
  const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true });
  drawFn(doc);
  return bufferFromDoc(doc);
}

/** Página de rótulo (divisória) para um documento cujas páginas vêm de um PDF externo. */
function labelBuffer(meta) {
  return pdfkitBuffer((doc) => {
    const top = drawDocHeader(doc, meta);
    doc.y = top + 8;
    doc.font('Helvetica').fontSize(10).fillColor(C.soft).text('Documento anexado nas páginas a seguir.', M, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(C.faint).text(`Arquivo original: ${meta.nomeOriginal}`, { width: doc.page.width - M * 2 });
  });
}

/** Página com uma imagem (JPG/PNG) incorporada. */
function imageBuffer(meta, filePath) {
  return pdfkitBuffer((doc) => {
    const top = drawDocHeader(doc, meta);
    const availW = doc.page.width - M * 2;
    const availH = doc.page.height - top - M;
    try {
      doc.image(filePath, M, top + 6, { fit: [availW, availH], align: 'center', valign: 'top' });
    } catch {
      doc.font('Helvetica').fontSize(10).fillColor(C.berry).text('Não foi possível incorporar esta imagem.', M, top + 6);
    }
    doc.fillColor(C.faint).font('Helvetica').fontSize(8).text(`Arquivo original: ${meta.nomeOriginal}`, M, doc.page.height - 40, { width: availW, lineBreak: false });
  });
}

/** Página(s) com o conteúdo de um arquivo de texto. */
function textBuffer(meta, filePath) {
  let conteudo = '';
  try {
    conteudo = fs.readFileSync(filePath, 'utf8');
  } catch {
    conteudo = '(não foi possível ler o conteúdo do arquivo)';
  }
  if (conteudo.length > 20000) conteudo = conteudo.slice(0, 20000) + '\n\n[conteúdo truncado]';
  return pdfkitBuffer((doc) => {
    const top = drawDocHeader(doc, meta);
    doc.y = top + 8;
    doc.font('Helvetica').fontSize(10).fillColor(C.ink).text(conteudo || '(arquivo vazio)', M, doc.y, {
      width: doc.page.width - M * 2,
      align: 'left',
    });
  });
}

/** Página de aviso quando o arquivo não está no servidor. */
function missingBuffer(meta) {
  return pdfkitBuffer((doc) => {
    const top = drawDocHeader(doc, meta);
    doc.y = top + 8;
    doc.font('Helvetica').fontSize(10).fillColor(C.berry).text('Arquivo não encontrado no servidor.', M, doc.y);
  });
}

/** Mescla uma lista de buffers de PDF em um único documento (pdf-lib). */
async function mergeBuffers(buffers) {
  const out = await LibPDFDocument.create();
  let font;
  for (const buf of buffers) {
    try {
      const src = await LibPDFDocument.load(buf, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    } catch {
      // PDF externo inválido/protegido — insere uma página de aviso no lugar.
      if (!font) font = await out.embedFont(StandardFonts.Helvetica);
      const page = out.addPage();
      page.drawText('Não foi possível incluir um documento (arquivo PDF inválido).', {
        x: M,
        y: page.getHeight() - 80,
        size: 11,
        font,
        color: hexToRgb(C.berry),
      });
    }
  }
  const bytes = await out.save();
  return Buffer.from(bytes);
}

/**
 * Monta o dossiê completo do processo em um único PDF.
 * @param {object} processo processo serializado (etapas + docs com versaoVigente)
 * @param {string} uploadDir diretório físico dos arquivos enviados
 * @returns {Promise<Buffer>}
 */
export async function buildDossie(processo, uploadDir) {
  const segments = [await checklistToBuffer(processo)];

  processo.etapas.forEach((et, idx) => {
    const docs = processo.docs.filter((d) => d.etapaId === et.id);
    docs.forEach((d) => {
      const v = d.versaoVigente;
      if (!v) return;
      const meta = {
        etapaNum: String(idx + 1).padStart(2, '0'),
        etapaNome: et.nome,
        docNome: d.nome,
        req: d.req,
        status: d.status,
        nomeOriginal: v.nomeOriginal || v.filename,
      };
      const abs = path.join(uploadDir, v.filename);
      if (!fs.existsSync(abs)) {
        segments.push(missingBuffer(meta));
        return;
      }
      const ext = path.extname(v.nomeOriginal || v.filename).toLowerCase();
      const mime = (v.mimeType || '').toLowerCase();
      if (ext === '.pdf' || mime === 'application/pdf') {
        segments.push(labelBuffer(meta), fs.readFileSync(abs));
      } else if (IMAGE_EXT.has(ext) || mime.startsWith('image/')) {
        segments.push(imageBuffer(meta, abs));
      } else {
        segments.push(textBuffer(meta, abs));
      }
    });
  });

  const resolved = await Promise.all(segments);
  return mergeBuffers(resolved);
}
