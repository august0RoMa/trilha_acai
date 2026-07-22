import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ROLE_LABEL } from '../roles.js';

const ROLES = Object.keys(ROLE_LABEL);
const EMPTY = { nome: '', email: '', password: '', role: 'produtor' };

export default function Usuarios({ token, currentUserId, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listUsers(token);
      setUsers(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    const next = {};
    if (!form.nome.trim()) next.nome = 'Informe o nome.';
    if (!form.email.trim()) next.email = 'Informe o e-mail.';
    if (!form.password || form.password.length < 6) next.password = 'Mínimo de 6 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await api.createUser(form, token);
      setForm(EMPTY);
      await load();
      addToast('Usuário convidado com sucesso.');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remover o acesso de ${user.nome}?`)) return;
    try {
      await api.deleteUser(user.id, token);
      await load();
      addToast('Usuário removido.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  return (
    <section className="view-enter">
      <div className="eyebrow">Administração</div>
      <h1 className="page-title grad-heading">Usuários da organização</h1>
      <p className="page-sub">
        Convide pessoas para a cooperativa e defina o perfil de cada uma — as permissões de upload, validação e
        gestão de processos seguem automaticamente a matriz de perfis do Trilha.
      </p>

      <div className="guide-grid">
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>Equipe</h2>
            <span className="count">{users.length} no total</span>
          </div>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)' }}>Carregando…</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="es-title">Nenhum usuário encontrado</div>
              Convide a primeira pessoa da equipe usando o formulário ao lado.
            </div>
          ) : (
            <table className="pend stagger">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perfil</th>
                  <th>E-mail</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="avatar">
                        {u.nome
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')}
                      </span>
                      {u.nome}
                    </td>
                    <td style={{ color: 'var(--ink-soft)' }}>{u.roleLabel || ROLE_LABEL[u.role]}</td>
                    <td className="mono" style={{ color: 'var(--ink-soft)' }}>
                      {u.email}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.id !== currentUserId && (
                        <button className="btn danger sm" onClick={() => handleDelete(u)}>
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="guide-card">
            <h3>Convidar novo usuário</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
              <div className="field">
                <label htmlFor="user-nome">Nome</label>
                <input
                  id="user-nome"
                  type="text"
                  className={errors.nome ? 'has-error' : ''}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
                {errors.nome && <div className="field-error">{errors.nome}</div>}
              </div>
              <div className="field">
                <label htmlFor="user-email">E-mail</label>
                <input
                  id="user-email"
                  type="email"
                  className={errors.email ? 'has-error' : ''}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
              <div className="field">
                <label htmlFor="user-password">Senha temporária</label>
                <input
                  id="user-password"
                  type="text"
                  className={errors.password ? 'has-error' : ''}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>
              <div className="field">
                <label htmlFor="user-role">Perfil</label>
                <select id="user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Convidando…' : 'Convidar usuário'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
