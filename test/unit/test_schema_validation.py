from __future__ import annotations

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.auth import (
    AdminLoginRequest,
    BuyerRegisterRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RegisterMethod,
    RoleLoginRequest,
    SellerRegisterRequest,
)
from app.schemas.order import DirectOrderCreate, ReceiverSnapshot
from app.schemas.product import ProductCreate, ProductImageCreate, ProductSkuCreate
from app.schemas.wallet import WalletRechargeRequest
from app.models.enums import UserRole


pytestmark = pytest.mark.unit


def test_buyer_register_normalizes_email_and_enforces_contact_method() -> None:
    payload = BuyerRegisterRequest(
        username="Buyer123",
        password="Password123",
        register_method=RegisterMethod.EMAIL,
        email="  USER@Example.COM  ",
    )

    assert payload.email == "user@example.com"
    assert payload.phone is None

    with pytest.raises(ValidationError):
        BuyerRegisterRequest(
            username="Buyer123",
            password="Password123",
            register_method=RegisterMethod.PHONE,
            email="user@example.com",
        )


def test_password_reset_rejects_admin_and_normalizes_email_identifier() -> None:
    payload = PasswordResetRequest(role=UserRole.BUYER, method=RegisterMethod.EMAIL, identifier="User@Example.COM")

    assert payload.identifier == "user@example.com"

    with pytest.raises(ValidationError):
        PasswordResetRequest(role=UserRole.ADMIN, method=RegisterMethod.EMAIL, identifier="admin@example.com")


def test_order_and_wallet_requests_validate_idempotency_and_amounts() -> None:
    receiver = ReceiverSnapshot(
        receiver_name="Buyer",
        receiver_phone="13800000000",
        province="Zhejiang",
        city="Hangzhou",
        district="Xihu",
        detail="Road 1",
    )
    order = DirectOrderCreate(
        idempotency_key="direct-001",
        receiver_snapshot=receiver,
        sku_id=1,
        quantity=2,
    )

    assert order.quantity == 2
    assert order.receiver_snapshot.city == "Hangzhou"

    with pytest.raises(ValidationError):
        DirectOrderCreate(idempotency_key="bad key", receiver_snapshot=receiver, sku_id=1)
    with pytest.raises(ValidationError):
        WalletRechargeRequest(amount=Decimal("0"), idempotency_key="recharge-001")


def test_product_create_limits_images_and_sku_linked_images() -> None:
    sku = ProductSkuCreate(spec_name="500g", unit="pack", price=Decimal("8.80"), stock_available=10)

    with pytest.raises(ValidationError):
        ProductCreate(
            category_id=1,
            name="Tomato",
            skus=[sku],
            images=[ProductImageCreate(image_url=f"/media/{index}.png") for index in range(13)],
        )

    with pytest.raises(ValidationError):
        ProductCreate(
            category_id=1,
            name="Tomato",
            skus=[sku],
            images=[ProductImageCreate(image_url="/media/sku.png", sku_id=1)],
        )


def test_password_strength_rejects_weak_passwords() -> None:
    """All password schemas must reject passwords missing uppercase, lowercase, or digits."""
    weak_passwords = [
        "alllowercase1",   # no uppercase
        "ALLUPPERCASE1",   # no lowercase
        "NoDigitsHere",    # no digit
        "12345678",        # only digits
        "abcdefgh",        # only lowercase
        "ABCDEFGH",        # only uppercase
    ]
    for pw in weak_passwords:
        with pytest.raises(ValidationError, match="password must contain"):
            BuyerRegisterRequest(
                username="TestUser1",
                password=pw,
                register_method=RegisterMethod.PHONE,
                phone="13800000000",
            )

    for pw in weak_passwords:
        with pytest.raises(ValidationError, match="password must contain"):
            SellerRegisterRequest(
                shop_name="Test Shop",
                username="TestSeller1",
                contact_name="Zhang San",
                phone="13900000000",
                password=pw,
            )

    for pw in weak_passwords:
        with pytest.raises(ValidationError, match="password must contain"):
            RoleLoginRequest(identifier="user1", password=pw)

    for pw in weak_passwords:
        with pytest.raises(ValidationError, match="password must contain"):
            AdminLoginRequest(username="admin", password=pw)

    for pw in weak_passwords:
        with pytest.raises(ValidationError, match="password must contain"):
            PasswordResetConfirmRequest(reset_token="a" * 20, new_password=pw)


def test_password_strength_accepts_strong_password() -> None:
    """A password with uppercase, lowercase, and digit should pass."""
    payload = BuyerRegisterRequest(
        username="TestUser1",
        password="StrongPass1",
        register_method=RegisterMethod.PHONE,
        phone="13800000000",
    )
    assert payload.password == "StrongPass1"
