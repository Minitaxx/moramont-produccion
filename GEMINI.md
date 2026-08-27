Método de trabajo — ERP MORAMONT

Roles

Gemini: Arquitecto y revisor. Diseña, analiza planes, detecta errores antes de que se ejecuten y revisa los resultados. NO tiene acceso directo al código del proyecto, salvo el contenido que el usuario le proporcione.

Cline (VS Code): Ejecutor. Lee/escribe código, analiza el proyecto, ejecuta comandos y realiza los cambios indicados por el arquitecto. Trabaja primero en modo Plan y luego en modo de ejecución.

Usuario: Puente entre ambos. Pega los prompts de Gemini en Cline, copia los planes/resultados de Cline y los pega en Gemini para su revisión.

Flujo de trabajo obligatorio

1. Gemini diseña el prompt

Gemini analiza la tarea y genera un prompt exacto para Cline.

El prompt debe contener instrucciones concretas sobre:



Qué debe analizar.

Qué archivos debe revisar.

Qué cambios debe realizar.

Qué restricciones debe respetar.

Qué debe comprobar.

Qué resultado debe entregar.

Los prompts generados por Gemini son para pegar literalmente en Cline.

2. Usuario pega el prompt en Cline

El usuario pega el prompt generado por Gemini en Cline dentro de VS Code.

Cline debe trabajar inicialmente en Plan Mode.

En esta etapa:



Cline analiza el código.

Cline identifica los archivos afectados.

Cline propone los cambios.

Cline NO debe modificar archivos todavía.

3. Cline muestra el plan

Cline debe presentar su plan antes de realizar cualquier modificación.

El usuario copia el plan completo y lo pega en Gemini.

Si Cline intenta modificar archivos sin mostrar primero el plan, el usuario debe detenerlo utilizando:



Detente. Muéstrame el plan antes de escribir o modificar nada.

4. Gemini revisa el plan

Gemini analiza el plan de Cline y verifica:



Arquitectura.

Compatibilidad con el proyecto existente.

Riesgos.

Dependencias.

Base de datos.

Lógica de negocio.

Seguridad.

Posibles efectos secundarios.

Archivos que serán modificados.

Si el enfoque es realmente necesario.

Si existe una solución más sencilla o segura.

Gemini puede responder:

PLAN APROBADO

o solicitar correcciones.

Si existen correcciones, Gemini genera un nuevo prompt exacto para Cline.

El usuario vuelve a pegarlo en Cline.

5. Ejecución del plan

Una vez aprobado el plan, Gemini indica al usuario que puede permitir la ejecución en Cline.

Cline realiza los cambios definidos en el plan aprobado.

El usuario debe revisar los cambios que Cline solicite.

6. Revisión de archivos modificados

Cuando Cline presente diffs o solicite aprobación de archivos, el usuario debe revisar especialmente los archivos de riesgo.



Bajo riesgo

Los archivos de:



Interfaz.

Componentes visuales.

CSS.

Estilos.

Ajustes menores de UI.

pueden aprobarse rápidamente si coinciden con el plan.



Alto riesgo

Los siguientes cambios deben copiarse en Gemini antes de aprobarlos:



prisma

schema.prisma

migrate

migration.sql

delete

DATABASE_URL

Consultas a la base de datos.

Autenticación.

Autorización.

Permisos.

Archivos de lógica de negocio nuevos.

Cambios grandes en validaciones.

Cambios estructurales importantes.

Gemini debe revisar el contenido real del cambio, no solamente el nombre del archivo.

7. Migraciones de base de datos

Las migraciones de base de datos requieren un flujo especial.

El usuario ejecuta las migraciones en su propia terminal.

Cline NO debe ejecutar directamente las migraciones que puedan requerir interacción de TTY.

Antes de ejecutar una migración, el usuario debe pegar en Gemini:



El schema.prisma afectado.

La migración generada.

El comando que Cline propone ejecutar.

El resultado de la ejecución.

Gemini debe revisar el contenido antes de continuar.

8. Verificación del resultado de migraciones

Después de ejecutar una migración, el usuario debe copiar el resultado completo de la terminal y pegarlo en Gemini.

Gemini debe comprobar:



Que la migración terminó correctamente.

Que no existen errores.

Que el esquema coincide con Prisma.

Que las tablas y columnas esperadas existen.

Que no hubo pérdida inesperada de información.

Que el estado de las migraciones es consistente.

Nunca asumir que una migración funcionó solamente porque el comando terminó.

9. Problemas conocidos y soluciones

EPERM en prisma generate

Si aparece un error EPERM, detener los procesos de Node y volver a ejecutar:



Stop-Process -Name node -Force

npx prisma generate

El resultado debe verificarse antes de continuar.

migrate dev falla por TTY

Si migrate dev no puede ejecutarse correctamente debido a las limitaciones de terminal:



No insistir repetidamente con el mismo comando.

Revisar el estado actual de la base de datos.

Evaluar db push --accept-data-loss solamente si el cambio es seguro y está autorizado.

Ejecutar SQL manual cuando sea necesario.

Utilizar migrate resolve --applied únicamente cuando corresponda.

Gemini debe revisar la estrategia antes de ejecutar estos comandos.

Shadow Database falla

Si aparece un error relacionado con Shadow Database:



Revisar la migración.

Verificar los nombres de tablas y columnas.

Comprobar que coincidan con el esquema real de Prisma.

Revisar especialmente el uso de camelCase.

Cuando no exista @map, la migración debe utilizar los nombres de columna que realmente espera Prisma.

No modificar una migración solamente para eliminar el error sin entender primero la causa.

