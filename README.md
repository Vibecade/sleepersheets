# SleeperSheets

SleeperSheets is a React + Vite app for managing Sleeper fantasy football leagues with salary cap tools, contracts, exports, commissioner workflows, and league insights.

## Stack

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- Radix UI / shadcn-style primitives
- Supabase

## Requirements

- Node.js 20.x
- npm 11+

This repo is standardized on `npm`. Bun, pnpm, and Yarn are not part of the supported workflow.

## Getting Started

```sh
npm ci
npm run dev
```

The local dev server runs on port `8080` by default.

## Core Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check:bundle
npm run smoke:routes
```

## CI Expectations

Run the whole gate in one command:

```sh
npm run verify
```

That is every check `.github/workflows/ci.yml` runs, in the same order: lint,
typecheck, edge typecheck, tests, build, bundle budget, route smoke, and
migrations-apply-from-empty. It stands up a throwaway Postgres for the
migration check and tears it down afterwards, and warns if a step exists in
`ci.yml` but not in the script.

```sh
npm run verify -- --fast   # skips build/bundle/smoke
```

> **GitHub Actions is unavailable to this repo until 2026-09-01** (billing).
> Jobs fail in a few seconds with no steps recorded and the annotation
> *"The job was not started because recent account payments have failed..."*.
> That is not a signal about your branch. Until it's restored, `npm run verify`
> is the gate — run it before merging, because nothing else will.

## Notes

- `package-lock.json` is the source of truth for installs.
- The app uses hashed bundles plus a service worker, so a hard refresh may be needed after deploys when chunk names change.
