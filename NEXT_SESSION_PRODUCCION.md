# Estado actual — Módulo de Producción

## Última sesión: 2026-08-20

Qué se hizo:
- Setup inicial del repositorio
- Schema Prisma con modelos de producción
- Stub de autenticación
- Estructura de carpetas base
- Server Actions CRUD completas (productos, tipos de proceso, máquinas, procesos, materiales)
- Componentes UI: ProductSelector y ProcessManager
- Seed script para datos maestros de prueba

Qué quedó pendiente:
- Instalar dependencias (npm install)
- Crear base de datos de desarrollo
- Aplicar db push para crear tablas
- Verificar que compile
- Construir UI funcional
- Server actions CRUD
- Ejecutar seed: npx tsx prisma/seed.ts
- Verificar UI en navegador con datos reales
- Agregar funcionalidad de reordenar procesos (drag & drop o botones)
- Editar procesos y materiales existentes (ahora solo crea/elimina)

Decisiones de diseño ya tomadas:
1. Secuencia de procesos: fija por producto, pero los tipos de proceso se reutilizan entre productos (modelo ProcessType maestro)
2. Materiales: se usan los mismos del sistema principal (tabla Material existente)
3. Tiempos: varían por producto, tamaño, geometría y material. El campo estimatedMinutes es el tiempo base de referencia

Preguntas abiertas:
- Ninguna por el momento

Cómo correr este módulo en desarrollo:
1. cp .env.example .env
2. Configurar DATABASE_URL apuntando a PostgreSQL local
3. npm install
4. npx prisma generate
5. npx prisma db push
6. npm run dev
