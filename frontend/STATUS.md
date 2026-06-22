# Frontend Status — Never Ghosted

Snapshot for handing to Claude Design. Describes what exists, what is wired to
the backend/engine, what is dead UI, and what must be built to make the demo
happy-path work end to end.

Stack: Next.js (App Router), client components only, Subframe UI kit
(`src/ui/`). No BFF — pages `fetch` FastAPI directly via `src/lib/api.ts`
(`NEXT_PUBLIC_API_URL`, default `http://localhost:8000`).

---

## 1. The data chain (your mental model)

A real person on the Kanban board **is** a backend `Deal` row. Everything
downstream hangs off `deal_id`:

```
Customer ─┐
Quote ────┼──> Deal (deal_id, stage, current_goal)
          │       │
          │       ├─ getDeal(id)        -> master data page (customer/quote/notes/touches/signals)
          │       ├─ POST /strategy     -> engine runs LLM -> persona + steps + evidence
          │       ├─ POST /steps/n/draft  -> engine drafts a message for step n
          │       └─ POST /steps/n/revise -> engine checks instruction vs deal data, applies or flags
```

The contract seam lives in **`src/lib/types.ts`** (TS interfaces mirror backend
Pydantic field names exactly) and **`src/lib/api.ts`** (one helper per
endpoint). These two files ARE the engine↔backend↔frontend contract on the FE
side. Keep them as the single source of truth.

---

## 2. Pages and wiring state

| Page | File | Backend wired? | State |
|------|------|----------------|-------|
| `/` | `app/page.tsx` | n/a | redirects to `/quotes` |
| `/quotes` | `app/quotes/page.tsx` | **yes** `getLeads(1)` | Kanban populated from real leads. Cards = real people. |
| `/requests/[id]` | `app/requests/[id]/page.tsx` | **yes** `getDeal(id)` | Master data. Reads real customer/quote/notes. All edits are read-only stubs. |
| `/requests/[id]/strategy` | `app/requests/[id]/strategy/page.tsx` | **yes** generate/draft/revise | The play. Runs the LLM on mount. |
| `/calendar` | `app/calendar/page.tsx` | **no** | 100% static markup, hardcoded German + dates. Not in nav. |

### `/quotes` (Kanban) — mostly works
- ✅ Columns built from `lead.stage`, cards from real backend leads.
- ✅ Card click → `/requests/{deal_id}`.
- ✅ "Generate strategy" button (on open stages) → `/requests/{deal_id}/strategy`.
- ❌ Dead: search, Filter, "Show archived", "Create quote", List/Kanban toggle, per-card `…` and edit icons.
- ❌ Sidebar nav items have no `href` — only the active item is styled; none navigate. Calendar unreachable.

### `/requests/[id]` (Master Data) — reads real, writes nothing
- ✅ Shows real `customer.name/region/property_type/channel_preference`, `quote` system + value, real `notes[]`.
- ❌ Every `TextField` is read-only (`onChange` is `() => {}`). "Edit" button no-op.
- ❌ **"Add note"** and **"Record voice"** → no-op. No backend endpoint exists (see gaps).
- ❌ Files card (Intake form / Energy bill / Roof photo) is hardcoded; download/browse/drop no-op.
- ⚠️ "Master data has changed → Regenerate strategy" alert is **always shown** (hardcoded), not driven by real edit state. Its button does navigate to the strategy page.

### `/requests/[id]/strategy` (The Play) — the strongest screen
- ✅ On mount calls `generateStrategy(dealId)` → **LLM runs** (RealEngine if `OPENAI_API_KEY` set, else FakeEngine fixture).
- ✅ Renders `buyer_profile.summary`, `persona_scores`, `top_motivations`, `objections`, and the ordered `steps[]` with `goal/lever/channel/rationale/evidence_chips`.
- ✅ "Draft message" per step → `draftStep(dealId, order)`, shows returned text inline.
- ✅ Revise box → `reviseStep(...)`, shows applied/flagged + reason (the guardrail).
- ❌ **Revise is hardcoded to step `order=1`** (`reviseStep(dealId, 1, instruction)`) — should target the step the user is editing.
- ❌ Drafts/revisions are display-only; nothing feeds back into master data notes or the deal.

