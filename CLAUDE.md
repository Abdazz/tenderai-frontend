# CLAUDE.md

Frontend Next.js de TenderAI BF. Communique avec le backend (`tenderai-backend`) exclusivement via HTTP (routes proxy dans `app/api/proxy/*`).

Fait partie de l'architecture à 3 repos : `tenderai-backend`, `tenderai-frontend` (ce repo), `tenderai-infra`.

## Commands

```bash
npm install
npm run dev     # http://localhost:3000, attend NEXT_PUBLIC_API_URL
npm run build
npm run lint
```

## Config locale

`NEXT_PUBLIC_API_URL` doit pointer vers une instance backend en cours d'exécution (locale via `tenderai-backend`, ou staging).
