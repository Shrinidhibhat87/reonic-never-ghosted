// One helper per backend endpoint. No scattered fetch in pages.
import type {
  Appointment,
  DealDetail,
  Lead,
  Note,
  RevisionResult,
  StrategyOptions,
  StrategyResult,
  Week,
} from "./types";

// Engine choice + creative-plays opt-in become query params on generate/revise.
function strategyQuery(opts?: StrategyOptions): string {
  const p = new URLSearchParams();
  if (opts?.engine) p.set("engine", opts.engine);
  if (opts?.creative) p.set("creative", "true");
  const q = p.toString();
  return q ? `?${q}` : "";
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const getLeads = (installerId = 1) =>
  req<Lead[]>(`/installers/${installerId}/leads`);

export const getDeal = (dealId: number) =>
  req<DealDetail>(`/deals/${dealId}`);

export const generateStrategy = (dealId: number, opts?: StrategyOptions) =>
  req<StrategyResult>(`/deals/${dealId}/strategy${strategyQuery(opts)}`, { method: "POST" });

export const draftStep = (dealId: number, order: number) =>
  req<{ message: string }>(`/deals/${dealId}/steps/${order}/draft`, {
    method: "POST",
  });

export const reviseStep = (
  dealId: number,
  order: number,
  instruction: string,
  opts?: StrategyOptions,
) =>
  req<RevisionResult>(`/deals/${dealId}/steps/${order}/revise${strategyQuery(opts)}`, {
    method: "POST",
    body: JSON.stringify({ instruction }),
  });

export const addNote = (dealId: number, content: string, type: "text" | "voice" = "text") =>
  req<Note>(`/deals/${dealId}/notes`, {
    method: "POST",
    body: JSON.stringify({ content, type }),
  });

export const getAppointments = (installerId = 1) =>
  req<Week>(`/installers/${installerId}/appointments`);

export const addAppointment = (title: string, dealId: number) =>
  req<Appointment>(`/appointments`, {
    method: "POST",
    body: JSON.stringify({ title, deal_id: dealId }),
  });

export const getBenchmarks = (orgId = 1) =>
  req<Record<string, number>>(`/orgs/${orgId}/benchmarks`);

export const seed = () => req<Record<string, number>>(`/admin/seed`, { method: "POST" });
