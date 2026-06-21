import { z } from "zod";
import { randomUUID } from "node:crypto";

export const TaskTypeSchema = z.enum([
  "Phone Call",
  "Send Email",
  "Meeting in person",
  "Send WhatsApp Video Message",
  "Send Gift",
]);

export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TASK_TYPES: TaskType[] = TaskTypeSchema.options;

export const TriggerSchema = z.object({
  type: z.enum([
    "strategy_requested",
    "quote_opened",
    "debrief_added",
    "installer_revision_requested",
    "customer_reply_added",
    "manual_rerun",
  ]),
  installerInstruction: z.string().optional(),
});

export const CalendarSlotSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  label: z.string().optional(),
  location: z.string().optional(),
});

export const CalendarBusyBlockSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  label: z.string().optional(),
  location: z.string().optional(),
});

export const WorkingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const InstallerSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  region: z.string().optional(),
  timezone: z.string().default("Europe/Berlin"),
  workingHours: z.array(WorkingHoursSchema).optional(),
  calendar: z
    .object({
      freeSlots: z.array(CalendarSlotSchema).optional(),
      busyBlocks: z.array(CalendarBusyBlockSchema).optional(),
      travelMinutesBuffer: z.number().int().min(0).max(240).optional(),
    })
    .default({}),
  proofAssets: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        type: z.string(),
        tags: z.array(z.string()).default([]),
      }),
    )
    .optional(),
});

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  language: z.string().default("de"),
  preferredFormality: z.enum(["formal", "informal"]).default("formal"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  explicitMotives: z.array(z.string()).default([]),
  statedConcerns: z.array(z.string()).default([]),
  decisionMakersNote: z.string().optional(),
  householdOrPropertyNotes: z.string().optional(),
});

export const QuoteSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum(["draft", "sent", "viewed", "accepted", "signed", "lost"])
    .default("sent"),
  sentAt: z.string().optional(),
  viewedAt: z.string().optional(),
  validUntil: z.string().optional(),
  signatureState: z
    .enum(["not_ready", "ready", "sent", "signed", "declined"])
    .default("not_ready"),
  scope: z.array(z.string()).default([]),
  totalGross: z.number().nonnegative().optional(),
  currency: z.string().default("EUR"),
  lineItems: z
    .array(
      z.object({
        label: z.string(),
        amountGross: z.number().nonnegative().optional(),
        optional: z.boolean().default(false),
      }),
    )
    .default([]),
  assumptions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const ConsentSchema = z.object({
  email: z.boolean().default(false),
  phone: z.boolean().default(false),
  whatsapp: z.boolean().default(false),
  tracking: z.boolean().default(false),
  optOut: z.boolean().default(false),
  writtenOnly: z.boolean().default(false),
});

export const CommunicationSchema = z.object({
  id: z.string().optional(),
  occurredAt: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]),
  channel: z.enum(["email", "phone", "whatsapp", "meeting", "system", "other"]),
  summary: z.string().default(""),
  body: z.string().optional(),
  outcome: z.string().optional(),
});

export const ActionSchema = z.object({
  id: z.string().optional(),
  taskType: TaskTypeSchema,
  status: z.enum(["recommended", "scheduled", "sent", "completed", "missed", "cancelled"]),
  dueAt: z.string().optional(),
  scheduledFor: z.string().optional(),
  completedAt: z.string().optional(),
  summary: z.string().optional(),
  outcomeLabel: z.string().optional(),
});

export const DebriefSchema = z.object({
  id: z.string().optional(),
  actionId: z.string().optional(),
  occurredAt: z.string().min(1),
  taskType: TaskTypeSchema.optional(),
  notes: z.string().default(""),
  customerLanguage: z.array(z.string()).default([]),
  newFacts: z.array(z.string()).default([]),
  resolvedObjections: z.array(z.string()).default([]),
  remainingObjections: z.array(z.string()).default([]),
  newObjections: z.array(z.string()).default([]),
  nextCommitment: z.string().optional(),
  dueDate: z.string().optional(),
  outcomeLabel: z.string().optional(),
});

