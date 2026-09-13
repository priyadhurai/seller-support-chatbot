from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_seller, hash_password, verify_password
from app.database import get_db
from app.models.seller import Seller
from app.schemas.auth import LoginRequest, SellerResponse, SignupRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(Seller).filter(Seller.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    seller = Seller(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        marketplace=payload.marketplace,
    )
    db.add(seller)
    db.commit()
    db.refresh(seller)

    token = create_access_token(seller.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.email == payload.email).first()
    if not seller or not verify_password(payload.password, seller.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(seller.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=SellerResponse)
def me(current_seller: Seller = Depends(get_current_seller)):
    return current_seller
