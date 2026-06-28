"use client";

import React from "react";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextArea } from "@/ui/components/TextArea";
import { TextField } from "@/ui/components/TextField";
import { FeatherAlertTriangle } from "@subframe/core";
import { FeatherCheck } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherFolder } from "@subframe/core";
import { FeatherGhost } from "@subframe/core";
import { FeatherImage } from "@subframe/core";
import { FeatherMic } from "@subframe/core";
import { FeatherPaperclip } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherStickyNote } from "@subframe/core";
import { FeatherUploadCloud } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherWand } from "@subframe/core";
import { FeatherZap } from "@subframe/core";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { InfoTip } from "@/components/InfoTip";
import { FeatherArrowLeft } from "@subframe/core";
import { addNote, getDeal, setPersonalTouches, transcribeVoice, voiceStatus } from "@/lib/api";
import { navTo } from "@/lib/nav";
import type { DealDetail, Note, PersonalTouch } from "@/lib/types";

function fmtPrice(v: number, currency: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

// Same recency heuristic the lead list uses — high = likely to ghost.
function ghostFromActivity(lastActivity: string): { risk: number; days: number } {
  const days = Math.max(0, Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86_400_000));
  return { risk: Math.min(1, days / 30), days };
}
function ghostMeta(risk: number): { label: string; variant: "error" | "warning" | "success" } {
  if (risk >= 0.66) return { label: "High ghost risk", variant: "error" };
  if (risk >= 0.33) return { label: "Cooling off", variant: "warning" };
  return { label: "Fresh", variant: "success" };
}

const IDEAS = [
  { id: "wine", emoji: "🍷", label: "Send a local bottle of wine" },
  { id: "honey", emoji: "🍯", label: "Send regional wildflower honey" },
  { id: "voucher", emoji: "🎁", label: "Personalized birthday voucher" },
  { id: "card", emoji: "✉️", label: "Handwritten thank-you card" },
  { id: "cafe", emoji: "☕", label: "Local café gift card" },
];

