# Estado actual — Módulo de Producción

## Última sesión: 2026-08-27

### Commits de esta sesión (más reciente primero)

- `bcc81b4` — feat(produccion): mejora drag and drop con handle exclusivo (GripVertical) y agrega reglas de IA
- `857fecf4` — feat(produccion): drag and drop de tareas, seed de productos y categoria
- `5d2731f` — feat(produccion): fase 3 formulario de creacion de ordenes con clonado de procesos
- `b839117` — fix(produccion): pausa actualiza estado de tarea y cancel vuelve a pending
- `48ade1b` — refactor(produccion): corrige flujo de tareas del operario en tablet
- `4cc8d7a` — feat(produccion): agrega control de tiempos para ingenieros

### Qué se hizo en esta sesión

1. **Estandarización del Método de Trabajo**:
   - Creación de `GEMINI.md` en la raíz como fuente de verdad de roles y flujo, estandarizando las reglas de IA.
2. **Fase 3 — Formulario de Órdenes (Drag & Drop y Catálogo)**:
   - Implementación de reordenamiento drag & drop con `@dnd-kit` en `WorkOrderForm.tsx`.
   - Fix de UX y bug de recarga: Handle exclusivo con `<GripVertical />` (`lucide-react`), prevención de submit de formulario asignando `type="button"` a todos los botones, y estilos `touch-none cursor-grab`.
   - Nuevo componente `CatalogView` con selector visual de productos y `ProcessManager`.
3. **Datos de prueba (Seed)**:
   - Nuevo seed para productos `seedProducts(prisma)` que carga 3 productos reales (PANEL-CTRL-01, etc.) con sus secuencias de procesos, materiales y máquinas.
4. **Seguridad y Repositorio**:
   - Restauración del `.gitignore` para blindar credenciales (`.env`).
   - Restauración de historial de migraciones (`prisma/migrations/`) y limpieza del working tree.

### Qué quedó pendiente

- Validar visualmente el drag & drop con el nuevo ícono GripVertical.
- Prevalidar campos adicionales en frontend (ej: materialId vacío al agregar).
- Mejoras visuales menores en tablet: `active:scale-95` en botones, `animate-pulse` en badge `IN_PROGRESS`.

## Decisiones de diseño ya tomadas

1. Secuencia de procesos: fija por producto, pero los tipos de proceso se reutilizan entre productos (modelo ProcessType maestro).
2. Materiales: se usan los mismos del sistema principal (tabla Material existente).
3. Tiempos: varían por producto, tamaño, geometría y material. El campo estimatedMinutes es el tiempo base de referencia.
4. UI: línea gráfica idéntica al ERP principal MORAMONT.
5. Validación de order duplicado: backend + frontend, errores inline en UI.
6. Reordenamiento: drag & drop con recálculo automático de órdenes consecutivos desde 1.
7. Errores: siempre inline, nunca alert() del navegador.
8. Work Orders: una OP clona la secuencia de procesos del producto en tareas concretas.
9. Tiempos ocultos en tablet: las Server Actions para operarios nunca devuelven fechas/horas.
10. Optimistic updates: la UI cambia inmediatamente; si falla, revierte y muestra error inline.
11. `resumeTask` crea un nuevo `TaskTimeRecord` (trazabilidad).
12. `cancelTask` nunca borra `startedAt`.

## Cómo correr este módulo en desarrollo

1. cp .env.example .env
2. Configurar DATABASE_URL apuntando a PostgreSQL local
3. npm install
4. npx prisma generate
5. npx prisma db push --accept-data-loss
6. npx tsx prisma/seed.ts
7. npm run dev
8. Abrir http://localhost:3000/produccion