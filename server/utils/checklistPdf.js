// Geração do checklist do processo em PDF (pdfkit — JS puro, sem dependência
// nativa, mantendo a instalação de um clique). O layout usa a paleta açaí do
// front-end. Fontes padrão do PDF (Helvetica) cobrem o Latin-1 usado em pt-BR.

import PDFDocument from 'pdfkit';

export const C = {
  deep: '#2A0E33',
  acai: '#4B1D4F',
  gold: '#B4823A',
  berry: '#A23B5C',
  ink: '#241726',
  soft: '#5C4A5C',
  faint: '#8F7C8C',
  line: '#E6D9DE',
  paperDeep: '#E6D9DE',
  acaiTint: '#EFE1EE',
  goldTint: '#F3E6C9',
};

export const STATUS_LABEL = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  correcao: 'Correção necessária',
  nao_aplicavel: 'Não aplicável',
};

export const REQ_LABEL = { obrigatorio: 'Obrigatório', recomendado: 'Recomendado', opcional: 'Opcional' };

const ETAPA_LABEL = {
  concluida: 'Concluída',
  em_analise: 'Em análise',
  correcao: 'Correção necessária',
  pendente: 'Pendente',
};

export function tipoLabel(t) {
  if (t === 'IP') return 'Indicação de Procedência';
  if (t === 'DO') return 'Denominação de Origem';
  return 'Tipo a definir';
}

export function statusColor(status) {
  if (status === 'aprovado') return C.acai;
  if (status === 'em_analise' || status === 'enviado') return C.gold;
  if (status === 'correcao') return C.berry;
  return C.faint;
}

function etapaStatusColor(st) {
  if (st === 'concluida') return C.acai;
  if (st === 'em_analise') return C.gold;
  if (st === 'correcao') return C.berry;
  return C.faint;
}

function obrigatoriosAtivos(docs) {
  return docs.filter((d) => d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
}

function overallPct(docs) {
  const o = obrigatoriosAtivos(docs);
  if (!o.length) return 0;
  return Math.round((o.filter((d) => d.status === 'aprovado').length / o.length) * 100);
}

function etapaStatus(docs, etapaId) {
  const obrig = docs.filter((d) => d.etapaId === etapaId && d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
  if (obrig.length === 0) return 'concluida';
  if (obrig.some((d) => d.status === 'correcao')) return 'correcao';
  if (obrig.every((d) => d.status === 'aprovado')) return 'concluida';
  if (obrig.some((d) => ['em_analise', 'enviado', 'aprovado'].includes(d.status))) return 'em_analise';
  return 'pendente';
}

export function formatDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return String(iso);
}

const M = 50;

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    doc.y = M;
  }
}

// Rodapé em todas as páginas. Zeramos a margem inferior enquanto escrevemos na
// faixa de rodapé — do contrário o pdfkit interpreta a posição abaixo da margem
// como estouro e cria uma página em branco por trecho de texto.
function addFooters(doc) {
  const range = doc.bufferedPageRange();
  const stamp = `Trilha · gerado em ${new Date().toLocaleString('pt-BR')}`;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 34;
    const w = doc.page.width - M * 2;
    doc.font('Helvetica').fontSize(8).fillColor(C.faint);
    doc.text(stamp, M, y, { width: w, align: 'left', lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, M, y, { width: w, align: 'right', lineBreak: false });
    doc.page.margins.bottom = savedBottom;
  }
}

function legend(doc, contentW) {
  const items = [
    ['Aprovado / concluído', C.acai],
    ['Em análise / enviado', C.gold],
    ['Correção necessária', C.berry],
    ['Pendente / não aplicável', C.faint],
  ];
  const y = doc.y;
  let x = M;
  doc.fontSize(8.5).font('Helvetica');
  items.forEach(([label, color]) => {
    doc.circle(x + 3, y + 5, 3).fill(color);
    doc.fillColor(C.soft).text(label, x + 11, y + 1, { lineBreak: false });
    x += doc.widthOfString(label) + 34;
  });
  doc.y = y + 16;
}

