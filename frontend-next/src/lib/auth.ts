// SSR-safe auth helpers — always guard with typeof window check

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getRole(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('role')
}

export function getRollNumber(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('roll_number')
}

export function getPermissions(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('permissions') || '[]')
  } catch {
    return []
  }
}

export function setAuth(data: {
  access_token: string
  role: string
  roll_number?: string
  permissions?: string[]
}) {
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('role', data.role)
  if (data.roll_number) localStorage.setItem('roll_number', data.roll_number)
  if (data.permissions) localStorage.setItem('permissions', JSON.stringify(data.permissions))
}

export function clearAuth() {
  localStorage.clear()
}

export const ADMIN_ROLES = ['admin', 'super_admin', 'it_coordinator', 'staff']

export function isAdminRole(role: string | null): boolean {
  return ADMIN_ROLES.includes(role ?? '')
}
