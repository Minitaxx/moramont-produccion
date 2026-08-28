'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// listCustomers
// ─────────────────────────────────────────────────────────────────────────────

export async function listCustomers(opts: { activeOnly?: boolean } = {}) {
  try {
    const customers = await prisma.customer.findMany({
      where: opts.activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    })
    return { ok: true as const, data: customers }
  } catch (e) {
    console.error('[listCustomers]', e)
    return { error: 'Error al obtener los clientes' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getCustomerById
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerById(id: string) {
  try {
    if (!id) return { error: 'El id del cliente es requerido' }
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { quotes: true },
    })
    if (!customer) return { error: 'Cliente no encontrado' }
    return { ok: true as const, data: customer }
  } catch (e) {
    console.error('[getCustomerById]', e)
    return { error: 'Error al obtener el cliente' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createCustomer
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string
  email?: string | null
  phone?: string | null
  taxId?: string | null
  address?: string | null
}

export async function createCustomer(input: CreateCustomerInput) {
  try {
    const name = input.name?.trim()
    if (!name) return { error: 'El nombre del cliente es requerido.' }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        taxId: input.taxId?.trim() || null,
        address: input.address?.trim() || null,
      },
    })
    return { ok: true as const, data: customer }
  } catch (e) {
    // Violación de unicidad de email/taxId
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { error: 'Ya existe un cliente con ese email o RUC/DNI.' }
    }
    console.error('[createCustomer]', e)
    return { error: 'Error al crear el cliente' }
  }
}