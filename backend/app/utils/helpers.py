"""
Helper functions and utilities.

This module provides common helper functions used across the application.
"""
import hashlib
import secrets
import string
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta


def generate_random_string(length: int = 32) -> str:
    """
    Generate a random alphanumeric string.

    Args:
        length: Length of the string to generate

    Returns:
        Random string
    """
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_request_id() -> str:
    """
    Generate a unique request ID.

    Returns:
        Unique request identifier
    """
    return f"req_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{generate_random_string(16)}"


def hash_text(text: str, algorithm: str = "sha256") -> str:
    """
    Hash text using specified algorithm.

    Args:
        text: Text to hash
        algorithm: Hash algorithm (default: sha256)

    Returns:
        Hexadecimal hash string
    """
    hash_func = getattr(hashlib, algorithm, hashlib.sha256)
    return hash_func(text.encode()).hexdigest()


def sanitize_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitize user input by removing potentially harmful characters.

    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized text
    """
    # Trim to max length
    text = text[:max_length]

    # Remove null bytes and other control characters
    text = "".join(char for char in text if char != "\x00")

    # Strip whitespace
    text = text.strip()

    return text


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length.

    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated

    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def calculate_percentage(value: int, total: int) -> float:
    """
    Calculate percentage.

    Args:
        value: Numerator
        total: Denominator

    Returns:
        Percentage (0-100)
    """
    if total == 0:
        return 0.0
    return (value / total) * 100


def format_timestamp(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format datetime to string.

    Args:
        dt: Datetime object
        format_str: Format string

    Returns:
        Formatted datetime string
    """
    return dt.strftime(format_str)


def parse_timestamp(timestamp_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """
    Parse string to datetime.

    Args:
        timestamp_str: Timestamp string
        format_str: Format string

    Returns:
        Datetime object
    """
    return datetime.strptime(timestamp_str, format_str)


def is_valid_email(email: str) -> bool:
    """
    Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    import re

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def mask_sensitive_data(text: str, visible_chars: int = 4) -> str:
    """
    Mask sensitive data like API keys or tokens.

    Args:
        text: Sensitive text to mask
        visible_chars: Number of characters to show at start and end

    Returns:
        Masked text
    """
    if len(text) <= visible_chars * 2:
        return "*" * len(text)

    start = text[:visible_chars]
    end = text[-visible_chars:]
    masked_length = len(text) - visible_chars * 2
    return f"{start}{'*' * masked_length}{end}"


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries.

    Args:
        dict1: First dictionary
        dict2: Second dictionary (overrides dict1)

    Returns:
        Merged dictionary
    """
    result = dict1.copy()

    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value

    return result


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split a list into chunks.

    Args:
        lst: List to chunk
        chunk_size: Size of each chunk

    Returns:
        List of chunks
    """
    return [lst[i: i + chunk_size] for i in range(0, len(lst), chunk_size)]


def retry_with_backoff(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    backoff_factor: float = 2.0,
):
    """
    Retry function with exponential backoff.

    Args:
        func: Function to retry
        max_retries: Maximum number of retries
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        backoff_factor: Multiplier for delay

    Returns:
        Function result
    """
    import time

    delay = base_delay

    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise

            time.sleep(min(delay, max_delay))
            delay *= backoff_factor


def get_client_ip(request) -> str:
    """
    Get client IP address from request.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address
    """
    # Check for forwarded IP (behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct IP
    if request.client:
        return request.client.host

    return "unknown"
