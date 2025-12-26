"""
Main detection service implementing the 7-layer architecture.

This module orchestrates all detection layers and provides the main
detection interface.
"""
import time
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.services.static_detector import StaticDetector
from app.services.semantic_analyzer import SemanticAnalyzer
from app.services.behavioral_analyzer import BehavioralAnalyzer
from app.services.context_analyzer import ContextAnalyzer
from app.services.risk_assessor import RiskAssessor
from app.schemas.detection import (
    DetectionRequest,
    DetectionResponse,
    DetectionResult,
    RiskLevel,
    AttackType,
    LayerResult,
)
from app.schemas.common import SuccessResponse


class DetectionService:
    """
    Main detection service implementing the 7-layer architecture.

    Layers:
    1. Input Layer - Receive and validate input
    2. Preprocessing Layer - Clean and normalize text
    3. Detection Layer - Multi-modal detection (static, semantic, behavioral, context)
    4. Assessment Layer - Risk scoring and classification
    5. Decision Layer - Compliance judgment and processing strategy
    6. Output Layer - Format and return results
    7. Storage Layer - Log results (handled separately)
    """

    def __init__(self):
        """Initialize detection service with all layers."""
        # Initialize all detection layers
        self.static_detector = StaticDetector()
        self.semantic_analyzer = SemanticAnalyzer()
        self.behavioral_analyzer = BehavioralAnalyzer()
        self.context_analyzer = ContextAnalyzer()
        self.risk_assessor = RiskAssessor()

        # Detection statistics
        self.stats = {
            "total_detections": 0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "total_processing_time_ms": 0.0,
        }

    async def detect(
        self,
        request: DetectionRequest
    ) -> DetectionResponse:
        """
        Perform full detection pipeline on input text.

        Args:
            request: Detection request with text and options

        Returns:
            DetectionResponse: Comprehensive detection results
        """
        start_time = time.time()

        # Generate request ID if not provided
        request_id = request.request_id or str(uuid.uuid4())

        # Layer 1: Input Layer - Validate and prepare input
        input_data = self._input_layer(request)

        # Layer 2: Preprocessing Layer - Clean and normalize
        preprocessed_data = self._preprocessing_layer(input_data)

        # Layer 3: Detection Layer - Multi-modal analysis
        detection_results = await self._detection_layer(preprocessed_data)

        # Layer 4: Assessment Layer - Risk assessment
        assessment_result = self._assessment_layer(detection_results)

        # Layer 5: Decision Layer - Make compliance decision
        decision_result = self._decision_layer(assessment_result)

        # Layer 6: Output Layer - Format response
        response = self._output_layer(
            request_id=request_id,
            decision_result=decision_result,
            detection_results=detection_results,
            assessment_result=assessment_result,
            processing_time_ms=(time.time() - start_time) * 1000,
        )

        # Update statistics
        self._update_statistics(response)

        # Note: Layer 7 (Storage) is handled separately by database layer

        return response

    def _input_layer(self, request: DetectionRequest) -> Dict[str, Any]:
        """
        Layer 1: Input processing.

        Validates and prepares input data.
        """
        return {
            "text": request.text,
            "user_id": request.user_id,
            "model_name": request.model_name,
            "context": request.context,
            "detection_level": request.detection_level,
            "include_details": request.include_details,
            "request_id": str(uuid.uuid4()),
        }

    def _preprocessing_layer(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Layer 2: Text preprocessing.

        Cleans and normalizes input text.
        """
        text = input_data["text"]

        # Basic preprocessing
        processed_text = text.strip()

        # Generate hash for caching
        text_hash = self.static_detector.get_text_hash(processed_text)

        return {
            **input_data,
            "processed_text": processed_text,
            "text_hash": text_hash,
            "original_length": len(text),
            "processed_length": len(processed_text),
        }

    async def _detection_layer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Layer 3: Multi-modal detection.

        Runs all detection layers in parallel.
        """
        text = data["processed_text"]
        context = data.get("context")

        # Static detection
        static_result = self.static_detector.detect(text)

        # Semantic analysis
        semantic_result = self.semantic_analyzer.detect(text)

        # Behavioral analysis
        behavioral_result = self.behavioral_analyzer.detect(text)

        # Context analysis
        context_result = self.context_analyzer.detect(text, context)

        # Collect detected attack types
        detected_attacks = []
        if static_result.attack_types:
            detected_attacks.extend(static_result.attack_types)
        if semantic_result.is_detected and semantic_result.intent_detected:
            detected_attacks.append(semantic_result.intent_detected)

        return {
            "static": static_result,
            "semantic": semantic_result,
            "behavioral": behavioral_result,
            "context": context_result,
            "detected_attacks": list(set(detected_attacks)),
        }

    def _assessment_layer(self, detection_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Layer 4: Risk assessment.

        Combines detection results into risk assessment.
        """
        assessment = self.risk_assessor.assess(
            static_result={
                "is_detected": detection_results["static"].is_detected,
                "confidence": detection_results["static"].confidence,
            },
            semantic_result={
                "is_detected": detection_results["semantic"].is_detected,
                "confidence": detection_results["semantic"].confidence,
            },
            behavioral_result={
                "is_detected": detection_results["behavioral"].is_detected,
                "confidence": detection_results["behavioral"].confidence,
            },
            context_result={
                "is_detected": detection_results["context"].is_detected,
                "confidence": detection_results["context"].confidence,
            },
            detected_attacks=detection_results["detected_attacks"],
        )

        return {
            "assessment": assessment,
            "detection_results": detection_results,
        }

    def _decision_layer(self, assessment_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Layer 5: Decision making.

        Makes final compliance decision based on risk assessment.
        """
        assessment = assessment_result["assessment"]

        # Make compliance decision
        is_compliant = assessment.risk_score < 0.5

        return {
            "is_compliant": is_compliant,
            "assessment": assessment,
        }

    def _output_layer(
        self,
        request_id: str,
        decision_result: Dict[str, Any],
        detection_results: Dict[str, Any],
        assessment_result: Dict[str, Any],
        processing_time_ms: float,
    ) -> DetectionResponse:
        """
        Layer 6: Output formatting.

        Formats final response.
        """
        assessment = assessment_result["assessment"]
        is_compliant = decision_result["is_compliant"]

        # Build detected attacks list
        detected_attacks = []
        for attack_type in detection_results["detected_attacks"]:
            detected_attacks.append(
                DetectionResult(
                    attack_type=attack_type,
                    attack_category=self._get_attack_category(attack_type),
                    confidence=assessment.confidence,
                    severity=assessment.risk_level,
                    description=f"Detected {attack_type} attack pattern",
                )
            )

        # Build layer results
        layer_results = None
        if assessment_result["detection_results"]:
            layer_results = {
                "static": LayerResult(
                    layer_name="static_detection",
                    is_detected=detection_results["static"].is_detected,
                    confidence=detection_results["static"].confidence,
                    details=detection_results["static"].details,
                ),
                "semantic": LayerResult(
                    layer_name="semantic_analysis",
                    is_detected=detection_results["semantic"].is_detected,
                    confidence=detection_results["semantic"].confidence,
                    details=detection_results["semantic"].details,
                ),
                "behavioral": LayerResult(
                    layer_name="behavioral_analysis",
                    is_detected=detection_results["behavioral"].is_detected,
                    confidence=detection_results["behavioral"].confidence,
                    details=detection_results["behavioral"].details,
                ),
                "context": LayerResult(
                    layer_name="context_analysis",
                    is_detected=detection_results["context"].is_detected,
                    confidence=detection_results["context"].confidence,
                    details=detection_results["context"].details,
                ),
            }

        return DetectionResponse(
            success=True,
            request_id=request_id,
            is_compliant=is_compliant,
            risk_score=assessment.risk_score,
            risk_level=assessment.risk_level,
            confidence=assessment.confidence,
            processing_time_ms=processing_time_ms,
            detected_attacks=detected_attacks,
            layer_results=layer_results,
            recommendations=assessment.recommendations,
            metadata={
                "model_version": "1.0.0",
                "detection_layers": ["static", "semantic", "behavioral", "context"],
            },
        )

    def _get_attack_category(self, attack_type: str) -> str:
        """Get category for attack type."""
        categories = {
            # Direct Prompt Injection
            "role_playing": "direct_prompt_injection",
            "instruction_override": "direct_prompt_injection",
            "system_prompt_hijacking": "direct_prompt_injection",

            # Indirect Prompt Injection
            "external_data_contamination": "indirect_prompt_injection",
            "document_injection": "indirect_prompt_injection",

            # Jailbreak Attacks
            "classic_jailbreak": "jailbreak",
            "encoding_bypass": "jailbreak",
            "logical_paradox": "jailbreak",

            # Data Leakage
            "training_data_extraction": "data_leakage",
            "sensitive_information_probing": "data_leakage",

            # Model Manipulation
            "output_control": "model_manipulation",
            "cognitive_bias_exploitation": "model_manipulation",

            # Social Engineering
            "phishing": "social_engineering",
            "identity_spoofing": "social_engineering",
            "trust_building": "social_engineering",
        }
        return categories.get(attack_type, "other")

    def _update_statistics(self, response: DetectionResponse) -> None:
        """Update detection statistics."""
        self.stats["total_detections"] += 1
        if response.is_compliant:
            self.stats["compliant_count"] += 1
        else:
            self.stats["non_compliant_count"] += 1
        self.stats["total_processing_time_ms"] += response.processing_time_ms

    def get_statistics(self) -> Dict[str, Any]:
        """Get detection statistics."""
        stats = self.stats.copy()
        if stats["total_detections"] > 0:
            stats["average_processing_time_ms"] = (
                stats["total_processing_time_ms"] / stats["total_detections"]
            )
        else:
            stats["average_processing_time_ms"] = 0.0
        return stats


# Global detection service instance
detection_service = DetectionService()
