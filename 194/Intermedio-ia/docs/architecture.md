# Arquitectura del sistema — ColombIA Datos

## Visión general

**ColombIA Datos — Portal de Inteligencia Pública** es una aplicación full-stack para **veeduría ciudadana** que conecta a los ciudadanos con el catálogo nacional de datos abiertos ([datos.gov.co](https://www.datos.gov.co/)) mediante inteligencia artificial conversacional.

```mermaid
flowchart TB
    subgraph Frontend["Frontend — React 19 + Vite 6"]
        UI[Portal ciudadano + Catálogo]
        Logo[logo_colombia_datos.svg]
        Charts[Recharts — visualizaciones]
        MD[React Markdown — reportes IA]
    end

    subgraph Backend["Backend — Express + TypeScript"]
        Proxy[Proxy seguro de APIs]
        ChatRoute[/api/chat]
        AnalyzeRoute[/api/analyze-context]
        Heuristic[Motor heurístico offline]
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
        ML[ml/]
        NB[notebooks/]
    end

    UI --> Proxy
    Proxy --> ChatRoute
    Proxy --> AnalyzeRoute
    ChatRoute --> Gemini
    AnalyzeRoute --> Gemini
    AnalyzeRoute --> Heuristic
    UI --> Firebase
    UI --> Firestore
    UI --> SODA
    SODA --> Charts
    Raw --> ML --> NB
```

## Flujo de una consulta ciudadana

1. El ciudadano accede al portal e inicia sesión (Firebase Auth).
2. Escribe una pregunta en lenguaje natural en el chat.
3. El frontend llama a **`POST /api/chat`** en Express (la clave Gemini nunca sale del servidor).
4. Express invoca **Gemini** (`gemini-3.5-flash` por defecto) con instrucciones del sistema ColombIA Datos.
5. Paralelamente, **`POST /api/analyze-context`** genera objetivos y chips de atajos (Gemini o motor heurístico offline si hay circuit breaker).
6. La app consulta datasets en **datos.gov.co** vía API **SODA**.
7. Resultados: Markdown, tablas o gráficos Recharts (`DataChart`).
8. Conversaciones, notas y configuraciones se guardan en **Firestore**.

## API del backend

| Endpoint | Body principal | Respuesta |
|----------|---------------|-----------|
| `POST /api/chat` | `contents`, `systemInstruction`, `model`, `temperature`, `topP`, `topK` | `{ text }` |
| `POST /api/analyze-context` | `messages`, `sources` | `{ objective, shortcutChips }` |

## Componentes del repositorio

| Ruta | Rol |
|------|-----|
| `src/server.ts` | Backend Express, Gemini proxy, heurísticas |
| `src/src/App.tsx` | Portal completo: chat, catálogo, admin |
| `src/public/` | Branding (favicon, logo) |
| `src/src/components/DataChart.tsx` | Visualizaciones |
| `ml/` | Análisis offline Python |
| `data/` | Ciclo de vida de datasets |
| `notebooks/` | EDA reproducible |
| `pipelines/` | Pipeline ML |

## Integración de fuentes

| Fuente | Protocolo | Uso |
|--------|-----------|-----|
| datos.gov.co | SODA REST | Consulta en tiempo real |
| Firebase Firestore | SDK Web | Usuarios, conversaciones, fuentes |
| Gemini API | SDK `@google/genai` | Chat y análisis contextual |

## Seguridad

- Claves API solo en servidor (`server.ts`)
- Reglas Firestore: `src/firestore.rules`
- Especificación de amenazas: `src/security_spec.md`

## Despliegue

| Entorno | Comando |
|---------|---------|
| Desarrollo | `cd src && npm run dev` |
| Producción | `cd src && npm run build && npm start` |

Ver [despliegue_local.md](despliegue_local.md) y [variables_entorno.md](variables_entorno.md).
