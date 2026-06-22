// FE side of the backend contract. Field names mirror the API JSON exactly.
// Source: backend/app/routers/*.py + integration/engine.py.

export interface Lead {
  deal_id: number;
  customer_name: string;
  region: string;
  stage: string;
  last_activity_at: string;
  total_price: number;
  currency: string;
  products: string[];
  ghost_risk: number; // 0..1 — likely to ghost (quiet/unworked)
  days_since_touch: number;
  has_strategy: boolean;
}

export interface Customer {
  id: number;
  name: string;
  region: string;
  locale?: string | null;
  channel_preference?: string | null;
  current_energy_bill?: number | null;
  property_type?: string | null;
  [k: string]: unknown;
}

export interface Quote {
  id: number;
  products: { type: string; spec?: string; qty?: number }[];
  total_price: number;
  currency: string;
  sent_at: string;
  est_savings_per_year?: number | null;
  payback_years?: number | null;
  roi_pct?: number | null;
  co2_offset_tons?: number | null;
  [k: string]: unknown;
}

export interface Deal {
  id: number;
  stage: string;
  current_goal: string;
  last_activity_at: string;
  [k: string]: unknown;
}

export interface Note {
  id: number;
  type: string;
  content: string;
  timestamp: string;
}

export interface Touch {
  id: number;
  channel: string;
  direction: string;
  timestamp: string;
  body?: string | null;
  summary?: string | null;
}

export interface Signal {
  id: number;
  type: string;
  timestamp: string;
  value?: number | null;
}

export interface DealDetail {
  deal: Deal;
  customer: Customer;
  quote: Quote;
  touches: Touch[];
  notes: Note[];
  signals: Signal[];
  competitor?: Record<string, unknown> | null;
  persona?: Record<string, unknown> | null;
  strategy?: Record<string, unknown> | null;
  temperature?: string | null;
  ghost_risk?: number | null;
}

export interface EvidenceChip {
  kind: string; // behavioral | benchmark | deal_history
  text: string;
  ref?: string | null;
}

export interface PersonaScore {
  persona: string;
  weight: number;
  strength: string;
  evidence_refs: string[]; // why this persona scored
}

export interface Step {
  order: number;
  goal: string;
  lever: string;
  channel: string;
  rationale: string;
  title?: string | null;
  timing?: string | null;
  evidence_chips: EvidenceChip[];
  revision_notes?: string[]; // installer instructions applied to this step
}

export interface CreativePlay {
  title: string;
  trigger: string; // the deal condition that makes this play fit
  why: string;
  channel?: string | null; // gift | letter | video | ...
}

export interface StrategyResult {
  current_goal: string;
  buyer_profile: { summary?: string } & Record<string, unknown>;
  persona_scores: PersonaScore[];
  top_motivations: string[];
  objections: string[];
  steps: Step[];
  engine: string; // voltagent | python | fake — which engine produced this
  creative_plays: CreativePlay[]; // only populated when the installer opts in
}

export interface RevisionResult {
  applied: boolean;
  step: Step;
  reason: string;
  creative_plays?: CreativePlay[];
}

// Which engine generates the plan. Mirrors backend get_engine() choices.
export type EngineChoice = "voltagent" | "python" | "fake";

export interface StrategyOptions {
  engine?: EngineChoice;
  creative?: boolean; // include engine-emitted "think outside the box" plays
}

export interface Appointment {
  id: number;
  installer_id: number;
  deal_id?: number | null;
  title: string;
  day: number; // 0=Mon … 4=Fri
  start_hour: number;
  end_hour: number;
}

export interface Week {
  week_label: string;
  days: string[];
  slots: number[];
  appointments: Appointment[];
}
