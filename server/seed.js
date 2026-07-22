// Popula o banco com uma organização de demonstração, um usuário para cada
// persona do PRD (Épico 14 / seção 2) e os quatro processos de IG de açaí
// já usados no protótipo — agora vivendo de verdade no back-end, com
// arquivos reais para os documentos marcados como aprovados.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { resetDB, readDB, writeDB, uid } from './db.js';
import { etapasTemplate, documentosTemplate } from './utils/checklistTemplate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

resetDB();
const db = readDB();

const PASSWORD = 'acai123';

const org = { id: uid('org'), nome: 'Coopaçaí — Rede de Produtores de Açaí do Pará', createdAt: new Date().toISOString() };
db.orgs.push(org);

const PERSONAS = [
  { role: 'admin', nome: 'Marcos Ferreira', email: 'admin@trilha.coop' },
  { role: 'consultor', nome: 'Beatriz Lima', email: 'consultor@trilha.coop' },
  { role: 'representante', nome: 'Raimundo Nonato (Coopaçaí)', email: 'representante@trilha.coop' },
  { role: 'produtor', nome: 'Iracema dos Santos', email: 'produtor@trilha.coop' },
  { role: 'parceiro_tecnico', nome: 'Dr. Felipe Cardoso (EMBRAPA)', email: 'parceiro@trilha.coop' },
  { role: 'leitor', nome: 'Auditoria Externa', email: 'leitor@trilha.coop' },
];

const users = {};
for (const p of PERSONAS) {
  const user = {
    id: uid('user'),
    orgId: org.id,
    nome: p.nome,
    email: p.email,
    passwordHash: bcrypt.hashSync(PASSWORD, 10),
    role: p.role,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  users[p.role] = user;
}

function placeholderFile(id, titulo) {
  const filename = `${id}.txt`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(
    filePath,
    `Documento de demonstração\n\n${titulo}\n\nEste arquivo foi gerado automaticamente pelo seed do Trilha ` +
      `para simular um documento já aprovado. Em uso real, aqui estaria o PDF/JPG enviado pelo produtor.\n`
  );
  return { filename, mimeType: 'text/plain', tamanho: fs.statSync(filePath).size };
}

function criarProcesso({ nome, tipo, entidade, territorio, statusPorIndice, protocolo }) {
  const processo = {
    id: uid('proc'),
    orgId: org.id,
    nome,
    tipo,
    entidade,
    territorio,
    uf: 'PA',
    protocolo: protocolo || null,
    createdBy: users.consultor.id,
    createdAt: new Date().toISOString(),
  };
  db.processos.push(processo);

  const etapaIdByOrdem = {};
  for (const et of etapasTemplate(tipo)) {
    const etapa = { id: uid('etapa'), processoId: processo.id, ...et };
    db.etapas.push(etapa);
    etapaIdByOrdem[et.ordem] = etapa.id;
  }

  documentosTemplate(tipo).forEach((docTpl, i) => {
    const status = statusPorIndice[i] || 'pendente';
    const doc = {
      id: uid('doc'),
      processoId: processo.id,
      etapaId: etapaIdByOrdem[docTpl.etapaOrdem],
      categoria: docTpl.categoria,
      nome: docTpl.nome,
      req: docTpl.req,
      status,
      comentario: status === 'correcao' ? 'Faltou detalhar a metodologia de coleta das amostras — reenviar com anexo técnico.' : null,
      responsavelId: users.produtor.id,
      updatedAt: new Date().toISOString(),
    };
    db.documentos.push(doc);

    if (status === 'aprovado' || status === 'em_analise') {
      const { filename, mimeType, tamanho } = placeholderFile(uid('f'), `${docTpl.nome} — ${nome}`);
      db.versoes.push({
        id: uid('versao'),
        documentoId: doc.id,
        filename,
        nomeOriginal: `${docTpl.nome}.txt`,
        mimeType,
        tamanho,
        vigente: true,
        enviadoPor: users.representante.id,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return processo;
}

criarProcesso({
  nome: 'Açaí do Baixo Tocantins',
  tipo: 'DO',
  entidade: 'Coopaçaí — Cooperativa de Produtores de Açaí',
  territorio: 'Igarapé-Miri, Cametá e Mocajuba, PA',
  statusPorIndice: [
    'aprovado', 'aprovado', 'aprovado', 'aprovado', 'em_analise', 'aprovado', 'nao_aplicavel',
    'em_analise', 'pendente', 'aprovado', 'pendente',
    'aprovado', 'aprovado', 'em_analise',
    'correcao', 'em_analise', 'pendente', 'pendente',
    'aprovado', 'aprovado', 'pendente',
    'pendente',
    'pendente', 'em_analise',
  ],
});

criarProcesso({
  nome: 'Açaí de Abaetetuba',
  tipo: 'IP',
  entidade: 'Associação dos Extrativistas de Açaí de Abaetetuba',
  territorio: 'Abaetetuba, PA',
  statusPorIndice: [
    'aprovado', 'aprovado', 'aprovado', 'aprovado', 'aprovado', 'aprovado', 'nao_aplicavel',
    'aprovado', 'aprovado', 'aprovado', 'pendente',
    'aprovado', 'aprovado', 'aprovado',
    'aprovado', 'aprovado', 'em_analise', 'pendente',
    'aprovado', 'aprovado', 'pendente',
    'pendente',
    'aprovado', 'aprovado',
  ],
});

criarProcesso({
  nome: 'Açaí de Cametá',
  tipo: 'A_DEFINIR',
  entidade: 'Sindicato dos Trabalhadores Rurais de Cametá',
  territorio: 'Cametá, PA',
  statusPorIndice: [
    'pendente', 'aprovado', 'aprovado', 'em_analise', 'pendente', 'aprovado', 'nao_aplicavel',
    'pendente', 'pendente', 'pendente', 'pendente',
    'aprovado', 'pendente', 'pendente',
    'pendente', 'pendente', 'pendente', 'pendente',
    'pendente', 'pendente', 'pendente',
    'pendente',
    'pendente', 'pendente',
  ],
});

criarProcesso({
  nome: 'Açaí do Marajó',
  tipo: 'DO',
  entidade: 'Cooperativa de Produtores de Ponta de Pedras',
  territorio: 'Ponta de Pedras e Muaná, Marajó, PA',
  protocolo: { numero: 'BR512024001987-3', data: '2026-03-18' },
  statusPorIndice: [
    'aprovado', 'aprovado', 'aprovado', 'aprovado', 'aprovado', 'aprovado', 'nao_aplicavel',
    'aprovado', 'aprovado', 'aprovado', 'aprovado',
    'aprovado', 'aprovado', 'aprovado',
    'aprovado', 'aprovado', 'aprovado', 'aprovado',
    'aprovado', 'aprovado', 'aprovado',
    'pendente',
    'aprovado', 'aprovado',
  ],
});

writeDB(db);

console.log('Seed concluído.\n');
console.log(`Organização: ${org.nome}\n`);
console.log('Usuários de demonstração (senha para todos: acai123):');
for (const p of PERSONAS) {
  console.log(`  [${p.role.padEnd(17)}] ${p.email}`);
}
