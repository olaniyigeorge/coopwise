


import asyncio
from typing import Awaitable, Any

def run_async_in_celery_task(coro: Awaitable[Any]) -> Any:
    """
    Safely runs an async coroutine within a synchronous context (like a Celery task).
    It ensures a dedicated event loop is created and used for the coroutine,
    preventing 'attached to a different loop' errors.
    """
    try:
        # Check if an event loop is already running (e.g., in a complex environment)
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop, create a new one for this task/thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    # Run the coroutine until complete using the determined loop
    return loop.run_until_complete(coro)