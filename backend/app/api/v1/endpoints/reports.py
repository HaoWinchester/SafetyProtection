"""
Report export endpoints.

This module provides report generation and export endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id
from app.services.report_generator import report_generator
from app.models.evaluation import EvaluationResult, EvaluationCaseResult
from sqlalchemy import select, and_

router = APIRouter()


@router.get("/reports/{evaluation_id}/html")
async def get_html_report(
    evaluation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate and download HTML report.

    Args:
        evaluation_id: Evaluation ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        HTML report as downloadable file
    """
    try:
        # Get evaluation
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
        case_results = list(case_result.scalars().all())

        # Generate HTML report
        html = await report_generator.generate_html_report(
            evaluation=evaluation,
            case_results=case_results,
            config_name="测试模型"  # TODO: Get from config
        )

        return Response(
            content=html,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename=report_{evaluation_id}.html"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate HTML report: {str(e)}",
        )


@router.get("/reports/{evaluation_id}/json")
async def get_json_report(
    evaluation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate and download JSON report.

    Args:
        evaluation_id: Evaluation ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        JSON report as downloadable file
    """
    try:
        # Get evaluation
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
        case_results = list(case_result.scalars().all())

        # Generate JSON report
        json_str = await report_generator.generate_json_report(
            evaluation=evaluation,
            case_results=case_results,
            config_name="测试模型"
        )

        return Response(
            content=json_str,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=report_{evaluation_id}.json"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate JSON report: {str(e)}",
        )


@router.get("/reports/{evaluation_id}/text")
async def get_text_report(
    evaluation_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate and download text report.

    Args:
        evaluation_id: Evaluation ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Text report as downloadable file
    """
    try:
        # Get evaluation
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
        case_results = list(case_result.scalars().all())

        # Generate text report
        text = await report_generator.generate_text_report(
            evaluation=evaluation,
            case_results=case_results,
            config_name="测试模型"
        )

        return Response(
            content=text,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=report_{evaluation_id}.txt"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate text report: {str(e)}",
        )
