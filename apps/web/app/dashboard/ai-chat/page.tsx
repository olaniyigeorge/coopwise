"use client";

import AIChatInterface from "@/components/ai/chat-interface";
import DashboardLayout from "@/components/dashboard/layout";

export default function AIChatPage() {
  return (
    <DashboardLayout viewportFill noPadding className="max-w-none w-full">
      <div className="flex flex-1 flex-col min-h-0 gap-0 lg:flex-row lg:gap-4 lg:px-4 lg:pb-2 lg:pt-2">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AIChatInterface />
        </div>

        <aside className="hidden max-h-[min(100dvh-4rem,900px)] w-80 flex-shrink-0 flex-col gap-3 overflow-y-auto overscroll-contain lg:flex lg:pr-2">
          <div className="bg-card rounded-lg border p-3">
            <h3 className="mb-1 text-base font-medium">About AI Assistant</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Your personal AI financial advisor for savings and cooperative groups.
            </p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                  ✓
                </span>
                <span>Chats are saved for about a week on the server</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                  ✓
                </span>
                <span>Use New Chat to clear saved history</span>
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-lg border p-3">
            <h3 className="mb-1 text-base font-medium">Tips</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>1. Be specific about goals</li>
              <li>2. Mention income or constraints if relevant</li>
              <li>3. Ask follow-ups</li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <h3 className="mb-1 text-base font-medium">Note</h3>
            <p className="text-xs">
              General guidance only — not professional financial advice.
            </p>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
