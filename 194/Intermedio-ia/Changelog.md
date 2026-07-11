# Changelog

Registro cronológico de versiones y cambios del proyecto ColombIA Datos (Equipo 194).

## [Unreleased]

### Added
- Integración de documentación con el stack tecnológico del arquitecto.
- Carpeta `ml/` con módulos Python analíticos (separados de la app web en `src/`).
- Documentos nuevos: `stack_tecnologico.md`, `aplicacion_web.md`, `variables_entorno.md`, `seguridad.md`.
- Recreación de `data/` (01_raw → 04_model_output).
- CI dual: job Node.js (TypeScript lint) + job Python (pytest).

### Changed
- `README.md` actualizado con ficha técnica de ColombIA Datos.
- `docs/architecture.md` con diagrama real (React → Express → Gemini → SODA → Firebase).
- `docs/planteamiento_problema.md`, `fuentes_datos.md`, `data_dictionary.md` alineados al código.
- Tests y pipeline importan desde `ml/` en lugar de `src/`.
- `src/README.md` en español con enlaces a documentación central.

## [0.1.0] - 2026-07-11

### Added
- Estructura inicial del repositorio Intermedio IA.
- Aplicación web exportada desde Google AI Studio en `src/`.
