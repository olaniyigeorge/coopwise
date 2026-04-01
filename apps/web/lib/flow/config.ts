/**
 * Flow blockchain configuration for CoopWise.
 *
 * This file contains:
 * - Network constants (testnet / mainnet toggle via env var)
 * - Cadence transaction & script strings used by the frontend
 *
 * The frontend uses FCL (@onflow/react-sdk) to:
 *   1. Sign contribution transactions (user's passkey signs, CoopWise pays gas)
 *   2. Sign join-circle transactions
 *   3. Query on-chain circle state
 *
 * The BACKEND (flow_service.py) handles:
 *   - Account creation (CreateUserAccount.cdc)
 *   - Circle creation (CreateCircle.cdc)
 *   - Payout triggering (TriggerRotation.cdc)
 */

export const FLOW_NETWORK =
  (process.env.NEXT_PUBLIC_FLOW_NETWORK as "testnet" | "mainnet") ?? "testnet";

export const FLOW_ACCESS_NODE =
  FLOW_NETWORK === "mainnet"
    ? "https://access-mainnet.onflow.org"
    : "https://access-testnet.onflow.org";

/** Opens on flowscan.io — visible to everyone, amounts are encrypted ciphertexts */
export const FLOW_EXPLORER_BASE =
  FLOW_NETWORK === "mainnet"
    ? "https://flowscan.io/tx"
    : "https://testnet.flowscan.io/tx";

export function getExplorerUrl(txId: string) {
  return `${FLOW_EXPLORER_BASE}/${txId}`;
}

//
// Cadence Transactions
// These are submitted from the FRONTEND using FCL.
// CoopWise fee-payer account covers all gas — user pays nothing.
//

/**
 * JoinCircle.cdc
 * Called when a user taps "Join" on a circle invite.
 * Authorisation: user signs with their passkey (Crossmint smart wallet).
 * Gas: CoopWise fee payer.
 */
export const JOIN_CIRCLE_CDC = `
import CoopWise from 0xCOOPWISE_CONTRACT_ADDRESS

transaction(circleId: UInt64) {
  prepare(member: auth(BorrowValue) &Account) {
    CoopWise.joinCircle(circleId: circleId, member: member.address)
  }
}
`;

/**
 * Contribute.cdc
 * Called when a user taps "Contribute this week".
 * The encrypted amount + proof come from the backend (Zama relayer).
 * Authorisation: user signs with their passkey.
 * Gas: CoopWise fee payer.
 */
export const CONTRIBUTE_CDC = `
import CoopWise from 0xCOOPWISE_CONTRACT_ADDRESS

transaction(
  circleId: UInt64,
  encryptedAmount: [UInt8],
  inputProof: [UInt8]
) {
  prepare(member: auth(BorrowValue) &Account) {
    CoopWise.contribute(
      circleId: circleId,
      member: member.address,
      encryptedAmount: encryptedAmount,
      inputProof: inputProof
    )
  }
}
`;

//
// Cadence Scripts (read-only — no signing needed)
//

/**
 * GetCircle.cdc
 * Returns public circle info (name, memberCount, rotationQueue, nextPayoutDate).
 * Amounts are NOT returned — only the encrypted pool handle.
 */
export const GET_CIRCLE_SCRIPT = `
import CoopWise from 0xCOOPWISE_CONTRACT_ADDRESS

access(all)
fun main(circleId: UInt64): {String: AnyStruct} {
  return CoopWise.getCirclePublicInfo(circleId: circleId)
}
`;

/**
 * GetMemberStatus.cdc
 * Returns whether each member has contributed in the current round.
 * Returns: [{ address: String, hasContributed: Bool }]
 */
export const GET_MEMBER_STATUS_SCRIPT = `
import CoopWise from 0xCOOPWISE_CONTRACT_ADDRESS

access(all)
fun main(circleId: UInt64): [{String: AnyStruct}] {
  return CoopWise.getMemberContributionStatus(circleId: circleId)
}
`;
