"use client";

import { tryCatch } from "@/lib/try-catch";
import { Bot, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TicketListPanel } from "@/components/bazdmeg/dashboard/TicketListPanel";
import { TicketDetailPanel } from "@/components/bazdmeg/dashboard/TicketDetailPanel";
import { ChatPanel } from "@/components/bazdmeg/dashboard/ChatPanel";
import type { TicketItem } from "@/components/bazdmeg/dashboard/TicketListItem";

export function DashboardClient({ userName }: { userName: string; }) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: string; content: string; createdAt: string; }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"list" | "detail" | "chat">(
    "list",
  );

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    const { data: response } = await tryCatch(
      fetch("/api/bazdmeg/dashboard/issues"),
    );
    if (response?.ok) {
      const data = await response.json();
      setTickets(data.issues || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = useCallback((ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setActivePlanId(ticket.plan?.id ?? null);
    setChatMessages([]);
    setMobileTab("detail");
  }, []);

  const handlePlanCreated = useCallback(
    (planId: string) => {
      setActivePlanId(planId);
      // Load chat messages for this plan
      const currentTicketNumber = selectedTicket?.number;
      (async () => {
        const { data: response } = await tryCatch(
          fetch(
            `/api/bazdmeg/dashboard/plan?issueNumber=${currentTicketNumber}`,
          ),
        );
        if (response?.ok) {
          const data = await response.json();
          // Discard if ticket changed while fetching
          if (data.plan?.chatMessages) {
            setChatMessages(
              data.plan.chatMessages.map(
                (
                  m: {
                    id: string;
                    role: string;
                    content: string;
                    createdAt: string;
                  },
                ) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  createdAt: m.createdAt,
                }),
              ),
            );
          }
        }
      })();
    },
    [selectedTicket?.number],
  );

  const isJulesActive = selectedTicket?.plan?.status
    && [
      "SENT_TO_JULES",
      "JULES_WORKING",
      "JULES_REVIEW",
      "BUILD_FIXING",
    ].includes(selectedTicket.plan.status);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm shrink-0">
        <Link
          href="/bazdmeg"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <LayoutDashboard className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">
              BAZDMEG Developer Dashboard
            </h1>
            <p className="text-xs text-zinc-500">
              Plan, approve, and track ticket implementation
            </p>
          </div>
        </div>
        <div className="ml-auto text-xs text-zinc-600">{userName}</div>
      </header>

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-white/10 bg-zinc-900/30">
        {(["list", "detail", "chat"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mobileTab === tab
                ? "text-amber-400 border-b-2 border-amber-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "list" ? "Tickets" : tab === "detail" ? "Detail" : "Chat"}
          </button>
        ))}
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Ticket list */}
        <div
          className={`w-full lg:w-[320px] lg:border-r border-white/10 bg-zinc-900/30 backdrop-blur-xl shrink-0 overflow-hidden ${
            mobileTab === "list" ? "block" : "hidden lg:block"
          }`}
        >
          <TicketListPanel
            tickets={tickets}
            selectedTicketNumber={selectedTicket?.number ?? null}
            onSelectTicket={handleSelectTicket}
            onRefresh={fetchTickets}
            isLoading={isLoading}
          />
        </div>

        {/* Center panel - Ticket detail + plan */}
        <div
          className={`flex-1 min-w-0 border-r border-white/10 bg-zinc-900/20 backdrop-blur-xl overflow-hidden ${
            mobileTab === "detail" ? "block" : "hidden lg:block"
          }`}
        >
          {selectedTicket
            ? (
              <TicketDetailPanel
                ticket={selectedTicket}
                onPlanCreated={handlePlanCreated}
              />
            )
            : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LayoutDashboard className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Select a ticket to start planning
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Right panel - Chat */}
        <div
          className={`w-full lg:w-[360px] bg-zinc-900/30 backdrop-blur-xl shrink-0 overflow-hidden ${
            mobileTab === "chat" ? "block" : "hidden lg:block"
          }`}
        >
          <ChatPanel
            planId={activePlanId}
            initialMessages={chatMessages}
            isDisabled={!!isJulesActive}
          />
        </div>
      </div>
    </div>
  );
}
