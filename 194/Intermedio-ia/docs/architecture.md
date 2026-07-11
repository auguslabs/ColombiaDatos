# Arquitectura del sistema — ColombIA Datos

## Visión general

ColombIA Datos es una aplicación **full-stack** que conecta ciudadanos con el catálogo nacional de datos abiertos ([datos.gov.co](https://www.datos.gov.co/)) mediante inteligencia artificial conversacional.

```mermaid
flowchart TB
    subgraph Frontend["Frontend — React 19 + Vite 6"]
        UI[Interfaz ciudadana]
        Charts[Recharts — visualizaciones]
        MD[React Markdown — reportes IA]
    end

    subgraph Backend["Backend — Express + TypeScript"]
        Proxy[Proxy seguro de APIs]
        GeminiRoute[/api/gemini]
        AnalyzeRoute[/api/analyze-context]
    end

    subgraph Cloud["Servicios en la nube"]
        Gemini[Google Gemini API]
        Firebase[Firebase Auth]
        Firestore[Cloud Firestore]
    end

    subgraph External["Fuentes externas"]
        SODA[datos.gov.co — API SODA]
    end

    subgraph Analytics["Capa analítica — Python"]
        Raw[data/01_raw]
        ML[ml/ — limpieza, features, modelos]
        NB[notebooks/]
    end

    UI --> Proxy
    Proxy --> GeminiRoute
    Proxy --> AnalyzeRoute
    GeminiRoute --> Gemini
    AnalyzeRoute --> Gemini
    UI --> Firebase
    UI --> Firestore
    Proxy --> SODA
    SODA --> Charts
    Raw --> ML --> NB
```

## Flujo de una consulta ciudadana

1. El ciudadano escribe una pregunta en lenguaje natural en la interfaz React.
2. El frontend envía la consulta al servidor Express (nunca expone la clave Gemini al navegador).
3. Express invoca **Gemini** vía `@google/genai` para interpretar la intención y estructurar la respuesta.
4. El servidor o el cliente consultan datasets en **datos.gov.co** mediante la API **SODA**.
5. Los resultados se renderizan como texto (Markdown), tablas o gráficos (Recharts).
6. El historial de conversaciones, notas y configuraciones se persisten en **Firestore**.

## Componentes del repositorio

| Ruta | Rol | Tecnología |
|------|-----|------------|
| `src/` | Aplicación web principal | React, Express, TypeScript, Firebase |
| `src/server.ts` | Servidor proxy + endpoints Gemini | Node.js, esbuild |
| `src/src/App.tsx` | UI principal, auth, chat, admin | React 19 |
| `src/src/components/DataChart.tsx` | Visualizaciones de datos públicos | Recharts, Motion |
| `ml/` | Limpieza, integración y modelado offline | Python, scikit-learn |
| `data/` | Ciclo de vida de datasets descargados | CSV / Git LFS |
| `notebooks/` | EDA y experimentación reproducible | Jupyter |
| `pipelines/` | Orquestación del flujo analítico | Python |

## Integración de fuentes de datos

| Fuente | Protocolo | Uso en la app |
|--------|-----------|---------------|
| datos.gov.co | SODA REST API | Consulta de datasets en tiempo real |
| Firebase Firestore | SDK Web | Usuarios, conversaciones, fuentes configuradas |
| Gemini API | REST vía SDK | Análisis de lenguaje natural y generación de respuestas |

## Seguridad

- Las claves de API (Gemini) permanecen **solo en el servidor** (`server.ts`).
- Reglas de Firestore definidas en `src/firestore.rules` — ver [seguridad.md](seguridad.md).
- Especificación de amenazas en `src/security_spec.md`.

## Despliegue

| Entorno | Comando |
|---------|---------|
| Desarrollo | `cd src && npm run dev` |
| Producción | `cd src && npm run build && npm start` |

Ver [variables_entorno.md](variables_entorno.md) y [aplicacion_web.md](aplicacion_web.md).
