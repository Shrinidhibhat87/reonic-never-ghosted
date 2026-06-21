export type BoardColumnId =
  | "waiting_response"
  | "specialist_partner"
  | "waiting_installation"
  | "completed";

export type QuoteNextKind =
  | "generate_strategy"
  | "schedule_call"
  | "log_call"
  | "schedule_visit"
  | "log_visit"
  | "send_final_recap"
  | "follow_up_signature"
  | "send_whatsapp_video"
  | "send_gift"
  | "none";

export type ActionTaskType =
  | "Phone Call"
  | "Send Email"
  | "Meeting in person"
  | "Send WhatsApp Video Message"
  | "Send Gift";

export interface BuyerSignal {
  id: string;
  name: string;
  strength: "Strong" | "Moderate" | "Watch";
  tone: "green" | "yellow" | "blue" | "red";
  description: string;
  evidence: Array<{ label: string; source: string; icon?: string }>;
}

export interface CustomerRecord {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  system: string;
  quoteValue: number;
  leadBadge?: string;
  leadBadgeTone?: "yellow" | "green" | "blue" | "red";
  buyerProfile: BuyerSignal[];
  communicationPreference: string;
  decisionNote: string;
  householdNote: string;
  updatedAt: string;
}

export interface CustomerFileRecord {
  id: string;
  customerId: string;
  name: string;
  type: "pdf" | "image" | "audio" | "spreadsheet" | "other";
  sizeLabel: string;
  summary: string;
  tags: string[];
  uploadedAt: string;
  uploadedBy: string;
}

export interface QuoteRecord {
  id: string;
  customerId: string;
  title: string;
  customerName: string;
  contactLine: string;
  address: string;
  columnId: BoardColumnId;
  statusLabel?: string | undefined;
  statusTone?: "blue" | "yellow" | "green" | undefined;
  ownerName: string;
  ownerAvatar: string;
  ownerTone: "green" | "blue" | "yellow" | "red";
  value: number;
  sentAt?: string | undefined;
  lastActionAt?: string | undefined;
  quoteAgeDays?: number | undefined;
  daysSinceLastAction?: number | undefined;
  productSummary: string;
  nextAction: {
    kind: QuoteNextKind;
    label: string;
    actionId?: string;
    tone: "blue" | "yellow" | "green" | "gray";
  };
  strategyId?: string | undefined;
  strategyStale: boolean;
}

export interface StrategyStep {
  id: string;
  number: number;
  phase: string;
  title: string;
  subtitle: string;
  taskType: ActionTaskType;
  status: "active" | "upcoming" | "completed";
  icon: string;
  guideTitle: string;
  bullets: string[];
  whyChips: Array<{ label: string; source: string; icon?: string }>;
  suggestedTime: string;
  suggestedDateTime: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface GenerationMetadata {
  mode: "deterministic" | "llm" | "deterministic_fallback";
  model: string;
  latencyMs: number;
  fallbackReason?: string | undefined;
}

export interface StrategyRecord {
  id: string;
  quoteId: string;
  generatedAt: string;
  stale: boolean;
  headline: string;
  summary: string;
  currentActionId?: string;
  steps: StrategyStep[];
  generation?: GenerationMetadata;
}

export interface ActionRecord {
  id: string;
  quoteId: string;
  customerId: string;
  strategyId?: string;
  stepId?: string;
  taskType: ActionTaskType;
  title: string;
  status: "recommended" | "scheduled" | "completed" | "sent" | "superseded";
  scheduledFor?: string;
  completedAt?: string;
  supersededAt?: string;
  supersededByActionId?: string;
  calendarEventId?: string;
  preparationTitle?: string;
  preparationBody?: string;
  preparationUpdatedAt?: string;
  logPromptTitle: string;
  defaultLogText: string;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  start: string;
  end: string;
  row: "tasks" | "personal" | "theo";
  color: "blue" | "green" | "yellow" | "orange" | "purple";
  quoteId?: string;
  actionId?: string;
  location?: string;
  description?: string;
}

export interface NoteRecord {
  id: string;
  customerId: string;
  type: "audio" | "text" | "file";
  title: string;
  body: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  duration?: string;
  transcriptStatus?: "Transcribed" | "Processing";
}

export interface BootstrapPayload {
  installer: {
    id: string;
    name: string;
    company: string;
    initials: string;
  };
  columns: Array<{ id: BoardColumnId; title: string; countLabel: string; countTone: string }>;
  quoteIdForDemo: string;
}

export interface QuoteDetailPayload {
  quote: QuoteRecord;
  customer: CustomerRecord;
  strategy?: StrategyRecord;
  actions: ActionRecord[];
  notes: NoteRecord[];
  files: CustomerFileRecord[];
}

export interface ScheduleActionInput {
  slotStart?: string;
  preparationBody?: string;
}

export interface LogActionInput {
  notes: string;
}

export interface ReviseStrategyInput {
  instruction: string;
}

export interface UpdateActionPreparationInput {
  body: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  system?: string;
  quoteValue?: number;
}

export interface AddNoteInput {
  type: "audio" | "text" | "file";
  title: string;
  body: string;
}

export interface CreateQuoteInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  system: string;
  quoteValue: number;
  preferredChannel: string;
  motivationOrConcern: string;
  householdNote: string;
  initialNote?: string;
}

export interface AgentTraceEvent {
  id: string;
  source: "web" | "voltagent";
  phase: string;
  title: string;
  detail?: string;
  status: "pending" | "running" | "success" | "error";
  timestamp: string;
  durationMs?: number;
}
