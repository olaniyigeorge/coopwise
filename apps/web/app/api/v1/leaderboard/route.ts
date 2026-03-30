import { NextResponse } from "next/server";
import {
  BACKEND_URL,
  normalizeCircle,
  readJsonSafe,
} from "@/lib/server/circle-contract";

export async function GET() {
  const groupsResponse = await fetch(`${BACKEND_URL}/api/v1/cooperatives/`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const groupsData = await readJsonSafe(groupsResponse);

  if (!groupsResponse.ok) {
    return NextResponse.json(
      groupsData ?? { detail: "Failed to load leaderboard" },
      { status: groupsResponse.status }
    );
  }

  const groups = Array.isArray(groupsData) ? groupsData : [];
  const extendedGroups = await Promise.all(
    groups.slice(0, 20).map(async (group) => {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/cooperatives/ext/${group.id}`,
        {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );
      const data = await readJsonSafe(response);
      return response.ok ? { ...group, ...data } : group;
    })
  );

  const ranked = extendedGroups
    .map((group) => {
      const circle = normalizeCircle(group);
      const totalContributions = Array.isArray(group?.contributions)
        ? group.contributions.length
        : 0;

      return {
        ...circle,
        total_contributions: totalContributions,
      };
    })
    .sort((left, right) => right.total_contributions - left.total_contributions);

  const platformStats = ranked.reduce(
    (acc, circle) => ({
      total_circles: acc.total_circles + 1,
      total_members: acc.total_members + circle.member_count,
      total_contributions:
        acc.total_contributions + circle.total_contributions,
      completed_circles:
        acc.completed_circles + (circle.is_complete ? 1 : 0),
    }),
    {
      total_circles: 0,
      total_members: 0,
      total_contributions: 0,
      completed_circles: 0,
    }
  );

  return NextResponse.json({
    platform_stats: platformStats,
    top_circles: ranked.slice(0, 10).map((circle) => ({
      name: circle.name,
      chain_circle_id: circle.chain_circle_id,
      total_contributions: circle.total_contributions,
      member_count: circle.member_count,
      current_round: circle.current_round,
    })),
  });
}
