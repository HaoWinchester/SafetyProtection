"""
Persistence service for storing and retrieving detection data.

This module handles all database operations for detection records,
violation records, and statistics.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.detection import DetectionRecord, ViolationRecord, DetectionRule
from app.schemas.detection import DetectionResponse, DetectionRequest
import hashlib
import json


class PersistenceService:
    """Service for persisting and retrieving detection data."""

    @staticmethod
    def compute_text_hash(text: str) -> str:
        """Compute SHA256 hash of input text."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    async def store_detection_result(
        self,
        db: AsyncSession,
        result: DetectionResponse,
        request: DetectionRequest,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> DetectionRecord:
        """
        Store detection result to database.

        Args:
            db: Database session
            result: Detection response object
            request: Detection request object
            user_id: Optional user ID
            ip_address: Optional IP address
            user_agent: Optional user agent string

        Returns:
            Created DetectionRecord
        """
        # Create detection record
        record = DetectionRecord(
            request_id=result.request_id,
            user_id=user_id,
            input_text=request.text,
            input_hash=self.compute_text_hash(request.text),
            is_compliant=result.is_compliant,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            confidence=result.confidence,
            threat_category=result.threat_category,
            attack_types=result.attack_types or {},
            detection_details=result.detection_details.dict() if result.detection_details else {},
            processing_time_ms=result.processing_time_ms,
            layer_results=result.layer_results.dict() if result.layer_results else {},
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.add(record)
        await db.flush()  # Get the ID without committing

        # Store violation records if non-compliant
        if not result.is_compliant and result.detection_details:
            await self._store_violations(
                db,
                record.id,
                result.detection_details.dict(),
                result.threat_category
            )

        await db.commit()
        await db.refresh(record)

        return record

    async def _store_violations(
        self,
        db: AsyncSession,
        detection_record_id: int,
        detection_details: Dict[str, Any],
        threat_category: Optional[str]
    ):
        """Store violation records from detection details."""
        violations_to_create = []

        # Check static detection violations
        static_results = detection_details.get('static_detection', {})
        if static_results.get('matched_patterns'):
            for pattern in static_results['matched_patterns']:
                violation = ViolationRecord(
                    violation_id=self._generate_violation_id(),
                    detection_record_id=detection_record_id,
                    violation_type="STATIC_PATTERN_MATCH",
                    severity=static_results.get('severity', 'medium'),
                    matched_pattern=pattern.get('pattern', ''),
                    context=pattern.get('context', ''),
                    description=f"Static detection matched: {pattern.get('description', '')}",
                    confidence_score=pattern.get('confidence', 0.8)
                )
                violations_to_create.append(violation)

        # Check semantic violations
        semantic_results = detection_details.get('semantic_analysis', {})
        if semantic_results.get('is_suspicious'):
            violation = ViolationRecord(
                violation_id=self._generate_violation_id(),
                detection_record_id=detection_record_id,
                violation_type="SEMANTIC_ANOMALY",
                severity=semantic_results.get('severity', 'medium'),
                context=semantic_results.get('explanation', ''),
                description=f"Semantic analysis detected suspicious content",
                confidence_score=semantic_results.get('suspicion_score', 0.5)
            )
            violations_to_create.append(violation)

        # Check behavioral violations
        behavioral_results = detection_details.get('behavioral_analysis', {})
        if behavioral_results.get('is_malicious'):
            violation = ViolationRecord(
                violation_id=self._generate_violation_id(),
                detection_record_id=detection_record_id,
                violation_type="BEHAVIORAL_ATTACK",
                severity=behavioral_results.get('severity', 'high'),
                context=behavioral_results.get('attack_pattern', ''),
                description=f"Behavioral analysis detected attack pattern",
                confidence_score=behavioral_results.get('malice_score', 0.7)
            )
            violations_to_create.append(violation)

        # Add all violations
        for violation in violations_to_create:
            db.add(violation)

    def _generate_violation_id(self) -> str:
        """Generate unique violation ID."""
        import uuid
        return f"violation_{uuid.uuid4().hex[:16]}"

    async def get_detection_history(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        risk_level: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Query detection history with filters.

        Args:
            db: Database session
            user_id: Optional user ID filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            risk_level: Optional risk level filter
            limit: Maximum number of records
            offset: Number of records to skip

        Returns:
            Dict with history list and total count
        """
        query = select(DetectionRecord)

        # Apply filters
        conditions = []
        if user_id:
            conditions.append(DetectionRecord.user_id == user_id)
        if start_date:
            conditions.append(DetectionRecord.created_at >= start_date)
        if end_date:
            conditions.append(DetectionRecord.created_at <= end_date)
        if risk_level:
            conditions.append(DetectionRecord.risk_level == risk_level)

        if conditions:
            query = query.where(and_(*conditions))

        # Order by creation time desc
        query = query.order_by(DetectionRecord.created_at.desc())

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.limit(limit).offset(offset)

        # Execute query
        result = await db.execute(query)
        records = result.scalars().all()

        # Convert to dict
        history = [
            {
                "id": record.id,
                "request_id": record.request_id,
                "input_text": record.input_text[:200] + "..." if len(record.input_text) > 200 else record.input_text,
                "is_compliant": record.is_compliant,
                "risk_score": record.risk_score,
                "risk_level": record.risk_level,
                "threat_category": record.threat_category,
                "processing_time_ms": record.processing_time_ms,
                "created_at": record.created_at.isoformat() if record.created_at else None
            }
            for record in records
        ]

        return {
            "history": history,
            "total": total,
            "limit": limit,
            "offset": offset
        }

    async def get_statistics_from_db(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get aggregated statistics from database.

        Args:
            db: Database session
            user_id: Optional user ID filter
            start_date: Optional start date filter
            end_date: Optional end date filter

        Returns:
            Statistics dict
        """
        query = select(DetectionRecord)

        # Apply filters
        conditions = []
        if user_id:
            conditions.append(DetectionRecord.user_id == user_id)
        if start_date:
            conditions.append(DetectionRecord.created_at >= start_date)
        if end_date:
            conditions.append(DetectionRecord.created_at <= end_date)

        if conditions:
            query = query.where(and_(*conditions))

        # Total detections
        total_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(total_query)
        total_detections = total_result.scalar() or 0

        if total_detections == 0:
            return self._get_empty_stats()

        # Compliant count
        compliant_query = select(func.count()).where(
            and_(*conditions, DetectionRecord.is_compliant == True)
        ) if conditions else select(func.count()).where(DetectionRecord.is_compliant == True)

        compliant_result = await db.execute(compliant_query)
        compliant_count = compliant_result.scalar() or 0

        non_compliant_count = total_detections - compliant_count

        # Average risk score
        avg_risk_query = select(func.avg(DetectionRecord.risk_score))
        if conditions:
            avg_risk_query = avg_risk_query.where(and_(*conditions))

        avg_risk_result = await db.execute(avg_risk_query)
        avg_risk_score = float(avg_risk_result.scalar() or 0.0)

        # Attack type distribution
        attack_dist_query = select(
            DetectionRecord.threat_category,
            func.count(DetectionRecord.id)
        ).group_by(DetectionRecord.threat_category)

        if conditions:
            attack_dist_query = attack_dist_query.where(and_(*conditions))

        attack_dist_result = await db.execute(attack_dist_query)
        attack_distribution = {
            (category or "unknown"): count
            for category, count in attack_dist_result.all()
        }

        # Risk level distribution
        risk_dist_query = select(
            DetectionRecord.risk_level,
            func.count(DetectionRecord.id)
        ).group_by(DetectionRecord.risk_level)

        if conditions:
            risk_dist_query = risk_dist_query.where(and_(*conditions))

        risk_dist_result = await db.execute(risk_dist_query)
        risk_distribution = {
            level: count
            for level, count in risk_dist_result.all()
        }

        return {
            "total_detections": total_detections,
            "compliant_count": compliant_count,
            "non_compliant_count": non_compliant_count,
            "avg_risk_score": round(avg_risk_score, 3),
            "attack_distribution": attack_distribution,
            "risk_distribution": risk_distribution
        }

    def _get_empty_stats(self) -> Dict[str, Any]:
        """Return empty statistics structure."""
        return {
            "total_detections": 0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "avg_risk_score": 0.0,
            "attack_distribution": {},
            "risk_distribution": {}
        }

    async def get_detection_by_id(
        self,
        db: AsyncSession,
        detection_id: int
    ) -> Optional[DetectionRecord]:
        """Get detection record by ID."""
        query = select(DetectionRecord).where(DetectionRecord.id == detection_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_detection_by_request_id(
        self,
        db: AsyncSession,
        request_id: str
    ) -> Optional[DetectionRecord]:
        """Get detection record by request ID."""
        query = select(DetectionRecord).where(DetectionRecord.request_id == request_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_violations_by_detection_id(
        self,
        db: AsyncSession,
        detection_record_id: int
    ) -> List[ViolationRecord]:
        """Get all violations for a detection record."""
        query = select(ViolationRecord).where(
            ViolationRecord.detection_record_id == detection_record_id
        ).order_by(ViolationRecord.created_at)

        result = await db.execute(query)
        return result.scalars().all()


# Singleton instance
persistence_service = PersistenceService()
