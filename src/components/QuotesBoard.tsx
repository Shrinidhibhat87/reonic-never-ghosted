import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Clock3, Edit3, Gift, MoreVertical, Plus, Search, Send, WandSparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, formatMoney } from "../lib/api.js";
import { getQuoteLikelihood } from "../lib/quoteLikelihood.js";
import { LikelihoodPill } from "./LikelihoodPill.js";
import { Avatar, Badge, ErrorState, IconButton, LoadingState, PageHeader } from "./ui.js";
import { LogActionDialog } from "./LogActionDialog.js";
import type { ActionRecord, BootstrapPayload, CreateQuoteInput, QuoteRecord } from "../../server/types.js";

export function QuotesBoard() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [logAction, setLogAction] = useState<ActionRecord>();
  const [logOpen, setLogOpen] = useState(false);
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [bootstrapData, quotesData] = await Promise.all([api.bootstrap(), api.quotes()]);
      setBootstrap(bootstrapData);
      setQuotes(quotesData.quotes);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load quotes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    return new Map(
      bootstrap?.columns.map((column) => [
        column.id,
        quotes.filter((quote) => quote.columnId === column.id),
      ]) ?? [],
    );
  }, [bootstrap, quotes]);

  async function handleNext(quote: QuoteRecord) {
    if (quote.nextAction.kind === "log_call" || quote.nextAction.kind === "log_visit") {
      if (!quote.nextAction.actionId) {
        return;
      }
      const detail = await api.quote(quote.id);
      const action = detail.actions.find((item) => item.id === quote.nextAction.actionId);
      setLogAction(action);
      setLogOpen(true);
      return;
    }
    navigate(`/requests/${quote.id}/strategy`);
  }

  if (loading) {
    return <LoadingState label="Loading quotes" />;
  }
  if (error || !bootstrap) {
    return <ErrorState message={error ?? "Missing board data"} />;
  }

  return (
    <section className="page">
      <PageHeader title="Quotes" />
      <div className="board-toolbar">
        <div className="top-search">
          <Search size={16} />
          <input placeholder="Search" />
        </div>
        <button className="primary-button" type="button" onClick={() => setNewQuoteOpen(true)}>
          <Plus size={16} />
          New quote
        </button>
      </div>
      <div className="kanban-board">
        {bootstrap.columns.map((column) => (
          <section className="kanban-column" key={column.id}>
            <div className="column-title">
              <h2>{column.title}</h2>
              <span className={`column-count column-count-${column.countTone}`}>
                {(grouped.get(column.id) ?? []).length}x
              </span>
            </div>
            <div className="quote-list">
              {(grouped.get(column.id) ?? []).map((quote) => (
                <QuoteCard
                  quote={quote}
                  key={quote.id}
                  onNext={() => void handleNext(quote)}
                  onOpenCustomer={() => navigate(`/customers/${quote.customerId}?quote=${quote.id}`)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <LogActionDialog
        action={logAction}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={(detail) => {
          setQuotes((current) => current.map((quote) => (quote.id === detail.quote.id ? detail.quote : quote)));
          navigate(`/requests/${detail.quote.id}/strategy`);
        }}
      />
      <NewQuoteDialog
        open={newQuoteOpen}
        onOpenChange={setNewQuoteOpen}
        onCreated={(detail) => {
          setQuotes((current) => [detail.quote, ...current]);
          setNewQuoteOpen(false);
          navigate(`/requests/${detail.quote.id}/strategy`);
        }}
      />
    </section>
  );
}

function QuoteCard({
  quote,
  onNext,
  onOpenCustomer,
}: {
  quote: QuoteRecord;
  onNext: () => void;
  onOpenCustomer: () => void;
}) {
  const nextIcon =
    quote.nextAction.kind === "generate_strategy" ? (
      <WandSparkles size={14} />
    ) : quote.nextAction.kind.includes("schedule") ? (
      <CalendarDays size={14} />
    ) : quote.nextAction.kind === "send_gift" ? (
      <Gift size={14} />
    ) : quote.nextAction.kind.startsWith("send") || quote.nextAction.kind === "follow_up_signature" ? (
      <Send size={14} />
    ) : (
      <Clock3 size={14} />
    );
  const likelihood = getQuoteLikelihood(quote);

  return (
    <article className="quote-card">
      <div className="quote-card-head">
        <button className="quote-title-button" type="button" onClick={onOpenCustomer}>
          {quote.title}
        </button>
        <div className="card-actions">
          <IconButton label="More">
            <MoreVertical size={15} />
          </IconButton>
          <IconButton label="Edit">
            <Edit3 size={14} />
          </IconButton>
        </div>
      </div>
      <div className="quote-contact">
        <span>{quote.contactLine}</span>
        <span>{quote.address}</span>
      </div>
      <div className="quote-meta-row">
        <LikelihoodPill likelihood={likelihood} />
        {quote.statusLabel ? (
          <Badge tone={quote.statusTone ?? "blue"}>{quote.statusLabel}</Badge>
        ) : null}
        {quote.nextAction.kind !== "none" ? (
          <button className={`next-chip next-${quote.nextAction.tone}`} type="button" onClick={onNext}>
            <span className="next-label">Next:</span>
            <span className="next-button">
              {nextIcon}
              {quote.nextAction.label}
            </span>
          </button>
        ) : null}
      </div>
      <div className="quote-footer">
        <div className="owner">
          <Avatar label={quote.ownerAvatar} tone={quote.ownerTone} size="xs" />
          <span>{quote.ownerName}</span>
        </div>
        <div className="quote-price">
          <Clock3 size={13} />
          <strong>{formatMoney(quote.value)}</strong>
        </div>
      </div>
    </article>
  );
}

function NewQuoteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (detail: Awaited<ReturnType<typeof api.createQuote>>) => void;
}) {
  const [form, setForm] = useState<CreateQuoteInput>({
    name: "",
    email: "",
    phone: "",
    address: "",
    system: "Solar + battery",
    quoteValue: 28000,
    preferredChannel: "Email first, accepts scheduled calls",
    motivationOrConcern: "",
    householdNote: "",
    initialNote: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const detail = await api.createQuote(form);
      onCreated(detail);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        system: "Solar + battery",
        quoteValue: 28000,
        preferredChannel: "Email first, accepts scheduled calls",
        motivationOrConcern: "",
        householdNote: "",
        initialNote: "",
      });
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof CreateQuoteInput>(key: K, value: CreateQuoteInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content wide-dialog">
          <div className="dialog-heading">
            <div>
              <Dialog.Title>Create quote lead</Dialog.Title>
              <Dialog.Description>
                This starts as a fresh quote whose next action is to generate a closing strategy.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="form-grid">
            <Field label="Name" value={form.name} onChange={(value) => update("name", value)} />
            <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
            <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
            <Field label="Address" value={form.address} onChange={(value) => update("address", value)} />
            <Field label="System" value={form.system} onChange={(value) => update("system", value)} />
            <label className="field-stack">
              <span>Quote value</span>
              <input
                type="number"
                value={form.quoteValue}
                onChange={(event) => update("quoteValue", Number(event.target.value))}
              />
            </label>
            <Field
              label="Preferred channel"
              value={form.preferredChannel}
              onChange={(value) => update("preferredChannel", value)}
            />
          </div>
          <label className="field-stack">
            <span>Motivation or concern</span>
            <textarea
              rows={4}
              value={form.motivationOrConcern}
              onChange={(event) => update("motivationOrConcern", event.target.value)}
              placeholder="e.g. Wants predictable monthly bills, asked about CO2 impact, and worries the roof may need a closer check."
            />
          </label>
          <label className="field-stack">
            <span>Household / property note</span>
            <textarea
              rows={3}
              value={form.householdNote}
              onChange={(event) => update("householdNote", event.target.value)}
              placeholder="e.g. Family with two EVs, south-west roof, partner reviews big purchases."
            />
          </label>
          <label className="field-stack">
            <span>Initial installer note</span>
            <textarea
              rows={3}
              value={form.initialNote ?? ""}
              onChange={(event) => update("initialNote", event.target.value)}
              placeholder="Optional note that should influence the first strategy."
            />
          </label>
          <div className="dialog-actions">
            <Dialog.Close className="secondary-button">Cancel</Dialog.Close>
            <button className="primary-button" type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? "Creating..." : "Create quote"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-stack">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
