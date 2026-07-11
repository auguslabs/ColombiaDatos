# Planteamiento del problema

## Contexto

Colombia cuenta con un ecosistema robusto de **datos abiertos** centralizado en [datos.gov.co](https://www.datos.gov.co/), con cientos de conjuntos de datos publicados por entidades del Estado. Sin embargo, el acceso efectivo a esta información sigue siendo un desafío para la ciudadanía:

- Los datasets están en formatos técnicos (CSV, JSON, API SODA).
- Se requiere conocer la estructura de cada conjunto de datos para consultarlo.
- No existe una interfaz unificada que permita **preguntar en lenguaje natural** y obtener respuestas visualizadas.

## Problema

> ¿Cómo democratizar el acceso a los datos abiertos de Colombia para que cualquier ciudadano pueda consultar, entender y visualizar información pública sin conocimientos técnicos?

## Solución propuesta — ColombIA Datos

Un **asistente virtual ciudadano** impulsado por inteligencia artificial (Gemini) que:

1. Interpreta preguntas en español coloquial.
2. Consulta automáticamente el catálogo de datos.gov.co.
3. Genera respuestas explicativas en Markdown.
4. Produce visualizaciones interactivas (barras, líneas, tortas).
5. Guarda el historial de consultas de forma segura (Firebase).

## Objetivos

### General

Democratizar el acceso a los datos abiertos de Colombia mediante una plataforma web con inteligencia artificial conversacional.

### Específicos

1. Permitir consultas en lenguaje natural sobre datasets de datos.gov.co.
2. Generar visualizaciones automáticas de los datos consultados.
3. Garantizar seguridad de credenciales y datos de usuario (proxy Express + Firestore rules).
4. Ofrecer panel de administración para gestionar fuentes de datos y configuración IA.
5. Documentar y reproducir el flujo analítico con notebooks y pipeline Python.

## Alcance

**Incluye:**
- Aplicación web full-stack (React + Express + Gemini + Firebase).
- Integración con API SODA de datos.gov.co.
- Capa analítica Python (EDA, limpieza, modelado offline).
- Documentación técnica completa para evaluación.

**No incluye (v1):**
- App móvil nativa.
- Integración con fuentes fuera de datos.gov.co.
- Modelos ML propios entrenados en producción (Gemini es el motor de IA).

## Usuarios objetivo

| Perfil | Necesidad |
|--------|-----------|
| Ciudadano | Consultar datos públicos sin saber programar |
| Periodista / investigador | Explorar datasets rápidamente |
| Administrador | Configurar fuentes y monitorear uso |
