# Frontend Integration Plan

Wiring the static Subframe pages to the live backend. Distinct, **jointly-owned**
surface (it edits the frontend pages), so it gets its own doc. Backend contract:
[`backend_plan.md`](backend_plan.md). Entity shapes: [`../metadata.md`](../metadata.md).

## Current state

- Frontend pages are **static hardcoded JSX** — no fetch, no props, no data layer.
- Backend (BP0–BP2) is live with the endpoints below; CORS open; verified the
  cross-origin round-trip works (a `/smoke` probe page renders real data).
- This plan = the rewire from static → live.

## Page → endpoint map

| Page | Endpoint(s) | Notes |
|------|-------------|-------|
| leads list (sidebar / home) | `GET /installers/{id}/leads` | installer id hardcoded to 1 for the demo |
| `requests/[id]` (deal detail) | `GET /deals/{id}` | customer, quote, touches, notes, signals; persona/strategy if generated |
| `requests/[id]/strategy` | `POST /deals/{id}/strategy` (generate), `POST /deals/{id}/steps/{order}/draft`, `POST /deals/{id}/steps/{order}/revise` | strategy steps + evidence chips |
| (benchmarks widget, optional) | `GET /orgs/{id}/benchmarks` | raw won/lost/ghosted counts |
| (demo reset) | `POST /admin/seed` | wipe + reseed; run once before a demo |

## Build steps

1. **Shared types** — `frontend/src/lib/types.ts`: TS interfaces mirroring the
   backend Pydantic shapes (Lead, DealDetail, StrategyResult, Step, EvidenceChip,
   PersonaScore). The FE side of the contract seam. Keep field names identical to
   the API JSON.
2. **API client** — `frontend/src/lib/api.ts`: one helper per endpoint
   (`getLeads`, `getDeal`, `generateStrategy`, `draftStep`, `reviseStep`,
   `getBenchmarks`, `seed`). Base URL from `NEXT_PUBLIC_API_URL`
   (default `http://localhost:8000`). No scattered `fetch` in pages.
3. **Rewire pages** (one at a time, eyeball each):
   - `requests/[id]` first (read-only, simplest) → `getDeal`.
   - then leads list → `getLeads`.
   - then `requests/[id]/strategy` (has the write actions) → generate/draft/revise.
4. **Loading + error states** — each page: a skeleton/spinner while fetching, a
   visible error if the backend is down (Subframe has `SkeletonText`/`Alert`).
5. **Seed** — a one-off: call `POST /admin/seed` before the demo (a dev button or
   `curl`), not on every page load.
6. **Delete `/smoke`** — remove `frontend/src/app/smoke/page.tsx` once real pages
   are wired.

## Constraints

- **Sequencing:** the rewire needs BP2's endpoints on `main` — merge
  `feat/backend-bp2` first. Then branch `feat/frontend-rewire` off `main`.
- Keep diffs to colleague's pages minimal and reviewable — swap hardcoded values
  for client data, don't restructure the JSX.
- Demo uses installer id `1`, deals from the seeded dataset (ids 1–120).
