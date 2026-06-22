"use client";

import React from "react";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherChevronLeft } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherClock } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherRefreshCw } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { Sidebar, CURRENT_INSTALLER } from "@/components/Sidebar";
import { getAppointments } from "@/lib/api";
import type { Appointment, Week } from "@/lib/types";

export default function CalendarPage() {
  const [week, setWeek] = React.useState<Week | null>(null);
  const [error, setError] = React.useState<string>("");

  const load = React.useCallback(() => {
    getAppointments(CURRENT_INSTALLER.id).then(setWeek).catch((e) => setError(String(e)));
  }, []);
  React.useEffect(load, [load]);

  // Lookup: appointment by day+start_hour. The added strategy step lands in the gap.
  const byCell: Record<string, Appointment> = {};
  for (const a of week?.appointments ?? []) byCell[`${a.day}-${a.start_hour}`] = a;

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <Sidebar />
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-hidden">
        <div className="flex w-full flex-wrap items-center gap-3 border-b border-solid border-neutral-border px-4 py-3">
          <Button variant="neutral-secondary" onClick={() => {}}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <IconButton variant="neutral-secondary" icon={<FeatherChevronLeft />} onClick={() => {}} />
            <IconButton variant="neutral-secondary" icon={<FeatherChevronRight />} onClick={() => {}} />
          </div>
          <span className="text-heading-3 font-heading-3 text-default-font">{week?.week_label ?? "…"}</span>
          <div className="flex grow shrink-0 basis-0 items-center justify-end gap-2">
            <span className="text-caption font-caption text-subtext-color">{CURRENT_INSTALLER.name} · my week</span>
            <Button variant="neutral-secondary" icon={<FeatherPlus />} onClick={() => {}}>
              New appointment
            </Button>
            <IconButton variant="neutral-tertiary" icon={<FeatherRefreshCw />} onClick={load} />
            <IconButton variant="neutral-tertiary" icon={<FeatherSettings />} onClick={() => {}} />
          </div>
        </div>

        {error && <div className="px-4 py-3 text-body text-error-600">Failed to load calendar: {error}</div>}
        {!week && !error && <div className="px-4 py-3 text-subtext-color">Loading…</div>}

        {week && (
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start overflow-auto">
            <div className="flex flex-col items-start min-w-[900px] self-stretch">
              {/* Day header */}
              <div className="flex w-full border-b border-solid border-neutral-border">
                <div className="w-20 flex-none px-3 py-3" />
                {week.days.map((d) => (
                  <div key={d} className="flex grow shrink-0 basis-0 items-center justify-center border-l border-solid border-neutral-border px-2 py-3">
                    <span className="text-body-bold font-body-bold text-default-font">{d}</span>
                  </div>
                ))}
              </div>
              {/* Time rows */}
              {week.slots.map((hour) => (
                <div key={hour} className="flex w-full border-b border-solid border-neutral-border items-stretch">
                  <div className="w-20 flex-none px-3 py-4">
                    <span className="text-caption font-caption text-subtext-color">{hour}:00</span>
                  </div>
                  {week.days.map((_, dayIdx) => {
                    const appt = byCell[`${dayIdx}-${hour}`];
                    return (
                      <div key={dayIdx} className="flex grow shrink-0 basis-0 items-stretch border-l border-solid border-neutral-border p-1 min-h-[64px]">
                        {appt ? (
                          <div
                            className={`flex grow flex-col items-start gap-0.5 rounded-md border-l-2 border-solid px-2 py-1.5 ${
                              appt.deal_id
                                ? "border-brand-600 bg-brand-50"
                                : "border-success-600 bg-success-50"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <FeatherClock className={`text-caption font-caption ${appt.deal_id ? "text-brand-700" : "text-success-700"}`} />
                              <span className="text-caption font-caption text-subtext-color">
                                {appt.start_hour}:00–{appt.end_hour}:00
                              </span>
                            </div>
                            <span className="line-clamp-2 text-caption-bold font-caption-bold text-default-font">{appt.title}</span>
                            {appt.deal_id != null && (
                              <span className="text-caption font-caption text-brand-600">From strategy · Deal #{appt.deal_id}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex grow items-center justify-center rounded-md border border-dashed border-neutral-200">
                            <span className="text-caption font-caption text-neutral-400">Open</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
