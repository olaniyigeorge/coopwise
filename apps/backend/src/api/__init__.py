"""API package for CoopWise backend.

This package centralizes route registration and versioned API construction.
"""
from .routers import router_list

__all__ = ["router_list"]
