# 🫐 Trilha: Gestão de Indicação Geográfica do Açaí Paraense

**Trilha** é um SaaS full-stack (React + Node/Express) que organiza, do início ao
protocolo, a documentação de pedidos de **Indicação Geográfica (IG)** de
cooperativas e produtores de açaí do Pará junto ao **INPI**.

## Para que serve

Registrar uma Indicação Geográfica no INPI exige montar um dossiê extenso e
cheio de exigências formais: estatuto, atos constitutivos, Caderno de
Especificações Técnicas, delimitação geográfica, provas de reputação, GRU
paga, entre outros. Na prática, esse material fica espalhado em e-mails,
pastas e versões soltas, e um único documento faltando trava o protocolo.

A Trilha resolve isso transformando o pedido em uma **esteira documental
guiada**: cada etapa do processo lista exatamente os documentos exigidos, quem
pode enviá-los, quem valida, e o que ainda bloqueia o protocolo, tudo com
upload real, controle de versões e permissões por perfil.

## Objetivo

- **Dar visibilidade total do andamento**: um painel e uma esteira mostram, a
  qualquer momento, o quanto do pedido está pronto e o que falta.
- **Garantir conformidade antes do envio**: a conferência pré-protocolo só
  libera o registro quando todos os documentos obrigatórios estão aprovados.
- **Reduzir retrabalho**: versionamento automático (a versão anterior nunca é
  apagada) e justificativa obrigatória ao pedir correção.
- **Separar responsabilidades com segurança**: cada persona (consultor,
  representante, produtor, parceiro técnico, auditor) vê e faz apenas o que
  lhe cabe, validado no servidor, não só escondido na tela.
- **Entregar o pacote final pronto**: gera o **checklist em PDF** e um
  **dossiê completo em PDF único** (checklist + todos os documentos) pronto
  para anexar no e-IG.

---

## 🚀 Instalação e execução com Docker (recomendado)

Esta é a forma mais simples de rodar o sistema completo: um único comando sobe
o front-end e o back-end já conectados entre si, sem precisar instalar Node,
configurar variáveis de ambiente uma por uma ou lidar com portas manualmente.

### 1. Pré-requisitos

Você precisa apenas do **Docker Desktop** instalado e em execução:

