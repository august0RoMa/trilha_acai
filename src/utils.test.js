import { describe, it, expect } from 'vitest';
import {
  etapaStatus,
  overallPct,
  itensBloqueantes,
  recomendadosPendentes,
  pendenciasList,
  isProntoParaProtocolo,
  statusLabel,
  reqLabel,
} from './utils.js';

function doc(id, etapaId, req, status) {
  return { id, etapaId, req, status, nome: `Doc ${id}`, categoria: 'Teste' };
}

describe('etapaStatus', () => {
  it('retorna "concluida" quando não há documentos obrigatórios na etapa', () => {
    const docs = [doc(1, 1, 'opcional', 'pendente')];
    expect(etapaStatus(docs, 1)).toBe('concluida');
  });

  it('retorna "pendente" quando nenhum obrigatório foi enviado', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'pendente')];
    expect(etapaStatus(docs, 1)).toBe('pendente');
  });

  it('retorna "em_analise" quando algum obrigatório foi enviado mas não todos aprovados', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'aprovado'), doc(2, 1, 'obrigatorio', 'em_analise')];
    expect(etapaStatus(docs, 1)).toBe('em_analise');
  });

  it('retorna "correcao" quando algum obrigatório foi rejeitado, mesmo com outros aprovados', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'aprovado'), doc(2, 1, 'obrigatorio', 'correcao')];
    expect(etapaStatus(docs, 1)).toBe('correcao');
  });

  it('retorna "concluida" quando todos os obrigatórios estão aprovados', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'aprovado'), doc(2, 1, 'obrigatorio', 'aprovado')];
    expect(etapaStatus(docs, 1)).toBe('concluida');
  });

  it('ignora documentos marcados como não aplicável', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'nao_aplicavel')];
    expect(etapaStatus(docs, 1)).toBe('concluida');
  });
});

describe('overallPct', () => {
  it('retorna 0 quando não há documentos obrigatórios', () => {
    expect(overallPct([doc(1, 1, 'opcional', 'pendente')])).toBe(0);
  });

  it('calcula a porcentagem correta de aprovados entre os obrigatórios', () => {
    const docs = [
      doc(1, 1, 'obrigatorio', 'aprovado'),
      doc(2, 1, 'obrigatorio', 'aprovado'),
      doc(3, 1, 'obrigatorio', 'pendente'),
      doc(4, 1, 'obrigatorio', 'pendente'),
    ];
    expect(overallPct(docs)).toBe(50);
  });

  it('não conta documentos opcionais ou recomendados no denominador', () => {
    const docs = [
      doc(1, 1, 'obrigatorio', 'aprovado'),
      doc(2, 1, 'recomendado', 'pendente'),
      doc(3, 1, 'opcional', 'pendente'),
    ];
    expect(overallPct(docs)).toBe(100);
  });

  it('ignora documentos não aplicáveis no cálculo', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'aprovado'), doc(2, 1, 'obrigatorio', 'nao_aplicavel')];
    expect(overallPct(docs)).toBe(100);
  });
});

describe('itensBloqueantes / isProntoParaProtocolo', () => {
  it('bloqueia quando existe obrigatório não aprovado', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'em_analise')];
    expect(itensBloqueantes(docs)).toHaveLength(1);
    expect(isProntoParaProtocolo(docs)).toBe(false);
  });

  it('libera quando todos os obrigatórios (ativos) estão aprovados', () => {
    const docs = [doc(1, 1, 'obrigatorio', 'aprovado'), doc(2, 1, 'obrigatorio', 'nao_aplicavel')];
    expect(itensBloqueantes(docs)).toHaveLength(0);
    expect(isProntoParaProtocolo(docs)).toBe(true);
  });

  it('recomendados nunca aparecem como bloqueantes', () => {
    const docs = [doc(1, 1, 'recomendado', 'pendente')];
    expect(itensBloqueantes(docs)).toHaveLength(0);
    expect(isProntoParaProtocolo(docs)).toBe(true);
  });
});

describe('recomendadosPendentes', () => {
  it('lista apenas recomendados não aprovados', () => {
    const docs = [
      doc(1, 1, 'recomendado', 'pendente'),
      doc(2, 1, 'recomendado', 'aprovado'),
      doc(3, 1, 'obrigatorio', 'pendente'),
    ];
    expect(recomendadosPendentes(docs)).toEqual([docs[0]]);
  });
});

describe('pendenciasList', () => {
  it('inclui apenas obrigatórios pendentes ou em correção', () => {
    const docs = [
      doc(1, 1, 'obrigatorio', 'pendente'),
      doc(2, 1, 'obrigatorio', 'correcao'),
      doc(3, 1, 'obrigatorio', 'aprovado'),
      doc(4, 1, 'recomendado', 'pendente'),
    ];
    const result = pendenciasList(docs);
    expect(result.map((d) => d.id)).toEqual([1, 2]);
  });
});

describe('labels', () => {
  it('traduz status conhecidos', () => {
    expect(statusLabel('correcao')).toBe('Correção necessária');
    expect(reqLabel('obrigatorio')).toBe('Obrigatório');
  });

  it('faz fallback para o valor original quando desconhecido', () => {
    expect(statusLabel('xyz')).toBe('xyz');
    expect(reqLabel('xyz')).toBe('xyz');
  });
});
