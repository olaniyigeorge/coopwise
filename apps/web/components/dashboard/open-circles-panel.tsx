"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import CircleService, { type Circle } from "@/lib/circle-service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function OpenCirclesPanel() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CircleService.discoverOpenCircles(0, 30);
      setCircles(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: "Could not load open circles",
        variant: "destructive",
      });
      setCircles([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin(c: Circle) {
    setJoining(c.id);
    try {
      await CircleService.joinCircle(c.id);
      toast({ title: "Joined!", description: `You joined ${c.name}.` });
      router.push(`/dashboard/circle/${c.id}`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || (e as Error)?.message || "Join failed";
      toast({ title: "Could not join", description: String(msg), variant: "destructive" });
    } finally {
      setJoining(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (circles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        No open circles right now. Try again later, or use an invite code in the
        other tab.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {circles.map((c) => {
        return (
          <li
            key={c.id}
            className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="h-4 w-4" />
                {c.member_count} members · {c.currency}{" "}
                {c.contribution_amount}/{c.payout_schedule ?? "weekly"}
              </p>
              {c.description ? (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{c.description}</p>
              ) : null}
            </div>
            <Button
              type="button"
              className="shrink-0"
              disabled={joining === c.id}
              onClick={() => handleJoin(c)}
            >
              {joining === c.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining…
                </>
              ) : (
                "Join"
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
