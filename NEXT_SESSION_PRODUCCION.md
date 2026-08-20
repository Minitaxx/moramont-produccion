# Estado actual — Módulo de Producción

## Última sesión: 2026-08-20

Qué se hizo:
- Setup inicial del repositorio (Next.js 16.2.9, React 19.2.4, TS 5, Tailwind v4, Prisma 6.19.3)
- Schema Prisma con modelos: ProcessType, Machine, ManufacturingProcess, ProcessMaterial
- Stub de autenticación (src/lib/auth.ts)
- Base de datos PostgreSQL creada y sincronizada con prisma db push
- Seed ejecutado: 8 ProcessTypes y 12 Machines cargados
- 4 productos de prueba insertados manualmente en product_catalog
- Server Actions CRUD completas: productos (lectura), processTypes, machines, manufacturingProcesses, processMaterials, materials (lectura)
- UI rediseñada alineada con línea gráfica del ERP principal (sidebar oscuro, tablas, badges, tarjetas, tipografía limpia)
- Tailwind v4 configurado con @tailwindcss/postcss y postcss.config.mjs
- Layout de grupo (app) creado con sidebar estilo ERP
- Componentes ProductSelector y ProcessManager funcionales
- Build exitoso sin errores de TypeScript

Qué quedó pendiente:
- Ejecutar seed actualizado para cargar materiales de prueba en la base (prisma/seed.ts ya tiene los 10 materiales, pero no se ejecutó el seed después del rediseño)
- Verificar visualmente en navegador que Tailwind aplica estilos correctamente con el nuevo diseño (build pasó, falta ver en localhost:3000/produccion)
- Probar flujo completo CRUD: crear proceso para un producto, agregar materiales al proceso, eliminar proceso/material
- Hacer commit de los cambios del rediseño (layout, componentes, postcss.config.mjs, package.json con @tailwindcss/postcss)
- Falta funcionalidad de reordenar procesos (botones de subir/bajar o drag & drop)
- Falta editar procesos y materiales existentes (ahora solo crea/elimina)
- Agregar validaciones de negocio (ej: no permitir dos procesos con el mismo order en un producto)

Commits de esta sesión (con hash):
- 04a0059 — setup: inicializa modulo de produccion con schema prisma, stubs y estructura base
- 51216f5 — feat: server actions CRUD, UI base de seleccion de productos y gestion de procesos

## Decisiones de diseño ya tomadas
1. Secuencia de procesos: fija por producto, pero los tipos de proceso se reutilizan entre productos (modelo ProcessType maestro)
2. Materiales: se usan los mismos del sistema principal (tabla Material existente)
3. Tiempos: varían por producto, tamaño, geometría y material. El campo estimatedMinutes es el tiempo base de referencia
4. UI: línea gráfica idéntica al ERP principal MORAMONT (sidebar oscuro bg-neutral-900, contenido bg-gray-50, tarjetas blancas, badges sutiles, tablas limpias)

## Preguntas abiertas / pendientes de definir con el dueño del proyecto
- Ninguna por el momento

## Cómo correr este módulo en desarrollo
1. cp .env.example .env
2. Configurar DATABASE_URL apuntando a PostgreSQL local (usuario: postgres, contraseña: Vegetta777.)
3. npm install
4. npx prisma generate
5. npx prisma db push --accept-data-loss
6. npx tsx prisma/seed.ts
7. npm run dev
8. Abrir http://localhost:3000/produccion

## Notas técnicas importantes
- Archivos con 'use server' SOLO exportan funciones async
- Todo campo Decimal de Prisma debe convertirse a number con Number() antes de pasar al cliente
- Las Server Actions devuelven { ok: true; data? } o { error: string }
- Tailwind v4 usa @import "tailwindcss" en globals.css y requiere @tailwindcss/postcss en postcss.config.mjs
- El layout anidado (app)/layout.tsx NO debe tener <html> ni <body> (ya están en root layout)
- PostgreSQL creó las columnas en camelCase (productType, geometryType, etc.) — usar comillas dobles en SQL manual
