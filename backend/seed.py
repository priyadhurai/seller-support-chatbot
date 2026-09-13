"""Create tables and seed two test sellers with sample data.

Data spans several months and locations so the analytics endpoints/charts
have something meaningful to show. Run with: python seed.py
"""

import random
from datetime import date, timedelta

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models.buyer_message import BuyerMessage, MessageStatus
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus
from app.models.return_request import Return, ReturnStatus
from app.models.seller import Marketplace, Seller

random.seed(42)

BUYER_NAMES = [
    "Ananya Gupta", "Rohan Mehta", "Sneha Kulkarni", "Vikram Rao", "Ishaan Verma",
    "Kavya Subramaniam", "Arjun Nair", "Meera Pillai", "Karthik Iyer", "Divya Menon",
    "Aditya Sharma", "Priyanka Reddy", "Sanjay Kumar", "Neha Joshi", "Rahul Malhotra",
]

STATUS_WEIGHTS = [
    (OrderStatus.delivered, 5),
    (OrderStatus.shipped, 2),
    (OrderStatus.pending, 2),
    (OrderStatus.cancelled, 1),
]


def weighted_status():
    statuses, weights = zip(*STATUS_WEIGHTS)
    return random.choices(statuses, weights=weights, k=1)[0]


def random_date_within_months(months_back: int) -> date:
    today = date.today()
    start = today - timedelta(days=30 * months_back)
    delta_days = (today - start).days
    return start + timedelta(days=random.randint(0, delta_days))


def biased_recent_date(months_back: int) -> date:
    """Weighted so the dashboard's default 'last 7 days' view isn't empty:
    ~40% in the last week, ~30% in the last month, ~30% across the full range."""
    today = date.today()
    bucket = random.random()
    if bucket < 0.4:
        return today - timedelta(days=random.randint(0, 6))
    if bucket < 0.7:
        return today - timedelta(days=random.randint(7, 29))
    return random_date_within_months(months_back)


