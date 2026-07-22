const NAV_GROUPS = [
  {
    label: 'Meu processo',
    items: [
      { view: 'dashboard', n: '01', label: 'Visão geral' },
      { view: 'esteira', n: '02', label: 'Esteira do processo' },
      { view: 'documentos', n: '03', label: 'Repositório' },
      { view: 'pendencias', n: '04', label: 'Pendências' },
      { view: 'conferencia', n: '05', label: 'Conferência' },
    ],
  },
  {
    label: 'Central de ajuda',
    items: [
      { view: 'guia', n: '06', label: 'Guia básico da IG' },
      { view: 'gru', n: '07', label: 'Pagamento da GRU' },
      { view: 'inpi', n: '08', label: 'Acompanhar no INPI' },
      { view: 'faq', n: '09', label: 'Perguntas frequentes' },
    ],
  },
];

const ADMIN_GROUP = {
  label: 'Administração',
  items: [{ view: 'usuarios', n: '10', label: 'Usuários' }],
};

export default function Sidebar({ view, onNavigate, open, onClose, user, org, roleLabel, onLogout, canManageUsers }) {
  const groups = canManageUsers ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div>
            <div className="brand-mark">
              Tr<em>i</em>lha
            </div>
            <div className="brand-sub">Indicação Geográfica</div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        </div>
        <nav className="nav">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.view}
                  className={`nav-tab ${view === item.view ? 'active' : ''}`}
                  aria-current={view === item.view ? 'page' : undefined}
                  onClick={() => onNavigate(item.view)}
                >
                  <span className="n">{item.n}</span> {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div style={{ color: '#EFEEE1', fontWeight: 600, fontSize: 12.5 }}>{user?.nome}</div>
          <div style={{ marginBottom: 4 }}>
            {roleLabel} · {org?.nome}
          </div>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 11.5, padding: 0, cursor: 'pointer' }}
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
