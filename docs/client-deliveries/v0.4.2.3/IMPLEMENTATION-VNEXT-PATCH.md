# Next iteration patch
Apply over the updated candidate. The catalog remains informational. App owns one GlobalOperationSelection; OperationsPage is presentational and dispatches by explicit scope. The expediente normalizer accepts academic_period/periodo_academico, section_code/codigo_seccion, session_number/sesion, and master_session_id without deriving values.

Install and validate:

```bash
npm ci
npm run generate:api
npx tsc -b --pretty false
npm run build
```

Use the Vite `/api` proxy for local development. No `mode:no-cors`. Rollback by restoring the modified files listed in MANIFEST-VNEXT.txt.
