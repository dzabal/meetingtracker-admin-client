# MeetingTracker Admin Client - nueva iteración

## Resultado solicitado

Construir un parche incremental sobre el candidato corregido y compilado. No crear un proyecto nuevo.

La causa principal de la iteración anterior es estructural: el Catálogo recibía `action` pero ejecutaba únicamente `setView('operations')`. La acción se perdía y Operaciones creaba estados locales independientes para `action` y `date`. Por eso todas las selecciones terminaban en Día académico sin acción activa.

## Arquitectura obligatoria

1. Mantener **Catálogo** como inventario informativo.
2. Crear una vista de primer nivel **Operaciones globales**.
3. Dividir la vista en cuatro renglones: Día académico, Sección, Expediente y Pipeline.
4. Mantener un único estado `GlobalOperationSelection` en `App.tsx`.
5. No declarar estados paralelos de `action` o `date` dentro de la página de operaciones.
6. Usar `action.scope` para dispatch y validar el target antes de enviar.
7. Construir parámetros específicos para cada una de las diez acciones.

## Archivos protegidos

No reemplazar ni incluir:

- `docs/admin-api/openapi-admin-v1.json`
- `docs/admin-api/SHA256SUMS.txt`
- `src/api/admin-api.d.ts`
- `src/api/client.ts`
- `src/main.tsx`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`

OpenAPI autorizado:

- tamaño: `33247` bytes
- SHA-256: `af61acb2bd06c3b304104ecef8552a6682fc2a128576ea45993c1c6a8963815d`

## Entrega esperada

Nombre: `MEETINGTRACKER-ADMIN-WEB-CLIENT-VNEXT-PATCH.zip`

Debe contener exclusivamente archivos nuevos o modificados, `MANIFEST.txt`, documentación de integración y `VALIDATION-VNEXT.txt`.

## Uso de los ejemplos

Los archivos en `examples/` son referencias arquitectónicas. No son un proyecto ni deben copiarse sin adaptar imports, nombres y tipos de la base. Se incluyen para fijar de manera inequívoca:

- propiedad del estado;
- agrupación de acciones;
- transferencia del target;
- dispatch por scope;
- payload por acción;
- idempotencia;
- botones realmente conectados.

## Validación obligatoria

Ejecutar antes de entregar:

```text
npm ci
npm run generate:api
npx tsc -b --pretty false
npm run build
```

La entrega será rechazada si alguno falla o si no existe evidencia funcional de las diez acciones en modo seguro.

## Correcciones conocidas y Horario efectivo

Antes de implementar, revisar `docs/KNOWN-DEFECTS-CORRECTION-PLAYBOOK.txt`. El documento enumera las correcciones que se repitieron en entregas anteriores: `createRoot`, exportación de `App`, OpenAPI/SHA, tipos generados, props duplicadas, cierre del payload, `reason`, variable inexistente, botones, JSX, estado duplicado e idempotencia.

El requisito visual de **Horario efectivo** está definido en `docs/EFFECTIVE-SCHEDULE-RENDERING.txt` y ejemplificado por `examples/src/components/EffectiveScheduleCard.example.tsx`. El resumen no puede mostrar JSON crudo.