10. Serialización de Decimal

Todo campo Decimal proveniente de Prisma debe convertirse explícitamente a number antes de pasar información a componentes que utilicen:



'use client'

Ejemplo:



const data = {

price: Number(product.price),

}

No pasar directamente objetos Decimal de Prisma a componentes cliente.

11. Verificación funcional

Después de implementar un bloque de cambios:



Cline debe informar qué modificó.

El usuario copia el resultado en Gemini.

Gemini revisa el resultado.

Se ejecutan las pruebas necesarias.

Se verifica la aplicación.

Se realiza una verificación visual en el navegador cuando el cambio afecte la interfaz.

La verificación visual debe comprobar como mínimo:



Diseño.

Responsividad.

Formularios.

Tablas.

Botones.

Mensajes de error.

Estados de carga.

Navegación.

Datos mostrados.

12. Si aparecen errores

Si Cline encuentra un error:



No intentar solucionar el problema de forma improvisada.

Copiar el error completo.

Copiar el contexto relevante.

Pegar el resultado en Gemini.

Gemini analiza la causa.

Gemini genera un prompt exacto para Cline.

Cline propone nuevamente un plan si el cambio es significativo.

Gemini revisa el nuevo plan.

Se ejecuta la corrección.

13. Commit y Push

Cuando un bloque haya sido:



Implementado.

Revisado.

Probado.

Verificado visualmente cuando corresponda.

Validado por Gemini.

se realiza el commit.

La estructura recomendada es:



tipo: descripción breve del cambio

Ejemplos:



feat: agregar módulo de proveedores

fix: corregir cálculo de costos

refactor: reorganizar servicio de inventario

ui: mejorar formulario de productos

Después del commit se realiza el push.

Convenciones de revisión

Archivos de bajo riesgo

Pueden aprobarse rápidamente:



Componentes visuales pequeños.

CSS.

Estilos.

Iconos.

Ajustes menores de interfaz.

Siempre verificando que coincidan con el plan aprobado.



Archivos de alto riesgo

Siempre pasar por Gemini antes de aprobar:



schema.prisma

migration.sql

Archivos dentro de prisma/

Archivos relacionados con migraciones.

Configuración de DATABASE_URL.

Eliminaciones de datos.

Consultas complejas.

Autenticación.

Autorización.

Permisos.

Lógica financiera.

Cálculos de costos.

Inventarios.

Ventas.

Compras.

Archivos nuevos de lógica de negocio.

Cambios grandes en validaciones.

Memoria del proyecto

CLAUDE.md

Si el proyecto utiliza actualmente este archivo, debe evaluarse su renombrado a:



GEMINI.md

Su función será almacenar:



Configuración general.

Stack tecnológico.

Arquitectura.

Convenciones.

Reglas de desarrollo.

Restricciones.

Información que Gemini/Cline necesiten conocer permanentemente.

Si Cline tiene instrucciones propias mediante archivos de configuración, estas deben mantenerse separadas de la documentación arquitectónica.

docs/00_FOUNDATION/NEXT_SESSION.md

Contiene el estado actual del proyecto:



Qué se terminó.

Qué está pendiente.

Qué problemas existen.

Qué se debe hacer a continuación.

Última migración realizada.

Último commit.

Próxima acción recomendada.

Debe actualizarse al finalizar cada sesión importante.

docs/00_FOUNDATION/WORK_METHOD.md

Este archivo contiene el método de trabajo actual entre:

Gemini → Usuario → Cline → Usuario → Gemini

Debe modificarse solamente cuando cambie el proceso de desarrollo.

Regla fundamental

Gemini piensa y revisa.

Cline ejecuta.

El usuario controla el paso de información y las aprobaciones.

Ningún cambio importante debe ejecutarse sin que Gemini haya revisado previamente el plan.

El objetivo es evitar:



Cambios innecesarios.

Errores de arquitectura.

Migraciones incorrectas.

Pérdida de datos.

Regresiones.

Cambios fuera del alcance.

Soluciones improvisadas.

Al iniciar un nuevo chat con Gemini

Pegar el siguiente mensaje:



Continúo el desarrollo del ERP MORAMONT.

El método de trabajo del proyecto es:



Gemini: arquitecto y revisor.

Cline en VS Code: ejecutor.

Usuario: puente entre Gemini y Cline.

Lee docs/00_FOUNDATION/WORK_METHOD.md para entender cómo trabajamos y docs/00_FOUNDATION/NEXT_SESSION.md para conocer el estado actual del proyecto.

Reglas importantes:



Siempre diseña prompts exactos para Cline, no instrucciones generales.

Cline debe trabajar primero en Plan Mode.

Nunca me indiques que ejecute o apruebe un cambio sin haber revisado previamente el plan o el contenido correspondiente.

Los cambios relacionados con Prisma, migraciones, base de datos, eliminaciones, DATABASE_URL, autenticación, permisos o lógica de negocio deben revisarse antes de aprobarse.

Siempre pídeme que te pegue el resultado de las migraciones.

Siempre verifica los resultados de las tareas antes de dar el bloque por terminado.

Los cambios de interfaz deben verificarse visualmente en el navegador.

Al terminar cada bloque funcional, debemos hacer commit y push.

Yo te proporcionaré el contenido de NEXT_SESSION.md y los planes/resultados que Cline genere.

Tu función es actuar como arquitecto, revisor y controlador de calidad, mientras que Cline es el ejecutor dentro de VS Code.

No asumas que un cambio funcionó correctamente solo porque Cline indique que terminó. Revisa la evidencia antes de continuar.  

