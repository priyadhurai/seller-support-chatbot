# Interview Prep: Seller Support Chatbot

How to talk about this project in a technical interview — the pitch, the likely questions,
and the real bugs you can turn into "tell me about a time..." stories.

## The 60-second pitch

> "I built an internal dashboard for Amazon/Flipkart sellers — FastAPI + PostgreSQL backend,
> Next.js frontend — where a seller logs in and can either browse their orders/inventory/returns
> directly, or ask an AI assistant about them in plain English. The assistant uses Gemini's
> function-calling: it never sees the database directly, it picks which scoped SQL query answers
> the question, and only turns the *result* into a sentence. The part I spent the most care on
> wasn't the chatbot — it was making sure the AI can never take an irreversible action: drafting
> a buyer reply always stops at a 'drafted' status until a human clicks Approve, and every query
> is scoped to the logged-in seller's JWT, never trusted from anything the client or the model
> itself sends."

That one paragraph hits: full-stack ownership, LLM integration done correctly (grounding, not
hallucination), a security property (multi-tenancy), and a product/safety judgment call
(draft-only AI). That's usually enough to earn a follow-up question on whichever part the
interviewer cares about — which is the point.

## Why this project is a good interview story

Most take-home / portfolio chatbots are "wrap an LLM in a chat box." This one is not, and you
should say so directly if asked what makes it different: the LLM is deliberately the *least*
trusted part of the system. It can't read the database, can't write anything except a draft
status, and every value it states is traceable to a real SQL query that ran under the logged-in
seller's ID. That's the actual skill being demonstrated — not "I called an API," but "I designed
the boundary around an unreliable component."

## Talking points by topic

### Architecture & system design
- Two services: FastAPI (Python) backend, Next.js (TypeScript) frontend, talking over a REST API
  with JWT bearer auth — no server-side sessions, no cookies.
- The chat request path: browser → `fetch()` with `Authorization: Bearer <jwt>` → FastAPI route
  decodes the JWT into a seller → `run_chat()` → Gemini decides which of 7 tool functions to call
  → backend executes that function against Postgres, scoped to the seller → result goes back to
  Gemini → Gemini writes the final sentence → response returns to the browser.
- Be ready to draw this as a sequence diagram on a whiteboard. If you can't draw it without
  looking it up, you don't know it well enough yet — this is the one diagram to memorize cold.

### Database & multi-tenancy
- 5 tables: `sellers`, `orders`, `inventory`, `buyer_messages`, `returns`. Every table but
  `sellers` carries a `seller_id` foreign key.
- The multi-tenant boundary is enforced by **application discipline** — every single query has
  `.filter(Model.seller_id == seller_id)` — not by a database-level mechanism like Postgres Row
  Level Security. Say this proactively; it shows you understand the difference between "the app
  behaves correctly" and "the database guarantees it," and you can talk about RLS as the next
  hardening step if pushed on "how would you make this more robust."
- Revenue is computed at query time (`quantity × current inventory price`, joined by product
  name) rather than stored per order. Good, honest answer to "walk me through a query you wrote":
  it's an approximation that drifts if prices change after the sale — a real production system
  would snapshot price-at-time-of-sale onto the order row instead.

### Auth & security
- Passwords hashed with bcrypt (via passlib), never stored or logged in plaintext.
- JWT signed with a server-side secret, decoded on every protected route via a FastAPI dependency
  (`get_current_seller`) — this is the *only* place `seller_id` is allowed to originate from.
- The one rule to be able to state precisely under pressure: **`seller_id` is never accepted from
  the request body, a query parameter, or an LLM function-call argument** — only from the decoded
  JWT. This is the answer to almost any "how did you prevent X from accessing Y's data" question.

### LLM integration (function calling)
- Function calling, not RAG, not prompt-stuffing. The model is given *descriptions* of 7 Python
  functions (name, purpose, parameters) — not the data itself. Given a question, it can request
  zero, one, or several of them, in up to 5 rounds, before producing a final answer.
- Drafting a buyer reply is the one place the model *writes*: it always sets `status = "drafted"`,
  never `"approved"`. That transition is a separate authenticated endpoint the seller must call by
  clicking Approve in the UI — the model has no code path that can reach it.

