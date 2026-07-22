import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../roles.js';

const DEMO_PERSONAS = [
  { role: 'admin', email: 'admin@trilha.coop', desc: 'Configura a plataforma e gerencia usuários.' },
  { role: 'consultor', email: 'consultor@trilha.coop', desc: 'Valida documentos e acompanha vários processos.' },
  { role: 'representante', email: 'representante@trilha.coop', desc: 'Envia documentos da cooperativa.' },
  { role: 'produtor', email: 'produtor@trilha.coop', desc: 'Envia seus próprios documentos e declarações.' },
  { role: 'parceiro_tecnico', email: 'parceiro@trilha.coop', desc: 'Contribui com laudos e estudos técnicos.' },
  { role: 'leitor', email: 'leitor@trilha.coop', desc: 'Acompanha o processo sem poder editar.' },
];
const DEMO_PASSWORD = 'acai123';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', orgNome: '', nome: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ orgNome: form.orgNome, nome: form.nome, email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin(email) {
    setError('');
    setBusy(true);
    try {
      await login(email, DEMO_PASSWORD);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-grid" style={{ width: '100%', maxWidth: 920, position: 'relative', zIndex: 1 }}>
        <div className="guide-card login-card fade-up" style={{ margin: 0 }}>
          <div className="login-badge">
            <span className="dot" />
            Plataforma de Indicação Geográfica
          </div>
          <div className="login-brand" style={{ color: 'var(--acai-deep)', marginBottom: 4, position: 'relative' }}>
            Tr<em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>i</em>lha
          </div>
          <p className="page-sub" style={{ marginBottom: 18, position: 'relative' }}>
            Gestão documental de Indicação Geográfica para cooperativas de açaí do Pará — do primeiro documento ao
            protocolo no e‑IG.
          </p>

          <div className="login-stats">
            <div className="ls-item">
              <div className="ls-num">6</div>
              <div className="ls-lbl">Perfis de acesso</div>
            </div>
            <div className="ls-item">
              <div className="ls-num">100%</div>
              <div className="ls-lbl">Upload real</div>
            </div>
            <div className="ls-item">
              <div className="ls-num">PA</div>
              <div className="ls-lbl">Açaí paraense</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, margin: '22px 0 18px', position: 'relative' }}>
            <button className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')} type="button">
              Entrar
            </button>
            <button className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')} type="button">
              Criar organização
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label htmlFor="login-email">E-mail</label>
                <input id="login-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="login-password">Senha</label>
                <input
                  id="login-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              {error && <div className="field-error">{error}</div>}
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label htmlFor="reg-org">Nome da organização</label>
                <input id="reg-org" type="text" placeholder="Ex.: Coopaçaí" value={form.orgNome} onChange={(e) => setForm({ ...form, orgNome: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="reg-nome">Seu nome</label>
                <input id="reg-nome" type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="reg-email">E-mail</label>
                <input id="reg-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="reg-password">Senha</label>
                <input
                  id="reg-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              {error && <div className="field-error">{error}</div>}
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Criando…' : 'Criar organização'}
              </button>
              <p style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                Você vira o administrador dessa organização e pode convidar o restante da equipe depois.
              </p>
            </form>
          )}
        </div>

        <div className="fade-up" style={{ animationDelay: '.15s' }}>
          <div className="eyebrow">Ambiente de demonstração</div>
          <p className="page-sub" style={{ marginBottom: 12 }}>
            Entre com qualquer persona para ver as permissões na prática (senha <span className="mono">{DEMO_PASSWORD}</span>).
          </p>
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.role}
                type="button"
                className="proc-card persona-card"
                style={{ gridTemplateColumns: '1fr auto', cursor: busy ? 'wait' : 'pointer' }}
                onClick={() => quickLogin(p.email)}
                disabled={busy}
              >
                <div>
                  <div className="ptitle">{ROLE_LABEL[p.role]}</div>
                  <div className="pmeta">{p.desc}</div>
                </div>
                <span className="tag adefinir">{p.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
