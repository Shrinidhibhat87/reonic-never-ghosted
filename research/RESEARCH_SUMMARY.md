# Research Summary: Reonic AI-Powered Marketing Assistant

Status: completed initial research synthesis on 2026-06-20.

This summary consolidates the agent research folders under `research/agents/` and the top-level deliverables under `research/`. It is Germany-first and based on public web data, official sources, consumer/VOC evidence, and labeled transfer evidence. It does not use assumptions as facts.

## Executive Summary

The PoC should be a Reonic-embedded Next Best Action assistant for the quote stage, not an email-sequence generator. Its core job is to diagnose why a German homeowner with a sent quote has not signed yet, choose the lowest-pressure action that resolves that blocker, check Germany-specific consent and claim safety, schedule the action around installer capacity, and learn from a short debrief.

Most defensible product direction:

- Primary scope: German residential Reonic 360 Household workflow.
- Base quote: PV plus battery.
- First-class variants: heat pump and wallbox/EV.
- Primary installer: small/mid installer with constrained owner capacity, plus a growing multi-location installer demo mode.
- Primary stage: offer sent/opened but unsigned.
- Main UI: quoted-customer detail with assistant panel and Next Best Action card.

The research does not support a simplistic four-persona model. It supports multi-label motive and blocker scoring: ROI/cost control, independence/autarky, climate impact, technical/system-building, financial risk, proposal clarity risk, trust risk, policy/building risk, and explicit stakeholder review.

The strongest blockers found were:

- Proposal clarity and bundled-scope suspicion.
- Upfront price and liquidity.
- ROI/payback assumption distrust.
- Competitor and referral comparison.
- Battery sizing/value uncertainty.
- Winter, shading, and heat-pump monthly-burden concerns.
- Roof/property damage risk.
- VNB/grid/MaStR/paperwork uncertainty.
- Installer trust, pressure, responsiveness, aftercare, and responsibility clarity.
- Co-decision-maker/advisor review when explicitly mentioned.
- Stale no-response where no value-add remains.

## Evidence Base

Agent folders contain the raw source records, evidence, findings, handoffs, and open questions:

- `research/agents/agent_00_reonic_public_ecosystem/`
- `research/agents/agent_01_persona_segmentation/`
- `research/agents/agent_02_voice_of_customer/`
- `research/agents/agent_03_objection_sales_process/`
- `research/agents/agent_04_germany_market_economics/`
- `research/agents/agent_05_persuasion_evidence/`
- `research/agents/agent_06_action_calendar_debrief/`
- `research/agents/agent_07_product_synthesis/`

Master source index: `research/00_source_index.md`.

Important direct sources include Reonic public pages/docs, Bundesnetzagentur EEG and telemarketing pages, E.ON/Statista homeowner survey via pv magazine, Wegatech/YouGov, KfW Energiewendebarometer summaries, Solarwatt/Appinio, Verbraucherzentrale offer guidance, Fraunhofer/PVGIS, and competitive official pages for OpusFlow, Solar Monkey, autarc, Sollit, and Sunvoy.

## Germany Market Context

Germany-specific economics and compliance should be product gates:

- ROI should use the customer's actual electricity tariff where possible. A 2026 fallback around 37.0-37.2 ct/kWh is only an assumption and must be shown as such.
- BNetzA feed-in tariffs are date-, size-, and feed-in-mode-dependent. For building PV commissioned 2026-02-01 to 2026-07-31, Agent 4 recorded 7.78/12.34 ct/kWh for <=10 kW partial/full feed-in, with lower partial rates for larger bands.
- Self-consumption is the main economic lever; typical assumptions of about 30% direct self-consumption and 60-70% with battery are editable heuristics, not guarantees.
- Regional production matters. Agent 4 recorded sample PVGIS-style yield differences between Hamburg/north and Munich/south; the product should use postcode/roof data.
- Battery sizing should depend on consumption, PV size, EV/heat-pump plans, night loads, and autonomy motive.
- Since German export, smart-meter, and negative-price rules are nuanced and changing, export-only ROI claims should be conservative and source-checked.
- MaStR registration, VNB/grid connection, metering, and EEG payment readiness are real trust levers and should become checklist/status fields.
- Tax, VAT, KfW financing, and local subsidies are eligibility- and date-sensitive. The assistant should not make homeowner-facing claims without current source/date metadata.
- Germany outreach compliance requires consent gating for phone and electronic channels, and separate care for tracking/open pixels.

## Reonic Ecosystem And Product Scope

Public Reonic sources support a Reonic-like mock data model: customer/request fields, offer status, quote validity, signature state, product options, PV/storage/heat-pump/wallbox packages, profitability, customer portal, emails, CRM tasks/checklists, calendar, AI/WhatsApp, meeting summaries, and service/admin workflows.

Implications:

- Build the PoC inside a quoted-customer workflow.
- Use Reonic-like objects rather than a generic CRM table.
- Include quote status, signature state, quote validity, selected variant, economics, customer notes, consent, action, calendar, and debrief.
- Treat offer opens/views as engagement hypotheses only, and only if tracking consent exists.

## Personas

Use motive and blocker scores:

- ROI and Cost-Control Planner: needs transparent assumptions, self-consumption, tariff/feed-in, financing, and competitor comparison.
- Independence and Autarky Optimizer: needs realistic autonomy/self-consumption and battery sizing, not absolute independence claims.
- Climate Impact Confirmer: needs credible CO2/impact proof, usually paired with economics unless climate motive is explicit.
- Technical-Control Optimizer: needs components, design, seasonal production, and system logic.
- Multi-Tech System Builder: needs PV/battery/EV/heat-pump roadmap and phasing.
- Risk and Trust Skeptic: needs named owner, responsibility proof, local proof, aftercare, and low-pressure next step.
- Stakeholder Review State: use only when partner/family/advisor review is explicit.

Do not infer family status, income, age, gender, vulnerability, or household composition.

## Voice Of Customer

German public reviews, forums, consumer guidance, and complaint sources produced consistent language and trust themes:

- Customers react badly to pressure, unclear identity, tone mismatch, vague promises, and slow/no response.
- Customers value fast competent answers, a consistent contact person, clear scope, practical next steps, and professional tone.
- Good consultation can still lose to a cheaper, referred, or clearer competing offer.
- Bundled quotes create suspicion unless line items and responsibilities are clear.
- ROI/payback claims need visible assumptions and sensitivity.
- Financing can solve cash anxiety but increases scrutiny of total cost and obligations.
- Battery, winter, and PV-plus-heat-pump concerns require nuanced, site-specific explanations.
- Roof risk, grid delays, handover, and aftercare affect pre-contract trust.

These sources are not prevalence data. Use them for detection and proof routing, not frequency ranking.

## Objection Library

The final objection library is in `research/06_objection_library.md`. Top categories:

- Upfront price shock.
- Liquidity/financing.
- ROI/payback distrust.
- Competing offer comparison.
- Proposal clarity/bundle suspicion.
- Installer trust/pressure.
- Responsiveness/continuity.
- Battery value/sizing.
- Winter/shade/seasonal output.
- Heat-pump monthly burden/building fit.
- Roof/property damage risk.
- Paperwork/grid/admin uncertainty.
- Aftercare/support concern.
- Co-decision-maker/advisor review.
- Ghosting/no response.

Product rule: if proposal clarity is low, revise the proposal before sending more persuasion. If ROI, winter, finance, subsidy, or battery inputs are missing, request data or refresh facts before generating claims.

## Sales And Marketing Tactics

Evidence-backed tactics are decision-support tactics:

- Diagnose the hesitation first.
- Choose the lowest-pressure action that resolves the blocker.
- Use balanced objection handling: acknowledge concern, show assumptions, explain mitigation, offer verification.
- Help homeowners compare and verify offers.
- Use real local proof only when permissioned and comparable.
- Use one recommended path with a small number of alternatives.
- Schedule concrete next steps with customer control.
- Cap stale follow-up and pause when there is no value-add.

Red lines:

- No artificial urgency.
- No fake scarcity or fear.
- No unsupported "free", "no cost", guaranteed savings, guaranteed payback, or guaranteed bill elimination.
- No fabricated reviews/references/local proof.
- No non-consented channels.
- No hidden assumptions or exclusions.

## Channel, Timing, Calendar, And Debrief

Supported action types:

- Email.
- SMS/WhatsApp with consent.
- Call with consent or customer request.
- Voicemail only in eligible conservative cases.
- Personalized video as an optional hypothesis.
- Revised proposal.
- Financing explainer.
- Document request.
- Virtual consultation.
- In-person visit.
- Pause/no follow-up.
- Escalation.

