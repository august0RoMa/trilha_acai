import { useState, useRef, useEffect } from 'react';
import DocCard from './DocCard.jsx';
import { etapaStatus, overallPct } from '../utils.js';

const STATUS_META = {
  concluida: { label: 'Concluída', node: 'node-concluida' },
  em_analise: { label: 'Em análise', node: 'node-em_analise' },
  correcao: { label: 'Correção', node: 'node-correcao' },
  pendente: { label: 'Pendente', node: 'node-pendente' },
};

function etapaResumo(docs, etapaId) {
  const doEtapa = docs.filter((d) => d.etapaId === etapaId);
  const obrig = doEtapa.filter((d) => d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
  const aprovados = obrig.filter((d) => d.status === 'aprovado').length;
  const pct = obrig.length ? Math.round((aprovados / obrig.length) * 100) : 100;
  return { total: doEtapa.length, obrig: obrig.length, aprovados, pct };
}

function nodeLabel(nome) {
  return nome.length > 18 ? nome.slice(0, 17) + '…' : nome;
}

export default function Esteira({ processo, canValidate, canUpload, onStatusChange, onUpload, onDownload }) {
  const [openEtapas, setOpenEtapas] = useState(() => new Set());
  const [activeEtapa, setActiveEtapa] = useState(null);
  const [ready, setReady] = useState(false);
  const etapaRefs = useRef({});

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const etapasComDocs = processo.etapas.filter((et) => processo.docs.some((d) => d.etapaId === et.id));
  const statuses = etapasComDocs.map((et) => etapaStatus(processo.docs, et.id));

  function toggle(etapaId) {
    setActiveEtapa(etapaId);
    setOpenEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(etapaId)) next.delete(etapaId);
      else next.add(etapaId);
      return next;
    });
  }

  function focusEtapa(etapaId) {
    setActiveEtapa(etapaId);
    setOpenEtapas((prev) => new Set(prev).add(etapaId));
    requestAnimationFrame(() => {
      etapaRefs.current[etapaId]?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  }

  const allOpen = etapasComDocs.length > 0 && etapasComDocs.every((et) => openEtapas.has(et.id));
  function toggleAll() {
    setOpenEtapas(allOpen ? new Set() : new Set(etapasComDocs.map((e) => e.id)));
  }

  const pct = overallPct(processo.docs);
  const obrigAtivos = processo.docs.filter((d) => d.req === 'obrigatorio' && d.status !== 'nao_aplicavel');
  const aprovados = obrigAtivos.filter((d) => d.status === 'aprovado').length;
  const emAnalise = processo.docs.filter((d) => ['em_analise', 'enviado'].includes(d.status)).length;
  const correcao = processo.docs.filter((d) => d.status === 'correcao').length;

  const R = 42;
  const CIRC = 2 * Math.PI * R;

  return (
    <section className="view-enter">
      <div className="eyebrow">Esteira documental</div>
      <h1 className="page-title grad-heading">{processo.nome}</h1>
      <p className="page-sub">
        Acompanhe a esteira do processo etapa por etapa. Clique em uma parada para abrir os documentos daquela fase — o
        avanço acompanha a aprovação dos obrigatórios.
      </p>

      {/* Painel de progresso */}
      <div className="esteira-summary fade-up">
        <div className="ring-wrap">
          <svg viewBox="0 0 100 100" className="ring" aria-hidden="true">
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--acai)" />
                <stop offset="100%" stopColor="var(--berry)" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="50" cy="50" r={R} />
            <circle
              className="ring-fill"
              cx="50"
              cy="50"
              r={R}
              style={{ strokeDasharray: CIRC, strokeDashoffset: ready ? CIRC * (1 - pct / 100) : CIRC }}
            />
          </svg>
          <div className="ring-label">
            <span className="ring-num">{pct}%</span>
            <span className="ring-sub">concluído</span>
          </div>
        </div>
        <div className="summary-stats">
          <div className="sstat">
            <b>
              {aprovados}
              <i>/{obrigAtivos.length}</i>
            </b>
            <span>Obrigatórios aprovados</span>
          </div>
          <div className="sstat">
            <b className="v-gold">{emAnalise}</b>
            <span>Em análise</span>
          </div>
          <div className="sstat">
            <b className="v-berry">{correcao}</b>
            <span>Em correção</span>
          </div>
        </div>
      </div>

      {/* Esteira / stepper horizontal */}
      <div className="conveyor-wrap">
        <div className="conveyor">
          {etapasComDocs.map((et, i) => {
            const st = statuses[i];
            const resumo = etapaResumo(processo.docs, et.id);
            const fillLeft = i > 0 && statuses[i - 1] === 'concluida';
            const fillRight = st === 'concluida';
            const active = activeEtapa === et.id;
            const mark = st === 'concluida' ? '✓' : st === 'correcao' ? '!' : i + 1;
            return (
              <div
                className={`node-col ${fillLeft ? 'fill-left' : ''} ${fillRight ? 'fill-right' : ''}`}
                key={et.id}
                style={{ animationDelay: `${i * 0.045}s` }}
              >
                <button
                  className={`node ${STATUS_META[st].node} ${active ? 'is-active' : ''}`}
                  onClick={() => focusEtapa(et.id)}
                  title={`${et.nome} — ${resumo.aprovados}/${resumo.obrig || '—'} obrigatórios aprovados`}
                >
                  <span className="node-dot">{mark}</span>
                  <span className="node-name">{nodeLabel(et.nome)}</span>
                  <span className="node-meta">
                    {resumo.aprovados}/{resumo.obrig || '—'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda + controle */}
      <div className="trail-caption">
        <div className="trail-legend">
          <span>
            <i style={{ background: 'var(--acai)' }} /> Concluída
          </span>
          <span>
            <i style={{ background: 'var(--gold)' }} /> Em análise
          </span>
          <span>
            <i style={{ background: 'var(--berry)' }} /> Correção necessária
          </span>
          <span>
            <i style={{ border: '2px solid var(--ink-faint)', background: 'transparent' }} /> Pendente
          </span>
        </div>
        <button className="btn ghost sm" onClick={toggleAll} type="button">
          {allOpen ? 'Recolher tudo' : 'Expandir tudo'}
        </button>
      </div>

      <div className="etapas stagger">
        {etapasComDocs.map((et, i) => {
          const st = statuses[i];
          const docs = processo.docs.filter((d) => d.etapaId === et.id);
          const open = openEtapas.has(et.id);
          const active = activeEtapa === et.id;
          const resumo = etapaResumo(processo.docs, et.id);
          return (
            <div
              className={`etapa ${open ? 'open' : ''} ${active ? 'is-active' : ''}`}
              key={et.id}
              ref={(el) => (etapaRefs.current[et.id] = el)}
            >
              <button className="etapa-head" onClick={() => toggle(et.id)} aria-expanded={open}>
                <span className="etapa-idx">{String(i + 1).padStart(2, '0')}</span>
                <span className={`etapa-status-dot dot-${st}`} />
                <span className="etapa-name">{et.nome}</span>
                <span className={`etapa-chip chip-${st}`}>{STATUS_META[st].label}</span>
                <span className="etapa-progress">
                  <span className="ep-track">
                    <span className={`ep-fill fill-${st}`} style={{ width: ready ? `${resumo.pct}%` : 0 }} />
                  </span>
                  <span className="ep-count mono">
                    {resumo.aprovados}/{resumo.obrig || '—'}
                  </span>
                </span>
                <span className="etapa-caret">▸</span>
              </button>
              {open && (
                <div className="etapa-body">
                  <div className="doc-grid stagger">
                    {docs.map((d) => (
                      <DocCard
                        key={d.id}
                        doc={d}
                        canValidate={canValidate}
                        canUpload={canUpload}
                        onStatusChange={onStatusChange}
                        onUpload={onUpload}
                        onDownload={onDownload}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