/**
 * Cria e desenha o PDF do checklist. Retorna o PDFDocument já desenhado, mas
 * NÃO finalizado — o chamador decide o destino (`doc.pipe(res); doc.end()`
 * para stream, ou coletar em buffer via `checklistToBuffer`).
 */
export function buildChecklistDoc(processo) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: M,
    bufferPages: true,
    info: { Title: `Checklist — ${processo.nome}`, Author: 'Trilha' },
  });
  const W = doc.page.width;
  const contentW = W - M * 2;

  // Faixa de cabeçalho
  doc.rect(0, 0, W, 92).fill(C.deep);
  doc.fillColor(C.goldTint).font('Helvetica-Bold').fontSize(9).text('TRILHA · INDICAÇÃO GEOGRÁFICA DO AÇAÍ', M, 30, { characterSpacing: 1 });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(21).text('Checklist do processo', M, 46);

  doc.y = 116;

  // Título do processo + dados
  doc.font('Helvetica-Bold').fontSize(16).fillColor(C.deep).text(processo.nome, M, doc.y, { width: contentW });
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(10).fillColor(C.soft);
  const info = [
    `Tipo de pedido: ${tipoLabel(processo.tipo)}`,
    `Entidade requerente: ${processo.entidade}`,
    `Território: ${processo.territorio}`,
    processo.protocolo
      ? `Protocolo e-IG: ${processo.protocolo.numero} (registrado em ${formatDate(processo.protocolo.data)})`
      : 'Protocolo e-IG: ainda não registrado',
  ];
  info.forEach((l) => doc.text(l, { width: contentW }));

  // Barra de progresso
  const obrig = obrigatoriosAtivos(processo.docs);
  const aprov = obrig.filter((d) => d.status === 'aprovado').length;
  const pct = overallPct(processo.docs);
  doc.moveDown(0.7);
  const barY = doc.y;
  doc.roundedRect(M, barY, contentW, 10, 5).fill(C.paperDeep);
  if (pct > 0) doc.roundedRect(M, barY, Math.max((contentW * pct) / 100, 6), 10, 5).fill(C.acai);
  doc.fillColor(C.deep).font('Helvetica-Bold').fontSize(10).text(`${pct}% concluído — ${aprov}/${obrig.length} documentos obrigatórios aprovados`, M, barY + 16);
  doc.moveDown(0.9);
  legend(doc, contentW);
  doc.moveDown(0.8);

  // Etapas + documentos
  processo.etapas.forEach((et, i) => {
    const docs = processo.docs.filter((d) => d.etapaId === et.id);
    if (!docs.length) return;
    ensureSpace(doc, 58);

    const st = etapaStatus(processo.docs, et.id);
    const headY = doc.y;
    doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.acai).text(`${String(i + 1).padStart(2, '0')}. ${et.nome}`, M, headY, { width: contentW - 130 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(etapaStatusColor(st)).text(ETAPA_LABEL[st].toUpperCase(), M, headY + 2, { width: contentW, align: 'right' });
    doc.moveDown(0.35);
    doc.moveTo(M, doc.y).lineTo(M + contentW, doc.y).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.moveDown(0.35);

    docs.forEach((d) => {
      ensureSpace(doc, 22);
      const y = doc.y;
      doc.circle(M + 4, y + 5, 3).fill(statusColor(d.status));
      doc.fillColor(C.ink).font('Helvetica').fontSize(10).text(d.nome, M + 14, y, { width: contentW - 150 });
      const afterLeft = doc.y;
      doc.font('Helvetica').fontSize(8).fillColor(C.faint).text(`${REQ_LABEL[d.req]} · ${STATUS_LABEL[d.status]}`, M, y + 1, { width: contentW, align: 'right' });
      doc.y = Math.max(afterLeft, y + 14);
      doc.moveDown(0.3);
    });
    doc.moveDown(0.6);
  });

  addFooters(doc);
  return doc;
}

/** Coleta o PDF do checklist em um Buffer (para embutir no dossiê). */
export function checklistToBuffer(processo) {
  return bufferFromDoc(buildChecklistDoc(processo));
}

/** Finaliza um PDFDocument já desenhado e resolve com o Buffer resultante. */
export function bufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}