Scheduling rules:

- Prioritize customer-initiated questions, missed/promised follow-ups, real deadlines, and proof work.
- In-person visits must be justified by physical inspection need, high trust risk, high lead value/readiness, or route density.
- Owner-led installers need quick-action blocks, call blocks, proof-work blocks, and route-clustered visits.
- Every completed action needs a debrief.

Debrief must capture:

- What happened.
- What the customer said.
- Which blocker resolved or changed.
- Next commitment and due date.
- Outcome label and lost reason where relevant.

## Predictive Signals

Predictive insights should be transparent hypotheses until Reonic outcome data validates them.

Potential useful signals:

- Customer-initiated question.
- Promised next step due or overdue.
- Proposal clarity score.
- Missing claim data.
- Competitor mention.
- Unanswered questions.
- Trust-risk language.
- Real deadline.
- Quote validity.
- Consent availability.
- Action outcome/debrief.

Weak signals:

- Offer opens/views without outcome validation.
- Email opens/clicks without tracking consent.
- Repeated no-response as "ghosting" without context.

## Case Studies And Competitors

Reonic public customer/partner signals support the product scope but should not be used as live proof without permission. Agent 0 found public signals around PV Green, MySolarExpress, Enerix, Resoco, Invanova, D,5 Energy, PYourEnergy, and Energieversum.

Competitive research shows adjacent tools already cover ERP, quotation, planning, heat-pump OS, customer portal, referrals, operations, and service:

- OpusFlow: all-in-one ERP for sustainable installers.
- Solar Monkey: quotation/proposal software for PV, batteries, heat pumps, EV chargers.
- autarc: AI-supported sales/planning for heat pumps, solar, storage, wallboxes.
- Sollit: lead-to-design-to-install-to-service platform.
- Sunvoy: solar customer portal, reviews/referrals, documents, tickets, monitoring.

White space: post-quote blocker diagnosis, Germany-aware claim/consent gates, installer-capacity scheduling, and debrief learning.

## Mock CRM Dataset

The PoC should use six golden records:

1. ROI/comparison PV plus battery buyer in Munich.
2. Autarky/battery/wallbox buyer in Hamburg.
3. PV plus heat-pump buyer in NRW with winter/monthly-burden concern.
4. Older-roof trust-risk buyer in Saxony.
5. Climate-motivated buyer with explicit partner ROI review in Baden-Wuerttemberg.
6. Stale no-response buyer in Berlin with no tracking consent.

Full mock records and expected outputs are in:

- `research/13_mock_reonic_crm_dataset.md`
- `research/14_golden_prospect_set.md`

## Product Requirements

P0:

- Next Best Action card.
- Reonic-like quoted-customer CRM envelope.
- Motive/blocker scoring.
- Proposal clarity score.
- Claim checker with source/date metadata.
- Consent-gated channel generator.
- Action scheduler with capacity and travel.
- Debrief loop.

P1:

- Proof asset library.
- A/B test framework.
- Predictive risk/readiness hypotheses.
- Local subsidy/finance/grid check integrations.

## Recommended PoC Screens

1. Quote worklist: customer, product scope, stage, blocker, action, owner, due date, consent badge.
2. Customer detail: quote, products, economics, notes, communication, consent, documents.
3. Assistant panel: diagnosis, evidence chips, confidence, recommended action, why now.
4. Claim/consent warnings: what is blocked and why.
5. Action composer: email/script/proposal addendum/document request/call agenda/video outline.
6. Schedule picker: owner slots, duration, travel, route, virtual alternative.
7. Debrief modal: three required fields plus optional note.
8. Outcome dashboard: booked actions, signed contracts, lost reasons, opt-outs, debrief completion.

## Open Questions

Highest-risk dependencies:

- Reonic private schema and API availability.
- Consent and tracking provenance in Reonic.
- Legal classification of quote-service vs advertising communication in Germany.
- Internal objection prevalence and lost-deal reasons.
- Outcome data for cadence, predictive scores, and action effectiveness.
- Installer validation of calendar capacity and debrief UX.

## Bottom Line

The researched solution should be framed as a Germany-first sales-process coach for renewable installers. It should help a busy installer answer: "What should I do next for this quoted customer, why, through which allowed channel, with which proof, when can I fit it in, and what did I learn after I did it?"

That is the most evidence-backed path from quote sent to contract signed.
