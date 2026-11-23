# Contrato de conexión del cliente administrativo

El cliente consume exclusivamente la API HTTP/JSON de FastAPI.

## Configuración

Definir `VITE_ADMIN_API_BASE_URL` en `.env`:

```env
VITE_ADMIN_API_BASE_URL=http://127.0.0.1:8000
```

La clave no se configura como variable `VITE_`. El operador la introduce al abrir el cliente; se conserva únicamente en memoria de la pestaña y se envía como `X-Admin-Key`.

## Rutas GET usadas

- `GET /api/admin/v1/actions/catalog`
- `GET /api/admin/v1/academic-days/{processing_date}/summary`
- `GET /api/admin/v1/meeting-cases?processing_date=YYYY-MM-DD&...`
- `GET /api/admin/v1/meeting-cases/{master_session_id}`
- `GET /api/admin/v1/meeting-cases/{master_session_id}/actions`

El contrato completo está en `openapi-admin-v1.json` y las reglas funcionales en `MEETINGTRACKER-ADMIN-WEB-CLIENT-INSTRUCTIONS.txt`.

Actualmente no hay endpoints POST: las acciones mutables se muestran como no ejecutables.
