# Guía de validación para pares

Guía para que evaluadores reproduzcan y validen los resultados del proyecto **ColombIA Datos** (Equipo 194).

## Requisitos previos

- Node.js 18+
- Python 3.11+
- Clave `GEMINI_API_KEY` (Google AI Studio)

## 1. Validar la aplicación web

```bash
cd src
npm install
cp .env.example .env.local
# Editar .env.local → agregar GEMINI_API_KEY
npm run dev
```

Abrir `http://localhost:3000` y verificar:

- [ ] La página carga con el mensaje de bienvenida de ColombIA Datos
- [ ] Se puede iniciar sesión (Google o email)
- [ ] Una consulta en lenguaje natural devuelve respuesta con datos de datos.gov.co
- [ ] Si la respuesta incluye datos numéricos, aparece un gráfico interactivo (Recharts)
- [ ] El historial de conversación se guarda al recargar la página

### Verificación TypeScript

```bash
cd src
npm run lint
```

## 2. Validar seguridad

- [ ] `GEMINI_API_KEY` no aparece en el código fuente del frontend (`src/src/`)
- [ ] Revisar `src/firestore.rules` — reglas de acceso por rol
- [ ] Revisar `docs/seguridad.md` y `src/security_spec.md`

## 3. Validar capa analítica Python

```bash
# Desde la raíz Intermedio-ia/
pip install -r requirements.txt
pytest tests/ -v
python pipelines/pipeline_ml.py
```

Verificar:

- [ ] Todos los tests pasan (`test_data_quality`, `test_model_inference`)
- [ ] Pipeline ejecuta (modo esqueleto si no hay CSV en `data/02_intermediate/`)

## 4. Validar documentación

| Documento | Verificar |
|-----------|-----------|
| [README.md](../README.md) | Ficha técnica completa |
| [architecture.md](architecture.md) | Diagrama de flujo coherente con el código |
| [stack_tecnologico.md](stack_tecnologico.md) | Stack del arquitecto documentado |
| [aplicacion_web.md](aplicacion_web.md) | Estructura de `src/` explicada |
| [data_dictionary.md](data_dictionary.md) | Entidades Firestore definidas |
| [fuentes_datos.md](fuentes_datos.md) | datos.gov.co y SODA documentados |
| [planteamiento_problema.md](planteamiento_problema.md) | Problema y objetivos claros |

## 5. Validar estructura del repositorio

```
Intermedio-ia/
├── src/           ✓ App web (React + Express + Gemini + Firebase)
├── ml/            ✓ Módulos Python analíticos
├── docs/          ✓ 10+ documentos técnicos
├── data/          ✓ 4 subcarpetas del ciclo de vida
├── notebooks/     ✓ 5 notebooks
├── tests/         ✓ Pruebas pytest
├── pipelines/     ✓ pipeline_ml.py
├── models/        ✓ Carpeta de artefactos
├── reports/       ✓ Figuras y reporte
├── RECURSOS/      ✓ Material visual
└── .github/       ✓ CI configurado
```

## Checklist final

- [ ] App web funcional con consulta IA
- [ ] Visualizaciones Recharts operativas
- [ ] Tests Python pasan
- [ ] Documentación completa y alineada con el código
- [ ] Sin credenciales expuestas en el repositorio
- [ ] Estructura del concurso cumplida

## Contacto

Equipo **194** — Proyecto Intermedio IA, Concurso Datos al Ecosistema 2026 IA para Colombia.
