# Estado actual — Módulo de Producción

## Roles del equipo (LEER ESTO PRIMERO)

Este proyecto se desarrolla con un equipo de 3 roles fijos. Ninguno se superpone con otro.

| Rol | Quién es | Función |
|-----|----------|---------|
| **Kimi** | Asistente de IA en kimi.ai | Arquitecto y revisor. Diseña planes, detecta errores, aprueba o rechaza. **NO tiene acceso al código.** |
| **Ejecutor** | GitHub Copilot en VS Code / Cline | Lee/escribe código, corre comandos, hace commits. **NO aprueba planes.** |
| **Usuario** | Persona humana (vos) | Puente entre Kimi y el Ejecutor. Pega prompts y resultados entre ambos. **NO aprueba planes técnicos.** |

### Flujo obligatorio

1. Kimi diseña el prompt → Usuario lo pega en el Ejecutor.
2. Ejecutor muestra el plan → Usuario lo pega en Kimi.
3. Kimi revisa y dice **"APROBADO"** o pide correcciones.
4. Si Kimi aprueba, indica qué botón presionar.
5. Ejecutor ejecuta. Diffs se aprueban uno por uno manualmente.
6. Resultado de cada paso se pega en Kimi para verificación.
7. Commit + push al final de cada bloque.

**Regla de oro:** El Ejecutor NUNCA escribe código sin mostrar el plan primero y esperar el "APROBADO" de Kimi (transmitido por el Usuario).

---

## Próxima sesión (pendiente de commit): 2026-08-27

> Los cambios de este bloque **aún no están commiteados**. Al terminar, hacer `git add` archivo por archivo (NUNCA `git add .`) y commit + push.

### Cambios aplicados en working tree (aún sin commit)

