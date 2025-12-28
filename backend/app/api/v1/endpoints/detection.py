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
from app.services.persistence_service import persistence_service
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

        # Store result in database
        try:
            ip_address = get_client_ip(http_request) if http_request else None
            user_agent = http_request.headers.get("user-agent") if http_request else None

            await persistence_service.store_detection_result(
                db=db,
                result=result,
                request=request,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception as db_error:
            # Log error but don't fail the request
            import logging
            logging.getLogger(__name__).warning(f"Failed to store detection result: {db_error}")

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
    start: str = None,
    end: str = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_optional_user_id),
):
    """
    Get detection statistics.

    Returns aggregated statistics about detections performed.

    Args:
        start: Optional start date (ISO format)
        end: Optional end date (ISO format)
        db: Database session
        user_id: Optional user ID from JWT token

    Returns:
        StatisticsResponse: Detection statistics

    Example:
        ```python
        response = await client.get("/api/v1/detection/statistics")
        ```
    """
    from datetime import datetime, timedelta

    try:
        # Parse date filters
        start_date = None
        end_date = None

        if start:
            try:
                start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
            except ValueError:
                pass

        if end:
            try:
                end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
            except ValueError:
                pass

        # Get statistics from database
        db_stats = await persistence_service.get_statistics_from_db(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )

        # Get in-memory stats for processing time metrics
        mem_stats = detection_service.get_statistics()

        # Calculate risk distribution
        risk_dist = db_stats.get("risk_distribution", {})

        return StatisticsResponse(
            total_detections=db_stats["total_detections"],
            compliant_count=db_stats["compliant_count"],
            non_compliant_count=db_stats["non_compliant_count"],
            risk_distribution={
                "low": risk_dist.get("low", 0),
                "medium": risk_dist.get("medium", 0),
                "high": risk_dist.get("high", 0),
                "critical": risk_dist.get("critical", 0),
            },
            attack_type_distribution=db_stats.get("attack_distribution", {}),
            average_processing_time_ms=mem_stats.get("average_processing_time_ms", 0.0),
            p95_processing_time_ms=0.0,  # TODO: Calculate from database
            p99_processing_time_ms=0.0,  # TODO: Calculate from database
            detections_last_24h=0,  # TODO: Calculate from database
            detections_last_hour=0,  # TODO: Calculate from database
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
    risk_level: str = None,
    start: str = None,
    end: str = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_optional_user_id),
):
    """
    Get detection history.

    Returns paginated detection history for the authenticated user.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        risk_level: Optional risk level filter
        start: Optional start date (ISO format)
        end: Optional end date (ISO format)
        db: Database session
        user_id: User ID from JWT token (optional)

    Returns:
        DetectionHistoryResponse: Paginated detection history

    Example:
        ```python
        response = await client.get("/api/v1/detection/history?skip=0&limit=20",
            headers={"Authorization": "Bearer <token>"})
        ```
    """
    from datetime import datetime

    try:
        # Parse date filters
        start_date = None
        end_date = None

        if start:
            try:
                start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
            except ValueError:
                pass

        if end:
            try:
                end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
            except ValueError:
                pass

        # Query database
        history_data = await persistence_service.get_detection_history(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            risk_level=risk_level,
            limit=limit,
            offset=skip
        )

        # Convert to response format
        records = [
            DetectionHistoryItem(**record)
            for record in history_data["history"]
        ]

        return DetectionHistoryResponse(
            total=history_data["total"],
            page=skip // limit + 1 if limit > 0 else 1,
            page_size=limit,
            total_pages=(history_data["total"] + limit - 1) // limit if limit > 0 else 0,
            records=records,
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
