import { ChevronDown, ChevronUp, Clock3, Info, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api, formatMoney } from "../lib/api.js";
import { getQuoteLikelihood } from "../lib/quoteLikelihood.js";
import type { ActionRecord, AgentTraceEvent, QuoteDetailPayload, StrategyStep } from "../../server/types.js";
import { LikelihoodPill } from "./LikelihoodPill.js";
import { LogActionDialog } from "./LogActionDialog.js";
import { AppIcon, Avatar, Badge, EmptyPanel, ErrorState, LoadingState, PageHeader } from "./ui.js";

type StrategyOperation = "generate" | "revise" | null;
type ActionOperation = { type: "schedule" | "complete"; actionId: string } | null;

export function StrategyPage() {
  const { quoteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<QuoteDetailPayload>();
  const [loading, setLoading] = useState(true);
  const [strategyOperation, setStrategyOperation] = useState<StrategyOperation>(null);
  const [actionOperation, setActionOperation] = useState<ActionOperation>(null);
  const [traceEvents, setTraceEvents] = useState<AgentTraceEvent[]>([]);
  const [autoGenerateQuoteId, setAutoGenerateQuoteId] = useState<string>();
  const [error, setError] = useState<string>();
  const [revision, setRevision] = useState("");
  const [logAction, setLogAction] = useState<ActionRecord>();
  const [logOpen, setLogOpen] = useState(false);
  const navigate = useNavigate();

  async function load() {
    if (!quoteId) {
      return;
    }
    setLoading(true);
    try {
      setDetail(await api.quote(quoteId));
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load strategy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [quoteId]);

  useEffect(() => {
    if (
      searchParams.get("regenerate") !== "1" ||
      !quoteId ||
      loading ||
      !detail ||
      strategyOperation ||
      autoGenerateQuoteId === quoteId
    ) {
      return;
    }

    setAutoGenerateQuoteId(quoteId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("regenerate");
    setSearchParams(nextParams, { replace: true });
    void generate();
  }, [
    autoGenerateQuoteId,
    detail,
    loading,
    quoteId,
    searchParams,
    setSearchParams,
    strategyOperation,
  ]);

  const activeStep = detail?.strategy?.steps.find((step) => step.status === "active");
  const activeAction = useMemo(() => {
    if (!detail?.quote.nextAction.actionId) {
      return undefined;
    }
    return detail.actions.find((action) => action.id === detail.quote.nextAction.actionId);
  }, [detail]);

  async function generate() {
    if (!quoteId) {
      return;
    }
    setStrategyOperation("generate");
    setTraceEvents([]);
    try {
      setDetail(
        await api.generateStrategyStream(quoteId, (event) => {
          setTraceEvents((current) => [...current, event]);
        }),
      );
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate strategy");
    } finally {
      setStrategyOperation(null);
    }
  }

  async function revisePlan() {
    if (!quoteId || !revision.trim()) {
      return;
    }
    setStrategyOperation("revise");
    setTraceEvents([]);
    try {
      setDetail(
        await api.reviseStrategyStream(quoteId, revision.trim(), (event) => {
          setTraceEvents((current) => [...current, event]);
        }),
      );
      setRevision("");
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not revise strategy");
    } finally {
      setStrategyOperation(null);
    }
  }

  async function schedule(preparationBody?: string) {
    if (!activeAction) {
      return;
    }
    setActionOperation({ type: "schedule", actionId: activeAction.id });
    try {
      const updated = await api.scheduleAction(
        activeAction.id,
        {
          ...(activeStep?.suggestedDateTime ? { slotStart: activeStep.suggestedDateTime } : {}),
          ...(preparationBody ? { preparationBody } : {}),
        },
      );
      setDetail(updated);
      navigate(`/calendar?quote=${updated.quote.id}`);
    } finally {
      setActionOperation(null);
    }
  }

  async function savePreparation(actionId: string, body: string) {
    setDetail(await api.updateActionPreparation(actionId, { body }));
  }

  async function complete() {
    if (!activeAction) {
      return;
    }
    setActionOperation({ type: "complete", actionId: activeAction.id });
    try {
      const updated = await api.completeAction(activeAction.id);
      setDetail(updated);
      navigate("/quotes");
    } finally {
      setActionOperation(null);
    }
  }

  function openLog() {
    if (activeAction) {
      setLogAction(activeAction);
      setLogOpen(true);
    }
  }

  if (loading) {
    return <LoadingState label="Loading strategy" />;
  }
  if (error || !detail) {
    return <ErrorState message={error ?? "Missing quote detail"} />;
  }

  return (
    <section className="page strategy-page">
      <PageHeader
        title="Closing Strategy"
        breadcrumbs={[
          { label: "Requests", to: "/quotes" },
          { label: detail.customer.name, to: `/customers/${detail.customer.id}?quote=${detail.quote.id}` },
        ]}
      />
      <CustomerProfileCard detail={detail} />
      {strategyOperation ? (
        <AgentRunPanel
          title={strategyOperation === "generate" ? "Generating strategy..." : "Reviewing revision..."}
          events={traceEvents}
        />
      ) : null}
      {detail.strategy ? (
        <>
          {detail.strategy.stale || detail.quote.strategyStale ? (
            <div className="warning-banner">
              <Info size={17} />
              <div>
                <strong>Strategy may be out of date</strong>
                <span>Master data changed after this strategy was generated.</span>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => void generate()}
                disabled={Boolean(strategyOperation || actionOperation)}
              >
                Regenerate strategy
              </button>
            </div>
          ) : null}
          <section className="strategy-card">
            <div className="strategy-title">
              <AppIcon name="sparkles" size={20} />
              <h2>The play</h2>
              {detail.strategy.generation ? (
                <span className={`generation-pill generation-${detail.strategy.generation.mode}`}>
                  {detail.strategy.generation.mode === "llm" ? "GPT-5 mini" : "Fallback engine"}
                </span>
              ) : null}
            </div>
            <h3>{detail.strategy.headline}</h3>
            <p>{detail.strategy.summary}</p>
            <div className="strategy-steps">
              {detail.strategy.steps.map((step) => (
                <StrategyStepView
                  step={step}
                  key={step.id}
                  active={step.id === activeStep?.id}
                  actionBusy={
                    activeAction && actionOperation?.actionId === activeAction.id
                      ? actionOperation.type
                      : undefined
                  }
                  action={activeAction}
                  strategyBusy={Boolean(strategyOperation)}
                  onSchedule={(preparationBody) => void schedule(preparationBody)}
                  onComplete={() => void complete()}
                  onLog={openLog}
                  onSavePreparation={(actionId, body) => void savePreparation(actionId, body)}
                  nextKind={detail.quote.nextAction.kind}
                />
              ))}
            </div>
          </section>
          <section className="revision-card">
            <h2>Revise this strategy</h2>
            <p>Describe what's off in plain language. Your input is checked against this deal's data before any step is changed.</p>
            <textarea
              rows={5}
              value={revision}
              onChange={(event) => setRevision(event.target.value)}
              placeholder="e.g. Sabine already arranged her own financing — drop the financing step and prioritize the payback comparison."
            />
            <div className="review-note">
              Reviewed before applying — unsupported requests are flagged, not auto-applied.
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={Boolean(strategyOperation || actionOperation) || !revision.trim()}
              onClick={() => void revisePlan()}
            >
              <WandSparkles size={16} />
              {strategyOperation === "revise" ? "Reviewing..." : "Review & update plan"}
            </button>
          </section>
        </>
      ) : (
        <EmptyPanel
          icon="bot"
          title="No closing strategy yet"
          description={`Generate a data-backed play for ${detail.customer.name} based on her buyer profile, call notes, and similar past deals.`}
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() => void generate()}
              disabled={Boolean(strategyOperation || actionOperation)}
            >
              <WandSparkles size={16} />
              {strategyOperation === "generate" ? "Generating..." : "Generate strategy"}
            </button>
          }
        />
      )}
      <LogActionDialog
        action={logAction}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={(updated) => {
          setDetail(updated);
        }}
      />
    </section>
  );
}

