// apps/web/app/invite/[code]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import InvitePreviewCard from "@/components/invite/InvitePreviewCard";

function parseInviteCode(code: string): { groupId: string } | null {
  // Format: COOPWISE_{inviterId}:{groupId}
  try {
    const stripped = code.replace(/^COOPWISE_/, "");
    const [, groupId] = stripped.split(":");
    if (!groupId) return null;
    return { groupId };
  } catch {
    return null;
  }
}

async function getCirclePublic(groupId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/circles/public/${groupId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const parsed = parseInviteCode(code);
  if (!parsed) return { title: "Join Circle | CoopWise" };

  const circle = await getCirclePublic(parsed.groupId);
  if (!circle) return { title: "Join Circle | CoopWise" };

  return {
    title: `Join ${circle.name} on CoopWise`,
    description:
      circle.description ||
      `Save together with others. Contribute ${circle.contribution_amount} ${circle.currency} ${circle.contribution_frequency}.`,
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const parsed = parseInviteCode(code);
  if (!parsed) notFound();

  const circle = await getCirclePublic(parsed.groupId);
  if (!circle) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/icons/coopwise-logo-white.svg"
              alt="CoopWise"
              width={32}
              height={32}
            />
            <span className="font-bold text-lg">CoopWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              Log in
            </Link>
            <Link
              href="/auth/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-lg px-4 py-8">
        <InvitePreviewCard circle={circle} inviteCode={code} />
      </main>

      <footer className="bg-white border-t py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} CoopWise. All rights reserved.
      </footer>
    </div>
  );
}