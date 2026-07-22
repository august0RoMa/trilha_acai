import { useState } from 'react';
import { itensBloqueantes, recomendadosPendentes, statusLabel } from '../utils.js';

export default function Conferencia({ processo, onDownloadChecklist, onExportPacote, canRegistrarProtocolo, onRegistrarProtocolo }) {
  const [numero, setNumero] = useState('');
  const [data, setData] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState('');
  const bloqueando = itensBloqueantes(processo.docs);
  const recomAusentes = recomendadosPendentes(processo.docs);
  const pronto = bloqueando.length === 0;

  async function run(kind, fn) {
    setDownloading(kind);
    try {
      await fn();
    } finally {
      setDownloading('');
    }
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    if (!numero.trim() || !data) return;
    setBusy(true);
    try {
      await onRegistrarProtocolo(numero.trim(), data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="view-enter">
      <div className="eyebrow">Conferência pré-protocolo</div>
      <h1 className="page-title">Checklist final antes do e‑IG</h1>
      <p className="page-sub">
        O protocolo oficial acontece no sistema e‑IG do INPI. Esta conferência garante que o dossiê de{' '}
        <strong>{processo.nome}</strong> está completo antes do envio.
      </p>

      {processo.protocolo ? (
        <div className="gate-banner ready">
          <div className="gate-icon">●</div>
          <div>
            <h3>Já protocolado no e‑IG</h3>
            <p>
              Protocolo <span className="mono">{processo.protocolo.numero}</span> registrado em{' '}
              {new Date(processo.protocolo.data).toLocaleDateString('pt-BR')}.
            </p>
          </div>
        </div>
      ) : bloqueando.length > 0 ? (
        <div className="gate-banner blocked">
          <div className="gate-icon">◔</div>
          <div>
            <h3>Bloqueado para protocolo</h3>
            <p>{bloqueando.length} documento(s) obrigatório(s) ainda pendente(s), em análise ou em correção.</p>
          </div>
        </div>
      ) : (
        <div className="gate-banner ready">
          <div className="gate-icon">●</div>
          <div style={{ flex: 1 }}>
            <h3>Pronto para protocolo</h3>
            <p>Todos os documentos obrigatórios foram aprovados. Baixe o pacote completo, já organizado por etapa, para anexar no e‑IG.</p>
          </div>
          <button
            className="btn"
            onClick={() => run('pacote', onExportPacote)}
            disabled={downloading === 'pacote'}
          >
            {downloading === 'pacote' ? 'Montando…' : '⬇ Baixar dossiê completo (PDF)'}
          </button>
        </div>
      )}

      <div className="conf-grid">
        <div className="conf-card">
          <h4>Documentos obrigatórios</h4>
          {bloqueando.length ? (
            bloqueando.map((d) => (
              <div className="conf-item" key={d.id}>
                <span>{d.nome}</span>
                <span className={`doc-status ${d.status}`}>{statusLabel(d.status)}</span>
              </div>
            ))
          ) : (
            <div className="conf-item">
              <span>Nenhum item impeditivo</span>
              <span>—</span>
            </div>
          )}
        </div>
        <div className="conf-card">
          <h4>Recomendados ausentes (não bloqueiam)</h4>
          {recomAusentes.length ? (
            recomAusentes.map((d) => (
              <div className="conf-item" key={d.id}>
                <span>{d.nome}</span>
                <span className={`doc-status ${d.status}`}>{statusLabel(d.status)}</span>
              </div>
            ))
          ) : (
            <div className="conf-item">
              <span>Nenhuma recomendação pendente</span>
              <span>—</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn outline" onClick={() => run('pdf', onDownloadChecklist)} disabled={downloading === 'pdf'}>
          {downloading === 'pdf' ? 'Gerando…' : 'Baixar checklist (PDF)'}
        </button>
        <button className="btn outline" onClick={() => run('pacote', onExportPacote)} disabled={downloading === 'pacote'}>
          {downloading === 'pacote' ? 'Montando…' : 'Exportar dossiê completo (PDF)'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8 }}>
        {pronto
          ? 'O dossiê é um único PDF: o checklist na capa seguido de todos os documentos aprovados, cada um convertido para PDF e pronto para o e‑IG.'
          : `O checklist reflete a situação atual. O dossiê reúne em um só PDF os arquivos já enviados — os ${bloqueando.length} obrigatório(s) ainda pendente(s) entram quando forem aprovados.`}
      </p>

      {!processo.protocolo && bloqueando.length === 0 && canRegistrarProtocolo && (
        <div className="guide-card" style={{ marginTop: 24, maxWidth: 420 }}>
          <h3>Registrar protocolo no e‑IG</h3>
          <p>Depois de protocolar manualmente no sistema do INPI, registre aqui o número e a data para habilitar o acompanhamento pós-protocolo.</p>
          <form onSubmit={handleRegistrar} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            <div className="field">
              <label htmlFor="protocolo-numero">Número do protocolo</label>
              <input id="protocolo-numero" type="text" placeholder="Ex.: BR512024001987-3" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="protocolo-data">Data do protocolo</label>
              <input id="protocolo-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Registrando…' : 'Registrar protocolo'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
