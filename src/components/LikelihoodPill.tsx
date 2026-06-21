import { Info } from "lucide-react";

import type { QuoteLikelihood } from "../lib/quoteLikelihood.js";
import { IconButton } from "./ui.js";

export function LikelihoodPill({ likelihood }: { likelihood: QuoteLikelihood }) {
  return (
    <span className="likelihood-control">
      <span className={`likelihood-pill likelihood-${likelihood.tone}`}>
        <span className="likelihood-dot" />
        {likelihood.label}
      </span>
      <IconButton label={likelihood.reason} className="likelihood-info">
        <Info size={13} />
      </IconButton>
    </span>
  );
}
