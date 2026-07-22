import { useMemo, useState } from 'react';
import DocCard from './DocCard.jsx';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'em_analise', label: 'Em análise' },
  { key: 'correcao', label: 'Correção necessária' },
  { key: 'aprovado', label: 'Aprovados' },
];

export default function Documentos({ processo, canValidate, canUpload, onStatusChange, onUpload, onDownload }) {
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');

  const categorias = useMemo(() => {
    const set = new Set(processo.docs.map((d) => d.categoria));
    return [...set];
  }, [processo.docs]);

  const q = search.trim().toLowerCase();

  const folders = categorias
    .map((cat) => {
      let docs = processo.docs.filter((d) => d.categoria === cat);
      if (filter !== 'todos') docs = docs.filter((d) => d.status === filter);
      if (q) docs = docs.filter((d) => d.nome.toLowerCase().includes(q));
      return { cat, docs };
    })
    .filter((f) => f.docs.length > 0);

  return (
    <section className="view-enter">
      <div className="eyebrow">Repositório</div>
      <h1 className="page-title">Documentos por pasta</h1>
      <p className="page-sub">
        Todos os arquivos de <strong>{processo.nome}</strong>, organizados por categoria temática, com o status de
        cada item.
      </p>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <input
          className="search-input"
          type="search"
          placeholder="Buscar documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar documento"
        />
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <div className="es-title">Nenhum documento encontrado</div>
          Ajuste o filtro ou o termo de busca.
        </div>
      ) : (
        <div className="folder-grid">
          {folders.map(({ cat, docs }) => (
            <div className="folder" key={cat}>
              <div className="folder-head">
                <span className="icon">▤</span>
                <h3>{cat}</h3>
                <span className="cnt">{docs.length} documento(s)</span>
              </div>
              <div className="doc-grid">
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
          ))}
        </div>
      )}
    </section>
  );
}
