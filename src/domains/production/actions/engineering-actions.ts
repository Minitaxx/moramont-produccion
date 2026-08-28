'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Datos de Ingeniería/Comercial desde Cotizaciones (Quote) reales
// ─────────────────────────────────────────────────────────────────────────────
// Consulta una cotización por código y devuelve los datos necesarios para
// autorrellenar la creación de una orden de trabajo (producto + cantidad).

export interface OrderEngineeringData {
  quoteId: string
  productId: string
  quantity: number
}

export async function getOrderEngineeringData(
  code: string,
): Promise<{ ok: true; data: OrderEngineeringData } | { error: string }> {
  const trimmed = code?.trim()

  if (!trimmed) {
    return { error: 'El código de OP es requerido.' }
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { code: trimmed },
      include: { product: true },
    })

    if (!quote) {
      return { error: `No se encontró una cotización con el código "${trimmed}".` }
    }

    if (!quote.productId || !quote.product) {
      return { error: `La cotización "${trimmed}" no tiene un producto asociado.` }
    }

    if (quote.quantity == null || quote.quantity <= 0) {
      return { error: `La cotización "${trimmed}" no define una cantidad válida.` }
    }

    return {
      ok: true,
      data: {
        quoteId: quote.id,
        productId: quote.productId,
        quantity: quote.quantity,
      },
    }
  } catch (e) {
    console.error('[getOrderEngineeringData]', e)
    return { error: 'Error al consultar la cotización.' }
  }
}