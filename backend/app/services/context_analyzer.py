"""
Context analysis service.

This module provides context analysis capabilities including conversation
coherence and consistency checking.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.schemas.detection import AttackType, RiskLevel


@dataclass
class ContextAnalysisResult:
    """Result from context analysis."""

    is_detected: bool
    confidence: float
    coherence_score: float
    consistency_score: float
    details: Dict[str, Any]


class ContextAnalyzer:
    """
    Context analysis layer implementation.

    Analyzes conversation context for consistency and coherence.
    """

    def __init__(self):
        """Initialize context analyzer."""
        self.max_context_length = 10  # Maximum previous messages to consider

    def detect(
        self,
        text: str,
        context: Optional[str] = None
    ) -> ContextAnalysisResult:
        """
        Perform context analysis on input text.

        Args:
            text: Input text to analyze
            context: Optional conversation context/history

        Returns:
            ContextAnalysisResult: Analysis results
        """
        if not context:
            # No context available, return neutral result
            return ContextAnalysisResult(
                is_detected=False,
                confidence=0.0,
                coherence_score=0.5,
                consistency_score=0.5,
                details={"reason": "no_context_available"}
            )

        # Parse context if provided
        context_messages = self._parse_context(context)

        # Analyze coherence
        coherence_score = self._analyze_coherence(text, context_messages)

        # Analyze consistency
        consistency_score = self._analyze_consistency(text, context_messages)

        # Detect context-based attacks
        context_attacks = self._detect_context_attacks(text, context_messages)

        # Calculate overall confidence
        is_suspicious = (
            coherence_score < 0.4 or
            consistency_score < 0.4 or
            len(context_attacks) > 0
        )

        confidence = 0.0
        if is_suspicious:
            confidence = max(
                (1 - coherence_score) * 0.5,
                (1 - consistency_score) * 0.5,
                0.3 + len(context_attacks) * 0.2
            )

        return ContextAnalysisResult(
            is_detected=is_suspicious,
            confidence=confidence,
            coherence_score=coherence_score,
            consistency_score=consistency_score,
            details={
                "context_messages_count": len(context_messages),
                "detected_attacks": context_attacks,
                "coherence_analysis": {
                    "score": coherence_score,
                    "issues": self._identify_coherence_issues(text, context_messages)
                },
                "consistency_analysis": {
                    "score": consistency_score,
                    "issues": self._identify_consistency_issues(text, context_messages)
                }
            }
        )

    def _parse_context(self, context: str) -> List[Dict[str, str]]:
        """
        Parse conversation context.

        Args:
            context: Context string (could be JSON or other format)

        Returns:
            List of context messages
        """
        # Try to parse as JSON
        try:
            import json
            messages = json.loads(context)
            if isinstance(messages, list):
                return messages[-self.max_context_length:]
        except (json.JSONDecodeError, TypeError):
            pass

        # Fallback: split by newlines
        lines = context.strip().split("\n")
        messages = []
        for line in lines:
            if line.strip():
                messages.append({"content": line.strip()})

        return messages[-self.max_context_length:]

    def _analyze_coherence(
        self,
        text: str,
        context_messages: List[Dict[str, str]]
    ) -> float:
        """
        Analyze coherence of input with context.

        Args:
            text: Input text
            context_messages: Previous messages

        Returns:
            Coherence score (0-1)
        """
        if not context_messages:
            return 0.5

        # Get the last message
        last_message = context_messages[-1].get("content", "")

        # Simple coherence check: topic continuity
        coherence_indicators = 0

        # Check if input references previous message
        text_lower = text.lower()
        if any(word in text_lower for word in ["you", "your", "above", "previous"]):
            coherence_indicators += 1

        # Check for question-response coherence
        if last_message.strip().endswith("?"):
            # If last message was a question, check if this looks like an answer
            if len(text.split()) > 2:  # Non-trivial response
                coherence_indicators += 1

        # Check for continuation
        if any(word in text_lower for word in ["and", "also", "moreover", "furthermore"]):
            coherence_indicators += 1

        return min(1.0, coherence_indicators / 3.0 + 0.3)

    def _analyze_consistency(
        self,
        text: str,
        context_messages: List[Dict[str, str]]
    ) -> float:
        """
        Analyze consistency of input with context.

        Args:
            text: Input text
            context_messages: Previous messages

        Returns:
            Consistency score (0-1)
        """
        if not context_messages:
            return 0.5

        text_lower = text.lower()
        inconsistency_indicators = 0

        # Check for contradictory statements
        contradiction_patterns = [
            (r"actually\s+", "correction"),
            (r"wait,\s+i\s+mean", "correction"),
            (r"no,\s+that's\s+not", "contradiction"),
            (r"ignore\s+what\s+i\s+said", "revocation"),
        ]

        import re
        for pattern, indicator in contradiction_patterns:
            if re.search(pattern, text_lower):
                inconsistency_indicators += 1

        # Check for sudden topic changes
        if len(context_messages) >= 2:
            prev_message = context_messages[-1].get("content", "")
            # Simple check: completely different vocabulary might indicate inconsistency
            words_text = set(text_lower.split())
            words_prev = set(prev_message.lower().split())

            if words_text and words_prev:
                overlap = len(words_text & words_prev) / len(words_text | words_prev)
                if overlap < 0.1:  # Very low overlap
                    inconsistency_indicators += 1

        # Calculate consistency score
        consistency = max(0.0, 1.0 - inconsistency_indicators * 0.3)
        return consistency

    def _detect_context_attacks(
        self,
        text: str,
        context_messages: List[Dict[str, str]]
    ) -> List[str]:
        """
        Detect context-based attacks.

        Args:
            text: Input text
            context_messages: Previous messages

        Returns:
            List of detected attack types
        """
        attacks = []
        text_lower = text.lower()

        # Check for context contamination
        if "ignore" in text_lower and "context" in text_lower:
            attacks.append("context_ignoring")

        # Check for context injection
        if "system" in text_lower and "message" in text_lower:
            attacks.append("system_message_injection")

        # Check for conversation hijacking
        if any(word in text_lower for word in ["new conversation", "start over", "reset"]):
            attacks.append("conversation_reset")

        return attacks

    def _identify_coherence_issues(
        self,
        text: str,
        context_messages: List[Dict[str, str]]
    ) -> List[str]:
        """
        Identify specific coherence issues.

        Args:
            text: Input text
            context_messages: Previous messages

        Returns:
            List of coherence issues
        """
        issues = []

        if not context_messages:
            issues.append("no_context")
            return issues

        # Check for non-sequitur
        if len(text.split()) < 3:
            issues.append("very_short_response")

        # Check for completely unrelated content
        if context_messages:
            last_message = context_messages[-1].get("content", "")
            if last_message.endswith("?") and not any(
                word in text.lower() for word in ["yes", "no", "i", "it", "they"]
            ):
                issues.append("potential_non_answer")

        return issues

    def _identify_consistency_issues(
        self,
        text: str,
        context_messages: List[Dict[str, str]]
    ) -> List[str]:
        """
        Identify specific consistency issues.

        Args:
            text: Input text
            context_messages: Previous messages

        Returns:
            List of consistency issues
        """
        issues = []
        text_lower = text.lower()

        # Check for self-contradiction
        if "but" in text_lower and "actually" in text_lower:
            issues.append("potential_contradiction")

        # Check for role inconsistency
        if "you are" in text_lower and "not" in text_lower:
            issues.append("role_inconsistency")

        return issues
