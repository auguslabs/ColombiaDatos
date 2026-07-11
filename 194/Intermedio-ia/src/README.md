# ColombIA Datos — Aplicación web

Asistente virtual ciudadano para consultar, analizar y visualizar datos abiertos de Colombia ([datos.gov.co](https://www.datos.gov.co/)) mediante lenguaje natural e inteligencia artificial.

**Equipo 194** — Proyecto Intermedio IA

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Motion, Recharts |
| Backend | Express, TypeScript, esbuild |
| IA | Google Gen AI SDK (Gemini) |
| Datos | Firebase Auth + Cloud Firestore |

Documentación completa en [`../docs/`](../docs/):
- [Stack tecnológico](../docs/stack_tecnologico.md)
- [Arquitectura](../docs/architecture.md)
- [Variables de entorno](../docs/variables_entorno.md)
- [Seguridad](../docs/seguridad.md)

## Instalación

**Requisitos:** Node.js 18+

```bash
npm install
cp .env.example .env.local
```

Configurar `GEMINI_API_KEY` en `.env.local`. Ver [variables_entorno.md](../docs/variables_entorno.md).

## Ejecución

```bash
npm run dev      # Desarrollo → http://localhost:3000
npm run build    # Build producción
npm start        # Servidor producción
npm run lint     # Verificación TypeScript
```

## Estructura

```
src/
├── server.ts              # Express + proxy Gemini
├── src/App.tsx            # UI principal (chat, admin, auth)
├── src/components/        # DataChart (Recharts)
├── src/types.ts           # Interfaces TypeScript
├── firestore.rules        # Reglas de seguridad
└── security_spec.md       # Especificación de amenazas
```

Ver [aplicacion_web.md](../docs/aplicacion_web.md) para detalle de cada archivo.

## AI Studio

Prototipo original: https://ai.studio/apps/4e52c179-86d3-4f50-a4e5-031c02821d04
