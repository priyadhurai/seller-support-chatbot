"""Gemini function-calling integration for the /chat endpoint.

Gemini only ever *reads* seller data or writes a draft reply with status
"drafted". Nothing in this module (or anywhere else in the app) sends a
message to a real buyer or calls a live marketplace API — see the note on
draft_reply() below and in app/routers/buyer_messages.py.
"""

import json

import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from sqlalchemy.orm import Session

from app.config import settings
from app.models.buyer_message import BuyerMessage, MessageStatus
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus
from app.models.return_request import Return, ReturnStatus
from app.services import analytics as analytics_service

genai.configure(api_key=settings.gemini_api_key)

_STATUS_ENUM = ["pending", "shipped", "delivered", "cancelled"]
_MESSAGE_STATUS_ENUM = ["pending", "drafted", "approved"]
_RETURN_STATUS_ENUM = ["requested", "approved", "refunded", "rejected"]
_ANALYTICS_BREAKDOWN_ENUM = ["revenue", "product", "month", "location"]

_GET_ORDERS = FunctionDeclaration(
    name="get_orders",
    description="Get the seller's orders, optionally filtered by order status.",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": _STATUS_ENUM,
                "description": "Optional order status filter.",
            }
        },
    },
)

_GET_LOW_STOCK_INVENTORY = FunctionDeclaration(
    name="get_low_stock_inventory",
    description="Get inventory items whose quantity is at or below their low-stock threshold.",
    parameters={"type": "object", "properties": {}},
)

_GET_INVENTORY = FunctionDeclaration(
    name="get_inventory",
    description=(
        "Get the seller's full product/inventory catalog, including price, category, "
        "description, and stock quantity. Optionally filter by category."
    ),
    parameters={
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "Optional product category filter (e.g. 'Electronics').",
            }
        },
    },
)

_GET_RETURNS = FunctionDeclaration(
    name="get_returns",
    description="Get the seller's return/refund requests, optionally filtered by status.",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": _RETURN_STATUS_ENUM,
                "description": "Optional return status filter.",
            }
        },
    },
)

_GET_SALES_ANALYTICS = FunctionDeclaration(
    name="get_sales_analytics",
    description=(
        "Get sales analytics for the seller, broken down by 'revenue' (total revenue, units "
        "sold, and average order value overall), 'product' (which products earn the most/least "
        "revenue), 'month' (revenue trend over time), or 'location' (which buyer locations/cities "
        "generate the most revenue). Revenue is quantity x each product's CURRENT price, matched "
        "by product name — not historical price at time of sale. Cancelled orders are excluded."
    ),
    parameters={
        "type": "object",
        "properties": {
            "breakdown": {
                "type": "string",
                "enum": _ANALYTICS_BREAKDOWN_ENUM,
                "description": "Which dimension to break sales down by.",
            }
        },
        "required": ["breakdown"],
    },
)

_GET_BUYER_MESSAGES = FunctionDeclaration(
    name="get_buyer_messages",
    description="Get buyer messages, optionally filtered by status.",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": _MESSAGE_STATUS_ENUM,
                "description": "Optional message status filter.",
            }
        },
    },
)

_DRAFT_REPLY = FunctionDeclaration(
    name="draft_reply",
    description=(
        "Generate a short, polite draft reply to a buyer message and save it "
        "as a suggestion (status 'drafted'). This never sends anything to the "
        "buyer — the seller must review and approve it manually on the dashboard."
    ),
    parameters={
        "type": "object",
        "properties": {
            "message_id": {
                "type": "integer",
                "description": "The id of the buyer message to draft a reply for.",
            }
        },
        "required": ["message_id"],
    },
)

_TOOLS = [
    Tool(
        function_declarations=[
            _GET_ORDERS,
            _GET_LOW_STOCK_INVENTORY,
            _GET_INVENTORY,
            _GET_BUYER_MESSAGES,
            _DRAFT_REPLY,
            _GET_RETURNS,
            _GET_SALES_ANALYTICS,
        ]
    )
]

