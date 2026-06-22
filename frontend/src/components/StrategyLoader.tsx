"use client";

// Animated "gathering intelligence" state shown while the strategy is generated.
// Mock sources mirror the persona-mix evidence the engine actually uses — they
// light up one by one so the installer sees what's feeding the plan.
// ponytail: detail strings are static mock copy, not live data. Wire to the
// real context payload when generate streams partials.
import React from "react";
import {
  FeatherActivity,
  FeatherBarChart2,
  FeatherCheck,
  FeatherDatabase,
  FeatherSparkles,
  FeatherTarget,
  FeatherUsers,
} from "@subframe/core";

const SOURCES = [
  { icon: <FeatherActivity />, label: "Behavioural signals", detail: "Opened the quote 3× · last touch 12 days ago" },
  { icon: <FeatherBarChart2 />, label: "Org benchmarks", detail: "42 comparable deals won by this org" },
  { icon: <FeatherUsers />, label: "Persona mix", detail: "ROI investor 60% · budget-sensitive 40%" },
  { icon: <FeatherDatabase />, label: "Deal history", detail: "3 prior touches across email + call" },
  { icon: <FeatherTarget />, label: "Objections & motivations", detail: "Upfront cost · save money, energy independence" },
];

export function StrategyLoader() {
  // Reveal one source every 650ms; once all are scanned, hold on "synthesizing".
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    if (done >= SOURCES.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [done]);

  const pct = Math.round((done / SOURCES.length) * 100);
  const allDone = done >= SOURCES.length;

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherSparkles className="text-heading-3 font-heading-3 text-brand-600 animate-pulse" />
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
          Generating strategy…
        </span>
        <span className="text-caption font-caption text-subtext-color">{pct}%</span>
      </div>

      {/* scanning progress bar */}
      <div className="relative w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-neutral-border pt-4">
        <span className="text-caption-bold font-caption-bold text-subtext-color">
          PULLING FROM YOUR DATA
        </span>
        {SOURCES.map((s, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <div
              key={s.label}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-opacity duration-300 ${
                isDone || isActive ? "opacity-100" : "opacity-40"
              } ${isActive ? "bg-brand-50" : ""}`}
            >
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-solid border-brand-200 bg-brand-50 text-brand-600">
                {isDone ? (
                  <FeatherCheck className="text-caption font-caption text-success-600" />
                ) : isActive ? (
                  <div className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
                ) : (
                  s.icon
                )}
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start">
                <span className="text-body-bold font-body-bold text-default-font">{s.label}</span>
                <span className="text-caption font-caption text-subtext-color">{s.detail}</span>
              </div>
              {isDone && <span className="text-caption font-caption text-success-600">read</span>}
              {isActive && <span className="text-caption font-caption text-brand-600 animate-pulse">scanning…</span>}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-4">
          <div className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          <span className="text-body font-body text-default-font">
            Synthesizing the play from the evidence above…
          </span>
        </div>
      )}
    </div>
  );
}
