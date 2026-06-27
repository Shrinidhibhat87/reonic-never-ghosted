"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherArchive } from "@subframe/core";
import { FeatherAlertTriangle } from "@subframe/core";
import { FeatherCheckCircle } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { FeatherMoreVertical } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherWand2 } from "@subframe/core";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getLeads } from "@/lib/api";
import { navTo } from "@/lib/nav";
import type { Lead } from "@/lib/types";

const COLUMNS = [
  { phase: "quote_sent", title: "Quote sent" },
  { phase: "to_specialist", title: "To specialist partner" },
  { phase: "waiting_install", title: "Waiting for install" },
  { phase: "installation_complete", title: "Installation complete" },
] as const;

const CARDS_PER_COLUMN = 4;

function fmtPrice(v: number, currency: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

function ghostBand(risk: number): { score: number; label: string; color: string } {
  const score = Math.round(risk * 100);
  if (risk >= 0.66) return { score, label: "High", color: "#E5484D" };
  if (risk >= 0.33) return { score, label: "Medium", color: "#E8A317" };
  return { score, label: "Low", color: "#30A46C" };
}

function GhostRiskBar({ risk }: { risk: number }) {
  const { score, label, color } = ghostBand(risk);
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-caption-bold font-caption-bold text-subtext-color">Ghost risk</span>
        <span className="text-caption-bold font-caption-bold" style={{ color }}>
          {score} · {label}
        </span>
      </div>
      <div
        className="relative h-2 w-full rounded-full"
        style={{ background: "linear-gradient(90deg,#30A46C 0%,#E8A317 55%,#E5484D 100%)" }}
      >
        <div
          className="absolute top-[-2px] h-3 w-[3px] rounded-full bg-default-font"
          style={{ left: `calc(${score}% - 1.5px)` }}
        />
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  onOpen,
  onStrategy,
}: {
  lead: Lead;
  onOpen: () => void;
  onStrategy: () => void;
}) {
  const phase = lead.board_phase;
  const subtitle = [lead.region, lead.products.join(" + ")].filter(Boolean).join(" · ");

  let badge: React.ReactNode = null;
  if (phase === "quote_sent") {
    const gb = ghostBand(lead.ghost_risk);
    const map = { High: "At risk", Medium: "Cooling off", Low: "Fresh" } as const;
    const variant = gb.label === "High" ? "error" : gb.label === "Medium" ? "warning" : "success";
    badge = <Badge variant={variant}>{map[gb.label as keyof typeof map]}</Badge>;
  } else if (phase === "installation_complete") {
    badge = <Badge variant="success" icon={<FeatherCheckCircle />}>Complete</Badge>;
  } else if (phase === "to_specialist") {
    badge = <Badge variant="brand">{lead.sub_status?.includes("reviewing") ? "In progress" : "Signed"}</Badge>;
  } else if (phase === "waiting_install") {
    badge = <Badge variant="warning">{lead.sub_status?.split("·")[0].trim()}</Badge>;
  }

  return (
    <div
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-lg border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex w-full items-start gap-2">
        <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
          {lead.customer_name}
        </span>
        {badge}
        <IconButton
          size="small"
          icon={<FeatherMoreVertical />}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
        />
      </div>

      <span className="text-caption font-caption text-subtext-color">{subtitle}</span>

      {phase === "quote_sent" && (
        <>
          <GhostRiskBar risk={lead.ghost_risk} />
          {lead.ghost_risk >= 0.33 && (
            <div className="flex items-center gap-1.5">
              <FeatherAlertTriangle className="text-caption font-caption text-error-600" />
              <span className="text-caption font-caption text-error-600">
                No follow-up in {lead.days_since_touch} days
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2 rounded-md border border-solid border-brand-100 bg-brand-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <FeatherSparkles className="text-caption font-caption text-brand-600" />
              <span className="text-caption-bold font-caption-bold text-brand-700">Next best action</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStrategy();
              }}
              className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-b from-brand-500 to-brand-600 px-3 py-2 text-caption-bold font-caption-bold text-white hover:from-brand-600 hover:to-brand-700 transition-colors"
            >
              <FeatherWand2 className="text-caption" />
              {lead.has_strategy ? "View strategy" : "Generate strategy"}
            </button>
          </div>
        </>
      )}

      {phase === "waiting_install" && lead.install_progress != null && (
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-caption font-caption text-subtext-color">{lead.sub_status}</span>
            <span className="text-caption-bold font-caption-bold text-brand-600">{lead.install_progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${lead.install_progress}%` }} />
          </div>
        </div>
      )}

      {(phase === "to_specialist" || phase === "installation_complete") && lead.sub_status && (
        <div className="flex items-center gap-1.5">
          <FeatherUsers className="text-caption font-caption text-brand-600" />
          <span className="text-caption font-caption text-default-font">{lead.sub_status}</span>
        </div>
      )}

      <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-2.5">
        <span className="grow shrink-0 basis-0 text-caption font-caption text-subtext-color">
          {lead.partner_name ?? "Unassigned"}
        </span>
        <span className="text-body-bold font-body-bold text-default-font">
          {fmtPrice(lead.total_price, lead.currency)}
        </span>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const router = useRouter();
  const [leads, setLeads] = React.useState<Lead[] | null>(null);
  const [error, setError] = React.useState<string>("");
  const [showArchived, setShowArchived] = React.useState(false);

  React.useEffect(() => {
    getLeads(1).then(setLeads).catch((e) => setError(String(e)));
  }, []);

  const byPhase = (leads ?? []).reduce<Record<string, Lead[]>>((acc, l) => {
    (acc[l.board_phase] ??= []).push(l);
    return acc;
  }, {});
  const archivedCount = byPhase["archived"]?.length ?? 0;
  const openCount = (leads ?? []).filter((l) => l.board_phase !== "archived").length;

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <Sidebar />
      <div className="app-main flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-hidden">
        <div className="flex w-full flex-wrap items-center gap-3 border-b border-solid border-neutral-border px-6 py-4 mobile:px-4">
          <div className="flex grow shrink-0 basis-0 items-baseline gap-3">
            <span className="text-heading-2 font-heading-2 text-default-font">Quotes</span>
            <span className="text-caption font-caption text-subtext-color">Manuel Tiral · {openCount} open deals</span>
          </div>
          <Button icon={<FeatherPlus />} onClick={() => {}}>
            Create quote
          </Button>
          <ToggleGroup value="kanban" onValueChange={() => {}}>
            <ToggleGroup.Item icon={null} value="list">
              List
            </ToggleGroup.Item>
            <ToggleGroup.Item icon={null} value="kanban">
              Kanban
            </ToggleGroup.Item>
          </ToggleGroup>
        </div>
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-6 py-3 mobile:px-4">
          <TextField className="h-auto grow shrink-0 basis-0" variant="filled" label="" helpText="" icon={<FeatherSearch />}>
            <TextField.Input placeholder="Search" value="" onChange={() => {}} />
          </TextField>
          <Button variant="neutral-tertiary" icon={<FeatherFilter />} onClick={() => {}}>
            User
          </Button>
          <Button
            variant={showArchived ? "neutral-secondary" : "neutral-tertiary"}
            icon={<FeatherArchive />}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
          </Button>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4 bg-neutral-50 px-6 py-6 overflow-auto mobile:px-4">
          {error && <span className="text-body font-body text-error-600">Failed to load leads: {error}</span>}
          {!leads && !error && <span className="text-body font-body text-subtext-color">Loading…</span>}
          {leads &&
            [...COLUMNS, ...(showArchived ? [{ phase: "archived", title: "Archived" } as const] : [])].map((col) => {
              const items = byPhase[col.phase] ?? [];
              const shown = items.slice(0, CARDS_PER_COLUMN);
              return (
                <div key={col.phase} className="flex flex-1 min-w-0 flex-col gap-3">
                  <div className="flex w-full items-center gap-2 px-1">
                    <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                      {col.title}
                    </span>
                    <Badge variant="neutral">{items.length}</Badge>
                  </div>
                  {shown.map((lead) => (
                    <LeadCard
                      key={lead.deal_id}
                      lead={lead}
                      onOpen={() => navTo(router, `/quotes/${lead.deal_id}`)}
                      onStrategy={() => navTo(router, `/quotes/${lead.deal_id}/strategy`)}
                    />
                  ))}
                  {items.length > CARDS_PER_COLUMN && (
                    <span className="px-1 text-caption font-caption text-subtext-color">
                      +{items.length - CARDS_PER_COLUMN} more
                    </span>
                  )}
                  {items.length === 0 && (
                    <span className="px-1 text-caption font-caption text-subtext-color">No deals</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
