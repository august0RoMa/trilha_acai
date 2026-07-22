import { useState } from 'react';

const TIPOS = [
  { key: 'IP', label: 'IP — Indicação de Procedência' },
  { key: 'DO', label: 'DO — Denominação de Origem' },
  { key: 'A_DEFINIR', label: 'A definir' },
];

const EMPTY = { nome: '', tipo: 'A_DEFINIR', entidade: '', territorio: '' };

export default function NovoProcessoModal({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!form.nome.trim()) next.nome = 'Informe o nome da Indicação Geográfica.';
    if (!form.entidade.trim()) next.entidade = 'Informe a entidade requerente.';
    if (!form.territorio.trim()) next.territorio = 'Informe o território pretendido.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onCreate(form);
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="novo-processo-title">
        <form onSubmit={handleSubmit}>
          <div className="modal-head">
            <h3 id="novo-processo-title">Novo processo de IG</h3>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="field">
              <label htmlFor="np-nome">Nome da Indicação Geográfica</label>
              <input
                id="np-nome"
                type="text"
                className={errors.nome ? 'has-error' : ''}
                placeholder="Ex.: Açaí de Ponta de Pedras"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              {errors.nome && <div className="field-error">{errors.nome}</div>}
            </div>

            <div className="field">
              <label>Tipo de pedido</label>
              <div className="radio-row" role="radiogroup" aria-label="Tipo de pedido">
                {TIPOS.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    className={`radio-opt ${form.tipo === t.key ? 'sel' : ''}`}
                    aria-pressed={form.tipo === t.key}
                    onClick={() => setForm({ ...form, tipo: t.key })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="np-entidade">Entidade requerente</label>
              <input
                id="np-entidade"
                type="text"
                className={errors.entidade ? 'has-error' : ''}
                placeholder="Cooperativa, associação ou sindicato de produtores"
                value={form.entidade}
                onChange={(e) => setForm({ ...form, entidade: e.target.value })}
              />
              {errors.entidade && <div className="field-error">{errors.entidade}</div>}
            </div>

            <div className="field">
              <label htmlFor="np-territorio">Território pretendido</label>
              <input
                id="np-territorio"
                type="text"
                className={errors.territorio ? 'has-error' : ''}
                placeholder="Ex.: Municípios abrangidos no Pará"
                value={form.territorio}
                onChange={(e) => setForm({ ...form, territorio: e.target.value })}
              />
              {errors.territorio && <div className="field-error">{errors.territorio}</div>}
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              Criar processo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
