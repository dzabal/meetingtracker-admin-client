# MeetingTracker Admin Web Client

Cliente web desacoplado para la API administrativa de MeetingTracker. Funciona localmente y está preparado para Netlify.

## Ejecutar localmente

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación quedará en `http://localhost:5173`.

## Configuración

En `.env`:

```env
VITE_ADMIN_API_BASE_URL=http://127.0.0.1:8000
```

La clave administrativa se introduce en la pantalla inicial. Nunca se guarda en variables `VITE_`, localStorage, cookies ni IndexedDB.

## Rutas de la API

Todas usan `GET` y la cabecera `X-Admin-Key`:

| Ruta | Uso |
|---|---|
| `/api/admin/v1/actions/catalog` | Catálogo de acciones |
| `/api/admin/v1/academic-days/{processing_date}/summary` | Resumen diario |
| `/api/admin/v1/meeting-cases?processing_date=YYYY-MM-DD` | Bandeja de casos y filtros |
| `/api/admin/v1/meeting-cases/{master_session_id}` | Expediente detallado |
| `/api/admin/v1/meeting-cases/{master_session_id}/actions` | Acciones disponibles |

El cliente las implementa en `src/api/client.ts`.

## Contrato completo

- `docs/admin-api/openapi-admin-v1.json`
- `docs/admin-api/README.md`

Actualmente la API solo tiene lectura. Las acciones mutables se muestran como pendientes y no se ejecutan.

## Compilar para Netlify

```bash
npm run build
```

Configuración incluida en `netlify.toml`: comando `npm run build`, carpeta `dist` y fallback SPA.

## Formularios de acciones administrativas

La API es la fuente de verdad para `enabled`, `implemented`, `blocked_by`, `requires_reason` y el estado del expediente. El cliente no debe inferir permisos solo por el estado visible.

El backend devuelve las acciones disponibles mediante:

```text
GET /api/admin/v1/meeting-cases/{master_session_id}/actions
```

El formulario se presenta en el cliente porque necesita interacción humana (motivo, selección de candidato, confirmación crítica), pero se valida contra el contrato OpenAPI antes de enviar.

Al confirmar una acción:

1. Refrescar el expediente y sus acciones.
2. Obtener `case_updated_at` más reciente.
3. Mostrar el formulario específico de la acción.
4. Exigir `reason` según el mínimo indicado por el backend.
5. Generar un nuevo `Idempotency-Key` con `crypto.randomUUID()`.
6. Enviar `POST /api/admin/v1/meeting-cases/{master_session_id}/actions` con `X-Admin-Key`, `X-Operator-Name`, `Idempotency-Key` y JSON.
7. No actualizar el estado de forma optimista.
8. Tras una respuesta exitosa, volver a consultar expediente, acciones y bandeja.
9. Ante conflicto de versión, informar y refrescar antes de permitir otro intento.

La matriz completa de campos está en `MEETINGTRACKER-ADMIN-WEB-CLIENT-INSTRUCTIONS-v2.txt`. Las acciones que requieren controles especiales son:

- `ASSIGN_BEST_ATTENDANCE_REPORT`: seleccionar `attendance_report_id` desde los candidatos del expediente.
- `APPROVE_ATTENDANCE_EXCEPTION`: seleccionar `exception_type`, reporte y referencia de evidencia.
- `PROCESS_TEACHER_ONLY_SESSIONS`: elegir una resolución permitida.
- `APPROVE_BEST_RECORDING`: seleccionar `recording_uuid` explícitamente si hay varias grabaciones.
- `CANCEL_RECORDING_JOB`: solicitar motivo de cancelación y detalle.

Las acciones con `implemented=false`, `enabled=false` o `blocked_by` no vacío se muestran deshabilitadas. No se deben simular ni ejecutar desde el navegador.

## Levantar el cliente

Requisitos: Node.js 18 o superior y npm.

```bash
npm install
cp .env.example .env
```

Editar `.env` si la API usa otro puerto:

```env
VITE_ADMIN_API_BASE_URL=http://127.0.0.1:8000
```

Iniciar en desarrollo:

```bash
npm run dev
```

Abrir `http://localhost:5173`, introducir el nombre del operador y la clave administrativa. La clave y el nombre solo viven en memoria de la pestaña.

Comprobar producción local:

```bash
npm run build
npm run preview
```

Para Netlify, usar `npm run build` como comando de compilación y `dist` como carpeta publicada. Configurar `VITE_ADMIN_API_BASE_URL` en las variables de entorno del sitio y agregar el dominio de Netlify a `ADMIN_CORS_ORIGINS` del backend. Nunca publicar `ADMIN_API_KEY` ni otros secretos en variables `VITE_`.

## Versión 3 multialcance

Esta entrega es una extensión de la versión anterior. Añade adaptadores tipados para los scopes `MEETING_CASE`, `SECTION`, `DATE` y `PIPELINE`, además del monitor `GET /api/admin/v1/operations/{request_id}`. Una intención debe conservar su `Idempotency-Key` durante los reintentos; no se genera otra clave ante un timeout.

Las acciones globales deben mostrar siempre scope, target, operación (`PREVIEW`, `APPLY`, `ENQUEUE` o `PROCESS`), límite e impacto estimado. `implemented=false` nunca es ejecutable. El pipeline solo ejecuta una etapa por solicitud.

Para actualizar los tipos desde el backend saludable:

```bash
npx openapi-typescript ./docs/admin-api/openapi-admin-v3.json -o ./src/api/admin-api.d.ts
```

No editar manualmente el OpenAPI exportado.

## Entrega v3 completa

La estructura separa `src/api`, `src/components`, `src/features`, `src/hooks`, `src/pages` y `src/routes`. La API multialcance se encuentra en `src/api/client.ts`; los formularios de acciones en `src/features/ActionForm.tsx`.

## ClientV0.4.0

Esta entrega es editable y operativa. `src/App.tsx` integra navegación y estado; el expediente carga detalle y acciones disponibles, deshabilita acciones no implementadas/bloqueadas, renderiza `ActionForm`, ejecuta POST y refresca detalle, acciones, bandeja y resumen. La pantalla Operaciones consulta `GET /api/admin/v1/operations/{request_id}` con polling.
