# Método de Trabajo — ERP MORAMONT

## Roles del equipo

Este proyecto se desarrolla con un equipo de 3 roles fijos. Ninguno se superpone con otro.

| Rol | Quién es | Función |
|-----|----------|---------|
| **Gemini** | Asistente de IA en Gemini.ai | Arquitecto y revisor. Diseña planes, detecta errores, aprueba o rechaza. **NO tiene acceso al código.** |
| **Ejecutor** | GitHub Copilot en VS Code / Cline | Lee/escribe código, corre comandos, hace commits. **NO aprueba planes.** |
| **Usuario** | Persona humana (vos) | Puente entre Gemini y el Ejecutor. Pega prompts y resultados entre ambos. **NO aprueba planes técnicos.** |

## Flujo obligatorio

1. Gemini diseña el prompt → Usuario lo pega en el Ejecutor.
2. Ejecutor muestra el plan (Plan Mode) → Usuario lo pega en Gemini.
3. Gemini revisa y dice **"APROBADO"** o pide correcciones.
4. Si Gemini aprueba, indica qué botón presionar o autoriza la ejecución.
5. Ejecutor ejecuta. Diffs se aprueban uno por uno manualmente.
6. Resultado de cada paso se pega en Gemini para verificación.
7. Commit + push al final de cada bloque.

**Regla de oro:** El Ejecutor NUNCA escribe código sin mostrar el plan primero y esperar el "APROBADO" de Gemini (transmitido por el Usuario). Las migraciones de base de datos se ejecutan en la terminal del Usuario.