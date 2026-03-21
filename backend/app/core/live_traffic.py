import httpx



async def get_location_from_ip(ip: str) -> str:
    if ip in ("127.0.0.1", "::1"):
        return "Localhost"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{ip}")
            data = response.json()
            if data.get("status") == "success":
                return f"{data.get('city')}, {data.get('country')}"
    except Exception:
        pass
    return "Unknown"