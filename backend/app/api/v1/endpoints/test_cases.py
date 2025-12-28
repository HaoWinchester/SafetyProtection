"""
Test case management endpoints.

This module provides test case CRUD operations.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user_id
from app.schemas.evaluation import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
)
from app.schemas.common import SuccessResponse, MessageResponse
import uuid

router = APIRouter()


@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_test_case(
    case: TestCaseCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new test case.

    Args:
        case: Test case data
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Created test case
    """
    from app.models.evaluation import TestCase

    try:
        db_case = TestCase(
            case_id=f"case_{uuid.uuid4().hex[:16]}",
            category=case.category,
            attack_type=case.attack_type,
            evaluation_level=case.evaluation_level.value,
            prompt=case.prompt,
            expected_result=case.expected_result,
            severity=case.severity,
            description=case.description,
            tags=case.tags,
        )

        db.add(db_case)
        await db.commit()
        await db.refresh(db_case)

        return TestCaseResponse.model_validate(db_case)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create test case: {str(e)}",
        )


@router.get("/", response_model=List[TestCaseResponse])
async def list_test_cases(
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    attack_type: str = None,
    evaluation_level: str = None,
    is_active: bool = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    List test cases with filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records
        category: Filter by category
        attack_type: Filter by attack type
        evaluation_level: Filter by evaluation level
        is_active: Filter by active status
        db: Database session
        user_id: User ID from JWT token

    Returns:
        List of test cases
    """
    from app.models.evaluation import TestCase
    from sqlalchemy import select, and_

    try:
        query = select(TestCase)

        # Apply filters
        conditions = []
        if category:
            conditions.append(TestCase.category == category)
        if attack_type:
            conditions.append(TestCase.attack_type == attack_type)
        if evaluation_level:
            conditions.append(TestCase.evaluation_level == evaluation_level)
        if is_active is not None:
            conditions.append(TestCase.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(TestCase.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        cases = result.scalars().all()

        return [TestCaseResponse.model_validate(case) for case in cases]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list test cases: {str(e)}",
        )


@router.get("/{case_id}", response_model=TestCaseResponse)
async def get_test_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get test case by ID.

    Args:
        case_id: Test case ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Test case details
    """
    from app.models.evaluation import TestCase
    from sqlalchemy import select

    try:
        query = select(TestCase).where(TestCase.case_id == case_id)
        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )

        return TestCaseResponse.model_validate(case)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get test case: {str(e)}",
        )


@router.put("/{case_id}", response_model=TestCaseResponse)
async def update_test_case(
    case_id: str,
    case_update: TestCaseUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Update test case.

    Args:
        case_id: Test case ID
        case_update: Update data
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Updated test case
    """
    from app.models.evaluation import TestCase
    from sqlalchemy import select

    try:
        query = select(TestCase).where(TestCase.case_id == case_id)
        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )

        # Update fields
        update_data = case_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field == "evaluation_level" and value:
                setattr(case, field, value.value)
            else:
                setattr(case, field, value)

        # Update verified_by if marking as verified
        if case_update.is_verified and not case.verified_by:
            case.verified_by = user_id

        await db.commit()
        await db.refresh(case)

        return TestCaseResponse.model_validate(case)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update test case: {str(e)}",
        )


@router.delete("/{case_id}", response_model=MessageResponse)
async def delete_test_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Delete test case.

    Args:
        case_id: Test case ID
        db: Database session
        user_id: User ID from JWT token

    Returns:
        Success message
    """
    from app.models.evaluation import TestCase
    from sqlalchemy import select

    try:
        query = select(TestCase).where(TestCase.case_id == case_id)
        result = await db.execute(query)
        case = result.scalar_one_or_none()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )

        await db.delete(case)
        await db.commit()

        return MessageResponse(
            success=True,
            message="Test case deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete test case: {str(e)}",
        )
