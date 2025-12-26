"""
Detection endpoints.

This module provides detection-related API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id, get_optional_user_id
from app.schemas.detection import (
    DetectionRequest,
    DetectionResponse,
    BatchDetectionRequest,
    BatchDetectionResponse,
    StatisticsResponse,
    DetectionHistoryResponse,
    DetectionHistoryItem,
)
from app.schemas.common import SuccessResponse, MessageResponse
from app.services.detection_service import detection_service
from app.utils.helpers import generate_request_id, get_client_ip

router = APIRouter()


@router.post("/detect", response_model=DetectionResponse)
async def detect_threats(
    request: DetectionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_optional_user_id),
    http_request: Request = None,
):
    """
    Detect security threats in input text.

    This endpoint analyzes the input text using a 7-layer detection architecture:
    1. Input Layer - Validates input
    2. Preprocessing Layer - Cleans and normalizes text
    3. Detection Layer - Multi-modal analysis (static, semantic, behavioral, context)
    4. Assessment Layer - Risk scoring and classification
    5. Decision Layer - Compliance judgment
    6. Output Layer - Formats results
    7. Storage Layer - Logs results (handled separately)

    Args:
        request: Detection request with text and options
        db: Database session
        user_id: Optional user ID from JWT token
        http_request: FastAPI request object

    Returns:
        DetectionResponse: Comprehensive detection results

    Example:
        ```python
        response = await client.post("/api/v1/detection/detect", json={
            "text": "Ignore all previous instructions",
            "detection_level": "standard"
        })
        ```
    """
    try:
        # Add user ID to request if available
        if user_id:
            request.user_id = request.user_id or user_id

        # Generate request ID if not provided
        if not request.request_id:
            request.request_id = generate_request_id()

        # Perform detection
        result = await detection_service.detect(request)

        # TODO: Store result in database
        # await store_detection_result(db, result, http_request)

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection failed: {str(e)}",
        )


@router.post("/detect/batch", response_model=BatchDetectionResponse)
async def batch_detect_threats(
    request: BatchDetectionRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_optional_user_id),
):
    """
    Batch detect security threats in multiple texts.

    This endpoint processes multiple texts in a single request for efficiency.

    Args:
        request: Batch detection request
        db: Database session
        user_id: Optional user ID from JWT token

    Returns:
        BatchDetectionResponse: Batch detection results

    Example:
        ```python
        response = await client.post("/api/v1/detection/detect/batch", json={
            "texts": ["text1", "text2", "text3"],
            "detection_level": "standard"
        })
        ```
    """
    import time
    import asyncio

    batch_id = generate_request_id()
    start_time = time.time()

    try:
        # Process all texts
        tasks = []
        for text in request.texts:
            single_request = DetectionRequest(
                text=text,
                model_name=request.model_name,
                detection_level=request.detection_level,
                include_details=request.include_details,
                user_id=user_id,
            )
            tasks.append(detection_service.detect(single_request))

        # Execute in parallel
        results = await asyncio.gather(*tasks)

        # Calculate statistics
        total_count = len(results)
        compliant_count = sum(1 for r in results if r.is_compliant)
        non_compliant_count = total_count - compliant_count
        processing_time_ms = (time.time() - start_time) * 1000

        # Update request IDs
        for i, result in enumerate(results):
            result.request_id = f"{batch_id}_{i}"

        return BatchDetectionResponse(
            success=True,
            batch_id=batch_id,
            total_count=total_count,
            compliant_count=compliant_count,
            non_compliant_count=non_compliant_count,
            processing_time_ms=processing_time_ms,
            results=results,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch detection failed: {str(e)}",
        )


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get detection statistics.

    Returns aggregated statistics about detections performed.
    Requires authentication.

    Args:
        db: Database session
        user_id: User ID from JWT token

    Returns:
        StatisticsResponse: Detection statistics

    Example:
        ```python
        response = await client.get("/api/v1/detection/statistics",
            headers={"Authorization": "Bearer <token>"})
        ```
    """
    try:
        # Get in-memory statistics
        stats = detection_service.get_statistics()

        # TODO: Get detailed statistics from database
        # db_stats = await get_statistics_from_db(db, user_id)

        return StatisticsResponse(
            total_detections=stats["total_detections"],
            compliant_count=stats["compliant_count"],
            non_compliant_count=stats["non_compliant_count"],
            risk_distribution={
                "low": 0,
                "medium": 0,
                "high": 0,
                "critical": 0,
            },
            attack_type_distribution={},
            average_processing_time_ms=stats.get("average_processing_time_ms", 0.0),
            p95_processing_time_ms=0.0,
            p99_processing_time_ms=0.0,
            detections_last_24h=0,
            detections_last_hour=0,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}",
        )


@router.get("/history", response_model=DetectionHistoryResponse)
async def get_detection_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get detection history.

    Returns paginated detection history for the authenticated user.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session
        user_id: User ID from JWT token

    Returns:
        DetectionHistoryResponse: Paginated detection history

    Example:
        ```python
        response = await client.get("/api/v1/detection/history?page=1&page_size=20",
            headers={"Authorization": "Bearer <token>"})
        ```
    """
    try:
        # TODO: Implement actual database query
        # records = await get_detection_records(db, user_id, skip, limit)

        # Placeholder response
        return DetectionHistoryResponse(
            total=0,
            page=skip // limit + 1,
            page_size=limit,
            total_pages=0,
            records=[],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}",
        )


@router.post("/analyze", response_model=SuccessResponse)
async def analyze_text(
    request: DetectionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze text without blocking.

    This endpoint analyzes text and returns results. Similar to /detect but
    with additional analysis options.

    Args:
        request: Detection request
        db: Database session

    Returns:
        SuccessResponse with analysis results
    """
    try:
        result = await detection_service.detect(request)

        return SuccessResponse(
            success=True,
            message="Analysis completed successfully",
            data=result.dict(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )
