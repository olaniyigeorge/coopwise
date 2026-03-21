# # services/chain.py
# from app.core.config import DevConfig
# from web3 import Web3
# from pathlib import Path
# import json
# import os

# RPC = os.getenv("RPC_URL", "http://localhost:8545")
# w3 = Web3(Web3.HTTPProvider(RPC))

# # load ABI
# BASE = Path(__file__).resolve().parent.parent
# with open(BASE / "contracts" / "PoolFactory.abi.json") as f:
#     POOLFACTORY_ABI = json.load(f)

# POOLFACTORY_ADDRESS = DevConfig("POOLFACTORY_ADDRESS")  # set after deploy
# poolfactory = w3.eth.contract(address=POOLFACTORY_ADDRESS, abi=POOLFACTORY_ABI)

# # signer (backend relayer) - BE CAREFUL: only for relayer meta-tx flows or admin ops.
# PRIVATE_KEY = DevConfig("DEPLOYER_KEY")
# from_account = w3.eth.account.from_key(PRIVATE_KEY).address
