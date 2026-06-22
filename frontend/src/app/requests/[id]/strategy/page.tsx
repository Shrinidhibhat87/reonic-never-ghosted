"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Checkbox } from "@/ui/components/Checkbox";
import { Select } from "@/ui/components/Select";
import { TextArea } from "@/ui/components/TextArea";
import { FeatherCalendarCheck } from "@subframe/core";
import { FeatherCalendarPlus } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherChevronUp } from "@subframe/core";
import { FeatherDatabase } from "@subframe/core";
import { FeatherGift } from "@subframe/core";
import { FeatherMail } from "@subframe/core";
import { FeatherMessageSquare } from "@subframe/core";
import { FeatherPhone } from "@subframe/core";
import { FeatherRoute } from "@subframe/core";
import { FeatherShieldCheck } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherStickyNote } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherWand } from "@subframe/core";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { InfoTip } from "@/components/InfoTip";
import { StrategyLoader } from "@/components/StrategyLoader";
import { QuickActions } from "@/components/QuickActions";
import { CreativePlays } from "@/components/CreativePlays";
import { addAppointment, draftStep, generateStrategy, reviseStep } from "@/lib/api";
import type { EngineChoice, RevisionResult, Step, StrategyResult } from "@/lib/types";

const ENGINE_LABEL: Record<string, string> = {
  voltagent: "VoltAgent",
  python: "Python engine",
  fake: "Deterministic",
  "voltagent (fallback)": "VoltAgent (fallback)",
};

const GOAL_LABEL: Record<string, string> = {
  build_trust: "BUILD TRUST",
  establish_value: "ESTABLISH VALUE",
  create_urgency: "CREATE URGENCY",
  close_gap: "CLOSE GAP",
  handle_objection: "HANDLE OBJECTION",
  ask_for_commitment: "ASK FOR COMMITMENT",
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  call: <FeatherPhone />,
  email: <FeatherMail />,
  sms: <FeatherMessageSquare />,
  whatsapp: <FeatherMessageSquare />,
  meeting: <FeatherUsers />,
  gift: <FeatherGift />,
  send_gift: <FeatherGift />,
};

const CHIP_LABEL: Record<string, string> = {
  behavioral: "Behavioural signal",
  benchmark: "Org benchmark",
  deal_history: "Deal history",
};

const DAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function StrategyPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = Number(params.id);

  const [strategy, setStrategy] = React.useState<StrategyResult | null>(null);
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [drafts, setDrafts] = React.useState<Record<number, string>>({});
  const [expandedPersona, setExpandedPersona] = React.useState<Set<string>>(new Set());
  const [expandedChip, setExpandedChip] = React.useState<Set<string>>(new Set());
  const [reviseOpen, setReviseOpen] = React.useState<number | null>(null);
  const [instructions, setInstructions] = React.useState<Record<number, string>>({});
  const [revising, setRevising] = React.useState<number | null>(null);
  const [revisions, setRevisions] = React.useState<Record<number, RevisionResult>>({});
  const [calAdded, setCalAdded] = React.useState<Record<number, string>>({});
  // Sales-agent controls: which engine writes the plan + whether to ask it for
  // out-of-the-box creative plays. Changing either re-runs generation.
  const [engine, setEngine] = React.useState<EngineChoice>("voltagent");
  const [creative, setCreative] = React.useState(false);

  const regenerate = React.useCallback(() => {
    setError("");
    setLoading(true);
    generateStrategy(dealId, { engine, creative })
      .then(setStrategy)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [dealId, engine, creative]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  function toggle(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  }

  async function onDraft(order: number) {
    try {
      const { message } = await draftStep(dealId, order);
      setDrafts((d) => ({ ...d, [order]: message }));
    } catch (e) {
      setDrafts((d) => ({ ...d, [order]: `Draft failed: ${String(e)}` }));
    }
  }

  async function onRevise(order: number) {
    const instruction = (instructions[order] || "").trim();
    if (!instruction) return;
    setRevising(order);
    try {
      const result = await reviseStep(dealId, order, instruction, { engine, creative }); // targets the real step
      setRevisions((r) => ({ ...r, [order]: result }));
      if (result.applied && strategy) {
        // Swap the updated step into the play so the change is visible.
        setStrategy({
          ...strategy,
          steps: strategy.steps.map((s) => (s.order === order ? result.step : s)),
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setRevising(null);
    }
  }

  async function onAddToCalendar(step: Step) {
    const title = step.title || `${step.channel} — ${GOAL_LABEL[step.goal] ?? step.goal}`;
    try {
      const appt = await addAppointment(title, dealId);
      setCalAdded((c) => ({ ...c, [step.order]: `${DAY_LABEL[appt.day]} ${appt.start_hour}:00` }));
    } catch (e) {
      setCalAdded((c) => ({ ...c, [step.order]: `Failed: ${String(e)}` }));
    }
  }

  const sortedPersonas = strategy
    ? [...strategy.persona_scores].sort((a, b) => b.weight - a.weight)
    : [];

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <Sidebar />
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-auto">
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-8 py-4 mobile:px-4">
          <div className="flex grow shrink-0 basis-0 items-center gap-2">
            <span className="text-body font-body text-subtext-color cursor-pointer hover:text-default-font" onClick={() => router.push("/quotes")}>
              Requests
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-subtext-color cursor-pointer hover:text-default-font" onClick={() => router.push(`/requests/${dealId}`)}>
              Deal #{dealId}
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-heading-3 font-heading-3 text-default-font">Closing Strategy</span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-6 px-8 py-8 mobile:px-4 mobile:py-6">
          {/* Sales-agent controls: pick the engine + opt in to creative plays. */}
          <div className="flex w-full flex-wrap items-end gap-4 rounded-lg border border-solid border-neutral-border bg-neutral-50 px-6 py-4">
            <Select
              className="h-auto"
              label="Strategy engine"
              value={engine}
              onValueChange={(v: string) => setEngine(v as EngineChoice)}
            >
              <Select.Item value="voltagent">VoltAgent (primary)</Select.Item>
              <Select.Item value="python">Python engine</Select.Item>
              <Select.Item value="fake">Deterministic</Select.Item>
            </Select>
            <Checkbox
              label="Think outside the box (creative plays)"
              checked={creative}
              onCheckedChange={setCreative}
            />
            <Button
              variant="neutral-secondary"
              icon={<FeatherWand />}
              loading={loading}
              onClick={regenerate}
            >
              Regenerate
            </Button>
            {strategy && (
              <Badge variant="neutral">Generated by {ENGINE_LABEL[strategy.engine] ?? strategy.engine}</Badge>
            )}
          </div>
          {loading && <StrategyLoader />}
          {error && !loading && (
            <span className="text-body font-body text-error-600">Failed to generate strategy: {error}</span>
          )}
          {strategy && (
            <>
              <QuickActions />

              <CreativePlays plays={strategy.creative_plays} />

              {/* Buyer profile + personas */}
              <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
                <div className="flex w-full items-center gap-2">
                  <FeatherUsers className="text-heading-3 font-heading-3 text-brand-600" />
                  <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">Buyer profile</span>
                  <Badge variant="warning">Goal: {GOAL_LABEL[strategy.current_goal] ?? strategy.current_goal}</Badge>
                </div>
                {strategy.buyer_profile?.summary && (
                  <span className="w-full text-body font-body text-subtext-color">{strategy.buyer_profile.summary as string}</span>
                )}
                <div className="flex w-full flex-col items-start gap-3 border-t border-solid border-neutral-border pt-4">
                  <div className="flex items-center gap-1">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">PERSONA MIX</span>
                    <InfoTip text="The engine scores the prospect across personas from their notes, signals and quote. Weight = how strongly that persona reads; click a bar to see the evidence behind it." />
                  </div>
                  {sortedPersonas.map((p) => {
                    const open = expandedPersona.has(p.persona);
                    return (
                      <div key={p.persona} className="flex w-full flex-col items-start gap-1">
                        <button
                          className="flex w-full items-center gap-3 text-left"
                          onClick={() => toggle(expandedPersona, p.persona, setExpandedPersona)}
                        >
                          <span className="w-40 flex-none text-body-bold font-body-bold text-default-font capitalize">
                            {p.persona.replace(/_/g, " ")}
                          </span>
                          <div className="relative grow shrink-0 basis-0 h-3 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full bg-brand-500" style={{ width: `${Math.round(p.weight * 100)}%` }} />
                          </div>
                          <Badge variant="success">{p.strength}</Badge>
                          <span className="w-10 flex-none text-right text-caption font-caption text-subtext-color">
                            {Math.round(p.weight * 100)}%
                          </span>
                          {open ? (
                            <FeatherChevronUp className="text-body font-body text-subtext-color" />
                          ) : (
                            <FeatherChevronDown className="text-body font-body text-subtext-color" />
                          )}
                        </button>
                        {open && (
                          <div className="flex w-full flex-col items-start gap-1 rounded-md bg-neutral-50 px-4 py-3 ml-40">
                            <span className="text-caption-bold font-caption-bold text-subtext-color">WHY THIS SCORE</span>
                            {p.evidence_refs.length ? (
                              p.evidence_refs.map((ref, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <FeatherDatabase className="text-caption font-caption text-brand-600 mt-0.5" />
                                  <span className="text-caption font-caption text-default-font">{ref}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-caption font-caption text-subtext-color">No evidence captured for this persona.</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex w-full flex-wrap items-start gap-6 border-t border-solid border-neutral-border pt-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">TOP MOTIVATIONS</span>
                    <span className="text-body font-body text-default-font">{strategy.top_motivations.join(", ") || "—"}</span>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">OBJECTIONS</span>
                    <span className="text-body font-body text-default-font">{strategy.objections.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>

              {/* The play — multi-channel timeline */}
              <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
                <div className="flex w-full items-center gap-2">
                  <FeatherRoute className="text-heading-3 font-heading-3 text-brand-600" />
                  <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">The play</span>
                  <InfoTip text="An ordered, multi-channel sequence laddering toward the current goal — lowest-pressure move first. Each step is grounded in the evidence chips shown." />
                </div>
                {strategy.steps.map((step) => {
                  const rev = revisions[step.order];
                  return (
                    <div key={step.order} className="flex w-full items-start gap-4 border-t border-solid border-neutral-border pt-4">
                      <div className="flex flex-none flex-col items-center gap-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-solid border-brand-200 bg-brand-50 text-brand-600">
                          {CHANNEL_ICON[step.channel] ?? <FeatherRoute />}
                        </div>
                        {step.timing && (
                          <span className="text-caption font-caption text-subtext-color whitespace-nowrap">{step.timing}</span>
                        )}
                      </div>
                      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                        {step.title && (
                          <span className="text-body-bold font-body-bold text-default-font">
                            {step.order}. {step.title}
                          </span>
                        )}
                        {(step.revision_notes ?? []).map((note, i) => (
                          <div
                            key={i}
                            className="flex w-full items-start gap-2 rounded-md border border-solid border-brand-200 bg-brand-50 px-4 py-3"
                          >
                            <FeatherStickyNote className="text-body font-body text-brand-600 mt-0.5" />
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-caption-bold font-caption-bold text-brand-700">Note added by you</span>
                              <span className="text-body font-body text-default-font">{note}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">{GOAL_LABEL[step.goal] ?? step.goal}</Badge>
                          <Badge variant="neutral">{step.lever.replace(/_/g, " ")}</Badge>
                          <Badge variant="neutral">{step.channel}</Badge>
                        </div>
                        <span className="w-full text-body font-body text-default-font whitespace-pre-wrap">{step.rationale}</span>

                        {/* Evidence chips — click to expand to the source */}
                        <div className="flex w-full flex-wrap items-center gap-2">
                          {step.evidence_chips.map((chip, i) => {
                            const key = `${step.order}-${i}`;
                            const open = expandedChip.has(key);
                            return (
                              <button
                                key={i}
                                onClick={() => toggle(expandedChip, key, setExpandedChip)}
                                className={`flex items-center gap-1 rounded-full border border-solid px-3 py-1 ${open ? "border-brand-300 bg-brand-50" : "border-neutral-border bg-default-background"}`}
                              >
                                <FeatherDatabase className="text-caption font-caption text-brand-600" />
                                <span className="text-caption font-caption text-default-font">{chip.text}</span>
                                <span className="ml-1 border-l border-solid border-neutral-border pl-2 text-caption-bold font-caption-bold text-subtext-color whitespace-nowrap">
                                  {CHIP_LABEL[chip.kind] ?? chip.kind}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {step.evidence_chips.map((chip, i) => {
                          const key = `${step.order}-${i}`;
                          if (!expandedChip.has(key)) return null;
                          return (
                            <div key={key} className="flex w-full flex-col items-start gap-1 rounded-md bg-neutral-50 px-4 py-3">
                              <span className="text-caption-bold font-caption-bold text-subtext-color">
                                {CHIP_LABEL[chip.kind] ?? chip.kind}
                              </span>
                              <span className="text-body font-body text-default-font">{chip.text}</span>
                              {chip.ref && (
                                <span className="text-caption font-caption text-subtext-color">Source ref: {chip.ref}</span>
                              )}
                            </div>
                          );
                        })}

                        {/* Actions */}
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <Button variant="neutral-secondary" icon={<FeatherMail />} onClick={() => onDraft(step.order)}>
                            Draft message
                          </Button>
                          <Button
                            variant="neutral-tertiary"
                            icon={calAdded[step.order] ? <FeatherCalendarCheck /> : <FeatherCalendarPlus />}
                            disabled={!!calAdded[step.order]}
                            onClick={() => onAddToCalendar(step)}
                          >
                            {calAdded[step.order] ? `Added · ${calAdded[step.order]}` : "Add to calendar"}
                          </Button>
                          <Button
                            variant="neutral-tertiary"
                            icon={<FeatherWand />}
                            onClick={() => setReviseOpen(reviseOpen === step.order ? null : step.order)}
                          >
                            Revise
                          </Button>
                          {calAdded[step.order] && !calAdded[step.order].startsWith("Failed") && (
                            <span
                              className="text-caption font-caption text-brand-600 cursor-pointer hover:underline"
                              onClick={() => router.push("/calendar")}
                            >
                              View in calendar →
                            </span>
                          )}
                        </div>

                        {drafts[step.order] && (
                          <div className="flex w-full flex-col items-start gap-1 rounded-md bg-neutral-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FeatherSparkles className="text-caption font-caption text-brand-600" />
                              <span className="text-caption-bold font-caption-bold text-brand-700">Suggested draft</span>
                            </div>
                            <span className="w-full text-body font-body text-default-font whitespace-pre-wrap">{drafts[step.order]}</span>
                          </div>
                        )}

                        {/* Per-step revise — targets THIS step */}
                        {reviseOpen === step.order && (
                          <div className="flex w-full flex-col items-start gap-2 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-3">
                            <span className="text-caption font-caption text-subtext-color">
                              Describe what&#39;s off with this step. It&#39;s checked against the deal&#39;s data before anything changes.
                            </span>
                            <TextArea className="h-auto w-full flex-none" label="" helpText="">
                              <TextArea.Input
                                className="h-20 w-full flex-none"
                                placeholder="e.g. she already arranged financing — focus this step on the payback comparison instead."
                                value={instructions[step.order] || ""}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setInstructions((m) => ({ ...m, [step.order]: e.target.value }))
                                }
                              />
                            </TextArea>
                            <Button icon={<FeatherWand />} loading={revising === step.order} onClick={() => onRevise(step.order)}>
                              Review &amp; update step
                            </Button>
                          </div>
                        )}
                        {rev && (
                          <div className="flex w-full items-center gap-2 rounded-md bg-default-background border border-solid border-neutral-border px-4 py-3">
                            <FeatherShieldCheck className={`text-body font-body ${rev.applied ? "text-success-600" : "text-warning-600"}`} />
                            <span className="text-body font-body text-default-font">
                              {rev.applied ? "Applied: " : "Not applied: "}
                              {rev.reason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex w-full items-center gap-1 border-t border-solid border-neutral-border pt-3">
                  <FeatherShieldCheck className="text-caption font-caption text-subtext-color" />
                  <span className="text-caption font-caption text-subtext-color">
                    Revisions are reviewed against this deal&#39;s data — unsupported requests are flagged, not auto-applied.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
