# Conclusiones

## Hallazgos principales

1. **Viabilidad técnica:** Es posible conectar datos abiertos de Colombia con IA conversacional usando Gemini + API SODA, sin que el ciudadano necesite conocimientos técnicos.

2. **Experiencia de usuario:** La combinación de React 19, Motion y Recharts permite presentar datos públicos de forma visual e interactiva, superando la barrera de formatos CSV/JSON crudos.

3. **Seguridad:** El patrón proxy (Express) garantiza que las claves de Gemini y tokens SODA no se expongan en el navegador.

4. **Escalabilidad:** Firebase Firestore permite persistir conversaciones y configuraciones en tiempo real sin infraestructura propia de base de datos.

## Limitaciones

- **Cuotas de Gemini:** El tier gratuito tiene límites diarios; la app implementa circuit breaker para manejar agotamiento de cuota.
- **Cobertura de datos:** Depende de la calidad y actualización de datasets en datos.gov.co.
- **Precisión de IA:** Las respuestas de Gemini pueden contener imprecisiones; se recomienda verificar con la fuente original.
- **Modelos ML offline:** La capa Python (`ml/`) es complementaria; el motor de IA en producción es Gemini, no modelos propios entrenados.

## Próximos pasos

1. Integrar más datasets prioritarios del catálogo nacional.
2. Entrenar modelos de clasificación offline sobre datos consolidados en `data/03_primary/`.
3. Agregar exportación de reportes en PDF (`reports/reporte_final.pdf`).
4. Implementar pruebas E2E para flujos críticos del chat.
5. Desplegar en entorno de producción con Firebase y variables de entorno de QA.

## Impacto esperado

Democratizar el acceso a datos públicos colombianos, empoderando a ciudadanos, periodistas e investigadores para tomar decisiones informadas basadas en evidencia abierta.
