import { useState, useRef, useEffect } from 'react';
import { overallPct } from '../utils.js';

const TAG_LABEL = { IP: 'IP', DO: 'DO', A_DEFINIR: 'A definir' };

export default function Topbar({ processos, activeProcess, onSelectProcess, onOpenMenu, onOpenModal, canManageProcesso }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!activeProcess) {
    return (
      <div className="topbar">
        <div className="topbar-left">
          <button className="menu-btn" onClick={onOpenMenu} aria-label="Abrir menu">
            ☰
          </button>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            Nenhum processo selecionado
          </span>
        </div>
        <div className="topbar-actions">
          {canManageProcesso && (
            <button className="btn sm" onClick={onOpenModal}>
              + Novo processo de IG
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="topbar" ref={ref}>
      <div className="topbar-left">
        <button className="menu-btn" onClick={onOpenMenu} aria-label="Abrir menu">
          ☰
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="process-switcher"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            <span className="dot" />
            <span className="label">
              <b>{activeProcess.nome}</b>
            </span>
            <span className="type">{TAG_LABEL[activeProcess.tipo]} · {activeProcess.uf}</span>
          </button>
          {menuOpen && (
            <div className="process-menu" role="listbox">
              {processos.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={p.id === activeProcess.id}
                  onClick={() => {
                    onSelectProcess(p.id);
                    setMenuOpen(false);
                  }}
                >
                  <span>{p.nome}</span>
                  <span className="pm-meta">
                    {TAG_LABEL[p.tipo]} · {overallPct(p.docs)}% concluído
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="topbar-actions">
        {canManageProcesso && (
          <button className="btn sm" onClick={onOpenModal}>
            + Novo processo de IG
          </button>
        )}
      </div>
    </div>
  );
}
