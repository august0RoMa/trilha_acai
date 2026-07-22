import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

async function registerOrg() {
  const res = await request(app).post('/api/auth/register').send({
    orgNome: 'Coopaçaí Teste',
    nome: 'Admin Teste',
    email: `admin-${Date.now()}@teste.com`,
    password: 'senha123',
  });
  return res.body; // { token, user, org }
}

async function createUser(adminToken, role, emailPrefix) {
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nome: `Usuário ${role}`, email: `${emailPrefix}-${Date.now()}@teste.com`, password: 'senha123', role });
  return res.body;
}

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body;
}

describe('Autenticação', () => {
  it('registra uma nova organização e retorna um token', async () => {
    const { token, user, org } = await registerOrg();
    expect(token).toBeTruthy();
    expect(user.role).toBe('admin');
    expect(org.nome).toBe('Coopaçaí Teste');
    expect(user.passwordHash).toBeUndefined();
  });

  it('rejeita login com senha errada', async () => {
    const { user } = await registerOrg();
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'errada' });
    expect(res.status).toBe(401);
  });

  it('bloqueia rotas protegidas sem token', async () => {
    const res = await request(app).get('/api/processos');
    expect(res.status).toBe(401);
  });
});

describe('Processos e checklist', () => {
  it('cria um processo com o checklist completo gerado automaticamente', async () => {
    const { token } = await registerOrg();
    const res = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí de Breves', tipo: 'DO', entidade: 'Coop. de Breves', territorio: 'Breves, PA' });

    expect(res.status).toBe(201);
    expect(res.body.docs).toHaveLength(24);
    expect(res.body.etapas).toHaveLength(11);
    expect(res.body.docs.every((d) => d.status === 'pendente')).toBe(true);
  });

  it('valida campos obrigatórios ao criar processo', async () => {
    const { token } = await registerOrg();
    const res = await request(app).post('/api/processos').set('Authorization', `Bearer ${token}`).send({ nome: 'Sem entidade' });
    expect(res.status).toBe(400);
  });
});

describe('Permissões por persona', () => {
  it('impede que um leitor aprove documentos', async () => {
    const { token: adminToken } = await registerOrg();
    const leitor = await createUser(adminToken, 'leitor', 'leitor');
    const { token: leitorToken } = await login(leitor.email, 'senha123');

    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Açaí Teste', tipo: 'IP', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    const res = await request(app)
      .put(`/api/documentos/${docId}/status`)
      .set('Authorization', `Bearer ${leitorToken}`)
      .send({ status: 'aprovado' });

    expect(res.status).toBe(403);
  });

  it('permite que um consultor aprove documentos', async () => {
    const { token: adminToken } = await registerOrg();
    const consultor = await createUser(adminToken, 'consultor', 'consultor');
    const { token: consultorToken } = await login(consultor.email, 'senha123');

    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Açaí Teste 2', tipo: 'IP', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    const res = await request(app)
      .put(`/api/documentos/${docId}/status`)
      .set('Authorization', `Bearer ${consultorToken}`)
      .send({ status: 'aprovado' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aprovado');
  });

  it('exige comentário para marcar documento como correção necessária', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 3', tipo: 'DO', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    const semComentario = await request(app)
      .put(`/api/documentos/${docId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'correcao' });
    expect(semComentario.status).toBe(400);

    const comComentario = await request(app)
      .put(`/api/documentos/${docId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'correcao', comentario: 'Falta assinatura na última página.' });
    expect(comComentario.status).toBe(200);
    expect(comComentario.body.comentario).toMatch(/assinatura/);
  });

  it('impede marcar documento obrigatório como não aplicável', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 4', tipo: 'DO', entidade: 'X', territorio: 'Y' });
    const obrigatorio = proc.body.docs.find((d) => d.req === 'obrigatorio');

    const res = await request(app)
      .put(`/api/documentos/${obrigatorio.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'nao_aplicavel' });
    expect(res.status).toBe(403);
  });
});

describe('Upload real de arquivos', () => {
  it('faz upload de um PDF, cria uma versão vigente e permite o download', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 5', tipo: 'DO', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    const uploadRes = await request(app)
      .post(`/api/documentos/${docId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('arquivo', Buffer.from('%PDF-1.4 conteúdo de teste'), 'estatuto.pdf');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.doc.status).toBe('enviado');
    expect(uploadRes.body.versao.nomeOriginal).toBe('estatuto.pdf');

    const versaoId = uploadRes.body.versao.id;
    const downloadRes = await request(app)
      .get(`/api/documentos/versoes/${versaoId}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(downloadRes.status).toBe(200);
    expect(Buffer.from(downloadRes.body).toString('utf-8')).toContain('conteúdo de teste');
  });

  it('rejeita upload de um tipo de arquivo não permitido', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 6', tipo: 'DO', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    const res = await request(app)
      .post(`/api/documentos/${docId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('arquivo', Buffer.from('conteúdo'), 'virus.exe');

    expect(res.status).toBe(400);
  });

  it('uma nova versão substitui a anterior como vigente', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 7', tipo: 'DO', entidade: 'X', territorio: 'Y' });
    const docId = proc.body.docs[0].id;

    await request(app)
      .post(`/api/documentos/${docId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('arquivo', Buffer.from('%PDF v1'), 'doc-v1.pdf');
    await request(app)
      .post(`/api/documentos/${docId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('arquivo', Buffer.from('%PDF v2'), 'doc-v2.pdf');

    const versoes = await request(app).get(`/api/documentos/${docId}/versoes`).set('Authorization', `Bearer ${token}`);
    expect(versoes.body).toHaveLength(2);
    const vigentes = versoes.body.filter((v) => v.vigente);
    expect(vigentes).toHaveLength(1);
    expect(vigentes[0].nomeOriginal).toBe('doc-v2.pdf');
  });
});

describe('Conferência pré-protocolo', () => {
  it('bloqueia o registro de protocolo enquanto houver documento obrigatório pendente', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 8', tipo: 'DO', entidade: 'X', territorio: 'Y' });

    const res = await request(app)
      .post(`/api/processos/${proc.body.id}/protocolo`)
      .set('Authorization', `Bearer ${token}`)
      .send({ numero: 'BR512024000001-0', data: '2026-01-01' });

    expect(res.status).toBe(409);
  });

  it('permite registrar protocolo quando todos os obrigatórios estão aprovados', async () => {
    const { token } = await registerOrg();
    const proc = await request(app)
      .post('/api/processos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Açaí Teste 9', tipo: 'DO', entidade: 'X', territorio: 'Y' });

    for (const doc of proc.body.docs) {
      if (doc.req === 'obrigatorio') {
        await request(app)
          .put(`/api/documentos/${doc.id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'aprovado' });
      }
    }

    const res = await request(app)
      .post(`/api/processos/${proc.body.id}/protocolo`)
      .set('Authorization', `Bearer ${token}`)
      .send({ numero: 'BR512024000002-0', data: '2026-02-02' });

    expect(res.status).toBe(200);
    expect(res.body.protocolo.numero).toBe('BR512024000002-0');
  });
});
