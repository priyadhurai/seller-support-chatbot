from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analytics, auth, buyer_messages, chat, import_csv, inventory, orders, returns

app = FastAPI(title="Seller Support Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(buyer_messages.router)
app.include_router(chat.router)
app.include_router(import_csv.router)
app.include_router(returns.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok"}
