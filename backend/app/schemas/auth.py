from pydantic import BaseModel, EmailStr

from app.models.seller import Marketplace


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    marketplace: Marketplace


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SellerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    marketplace: Marketplace

    model_config = {"from_attributes": True}
