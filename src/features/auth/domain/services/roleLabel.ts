import type { User } from '../models'

const ROLE_LABELS: Record<User['role'], string> = {
  super_admin: 'Administrador general',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  cobrador: 'Cobrador'
}

/** Nombre del rol para mostrar en la interfaz. */
export const roleLabel = (role: User['role']): string => ROLE_LABELS[role] ?? role