_SYSTEM_INSTRUCTION = (
    "You are a support assistant for an e-commerce seller (Amazon/Flipkart). "
    "You can look up the seller's own orders, inventory/products, buyer messages, "
    "returns/refund requests, and sales analytics (overall revenue, top/bottom "
    "revenue-earning products, monthly revenue trend, revenue by buyer location), "
    "and you can draft replies to "
    "buyer messages. You must never claim to have sent a message to a buyer, "
    "issued a real refund, or called a marketplace API — drafts only become "
    "visible to the buyer, and refunds only take effect, after the seller "
    "manually approves them outside this app. All prices and revenue figures are "
    "in Indian Rupees — always format them with the ₹ symbol, never $. Keep "
    "answers concise and specific to the data returned by your tools."
)

_MAX_TOOL_ROUNDS = 5


def _order_to_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "product_name": order.product_name,
        "quantity": order.quantity,
        "status": order.status.value,
        "order_date": order.order_date.isoformat(),
        "buyer_name": order.buyer_name,
        "buyer_location": order.buyer_location,
    }


def _inventory_to_dict(item: Inventory) -> dict:
    return {
        "id": item.id,
        "sku": item.sku,
        "product_name": item.product_name,
        "quantity": item.quantity,
        "low_stock_threshold": item.low_stock_threshold,
        "price": float(item.price),
        "category": item.category,
        "description": item.description,
    }


def _message_to_dict(message: BuyerMessage) -> dict:
    return {
        "id": message.id,
        "order_id": message.order_id,
        "message_text": message.message_text,
        "received_at": message.received_at.isoformat(),
        "draft_reply": message.draft_reply,
        "status": message.status.value,
    }


def _return_to_dict(ret: Return) -> dict:
    return {
        "id": ret.id,
        "order_id": ret.order_id,
        "reason": ret.reason,
        "status": ret.status.value,
        "refund_amount": float(ret.refund_amount) if ret.refund_amount is not None else None,
        "requested_at": ret.requested_at.isoformat(),
    }


def _get_orders(db: Session, seller_id: int, status: str | None = None) -> dict:
    query = db.query(Order).filter(Order.seller_id == seller_id)
    if status:
        query = query.filter(Order.status == OrderStatus(status))
    orders = query.order_by(Order.order_date.desc()).limit(50).all()
    return {"orders": [_order_to_dict(o) for o in orders]}


def _get_low_stock_inventory(db: Session, seller_id: int) -> dict:
    items = (
        db.query(Inventory)
        .filter(Inventory.seller_id == seller_id, Inventory.quantity <= Inventory.low_stock_threshold)
        .order_by(Inventory.quantity.asc())
        .all()
    )
    return {"low_stock_items": [_inventory_to_dict(i) for i in items]}


def _get_inventory(db: Session, seller_id: int, category: str | None = None) -> dict:
    query = db.query(Inventory).filter(Inventory.seller_id == seller_id)
    if category:
        query = query.filter(Inventory.category.ilike(category))
    items = query.order_by(Inventory.product_name.asc()).limit(100).all()
    return {"inventory": [_inventory_to_dict(i) for i in items]}


def _get_returns(db: Session, seller_id: int, status: str | None = None) -> dict:
    query = db.query(Return).filter(Return.seller_id == seller_id)
    if status:
        query = query.filter(Return.status == ReturnStatus(status))
    returns = query.order_by(Return.requested_at.desc()).limit(50).all()
    return {"returns": [_return_to_dict(r) for r in returns]}


def _get_sales_analytics(db: Session, seller_id: int, breakdown: str) -> dict:
    if breakdown == "revenue":
        return {"revenue_summary": analytics_service.revenue_summary(db, seller_id)}
    if breakdown == "product":
        return {"product_performance": analytics_service.product_performance(db, seller_id)}
    if breakdown == "month":
        return {"monthly_sales": analytics_service.monthly_sales(db, seller_id)}
    if breakdown == "location":
        return {"sales_by_location": analytics_service.sales_by_location(db, seller_id)}
    return {"error": f"Unknown breakdown '{breakdown}'"}


