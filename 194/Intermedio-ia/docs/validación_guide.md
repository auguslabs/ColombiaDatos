# Guía de validación para pares

Guía para evaluar **ColombIA Datos — Portal de Inteligencia Pública** (Equipo 194).

## Requisitos

- Node.js 18+
- Python 3.11+
- `GEMINI_API_KEY` (API Gemini)

## 1. Aplicación web

```bash
cd src
npm install
cp .env.example .env
# GEMINI_API_KEY en .env
npm run dev
```

Verificar en `http://localhost:3000`:

- [ ] Título: "ColombIA Datos - Portal de Inteligencia Pública"
- [ ] Logo y favicon visibles (`public/logo_colombia_datos.svg`)
- [ ] Login Firebase (Google o email)
- [ ] Chat responde consultas sobre datos.gov.co
- [ ] Gráficos Recharts cuando hay datos numéricos
- [ ] Catálogo Nacional de fuentes SODA accesible
- [ ] Historial de conversación persiste al recargar

```bash
npm run lint   # TypeScript OK
```

## 2. API backend

- [ ] `POST /api/chat` — respuestas del asistente
- [ ] `POST /api/analyze-context` — objetivos y chips de atajos
- [ ] `GEMINI_API_KEY` no expuesta en código frontend

## 3. Seguridad

- [ ] Revisar `src/firestore.rules`
- [ ] Revisar `docs/seguridad.md`

## 4. Capa analítica Python

```bash
pip install -r requirements.txt
pytest tests/ -v
python pipelines/pipeline_ml.py
```

## 5. Documentación

- [ ] [README.md](../README.md) — ficha técnica actualizada
- [ ] [architecture.md](architecture.md) — endpoints `/api/chat`
- [ ] [aplicacion_web.md](aplicacion_web.md) — estructura `public/`, `src/`
- [ ] [despliegue_local.md](despliegue_local.md) — guía de instalación

## Checklist final

- [ ] Portal funcional con IA y visualizaciones
- [ ] Tests Python pasan
- [ ] Documentación alineada con código actual
- [ ] Sin credenciales en el repositorio
