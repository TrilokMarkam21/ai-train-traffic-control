"""
Logger Configuration Module
============================
Centralized logging configuration for the AI microservice.
Provides structured logging with different levels and formatting.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path


def setup_logger(name: str = "ai-service") -> logging.Logger:
    """
    Configure and return a logger instance.

    Args:
        name: Logger name (default: "ai-service")

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Console handler with colored output
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    # Force UTF-8 encoding for Windows compatibility
    if hasattr(console_handler, 'stream') and hasattr(console_handler.stream, 'reconfigure'):
        console_handler.stream.reconfigure(encoding='utf-8')
    
    # File handler for persistent logs
    file_handler = logging.FileHandler(
        log_dir / f"ai-service-{datetime.now().strftime('%Y-%m-%d')}.log",
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Formatter for console
    console_format = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S"
    )
    
    # Formatter for file (more detailed)
    file_format = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(filename)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    console_handler.setFormatter(console_format)
    file_handler.setFormatter(file_format)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger


# Default logger instance
logger = setup_logger()
