# Changelog

Registro de versiones — ColombIA Datos (Equipo 194).

## [0.2.0] - 2026-07-11

### Added
- Código actualizado del portal: logo (`public/logo_colombia_datos.svg`), favicon, branding ColombIA Datos.
- Endpoint `/api/chat` (reemplaza `/api/gemini`).
- Motor heurístico offline en `server.ts` para análisis de contexto sin cuota Gemini.
- Documento `docs/despliegue_local.md` con guía de instalación completa.

### Changed
- Título del portal: **Portal de Inteligencia Pública**.
- Enfoque de veeduría ciudadana en documentación.
- `firebase-applet-config.json` → `firebase-config.json`.
- Documentación alineada con estructura actual de `src/` (`public/`, API, panel admin).
- Mensajes de error de cuota Gemini apuntan a `.env` local.
- `src/README.md` simplificado con enlaces a docs centrales.

### Removed
- Referencias a plataformas externas de prototipado en código y documentación.

## [0.1.0] - 2026-07-11

### Added
- Estructura inicial Intermedio IA.
- Aplicación web full-stack en `src/`.
- Capa analítica Python en `ml/`, notebooks, tests, pipelines.
