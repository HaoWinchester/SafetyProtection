"""
Risk assessment service.

This module provides risk assessment capabilities including risk scoring
and threat classification.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from app.schemas.detection import RiskLevel, AttackType


class RiskThresholds:
    """Risk assessment thresholds."""

    # Risk score thresholds
    LOW_RISK_MAX = 0.3
    MEDIUM_RISK_MAX = 0.5
    HIGH_RISK_MAX = 0.8

    # Confidence thresholds
    HIGH_CONFIDENCE = 0.8
    MEDIUM_CONFIDENCE = 0.5
    LOW_CONFIDENCE = 0.3


@dataclass
class RiskAssessmentResult:
    """Result from risk assessment."""

    risk_score: float
    risk_level: RiskLevel
    confidence: float
    threat_classification: str
    recommendations: List[str]
    processing_strategy: str
    details: Dict[str, Any]


class RiskAssessor:
    """
    Risk assessment layer implementation.

    Combines results from all detection layers to produce final risk assessment.
    """

    def __init__(self):
        """Initialize risk assessor."""
        # Weight for each detection layer
        self.layer_weights = {
            "static": 0.25,
            "semantic": 0.30,
            "behavioral": 0.25,
            "context": 0.20,
        }

        # Attack type severity scores
        self.attack_severity = {
            AttackType.ROLE_PLAYING: 0.4,
            AttackType.INSTRUCTION_OVERRIDE: 0.8,
            AttackType.SYSTEM_PROMPT_HIJACKING: 0.9,
            AttackType.CLASSIC_JAILBREAK: 0.85,
            AttackType.ENCODING_BYPASS: 0.7,
            AttackType.PHISHING: 0.75,
            AttackType.TRAINING_DATA_EXTRACTION: 0.6,
            AttackType.OUTPUT_CONTROL: 0.5,
        }

    def assess(
        self,
        static_result: Optional[Dict[str, Any]] = None,
        semantic_result: Optional[Dict[str, Any]] = None,
        behavioral_result: Optional[Dict[str, Any]] = None,
        context_result: Optional[Dict[str, Any]] = None,
        detected_attacks: Optional[List[str]] = None,
    ) -> RiskAssessmentResult:
        """
        Perform comprehensive risk assessment.

        Args:
            static_result: Results from static detection
            semantic_result: Results from semantic analysis
            behavioral_result: Results from behavioral analysis
            context_result: Results from context analysis
            detected_attacks: List of detected attack types

        Returns:
            RiskAssessmentResult: Comprehensive risk assessment
        """
        # Collect layer results
        layer_results = {
            "static": static_result or {},
            "semantic": semantic_result or {},
            "behavioral": behavioral_result or {},
            "context": context_result or {},
        }

        # Calculate weighted risk score
        risk_score = self._calculate_weighted_risk(layer_results)

        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)

        # Calculate overall confidence
        confidence = self._calculate_confidence(layer_results)

        # Classify threat type
        threat_classification = self._classify_threat(
            detected_attacks or [],
            layer_results
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            risk_level,
            threat_classification
        )

        # Determine processing strategy
        processing_strategy = self._determine_processing_strategy(risk_level)

        return RiskAssessmentResult(
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            threat_classification=threat_classification,
            recommendations=recommendations,
            processing_strategy=processing_strategy,
            details={
                "layer_scores": self._get_layer_scores(layer_results),
                "attack_types": detected_attacks or [],
                "severity_breakdown": self._analyze_severity(detected_attacks or []),
            }
        )

    def _calculate_weighted_risk(
        self,
        layer_results: Dict[str, Dict[str, Any]]
    ) -> float:
        """
        Calculate weighted risk score from all layers.

        Args:
            layer_results: Results from each detection layer

        Returns:
            Weighted risk score (0-1)
        """
        total_weight = 0.0
        weighted_sum = 0.0

        for layer_name, result in layer_results.items():
            if result:
                confidence = result.get("confidence", 0.0)
                is_detected = result.get("is_detected", False)

                # Only consider layers that detected threats
                if is_detected:
                    weight = self.layer_weights.get(layer_name, 0.25)
                    weighted_sum += confidence * weight
                    total_weight += weight

        if total_weight == 0:
            return 0.0

        return min(1.0, weighted_sum / total_weight)

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """
        Determine risk level from risk score.

        Args:
            risk_score: Risk score (0-1)

        Returns:
            RiskLevel enumeration value
        """
        if risk_score <= RiskThresholds.LOW_RISK_MAX:
            return RiskLevel.LOW
        elif risk_score <= RiskThresholds.MEDIUM_RISK_MAX:
            return RiskLevel.MEDIUM
        elif risk_score <= RiskThresholds.HIGH_RISK_MAX:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def _calculate_confidence(
        self,
        layer_results: Dict[str, Dict[str, Any]]
    ) -> float:
        """
        Calculate overall confidence from all layers.

        Args:
            layer_results: Results from each detection layer

        Returns:
            Overall confidence score (0-1)
        """
        confidences = []

        for result in layer_results.values():
            if result and result.get("is_detected", False):
                confidences.append(result.get("confidence", 0.0))

        if not confidences:
            return 0.0

        # Use maximum confidence across layers
        return max(confidences)

    def _classify_threat(
        self,
        attack_types: List[str],
        layer_results: Dict[str, Dict[str, Any]]
    ) -> str:
        """
        Classify the threat type.

        Args:
            attack_types: List of detected attack types
            layer_results: Results from each detection layer

        Returns:
            Threat classification string
        """

        if not attack_types:
            return "no_threat"

        # Classify based on attack types
        high_severity_attacks = [
            AttackType.SYSTEM_PROMPT_HIJACKING,
            AttackType.INSTRUCTION_OVERRIDE,
            AttackType.CLASSIC_JAILBREAK,
        ]

        # Check for high severity attacks
        for attack in attack_types:
            if attack in high_severity_attacks:
                return f"severe_{attack}"

        # Check for jailbreak
        if AttackType.CLASSIC_JAILBREAK in attack_types:
            return "jailbreak_attempt"

        # Check for injection
        if AttackType.ROLE_PLAYING in attack_types:
            return "prompt_injection"

        # Check for data leakage
        if AttackType.TRAINING_DATA_EXTRACTION in attack_types:
            return "data_extraction_attempt"

        # Default classification
        return f"potential_threat_{attack_types[0]}"

    def _generate_recommendations(
        self,
        risk_level: RiskLevel,
        threat_classification: str
    ) -> List[str]:
        """
        Generate recommendations based on risk level and threat type.

        Args:
            risk_level: Assessed risk level
            threat_classification: Threat classification

        Returns:
            List of recommendation strings
        """
        recommendations = []

        if risk_level == RiskLevel.LOW:
            recommendations = [
                "Allow request with standard monitoring",
                "Log for analysis",
            ]
        elif risk_level == RiskLevel.MEDIUM:
            recommendations = [
                "Allow request with enhanced monitoring",
                "Consider adding warning to user",
                "Log for detailed review",
            ]
        elif risk_level == RiskLevel.HIGH:
            recommendations = [
                "Block request or require manual review",
                "Alert security team",
                "Create incident ticket",
            ]
        elif risk_level == RiskLevel.CRITICAL:
            recommendations = [
                "Immediately block request",
                "Alert security team urgently",
                "Create high-priority incident ticket",
                "Consider temporary user suspension",
            ]

        # Add threat-specific recommendations
        if "jailbreak" in threat_classification:
            recommendations.append("Monitor for repeated jailbreak attempts")

        if "injection" in threat_classification:
            recommendations.append("Sanitize input carefully")

        return recommendations

    def _determine_processing_strategy(self, risk_level: RiskLevel) -> str:
        """
        Determine processing strategy based on risk level.

        Args:
            risk_level: Assessed risk level

        Returns:
            Processing strategy string
        """
        strategies = {
            RiskLevel.LOW: "pass",
            RiskLevel.MEDIUM: "pass_with_warning",
            RiskLevel.HIGH: "block_with_review",
            RiskLevel.CRITICAL: "immediate_block",
        }

        return strategies.get(risk_level, "pass")

    def _get_layer_scores(
        self,
        layer_results: Dict[str, Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Extract scores from each layer.

        Args:
            layer_results: Results from each detection layer

        Returns:
            Dict mapping layer names to scores
        """
        scores = {}

        for layer_name, result in layer_results.items():
            if result and result.get("is_detected", False):
                scores[layer_name] = result.get("confidence", 0.0)
            else:
                scores[layer_name] = 0.0

        return scores

    def _analyze_severity(self, attack_types: List[str]) -> Dict[str, Any]:
        """
        Analyze severity of detected attacks.

        Args:
            attack_types: List of detected attack types

        Returns:
            Severity analysis dict
        """
        severity_scores = []

        for attack in attack_types:
            if attack in self.attack_severity:
                severity_scores.append(self.attack_severity[attack])

        if not severity_scores:
            return {"max_severity": 0.0, "avg_severity": 0.0}

        return {
            "max_severity": max(severity_scores),
            "avg_severity": sum(severity_scores) / len(severity_scores),
            "attack_count": len(attack_types),
        }
