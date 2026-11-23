# Guía de implementación para el equipo web

## Responsabilidades

El backend expone capacidades y validaciones. El frontend presenta formularios, recoge el motivo, genera idempotencia y muestra el resultado. El frontend no accede a bases de datos ni ejecuta comandos Python.

## Contrato de escritura

`POST /api/admin/v1/meeting-cases/{master_session_id}/actions`

Cabeceras: `X-Admin-Key`, `X-Operator-Name`, `Idempotency-Key`, `Content-Type: application/json`, `Accept: application/json`.

Cuerpo:

```json
{
  "action_code": "ACTION_CODE",
  "reason": "Motivo administrativo",
  "expected_case_updated_at": "2026-11-18T21:16:10.310800+00:00",
  "parameters": {}
}
```

El mismo intento reintentado por timeout debe reutilizar el mismo `Idempotency-Key`. Una acción modificada debe generar otra clave.

## Secuencia de una acción

`actions GET` → refresco de expediente → formulario → confirmación → `POST` → refresco de expediente, acciones y bandeja.

## Validación

Usar `docs/admin-api/openapi-admin-v1.json` como contrato. Los campos variables de cada acción están definidos en `MEETINGTRACKER-ADMIN-WEB-CLIENT-INSTRUCTIONS-v2.txt`; no deducir parámetros por el nombre de la acción.

## Pruebas mínimas

- clave inválida produce `401` y limpia la sesión;
- acción deshabilitada no muestra confirmación;
- motivo vacío bloquea el envío;
- timeout permite reintento con la misma idempotencia;
- conflicto de versión fuerza refresco;
- repetición devuelve `idempotent_replay=true` sin duplicar la mutación;
- ningún secreto aparece en el bundle.

## Matriz tipada incluida

`src/features/ActionForm.tsx` define los 13 `action_code`, mínimos de `reason`, catálogos cerrados y controles de selección. Los reportes, grabaciones y jobs se leen del expediente recibido; no se solicita UUID manual como texto libre. La integración visual debe cargar `GET .../{id}/actions` y renderizar `ActionForm` solo para acciones devueltas por el backend.

## v3 multialcance

Los adaptadores v3 están en `src/api/client.ts` bajo `multiScopeApi`: `executeMeetingCaseAction`, `executeSectionAction`, `executeAcademicDayAction`, `executePipelineAction` y `operation`. Usar el adaptador correspondiente al scope; no enviar una acción global al endpoint de expediente.

Para operaciones `PENDING` o `PROCESSING`, consultar `operation(request_id, key)` cada 2–5 segundos, hasta 120 segundos. Detener al recibir `COMPLETED` o `FAILED`; un timeout de navegador no es un fallo confirmado y debe conservar el request para seguimiento.