1. **Drag & drop** en `WorkOrderForm.tsx` (`/produccion/ordenes/nueva`):
   - Agregadas deps `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
   - Nuevo componente `SortableTaskCard` (usa `useSortable`, borrador con `DndContext` + `SortableContext`, `handleDragEnd` con `arrayMove` + `resequence`).
   - Se mantienen los botones ⬆️/⬇️ y la eliminación inline de 2 pasos.
2. **Seed de productos**: nueva función `seedProducts(prisma)` en `prisma/seed.ts` que crea 3 productos de ejemplo (`PANEL-CTRL-01`, `CARCASA-SRV-01`, `SOPORTE-MNT-01`) con sus procesos (`ManufacturingProcess`), máquinas y materiales (`ProcessMaterial`). Usa `upsert`/skip si el producto ya existe. Llamada entre `seedBase()` y `seedOperators()`.
3. **Catálogo de productos**: nuevo `src/app/(app)/produccion/components/CatalogView.tsx` (selector de producto + `ProcessManager`).

### Estado de verificación (2026-08-27)

- `npx tsc --noEmit` → **exit 0** (sin errores de tipos).
- `npm run build` → **exit 0** (compila correcto, todas las rutas generadas). **No hay error de build ni de runtime pendiente.**
- `npx tsx prisma/seed.ts` → corrió OK y guardó datos.
- **Fix aplicado**: `.gitignore` se había degradado a solo `node_modules` (exponía `.env`). Restaurado a `node_modules/`, `.next/`, `.env`, `.env.local`, `*.log`, `*.tsbuildinfo`.

### Archivos borrados en working tree (a confirmar intención)

- `next.config.ts` → queda `next.config.js` en el repo. Confirmar si el borrado es intencional.
- `prisma/migrations/20260820173551_init/migration.sql` + `prisma/migrations/migration_lock.toml` → el flujo de este módulo usa `prisma db push` (no migrate). Confirmar si se eliminan del repo.

---

## Última sesión: 2026-08-25

### Commits de esta sesión (más reciente primero)

- `5d2731f` — feat(produccion): fase 3 formulario de creacion de ordenes con clonado de procesos
- `b839117` — fix(produccion): pausa actualiza estado de tarea y cancel vuelve a pending
- `48ade1b` — refactor(produccion): corrige flujo de tareas del operario en tablet
- `4cc8d7a` — feat(produccion): agrega control de tiempos para ingenieros
- `4a3589e` — fix(produccion): prevalida order duplicado en frontend y muestra errores de eliminacion inline
- `133aa4e` — feat(produccion): agrega validaciones de negocio e indicadores de carga
- `011287f` — fix(produccion): corrige bloqueo de reordenamiento y transacción de órdenes
- `db5ebd8` — feat(produccion): agrega botones subir/bajar para reordenar procesos
- `ef299cc` — feat(produccion): agrega edición de procesos y materiales con validaciones de orden
- `2cd123f` — feat(produccion): rediseña UI alineada a ERP principal y configura Tailwind v4

### Qué se hizo en esta sesión

1. **Refactor de TaskList (tablet)**: `src/app/(app)/produccion/operarios/[operatorId]/TaskList.tsx` reescrito con:
   - Tipado fuerte (cero `any`), optimistic updates con revert en error.
   - Modales inline para PAUSAR (solo motivo, ≥3 chars), FINALIZAR (input opcional "Piezas producidas"), CANCELAR (confirmación explícita).
   - Sin `window.confirm`/`alert()`.
   - Validación en UI de "una sola tarea en curso" (deshabilita INICIAR en el resto).
   - Tareas bloqueadas muestran 🔒 + nombre del proceso que bloquea.
   - Server Actions nunca devuelven fechas al cliente.

2. **Fix de parpadeo REANUDAR→PAUSAR**:
   - Agregado `PAUSED` al enum `TaskStatus` en schema Prisma.
   - `pauseTask` ahora actualiza `WorkOrderTask.status = 'PAUSED'` (solo si no hay otros operarios activos en la misma tarea).
   - `cancelTask` vuelve la tarea a `PENDING` si no quedan registros activos.

3. **Fase 3 — Crear Work Orders** (`/produccion/ordenes/nueva`):
   - Nuevo `product-actions.ts`: `listActiveProducts`, `getProductProcesses`, `listProcessTypes`.
   - Nuevo `nueva/actions.ts`: `createWorkOrder` con validaciones backend, transacción (WorkOrder + WorkOrderTasks + WorkOrderTaskOperators), dependencias automáticas (`requiresTaskId`), primera tarea `PENDING` / resto `BLOCKED`.
   - `page.tsx` reescrito como Server Component.
   - `WorkOrderForm.tsx` (Client Component): selector de producto clona procesos automáticamente, tarjetas editables (cantidad, instrucciones, operarios checkboxes), reordenamiento ⬆️/⬇️ con recálculo de orders, eliminación inline de 2 pasos, "Agregar proceso" genérico, validaciones frontend, barra sticky GUARDAR/CANCELAR.

### Qué quedó pendiente

- [ ] Prevalidar otros campos en frontend (ej: materialId vacío).
- [ ] Mejoras visuales menores: `active:scale-95` en botones de tablet, `animate-pulse` en badge `IN_PROGRESS`.

---

## Decisiones de diseño ya tomadas

1. Secuencia de procesos: fija por producto, pero los tipos de proceso se reutilizan entre productos (modelo ProcessType maestro).
2. Materiales: se usan los mismos del sistema principal (tabla Material existente).
3. Tiempos: varían por producto, tamaño, geometría y material. El campo estimatedMinutes es el tiempo base de referencia.
4. UI: línea gráfica idéntica al ERP principal MORAMONT.
5. Validación de order duplicado: backend + frontend, errores inline en UI.
6. Reordenamiento: recalcula órdenes consecutivos desde 1 automáticamente.
7. Errores: siempre inline, nunca alert() del navegador.
8. Work Orders: una OP clona la secuencia de procesos del producto en tareas concretas.
9. Múltiples operarios por tarea: cada operario tiene su propio `TaskTimeRecord`.
10. Tiempos ocultos en tablet: las Server Actions para operarios nunca devuelven fechas/horas. Solo status y si está bloqueada.
11. Dependencias: una tarea puede requerir que otra esté COMPLETED antes de poder iniciarse.
12. Optimistic updates: la UI cambia inmediatamente; si falla, revierte y muestra error inline.
13. `resumeTask` crea un **nuevo** `TaskTimeRecord` (trazabilidad), no muta el anterior.
14. `cancelTask` nunca borra `startedAt` (preserva trazabilidad).
15. Operarios por tarea: opcionales en creación de Work Orders.

---

## Cómo correr este módulo en desarrollo

1. cp .env.example .env
2. Configurar DATABASE_URL apuntando a PostgreSQL local
3. npm install
4. npx prisma generate
5. npx prisma db push --accept-data-loss
6. npx tsx prisma/seed.ts
7. npm run dev
8. Abrir http://localhost:3000/produccion

---

## Notas técnicas importantes

- Archivos con 'use server' SOLO exportan funciones async.
- Todo campo Decimal de Prisma debe convertirse a number con Number() antes de pasar al cliente.
- Las Server Actions devuelven { ok: true; data? } o { error: string }.
- Tailwind v4 usa @import "tailwindcss" en globals.css.
- El layout anidado (app)/layout.tsx NO debe tener &lt;html&gt; ni &lt;body&gt;.
- PostgreSQL columnas en camelCase — usar comillas dobles en SQL manual.
- Transacciones de reordenamiento: usar órdenes temporales altas primero para evitar violación de @@unique.
- Commits explícitos: `git add -- "archivo"` uno por uno. NUNCA `git add .` ni `git add -A`.
- Migraciones de BD: el usuario las ejecuta en su terminal, NO el Ejecutor (limitación TTY).
- Async params en Next.js 16 — usar `await params` en Server Components.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` instalados y en uso para drag & drop en `WorkOrderForm.tsx` (implementado).