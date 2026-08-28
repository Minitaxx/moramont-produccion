# Estado actual — Módulo de Producción (ERP Moramount)

## Última sesión: 2026-08-27

### Commits de esta sesión (más reciente primero)
- `ec62fe1d` — feat(produccion): autorrelleno de OP desde cotizaciones reales del modulo comercial
- `dd1dc8d` — feat(comercial): modelos Customer y Quote con relacion a WorkOrder, server actions y paginas CRUD iniciales

### Qué se hizo en esta sesión
5. **Creación del Módulo Comercial**:
   - Implementación de modelos `Customer` y `Quote` en el esquema de Prisma y sincronización.
   - Creación de Server Actions y páginas CRUD para la gestión comercial.
6. **Conexión Comercial - Producción**:
   - Eliminación de la simulación de datos en el formulario de Órdenes de Trabajo.
   - Autorrelleno funcional mediante consulta a la base de datos real.

### Qué quedó pendiente
- Fusionar la rama actual (`feature/modulo-comercial`) hacia `main`.
- Desarrollar el apartado de Ingeniería/Diseño y subida de planos.

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