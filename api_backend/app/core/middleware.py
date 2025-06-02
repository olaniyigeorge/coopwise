from fastapi import Request
import time
from app.utils.logger import logger

async def app_middleware(request: Request, call_next):

    start_time = time.time()
    response = await call_next(request)
    req_process_time = round((time.time() - start_time) * 1000, 3)  # in ms

    # if request.url == "xxx" ---> implement authorization or check auth

    log_dict = {
        "url": request.url.path,
        "method": request.method,
        "status_code": response.status_code,
        "req_process_time": f"{req_process_time}ms "
    }
    logger.info(log_dict, extra=log_dict)
    return response