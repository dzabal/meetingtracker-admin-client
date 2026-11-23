# ClientVNext incremental patch

Apply over the authorized candidate. Catalog is informational; Operations global owns a single GlobalOperationSelection and four rows. The operation form dispatches by scope, validates targets and keeps request_id/process_run_id separate. Effective schedule is rendered as labeled fields with technical JSON folded.

The two protected exceptions are explicit: `src/api/client.ts` now defaults to relative API paths and `vite.config.ts` adds the authorized development proxy. This is required to avoid browser CORS errors without `mode:no-cors`.

Install and validate:

```bash
unzip -o MEETINGTRACKER-ADMIN-WEB-CLIENT-VNEXT-PATCH.zip -d /path/to/candidate
cd /path/to/candidate
npm ci
npm run generate:api
npx tsc -b --pretty false
npm run build
```

Rollback: restore the six modified source/config files from the candidate. No backend or database changes are required.
