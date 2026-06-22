"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherArchive } from "@subframe/core";
import { FeatherCheck } from "@subframe/core";
import { FeatherClock } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { FeatherGhost } from "@subframe/core";
import { FeatherMoreVertical } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherRoute } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherWand2 } from "@subframe/core";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { InfoTip } from "@/components/InfoTip";
import { getLeads } from "@/lib/api";
import type { Lead } from "@/lib/types";

// stage → column label + badge variant. Stages not listed fall into "Other".
const STAGE_META: Record<string, { label: string; variant: "error" | "warning" | "neutral" | "success" | "brand" }> = {
  quote_sent: { label: "Quote sent", variant: "error" },
  engaged: { label: "Engaged", variant: "warning" },
  negotiating: { label: "Negotiating", variant: "warning" },
  verbal_commit: { label: "Verbal commit", variant: "brand" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "neutral" },
  ghosted: { label: "Ghosted", variant: "neutral" },
};
const STAGE_ORDER = ["quote_sent", "engaged", "negotiating", "verbal_commit", "won", "lost", "ghosted"];

// Ghost risk is "likely to go quiet/unworked" — high is bad. Drive the badge off it.
function ghostMeta(risk: number): { label: string; variant: "error" | "warning" | "success" } {
  if (risk >= 0.66) return { label: "High ghost risk", variant: "error" };
  if (risk >= 0.33) return { label: "Cooling off", variant: "warning" };
  return { label: "Fresh", variant: "success" };
}

function fmtPrice(v: number, currency: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

export default function QuotesPage() {
  const router = useRouter();
  const [leads, setLeads] = React.useState<Lead[] | null>(null);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    getLeads(1).then(setLeads).catch((e) => setError(String(e)));
  }, []);

  const byStage = (leads ?? []).reduce<Record<string, Lead[]>>((acc, l) => {
    (acc[l.stage] ??= []).push(l);
    return acc;
  }, {});
  const columns = STAGE_ORDER.filter((s) => byStage[s]?.length).concat(
    Object.keys(byStage).filter((s) => !STAGE_ORDER.includes(s))
  );

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <Sidebar />
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-hidden">
        <div className="flex w-full flex-wrap items-center gap-3 border-b border-solid border-neutral-border px-6 py-4 mobile:px-4">
          <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
            Quotes
          </span>
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
          <Button variant="neutral-tertiary" icon={<FeatherArchive />} onClick={() => {}}>
            Show archived
          </Button>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4 bg-neutral-50 px-6 py-6 overflow-auto mobile:px-4">
          {error && (
            <span className="text-body font-body text-error-600">Failed to load leads: {error}</span>
          )}
          {!leads && !error && (
            <span className="text-body font-body text-subtext-color">Loading…</span>
          )}
          {leads &&
            columns.map((stage) => {
              const meta = STAGE_META[stage] ?? { label: stage, variant: "neutral" as const };
              const items = byStage[stage] ?? [];
              const open = stage === "quote_sent" || stage === "engaged" || stage === "negotiating";
              return (
                <div
                  key={stage}
                  className="flex w-80 flex-none flex-col items-start self-stretch rounded-md border border-solid border-neutral-border bg-neutral-50"
                >
                  <div className="flex w-full items-center gap-2 px-4 py-3">
                    <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                      {meta.label}
                    </span>
                    <Badge variant={meta.variant}>{items.length}×</Badge>
                  </div>
                  <div className="flex w-full flex-col items-start gap-3 px-3 pb-4 overflow-auto">
                    {items.map((lead) => {
                      const gm = ghostMeta(lead.ghost_risk);
                      return (
                        <div
                          key={lead.deal_id}
                          className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/requests/${lead.deal_id}`)}
                        >
                          <div className="flex w-full items-start gap-2">
                            <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                              {lead.customer_name}
                            </span>
                            <IconButton
                              size="small"
                              icon={<FeatherMoreVertical />}
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex w-full flex-col items-start">
                            <span className="text-caption font-caption text-subtext-color">{lead.region}</span>
                            <span className="text-caption font-caption text-subtext-color">
                              {lead.products.join(" + ")}
                            </span>
                          </div>
                          {/* Ghost-risk + strategy-ready signals (read from the engine, no re-run) */}
                          <div className="flex w-full flex-wrap items-center gap-2">
                            <Badge variant={gm.variant} icon={<FeatherGhost />}>
                              {gm.label}
                            </Badge>
                            <InfoTip
                              text={`Ghost risk ${Math.round(lead.ghost_risk * 100)}% — ${lead.days_since_touch} day(s) since the last touch. Higher = the prospect is going quiet and the deal is at risk of being ghosted.`}
                            />
                            {lead.has_strategy && (
                              <Badge variant="brand" icon={<FeatherRoute />}>
                                Strategy ready
                              </Badge>
                            )}
                          </div>
                          {open ? (
                            <div className="flex w-full flex-col items-start gap-2 rounded-md bg-brand-50 px-3 py-2">
                              <div className="flex w-full items-center gap-2">
                                <FeatherSparkles className="text-caption font-caption text-brand-600" />
                                <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-brand-700">
                                  {lead.has_strategy ? "View closing strategy" : "Next: Generate strategy"}
                                </span>
                              </div>
                              <Button
                                variant="brand-secondary"
                                size="small"
                                icon={<FeatherWand2 />}
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  router.push(`/requests/${lead.deal_id}/strategy`);
                                }}
                              >
                                {lead.has_strategy ? "View strategy" : "Generate strategy"}
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="brand" icon={<FeatherCheck />}>
                              {meta.label}
                            </Badge>
                          )}
                          <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                            <FeatherClock className="text-caption font-caption text-subtext-color grow shrink-0 basis-0" />
                            <span className="text-body-bold font-body-bold text-default-font">
                              {fmtPrice(lead.total_price, lead.currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
