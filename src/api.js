const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', token, body, isForm } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status} ao falar com o servidor.`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),

  listProcessos: (token) => request('/processos', { token }),
  getProcesso: (id, token) => request(`/processos/${id}`, { token }),
  createProcesso: (payload, token) => request('/processos', { method: 'POST', body: payload, token }),
  registrarProtocolo: (id, payload, token) => request(`/processos/${id}/protocolo`, { method: 'POST', body: payload, token }),

  downloadChecklistPdf: (processoId, token) =>
    blobDownload(`/processos/${processoId}/checklist.pdf`, token, 'checklist.pdf'),
  downloadPacotePdf: (processoId, token) =>
    blobDownload(`/processos/${processoId}/pacote.pdf`, token, 'dossie.pdf'),

  updateDocStatus: (docId, status, comentario, token) =>
    request(`/documentos/${docId}/status`, { method: 'PUT', body: { status, comentario }, token }),

  uploadDocumento: (docId, file, token) => {
    const form = new FormData();
    form.append('arquivo', file);
    return request(`/documentos/${docId}/upload`, { method: 'POST', body: form, isForm: true, token });
  },

  getVersoes: (docId, token) => request(`/documentos/${docId}/versoes`, { token }),

  downloadVersao: (versaoId, token) =>
    blobDownload(`/documentos/versoes/${versaoId}/download`, token, 'documento'),

  listUsers: (token) => request('/users', { token }),
  createUser: (payload, token) => request('/users', { method: 'POST', body: payload, token }),
  deleteUser: (id, token) => request(`/users/${id}`, { method: 'DELETE', token }),
};

async function blobDownload(path, token, fallbackName) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }
  if (!res.ok) {
    let msg = `Erro ${res.status} ao gerar o arquivo.`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* resposta não-JSON */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;
  return { blob, filename };
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