function OutOfBoxIdeas({ name, dealId, initial }: { name: string; dealId: number; initial: PersonalTouch[] }) {
  const [added, setAdded] = React.useState<Set<string>>(new Set(initial.map((t) => t.id)));
  function toggle(id: string) {
    setAdded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      setPersonalTouches(dealId, IDEAS.filter((i) => next.has(i.id))).catch(() => {});
      return next;
    });
  }
  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-solid border-brand-100 bg-brand-50 px-6 py-5">
      <div className="flex w-full items-center gap-2">
        <FeatherSparkles className="text-heading-3 font-heading-3 text-brand-600" />
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
          Out-of-the-box ways to win {name}
        </span>
        <Badge variant="brand">{added.size} added to plan</Badge>
      </div>
      <span className="text-caption font-caption text-subtext-color">Tap an idea to fold a personal touch into the strategy.</span>
      <div className="flex w-full flex-wrap items-center gap-2">
        {IDEAS.map((idea) => {
          const on = added.has(idea.id);
          return (
            <button
              key={idea.id}
              onClick={() => toggle(idea.id)}
              className={`flex items-center gap-2 rounded-full border border-solid px-3 py-1.5 text-caption font-caption transition-colors ${
                on
                  ? "border-brand-300 bg-brand-100 text-brand-700"
                  : "border-neutral-border bg-default-background text-default-font hover:border-brand-200"
              }`}
            >
              <span>{idea.emoji}</span>
              <span>{idea.label}</span>
              {on ? (
                <FeatherCheck className="text-caption text-brand-600" />
              ) : (
                <FeatherPlus className="text-caption text-subtext-color" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LeadMasterDataPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = Number(params.dealId);

  const [data, setData] = React.useState<DealDetail | null>(null);
  const [error, setError] = React.useState<string>("");
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [draft, setDraft] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [voiceMsg, setVoiceMsg] = React.useState("");
  const [recording, setRecording] = React.useState(false);
  const recRef = React.useRef<MediaRecorder | null>(null);

  React.useEffect(() => {
    getDeal(dealId)
      .then((d) => {
        setData(d);
        setNotes(d.notes);
      })
      .catch((e) => setError(String(e)));
  }, [dealId]);

  async function saveNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const note = await addNote(dealId, draft.trim());
      setNotes((n) => [...n, note]); // optimistic append
      setDraft("");
      setAdding(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function flash(msg: string) {
    setVoiceMsg(msg);
    window.setTimeout(() => setVoiceMsg(""), 3000);
  }

  // Record → ElevenLabs STT → drop the transcript into the note draft. Gated on the
  // backend key: when it's absent the status check short-circuits to "coming soon".
  async function onRecordVoice() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    let enabled = false;
    try {
      enabled = (await voiceStatus()).enabled;
    } catch {
      /* backend unreachable — treat as disabled */
    }
    if (!enabled) {
      flash("Voice transcription coming soon — add the ElevenLabs key to enable.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        try {
          const text = await transcribeVoice(new Blob(chunks, { type: "audio/webm" }));
          setDraft((d) => (d ? `${d} ${text}` : text));
          setAdding(true);
        } catch (e) {
          flash(String(e).includes("coming soon") ? "Voice transcription coming soon." : `Transcription failed: ${e}`);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      flash("Microphone unavailable — type the note for now.");
    }
  }

  if (error)
    return (
      <div className="flex h-full w-full">
        <Sidebar />
        <div className="p-8">
          <Alert variant="error" icon={<FeatherAlertTriangle />} title="Failed to load deal" description={error} />
        </div>
      </div>
    );
  if (!data) return (
    <div className="flex h-full w-full">
      <Sidebar />
      <div className="p-8 text-subtext-color">Loading…</div>
    </div>
  );

  const { customer, quote, deal } = data;
  const channel = customer.channel_preference ?? "Email";
  const system = quote.products.map((p) => p.type).join(" + ") || "—";
  const decisionContext = data.competitor
    ? `Comparing with ${(data.competitor.competitor_name as string) ?? "another installer"}`
    : "No active comparison flagged";
  const { risk, days } = ghostFromActivity(deal.last_activity_at);
  const gm = ghostMeta(risk);

  // Banner only when a note landed AFTER the strategy was generated — i.e. the
  // plan is now stale relative to fresh human input. No strategy yet → no banner.
  const strategyAt = data.strategy?.created_at ? new Date(data.strategy.created_at as string).getTime() : null;
  const newestNoteAt = notes.length ? Math.max(...notes.map((n) => new Date(n.timestamp).getTime())) : 0;
  const strategyStale = strategyAt != null && newestNoteAt > strategyAt;

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <Sidebar />
      <div className="app-main flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-auto">
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-8 py-4 mobile:px-4">
          <Button variant="neutral-tertiary" icon={<FeatherArrowLeft />} onClick={() => navTo(router, "/quotes", { back: true })}>
            Quotes
          </Button>
          <div className="flex grow shrink-0 basis-0 items-center gap-2">
            <span
              className="text-body font-body text-subtext-color cursor-pointer hover:text-default-font"
              onClick={() => navTo(router, "/quotes", { back: true })}
            >
              Quotes
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-subtext-color">{customer.name}</span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-heading-3 font-heading-3 text-default-font">Master Data</span>
          </div>
          <Badge variant={gm.variant} icon={<FeatherGhost />}>
            {gm.label}
          </Badge>
          <InfoTip
            text={`Ghost risk ${Math.round(risk * 100)}% — ${days} day(s) since last activity. The longer a quoted prospect stays quiet, the more likely they ghost. Working the strategy resets this.`}
          />
          <Button icon={<FeatherWand />} onClick={() => navTo(router, `/quotes/${dealId}/strategy`)}>
            {data.strategy ? "View strategy" : "Generate strategy"}
          </Button>
        </div>
        <div className="flex w-full flex-col items-start gap-6 px-8 py-8 mobile:px-4 mobile:py-6">
          {strategyStale && (
            <Alert
              variant="warning"
              icon={<FeatherAlertTriangle />}
              title="New input since the strategy was generated"
              description="You added notes after the closing strategy was built — regenerate so the plan reflects the latest context."
              actions={
                <Button icon={<FeatherWand />} onClick={() => navTo(router, `/quotes/${dealId}/strategy`)}>
                  Regenerate strategy
                </Button>
              }
            />
          )}

          <OutOfBoxIdeas
            name={customer.name.split(" ")[0]}
            dealId={dealId}
            initial={(deal.personal_touches as PersonalTouch[]) ?? []}
          />

          {/* Prospect info */}
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherUser className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">Prospect information</span>
              </div>
              <Button variant="neutral-secondary" size="small" icon={<FeatherEdit2 />} onClick={() => {}}>
                Edit
              </Button>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">Used to personalize the closing strategy</span>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4 border-t border-solid border-neutral-border pt-4">
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Preferred contact" helpText="">
                <TextField.Input value={customer.contact_preference ?? channel} onChange={() => {}} />
              </TextField>
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Address" helpText="">
                <TextField.Input value={customer.address ?? customer.region} onChange={() => {}} />
              </TextField>
            </div>
            <TextField className="h-auto w-full flex-none" label="Budget & affordability" helpText="">
              <TextField.Input value={customer.budget_note ?? "—"} onChange={() => {}} />
            </TextField>
            <div className="flex w-full flex-wrap items-start gap-4">
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Email" helpText="">
                <TextField.Input value={customer.email ?? "—"} onChange={() => {}} />
              </TextField>
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Phone" helpText="">
                <TextField.Input value={customer.phone ?? "—"} onChange={() => {}} />
              </TextField>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4">
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="System" helpText="">
                <TextField.Input value={system} onChange={() => {}} />
              </TextField>
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Quote value" helpText="">
                <TextField.Input value={fmtPrice(quote.total_price, quote.currency)} onChange={() => {}} />
              </TextField>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4">
              <TextField className="h-auto min-w-[240px] grow shrink-0 basis-0" label="Decision context" helpText="">
                <TextField.Input value={decisionContext} onChange={() => {}} />
              </TextField>
            </div>
          </div>

          {/* Installer notes — the feedback loop */}
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherClipboardList className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">Installer notes</span>
                <Badge variant="neutral">{notes.length}</Badge>
              </div>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">Insights here shape the recommended plays</span>
              <InfoTip text="Each note is fed to the engine as context. Add what you learn on calls — the strategy adapts to it." />
            </div>
            {notes.length === 0 && <span className="text-caption font-caption text-subtext-color">No notes yet.</span>}
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4"
              >
                <div className="flex w-full items-center gap-2">
                  <FeatherStickyNote className="text-body font-body text-subtext-color" />
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    {note.type === "voice" ? "Voice note" : "Note"}
                  </span>
                  <Badge variant="neutral">{note.type}</Badge>
                </div>
                <span className="w-full text-body font-body text-default-font">{note.content}</span>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-subtext-color">Installer note</span>
                  <span className="text-caption font-caption text-subtext-color">
                    {new Date(note.timestamp).toLocaleString("en-GB")}
                  </span>
                </div>
              </div>
            ))}

            {adding && (
              <div className="flex w-full flex-col items-start gap-2 rounded-md border border-solid border-brand-200 bg-brand-50 px-4 py-3">
                <TextArea className="h-auto w-full flex-none" label="" helpText="">
                  <TextArea.Input
                    className="h-20 w-full flex-none"
                    placeholder="e.g. customer mentioned roof shading from a neighbour's tree"
                    value={draft}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                  />
                </TextArea>
                <div className="flex items-center gap-2">
                  <Button loading={saving} onClick={saveNote}>
                    Save note
                  </Button>
                  <Button variant="neutral-tertiary" onClick={() => { setAdding(false); setDraft(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex w-full flex-wrap items-center gap-2 border-t border-solid border-neutral-border pt-3">
              <Button variant="neutral-secondary" icon={<FeatherPlus />} onClick={() => setAdding(true)}>
                Add note
              </Button>
              <Button
                variant={recording ? "destructive-secondary" : "neutral-tertiary"}
                icon={<FeatherMic />}
                onClick={onRecordVoice}
              >
                {recording ? "Stop recording" : "Record voice"}
              </Button>
              {voiceMsg && (
                <span className="text-caption font-caption text-subtext-color">{voiceMsg}</span>
              )}
            </div>
          </div>

          {/* Files — inert demo */}
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherFolder className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">Files</span>
                <Badge variant="neutral">3</Badge>
              </div>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">Documents are parsed for context in the strategy</span>
            </div>
            <div className="flex w-full flex-col items-start border-t border-solid border-neutral-border pt-2">
              {[
                { name: "Intake form.pdf", meta: "PDF · 248 KB · Uploaded today", icon: <FeatherFileText className="text-heading-3 font-heading-3 text-error-600" /> },
                { name: "Energy bill 2024.pdf", meta: "PDF · 612 KB · Uploaded yesterday", icon: <FeatherFileText className="text-heading-3 font-heading-3 text-error-600" /> },
                { name: "Roof site photo.jpg", meta: "JPG · 3.1 MB · Uploaded yesterday", icon: <FeatherImage className="text-heading-3 font-heading-3 text-success-600" /> },
              ].map((f) => (
                <div key={f.name} className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50">
                  {f.icon}
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="line-clamp-1 text-body-bold font-body-bold text-default-font">{f.name}</span>
                    <span className="text-caption font-caption text-subtext-color">{f.meta}</span>
                  </div>
                  <IconButton size="small" icon={<FeatherDownload />} onClick={() => {}} />
                </div>
              ))}
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-border bg-neutral-50 px-6 py-8">
              <FeatherUploadCloud className="text-heading-2 font-heading-2 text-neutral-400" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-body-bold font-body-bold text-default-font">Drop files to upload</span>
                <span className="text-caption font-caption text-subtext-color">PDF, images, or spreadsheets up to 25 MB</span>
              </div>
              <Button variant="neutral-secondary" size="small" icon={<FeatherPaperclip />} onClick={() => {}}>
                Browse files
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
