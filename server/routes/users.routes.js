import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { readDB, writeDB, uid } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES, ROLE_LABEL, CAN_MANAGE_USERS } from '../utils/roles.js';

const router = Router();

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return { ...rest, roleLabel: ROLE_LABEL[user.role] };
}

router.use(requireAuth);

router.get('/', (req, res) => {
  const db = readDB();
  const users = db.users.filter((u) => u.orgId === req.user.orgId).map(publicUser);
  res.json(users);
});

router.get('/roles', (req, res) => {
  res.json(ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] })));
});

router.post('/', requireRole(...CAN_MANAGE_USERS), (req, res) => {
  const { nome, email, password, role } = req.body || {};
  if (!nome || !email || !password || !role) {
    return res.status(400).json({ error: 'Preencha nome, e-mail, senha e perfil.' });
  }
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Perfil inválido.' });

  const db = readDB();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
  }
  const user = {
    id: uid('user'),
    orgId: req.user.orgId,
    nome,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  res.status(201).json(publicUser(user));
});

router.delete('/:id', requireRole(...CAN_MANAGE_USERS), (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.params.id && u.orgId === req.user.orgId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });
  db.users = db.users.filter((u) => u.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

export default router;