- **Windows**: [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/), com o backend WSL2 habilitado (é a opção padrão na instalação).
- **Mac**: [Docker Desktop para Mac](https://www.docker.com/products/docker-desktop/).
- **Linux**: `docker` + o plugin `docker compose` (via gerenciador de pacotes da distribuição, ou Docker Desktop para Linux).

Para confirmar que está tudo certo, abra um terminal e rode:

```bash
docker --version
docker compose version
```

Se os dois comandos responderem com um número de versão, você está pronto.
Se algum deles falhar, revise a instalação do Docker antes de continuar.

**Importante (Windows)**: o Docker Desktop precisa estar **aberto e com o
status "Engine running"** na bandeja do sistema antes de rodar qualquer
comando `docker`. Se ele acabou de ser instalado ou reiniciado, aguarde a
janela do Docker Desktop indicar que o motor terminou de subir; isso pode
levar de alguns segundos a um ou dois minutos.

### 2. Clonar o repositório

```bash
git clone https://github.com/august0RoMa/trilha_acai.git
cd trilha-acai 
```

### 3. Subir o sistema completo

Com o Docker Desktop aberto e rodando, execute na raiz do projeto:

```bash
docker compose up --build
```

Esse comando faz tudo sozinho:

1. Constrói a imagem do **back-end** (API Express), instalando as dependências
   Node dentro do container.
2. Constrói a imagem do **front-end**, compilando o React/Vite em modo de
   produção e servindo o resultado com nginx.
3. Sobe os dois containers já conectados: o nginx do front-end encaminha as
   chamadas `/api` para o back-end automaticamente.
4. Na **primeira** execução, o back-end detecta que o banco está vazio e
   popula automaticamente os dados de demonstração (uma organização, 6
   personas e 4 processos de IG de açaí, com arquivos reais para os
   documentos já aprovados).

Quando o terminal parar de mostrar novas linhas de log e aparecer algo como
`Trilha API rodando em http://localhost:4000`, o sistema está pronto:

| Serviço   | URL                               | Descrição                       |
|-----------|------------------------------------|----------------------------------|
| Front-end | http://localhost:8080             | Aplicação web (nginx + React)    |
| API       | http://localhost:4000/api/health   | Back-end Express (health check)  |

Abra `http://localhost:8080` no navegador e use uma das
[personas de demonstração](#-personas-de-demonstração) para entrar.

Os dados ficam salvos em volumes Docker (`trilha-data` e `trilha-uploads`), ou
seja, **persistem** entre reinícios. Você pode parar e voltar a subir o
sistema quantas vezes quiser sem perder nada.

### 4. Comandos do dia a dia

```bash
docker compose up -d --build     # sobe em segundo plano (libera o terminal)
docker compose logs -f           # acompanha os logs em tempo real
docker compose ps                # lista os containers e o status de cada um
docker compose down              # para os containers, mantém os dados
docker compose down -v           # para os containers e APAGA os dados (reseta a demo)
```

Para trocar o segredo do JWT em produção, defina a variável de ambiente antes
de subir:

```bash
JWT_SECRET="um-segredo-bem-grande" docker compose up --build
```

### 5. Solução de problemas

**Erro: `unable to get image ... open //./pipe/dockerDesktopLinuxEngine: The
system cannot find the file specified.`**

Esse erro significa que o Docker Desktop não está rodando (o motor/engine
está desligado), então o comando `docker` não consegue se conectar a ele.
Para resolver:

1. Abra o **Docker Desktop** manualmente (menu Iniciar, no Windows).
2. Aguarde até o ícone na bandeja do sistema (perto do relógio) mostrar que o
   Docker está em execução, geralmente a janela do app exibe "Engine running".
3. Rode `docker compose up --build` novamente.

Se o Docker Desktop não abrir ou travar em "Starting...", tente:

```bash
wsl --shutdown
```

e abra o Docker Desktop de novo em seguida. Isso reinicia o backend WSL2 do
zero e resolve a maioria dos travamentos no Windows.

**Porta já em uso (8080 ou 4000)**: se você já tiver algo rodando nessas
portas (por exemplo, o front-end em modo de desenvolvimento, veja a seção
abaixo), pare esse processo antes de subir os containers, ou edite as portas
mapeadas em `docker-compose.yml`.

### Como funciona a orquestração

O front-end é compilado pelo Vite e servido pelo **nginx**, que também faz
*reverse proxy* de `/api` para o container do back-end. Por isso o front
sempre chama a própria origem (`/api`), sem depender de CORS ou de
`localhost` embutido no código, e a stack funciona do mesmo jeito em
`localhost`, na rede local ou em um servidor de verdade.

```
navegador ──▶ nginx (frontend:80) ──┬─▶ arquivos estáticos (React)
                                     └─▶ /api/* ──▶ backend:4000 (Express)
```

---

## 🧑‍💻 Rodando em modo de desenvolvimento (sem Docker)

Use este caminho se você quiser editar o código e ver as mudanças
refletidas na hora (hot reload), em vez de recompilar a imagem Docker a cada
alteração. Você precisa apenas do **Node.js 20 ou superior** instalado.

Abra dois terminais.

**Terminal 1, back-end**
```bash
cd server
npm install
cp .env.example .env
npm run seed     # cria a organização de demo + 4 processos + 6 personas
npm run dev      # http://localhost:4000
```

**Terminal 2, front-end**
```bash
npm install
cp .env.example .env    # já aponta para http://localhost:4000/api
npm run dev              # http://localhost:5173
```

Abra `http://localhost:5173` no navegador.

---

## 🔑 Personas de demonstração

A tela de login tem um atalho de um clique para cada persona (senha
`acai123` para todas):

| Persona | E-mail | O que pode fazer |
|---|---|---|
| Administrador | admin@trilha.coop | Tudo, inclusive gerenciar usuários |
| Consultor de IG | consultor@trilha.coop | Validar documentos (aprovar/pedir correção), criar processos |
| Representante da Entidade | representante@trilha.coop | Criar processos, enviar documentos |
| Produtor / Prestador | produtor@trilha.coop | Enviar seus próprios documentos |
| Parceiro Técnico | parceiro@trilha.coop | Enviar laudos e estudos técnicos |
| Leitor / Auditor | leitor@trilha.coop | Só visualizar, nada de editar |

---

## ✅ Testes

```bash
# back-end, 14 testes (Supertest): auth, permissões, upload real, gate de protocolo
cd server && npm test

# front-end, 24 testes (Vitest + Testing Library): fluxos de UI mockando a API
npm test
```

---

## 🏗️ Arquitetura

```
.
├── docker-compose.yml       # orquestra front + back (um comando)
├── Dockerfile                # front-end: build Vite + nginx (proxy /api)
├── nginx.conf                # serve o dist e encaminha /api ao back-end
│
├── src/                      # front-end (React + Vite)
│   ├── api.js                # cliente HTTP (fetch) para a API
│   ├── roles.js               # matriz de permissões (esconde/mostra UI)
│   ├── context/AuthContext.jsx  # sessão (token em localStorage)
│   ├── App.jsx                 # estado da aplicação e roteamento de telas
│   └── components/             # Login, Sidebar, Dashboard, Esteira, DocCard,
│                                #   Conferencia, Guia, Gru, Faq, Usuarios, ...
│
└── server/                   # API REST (Node + Express)
    ├── Dockerfile             # back-end
    ├── docker-start.js        # seed na 1ª subida + inicia a API
    ├── app.js                 # montagem do Express (exportado para os testes)
    ├── index.js                # ponto de entrada (sobe a porta)
    ├── db.js                   # armazenamento em arquivo JSON (ver nota abaixo)
    ├── seed.js                  # dados de demonstração
    ├── middleware/auth.js       # verificação de JWT + guarda de perfil
    ├── routes/                  # auth, users, processos (+ PDF), documentos (upload)
    └── utils/                   # checklistTemplate, roles, checklistPdf, dossiePdf
```

### Sobre o banco de dados

O back-end usa um **arquivo JSON** (`server/data/db.json`) como
armazenamento: síncrono e fácil de inspecionar, ótimo para a demonstração,
mas não recomendado para produção. Todas as rotas falam apenas com as
funções de `db.js` (`readDB`/`writeDB`), então trocar por Postgres é uma
questão de reescrever esse módulo, sem tocar nas rotas.

### O que é real

- **Upload de arquivo de verdade**: PDF/JPG/PNG vão para `server/uploads/`,
  com validação de tipo e tamanho (15 MB); cada envio novo vira uma versão, e
  a anterior fica arquivada, nunca é apagada.
- **Autenticação e permissões reais**: cada ação passa por JWT e por checagem
  de perfil no servidor; um `curl` direto na API respeita as mesmas regras.
- **Multi-tenant**: cada organização (`POST /api/auth/register`) só vê os
  próprios processos e usuários.
- **Geração de PDF real**: checklist estilizado em PDF e dossiê completo em um
  PDF único (checklist na capa e cada documento mesclado/convertido), via
  `pdfkit` e `pdf-lib`.
- **Regras de negócio**: só documento obrigatório aprovado conta para o
  progresso; correção exige justificativa; obrigatório não vira "não
  aplicável"; protocolo só é registrável com todos os obrigatórios aprovados.

### O que ainda é simulado

- Sem envio de e-mail (convites de usuário, notificações de pendência).
- Sem antivírus/varredura de upload (recomendação de produção).

---

## 📦 Stack

- **Front-end:** React 18, Vite, CSS puro (tema açaí, tipografia Fraunces + IBM Plex)
- **Back-end:** Node.js, Express, JWT (jsonwebtoken), bcryptjs, multer, pdfkit, pdf-lib
- **Infra:** Docker, Docker Compose, nginx

---

