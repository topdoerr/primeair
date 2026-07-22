# Prime Air Corp — Cargo Dashboard

A Next.js dashboard for **Prime Air Corp** (air cargo, **MIA → SJU**) that unifies:

1. An **inbound Vapi voice agent** ("Prime Air AWB Status") that answers
   *"where is my cargo"* / *"when can I pick it up"* and schedules pickups, and
2. **Operational visibility** into calls, air waybills, and invoice
   discrepancy reports.

> **Pilot scope (confirmed):** the assistant is **inbound only** (no outbound
> callbacks) and pickups are **stored in Supabase only** (no external calendar
> sync). Both are easy to extend later — see *Extending* below.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres + Auth (email/password), Row Level Security
- **Vapi** — voice agent, managed **entirely through the Vapi MCP server**
  (`https://mcp.vapi.ai/sse`)
- Deploys to **Vercel**

All secrets live in env vars. Only `NEXT_PUBLIC_*` values reach the browser.
The service-role key and `VAPI_API_KEY` are used **server-side only**.

---

## Pages

| Route            | What it shows |
|------------------|---------------|
| `/` Overview     | KPIs: calls today, % self-served, top intents, AWBs flagged |
| `/calls`         | Recent calls, transcript drawer, intent + referenced AWB, **Sync calls** button |
| `/awb`           | Search by master bill → full record + charge breakdown + reconciliation |
| `/discrepancies` | Reports list + detail rendering the `DiscrepancyReport` XML with a **RECONCILED / FLAGGED** badge |
| `/assistant`     | Live Vapi assistant config + phone number; edit first message / prompt and **push updates back through the Vapi MCP server** |

---

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/awb-lookup` | **Tool the assistant calls mid-call.** `{ masterBillNumber }` → `{ flight, origin, destination, status, cargoReady, availableForPickup, chargesSummary, commodity }`. Reads Supabase. |
| `POST /api/pickup` | **Scheduling tool.** Creates a pickup/delivery window in Supabase. |
| `POST /api/vapi/webhook` | Receives Vapi `end-of-call-report` events (auth via `x-vapi-secret`) and upserts the call into Supabase. |
| `POST /api/sync-calls` | Manual "Sync calls" — pulls calls from the Vapi MCP server and upserts them. Requires a signed-in user. |
| `GET/PATCH /api/assistant` | Read / update the assistant via the Vapi MCP server. |

---

## Data model (Supabase)

- **air_waybills** — `master_bill_number` (`810-XXXXXXXX`), carrier, flight,
  origin, destination, commodity, weight/other/total charges, status,
  `cargo_ready_at`.
- **calls** — `vapi_call_id`, caller, assistant_id, started/ended, duration,
  transcript, `detected_intent`, `referenced_awb`, outcome, raw payload.
- **pickups** — `master_bill_number`, window_start/end, contact, status, source.
- **discrepancy_reports** — `message_id`, carrier, invoice, `payload_xml`,
  status (`RECONCILED` / `FLAGGED`), created_at.

**Reconciliation rule (single source of truth, `src/lib/reconcile.ts`):** a
report is **FLAGGED** when `weight_charge + other_charges != total_collect`
(1-cent tolerance).

---

## Getting started (local)

### 1. Install

```bash
npm install
```

### 2. Configure env

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project settings.
- `VAPI_API_KEY` — your Vapi **private** API key.
- `VAPI_WEBHOOK_SECRET` — any long random string.
- `APP_BASE_URL` — your app's public URL (used when wiring the assistant's
  tool URLs). Use your Vercel URL once deployed.

### 3. Create the schema + seed

Apply the migration and seed. Two options:

**Supabase SQL editor / CLI (pure SQL):**

```bash
# with the Supabase CLI linked to your project:
supabase db push          # or paste supabase/migrations/0001_init.sql
# then paste / run supabase/seed.sql
```

**Or programmatic seed (after the migration is applied):**

```bash
npm run db:seed
```

Both seed the two real AWBs (`810-21961413`, `810-21961306`, both RECONCILED)
plus one synthetic **FLAGGED** AWB so the badge logic is visible immediately.

### 4. Create a login user

Supabase dashboard → **Authentication → Users → Add user** (email + password).
The dashboard is gated behind sign-in.

### 5. Run

```bash
npm run dev
# http://localhost:3000  → redirects to /login
```

---

## Wiring up the Vapi assistant

The assistant is **created and updated through the Vapi MCP server** — no
REST calls. The declarative config lives in `scripts/assistant-config.ts`
(persona, bilingual first message, and the `lookup_awb` + `schedule_pickup`
function tools that point at this app's API routes).

### Provision / update

```bash
VAPI_API_KEY=... APP_BASE_URL=https://your-app.vercel.app \
  npm run vapi:provision
```

This connects to `https://mcp.vapi.ai/sse`, creates (or updates, if it already
exists) the **"Prime Air AWB Status"** assistant, attaches the two function
tools, sets the webhook (`server.url = APP_BASE_URL/api/vapi/webhook`), and
prints the **assistant id**.

> ⚠️ Point `APP_BASE_URL` at a **publicly reachable** URL before provisioning —
> Vapi calls the tool URLs over the internet and cannot reach `localhost`.
> Deploy to Vercel first (or use a tunnel like `ngrok`).

Then:

1. Put the printed id in `.env.local` as `VAPI_ASSISTANT_ID=...`.
2. In the Vapi dashboard, **attach a phone number** to the assistant.
3. Call the number and ask for status on `810-21961413` — the agent calls
   `POST /api/awb-lookup`, reads the seeded record, and answers with flight,
   route, availability, and a charges summary. Ask to schedule a pickup for
   `810-21961306` to exercise `POST /api/pickup`.

You can also edit the first message / system prompt from the **Assistant** page
in the dashboard and click **Push updates to Vapi**.

### Syncing calls

- **Automatic:** Vapi posts `end-of-call-report` to `/api/vapi/webhook` (set
  `VAPI_WEBHOOK_SECRET` on both sides). Each completed call is upserted.
- **Manual:** the **Sync calls** button on `/calls` pulls the call list from the
  Vapi MCP server and upserts transcripts + structured extraction.

---

## Deploy to Vercel

1. Push this repo and import it in Vercel.
2. Add all env vars from `.env.example` in the Vercel project settings
   (server-side ones are **not** exposed to the browser).
3. Deploy, then run `npm run vapi:provision` with `APP_BASE_URL` set to the
   Vercel URL so the assistant's tool + webhook URLs point at production.

---

## Extending (post-pilot)

- **Outbound callbacks** — add an outbound-call helper in `src/lib/vapi.ts`
  (Vapi MCP `create_call`) and a callback queue table; the schema and UI leave
  room for it.
- **Real calendar sync** — in `POST /api/pickup`, after the Supabase insert,
  create an event via the Google Calendar or Cal.com MCP server and store the
  event id on the `pickups` row.

---

## Security notes

- Service-role key and `VAPI_API_KEY` are only imported into server code
  (`src/lib/vapi.ts` is `server-only`; admin Supabase client is server-only).
- RLS is enabled on all tables; authenticated staff can read, and privileged
  writes go through server routes using the service role.
- The webhook verifies the `x-vapi-secret` shared secret.
- No secrets are committed — `.env.local` is git-ignored.

> **Note on this environment:** the Vapi MCP server was not reachable from the
> build container, so the live assistant was scaffolded via the provisioning
> script rather than executed here. Run `npm run vapi:provision` from an
> environment with `VAPI_API_KEY` and internet access to bring it up end to end.