#### Why function calling, and not the alternatives

A strong answer to "why did you choose this approach" names the options you *didn't* pick and
says specifically why each loses for this use case — not just "it works well."

- **No tools, ask the model directly.** It has never seen the database, so it either refuses or
  invents a plausible-sounding number. Unacceptable for real business data — a seller acting on
  "you have 3 pending orders" needs that number to be real, not fluent.

- **Prompt-stuffing** (paste the seller's raw data into the prompt as context). Looks simpler,
  breaks down fast: doesn't scale — a seller with thousands of orders blows the context window,
  and you pay for those tokens on *every* turn regardless of what was actually asked. You also
  still have to write the "fetch only this seller's data" logic to build that blob in the first
  place, so you get all the engineering cost of scoping with none of the benefit — it's baked into
  every prompt instead of living behind a controlled interface. And there's no constrained action
  space: if the model sees everything as free-form context, enforcing "you may only ever set
  status to `drafted`, never `approved`" is much harder than over a typed function it can only
  call one specific way.

- **RAG (retrieval over embeddings).** The wrong tool for this job, and it's worth being precise
  about why: RAG finds the passage most *semantically similar* to a query — excellent for
  unstructured text like a policy doc or FAQ. It does not compute
  `SUM(quantity) WHERE status = 'pending'`. Structured, exact, aggregate data needs a real query
  engine underneath regardless of whether an LLM is involved — RAG doesn't replace SQL, it answers
  a different kind of question. (This *is* the right tool for a stretch feature like "seller
  policy & FAQ" — searching uploaded documents — which is a genuinely different problem from "what
  are my pending orders.")

- **Function calling (what's built here).** The model requests a specific, developer-defined,
  typed operation — `get_orders(status="pending")` — and the backend runs real code: a real SQL
  filter, a real JWT-derived `seller_id`, real auth. The model only ever narrates the result. This
  gets you correctness (every number traces to an actual row, never invented), a hard action
  boundary (the 7 functions *are* the model's entire action space — nothing outside that whitelist
  is reachable no matter how it's prompted), scoping that stays in normal application code instead
  of something the LLM has to be trusted with, and efficiency (only the data relevant to *this*
  question gets fetched, not the seller's entire history every turn).

The one-line version, if put on the spot: **RAG retrieves relevant text; function calling executes
real, authorized code.** This project's questions ("what's pending," "what's my revenue") need the
second one.

### Frontend
- Next.js App Router with a route group (`(app)/`) so the sidebar/topbar/AI-panel shell wraps
  every authenticated page without repeating layout code.
- Client-side JWT stored in `localStorage`, read by a `RequireAuth` wrapper that redirects
  unauthenticated users — simple, and enough for an internal tool; worth naming as a trade-off
  versus httpOnly cookies if asked about XSS exposure.
- Charts (Recharts) follow an accessibility-first palette — single-hue for magnitude/ranking
  charts, a fixed (never re-cycled) categorical palette for the order-status breakdown, so colors
  stay consistent and colorblind-distinguishable. Good answer if asked about UI craft beyond
  "I used a chart library."

### Trade-offs and what you'd change at scale
Be ready with 3–4 of these — they show judgment, not just execution:
- Add Postgres indexes on `(seller_id, status)` / `(seller_id, order_date)` — right now a `Seq
  Scan` is fine at ~100 rows and would not be at 100k.
- Add Row Level Security as a second enforcement layer under the application-level filtering.
- Snapshot price-at-time-of-sale onto `orders` instead of joining to current inventory price.
- Move the Gemini call off the request/response cycle (streaming or a queue) if replies get slow
  under load — right now it's a synchronous call inside one HTTP request.
- Real marketplace integration (Amazon SP-API / Flipkart Seller API) is the actual "Phase 2" —
  currently nothing sends a message or issues a refund outside this app's own database, by design.

## "Tell me about a bug you fixed" — four real ones

These actually happened while building this project. Use whichever fits the question.

**1. A `DROP TABLE` that silently did nothing.**
Resetting the dev database after a schema change, I ran a one-off script that imported
`Base`/`engine` and called `Base.metadata.drop_all()` — but not the model modules themselves.
SQLAlchemy's `Base.metadata` only knows about tables whose model classes have actually been
imported somewhere; since I hadn't imported `app.models`, the metadata object was empty and
`drop_all()` silently dropped zero tables. The bug was invisible until I later ran the seed
script and it reported "sellers already exist" against what I thought was an empty database.
**The lesson:** SQLAlchemy's declarative registry is populated by import side effects, not by the
schema existing in the database — a good one for "describe a subtle bug that wasn't where you
expected."

**2. A third-party version incompatibility.**
`passlib` (for bcrypt password hashing) broke against a newer `bcrypt` package — passlib's
version-detection code assumed an attribute (`bcrypt.__about__`) that newer bcrypt releases
removed, causing every password hash to throw. Fixed by pinning `bcrypt==4.0.1`. **The lesson:**
pin transitive dependencies you don't control when a library does runtime introspection on
another library's internals — a fragile pattern that breaks silently on upgrade.

**3. Chasing a moving target: LLM model deprecation.**
The project started on `gemini-1.5-flash`. Over the course of building it, that model was
retired, its suggested replacement was *also* retired mid-project, and the final model hit a
free-tier daily quota limit from repeated testing. Solved by switching to
`gemini-flash-lite-latest` — an alias Google keeps pointed at a current model, so it doesn't go
stale — and verifying separately that it still supported function calling before committing to
it. **The lesson:** pin exact versions for reproducibility where it matters (dependencies), but
for a fast-moving hosted API, a maintained "latest" alias can be the more robust choice, not less.

**4. A stale server process masking a real code change.**
After adding a new field to an API response, the frontend threw `Cannot read properties of
undefined` — the field really was missing from the JSON. Root cause: the backend process serving
requests was started *before* that code change and hadn't been restarted, so the edit simply
wasn't running yet. Caught by an automated browser test's `pageerror` listener rather than by
eyeballing the UI. **The lesson:** a passing type-check or successful edit doesn't mean the
*running* process reflects it — worth naming as why you value automated checks that exercise the
live system, not just static analysis.

## Honest limitations (volunteer these before they ask)

Interviewers trust a candidate more, not less, for stating a project's real limitations
unprompted. Have these ready:
- No Postgres Row Level Security — multi-tenancy is enforced entirely in application code.
- Revenue is a current-price approximation, not true historical revenue.
- No real marketplace API integration — by design, but worth stating it's a real gap, not an
  oversight.
- JWT in `localStorage` is simpler than httpOnly cookies but more exposed to XSS — a reasonable
  choice for an internal tool, not a public-facing fintech app.

## Tailoring the pitch by role

- **Backend-heavy interview:** lead with the multi-tenant scoping rule and the function-calling
  request flow; be ready to write the SQLAlchemy filter and the FastAPI dependency from memory.
- **Frontend-heavy interview:** lead with the route-group layout, the docked AI panel's shared
  context, and the chart accessibility decisions.
- **AI/ML-adjacent interview:** lead with *why* function calling over prompt-stuffing, and the
  draft-only guardrail as a concrete example of designing around model unreliability.
- **Generalist / startup interview:** lead with the 60-second pitch as written above, then let
  their first follow-up question tell you which direction to go deeper.

## Quick reference — numbers to cite

- 5 database tables, all but one carrying a `seller_id` foreign key
- 7 functions exposed to the LLM as callable tools
- Up to 5 function-calling rounds per chat turn before a final answer is forced
- Verified with 2 test sellers that zero rows are visible across accounts
- 1 write path the model has: drafting a reply, capped at a `"drafted"` status it can never
  escalate past

## Good questions to ask back

Turning it around signals you think about systems, not just features:
- "How do you enforce tenant isolation here — application-level filtering, RLS, separate schemas
  per tenant, or something else?"
- "Where in your stack do LLM calls sit on the request path — synchronous, streamed, or queued?"
- "What's your team's policy on AI features that can take a write action — is there always a
  human-approval step, or does it vary by risk?"
