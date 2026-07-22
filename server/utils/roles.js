// Perfis mínimos do PRD (Épico 14 — História 14.2), com as permissões
// que cada um tem neste back-end de demonstração.

export const ROLES = ['admin', 'consultor', 'representante', 'produtor', 'parceiro_tecnico', 'leitor'];

export const ROLE_LABEL = {
  admin: 'Administrador',
  consultor: 'Consultor de IG',
  representante: 'Representante da Entidade',
  produtor: 'Produtor / Prestador',
  parceiro_tecnico: 'Parceiro Técnico',
  leitor: 'Leitor / Auditor',
};

// Quem pode criar processos e editar dados gerais.
export const CAN_MANAGE_PROCESSO = ['admin', 'consultor', 'representante'];

// Quem pode enviar (upload) documentos.
export const CAN_UPLOAD = ['admin', 'consultor', 'representante', 'produtor', 'parceiro_tecnico'];

// Quem pode aprovar, rejeitar ou marcar documentos como não aplicável.
export const CAN_VALIDATE = ['admin', 'consultor'];

// Quem pode gerenciar usuários da organização.
export const CAN_MANAGE_USERS = ['admin'];
