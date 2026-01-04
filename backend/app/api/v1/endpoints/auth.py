"""
Authentication API endpoints.
"""
import uuid
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_

from app.core.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_admin_user,
    check_quota_availability,
    deduct_user_quota
)
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, Order, Package, DetectionUsage
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserProfile,
    Token,
    PackageCreate,
    PackageResponse,
    OrderCreate,
    OrderResponse,
    OrderListResponse,
    QuotaInfo,
    QuotaUpdate
)

router = APIRouter()


# ===== Authentication Endpoints =====

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        UserResponse: Created user information

    Raises:
        HTTPException: If email or username already exists
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:16]}"
    new_user = User(
        user_id=user_id,
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        company=user_data.company,
        role=user_data.role,
        is_active=True,
        is_verified=False,  # Require email verification
        remaining_quota=10,  # Give free trial quota
        total_quota=10
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.

    Args:
        user_credentials: Login credentials
        db: Database session

    Returns:
        Token: Access token and user information

    Raises:
        HTTPException: If authentication fails
    """
    user = authenticate_user(db, user_credentials.username, user_credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.user_id,
            "username": user.username,
            "role": user.role
        },
        expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user profile with statistics.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        UserProfile: Extended user profile with statistics
    """
    # Get total orders
    total_orders = db.query(func.count(Order.id)).filter(
        Order.user_id == current_user.user_id,
        Order.status == "paid"
    ).scalar() or 0

    # Get total detections
    total_detections = db.query(func.count(DetectionUsage.id)).filter(
        DetectionUsage.user_id == current_user.user_id
    ).scalar() or 0

    return UserProfile(
        **current_user.__dict__,
        total_orders=total_orders,
        total_detections=total_detections
    )


@router.get("/quota", response_model=QuotaInfo)
async def get_user_quota(current_user: User = Depends(get_current_active_user)):
    """
    Get user quota information.

    Args:
        current_user: Authenticated user

    Returns:
        QuotaInfo: Quota details
    """
    used_quota = current_user.total_quota - current_user.remaining_quota
    quota_percentage = (used_quota / current_user.total_quota * 100) if current_user.total_quota > 0 else 0

    return QuotaInfo(
        remaining_quota=current_user.remaining_quota,
        total_quota=current_user.total_quota,
        used_quota=used_quota,
        quota_percentage=round(quota_percentage, 2)
    )


# ===== Package Management (Admin Only) =====

@router.get("/packages", response_model=List[PackageResponse])
async def get_packages(
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get available packages.

    Args:
        is_active: Filter by active status
        db: Database session

    Returns:
        List of available packages
    """
    packages = db.query(Package).filter(Package.is_active == is_active).all()
    return packages


@router.post("/packages", response_model=PackageResponse)
async def create_package(
    package_data: PackageCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new package (admin only).

    Args:
        package_data: Package creation data
        current_user: Authenticated admin user
        db: Database session

    Returns:
        PackageResponse: Created package
    """
    package_id = f"pkg_{uuid.uuid4().hex[:16]}"
    new_package = Package(
        package_id=package_id,
        **package_data.model_dump()
    )

    db.add(new_package)
    db.commit()
    db.refresh(new_package)

    return new_package


# ===== Order Management =====

@router.post("/orders", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new order for purchasing quota.

    Args:
        order_data: Order creation data
        current_user: Authenticated user
        db: Database session

    Returns:
        OrderResponse: Created order
    """
    # Get package details
    package = db.query(Package).filter(Package.package_id == order_data.package_id).first()
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    if not package.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Package is not available"
        )

    # Create order
    order_id = f"order_{uuid.uuid4().hex[:16]}"
    new_order = Order(
        order_id=order_id,
        user_id=current_user.user_id,
        package_name=package.package_name,
        quota_amount=package.quota_amount,
        price=package.price,
        status="pending",
        payment_method=order_data.payment_method
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/orders", response_model=OrderListResponse)
async def get_user_orders(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's order history.

    Args:
        page: Page number
        page_size: Items per page
        current_user: Authenticated user
        db: Database session

    Returns:
        OrderListResponse: Paginated order list
    """
    offset = (page - 1) * page_size

    # Get total count
    total = db.query(func.count(Order.id)).filter(
        Order.user_id == current_user.user_id
    ).scalar() or 0

    # Get orders
    orders = db.query(Order).filter(
        Order.user_id == current_user.user_id
    ).order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()

    return OrderListResponse(
        orders=orders,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/orders/{order_id}/pay")
async def pay_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Process order payment (mock implementation).

    Args:
        order_id: Order ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Payment result
    """
    order = db.query(Order).filter(
        Order.order_id == order_id,
        Order.user_id == current_user.user_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )

    # Mock payment processing - in production, integrate with payment gateway
    order.status = "paid"
    order.paid_at = datetime.utcnow()
    order.transaction_id = f"txn_{uuid.uuid4().hex[:16]}"

    # Update user quota
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    user.remaining_quota += order.quota_amount
    user.total_quota += order.quota_amount

    db.commit()
    db.refresh(order)

    return {
        "message": "Payment successful",
        "order_id": order_id,
        "quota_added": order.quota_amount,
        "new_balance": user.remaining_quota
    }


# ===== Admin User Management =====

@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only).

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_admin: Authenticated admin user
        db: Database session

    Returns:
        List of users
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.patch("/admin/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    quota_update: QuotaUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user quota (admin only).

    Args:
        user_id: User ID
        quota_update: Quota update data
        current_admin: Authenticated admin user
        db: Database session

    Returns:
        Update result
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.remaining_quota += quota_update.amount
    user.total_quota += quota_update.amount

    db.commit()

    return {
        "message": "Quota updated successfully",
        "user_id": user_id,
        "amount_added": quota_update.amount,
        "new_balance": user.remaining_quota,
        "reason": quota_update.reason
    }
