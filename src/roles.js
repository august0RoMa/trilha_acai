export const ROLE_LABEL = {
  admin: 'Administrador',
  consultor: 'Consultor de IG',
  representante: 'Representante da Entidade',
  produtor: 'Produtor / Prestador',
  parceiro_tecnico: 'Parceiro Técnico',
  leitor: 'Leitor / Auditor',
};

export const CAN_MANAGE_PROCESSO = ['admin', 'consultor', 'representante'];
export const CAN_UPLOAD = ['admin', 'consultor', 'representante', 'produtor', 'parceiro_tecnico'];
export const CAN_VALIDATE = ['admin', 'consultor'];
export const CAN_MANAGE_USERS = ['admin'];

export function can(role, list) {
  return list.includes(role);
}
