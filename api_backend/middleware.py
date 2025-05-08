from fastapi import Request
import time
from services.logger import logger

async def app_middleware(request: Request, call_next):

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # if request.url == "xxx" ---> implement authorization or check auth

    log_dict = {
        "url": request.url.path,
        "method": request.method,
        "status_code": response.status_code,
        "req_process_time": process_time
    }
    logger.info(log_dict, extra=log_dict)
    return response