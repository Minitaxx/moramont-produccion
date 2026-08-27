# Estado actual — Módulo de Producción (ERP Moramount)

## Última sesión: 2026-08-27

### Commits de esta sesión (más reciente primero)
- `097bc30` — feat(produccion): detalle de orden por OP y autorrelleno desde datos de ingenieria
- `8c8e483e` — feat(produccion): mejora drag and drop con handle exclusivo (GripVertical) y reglas de IA
- `857fecf4` — feat(produccion): drag and drop de tareas, seed de productos y categoria

### Qué se hizo en esta sesión

1. **Corrección de Ruta y Vista de Detalle (`[id]`)**:
   - Creación de la página dinámica `src/app/(app)/produccion/ordenes/[id]/page.tsx` para solucionar definitivamente el error 404 al hacer clic en "Ver" en el listado de órdenes.
   - Server Component asíncrono utilizando `await params` (patrón Next 16) que invoca `getWorkOrderByCode(id)` filtrando por código de OP.
   - Renderizado limpio de la información general de la orden, estado, badges reutilizados y listado de tareas ordenadas por dependencia y operarios asignados (ocultando los tiempos internos de tablet).

2. **Simulación y Autorrelleno de Ingeniería/Comercial (`engineering-actions.ts`)**:
   - Creación de la Server Action `getOrderEngineeringData(code)` que actúa como simulación determinística para mapear códigos de OP (ej. `OP-2608257`) hacia un producto válido del seed y una cantidad estimada.

3. **Mejora del Formulario de Órdenes (`WorkOrderForm.tsx`)**:
   - Refactorización de `handleProductChange` para aceptar cantidad explícita (`explicitQty`), evitando problemas de estado asíncrono.
   - Implementación del evento `onBlur` en el input de *Código OP* que consulta automáticamente la acción de ingeniería, autocompleta el producto y la cantidad, y dispara el clonado instantáneo de tareas.
   - Indicador visual *"Buscando OP..."* y bloqueo del botón **GUARDAR** mientras se procesa la consulta.

4. **Control de Versiones**:
   - Commits y sincronización completados exitosamente en la rama `main` mediante la terminal integrada de VS Code.

### Qué quedó pendiente

- Conectar el backend real de comercial e ingeniería cuando se implementen dichos módulos previos.
- Prevalidación adicional de campos vacíos en formularios (ej. materialId).
- Mejoras visuales menores en tablet (`active:scale-95`, etc.).

## Decisiones de diseño tomadas

1. Secuencia de procesos fija por producto reutilizando tipos de procesos maestros.
2. Autorrelleno por OP para evitar errores manuales y agilizar la creación de órdenes de trabajo en planta.
3. El botón "Ver" de las órdenes utiliza directamente el código de OP (`code`) como segmento dinámico de la URL.
4. Las Server Actions de operarios en tablet nunca exponen fechas ni marcas de tiempo individuales.
5. Manejo de errores siempre en línea, prohibiendo el uso de `alert()` nativos del navegador.

## Cómo correr este proyecto en desarrollo

1. `cp .env.example .env`
2. Configurar `DATABASE_URL` apuntando a PostgreSQL local
3. `npm install`
4. `npx prisma generate`
5. `npx prisma db push --accept-data-loss`
6. `npx tsx prisma/seed.ts`
7. `npm run dev`
8. Abrir `http://localhost:3000/produccion`