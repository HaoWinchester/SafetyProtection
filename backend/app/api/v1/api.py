"""
API router aggregation.

This module aggregates all API v1 routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import detection, health

# Create API v1 router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    detection.router,
    prefix="/detection",
    tags=["detection"]
)