function AgentRunPanel({ title, events }: { title: string; events: AgentTraceEvent[] }) {
  const finished = events.some((event) => event.phase === "complete" && event.status === "success");
  const visibleEvents = compactTraceEvents(events).map((event) =>
    finished && event.status !== "error" ? { ...event, status: "success" as const } : event,
  );
  const completed = visibleEvents.filter((event) => event.status === "success").length;
  const progress = finished
    ? 100
    : Math.min(96, Math.max(12, Math.round((completed / Math.max(visibleEvents.length, 6)) * 100)));

  return (
    <section className="agent-run-panel">
      <div className="agent-run-heading">
        <div>
          <strong>
            <WandSparkles size={16} />
            {title}
          </strong>
          <span>{progress}%</span>
        </div>
        <div className="agent-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="agent-run-list">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <div className={`agent-run-row trace-${event.status}`} key={event.id}>
              <span className="trace-status-dot" />
              <div>
                <strong>{event.title}</strong>
                {event.detail ? <small>{event.detail}</small> : null}
              </div>
              <span>{traceStatusLabel(event.status)}</span>
            </div>
          ))
        ) : (
          <div className="agent-run-row trace-running">
            <span className="trace-status-dot" />
            <div>
              <strong>Starting run</strong>
              <small>Opening the agent stream</small>
            </div>
            <span>running</span>
          </div>
        )}
      </div>
    </section>
  );
}

