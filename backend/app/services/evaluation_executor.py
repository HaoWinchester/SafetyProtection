"""
Evaluation executor service.

This module handles the execution of security evaluations.
"""
import asyncio
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.evaluation import (
    EvaluationConfig,
    TestCase,
    EvaluationResult,
    EvaluationCaseResult,
    EvaluationStatus
)
from app.services.model_client import ModelClient, MockModelClient
from app.services.detection_service import detection_service
from app.schemas.detection import DetectionRequest


class EvaluationExecutor:
    """
    Evaluation execution engine.

    Executes test cases against LLM and performs security detection.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize executor.

        Args:
            db: Database session
        """
        self.db = db

    async def start_evaluation(
        self,
        evaluation_id: str,
        config: EvaluationConfig,
        evaluation_level: str
    ) -> str:
        """
        Start evaluation execution.

        Args:
            evaluation_id: Evaluation ID
            config: Evaluation configuration
            evaluation_level: Evaluation level override

        Returns:
            Evaluation task ID
        """
        try:
            # Update status to running
            evaluation = await self._get_evaluation_result(evaluation_id)
            if not evaluation:
                raise ValueError(f"Evaluation {evaluation_id} not found")

            evaluation.status = EvaluationStatus.RUNNING
            evaluation.started_at = datetime.now()
            await self.db.commit()

            # Load test cases
            test_cases = await self._load_test_cases(
                evaluation_level or config.evaluation_level
            )

            if not test_cases:
                raise ValueError(f"No test cases found for level {evaluation_level}")

            # Update total cases
            evaluation.total_cases = len(test_cases)
            await self.db.commit()

            # Execute test cases (in background)
            task_id = str(uuid.uuid4())
            asyncio.create_task(
                self._execute_evaluation(
                    evaluation_id,
                    config,
                    test_cases
                )
            )

            return task_id

        except Exception as e:
            # Update status to failed
            evaluation = await self._get_evaluation_result(evaluation_id)
            if evaluation:
                evaluation.status = EvaluationStatus.FAILED
                evaluation.error_message = str(e)
                await self.db.commit()

            raise

    async def _execute_evaluation(
        self,
        evaluation_id: str,
        config: EvaluationConfig,
        test_cases: List[TestCase]
    ):
        """
        Execute all test cases.

        Args:
            evaluation_id: Evaluation ID
            config: Configuration
            test_cases: List of test cases to execute
        """
        evaluation = await self._get_evaluation_result(evaluation_id)

        try:
            # Create model client
            # For MVP, use mock client if no real API key
            if config.api_key and config.api_endpoint != "mock":
                client = ModelClient(
                    model_type=config.model_type,
                    api_endpoint=config.api_endpoint,
                    api_key=config.api_key,
                    timeout_ms=config.timeout_ms,
                    max_retries=config.max_retries
                )
            else:
                # Use mock client for testing
                client = MockModelClient(
                    model_type="mock",
                    api_endpoint="mock",
                    timeout_ms=config.timeout_ms,
                    max_retries=config.max_retries
                )

            # Execute test cases with concurrency control
            semaphore = asyncio.Semaphore(config.concurrent_requests)

            tasks = []
            for test_case in test_cases:
                task = self._execute_single_case(
                    semaphore,
                    evaluation_id,
                    test_case,
                    client
                )
                tasks.append(task)

            # Wait for all tasks to complete
            await asyncio.gather(*tasks, return_exceptions=True)

            # Update final status
            await self._finalize_evaluation(evaluation_id)

        except Exception as e:
            evaluation.status = EvaluationStatus.FAILED
            evaluation.error_message = str(e)
            await self.db.commit()

    async def _execute_single_case(
        self,
        semaphore: asyncio.Semaphore,
        evaluation_id: int,
        test_case: TestCase,
        client: ModelClient
    ):
        """
        Execute a single test case.

        Args:
            semaphore: Concurrency control semaphore
            evaluation_id: Evaluation database ID
            test_case: Test case to execute
            client: Model client
        """
        async with semaphore:
            start_time = datetime.now()

            try:
                # Send request to model
                model_response = await client.send_request(
                    prompt=test_case.prompt
                )

                # Check if model request succeeded
                if not model_response.get("success"):
                    # Model failed
                    await self._save_case_result(
                        evaluation_id=evaluation_id,
                        case_id=test_case.id,
                        model_response=None,
                        is_passed=None,
                        risk_score=None,
                        detection_details={},
                        processing_time_ms=model_response.get("latency_ms", 0),
                        error_message=model_response.get("error", "Model request failed")
                    )
                    return

                # Perform security detection on model response
                detection_request = DetectionRequest(
                    text=model_response["response"],
                    detection_level="standard",
                    include_details=True
                )

                detection_result = await detection_service.detect(detection_request)

                # Determine if test passed (model was secure)
                # Passed if: detection says compliant (safe) OR
                #          expected result matches actual
                expected_safe = test_case.expected_result == "SAFE_PASS"
                actual_safe = detection_result.is_compliant

                # Test passes if model response is safe when expected to be safe
                # or if attack is detected when expected to be attack
                is_passed = (expected_safe and actual_safe) or \
                           (not expected_safe and not actual_safe)

                # Save result
                await self._save_case_result(
                    evaluation_id=evaluation_id,
                    case_id=test_case.id,
                    model_response=model_response["response"],
                    is_passed=is_passed,
                    risk_score=detection_result.risk_score,
                    detection_details=detection_result.detection_details.dict() if detection_result.detection_details else {},
                    processing_time_ms=model_response.get("latency_ms", 0) + detection_result.processing_time_ms,
                    error_message=None
                )

                # Update evaluation counters
                await self._update_evaluation_counters(
                    evaluation_id,
                    is_passed
                )

            except Exception as e:
                # Save error result
                await self._save_case_result(
                    evaluation_id=evaluation_id,
                    case_id=test_case.id,
                    model_response=None,
                    is_passed=None,
                    risk_score=None,
                    detection_details={},
                    processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000,
                    error_message=str(e)
                )

    async def _save_case_result(
        self,
        evaluation_id: int,
        case_id: int,
        model_response: Optional[str],
        is_passed: Optional[bool],
        risk_score: Optional[float],
        detection_details: Dict[str, Any],
        processing_time_ms: float,
        error_message: Optional[str]
    ):
        """Save test case result to database."""
        case_result = EvaluationCaseResult(
            result_id=f"result_{uuid.uuid4().hex[:16]}",
            evaluation_id=evaluation_id,
            case_id=case_id,
            model_response=model_response,
            is_passed=is_passed,
            risk_score=float(risk_score) if risk_score is not None else None,
            risk_level=None,  # Will be calculated later
            threat_category=None,  # Will be calculated later
            detection_details=detection_details,
            processing_time_ms=processing_time_ms,
            error_message=error_message
        )

        self.db.add(case_result)
        await self.db.commit()

    async def _update_evaluation_counters(self, evaluation_id: int, is_passed: bool):
        """Update evaluation pass/fail counters."""
        evaluation = await self._get_evaluation_result_by_db_id(evaluation_id)
        if evaluation:
            evaluation.executed_cases += 1
            if is_passed:
                evaluation.passed_cases += 1
            else:
                evaluation.failed_cases += 1
            await self.db.commit()

    async def _finalize_evaluation(self, evaluation_id: str):
        """
        Finalize evaluation and calculate scores.

        Args:
            evaluation_id: Evaluation ID
        """
        from app.services.evaluation_assessor import EvaluationAssessor

        evaluation = await self._get_evaluation_result(evaluation_id)
        if not evaluation:
            return

        try:
            # Get all case results
            case_results = await self._get_case_results(evaluation.id)

            # Calculate safety score using assessor
            assessor = EvaluationAssessor()
            scores = assessor.calculate_safety_score(case_results)

            # Update evaluation
            evaluation.status = EvaluationStatus.COMPLETED
            evaluation.completed_at = datetime.now()
            evaluation.safety_score = scores["safety_score"]
            evaluation.safety_level = scores["safety_level"]
            evaluation.attack_distribution = scores.get("attack_distribution", {})
            evaluation.risk_distribution = scores.get("risk_distribution", {})

            await self.db.commit()

        except Exception as e:
            evaluation.status = EvaluationStatus.FAILED
            evaluation.error_message = f"Failed to finalize: {str(e)}"
            await self.db.commit()

    async def _get_evaluation_result(self, evaluation_id: str) -> Optional[EvaluationResult]:
        """Get evaluation result by evaluation ID."""
        query = select(EvaluationResult).where(
            EvaluationResult.evaluation_id == evaluation_id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _get_evaluation_result_by_db_id(self, db_id: int) -> Optional[EvaluationResult]:
        """Get evaluation result by database ID."""
        query = select(EvaluationResult).where(EvaluationResult.id == db_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _load_test_cases(self, level: str) -> List[TestCase]:
        """Load test cases for given level."""
        query = select(TestCase).where(
            and_(
                TestCase.evaluation_level == level,
                TestCase.is_active == True
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def _get_case_results(self, evaluation_db_id: int) -> List[EvaluationCaseResult]:
        """Get all case results for an evaluation."""
        query = select(EvaluationCaseResult).where(
            EvaluationCaseResult.evaluation_id == evaluation_db_id
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())


# Singleton instance (will be created per request)
def create_executor(db: AsyncSession) -> EvaluationExecutor:
    """Create evaluation executor instance."""
    return EvaluationExecutor(db)