### `/calendar` — static mock
- ❌ No API. Hardcoded week "29. Dezember – 04. Januar 2026", German labels, one fake "Bitte" task block.
- ❌ "Heute", prev/next, "Neuer Termin", view toggles — all no-op.
- ❌ No appointment concept exists anywhere in the backend.

---

## 3. Backend contract available now (`src/lib/api.ts`)

```
getLeads(installerId=1)              GET  /installers/{id}/leads          -> Lead[]
getDeal(dealId)                     GET  /deals/{id}                     -> DealDetail
generateStrategy(dealId)            POST /deals/{id}/strategy            -> StrategyResult   (runs LLM)
draftStep(dealId, order)            POST /deals/{id}/steps/{order}/draft -> { message }      (runs LLM)
reviseStep(dealId, order, instr)    POST /deals/{id}/steps/{order}/revise-> RevisionResult   (runs LLM, guardrailed)
getBenchmarks(orgId=1)              GET  /orgs/{id}/benchmarks           -> Record<string,number>   (UNUSED in UI)
seed()                              POST /admin/seed                                          (UNUSED in UI)
```

`DealDetail` already carries `strategy`, `persona`, `temperature`, `ghost_risk`
(populated once a strategy is generated) — **the frontend currently ignores
these**. The master data / Kanban could show "strategy ready" and ghost-risk
without re-running the LLM.

---

## 4. Contract gaps — backend work needed for the planned features

These do not exist yet. Needed for the requested flow:

1. **Add note** (master data feedback loop): `POST /deals/{id}/notes {type, content}` → append `Note`, return it. The `Note` entity already exists; only the route is missing. This is also where the "user gives input to update the plan" idea lands.
2. **Calendar / appointments**: no entity, no endpoint. For the demo we need at minimum
   - `GET /installers/{id}/appointments?week=...` → events to render
   - `POST /appointments {deal_id, start, end, title}` → add slot
   Decide: real SQL `Appointment` entity vs. demo-only in-memory/seed. For a hackathon happy path, seed one installer's week as **packed** with one **empty slot** that "Add to calendar" fills.
3. **Persist a draft/revision as an action** (optional but demo-nice): when a draft is accepted, write it back as a note or a scheduled touch so the loop is visible.

---

## 5. What "happy path" should look like (demo script)

1. Open `/quotes` → real leads in Kanban. Pick a person (e.g. open-stage card).
2. Land on `/requests/[id]` master data → real profile + quote + notes. Add a note ("customer mentioned roof shading") → it persists and appears.
3. Click **Generate strategy** → strategy page, LLM produces persona + ordered play + evidence chips tied to this deal's data.
4. Edit the plan in plain language (revise box) → guardrail confirms it's supported by deal data, applies, step updates. The note from step 2 should be visible as context.
5. Draft the message for a step → LLM text appears.
6. Click **Add to calendar** on a step/action → `/calendar` shows that installer's packed week with the new slot filled into the one empty gap.

Only this path needs to work. Everything else can stay visually present but inert.

---

## 6. Rewire priorities (highest demo value first)

1. **Sidebar nav** → real `<Link>`s (Quotes, Requests, Calendar) so the demo is clickable without typing URLs. Extract the duplicated sidebar into one shared component — it's copy-pasted across all 4 pages.
2. **Add note** end to end (route + master data form posts + optimistic render). Core feedback loop.
3. **Strategy revise** → target the actual step, not hardcoded `order=1`.
4. **Calendar** → minimal real data + "Add to calendar" filling the empty slot.
5. **Master data "changed" alert** → drive from real edit state (e.g. note added after strategy generated), not always-on.
6. **Deal page uses `DealDetail.strategy/ghost_risk`** → show "strategy ready" / risk badge without re-running LLM; offer "view" vs "regenerate".
7. Lower priority / can stay inert for demo: quote search, filters, create quote, file upload, voice notes, list view.

---

## 7. Notes for Claude Design

- Reuse the existing Subframe components in `src/ui/components/` (Button, Badge, Calendar, TextField, TextArea, Alert, etc.) — do not introduce a new design system.
- The sidebar is the biggest duplication; consolidating it is the single highest-leverage refactor.
- Keep all data access in `src/lib/api.ts` + `src/lib/types.ts`. Any new endpoint (notes, appointments) gets a helper there and a type that mirrors the backend response exactly.
- Mixed languages: `/calendar` is German, others English. Pick one (English) for the demo.
