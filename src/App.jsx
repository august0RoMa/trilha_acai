import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Esteira from './components/Esteira.jsx';
import Documentos from './components/Documentos.jsx';
import Pendencias from './components/Pendencias.jsx';
import Conferencia from './components/Conferencia.jsx';
import Guia from './components/Guia.jsx';
import Gru from './components/Gru.jsx';
import Inpi from './components/Inpi.jsx';
import Faq from './components/Faq.jsx';
import Usuarios from './components/Usuarios.jsx';
import Login from './components/Login.jsx';
import NovoProcessoModal from './components/NovoProcessoModal.jsx';
import ToastStack from './components/ToastStack.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { api, triggerBlobDownload } from './api.js';
import { statusLabel } from './utils.js';
import { ROLE_LABEL, CAN_MANAGE_PROCESSO, CAN_UPLOAD, CAN_VALIDATE, CAN_MANAGE_USERS, can } from './roles.js';

const PROCESS_VIEWS = new Set(['dashboard', 'esteira', 'documentos', 'pendencias', 'conferencia']);

export default function App() {
  const { user, org, token, loading: authLoading, logout } = useAuth();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
        Carregando…
      </div>
    );
  }

  if (!user) return <Login />;

  return <AuthenticatedApp user={user} org={org} token={token} onLogout={logout} />;
}

function AuthenticatedApp({ user, org, token, onLogout }) {
  const [processos, setProcessos] = useState([]);
  const [activeProcessId, setActiveProcessId] = useState(null);
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const canManageProcesso = can(user.role, CAN_MANAGE_PROCESSO);
  const canUpload = can(user.role, CAN_UPLOAD);
  const canValidate = can(user.role, CAN_VALIDATE);
  const canManageUsers = can(user.role, CAN_MANAGE_USERS);

  const activeProcess = processos.find((p) => p.id === activeProcessId) || null;

  function addToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }

  async function loadProcessos() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.listProcessos(token);
      setProcessos(data);
      setActiveProcessId((prev) => prev || data[0]?.id || null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProcessos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNavigate(next) {
    setView(next);
    setSidebarOpen(false);
  }

  function handleSelectProcess(id, navigateTo) {
    setActiveProcessId(id);
    if (navigateTo) setView(navigateTo);
  }

  async function refreshActiveProcess() {
    if (!activeProcessId) return;
    const fresh = await api.getProcesso(activeProcessId, token);
    setProcessos((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
  }

  async function handleStatusChange(docId, status, comentario) {
    try {
      await api.updateDocStatus(docId, status, comentario, token);
      await refreshActiveProcess();
      addToast(`Documento marcado como ${statusLabel(status).toLowerCase()}.`, status === 'correcao' ? 'error' : 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleUpload(docId, file) {
    try {
      await api.uploadDocumento(docId, file, token);
      await refreshActiveProcess();
      addToast('Arquivo enviado com sucesso.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleDownload(versaoId, filename) {
    try {
      const { blob, filename: serverFilename } = await api.downloadVersao(versaoId, token);
      triggerBlobDownload(blob, filename || serverFilename);
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleCreateProcess(form) {
    try {
      const novo = await api.createProcesso(form, token);
      setProcessos((prev) => [...prev, novo]);
      setActiveProcessId(novo.id);
      setModalOpen(false);
      setView('esteira');
      addToast('Processo criado. Checklist gerado automaticamente.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleRegistrarProtocolo(numero, data) {
    try {
      await api.registrarProtocolo(activeProcessId, { numero, data }, token);
      await refreshActiveProcess();
      addToast('Protocolo registrado. Acompanhamento pós-protocolo habilitado.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleDownloadChecklist() {
    try {
      const { blob, filename } = await api.downloadChecklistPdf(activeProcessId, token);
      triggerBlobDownload(blob, filename);
      addToast('Checklist gerado em PDF.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleExportPacote() {
    try {
      addToast('Montando o dossiê em PDF…');
      const { blob, filename } = await api.downloadPacotePdf(activeProcessId, token);
      triggerBlobDownload(blob, filename);
      addToast('Dossiê documental gerado em PDF.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  function renderView() {
    if (loading) {
      return <div style={{ color: 'var(--ink-soft)', padding: '40px 0' }}>Carregando processos…</div>;
    }
    if (loadError) {
      return (
        <div className="empty-state">
          <div className="es-title">Não foi possível carregar os processos</div>
          {loadError}
          <div style={{ marginTop: 14 }}>
            <button className="btn sm" onClick={loadProcessos}>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    if (PROCESS_VIEWS.has(view) && view !== 'dashboard' && !activeProcess) {
      return (
        <div className="empty-state">
          <div className="es-title">Nenhum processo selecionado</div>
          Escolha um processo na Visão geral para ver esta tela.
        </div>
      );
    }
    switch (view) {
      case 'dashboard':
        return <Dashboard processos={processos} activeProcessId={activeProcessId} onSelectProcess={handleSelectProcess} />;
      case 'esteira':
        return (
          <Esteira
            processo={activeProcess}
            canValidate={canValidate}
            canUpload={canUpload}
            onStatusChange={handleStatusChange}
            onUpload={handleUpload}
            onDownload={handleDownload}
          />
        );
      case 'documentos':
        return (
          <Documentos
            processo={activeProcess}
            canValidate={canValidate}
            canUpload={canUpload}
            onStatusChange={handleStatusChange}
            onUpload={handleUpload}
            onDownload={handleDownload}
          />
        );
      case 'pendencias':
        return <Pendencias processo={activeProcess} />;
      case 'conferencia':
        return (
          <Conferencia
            processo={activeProcess}
            onDownloadChecklist={handleDownloadChecklist}
            onExportPacote={handleExportPacote}
            canRegistrarProtocolo={canManageProcesso}
            onRegistrarProtocolo={handleRegistrarProtocolo}
          />
        );
      case 'guia':
        return <Guia />;
      case 'gru':
        return <Gru />;
      case 'inpi':
        return <Inpi />;
      case 'faq':
        return <Faq />;
      case 'usuarios':
        return canManageUsers ? <Usuarios token={token} currentUserId={user.id} addToast={addToast} /> : null;
      default:
        return null;
    }
  }

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        org={org}
        roleLabel={ROLE_LABEL[user.role]}
        onLogout={onLogout}
        canManageUsers={canManageUsers}
      />
      <div>
        <Topbar
          processos={processos}
          activeProcess={activeProcess}
          onSelectProcess={handleSelectProcess}
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenModal={() => setModalOpen(true)}
          canManageProcesso={canManageProcesso}
        />
        <main>{renderView()}</main>
      </div>
      {modalOpen && <NovoProcessoModal onClose={() => setModalOpen(false)} onCreate={handleCreateProcess} />}
      <ToastStack toasts={toasts} />
    </div>
  );
}