def generate_orders(seller_id: int, order_prefix: str, products: list[dict], locations: list[str], count: int) -> list[Order]:
    orders = []
    for i in range(1, count + 1):
        product = random.choice(products)
        orders.append(
            Order(
                seller_id=seller_id,
                order_number=f"{order_prefix}-{1000 + i}",
                product_name=product["product_name"],
                quantity=random.randint(1, 4),
                status=weighted_status(),
                order_date=biased_recent_date(6),
                buyer_name=random.choice(BUYER_NAMES),
                buyer_location=random.choice(locations),
            )
        )
    return orders


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Seller).count() > 0:
            print("Database already has sellers — skipping seed. Delete rows manually to reseed.")
            return

        # --- Seller 1: Amazon seller -------------------------------------
        seller1 = Seller(
            name="Priya Traders",
            email="priya@priyatraders.example",
            password_hash=hash_password("password123"),
            marketplace=Marketplace.amazon,
        )
        db.add(seller1)
        db.flush()

        s1_products = [
            {"sku": "WM-BLK-001", "product_name": "Wireless Mouse", "category": "Electronics", "price": 799.00, "description": "Ergonomic 2.4GHz wireless mouse with USB receiver.", "quantity": 45, "low_stock_threshold": 10},
            {"sku": "BH-BLU-002", "product_name": "Bluetooth Headphones", "category": "Electronics", "price": 1999.00, "description": "Over-ear Bluetooth 5.0 headphones, 20hr battery.", "quantity": 4, "low_stock_threshold": 5},
            {"sku": "UC-CBL-003", "product_name": "USB-C Charging Cable", "category": "Accessories", "price": 349.00, "description": "1.5m braided USB-C to USB-A fast charging cable.", "quantity": 2, "low_stock_threshold": 15},
            {"sku": "LS-ALU-004", "product_name": "Laptop Stand", "category": "Office", "price": 1299.00, "description": "Adjustable aluminum laptop stand, foldable.", "quantity": 18, "low_stock_threshold": 5},
            {"sku": "KB-MEC-005", "product_name": "Mechanical Keyboard", "category": "Electronics", "price": 2999.00, "description": "87-key mechanical keyboard with blue switches.", "quantity": 12, "low_stock_threshold": 6},
        ]
        s1_locations = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad"]

        s1_inventory = [Inventory(seller_id=seller1.id, **p) for p in s1_products]
        db.add_all(s1_inventory)

        s1_orders = generate_orders(seller1.id, "AMZ", s1_products, s1_locations, count=45)
        db.add_all(s1_orders)
        db.flush()

        s1_messages = [
            BuyerMessage(seller_id=seller1.id, order_id=s1_orders[1].id, message_text="Hi, when will my Bluetooth headphones ship? It's been a few days.", status=MessageStatus.pending),
            BuyerMessage(seller_id=seller1.id, order_id=s1_orders[2].id, message_text="Can I change the delivery address for my USB-C cable order?", status=MessageStatus.pending),
            BuyerMessage(seller_id=seller1.id, order_id=s1_orders[3].id, message_text="Why was my laptop stand order cancelled? I still want it.", status=MessageStatus.pending),
        ]
        db.add_all(s1_messages)

        s1_returns = [
            Return(seller_id=seller1.id, order_id=s1_orders[0].id, reason="Wireless mouse stopped working after 2 days.", status=ReturnStatus.requested),
            Return(seller_id=seller1.id, order_id=s1_orders[4].id, reason="Wrong color headphones received.", status=ReturnStatus.approved),
            Return(seller_id=seller1.id, order_id=s1_orders[6].id, reason="Keyboard keys sticking, requested refund.", status=ReturnStatus.refunded, refund_amount=2999.00),
        ]
        db.add_all(s1_returns)

        # --- Seller 2: Flipkart seller -------------------------------------
        seller2 = Seller(
            name="Chennai Home Essentials",
            email="admin@chennaihome.example",
            password_hash=hash_password("password123"),
            marketplace=Marketplace.flipkart,
        )
        db.add(seller2)
        db.flush()

        s2_products = [
            {"sku": "NSP-24CM-001", "product_name": "Non-Stick Frying Pan", "category": "Kitchen", "price": 899.00, "description": "24cm non-stick frying pan, induction compatible.", "quantity": 30, "low_stock_threshold": 8},
            {"sku": "CBS-QN-002", "product_name": "Cotton Bedsheet Set", "category": "Home", "price": 1499.00, "description": "Queen-size 100% cotton bedsheet with 2 pillow covers.", "quantity": 3, "low_stock_threshold": 6},
            {"sku": "SWB-1L-003", "product_name": "Steel Water Bottle", "category": "Kitchen", "price": 449.00, "description": "1L stainless steel insulated water bottle.", "quantity": 60, "low_stock_threshold": 20},
            {"sku": "TL-WOOD-004", "product_name": "Table Lamp", "category": "Home", "price": 1099.00, "description": "Wooden base table lamp with fabric shade.", "quantity": 1, "low_stock_threshold": 4},
            {"sku": "DM-SET-005", "product_name": "Dinner Set (16pc)", "category": "Kitchen", "price": 2499.00, "description": "16-piece ceramic dinner set for 4 people.", "quantity": 9, "low_stock_threshold": 5},
        ]
        s2_locations = ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Kochi"]

        s2_inventory = [Inventory(seller_id=seller2.id, **p) for p in s2_products]
        db.add_all(s2_inventory)

        s2_orders = generate_orders(seller2.id, "FK", s2_products, s2_locations, count=38)
        db.add_all(s2_orders)
        db.flush()

        s2_messages = [
            BuyerMessage(seller_id=seller2.id, order_id=s2_orders[1].id, message_text="Is the bedsheet set machine washable?", status=MessageStatus.pending),
            BuyerMessage(seller_id=seller2.id, order_id=s2_orders[3].id, message_text="My table lamp arrived with a scratch, can I get a replacement?", status=MessageStatus.pending),
        ]
        db.add_all(s2_messages)

        s2_returns = [
            Return(seller_id=seller2.id, order_id=s2_orders[2].id, reason="Dinner set arrived with 2 broken plates.", status=ReturnStatus.requested),
            Return(seller_id=seller2.id, order_id=s2_orders[5].id, reason="Bedsheet color faded after first wash.", status=ReturnStatus.rejected),
        ]
        db.add_all(s2_returns)

        db.commit()
        print("Seeded 2 sellers with orders, inventory, buyer messages, and returns.")
        print("  Seller 1 login: priya@priyatraders.example / password123 (Amazon)")
        print("  Seller 2 login: admin@chennaihome.example / password123 (Flipkart)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
