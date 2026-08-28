'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// listQuotes
// ─────────────────────────────────────────────────────────────────────────────

export async function listQuotes() {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    })
    // Convertir Decimal a number antes de devolver (serialización a Client Components)
    const data = quotes.map((q) => ({
      ...q,
      total: Number(q.total),
    }))
    return { ok: true as const, data }
  } catch (e) {
    console.error('[listQuotes]', e)
    return { error: 'Error al obtener las cotizaciones' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getQuoteById
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuoteById(id: string) {
  try {
    if (!id) return { error: 'El id de la cotización es requerido' }
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { customer: true, workOrders: true },
    })
    if (!quote) return { error: 'Cotización no encontrada' }
    return { ok: true as const, data: { ...quote, total: Number(quote.total) } }
  } catch (e) {
    console.error('[getQuoteById]', e)
    return { error: 'Error al obtener la cotización' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createQuote
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateQuoteInput {
  code: string
  customerId: string
  total: number
  validUntil?: Date | null
  notes?: string | null
}

export async function createQuote(input: CreateQuoteInput) {
  try {
    const code = input.code?.trim()
    if (!code) return { error: 'El código de la cotización es requerido.' }
    if (!input.customerId) return { error: 'El cliente es requerido.' }
    if (input.total == null || Number.isNaN(input.total) || input.total < 0) {
      return { error: 'El total debe ser un número mayor o igual a 0.' }
    }

    const quote = await prisma.quote.create({
      data: {
        code,
        customerId: input.customerId,
        total: input.total,
        validUntil: input.validUntil ?? null,
        notes: input.notes?.trim() || null,
      },
    })
    return { ok: true as const, data: { ...quote, total: Number(quote.total) } }
  } catch (e) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { error: 'Ya existe una cotización con ese código.' }
    }
    console.error('[createQuote]', e)
    return { error: 'Error al crear la cotización' }
  }
}