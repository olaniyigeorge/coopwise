import { createHash } from "crypto";
import { resolveBackendUrl } from "./backend-url";

export const BACKEND_URL = resolveBackendUrl();

type LegacyUser = {
  id?: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  flow_address?: string | null;
};

type LegacyMember = {
  id?: string | number;
  user_id?: string | null;
  group_id?: string | null;
  role?: string | null;
  status?: string | null;
  joined_at?: string | null;
  created_at?: string | null;
  payout_position?: number | null;
  has_received_payout_this_cycle?: boolean | null;
  user?: LegacyUser | null;
};

type LegacyContribution = {
  id?: string;
  user_id?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  due_date?: string | null;
  fulfilled_at?: string | null;
  note?: string | null;
  status?: string | null;
  created_at?: string | null;
  tx_id?: string | null;
  round_number?: number | null;
};

type LegacyGroup = {
  id?: string;
  name?: string;
  creator_id?: string;
  description?: string | null;
  image_url?: string | null;
  contribution_amount?: number | string | null;
  contribution_frequency?: string | null;
  payout_strategy?: string | null;
  coop_model?: string | null;
  max_members?: number | string | null;
  target_amount?: number | string | null;
  status?: string | null;
  next_payout_date?: string | null;
  created_at?: string;
  updated_at?: string;
  members?: LegacyMember[];
  members_count?: number;
  contributions?: LegacyContribution[];
  member_count?: number;
  chain_circle_id?: number | string | null;
  weekly_amount_usdc?: number | string | null;
  currency?: string | null;
  rotation_order?: string | null;
  current_round?: number | null;
  is_complete?: boolean | null;
  current_winner?: string | null;
  join_policy?: string | null;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDate(value: string | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export function getAuthHeader(request: Request) {
  return request.headers.get("Authorization") ?? undefined;
}

export function buildBackendHeaders(authHeader?: string) {
  return {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export function decodeUserIdFromAuthHeader(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const payload = authHeader.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

export function deriveUuidFromString(input: string) {
  const hex = createHash("sha1").update(input).digest("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

export function normalizeCircleMembers(group: LegacyGroup) {
  const contributions = group.contributions ?? [];
  const contributedUserIds = new Set(
    contributions
      .filter((entry) => String(entry.status ?? "").toLowerCase() === "completed")
      .map((entry) => entry.user_id)
      .filter(Boolean)
  );

  return [...(group.members ?? [])]
    .sort((left, right) => {
      const leftTime = new Date(
        left.joined_at ?? left.created_at ?? 0
      ).getTime();
      const rightTime = new Date(
        right.joined_at ?? right.created_at ?? 0
      ).getTime();
      return leftTime - rightTime;
    })
    .map((member, index) => ({
      user_id: String(member.user_id ?? ""),
      group_id: String(member.group_id ?? group.id ?? ""),
      role: String(member.role ?? "member"),
      status: String(member.status ?? "accepted"),
      payout_position: member.payout_position ?? index + 1,
      queue_position: member.payout_position ?? index + 1,
      has_received_payout_this_cycle: Boolean(
        member.has_received_payout_this_cycle
      ),
      joined_at: toIsoDate(member.joined_at ?? member.created_at),
      full_name:
        member.user?.full_name ??
        member.user?.username ??
        "Circle member",
      username: member.user?.username ?? null,
      profile_picture_url: member.user?.profile_picture_url ?? null,
      flow_address: member.user?.flow_address ?? null,
      is_email_verified: false,
      has_contributed_this_round: contributedUserIds.has(member.user_id ?? null),
    }));
}

export function normalizeCircleHistory(group: LegacyGroup) {
  const members = group.members ?? [];
  const usersById = new Map(
    members
      .filter((member) => member.user_id)
      .map((member) => [member.user_id as string, member.user])
  );

  return [...(group.contributions ?? [])]
    .sort((left, right) => {
      const leftTime = new Date(
        left.fulfilled_at ?? left.created_at ?? 0
      ).getTime();
      const rightTime = new Date(
        right.fulfilled_at ?? right.created_at ?? 0
      ).getTime();
      return rightTime - leftTime;
    })
    .map((entry, index) => {
      const user = usersById.get(String(entry.user_id ?? ""));
      const txId = entry.tx_id ?? String(entry.id ?? "");
      const networkPrefix =
        process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet" ? "" : "testnet.";

      return {
        contribution_id: String(entry.id ?? ""),
        amount: toNumber(entry.amount, 0),
        currency: String(entry.currency ?? group.currency ?? "NGN"),
        status: String(entry.status ?? "completed"),
        note: entry.note ?? null,
        due_date: toIsoDate(entry.due_date),
        fulfilled_at: toIsoDate(entry.fulfilled_at),
        created_at: toIsoDate(entry.created_at) ?? new Date().toISOString(),
        submitted_at:
          toIsoDate(entry.fulfilled_at) ??
          toIsoDate(entry.created_at) ??
          new Date().toISOString(),
        round: entry.round_number ?? index + 1,
        member_name: user?.full_name ?? user?.username ?? "Circle member",
        member_address: user?.flow_address ?? null,
        tx_id: txId,
        explorer_url: entry.tx_id
          ? `https://${networkPrefix}flowscan.io/tx/${entry.tx_id}`
          : null,
      };
    });
}

export function normalizeCircle(
  group: LegacyGroup,
  options?: { currentUserId?: string | null }
) {
  const members = normalizeCircleMembers(group);
  const currentUserId = options?.currentUserId ?? null;
  const currentUserMembership = members.find(
    (member) => member.user_id && member.user_id === currentUserId
  );
  const memberCount =
    group.member_count ?? group.members_count ?? members.length ?? 0;
  const contributionAmount = toNumber(group.contribution_amount, 0);
  const currentRound = Math.max(
    1,
    toNumber(group.current_round, members.length > 0 ? 1 : 0)
  );
  const currentWinner =
    group.current_winner ??
    members.find((member) => member.payout_position === currentRound)
      ?.flow_address ??
    null;

  return {
    id: String(group.id ?? ""),
    chain_circle_id: toNumber(group.chain_circle_id, 0),
    name: String(group.name ?? "Untitled circle"),
    creator_id: String(group.creator_id ?? ""),
    description: group.description ?? null,
    member_count: memberCount,
    contribution_amount: contributionAmount,
    weekly_amount_local: contributionAmount,
    currency: String(group.currency ?? "NGN"),
    weekly_amount_usdc: toNumber(group.weekly_amount_usdc, 0),
    payout_schedule: String(
      group.contribution_frequency ?? "weekly"
    ),
    rotation_order: String(group.rotation_order ?? "sequential"),
    current_round: currentRound,
    is_complete:
      typeof group.is_complete === "boolean"
        ? group.is_complete
        : String(group.status ?? "").toLowerCase() === "completed",
    next_payout_date: toIsoDate(group.next_payout_date),
    your_position_in_queue: currentUserMembership?.payout_position ?? null,
    current_winner: currentWinner,
    created_at: toIsoDate(group.created_at) ?? new Date().toISOString(),
    join_policy: String(group.join_policy ?? "invite_only"),
  };
}

export function buildLegacyCircleCreatePayload(
  payload: Record<string, unknown>,
  currentUserId: string
) {
  const memberPhones = Array.isArray(payload.member_phones)
    ? payload.member_phones.filter(Boolean)
    : [];
  const contributionAmount =
    toNumber(payload.weekly_amount_local, 0) ||
    toNumber(payload.contribution_amount, 0);
  const payoutSchedule = String(
    payload.payout_schedule ?? payload.contribution_frequency ?? "weekly"
  );
  const normalizedFrequency =
    payoutSchedule === "biweekly" ? "weekly" : payoutSchedule;
  const maxMembers = Math.max(
    toNumber(payload.max_members, 0),
    memberPhones.length + 1,
    2
  );

  return {
    name: String(payload.name ?? "Untitled circle").trim(),
    creator_id: currentUserId,
    description:
      typeof payload.description === "string" && payload.description.trim()
        ? payload.description.trim()
        : null,
    image_url:
      typeof payload.image_url === "string" && payload.image_url.trim()
        ? payload.image_url.trim()
        : null,
    contribution_amount: contributionAmount,
    contribution_frequency: normalizedFrequency,
    payout_strategy:
      payload.rotation_order === "random"
        ? "priority"
        : String(payload.payout_strategy ?? "rotating"),
    coop_model: String(payload.coop_model ?? "ajo"),
    max_members: maxMembers,
    target_amount:
      toNumber(payload.target_amount, 0) || contributionAmount * maxMembers,
    status: String(payload.status ?? "active"),
    rules: Array.isArray(payload.rules) ? payload.rules : null,
    join_policy:
      payload.join_policy === "open" || payload.join_policy === "invite_only"
        ? String(payload.join_policy)
        : "invite_only",
  };
}
