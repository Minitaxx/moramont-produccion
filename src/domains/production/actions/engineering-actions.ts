'use server'

// ─────────────────────────────────────────────────────────────────────────────
// Simulación de datos de Ingeniería/Comercial
// ─────────────────────────────────────────────────────────────────────────────
// TODO: reemplazar por la consulta real al backend de comercial/ingeniería.
// Actualmente devuelve de forma determinística un productCode perteneciente
// al seed (productos cargados) y una cantidad derivada del código de la OP.

const SEED_PRODUCT_CODES = ['PANEL-CTRL-01', 'CARCASA-SRV-01', 'SOPORTE-MNT-01']

export interface OrderEngineeringData {
  productCode: string
  quantity: number
}

export async function getOrderEngineeringData(
  code: string,
): Promise<{ ok: true; data: OrderEngineeringData } | { error: string }> {
  const trimmed = code?.trim()

  if (!trimmed) {
    return { error: 'El código de OP es requerido.' }
  }

  // Derivar de forma estable el número interno del código (ej: OP-2608257 -> 2608257)
  const numericPart = trimmed.match(/\d+$/)?.[0]
  const numeric = numericPart ? parseInt(numericPart, 10) : 0

  // Elegir un producto del seed de forma determinística según el número
  const productCode =
    SEED_PRODUCT_CODES[
      numeric % SEED_PRODUCT_CODES.length
    ]

  // Cantidad derivada del código: rango estable 20..119
  const quantity = numeric > 0 ? 20 + (numeric % 100) : 50

  return {
    ok: true,
    data: { productCode, quantity },
  }
}