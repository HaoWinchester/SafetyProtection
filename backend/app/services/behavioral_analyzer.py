"""
Behavioral analysis service.

This module provides behavioral analysis capabilities including anomaly
detection and pattern recognition.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re

from app.schemas.detection import AttackType, RiskLevel


@dataclass
class BehavioralAnalysisResult:
    """Result from behavioral analysis."""

    is_detected: bool
    confidence: float
    anomaly_score: float
    detected_patterns: List[str]
    details: Dict[str, Any]


class BehavioralAnalyzer:
    """
    Behavioral analysis layer implementation.

    Detects anomalous behavior patterns and jailbreak attempts.
    """

    def __init__(self):
        """Initialize behavioral analyzer."""
        self._init_jailbreak_patterns()
        self._init_anomaly_thresholds()

    def _init_jailbreak_patterns(self) -> None:
        """Initialize jailbreak detection patterns."""
        self.jailbreak_patterns = {
            "dan": [
                r"do anything now",
                r"\bdan\b.*\bmode\b",
                r"developer mode.*enabled",
            ],
            "reverse_psychology": [
                r"you're not capable of",
                r"i bet you can't",
                r"you probably.*refuse",
            ],
            "logical_paradox": [
                r"this is a test.*intelligence",
                r"prove you're.*by",
                r"if.*then.*else",
            ],
            "assumed_authority": [
                r"as your developer",
                r"i am your creator",
                r"according to.*protocol",
            ],
            "emotional_manipulation": [
                r"please.*i need",
                r"this is very important",
                r"trust me",
            ],
        }

    def _init_anomaly_thresholds(self) -> None:
        """Initialize anomaly detection thresholds."""
        self.anomaly_thresholds = {
            "high_repetition": 3,  # Number of repeated phrases
            "high_special_chars": 0.3,  # Ratio of special characters
            "high_caps": 0.5,  # Ratio of uppercase
            "long_sentence": 100,  # Maximum words per sentence
        }

    def detect(self, text: str) -> BehavioralAnalysisResult:
        """
        Perform behavioral analysis on input text.

        Args:
            text: Input text to analyze

        Returns:
            BehavioralAnalysisResult: Analysis results
        """
        detected_patterns = []
        anomaly_scores = []
        total_confidence = 0.0

        # Jailbreak pattern detection
        jailbreak_result = self._detect_jailbreak(text)
        if jailbreak_result["is_detected"]:
            detected_patterns.extend(jailbreak_result["patterns"])
            total_confidence = max(total_confidence, jailbreak_result["confidence"])

        # Anomaly detection
        anomaly_result = self._detect_anomalies(text)
        anomaly_scores.append(anomaly_result["anomaly_score"])

        # Role-playing detection
        roleplay_result = self._detect_roleplay_patterns(text)
        if roleplay_result["is_detected"]:
            detected_patterns.extend(roleplay_result["patterns"])
            total_confidence = max(total_confidence, roleplay_result["confidence"])

        # Calculate overall anomaly score
        overall_anomaly = sum(anomaly_scores) / len(anomaly_scores) if anomaly_scores else 0.0

        # Combine confidence from different sources
        final_confidence = max(total_confidence, overall_anomaly)

        return BehavioralAnalysisResult(
            is_detected=len(detected_patterns) > 0 or final_confidence > 0.6,
            confidence=final_confidence,
            anomaly_score=overall_anomaly,
            detected_patterns=detected_patterns,
            details={
                "jailbreak_detection": jailbreak_result,
                "anomaly_detection": anomaly_result,
                "roleplay_detection": roleplay_result,
            }
        )

    def _detect_jailbreak(self, text: str) -> Dict[str, Any]:
        """
        Detect jailbreak patterns in text.

        Args:
            text: Input text

        Returns:
            Dict with detection results
        """
        text_lower = text.lower()
        detected_patterns = []

        for jailbreak_type, patterns in self.jailbreak_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    detected_patterns.append(f"{jailbreak_type}:{pattern}")

        confidence = min(0.95, 0.4 + len(detected_patterns) * 0.2)

        return {
            "is_detected": len(detected_patterns) > 0,
            "patterns": detected_patterns,
            "confidence": confidence,
        }

    def _detect_anomalies(self, text: str) -> Dict[str, Any]:
        """
        Detect anomalous patterns in text.

        Args:
            text: Input text

        Returns:
            Dict with anomaly detection results
        """
        anomaly_indicators = []

        # Check for high repetition
        words = text.lower().split()
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1

        max_repetition = max(word_counts.values()) if word_counts else 0
        if max_repetition > self.anomaly_thresholds["high_repetition"]:
            anomaly_indicators.append("high_repetition")

        # Check for special characters ratio
        special_chars = sum(1 for c in text if not c.isalnum() and not c.isspace())
        if len(text) > 0:
            special_ratio = special_chars / len(text)
            if special_ratio > self.anomaly_thresholds["high_special_chars"]:
                anomaly_indicators.append("high_special_chars")

        # Check for uppercase ratio
        if len(text) > 0:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > self.anomaly_thresholds["high_caps"]:
                anomaly_indicators.append("high_caps")

        # Calculate anomaly score
        anomaly_score = len(anomaly_indicators) * 0.25

        return {
            "anomaly_score": anomaly_score,
            "indicators": anomaly_indicators,
        }

    def _detect_roleplay_patterns(self, text: str) -> Dict[str, Any]:
        """
        Detect role-playing behavior patterns.

        Args:
            text: Input text

        Returns:
            Dict with roleplay detection results
        """
        roleplay_indicators = []

        # Check for role-playing indicators
        roleplay_patterns = [
            r"you are (?:now|currently)?\s+(?:a|an|the)",
            r"act\s+(?:like|as|as if)",
            r"pretend\s+(?:to be|you're)",
            r"assume\s+(?:the\s+)?role\s+(?:of\s+)?",
            r"(?:starting|beginning)\s+(?:from\s+)?now",
            r"for\s+the\s+(?:rest\s+of\s+)?conversation",
        ]

        for pattern in roleplay_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                roleplay_indicators.append(pattern)

        confidence = min(0.9, 0.3 + len(roleplay_indicators) * 0.15)

        return {
            "is_detected": len(roleplay_indicators) > 0,
            "patterns": roleplay_indicators,
            "confidence": confidence,
        }

    def detect_repetition(self, text: str, window_size: int = 5) -> float:
        """
        Detect repetitive patterns in text.

        Args:
            text: Input text
            window_size: Size of sliding window

        Returns:
            Repetition score (0-1)
        """
        words = text.lower().split()
        if len(words) < window_size * 2:
            return 0.0

        repetitions = 0
        total_windows = len(words) - window_size

        for i in range(total_windows):
            window = " ".join(words[i:i + window_size])
            # Check if this window appears elsewhere
            for j in range(i + window_size, len(words) - window_size):
                other_window = " ".join(words[j:j + window_size])
                if window == other_window:
                    repetitions += 1
                    break

        return repetitions / total_windows if total_windows > 0 else 0.0
