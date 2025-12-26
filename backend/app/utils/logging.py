"""
Logging configuration and utilities.

This module provides centralized logging configuration for the application.
"""
import logging
import sys
from pathlib import Path
from typing import Optional
import json
from datetime import datetime

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)


def setup_logging() -> logging.Logger:
    """
    Setup application logging.

    Returns:
        Configured logger instance
    """
    # Create logs directory if it doesn't exist
    log_file_path = Path(settings.LOG_FILE_PATH)
    log_file_path.parent.mkdir(parents=True, exist_ok=True)

    # Create logger
    logger = logging.getLogger("llm_security")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))

    if settings.LOG_FORMAT == "json":
        console_formatter = JSONFormatter()
    else:
        console_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler
    if settings.LOG_FILE_PATH:
        from logging.handlers import RotatingFileHandler

        file_handler = RotatingFileHandler(
            settings.LOG_FILE_PATH,
            maxBytes=500 * 1024 * 1024,  # 500 MB
            backupCount=settings.LOG_RETENTION,
        )
        file_handler.setLevel(getattr(logging, settings.LOG_LEVEL))

        if settings.LOG_FORMAT == "json":
            file_formatter = JSONFormatter()
        else:
            file_formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )

        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance.

    Args:
        name: Optional logger name (defaults to "llm_security")

    Returns:
        Logger instance
    """
    return logging.getLogger(name or "llm_security")


# Setup logging on module import
logger = setup_logging()
