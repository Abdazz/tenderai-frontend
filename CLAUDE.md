# CLAUDE.md

Frontend Next.js de TenderAI. Communique avec le backend (`tenderai-backend`) exclusivement via HTTP (routes proxy dans `app/api/proxy/*`).

Fait partie de l'architecture à 3 repos : `tenderai-backend`, `tenderai-frontend` (ce repo), `tenderai-infra`. `tenderai-infra` est la racine — ce repo et `tenderai-backend` vivent comme sous-dossiers gitignorés à l'intérieur.

## Commands

```bash
npm install
npm run dev     # http://localhost:3000, attend NEXT_PUBLIC_API_URL
npm run build
npm run lint
```

## Config locale

`NEXT_PUBLIC_API_URL` doit pointer vers une instance backend en cours d'exécution (locale via `tenderai-backend`, ou staging).
