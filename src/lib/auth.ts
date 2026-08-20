export async function requireSession(): Promise<{ userId: string } | { error: string }> {
  return { userId: 'test-user-001' }
}