export const HistorySchema = z
  .object({
    communications: z.array(CommunicationSchema).default([]),
    actions: z.array(ActionSchema).default([]),
    debriefs: z.array(DebriefSchema).default([]),
    files: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          summary: z.string().optional(),
          tags: z.array(z.string()).default([]),
        }),
      )
      .default([]),
  })
  .default({
    communications: [],
    actions: [],
    debriefs: [],
    files: [],
  });

export const AssistantStateSchema = z
  .object({
    currentStage: z.string().optional(),
    activeBuyerSignals: z.array(z.string()).default([]),
    activeObjections: z.array(z.string()).default([]),
    previousNextBestAction: TaskTypeSchema.optional(),
    lastRecommendationAt: z.string().optional(),
  })
  .default({
    activeBuyerSignals: [],
    activeObjections: [],
  });

export const RecommendRequestSchema = z.object({
  requestId: z.string().min(1).default(() => randomUUID()),
  now: z.string().min(1),
  trigger: TriggerSchema,
  installer: InstallerSchema,
  customer: CustomerSchema,
  quote: QuoteSchema,
  consent: ConsentSchema.default({
    email: false,
    phone: false,
    whatsapp: false,
    tracking: false,
    optOut: false,
    writtenOnly: false,
  }),
  history: HistorySchema,
  assistantState: AssistantStateSchema,
});

export const EvidenceHitSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1),
  matchedTerms: z.array(z.string()).default([]),
  whyItMatters: z.string(),
});

export const KnowledgeReferenceSchema = z.object({
  folder: z.string(),
  file: z.string(),
  topic: z.string(),
  usedFor: z.string(),
});

export const CalendarEventDraftSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  timezone: z.string(),
  location: z.string().optional(),
  description: z.string(),
});

export const RecommendationResponseSchema = z.object({
  recommendationId: z.string(),
  generatedAt: z.string(),
  requestId: z.string(),
  quoteState: z.object({
    stage: z.string(),
    quoteAgeDays: z.number().int().nonnegative().optional(),
    daysSinceLastAction: z.number().int().nonnegative().optional(),
    lastActionSummary: z.string().optional(),
  }),
  buyerProfile: z.object({
    primaryConcern: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    signals: z.array(EvidenceHitSchema),
    objections: z.array(EvidenceHitSchema),
    missingData: z.array(z.string()),
    riskFlags: z.array(z.string()),
  }),
  nextBestAction: z.object({
    taskType: TaskTypeSchema,
    title: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    timing: z.string(),
    durationMinutes: z.number().int().positive().optional(),
    suggestedSlots: z.array(CalendarSlotSchema).default([]),
    calendarEvent: CalendarEventDraftSchema.optional(),
    agendaOrMessagePlan: z.array(z.string()),
    proofToPrepare: z.array(z.string()),
    internalPrepChecklist: z.array(z.string()),
    customerFacingDraft: z
      .object({
        subject: z.string().optional(),
        body: z.string(),
      })
      .optional(),
  }),
  reasoning: z.object({
    summary: z.string(),
    decisionFactors: z.array(
      z.object({
        factor: z.string(),
        impact: z.enum(["positive", "negative", "constraint", "tie_breaker"]),
        detail: z.string(),
      }),
    ),
    knowledgeUsed: z.array(KnowledgeReferenceSchema),
    scorecard: z.record(z.string(), z.number()),
    alternatives: z.array(
      z.object({
        taskType: TaskTypeSchema,
        score: z.number(),
        whyNotFirst: z.string(),
      }),
    ),
  }),
  debriefPrompt: z.array(z.string()),
  uiHints: z.object({
    kanbanNextLabel: z.string(),
    strategyHeadline: z.string(),
    calendarActionLabel: z.string().optional(),
    logPromptTitle: z.string(),
  }),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
export type EvidenceHit = z.infer<typeof EvidenceHitSchema>;
export type KnowledgeReference = z.infer<typeof KnowledgeReferenceSchema>;
