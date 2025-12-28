"""
Evaluation endpoints.

This module provides evaluation-related API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id, get_optional_user_id
from app.schemas.evaluation import (
    EvaluationConfigCreate,
    EvaluationConfigUpdate,
    EvaluationConfigResponse,
    EvaluationStartRequest,
    EvaluationResultResponse,
    EvaluationProgressResponse,
    EvaluationFullResult,
    CaseResultDetail,
)
from app.models.evaluation import EvaluationCaseResult as EvaluationCaseResultModel
from app.schemas.common import SuccessResponse, MessageResponse
from app.utils.helpers import generate_config_id
import uuid
import app.schemas.evaluation

router = APIRouter()


# ============== Evaluation Config Management ==============

@router.post("/configs", response_model=EvaluationConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_evaluation_config(
    config: EvaluationConfigCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new evaluation configuration.

    Args:
        config: Configuration data
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Created configuration
    """
    from app.models.evaluation import EvaluationConfig

    try:
        # Create configuration
        db_config = EvaluationConfig(
            config_id=generate_config_id(),
            user_id=user_id,
            model_name=config.model_name,
            model_type=config.model_type,
            api_endpoint=config.api_endpoint,
            api_key=config.api_key,  # TODO: Encrypt this
            evaluation_level=config.evaluation_level.value,
            concurrent_requests=config.concurrent_requests,
            timeout_ms=config.timeout_ms,
            max_retries=config.max_retries,
            description=config.description,
        )

        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)

        return EvaluationConfigResponse.model_validate(db_config)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create configuration: {str(e)}",
        )


@router.get("/configs", response_model=List[EvaluationConfigResponse])
async def list_evaluation_configs(
    skip: int = 0,
    limit: int = 20,
    is_active: bool = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    List evaluation configurations.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_active: Optional filter by active status
        db: Database session
        user_id: User ID from JWT token

    Returns:
        List of configurations
    """
    from app.models.evaluation import EvaluationConfig
    from sqlalchemy import select, and_

    try:
        query = select(EvaluationConfig).where(EvaluationConfig.user_id == user_id)

        if is_active is not None:
            query = query.where(EvaluationConfig.is_active == is_active)

        query = query.order_by(EvaluationConfig.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        configs = result.scalars().all()

        return [EvaluationConfigResponse.model_validate(config) for config in configs]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list configurations: {str(e)}",
        )


@router.get("/configs/{config_id}", response_model=EvaluationConfigResponse)
async def get_evaluation_config(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get evaluation configuration by ID.

    Args:
        config_id: Configuration ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Configuration details
    """
    from app.models.evaluation import EvaluationConfig
    from sqlalchemy import select

    try:
        query = select(EvaluationConfig).where(
            and_(
                EvaluationConfig.config_id == config_id,
                EvaluationConfig.user_id == user_id
            )
        )

        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )

        return EvaluationConfigResponse.model_validate(config)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get configuration: {str(e)}",
        )


@router.put("/configs/{config_id}", response_model=EvaluationConfigResponse)
async def update_evaluation_config(
    config_id: str,
    config_update: EvaluationConfigUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Update evaluation configuration.

    Args:
        config_id: Configuration ID
        config_update: Update data
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Updated configuration
    """
    from app.models.evaluation import EvaluationConfig
    from sqlalchemy import select, and_

    try:
        # Get existing config
        query = select(EvaluationConfig).where(
            and_(
                EvaluationConfig.config_id == config_id,
                EvaluationConfig.user_id == user_id
            )
        )

        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )

        # Update fields
        update_data = config_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field == "evaluation_level" and value:
                setattr(config, field, value.value)
            else:
                setattr(config, field, value)

        await db.commit()
        await db.refresh(config)

        return EvaluationConfigResponse.model_validate(config)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}",
        )


@router.delete("/configs/{config_id}", response_model=MessageResponse)
async def delete_evaluation_config(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Delete evaluation configuration.

    Args:
        config_id: Configuration ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Success message
    """
    from app.models.evaluation import EvaluationConfig
    from sqlalchemy import select, and_

    try:
        # Get config
        query = select(EvaluationConfig).where(
            and_(
                EvaluationConfig.config_id == config_id,
                EvaluationConfig.user_id == user_id
            )
        )

        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )

        await db.delete(config)
        await db.commit()

        return MessageResponse(
            success=True,
            message="Configuration deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete configuration: {str(e)}",
        )


