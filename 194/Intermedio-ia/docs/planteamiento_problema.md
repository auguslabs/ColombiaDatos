# Planteamiento del problema

## Contexto

Colombia cuenta con un ecosistema robusto de **datos abiertos** en [datos.gov.co](https://www.datos.gov.co/). Sin embargo, ciudadanos, veedores y organizaciones enfrentan barreras para usar esta información en **veeduría ciudadana** y toma de decisiones informadas:

- Datasets en formatos técnicos (CSV, JSON, API SODA).
- Se requiere conocer la estructura de cada conjunto para consultarlo.
- No existe una interfaz unificada para **preguntar en lenguaje natural** y obtener respuestas visualizadas.

## Problema

> ¿Cómo democratizar el acceso a los datos abiertos de Colombia para que cualquier ciudadano pueda consultar, entender y visualizar información pública — apoyando la veeduría — sin conocimientos técnicos?

## Solución — ColombIA Datos (Portal de Inteligencia Pública)

Plataforma web con IA (Gemini) que:

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
| Ciudadano / veedor | Consultar datos públicos sin saber programar |
| Periodista / investigador | Explorar datasets y generar visualizaciones rápidas |
| Administrador | Configurar catálogo SODA, Gemini y monitorear uso |
