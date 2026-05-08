# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Ant Design 5 · Zod 4 · Oracle ORDS backend.

A detailed architecture doc with a full step-by-step walkthrough for adding a module lives in `README.md` — consult it before scaffolding a new feature.

## Commands

```bash
npm run dev         # Turbopack dev server on localhost:3000
npm run build       # Production build (fails on type or lint errors)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (flat config, next/core-web-vitals)
```

No test runner is configured. `GET /api/pacientes/token` is a diagnostic endpoint that verifies ORDS connectivity without exposing the token.

## Architecture — the four layers

Strict one-way dependency: upper layers may import from lower ones, never the reverse.

1. **Services + infra** — `src/services/*.service.ts`, `src/lib/ords/` — talk to Oracle ORDS with an OAuth client-credentials token.
2. **API Routes** — `src/app/api/**/route.ts` — validate input with Zod, delegate to services, return JSON.
3. **Client hooks** — `src/features/<module>/hooks/*` — own UI state and call `/api/*` via `apiFetch`.
4. **UI** — `src/features/<module>/components/*` and `src/components/` — render and dispatch events.

### Hard rule: the ORDS token never reaches the browser

`src/lib/ords/` and `src/services/` are **server-only**. They must be imported exclusively from API Routes or Server Components. Importing them from a `"use client"` component would bundle the OAuth credentials into the browser — treat this as a review-blocker.

The flow is always: `Browser → /api/* (Next.js) → Oracle ORDS`. The client never calls ORDS directly.

## Where things go

| Creating... | Path |
|---|---|
| Page / route | `src/app/(dashboard)/<module>/page.tsx` (uses the `(dashboard)` route group → `AppFrame` is applied automatically) |
| API endpoint | `src/app/api/<module>/route.ts` (and `[id]/route.ts` for item ops) |
| Feature view / modal | `src/features/<module>/components/` |
| Client state + fetch | `src/features/<module>/hooks/use<Module>.ts` |
| Zod schema (create + update) | `src/features/<module>/schemas/<module>.schema.ts` |
| Server-side ORDS calls | `src/services/<module>.service.ts` |
| Shared TS type | `src/types/<module>.ts` |
| Generic utility | `src/lib/<utility>.ts` |
| Cross-module UI | `src/components/shared/` · layout shell in `src/components/layout/` |

After adding a module, also register it in `src/components/layout/SideNav.tsx` (`NAV_ITEMS`).

## Conventions that matter

- **Alias `@/` always** — resolves to `src/`. No relative imports like `../../../lib/...`.
- **Single source of truth for types** — define in `src/types/`, import everywhere; don't redeclare shapes in components or services.
- **Pages are thin** — `page.tsx` imports a feature view and returns it; no state, no fetch.
- **Zod is the contract** — API Routes call `schema.safeParse(body)` before touching services; infer DTOs from schemas (`CreatePacienteDto`, `UpdatePacienteDto`) rather than hand-writing them.
- **Errors surface to the user** — catch in hooks and call `message.error(e instanceof ApiError ? e.message : "…")`. Services throw `Error("ORDS error <status> …")`; API Routes translate to `{ message }` JSON + appropriate status.
- **File naming** — Components `PascalCase.tsx`, hooks `camelCase.ts`, schemas/services/types/utils `kebab-case.ts`, API routes always `route.ts`.
- **Client fetch wrapper** — use `apiFetch<T>` from `src/lib/api.ts` (throws `ApiError` with status + parsed detail). Don't call `fetch` directly from client code.
- **ORDS endpoints** — build URLs via `ordsConfig.endpoint(path)`; get headers via `await buildAuthHeaders()` (fresh token per call — ORDS tokens are short-lived).

## Environment

Runtime vars are validated lazily in `src/lib/ords/config.ts`; a missing required var throws a descriptive error on first ORDS call rather than at boot.

| Var | Required | Notes |
|---|---|---|
| `ORDS_BASIC_AUTH` | ✅ | `Basic <base64(client_id:client_secret)>` |
| `ORDS_BASE_URL` | ✅ | Schema base URL, no trailing slash |
| `ORDS_MODULE` | ✅ | URI prefix of the ORDS REST module (defaults to `api`) |
| `ORDS_TOKEN_URL` | Optional | Falls back to a hardcoded dev-tenant URL in `config.ts`; **set explicitly in production** |

Values live in `.env.local` (gitignored). There is no `.env.example` in the repo despite the README referencing one.

## Module status

Only `pacientes` (`/pacientes`) is implemented end-to-end against ORDS (`getPaciente`, `getPacientesById/{id}`). `appointments`, `purchases`, `invoices`, `settings` pages exist as `ComingSoon` placeholders — follow the pacientes module as the reference implementation when wiring them up.
