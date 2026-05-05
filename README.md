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

Before pushing changes, the repo should pass:

```sh
npm run lint
npm run typecheck
npm run build
npm run check:bundle
npm run smoke:routes
```

## Notes

- `package-lock.json` is the source of truth for installs.
- The app uses hashed bundles plus a service worker, so a hard refresh may be needed after deploys when chunk names change.
