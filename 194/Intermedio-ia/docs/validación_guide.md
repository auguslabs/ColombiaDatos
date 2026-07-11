# Guía de validación para pares

Guía detallada para que pares validen los resultados del proyecto.

## Requisitos previos

```bash
pip install -r requirements.txt
pytest tests/
```

## Pasos de validación

1. **Reproducir el pipeline**
   ```bash
   python pipelines/pipeline_ml.py
   ```

2. **Verificar calidad de datos**
   - Ejecutar `tests/test_data_quality.py`
   - Revisar rangos, nulos y tipos en el consolidado (`data/03_primary/`)

3. **Verificar inferencia del modelo**
   - Ejecutar `tests/test_model_inference.py`
   - Confirmar consistencia de predicciones

4. **Revisar documentación**
   - `docs/data_dictionary.md` — variables del consolidado
   - `docs/architecture.md` — flujo de integración
   - `reports/` — figuras y reporte final

## Checklist

- [ ] Pipeline ejecuta sin errores
- [ ] Tests pasan
- [ ] Figuras generadas en `reports/figures/`
- [ ] Conclusiones alineadas con resultados numéricos
