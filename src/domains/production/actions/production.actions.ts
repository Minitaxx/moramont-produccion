'use server'

export async function placeholder(): Promise<{ ok: true } | { error: string }> {
  return { ok: true }
}