def _get_buyer_messages(db: Session, seller_id: int, status: str | None = None) -> dict:
    query = db.query(BuyerMessage).filter(BuyerMessage.seller_id == seller_id)
    if status:
        query = query.filter(BuyerMessage.status == MessageStatus(status))
    messages = query.order_by(BuyerMessage.received_at.desc()).limit(50).all()
    return {"messages": [_message_to_dict(m) for m in messages]}


def _draft_reply(db: Session, seller_id: int, message_id: int) -> dict:
    message = (
        db.query(BuyerMessage)
        .filter(BuyerMessage.id == message_id, BuyerMessage.seller_id == seller_id)
        .first()
    )
    if not message:
        return {"error": f"No buyer message with id {message_id} found for this seller."}

    order = db.get(Order, message.order_id)
    product_name = order.product_name if order else "the product"

    drafting_model = genai.GenerativeModel(settings.gemini_model)
    prompt = (
        "Write a short, polite, professional reply from an e-commerce seller to a "
        f"buyer about the product '{product_name}'. The buyer wrote: "
        f'"{message.message_text}"\n\n'
        "Keep it under 60 words, do not invent order details you don't know, "
        "and sign off simply. Reply with only the message text."
    )
    result = drafting_model.generate_content(prompt)
    reply_text = result.text.strip()

    # Save as a suggestion only (status="drafted"). This NEVER sends anything
    # to the buyer or calls a marketplace API. The seller reviews it on the
    # dashboard and can Edit or Approve it there — approving only changes the
    # status in our own database (see app/routers/buyer_messages.py). Actually
    # sending an approved reply to the buyer is a Phase 2 feature gated on
    # Amazon SP-API / Flipkart Seller API approval.
    message.draft_reply = reply_text
    message.status = MessageStatus.drafted
    db.commit()

    return {"message_id": message.id, "draft_reply": reply_text, "status": "drafted"}


_DISPATCH = {
    "get_orders": _get_orders,
    "get_low_stock_inventory": _get_low_stock_inventory,
    "get_inventory": _get_inventory,
    "get_buyer_messages": _get_buyer_messages,
    "draft_reply": _draft_reply,
    "get_returns": _get_returns,
    "get_sales_analytics": _get_sales_analytics,
}


def _execute_function(name: str, args: dict, db: Session, seller_id: int) -> dict:
    handler = _DISPATCH.get(name)
    if handler is None:
        return {"error": f"Unknown function {name}"}
    return handler(db, seller_id, **args)


def _build_card(seller_id: int, db: Session, name: str, args: dict) -> dict | None:
    # A "sales summary" card is shown in the UI (instead of/alongside plain
    # text) whenever the seller asked a revenue-shaped question — mirrors the
    # dashboard's own stat tiles, deltas included.
    if name == "get_sales_analytics" and args.get("breakdown") == "revenue":
        summary = analytics_service.dashboard_summary(db, seller_id, "7d")
        return {"type": "sales_summary", **summary}
    return None


def run_chat(db: Session, seller_id: int, user_message: str) -> tuple[str, dict | None]:
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        tools=_TOOLS,
        system_instruction=_SYSTEM_INSTRUCTION,
    )
    chat = model.start_chat()
    response = chat.send_message(user_message)
    card: dict | None = None

    for _ in range(_MAX_TOOL_ROUNDS):
        function_calls = [part.function_call for part in response.parts if part.function_call]
        if not function_calls:
            break

        function_response_parts = []
        for call in function_calls:
            args = {k: v for k, v in call.args.items()} if call.args else {}
            result = _execute_function(call.name, args, db, seller_id)
            if card is None:
                card = _build_card(seller_id, db, call.name, args)
            function_response_parts.append(
                genai.protos.Part(
                    function_response=genai.protos.FunctionResponse(
                        name=call.name,
                        response={"result": json.dumps(result)},
                    )
                )
            )

        response = chat.send_message(genai.protos.Content(parts=function_response_parts))

    return response.text, card
