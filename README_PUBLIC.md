# MeetingTracker Admin Client

Base pública validada del cliente administrativo de MeetingTracker.

## Estado

Esta versión compila correctamente y sirve como base para implementar el espacio
independiente de **Operaciones globales**.

El Catálogo debe permanecer como inventario informativo. Las diez operaciones
globales deben organizarse en cuatro contextos:

- Día académico
- Sección
- Expediente o reunión
- Pipeline

## Instalación

```powershell
npm ci
npm run generate:api
npx tsc -b --pretty false
npm run build