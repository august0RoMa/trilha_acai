// Funções puras de cálculo do checklist — sem dependência de React,
// para serem fáceis de testar isoladamente.

export const STATUS_LABEL = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  correcao: 'Correção necessária',
  nao_aplicavel: 'Não aplicável',
};

export const REQ_LABEL = {
  obrigatorio: 'Obrigatório',
  recomendado: 'Recomendado',
  opcional: 'Opcional',
};

/** Documentos obrigatórios que efetivamente contam para o progresso (ignora N/A). */
export function obrigatoriosAtivos(docs) {
  return docs.filter((d) => d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
}

/** Status agregado de uma etapa, a partir dos documentos obrigatórios que ela contém. */
export function etapaStatus(docs, etapaId) {
  const doEtapa = docs.filter((d) => d.etapaId === etapaId);
  const obrig = doEtapa.filter((d) => d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
  if (obrig.length === 0) return 'concluida';
  if (obrig.some((d) => d.status === 'correcao')) return 'correcao';
  if (obrig.every((d) => d.status === 'aprovado')) return 'concluida';
  if (obrig.some((d) => ['em_analise', 'enviado', 'aprovado'].includes(d.status))) return 'em_analise';
  return 'pendente';
}

/** Percentual geral de conclusão do processo (0–100), baseado só nos obrigatórios. */
export function overallPct(docs) {
  const obrig = obrigatoriosAtivos(docs);
  if (obrig.length === 0) return 0;
  const aprovados = obrig.filter((d) => d.status === 'aprovado');
  return Math.round((aprovados.length / obrig.length) * 100);
}

/** Documentos obrigatórios que ainda impedem a conferência pré-protocolo. */
export function itensBloqueantes(docs) {
  return obrigatoriosAtivos(docs).filter((d) => d.status !== 'aprovado');
}

/** Documentos recomendados que ainda não foram aprovados (não bloqueiam). */
export function recomendadosPendentes(docs) {
  return docs.filter((d) => d.req === 'recomendado' && d.status !== 'aprovado');
}

/** Lista de pendências (obrigatórios pendentes ou em correção) para a tela de Pendências. */
export function pendenciasList(docs) {
  return docs.filter((d) => d.req === 'obrigatorio' && ['pendente', 'correcao'].includes(d.status));
}

/** Verdadeiro se o processo está pronto para a conferência pré-protocolo. */
export function isProntoParaProtocolo(docs) {
  return itensBloqueantes(docs).length === 0;
}

export function statusLabel(status) {
  return STATUS_LABEL[status] ?? status;
}

export function reqLabel(req) {
  return REQ_LABEL[req] ?? req;
}
