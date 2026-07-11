# Seguridad — ColombIA Datos

## Principios de seguridad

1. **Claves API en servidor:** `GEMINI_API_KEY` solo existe en `server.ts` (Node.js). El frontend nunca la recibe.
2. **Proxy Express:** Las llamadas a Gemini pasan por `/api/chat` y `/api/analyze-context`.
3. **Reglas Firestore:** Acceso basado en roles y propiedad de documentos.
4. **Autenticación Firebase:** Google OAuth y email/contraseña con verificación.

## Invariantes de datos (Firestore)

Definidos en `src/security_spec.md`:

| # | Invariante |
|---|-----------|
| 1 | Un perfil `/users/{uid}` solo puede ser leído/escrito por su propietario (excepto campos de rol). |
| 2 | El rol `admin` no puede ser auto-asignado por usuarios públicos. |
| 3 | Conversaciones pertenecen a un `userId`; solo el dueño accede. |
| 4 | Mensajes heredan permisos de la conversación padre. |
| 5 | `DataSources` son lectura para autenticados; escritura solo para admins. |

## Amenazas mitigadas ("The Dirty Dozen")

| Amenaza | Mitigación |
|---------|-----------|
| Identity Spoofing (rol admin falso) | Reglas Firestore bloquean auto-elevación de rol |
| Conversation Hijacking | `userId` validado en reglas de lectura/escritura |
| Data Source Poisoning | Solo admins pueden modificar `/dataSources/` |
| PII Leak (listar todos los usuarios) | List de `/users/` restringido |
| Message Injection cross-user | Validación de propiedad en subcolección messages |
| Timestamp Fraud | Uso de `request.time` en reglas |
| Role Escalation | Update de `role` bloqueado para no-admins |
| Excessive Writes (1MB content) | Validación de tamaño en reglas |

Detalle completo: [`src/security_spec.md`](../src/security_spec.md)

## Archivos de seguridad

| Archivo | Propósito |
|---------|-----------|
| `src/firestore.rules` | Reglas de acceso Firestore en producción |
| `src/security_spec.md` | Especificación formal de amenazas y tests |
| `src/server.ts` | Circuit breaker ante abuso de API Gemini |

## Buenas prácticas para despliegue

- Rotar `GEMINI_API_KEY` periódicamente.
- Usar variables de entorno en CI/CD, nunca hardcodear claves.
- Revisar reglas Firestore antes de cada release.
- Habilitar Firebase App Check en producción (recomendado).
- Configurar rate limiting en `AppSetting.rateLimitMessages`.

## Credenciales excluidas del repositorio

El `.gitignore` excluye:

```
.env
.env.*
credentials.json
secrets/
```

## Referencias

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google AI API — Best Practices](https://ai.google.dev/gemini-api/docs/api-key)
- [variables_entorno.md](variables_entorno.md)
