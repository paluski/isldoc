export const ROLE_LABELS = {
  admin: 'Administrador',
  member: 'Membro',
  verificador: 'Verificador',
  aprovador: 'Aprovador',
  cliente_externo: 'Cliente Externo'
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}
