import { overallPct, itensBloqueantes, pendenciasList } from '../utils.js';

const TAG_LABEL = { IP: 'IP', DO: 'DO', A_DEFINIR: 'A definir' };

function statusPillFor(processo, pct) {
  if (processo.protocolo) return { cls: 'protocolado', label: 'Protocolado' };
  if (pct === 100 || itensBloqueantes(processo.docs).length === 0) return { cls: 'pronto', label: 'Pronto p/ conferência' };
  return { cls: 'andamento', label: 'Em andamento' };
}

export default function Dashboard({ processos, activeProcessId, onSelectProcess }) {
  const totalPendenciasCriticas = processos.reduce((acc, p) => acc + pendenciasList(p.docs).length, 0);
  const prontos = processos.filter((p) => !p.protocolo && itensBloqueantes(p.docs).length === 0).length;
  const protocolados = processos.filter((p) => p.protocolo).length;

  return (
    <section className="view-enter">
      <div className="eyebrow">Visão geral</div>
      <h1 className="page-title grad-heading">Processos de IG do açaí paraense</h1>
      <p className="page-sub">
        Acompanhe o andamento documental de cada pedido de Indicação Geográfica dos produtores e cooperativas de açaí
        do Pará, antes de seguir para o protocolo no e‑IG.
      </p>

      <div className="stat-row stagger">
        <div className="stat-card">
          <div className="num">{processos.length}</div>
          <div className="lbl">Processos ativos</div>
        </div>
        <div className="stat-card warn">
          <div className="num">{totalPendenciasCriticas}</div>
          <div className="lbl">Pendências críticas</div>
        </div>
        <div className="stat-card accent">
          <div className="num">{prontos}</div>
          <div className="lbl">Prontos para protocolo</div>
        </div>
        <div className="stat-card good">
          <div className="num">{protocolados}</div>
          <div className="lbl">Protocolados no INPI</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Processos</h2>
        <span className="count">{processos.length} no total</span>
      </div>

      {processos.length === 0 ? (
        <div className="empty-state">
          <div className="es-title">Nenhum processo cadastrado</div>
          Crie o primeiro processo de IG para começar a organizar a documentação.
        </div>
      ) : (
        <div className="proc-list stagger">
          {processos.map((p) => {
            const pct = overallPct(p.docs);
            const pill = statusPillFor(p, pct);
            return (
              <button
                key={p.id}
                className={`proc-card ${p.id === activeProcessId ? 'is-active' : ''}`}
                onClick={() => onSelectProcess(p.id, 'esteira')}
              >
                <div>
                  <div className="ptitle">{p.nome}</div>
                  <div className="pmeta">
                    {p.tipo === 'A_DEFINIR' ? 'Tipo a definir' : p.tipo === 'IP' ? 'Indicação de Procedência' : 'Denominação de Origem'}
                    {' · '}
                    {p.entidade} · {p.territorio}
                  </div>
                </div>
                <span className={`tag ${p.tipo.toLowerCase()}`}>{TAG_LABEL[p.tipo]}</span>
                <div className="progress-mini">
                  <div className="track">
                    <div className="fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--acai)' : undefined }} />
                  </div>
                  <span className="pct">{pct}% concluído</span>
                </div>
                <span className={`status-pill ${pill.cls}`}>{pill.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
