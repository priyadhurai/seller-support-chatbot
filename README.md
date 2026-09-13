# Seller Support Chatbot

Internal support tool for Amazon/Flipkart sellers: chat assistant (Gemini function calling)
over the seller's own orders/inventory/products/buyer-messages/returns, plus a dashboard app
with sales analytics, a docked AI assistant panel, drafted buyer reply review, and
return/refund tracking. No live marketplace API integration — see "Phase 2" note below.

## App structure

A sidebar + topbar shell (`app/(app)/layout.tsx`) wraps every page below; the AI assistant
panel is docked on the right of that shell (not a standalone page) and persists across
navigation.

- **`/dashboard`** — home: 7/30/90-day stat cards (with vs-previous-period deltas), a daily
  sales chart, an order-status donut, a top-products table, low-stock alerts with a one-click
  restock, and quick-action links.
- **`/orders`** — orders table + CSV import.
- **`/inventory`** — inventory table (price/category/description) with inline edit/delete,
  an Add Product form, and CSV import. Low-stock rows highlighted.
- **`/messages`** — buyer messages with Gemini-drafted replies (Edit/Approve, never auto-sent).
- **`/returns`** — approve/reject a return, record a refund amount once approved (this only
  updates our own database — see "Phase 2" below).
- **`/analytics`** — deep-dive revenue analytics: product performance, sales by location,
  monthly trend.
- **`/settings`** — seller profile (read-only) + log out.
- **AI panel** — suggested prompts, follow-up chips, and a structured "sales summary" card
  for revenue-shaped questions; otherwise plain markdown replies. The topbar search box also
  feeds it (Enter sends the query to the assistant). The bell icon surfaces real notifications
  (low stock / pending messages / requested returns), not placeholders.

## Stack
- Backend: FastAPI + SQLAlchemy + PostgreSQL, JWT auth
- Frontend: Next.js (App Router) + Tailwind
- LLM: Google Gemini (function calling)

## Backend setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
python seed.py                # creates tables + seeds 2 test sellers
uvicorn app.main:app --reload --port 8000
```

There's no migrations tool set up — `seed.py` only calls `create_all()`, so if you pull a
change that alters the schema, drop and recreate the tables yourself before reseeding:
`python -c "import app.models; from app.database import Base, engine; Base.metadata.drop_all(bind=engine)"`.

Test sellers created by `seed.py`:
- `priya@priyatraders.example` / `password123` (Amazon)
- `admin@chennaihome.example` / `password123` (Flipkart)

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:8000
npm run dev
```

Visit http://localhost:3000.

## Phase 2 (not built here)

Approving a drafted buyer reply, or marking a return "refunded", only updates our own
database. Nothing in this codebase sends a message to a real buyer, calls a live
marketplace API, or issues a real payment/refund. Actually delivering an approved reply
or processing a refund is gated on Amazon SP-API / Flipkart Seller API approval and is
intentionally out of scope for this phase.
