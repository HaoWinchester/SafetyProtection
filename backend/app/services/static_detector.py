"""
Static detection service.

This module provides static detection capabilities including keyword matching,
regex patterns, and blacklist filtering.
"""
import re
import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.schemas.detection import AttackType, RiskLevel


@dataclass
class StaticDetectionResult:
    """Result from static detection."""

    is_detected: bool
    confidence: float
    matched_patterns: List[str]
    attack_types: List[str]
    details: Dict[str, Any]


class StaticDetector:
    """
    Static detection layer implementation.

    Performs static analysis using keyword matching, regex patterns,
    and blacklist filtering.
    """

    def __init__(self):
        """Initialize static detector with patterns and rules."""
        self._init_keyword_patterns()
        self._init_regex_patterns()
        self._init_blacklist()

    def _init_keyword_patterns(self) -> None:
        """Initialize keyword-based detection patterns."""
        self.keyword_patterns = {
            AttackType.ROLE_PLAYING: [
                "you are now", "act as", "pretend to be", "you are a",
                "from now on", "you will be", "assume the role",
            ],
            AttackType.INSTRUCTION_OVERRIDE: [
                "ignore previous", "disregard all", "forget everything",
                "ignore all above", "override instructions",
            ],
            AttackType.SYSTEM_PROMPT_HIJACKING: [
                "show me your instructions", "what are your instructions",
                "reveal your prompt", "tell me your system prompt",
            ],
            AttackType.CLASSIC_JAILBREAK: [
                "DAN mode", "developer mode", "unfiltered mode",
                "no restrictions", "bypass safety",
            ],
            AttackType.OUTPUT_CONTROL: [
                "say exactly", "respond with", "your answer must",
                "always say", "never refuse",
            ],
        }

    def _init_regex_patterns(self) -> None:
        """Initialize regex-based detection patterns."""
        self.regex_patterns = {
            AttackType.ENCODING_BYPASS: [
                r'base64\s*:\s*[A-Za-z0-9+/=]{20,}',
                r'hex\s*:\s*[0-9a-fA-F]{20,}',
                r'rot13\s*:',
                r'unicode\s*:\s*\\u[0-9a-fA-F]{4}',
            ],
            AttackType.ROLE_PLAYING: [
                r'\b(?:you are|act as|pretend to be|assume the role)\b.+\b(?:AI|assistant|bot)\b',
                r'\bfrom now on\b',
                r'\bstarting now\b',
            ],
            AttackType.INSTRUCTION_OVERRIDE: [
                r'\bignore\s+(?:all|everything|the)\s+(?:above|previous|prior)\b',
                r'\bdisregard\s+(?:all|everything)\b',
                r'\bforget\s+(?:all|everything)\s+(?:above|previous)\b',
            ],
        }

    def _init_blacklist(self) -> None:
        """Initialize blacklist of prohibited terms."""
        self.blacklist_terms = [
            "hate speech", "violent content", "illegal activities",
            "self-harm", "terrorism", "exploit children",
        ]

    def detect(self, text: str) -> StaticDetectionResult:
        """
        Perform static detection on input text.

        Args:
            text: Input text to analyze

        Returns:
            StaticDetectionResult: Detection results
        """
        text_lower = text.lower()
        matched_patterns = []
        detected_attack_types = set()
        total_confidence = 0.0
        pattern_count = 0

        # Keyword detection
        keyword_results = self._detect_keywords(text_lower)
        for attack_type, matches in keyword_results.items():
            if matches:
                detected_attack_types.add(attack_type)
                matched_patterns.extend(matches)
                # Confidence based on number of matches
                confidence = min(0.9, 0.3 + len(matches) * 0.15)
                total_confidence += confidence
                pattern_count += 1

        # Regex detection
        regex_results = self._detect_regex(text)
        for attack_type, matches in regex_results.items():
            if matches:
                detected_attack_types.add(attack_type)
                matched_patterns.extend(matches)
                confidence = min(0.95, 0.4 + len(matches) * 0.2)
                total_confidence += confidence
                pattern_count += 1

        # Blacklist detection
        blacklist_matches = self._detect_blacklist(text_lower)
        if blacklist_matches:
            matched_patterns.extend(blacklist_matches)
            total_confidence += 0.9
            pattern_count += 1

        # Calculate overall confidence
        final_confidence = (
            total_confidence / pattern_count if pattern_count > 0 else 0.0
        )

        return StaticDetectionResult(
            is_detected=len(detected_attack_types) > 0,
            confidence=final_confidence,
            matched_patterns=matched_patterns,
            attack_types=list(detected_attack_types),
            details={
                "keyword_detection": {
                    str(k): v for k, v in keyword_results.items() if v
                },
                "regex_detection": {
                    str(k): v for k, v in regex_results.items() if v
                },
                "blacklist_detection": blacklist_matches,
            }
        )

    def _detect_keywords(self, text: str) -> Dict[AttackType, List[str]]:
        """
        Detect keyword patterns in text.

        Args:
            text: Input text (lowercase)

        Returns:
            Dict mapping attack types to matched keywords
        """
        results = {}

        for attack_type, keywords in self.keyword_patterns.items():
            matches = [kw for kw in keywords if kw in text]
            if matches:
                results[attack_type] = matches

        return results

    def _detect_regex(self, text: str) -> Dict[AttackType, List[str]]:
        """
        Detect regex patterns in text.

        Args:
            text: Input text

        Returns:
            Dict mapping attack types to matched patterns
        """
        results = {}

        for attack_type, patterns in self.regex_patterns.items():
            matches = []
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    matches.append(pattern)
            if matches:
                results[attack_type] = matches

        return results

    def _detect_blacklist(self, text: str) -> List[str]:
        """
        Detect blacklist terms in text.

        Args:
            text: Input text (lowercase)

        Returns:
            List of matched blacklist terms
        """
        return [term for term in self.blacklist_terms if term in text]

    def get_text_hash(self, text: str) -> str:
        """
        Generate SHA256 hash of input text.

        Args:
            text: Input text

        Returns:
            SHA256 hash
        """
        return hashlib.sha256(text.encode()).hexdigest()
