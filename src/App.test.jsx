import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { fakeState, resetFake, api, triggerBlobDownload } = vi.hoisted(() => {
  function makeProcesso() {
    return {
      id: 'proc-1',
      nome: 'Açaí do Baixo Tocantins',
      tipo: 'DO',
      entidade: 'Coopaçaí',
      territorio: 'Igarapé-Miri, PA',
      uf: 'PA',
      protocolo: null,
      etapas: [
        { id: 'et-1', ordem: 1, nome: 'Definição do tipo de IG', obrigatoria: true },
        { id: 'et-2', ordem: 2, nome: 'Entidade requerente', obrigatoria: true },
      ],
      docs: [
        { id: 'doc-1', etapaId: 'et-1', categoria: 'Jurídico da Entidade', nome: 'Definição formal: IP, DO ou a definir', req: 'obrigatorio', status: 'pendente', comentario: null, versaoVigente: null },
        { id: 'doc-2', etapaId: 'et-2', categoria: 'Jurídico da Entidade', nome: 'Estatuto social da entidade registrado', req: 'obrigatorio', status: 'pendente', comentario: null, versaoVigente: null },
      ],
    };
  }

  const ROLES_BY_PREFIX = ['admin', 'consultor', 'representante', 'produtor', 'parceiro_tecnico', 'leitor'];

  const state = {
    user: null,
    org: { id: 'org-1', nome: 'Coopaçaí Teste' },
    processos: [makeProcesso()],
  };

  function resetFake() {
    state.user = null;
    state.processos = [makeProcesso()];
  }

  const api = {
    login: vi.fn(async (email) => {
      const prefix = email.split('@')[0];
      const role = ROLES_BY_PREFIX.includes(prefix) ? prefix : 'admin';
      state.user = { id: `u-${role}`, nome: `Usuário ${role}`, email, role };
      return { token: 'fake-token', user: state.user, org: state.org };
    }),
    register: vi.fn(async (payload) => {
      state.user = { id: 'u-admin', nome: payload.nome, email: payload.email, role: 'admin' };
      return { token: 'fake-token', user: state.user, org: state.org };
    }),
    me: vi.fn(async () => ({ user: state.user, org: state.org })),
    listProcessos: vi.fn(async () => state.processos),
    getProcesso: vi.fn(async (id) => state.processos.find((p) => p.id === id)),
    createProcesso: vi.fn(async (form) => {
      const novo = {
        id: `proc-${state.processos.length + 1}`,
        nome: form.nome,
        tipo: form.tipo || 'A_DEFINIR',
        entidade: form.entidade,
        territorio: form.territorio,
        uf: 'PA',
        protocolo: null,
        etapas: [{ id: 'et-x', ordem: 1, nome: 'Definição do tipo de IG', obrigatoria: true }],
        docs: [{ id: 'doc-x', etapaId: 'et-x', categoria: 'Jurídico', nome: 'Definição formal', req: 'obrigatorio', status: 'pendente', versaoVigente: null }],
      };
      state.processos.push(novo);
      return novo;
    }),
    updateDocStatus: vi.fn(async (docId, status, comentario) => {
      const doc = state.processos.flatMap((p) => p.docs).find((d) => d.id === docId);
      doc.status = status;
      doc.comentario = comentario || null;
      return doc;
    }),
    uploadDocumento: vi.fn(async (docId, file) => {
      const doc = state.processos.flatMap((p) => p.docs).find((d) => d.id === docId);
      doc.status = 'enviado';
      doc.versaoVigente = { id: 'versao-1', nomeOriginal: file.name, tamanho: file.size };
      return { doc, versao: doc.versaoVigente };
    }),
    registrarProtocolo: vi.fn(async (id, payload) => {
      const p = state.processos.find((pr) => pr.id === id);
      p.protocolo = payload;
      return p;
    }),
    downloadVersao: vi.fn(async () => ({ blob: new Blob(['conteudo']), filename: 'arquivo.pdf' })),
    listUsers: vi.fn(async () => []),
    createUser: vi.fn(),
  };

  return { fakeState: state, resetFake, api, triggerBlobDownload: vi.fn() };
});

vi.mock('./api.js', () => ({ api, triggerBlobDownload }));

const { default: App } = await import('./App.jsx');
const { AuthProvider } = await import('./context/AuthContext.jsx');

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

async function loginAs(user, role) {
  await user.click(screen.getByText(`${role}@trilha.coop`));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  resetFake();
});

describe('Autenticação', () => {
  it('mostra a tela de login quando não há sessão', () => {
    renderApp();
    expect(screen.getByText(/ambiente de demonstração/i)).toBeInTheDocument();
    expect(screen.getByText('admin@trilha.coop')).toBeInTheDocument();
  });

  it('login por atalho de persona carrega o dashboard', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'admin');
    expect(await screen.findByRole('heading', { name: /processos de ig do açaí paraense/i })).toBeInTheDocument();
  });

  it('sair volta para a tela de login', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'admin');
    await screen.findByRole('heading', { name: /processos de ig do açaí paraense/i });
    await user.click(screen.getByRole('button', { name: /sair/i }));
    expect(await screen.findByText(/ambiente de demonstração/i)).toBeInTheDocument();
  });
});

describe('Permissões por persona', () => {
  it('consultor consegue aprovar um documento', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'consultor');
    await user.click(await screen.findByRole('button', { name: /esteira do processo/i }));
    await user.click(screen.getByText('Definição do tipo de IG').closest('button'));

    const select = await screen.findByLabelText(/status de definição formal/i);
    await user.selectOptions(select, 'aprovado');

    await waitFor(() => expect(api.updateDocStatus).toHaveBeenCalledWith('doc-1', 'aprovado', undefined, 'fake-token'));
  });

  it('leitor não vê controle de status nem botão de novo processo', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'leitor');
    await user.click(await screen.findByRole('button', { name: /esteira do processo/i }));
    await user.click(screen.getByText('Definição do tipo de IG').closest('button'));

    expect(screen.queryByLabelText(/status de definição formal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /novo processo de ig/i })).not.toBeInTheDocument();
  });

  it('produtor consegue enviar um arquivo, mas não vê o seletor de status', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'produtor');
    await user.click(await screen.findByRole('button', { name: /esteira do processo/i }));
    await user.click(screen.getByText('Definição do tipo de IG').closest('button'));

    expect(screen.queryByLabelText(/status de definição formal/i)).not.toBeInTheDocument();

    const file = new File(['conteudo'], 'estatuto.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/enviar arquivo/i);
    await user.upload(input, file);

    await waitFor(() => expect(api.uploadDocumento).toHaveBeenCalledWith('doc-1', file, 'fake-token'));
  });
});

describe('Processos', () => {
  it('admin cria um novo processo e navega até a esteira dele', async () => {
    const user = userEvent.setup();
    renderApp();
    await loginAs(user, 'admin');

    await user.click(await screen.findByRole('button', { name: /novo processo de ig/i }));
    await user.type(screen.getByLabelText(/nome da indicação geográfica/i), 'Açaí de Breves');
    await user.type(screen.getByLabelText(/entidade requerente/i), 'Coop. de Breves');
    await user.type(screen.getByLabelText(/território pretendido/i), 'Breves, PA');
    await user.click(screen.getByRole('button', { name: 'Criar processo' }));

    await waitFor(() => expect(api.createProcesso).toHaveBeenCalled());
    expect(await screen.findByRole('heading', { name: 'Açaí de Breves' })).toBeInTheDocument();
  });
});
