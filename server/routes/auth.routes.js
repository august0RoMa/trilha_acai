import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readDB, writeDB, uid } from '../db.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';
import { ROLE_LABEL } from '../utils/roles.js';

const router = Router();

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return { ...rest, roleLabel: ROLE_LABEL[user.role] };
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

// Cadastro de uma nova organização (tenant) — cria a org e o usuário
// administrador que a representa. É o fluxo de "criar minha conta" de um SaaS.
router.post('/register', (req, res) => {
  const { orgNome, nome, email, password } = req.body || {};
  if (!orgNome || !nome || !email || !password) {
    return res.status(400).json({ error: 'Preencha organização, nome, e-mail e senha.' });
  }
  const db = readDB();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
  }

  const org = { id: uid('org'), nome: orgNome, createdAt: new Date().toISOString() };
  const user = {
    id: uid('user'),
    orgId: org.id,
    nome,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  db.orgs.push(org);
  db.users.push(user);
  writeDB(db);

  res.status(201).json({ token: signToken(user), user: publicUser(user), org });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const org = db.orgs.find((o) => o.id === user.orgId);
  res.json({ token: signToken(user), user: publicUser(user), org });
});

router.get('/me', requireAuth, (req, res) => {
  const db = readDB();
  const org = db.orgs.find((o) => o.id === req.user.orgId);
  res.json({ user: publicUser(req.user), org });
});

export default router;
