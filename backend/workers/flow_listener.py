import asyncio
from celery import shared_task
from flow_py_sdk import flow_client

COOPWISE_CONTRACT = "0xYOUR_CONTRACT_ADDRESS"

@shared_task
def listen_for_payout_events():
    """
    Celery beat task — runs every minute, polls for PayoutTriggered events.
    """
    asyncio.run(_poll_payout_events())

async def _poll_payout_events():
    event_type = f"A.{COOPWISE_CONTRACT.lstrip('0x')}.CoopWise.PayoutTriggered"
    
    async with flow_client(host="access.devnet.nodes.onflow.org", port=9000) as client:
        latest = await client.get_latest_block()
        # Poll last 10 blocks for events
        events = await client.get_events_for_height_range(
            type=event_type,
            start_height=latest.height - 10,
            end_height=latest.height
        )
        
        for block_events in events:
            for event in block_events.events:
                circle_id = event.payload["value"]["fields"][0]["value"]["value"]
                winner_address = event.payload["value"]["fields"][1]["value"]["value"]
                round_num = event.payload["value"]["fields"][2]["value"]["value"]
                
                await _trigger_fiat_payout(
                    circle_id=int(circle_id),
                    winner_flow_address=winner_address,
                    round_num=int(round_num)
                )

# async def _trigger_fiat_payout(circle_id: int, winner_flow_address: str, round_num: int):
#     from backend.services.flutterwave_service import FlutterwaveService
#     from backend.db import get_user_by_flow_address, get_circle_usdc_amount
    
#     user = await get_user_by_flow_address(winner_flow_address)
#     circle = await get_circle_usdc_amount(circle_id)
    
#     # Total payout = weekly_amount_usdc × number_of_members
#     total_payout_usdc = circle.weekly_amount_usdc * circle.max_members
    
#     await FlutterwaveService.transfer(
#         account_bank=user.bank_code,
#         account_number=user.account_number,
#         amount=total_payout_usdc,
#         currency=user.currency,  # NGN, KES, GHS
#         reference=f"coopwise-{circle_id}-round-{round_num}"
#     )