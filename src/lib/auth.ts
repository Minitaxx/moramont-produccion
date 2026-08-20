export async function requireSession(): Promise<{ userId: string; email: string } | { error: string }> {
  return { userId: 'dev-user-001', email: 'dev@moramont.test' }
}
