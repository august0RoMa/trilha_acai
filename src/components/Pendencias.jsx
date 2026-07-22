import { pendenciasList, statusLabel } from '../utils.js';

const RESPONSAVEIS = ['M. Andrade', 'T. Souza', 'Coop. local', 'J. Rezende'];
const PRAZOS = ['12 jul', '18 jul', '25 jul', '30 jul'];

export default function Pendencias({ processo }) {
  const pend = pendenciasList(processo.docs);

  return (
    <section className="view-enter">
      <div className="eyebrow">Pendências</div>
      <h1 className="page-title">O que ainda falta providenciar</h1>
      <p className="page-sub">
        Itens obrigatórios pendentes ou em correção de <strong>{processo.nome}</strong>, com responsável e prazo,
        ordenados por prioridade.
      </p>

      {pend.length === 0 ? (
        <div className="empty-state">
          <div className="es-title">Nenhuma pendência obrigatória</div>
          Bom trabalho — todos os documentos obrigatórios estão em dia.
        </div>
      ) : (
        <table className="pend">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Prioridade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pend.map((d, i) => {
              const etapa = processo.etapas.find((e) => e.id === d.etapaId);
              const prio = d.status === 'correcao' ? 'alta' : i % 2 === 0 ? 'alta' : 'media';
              const resp = RESPONSAVEIS[i % RESPONSAVEIS.length];
              return (
                <tr key={d.id}>
                  <td>{d.nome}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{etapa?.nome}</td>
                  <td>
                    <span className="avatar">
                      {resp
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </span>
                    {resp}
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-soft)' }}>
                    {PRAZOS[i % PRAZOS.length]}
                  </td>
                  <td>
                    <span className={`prio ${prio}`}>{prio}</span>
                  </td>
                  <td>
                    <span className={`doc-status ${d.status}`}>{statusLabel(d.status)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
