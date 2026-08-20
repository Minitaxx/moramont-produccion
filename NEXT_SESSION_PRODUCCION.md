# Módulo de Producción — Continuidad de sesión

- Fecha: 2026-08-20
- Estado: inicialización

## Alcance

El módulo registra los procesos de fabricación por producto, los materiales consumidos por proceso y las máquinas asignadas a cada proceso. No administra un catálogo propio de productos: referencia el catálogo existente.

## Decisiones tomadas

1. `ProcessType` es una tabla maestra para normalizar procesos reutilizables entre productos, como corte, ensamble y pintura.
2. Los materiales consumidos se referencian desde el catálogo central mediante el stub `Material` hasta la integración.
3. No se almacenan tiempos estimados, ya que dependen del producto, tamaño, geometría y material.
4. `ProductCatalog` y `Material` son stubs temporales que se reemplazarán al integrar con el sistema principal.

## Cómo correr el módulo

1. Copiar `.env.example` a `.env` y configurar `DATABASE_URL` para PostgreSQL 18.
2. Instalar dependencias con `npm install`.
3. Generar el cliente de Prisma con `npx prisma generate`.
4. Iniciar el entorno de desarrollo con `npm run dev`.

No se han ejecutado migraciones de base de datos.
## Sesion 2026-08-20

Que se hizo:
- Inicializacion completa del repositorio
- Schema Prisma con stubs y modelos de produccion
- Migracion inicial aplicada a PostgreSQL
- Next.js 16.2.9 corriendo en localhost:3000/produccion
- Primer commit realizado

Commits:
- 439bbd3 init: estructura base del modulo de produccion - schema, nextjs, prisma, stubs