# ============== Evaluation Execution ==============

@router.post("/start", response_model=EvaluationResultResponse, status_code=status.HTTP_201_CREATED)
async def start_evaluation(
    request: EvaluationStartRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Start a new security evaluation.

    This will create an evaluation task and execute it asynchronously.

    Args:
        request: Evaluation start request
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Created evaluation result
    """
    from app.models.evaluation import EvaluationResult, EvaluationConfig
    from sqlalchemy import select, and_
    import asyncio

    try:
        # Get configuration
        query = select(EvaluationConfig).where(
            and_(
                EvaluationConfig.config_id == request.config_id,
                EvaluationConfig.user_id == user_id,
                EvaluationConfig.is_active == True
            )
        )

        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active configuration not found"
            )

        # Create evaluation result
        evaluation_id = f"eval_{uuid.uuid4().hex}"

        db_result = EvaluationResult(
            evaluation_id=evaluation_id,
            config_id=config.id,
            user_id=user_id,
            status="pending",
            total_cases=0,
            executed_cases=0,
            passed_cases=0,
            failed_cases=0,
        )

        db.add(db_result)
        await db.commit()
        await db.refresh(db_result)

        # TODO: Start async evaluation task
        # asyncio.create_task(run_evaluation(evaluation_id, config, request, db))

        return EvaluationResultResponse.model_validate(db_result)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start evaluation: {str(e)}",
        )


@router.get("/results/{evaluation_id}", response_model=EvaluationFullResult)
async def get_evaluation_result(
    evaluation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get evaluation result with all case details.

    Args:
        evaluation_id: Evaluation ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Complete evaluation result
    """
    from app.models.evaluation import EvaluationResult, EvaluationCaseResult
    from sqlalchemy import select, and_

    try:
        # Get evaluation result
        eval_query = select(EvaluationResult).where(
            and_(
                EvaluationResult.evaluation_id == evaluation_id,
                EvaluationResult.user_id == user_id
            )
        )

        eval_result = await db.execute(eval_query)
        evaluation = eval_result.scalar_one_or_none()

        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )

        # Get case results
        case_query = select(EvaluationCaseResult).where(
            EvaluationCaseResult.evaluation_id == evaluation.id
        )

        case_result = await db.execute(case_query)
        case_results = case_result.scalars().all()

        return EvaluationFullResult(
            evaluation=EvaluationResultResponse.model_validate(evaluation),
            case_results=[
                app.schemas.evaluation.CaseResultDetail.model_validate(cr)
                for cr in case_results
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get evaluation result: {str(e)}",
        )


@router.get("/results", response_model=List[EvaluationResultResponse])
async def list_evaluation_results(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    List evaluation results.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records
        status: Optional status filter
        db: Database session
        user_id: User ID from JWT token

    Returns:
        List of evaluation results
    """
    from app.models.evaluation import EvaluationResult
    from sqlalchemy import select, and_

    try:
        query = select(EvaluationResult).where(EvaluationResult.user_id == user_id)

        if status:
            query = query.where(EvaluationResult.status == status)

        query = query.order_by(EvaluationResult.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        results = result.scalars().all()

        return [EvaluationResultResponse.model_validate(r) for r in results]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list evaluation results: {str(e)}",
        )


@router.get("/progress/{evaluation_id}", response_model=EvaluationProgressResponse)
async def get_evaluation_progress(
    evaluation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get evaluation progress.

    Args:
        evaluation_id: Evaluation ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Evaluation progress
    """
    from app.models.evaluation import EvaluationResult
    from sqlalchemy import select, and_

    try:
        query = select(EvaluationResult).where(
            and_(
                EvaluationResult.evaluation_id == evaluation_id,
                EvaluationResult.user_id == user_id
            )
        )

        result = await db.execute(query)
        evaluation = result.scalar_one_or_none()

        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )

        progress = 0.0
        if evaluation.total_cases > 0:
            progress = (evaluation.executed_cases / evaluation.total_cases) * 100

        return EvaluationProgressResponse(
            evaluation_id=evaluation.evaluation_id,
            status=evaluation.status,
            total_cases=evaluation.total_cases,
            executed_cases=evaluation.executed_cases,
            passed_cases=evaluation.passed_cases,
            failed_cases=evaluation.failed_cases,
            progress_percentage=progress,
            started_at=evaluation.started_at,
            estimated_completion=None,  # TODO: Calculate
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get evaluation progress: {str(e)}",
        )
