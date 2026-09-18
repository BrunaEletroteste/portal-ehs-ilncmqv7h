import pb from '@/lib/pocketbase/client'

export type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
  active?: boolean
}

export async function createInitialAdmin(data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
}) {
  return pb.send<{ message: string }>('/backend/v1/setup/admin', {
    method: 'POST',
    body: data,
  })
}

export async function signIn(email: string, password: string) {
  return pb.collection('users').authWithPassword<AuthUser>(email, password)
}

export function signOut() {
  pb.authStore.clear()
}

export function getCurrentUser(): AuthUser | null {
  if (!pb.authStore.isValid || !pb.authStore.record) return null
  return pb.authStore.record as unknown as AuthUser
}
