# Fuentes de datos

## Fuente principal — datos.gov.co

| Campo | Detalle |
|-------|---------|
| **Portal** | [https://www.datos.gov.co/](https://www.datos.gov.co/) |
| **API** | SODA REST API (Open Data Protocol) |
| **Formatos** | JSON, CSV, XML, GeoJSON |
| **Autenticación** | App Token opcional (para evitar límites de cuota CORS) |
| **Documentación API** | [dev.socrata.com](https://dev.socrata.com/) |

### Ejemplo de endpoint SODA

```
https://datos.gov.co/resource/{dataset-id}.json
https://datos.gov.co/resource/{dataset-id}.json?$limit=100&$where=departamento='Antioquia'
```

### App Token

Configurado en el panel de administración de la app (`sodaDefaultAppToken`) o en variables de entorno. Se envía como header `X-App-Token` en las peticiones SODA.

## Integración en la aplicación

| Componente | Función |
|------------|------|
| `App.tsx` | Construye URLs SODA, ejecuta consultas, parsea resultados |
| `DataSource` (Firestore) | Catálogo de fuentes configuradas por administradores |
| `server.ts` | Proxy para evitar exposición de tokens en el cliente |
| `DataChart.tsx` | Renderiza resultados numéricos como gráficos |

## Datos almacenados localmente (`data/`)

Para análisis offline y reproducibilidad del concurso:

| Carpeta | Contenido |
|---------|-----------|
| `data/01_raw/` | Datasets descargados de datos.gov.co (CSV/JSON originales) |
| `data/02_intermediate/` | Datos con limpieza inicial y tipos corregidos |
| `data/03_primary/` | Dataset consolidado integrado |
| `data/04_model_output/` | Predicciones y resultados de modelos offline |

> Usar **Git LFS** para archivos grandes en `data/01_raw/`.

## Datos en Firebase Firestore

| Colección | Descripción |
|-----------|-------------|
| `/users/{uid}` | Perfiles de usuario y roles |
| `/conversations/{id}` | Historial de conversaciones |
| `/conversations/{id}/messages/{msgId}` | Mensajes del chat |
| `/dataSources/{id}` | Fuentes de datos configuradas |
| `/appSettings/global` | Configuración Gemini y mensajes de bienvenida |
| `/auditLogs/{id}` | Registro de acciones administrativas |
| `/errorLogs/{id}` | Errores de la aplicación |

Ver [data_dictionary.md](data_dictionary.md) para el detalle de campos.

## Entidades responsables (ejemplos)

Los datasets en datos.gov.co provienen de entidades como DANE, MinSalud, MinEducación, DIAN, entre otras. Cada dataset incluye metadatos de la entidad responsable que la app cita en las respuestas del asistente.