function compactTraceEvents(events: AgentTraceEvent[]) {
  const byPhase = new Map<string, AgentTraceEvent>();
  for (const event of events) {
    byPhase.set(`${event.source}:${event.phase}:${event.title}`, event);
  }
  return [...byPhase.values()].slice(-8);
}

function traceStatusLabel(status: AgentTraceEvent["status"]) {
  if (status === "success") {
    return "done";
  }
  if (status === "error") {
    return "error";
  }
  return "running";
}

function CustomerProfileCard({ detail }: { detail: QuoteDetailPayload }) {
  const likelihood = getQuoteLikelihood(detail.quote);
  return (
    <section className="customer-profile-card">
      <div className="profile-header">
        <Avatar label={detail.customer.initials} tone="blue" size="sm" />
        <div>
          <div className="profile-title-line">
            <Link to={`/customers/${detail.customer.id}?quote=${detail.quote.id}`}>{detail.customer.name}</Link>
            {detail.customer.leadBadge ? (
              <Badge tone={detail.customer.leadBadgeTone ?? "yellow"}>{detail.customer.leadBadge}</Badge>
            ) : null}
            <LikelihoodPill likelihood={likelihood} />
          </div>
          <p>
            {detail.customer.address} · {formatMoney(detail.quote.value)} · {detail.customer.system}
          </p>
          <div className="profile-dates">
            <span>Quote sent {detail.quote.quoteAgeDays ?? 0} days ago</span>
            <span>Last action {detail.quote.daysSinceLastAction ?? 0} days ago</span>
          </div>
        </div>
      </div>
      <div className="card-divider" />
      <h2 className="section-eyebrow">Buyer profile</h2>
      <div className="buyer-signal-list">
        {detail.customer.buyerProfile.map((signal) => (
          <div className="buyer-signal" key={signal.id}>
            <div className={`signal-icon signal-${signal.tone}`}>
              <AppIcon name={signal.id === "environmentalist" ? "leaf" : "shield"} size={17} />
            </div>
            <div>
              <div className="signal-heading">
                <strong>{signal.name}</strong>
                <Badge tone={signal.tone === "green" ? "green" : "yellow"}>{signal.strength}</Badge>
              </div>
              <p>{signal.description}</p>
              <div className="evidence-row">
                {signal.evidence.map((item) => (
                  <span className="evidence-pill" key={item.label}>
                    <AppIcon name={item.icon ?? "sparkles"} size={13} />
                    {item.label}
                    <span>{item.source}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StrategyStepView({
  step,
  active,
  action,
  actionBusy,
  strategyBusy,
  nextKind,
  onSchedule,
  onComplete,
  onLog,
  onSavePreparation,
}: {
  step: StrategyStep;
  active: boolean;
  action: ActionRecord | undefined;
  actionBusy: "schedule" | "complete" | undefined;
  strategyBusy: boolean;
  nextKind: string;
  onSchedule: (preparationBody?: string) => void;
  onComplete: () => void;
  onLog: () => void;
  onSavePreparation: (actionId: string, body: string) => void;
}) {
  const [expanded, setExpanded] = useState(active);
  const [preparationBody, setPreparationBody] = useState(
    action?.preparationBody ?? step.bullets.map((bullet, index) => `${index + 1}. ${bullet}`).join("\n"),
  );

  useEffect(() => {
    setExpanded(active);
  }, [active]);

  useEffect(() => {
    setPreparationBody(
      action?.preparationBody ?? step.bullets.map((bullet, index) => `${index + 1}. ${bullet}`).join("\n"),
    );
  }, [action?.id, action?.preparationBody, step.bullets]);

  const isScheduled = active && action?.status === "scheduled";
  const canSchedule = active && Boolean(action) && action?.status !== "scheduled" && nextKind !== "none";
  const canCompleteScheduled =
    isScheduled &&
    (step.taskType === "Send Email" ||
      step.taskType === "Send WhatsApp Video Message" ||
      step.taskType === "Send Gift");
  const canLogScheduled =
    isScheduled && (step.taskType === "Phone Call" || step.taskType === "Meeting in person");
  const displayedDateTime = action?.scheduledFor ?? step.suggestedDateTime;

  return (
    <article className={`strategy-step ${active ? "active" : ""} ${step.status}`}>
      <div className="step-number">{step.number}</div>
      <div className="step-body">
        <button className="step-toggle" type="button" onClick={() => setExpanded((value) => !value)}>
          <span>
            <span className="step-phase">{step.phase}</span>
            <strong>{step.title}</strong>
            {!expanded ? <small>{step.subtitle}</small> : null}
          </span>
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
        {expanded ? (
          <div className="step-expanded">
            <div className="step-heading">
              <span className="step-icon">
                <AppIcon name={step.icon} size={24} />
              </span>
              <h3>{step.title}</h3>
            </div>
            <div className="script-block">
              <strong>
                <WandSparkles size={15} />
                {step.guideTitle}
              </strong>
              <ul>
                {step.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
            {active && action ? (
              <div className="prep-editor">
                <div className="prep-editor-heading">
                  <strong>{action.preparationTitle ?? step.guideTitle}</strong>
                  {action.preparationUpdatedAt ? <span>Saved</span> : null}
                </div>
                <textarea
                  rows={step.taskType === "Send Email" ? 8 : 6}
                  value={preparationBody}
                  onChange={(event) => setPreparationBody(event.target.value)}
                />
                <div className="prep-editor-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => onSavePreparation(action.id, preparationBody)}
                    disabled={strategyBusy || Boolean(actionBusy)}
                  >
                    {step.secondaryCta}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="why-box">
              <span>
                <Info size={14} />
                Why this
              </span>
              <div className="why-chips">
                {step.whyChips.map((chip) => (
                  <span className="evidence-pill" key={chip.label}>
                    <AppIcon name={chip.icon ?? "sparkles"} size={13} />
                    {chip.label}
                    <span>{chip.source}</span>
                  </span>
                ))}
              </div>
            </div>
            {active ? (
              <div className="time-panel">
                <span className="time-icon">
                  <Clock3 size={18} />
                </span>
                <div>
                  <strong>{isScheduled ? "Scheduled time" : "Suggested time"}</strong>
                  <span>{formatStepDate(displayedDateTime)}</span>
                  <small>
                    {new Intl.DateTimeFormat("en", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(displayedDateTime))}
                  </small>
                </div>
                <div className="time-actions">
                  {canSchedule ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => onSchedule(preparationBody)}
                      disabled={strategyBusy || Boolean(actionBusy)}
                    >
                      <AppIcon name="calendar" size={15} />
                      {actionBusy === "schedule" ? "Scheduling..." : step.primaryCta}
                    </button>
                  ) : null}
                  {canCompleteScheduled ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={onComplete}
                      disabled={strategyBusy || Boolean(actionBusy)}
                    >
                      <AppIcon name="send" size={15} />
                      {actionBusy === "complete" ? "Sending..." : markDoneLabel(step.taskType)}
                    </button>
                  ) : null}
                  {canLogScheduled ? (
                    <button className="secondary-button" type="button" onClick={onLog}>
                      Log outcome
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatStepDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function markDoneLabel(taskType: ActionRecord["taskType"]) {
  if (taskType === "Send Gift") {
    return "Mark gift sent";
  }
  if (taskType === "Send WhatsApp Video Message") {
    return "Mark video sent";
  }
  return "Mark sent";
}
