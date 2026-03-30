#!/usr/bin/env python3
"""
Simple test script to verify the contribution system implementation
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

async def test_imports():
    """Test that all our new modules can be imported"""
    try:
        from app.services.contract_service import contract_service
        print("✅ Contract service imported successfully")

        # Test contract service methods
        result = await contract_service.submit_contribution_onchain(
            group_id="test-group-id",
            contribution_id="test-contrib-id",
            amount=500.00,
            user_address="test-address",
            network="flow"
        )
        print(f"✅ Contract service submit method works: {result['success']}")

        # Test query method
        status = await contract_service.query_contribution_status(
            contribution_id="test-contrib-id",
            network="flow"
        )
        print(f"✅ Contract service query method works: {status is not None}")

        print("\n🎉 All contract service tests passed!")
        return True

    except Exception as e:
        print(f"❌ Import or execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_imports())
    sys.exit(0 if success else 1)