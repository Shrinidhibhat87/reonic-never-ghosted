"use client";

// Small (i) affordance that reveals the reasoning behind a score/insight on hover.
// Pure CSS group-hover — no state, no portal, no dependency.
import React from "react";
import { FeatherInfo } from "@subframe/core";

export function InfoTip({ text, className }: { text: React.ReactNode; className?: string }) {
  return (
    <span className={`group relative inline-flex items-center ${className ?? ""}`}>
      <FeatherInfo className="text-caption font-caption text-subtext-color cursor-help hover:text-brand-600" />
      <span
        role="tooltip"
        className="invisible group-hover:visible absolute bottom-full left-1/2 z-50 mb-1 w-64 -translate-x-1/2 rounded-md border border-solid border-neutral-900 bg-neutral-800 px-2 py-1 text-left text-caption font-caption text-white shadow-lg"
      >
        {text}
      </span>
    </span>
  );
}
