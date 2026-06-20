# Research Plan: Reonic AI-Powered Marketing Assistant

## Purpose

This research phase should produce the evidence base for a prototype that helps renewable energy installers move homeowners from "quote received" to "contract signed" with personalized, explainable, multi-channel follow-up strategies.

The goal is not to gather generic solar marketing facts. The goal is to build a structured body of evidence that lets the product answer:

- Who is this homeowner?
- What are they likely worried about?
- What proof would make them more confident?
- What channel, timing, tone, and message should the installer use next?
- Why does that strategy make sense for this customer, in this market, at this moment?
- How should the installer adjust if the homeowner responds, delays, objects, or goes silent?

## Expected End State

At the end of the research phase, the team should have a product-ready evidence base, not a pile of notes. The research package must let designers and engineers build a convincing PoC with:

- Evidence-backed homeowner personas and segmentation logic.
- A ranked library of quote-stage objections and hesitation patterns.
- Germany-first market facts that affect ROI, incentives, urgency, channel rules, and claims, with non-Germany evidence used only when clearly transferable.
- Case studies and real customer language that can support credible sales assets.
- A channel and timing playbook for email, SMS, phone, video, proposal updates, and human handoff.
- Predictive signal hypotheses for ghosting risk, close readiness, and objection risk.
- Experiment ideas that can become A/B tests after launch.
- A data dictionary and example records for homeowner, quote, installer, market, behavior, consent, message, sequence, and outcome data.
- UX implications for a Reonic-embedded assistant that sits after quote generation and works with CRM, calendar, funnel stages, notes, communication history, proposal views, and sales follow-up tasks.
- Mock Reonic-style customer, quote, CRM, calendar, communication, and debrief records that can power the PoC without access to the real Reonic API.
- A complete action loop: diagnose customer state, recommend the next best action, help schedule or prepare it, capture installer debrief, update the strategy, and learn from the outcome.

## Confirmed Scope For This PoC

These decisions supersede the earlier default assumptions and should guide all later research agents.

- Primary market: Germany. Germany-specific evidence should be preferred for personas, installer feedback, market economics, incentives, tariffs, compliance, customer language, channel norms, and case studies.
- Secondary evidence: use data from DACH, Europe, the UK, the United States, and other markets when Germany-specific evidence is unavailable or when the finding is likely transferable. Every non-Germany finding must be labeled with transferability notes and must not be treated as a Germany fact without validation.
- Product scope: do not assume the exact technology mix. Research Reonic's public website, customer stories, testimonials, partner pages, product pages, and public customer logos to infer the installer segments and products Reonic currently emphasizes. Then inspect those installers' public websites where available to understand whether the PoC should prioritize PV, battery storage, heat pumps, EV charging, or multi-technology household energy packages.
- Funnel scope: post-quote action orchestration from "quote sent" to "contract signed." The assistant should analyze available customer, quote, CRM, communication, behavioral, and installer notes; recommend the next best action; help prepare and schedule the action; capture the installer debrief afterward; and adapt the next recommendation based on the outcome.
- Buyer scope: residential homeowners first. Small commercial, B2B, landlords, and municipal buyers should be tracked as separate future segments, not mixed into the homeowner persona system.
- Installer scope: small and mid-sized renewable energy installers, especially owner-led and low-capacity teams where the same person may buy leads, sell, visit homes, install or manage installation, and run the business. Research should model the practical constraint that an installer may have around 20 active leads, limited time, and no dedicated sales operations function.

## Core PoC Workflow To Research

The research should support a product experience where the installer can:

1. Open a quoted customer in Reonic.
2. See the assistant's diagnosis of customer persona, objections, buying signals, ghosting risk, and close readiness.
3. Review the recommended next best action, such as a call, SMS, email, personalized video, revised proposal, financing explainer, in-person visit, virtual consultation, spouse/partner summary, or no follow-up yet.
4. Understand why that action fits this customer, quote, market context, and installer capacity.
5. Prepare the action with a script, agenda, message draft, proof assets, checklist, or proposal adjustment.
6. Schedule the action in the installer's calendar, taking into account availability, travel, urgency, and lead priority.
7. Complete the action.
8. Debrief the assistant with what happened, what the customer said, new objections, competitor mentions, household dynamics, and next commitments.
9. Receive an updated strategy, follow-up plan, and CRM task sequence.
10. Feed the outcome into a lightweight learning loop for future recommendations.

## Non-Goals

Later research agents should not:

- Write production marketing copy before evidence is gathered.
- Treat general solar industry statistics as persona evidence without a clear link to buying behavior.
- Assume the four prompt personas, family, investor, environmentalist, and skeptic, are complete.
- Use manipulative urgency, fear tactics, or unsupported claims.
- Collapse all markets into one universal solar buyer journey.
- Optimize only for email if calls, SMS, proposal updates, videos, and other touchpoints are relevant.
- Treat anecdotal customer feedback as representative without validation.
- Do live outreach to customers, scrape private data, or use non-public installer data without explicit permission.
- Present legal, tax, financing, or incentive information as current unless it has been verified against an authoritative source at the time of research.
- Turn sensitive attributes such as age, income, family status, or inferred vulnerability into manipulative targeting logic.

## Research Principles

- Every useful claim must be traceable to a source, source type, geography, date, customer segment, and confidence rating.
- Separate what homeowners say from what homeowners do. Quotes, reviews, interviews, and objections reveal language; CRM and funnel data reveal behavior.
- Segment by buying motivation and by market context. A persona without regional economics is too shallow for solar sales.
- Capture negative evidence. Lost deals, ghosting, bad reviews, and objections are more important than polished success stories.
- Distinguish installer-facing reasoning from homeowner-facing messaging. The product must explain why a strategy was chosen without exposing crude persuasion logic to the homeowner.
- Prefer factual urgency over artificial urgency. Incentive deadlines, seasonal installation capacity, utility rate changes, and quote-validity windows can be useful only when real.
- Treat trust as a first-class variable. Solar purchases are high-consideration, high-cost, technically complex decisions.
- Research must constantly answer, "How will this improve the assistant's strategy, generated sequence, or installer UX?" If a finding cannot affect a product decision, deprioritize it.
- The final synthesis should separate high-confidence rules, promising hypotheses, weak signals, and open questions.

## Research Execution Protocol

Research agents should follow this protocol so their outputs can be merged cleanly.

### Citation And Evidence Rules

- Every factual claim must include a source link or internal source identifier.
- Every source must include publication or collection date, access date, geography, source type, methodology if available, and known bias risks.
- Time-sensitive facts such as incentives, electricity prices, financing rates, tax credits, export tariffs, and outreach compliance rules must include the date they were checked.
- Vendor claims, tool benchmarks, and case studies must be labeled as vendor-provided unless independently corroborated.
- Customer review and forum evidence should preserve real language, but must be summarized ethically and should not expose private information.
- If a claim appears in one weak source only, mark it as a hypothesis, not a product rule.
- If evidence conflicts, include both sides and explain which product decision is affected.

### Confidence Rating

Use this confidence scale for extracted claims, personas, objections, and strategy recommendations:

- `high`: Supported by multiple credible source types, regionally relevant, recent enough for the claim, and directly tied to quote-stage buying behavior.
- `medium`: Supported by credible evidence but limited by region, sample size, recency, methodology, or indirect relevance.
- `low`: Plausible and useful, but based on weak, biased, anecdotal, or non-regional evidence.
- `unknown`: Important to product design, but not yet supported by evidence.

### Source Priority Ladder

Prioritize source types in this order:

1. Internal Reonic or installer CRM/funnel data, if available and permissioned.
2. Permissioned sales call transcripts, emails, SMS, notes, win/loss reasons, proposal engagement, and quote histories.
3. Government, regulator, utility, and official incentive program data.
4. Credible industry bodies, market research, academic studies, consumer surveys, and high-quality field experiments.
5. Real customer reviews, complaints, public homeowner discussions, and public quote discussions.
6. Installer case studies, vendor benchmarks, and sales tooling case studies, with bias clearly labeled.
7. Generic marketing benchmarks and blog posts, used only for hypotheses when stronger evidence is absent.

### Minimum Evidence Standards

For a finding to become a core PoC behavior, it should ideally have:

- At least two source types supporting it, or one strong internal dataset.
- A clear region or market scope.
- A clear link to observable input data the assistant can use.
- A specific product implication: persona, objection, channel, timing, proof asset, risk score, UX state, or guardrail.
- A counterexample or known condition where it should not be applied.

For a finding to appear only as optional inspiration, it may have weaker evidence, but it must be labeled as such.

### Research Hygiene

- Keep raw notes separate from synthesized claims.
- Do not merge solar adoption motivations with quote-stage closing motivations unless evidence supports the connection.
- Do not treat engagement metrics, such as email opens, as buying intent without outcome validation.
- Do not infer protected or sensitive traits unless the data is explicit, permissioned, and product use is ethically justified.
- Store exact customer language as voice-of-customer data, but convert it into respectful installer-facing guidance before using it in the product.

## Phase 1: Define The Research Schema

Before collecting data, later agents should agree on common data structures so findings can be compared and reused in the PoC.

### Source Record Fields

For every source, capture:

- `source_id`
- `source_title`
- `source_type`
- `publisher_or_origin`
- `author_or_owner`
- `date_published_or_collected`
- `date_accessed`
- `geography`
- `market_context`
- `customer_segment`
- `funnel_stage`
- `sample_size`
- `methodology`
- `data_type`
- `primary_claims`
- `verbatim_customer_language`
- `quantitative_metrics`
- `limitations`
- `bias_risks`
- `confidence_rating`
- `relevance_to_reonic`
- `recommended_use_in_poc`

### Evidence Item Fields

For every extracted claim, capture:

- `claim`
- `claim_category`
- `supporting_source_ids`
- `evidence_type`
- `strength_of_evidence`
- `region_applicability`
- `persona_applicability`
- `quote_or_data_excerpt`
- `counterevidence`
- `product_implication`
- `message_implication`
- `validation_needed`

### Persona Fields

Each persona should include:

- `persona_name`
- `primary_motivation`
- `secondary_motivations`
- `typical_trigger_event`
- `household_context`
- `decision_makers`
- `financial_context`
- `energy_context`
- `home_context`
- `regional_context`
- `buying_stage`
- `risk_tolerance`
- `technical_literacy`
- `trust_level`
- `price_sensitivity`
- `environmental_motivation`
- `resilience_motivation`
- `status_or_identity_motivation`
- `main_objections`
- `hidden_objections`
- `proof_needed`
- `preferred_channels`
- `preferred_tone`
- `language_patterns`
- `urgency_triggers`
- `likely_ghosting_signals`
- `close_readiness_signals`
- `messages_that_backfire`
- `installer_actions_that_build_trust`
- `sales_assets_that_help`
- `recommended_sequence_shape`
- `regional_variants`
- `confidence_rating`
- `evidence_sources`

### Objection Fields

Each objection should include:

- `objection_name`
- `homeowner_language`
- `underlying_fear_or_need`
- `affected_personas`
- `affected_regions`
- `stage_when_it_appears`
- `deal_risk_level`
- `best_response_type`
- `proof_assets_needed`
- `channel_fit`
- `timing_fit`
- `bad_response_patterns`
- `evidence_sources`
- `validation_status`

### Messaging Tactic Fields

Each tactic should include:

- `tactic_name`
- `intended_behavior_change`
- `persuasion_mechanism`
- `appropriate_personas`
- `inappropriate_personas`
- `required_facts`
- `acceptable_channels`
- `recommended_timing`
- `example_message_structure`
- `ethical_constraints`
- `proof_standard`
- `evidence_sources`
- `testable_hypothesis`
- `success_metrics`

## Phase 2: Source Map

Later agents should collect source types across six levels: Reonic public ecosystem, homeowner voice, installer sales reality, market economics, case studies and competitors, and persuasion evidence.

### Reonic Public Ecosystem Sources

Use these to infer the product scope and installer reality for the PoC before deciding which technologies and installer types to prioritize:

- Reonic product pages for residential PV, battery storage, heat pumps, EV charging, commercial solar, CRM, proposals, customer portal, calendar, services, AI, WhatsApp, integrations, and installation workflows.
- Reonic customer stories, testimonials, public case studies, review pages, webinars, press releases, partner pages, and public customer logos.
- Public websites of identifiable Reonic customers or installers, where available.
- Public installer service pages describing PV, batteries, heat pumps, EV chargers, financing, subsidies, maintenance, installation process, consultation offers, and service regions.
- Public installer review pages, including Google reviews, Trustpilot, ProvenExpert, Facebook, or local German review platforms where available.
- Public installer job postings or team pages that reveal company size, sales roles, installation capacity, regions served, or technology focus.
- Reonic help/docs or public API/integration information, if available, to infer what CRM, quote, calendar, communication, and proposal data the PoC can plausibly mock.

For each identifiable installer or source, capture:

- `installer_name`
- `country_or_region`
- `company_size_signal`
- `technology_scope`
- `customer_segments`
- `sales_promises`
- `financing_or_subsidy_language`
- `follow_up_or_consultation_offers`
- `reviews_or_customer_feedback_sources`
- `proof_assets_used`
- `trust_signals`
- `public_reonic_connection`
- `confidence_rating`
- `poc_implication`

Do not treat a public logo or testimonial as proof of current active usage without a source date. The goal is to infer likely PoC scope, not to create a verified customer list.

### Homeowner Voice Sources

Use these to understand language, emotions, concerns, and decision logic:

- Reviews of German solar and renewable installers, including positive, negative, and mixed reviews.
- Public homeowner discussions about solar quotes, installation, batteries, financing, warranties, and regrets.
- Homeowner survey data about solar adoption, purchase barriers, and trust factors.
- Interview transcripts or notes from homeowners who accepted, rejected, delayed, or abandoned quotes.
- Customer support tickets, if available.
- Sales call transcripts, if available.
- Objection logs from installers, if available.
- Complaints about misleading solar sales practices.
- Testimonials and case studies, while treating them as biased unless corroborated.

### Installer Sales Reality Sources

Use these to understand the actual funnel:

- CRM stage definitions and conversion rates.
- Time from quote sent to contract signed.
- Follow-up cadence used by successful reps.
- Follow-up cadence used by unsuccessful reps.
- Win/loss notes.
- Deal size, financing type, system size, and battery attach rate.
- Quote revision history.
- Reasons for discounts.
- Competitor mentions.
- Sales manager playbooks.
- Rep interview notes.
- Proposal templates.
- Communication templates currently used.
- Call, SMS, email, and proposal engagement data, if available.
- Calendar constraints, site visit workload, travel time, installation capacity, and seasonal bottlenecks.
- Lead source economics, including paid lead pressure where evidence is available.
- Owner-operator workflows where one person manages sales, customer visits, installation coordination, and business administration.
- Examples of installers carrying many active leads at once, with limited time for personalized follow-up.
- Debrief habits after calls, visits, and proposal reviews, including whether outcomes are recorded in CRM or lost in notes and memory.

### Market And Regional Sources

Use these to ground claims in actual economics and local constraints:

- German electricity price data.
- German incentives, subsidies, tax treatment, and support schemes relevant to residential PV, batteries, heat pumps, and EV chargers.
- German feed-in tariffs, self-consumption economics, grid connection, metering, and export compensation rules.
- Financing rates and common German loan or leasing terms.
- Typical German residential installation costs.
- Typical system sizes in Germany.
- Battery economics in Germany.
- German solar production assumptions and regional irradiance differences.
- Seasonal production variation and winter-performance concerns.
- Grid reliability and backup-power relevance where supported.
- Permitting, grid registration, interconnection, and paperwork timelines.
- Installer capacity and seasonal scheduling in Germany.
- German homeownership, housing type, roof suitability, and regional housing patterns.
- German language, tone, cultural norms, debt attitudes, privacy expectations, and attitudes toward sales calls, SMS, WhatsApp, and home visits.
- German outreach compliance rules for email, SMS, calls, WhatsApp, consent, opt-out, and data use.
- Comparable non-Germany market data only when it helps fill evidence gaps or provides transferable behavior patterns.

### Case Study Sources

Use these to understand what has worked in real sales and marketing contexts:

- Installer case studies about conversion rate, quote-to-close time, follow-up automation, proposal changes, financing explanation, or battery attachment.
- Reonic or Reonic-adjacent workflow case studies, if available.
- CRM, proposal software, field service, and home improvement sales case studies, only where the funnel resembles residential renewable energy.
- Public examples of successful solar customer education, ROI calculators, proposal redesigns, referral programs, and local social proof campaigns.
- Failed campaigns or complaint cases where aggressive sales tactics damaged trust.

For each case study, capture the intervention, baseline, outcome, sample size or deal count, timeframe, market, product type, source bias, and transferability to Reonic.

### Competitive And Tooling Sources

Use these to understand what installers and competing platforms already provide:

- Solar proposal platforms.
- Solar CRM and installer operating platforms.
- Generic CRMs with solar-specific templates or integrations.
- Marketing automation tools used by installers.
- Financing provider sales enablement material.
- Lead generation marketplaces and their follow-up practices.
- WhatsApp, SMS, phone, and email workflows used by local installers.

The goal is not to copy competitors. The goal is to identify table-stakes capabilities, gaps Reonic can exploit, and UX patterns installers already understand.

### Persuasion And Sales Evidence Sources

Use these to evaluate which tactics are legitimate and when they work:

- Peer-reviewed behavioral science research relevant to trust, risk, decision delay, loss aversion, social proof, defaults, scarcity, commitment, and financial framing.
- B2C high-consideration sales research.
- Home improvement sales research.
- Renewable energy adoption research.
- Field experiments or case studies involving follow-up timing, personalization, channel mix, or objection handling.
- Email, SMS, and call performance benchmarks, only when market-relevant.
- A/B testing case studies, with sample size and context recorded.
- Research on ethical persuasion and consumer protection in high-cost purchases.

## Phase 3: Homeowner Persona Coverage

The plan should validate, expand, and refine personas beyond the initial examples.

### Required Starting Personas

Research agents must test and refine these four prompt personas:

- Family: values predictable bills, safety, reassurance, simplicity, and peace of mind.
- Investor: values ROI, payback, opportunity cost, asset value, and comparison against alternatives.
- Environmentalist: values impact, emissions reduction, energy transition, and values-aligned action.
- Skeptic: needs proof, objection handling, credibility, and risk reduction.

### Additional Persona Hypotheses To Test

Later research should look for evidence for or against these additional segments:

- Bill-shocked household: triggered by rising utility bills and seeks control.
- Fixed-income homeowner: values stability, low risk, and predictable monthly cost.
- New homeowner: interested in long-term upgrades but may be overwhelmed by competing projects.
- EV or heat-pump adopter: wants integrated home energy planning.
- Battery and resilience buyer: cares about backup power, outages, and independence.
- Aesthetic-sensitive homeowner: worries about roof appearance and neighborhood perception.
- Maintenance-worried homeowner: fears repairs, degradation, roof leaks, and warranties.
- Financing-constrained buyer: wants solar but is blocked by upfront cost, credit, loan terms, or cash flow.
- Comparison shopper: has multiple quotes and needs differentiation.
- Community-influenced buyer: influenced by neighbors, local examples, and social proof.
- Incentive-driven buyer: motivated by rebates, tax credits, deadlines, and quote validity.
- Low-trust buyer: suspicious of installers, sales claims, or the solar industry.
- Technical optimizer: wants detailed specs, production modeling, system design, and monitoring.
- Passive ghost risk: initially interested but distracted, uncertain, or lacking a clear next step.

### Persona Validation Checklist

For each persona, later agents should verify:

- Is this a real cluster in the evidence or just a convenient stereotype?
- Does the persona appear in multiple source types?
- Does the persona differ meaningfully in objections, proof needs, tone, channel, or timing?
- Is the persona tied to observable input fields the product can actually receive?
- Can the product infer this persona without sensitive or invasive data?
- Does this persona have regional variants?
- What evidence would disprove or weaken this persona?
- What messages would be persuasive to this persona but counterproductive for another?
- What installer action, not just message, helps this persona advance?

## Phase 4: Customer Feedback And Voice-Of-Customer Analysis

This workstream should turn raw homeowner feedback into usable product inputs.

### What To Extract

From reviews, discussions, interviews, objections, and transcripts, extract:

- Exact phrases homeowners use for cost, uncertainty, trust, ROI, environment, urgency, and fear.
- Recurring questions before signing.
- Reasons people delayed after receiving a quote.
- Reasons people selected one installer over another.
- Reasons people rejected solar entirely.
- Reasons people regretted signing.
- Positive trust signals mentioned after successful projects.
- Negative trust breakers mentioned after bad experiences.
- Confusing terms in proposals or financing.
- Parts of the quote homeowners scrutinize.
- Parts of the quote homeowners ignore.
- Emotional state at each funnel stage.
- Decision-maker conflicts inside the household.
- Competitor comparison criteria.
- Signals that a homeowner is ready for a call.
- Signals that a homeowner wants low-pressure written information.

### Feedback Coding Categories

Use consistent tags:

- `price`
- `monthly_payment`
- `payback_period`
- `financing`
- `incentives`
- `tax_credit`
- `net_metering`
- `trust`
- `installer_reputation`
- `warranty`
- `maintenance`
- `roof_condition`
- `aesthetics`
- `performance_uncertainty`
- `weather_or_winter`
- `battery`
- `backup_power`
- `environmental_impact`
- `home_value`
- `moving_or_resale`
- `installation_disruption`
- `timeline`
- `permitting`
- `comparison_shopping`
- `spouse_or_partner_alignment`
- `technical_complexity`
- `sales_pressure`
- `ghosting`
- `urgency`
- `local_social_proof`

### Voice Quality Checks

Before using customer language in the prototype:

- Confirm whether the language comes from real homeowners or from company marketing.
- Separate first-time buyers from existing solar owners.
- Separate pre-installation concerns from post-installation complaints.
- Identify whether the feedback is about solar generally or a specific installer's conduct.
- Note whether a quote, financing offer, battery, or incentive was involved.
- Preserve emotional language, but avoid exaggerating isolated complaints.

### Review Mining Method

When mining public reviews or discussions, agents should:

- Sample across positive, negative, and mixed feedback, not only extreme reviews.
- Separate reviews of sales process from reviews of installation quality, service, warranty, or billing.
- Track whether the customer signed, rejected, delayed, regretted signing, or was only researching.
- Code each item with the feedback tags above.
- Extract the actual phrasing homeowners use for fear, confusion, trust, ROI, pressure, and satisfaction.
- Mark suspected fake, incentivized, duplicate, or low-context reviews as weak evidence.
- Summarize patterns quantitatively when sample size permits, such as top objections by frequency.

## Phase 5: Objection Library

The objection library should become one of the core assets of the PoC.

### Required Objection Areas

Research agents should collect evidence for these objection classes:

- Total system cost is too high.
- Monthly payment does not feel worth it.
- Payback period is too long.
- ROI calculations are not trusted.
- Financing terms are confusing.
- Incentives or tax credits are unclear.
- Homeowner is waiting for a better deal.
- Homeowner is comparing other installers.
- Homeowner worries panels will not work in winter, shade, clouds, or poor weather.
- Homeowner worries savings are overstated.
- Homeowner worries about roof damage or leaks.
- Homeowner worries about maintenance and repairs.
- Homeowner worries about warranty exclusions.
- Homeowner dislikes panel appearance.
- Homeowner may move before payback.
- Homeowner is unsure solar increases home value.
- Homeowner fears installation disruption.
- Homeowner distrusts the salesperson or installer.
- Homeowner distrusts the solar industry.
- Household decision-makers are not aligned.
- Homeowner is interested but busy or distracted.
- Homeowner does not understand the next step.
- Homeowner is afraid of making an irreversible decision.
- Homeowner wants batteries but the economics are unclear.
- Homeowner wants energy independence but quote does not address it.
- Homeowner believes waiting for better technology is smarter.

### Objection Analysis Checklist

For each objection:

- Capture the surface objection and likely underlying concern.
- Identify whether it is rational, emotional, logistical, social, or trust-based.
- Identify what proof can address it.
- Identify what cannot be solved by messaging alone.
- Identify whether the best response is email, SMS, call, revised proposal, calculator, video, testimonial, or no immediate follow-up.
- Identify the best timing for response.
- Identify how aggressive follow-up could backfire.
- Identify which regional facts are required before making the claim.
- Identify when the installer should escalate to a human call.

## Phase 6: Germany-First Regional Segmentation

Solar economics and buying psychology vary by market. Germany is the PoC anchor, so German market facts should be researched in the most detail. Later research must not produce universal claims unless they survive regional checks.

### Regional Fields To Capture

For Germany, capture these fields with current authoritative sources wherever possible. For non-Germany evidence, capture the same fields only as needed to evaluate transferability:

- Country.
- State, province, or region where relevant.
- Utility territory where relevant.
- Language.
- Electricity rates.
- Rate structure.
- Net metering or export rules.
- Incentives, rebates, and tax credits.
- Incentive deadlines.
- Typical system cost.
- Typical system size.
- Typical financing structure.
- Interest rate environment.
- Typical payback period.
- Battery economics.
- Solar production assumptions.
- Seasonal production profile.
- Weather concerns.
- Grid reliability concerns.
- Permitting and interconnection timeline.
- Common roof types.
- Housing density and ownership patterns.
- Cultural attitudes toward debt, sustainability, sales calls, SMS, and home contractors.
- Legal constraints on marketing outreach.

### Regional Validation Questions

- Is this a German fact, a DACH/Europe pattern, or a transferable non-Germany hypothesis?
- Would this ROI claim still be true in this region?
- Would this environmental impact claim still be true in this region?
- Would this urgency claim still be true in this region?
- Does the channel recommendation comply with local outreach rules?
- Does this persona's pain point change because of local electricity prices or incentives?
- Does seasonality change follow-up timing?
- Does language or cultural context change what tone feels trustworthy?

## Phase 7: Persuasion Evidence And Ethical Guardrails

The product should use persuasion evidence without becoming manipulative.

### Tactics To Investigate

Later agents should evaluate evidence for:

- Loss aversion: framing the cost of waiting, only when grounded in real rates, incentives, or installation timing.
- Social proof: using similar local customers, only when examples are genuine and relevant.
- Authority: using credible data, certifications, warranties, or installer track record.
- Commitment: asking for small next steps, such as a clarification call or quote review.
- Personalization: matching proof and tone to motivation.
- Scarcity or urgency: using real deadlines, not artificial pressure.
- Risk reversal: warranties, guarantees, service commitments, and transparent assumptions.
- Contrast framing: comparing solar returns, bill stability, or alternatives fairly.
- Simplicity: reducing cognitive load in complex financing or technical decisions.
- Narrative transportation: showing a homeowner's future state, especially for families and environmentalists.
- Objection inoculation: addressing expected concerns before they become blockers.
- Choice architecture: offering clear next steps without overwhelming options.

### Evidence Requirements

For each tactic, later agents must determine:

- What behavior is the tactic supposed to change?
- What evidence supports it?
- What market or customer context did the evidence come from?
- Is it proven in solar, high-consideration sales, or only general marketing?
- What customer segment benefits from it?
- What customer segment might react negatively?
- What facts are required before using it?
- What would make the tactic unethical or misleading?
- How can the prototype explain the tactic to an installer in plain language?
- How can the prototype test whether the tactic works?

### Ethical Red Lines

The assistant should not recommend:

- Fake urgency.
- Unsupported savings claims.
- Unsupported ROI comparisons.
- Misleading environmental impact claims.
- Pressure tactics aimed at vulnerable customers.
- Hiding financing tradeoffs.
- Pretending a message is personal when it is purely automated.
- Overriding a homeowner's stated channel preference.
- Repeated outreach after disengagement or opt-out.
- Using sensitive inferred traits unless explicit, appropriate, and necessary.

## Phase 8: Channel, Timing, And Sequence Research

The PoC should recommend a communication chain, not isolated messages.

### Channels To Study

Research agents should evaluate:

- Email.
- SMS.
- Phone calls.
- Voicemail.
- WhatsApp or other regionally common messaging channels.
- Personalized video.
- Revised proposal.
- ROI calculator or savings breakdown.
- Environmental impact summary.
- Local customer case study.
- Installer comparison sheet.
- Financing explainer.
- Warranty or maintenance explainer.
- In-person or virtual consultation.
- In-person home visit, roof inspection, or technical walk-through.
- Follow-up task, calendar block, or reminder rather than immediate customer outreach.
- Referral or neighbor proof.

### Channel Fields

For each channel, capture:

- Best-fit persona.
- Best-fit funnel stage.
- Best-fit objection.
- Message length expectations.
- Level of personalization required.
- Required consent.
- Compliance risks.
- Cost to installer.
- Time burden for installer.
- Automation potential.
- Human handoff trigger.
- Failure mode.
- Metrics to track.

### Timing Questions

Later agents should determine:

- What should happen immediately after quote delivery?
- What should happen after 24 hours of silence?
- What should happen after 3 to 5 days of silence?
- What should happen after a competing quote is mentioned?
- What should happen when a homeowner opens a proposal repeatedly but does not reply?
- What should happen when a homeowner asks about financing?
- What should happen when a homeowner asks technical questions?
- What should happen when a household decision-maker is missing?
- When is an in-person visit worth the travel and calendar cost?
- When should a low-capacity installer prioritize one lead over another?
- How should the assistant schedule actions around existing appointments, travel, installation work, and quote validity?
- What should the assistant ask in a debrief after a call, visit, or email exchange?
- How should the next recommendation change after a positive, neutral, negative, or ambiguous debrief?
- When should follow-up slow down or stop?

### Sequence Shapes To Validate

Agents should test whether evidence supports these sequence patterns:

- Confidence sequence: quote recap, proof of savings assumptions, short call invitation, final decision support.
- Objection sequence: acknowledge concern, provide specific proof, offer a revised proposal or calculation, schedule expert call.
- Comparison sequence: clarify decision criteria, compare value beyond price, provide local proof, ask for the deciding blocker.
- Ghost recovery sequence: low-pressure check-in, simplify next step, provide one useful asset, then pause.
- Household alignment sequence: spouse or partner summary, shared decision checklist, call with all decision-makers.
- Urgency sequence: real incentive, price-validity, installation-slot, or seasonal timing reminder with a non-pushy CTA.
- Expansion sequence: PV quote followed by battery, heat pump, or EV charger value only when customer signals match.

### Action Types To Model

The assistant should be able to recommend and prepare more than messages. Research should define when each action is appropriate:

- Send a short SMS or WhatsApp check-in.
- Send a detailed email.
- Call the homeowner.
- Leave a voicemail.
- Record or send a personalized video.
- Send a revised proposal.
- Send a savings, financing, warranty, installation, or maintenance explainer.
- Prepare a spouse or partner decision summary.
- Schedule a virtual consultation.
- Schedule an in-person home visit or technical inspection.
- Ask for missing documents, photos, bills, or usage information.
- Ask a clarifying question before pitching.
- Pause outreach because of low intent, opt-out, lack of consent, or poor fit.
- Escalate to the owner, senior salesperson, technical planner, or financing specialist.

For each action, capture expected time cost, calendar impact, best-fit persona, best-fit objection, proof needed, compliance limits, and debrief questions.

## Phase 9: Predictive Signals And Risk Scoring

Predictive insights are only valuable if based on observable signals and validated against outcomes.

### Candidate Signals To Research

Research agents should look for evidence around:

- Time since quote sent.
- Number of quote views.
- Email opens and clicks.
- SMS replies.
- Call answer rate.
- Number and type of questions asked.
- Competitor mentions.
- Financing hesitation.
- Request for revised quote.
- Battery interest.
- Household decision-maker involvement.
- Explicit timeline.
- Incentive deadline relevance.
- Prior no-shows or missed calls.
- Tone of replies.
- Proposal sections viewed.
- Price objection severity.
- Installer trust signals requested.

### Predictive Validation Checklist

Before adding a signal to the PoC:

- Is the signal observable from likely Reonic or installer data?
- Does the signal correlate with signed, lost, or ghosted outcomes?
- Does it add value beyond obvious time-since-last-response?
- Is it robust across regions and installers?
- Could it encode unfair or sensitive assumptions?
- Can the assistant explain the signal in a way a salesperson trusts?
- What action should change because of this signal?

## Phase 10: A/B Testing And Iteration Framework

The research phase should prepare the prototype to improve over time.

### Testable Strategy Variables

Later agents should identify evidence and hypotheses for testing:

- ROI-first vs. reassurance-first framing.
- Environmental impact vs. bill stability framing.
- Short SMS nudge vs. detailed email.
- Human call invitation vs. self-serve proposal link.
- Local social proof vs. installer authority proof.
- Urgency based on incentive deadline vs. no urgency.
- Technical explanation vs. simplified summary.
- Family peace-of-mind story vs. financial projection.
- Video follow-up vs. plain text follow-up.
- One clear next step vs. multiple options.

### Metrics

Recommended outcome metrics:

- Reply rate.
- Scheduled call rate.
- Proposal revisit rate.
- Quote revision request rate.
- Contract signed rate.
- Time from quote to contract.
- Ghosting rate.
- Opt-out rate.
- Complaint or negative-reply rate.
- Sales rep adoption rate.
- Rep edit rate.
- Manager trust rating.

### Testing Guardrails

- Do not test misleading claims.
- Do not test pressure tactics against vulnerable groups.
- Segment tests by region and persona.
- Avoid declaring winners without enough sample size.
- Track downstream close quality, not only clicks.
- Preserve installer control for high-value or sensitive deals.

## Phase 11: Case Study And Competitive Landscape Synthesis

This workstream should run after initial persona and market context research, because case studies are only useful when the team knows what patterns to look for.

### Case Study Extraction Fields

For each case study, capture:

- `case_study_id`
- `company_or_installer_type`
- `market`
- `product_scope`
- `customer_segment`
- `funnel_stage`
- `problem`
- `intervention`
- `channels_used`
- `personalization_method`
- `proof_assets_used`
- `timing_or_cadence`
- `reported_metrics`
- `baseline_metrics`
- `outcome`
- `sample_size_or_volume`
- `timeframe`
- `source_bias`
- `transferability_to_reonic`
- `poc_implication`
- `confidence_rating`

### Competitive Landscape Questions

Research agents should answer:

- Which tools already generate solar follow-up messages, proposal comments, sales tasks, or marketing automations?
- Which tools show persona, objection, or risk reasoning rather than just message drafts?
- Which tools integrate with CRM stages, proposal views, calendars, calls, SMS, or WhatsApp?
- Which tools support localized incentive, tariff, or ROI claims?
- Which tools support installer feedback loops, win/loss learning, or A/B testing?
- Where are competitors generic, under-explained, email-only, or weak on trust?
- What would make Reonic's assistant feel native to the quote and CRM workflow rather than bolted on?

### Competitive Output

The final competitive synthesis should produce:

- Table-stakes capabilities.
- Differentiators Reonic can credibly demonstrate in the PoC.
- UX patterns worth adapting.
- Claims competitors make that require substantiation.
- Gaps in competitor approaches around explanation, localization, multi-channel sequencing, and feedback loops.

## Phase 12: Synthesis Deliverables

The research phase should produce these artifacts for product and design work.

### 1. Evidence Matrix

A structured table of claims, sources, strength, region, persona, and product implication.

### 2. Persona System

Persona cards with motivations, pain points, objections, proof needs, channel preferences, and strategy implications.

### 3. Objection Library

A searchable library of objections with recommended evidence-backed responses and escalation rules.

### 4. Channel And Timing Playbook

A sequence model showing what to send, when, why, and through which channel.

### 5. Regional Market Briefs

Briefs that identify which economic, regulatory, and cultural assumptions change by market.

### 6. Persuasion Evidence Brief

A practical guide to which persuasion tactics are supported, where they apply, and where they are risky.

### 7. Data Dictionary

A list of homeowner, quote, installer, and behavioral fields needed by the PoC.

### 8. Strategy Decision Rules

Rules or scoring logic that map input data to persona hypotheses, objections, follow-up strategy, and channel recommendations.

### 9. Validation Plan

A plan for expert review, installer review, customer feedback, and live A/B testing.

### 10. Prototype Content Primitives

Reusable message structures, proof modules, explanation snippets, and adjustment controls grounded in the research.

### 11. Case Study Database

A structured database of relevant case studies with metrics, source bias, and transferability notes.

### 12. Competitive Landscape Brief

A concise analysis of existing tools, current installer workflows, competitor capabilities, and Reonic differentiation opportunities.

### 13. Golden Prospect Set

At least 8 to 12 realistic prospect scenarios for prototype evaluation. Each scenario should include customer profile, quote facts, regional context, communication history, likely persona mix, objections, risk signals, expected assistant strategy, and messages the assistant must avoid.

### 14. Research Source Index

A master index of every source used, with fields from the source record schema and links to the claims that depend on each source.

### 15. Reonic Public Ecosystem Brief

A Germany-first summary of what Reonic publicly appears to serve: installer types, customer references, product modules, technology mix, workflow assumptions, and what the PoC should mock.

### 16. Mock Reonic CRM Dataset

A realistic dataset of German homeowner quote records, CRM timelines, communications, calendar availability, installer notes, debriefs, and outcomes for use in the prototype.

### 17. Action And Debrief Playbook

A playbook defining next-best-action types, scheduling logic, preparation assets, debrief questions, and strategy updates after each action outcome.

## Phase 13: Product Input Data Requirements

The research should identify which fields the marketing assistant needs to produce credible strategies.

### Homeowner Data

Potential fields:

- Name.
- Location.
- Address or service area.
- Language.
- Home type.
- Household context.
- Decision-makers.
- Decision-maker availability.
- Current electricity bill.
- Utility provider.
- Energy usage.
- Motivation stated by homeowner.
- Concerns stated by homeowner.
- Preferred channel.
- Communication history.
- Timeline.
- Availability windows.
- Budget constraints.
- Financing preference.
- Environmental interest.
- Backup power interest.
- EV or heat pump ownership.
- Moving plans if known.
- Documents, photos, bills, or roof information already provided.
- Missing information needed before the next action.

### Quote Data

Potential fields:

- Quote date.
- System size.
- Estimated production.
- Estimated savings.
- Total cost.
- Monthly payment.
- Financing terms.
- Incentives included.
- Payback period.
- Battery included.
- Warranty terms.
- Installer differentiators.
- Installation timeline.
- Quote expiration or validity.
- Assumptions used in calculations.
- Proposed installation window.
- Required site visit or inspection status.
- Proposal variants.
- Customer-facing proof assets attached to the quote.

### Behavioral Data

Potential fields:

- Proposal viewed.
- Proposal view frequency.
- Sections viewed.
- Email opened.
- Link clicked.
- SMS replied.
- Call answered.
- Meeting scheduled.
- Meeting missed.
- Objection expressed.
- Competitor mentioned.
- Quote revised.
- Last contact date.
- Days since quote.
- Appointment accepted.
- Appointment declined.
- In-person visit completed.
- Debrief completed.
- Customer sentiment after action.
- Next commitment promised by customer.

### Installer Data

Potential fields:

- Installer region.
- Installer capacity.
- Installer company size.
- Owner-operator or dedicated sales role.
- Active lead count.
- Lead source mix.
- Paid lead pressure or cost per lead, if known.
- Certifications.
- Reviews or rating.
- Local case studies.
- Typical installation timeline.
- Service guarantees.
- Financing partners.
- Differentiators.
- Sales rep notes.
- Current templates.
- Compliance requirements.
- Working hours.
- Calendar availability.
- Travel radius.
- Visit duration assumptions.
- Installation workload or blocked days.

### Consent And Compliance Data

Potential fields:

- Email consent status.
- SMS consent status.
- Phone consent status.
- WhatsApp or messaging consent status.
- Opt-out status.
- Last consent update.
- Region-specific outreach rules.
- Required disclosure language.
- Do-not-contact reason.
- Human approval required.

### Sequence And Outcome Data

Potential fields:

- Sequence ID.
- Strategy selected.
- Persona hypothesis at send time.
- Objection focus.
- Channel used.
- Message version.
- Tone setting.
- CTA used.
- Human edits.
- Approval status.
- Send time.
- Customer response.
- Outcome stage.
- Closed-won or closed-lost reason.
- Time to next action.
- Experiment ID.
- Action type.
- Action preparation assets.
- Scheduled start and end time.
- Travel time estimate.
- Calendar event ID.
- Debrief summary.
- New facts learned.
- New objections discovered.
- Follow-up commitment.
- Assistant next-step revision.

### Calendar And Capacity Data

Potential fields:

- Calendar provider.
- Available slots.
- Existing appointments.
- Installation work blocks.
- Travel start location.
- Customer location.
- Estimated travel time.
- Preferred meeting length.
- Urgency deadline.
- Lead priority.
- Action duration.
- Buffer requirements.
- No-go times.

### Mock Reonic CRM Dataset Requirements

Because the PoC does not have access to the Reonic API, research must define a realistic mocked dataset that resembles what an assistant could plausibly see inside Reonic.

The mocked dataset should include:

- 8 to 12 quoted homeowner records in Germany.
- At least 4 persona archetypes and several mixed-persona cases.
- At least 5 objection categories.
- PV-only, PV plus battery, and multi-technology quotes if Reonic ecosystem research supports this product scope.
- Quote economics with realistic German assumptions and clear source dates.
- CRM timeline events, notes, tasks, proposal views, emails, SMS or WhatsApp messages, calls, appointments, and missed follow-ups.
- Installer capacity context, including an owner-operator or small team with many active leads.
- Calendar records with realistic availability and conflicts.
- Debrief examples after calls, visits, and sent messages.
- Outcome labels such as close-ready, ghost risk, competitor risk, needs technical reassurance, financing blocked, household decision pending, and closed-lost.

Each mocked record should include citations or source logic explaining why the scenario is realistic.

### Derived Metrics To Define

Research agents should define formulas or required source data for:

- Estimated annual savings.
- Monthly bill impact.
- Payback period.
- IRR or equivalent return metric, if appropriate.
- Self-consumption share.
- Export compensation value.
- Battery value contribution.
- CO2 impact.
- Quote age.
- Follow-up age.
- Engagement score.
- Ghosting risk.
- Close readiness.
- Objection severity.
- Persona confidence.
- Recommendation confidence.
- Lead priority score.
- Calendar urgency.
- Action cost in installer time.
- Expected value or opportunity priority, if enough data exists.

## Phase 14: Quality Bar For Research Findings

Every major conclusion should pass these checks before entering the product design:

- It is supported by more than one source type, or clearly labeled as tentative.
- It is regionally scoped.
- It is tied to an observable product input or a required missing input.
- It affects an actual product decision.
- It distinguishes correlation from causation.
- It includes counterexamples or cases where the guidance should not apply.
- It can be explained to an installer in plain language.
- It can be tested after launch.
- It avoids unsupported savings, ROI, urgency, or environmental claims.

## Cross-Cutting Product Critique Checklist

This checklist should be used to review the final research package before builders start the PoC.

### AI Product And PoC

- Does the research define exactly what the assistant should output: diagnosis, persona hypothesis, strategy, timeline, channel mix, drafts, rationale, evidence, alternatives, and next-best action?
- Does it distinguish deterministic calculations from LLM-generated language?
- Does it define when the assistant should ask for missing data instead of guessing?
- Does it define confidence levels for persona, objection, risk, and recommendation quality?
- Does it define guardrails for savings, ROI, incentives, emissions, warranty, production, and urgency claims?
- Does it include at least 8-12 prototype-ready prospect scenarios with expected strategy behavior?
- Does it show how the output changes when quote economics, persona signals, region, or objection changes?
- Does it identify what can be honestly demonstrated in the PoC versus what requires future CRM or outcome data?

### UX And Workflow

- Does the research identify the installer's real workflow from quote sent to follow-up?
- Does it define the minimum viable input flow and which fields can come from CRM, quote tools, rep notes, or manual entry?
- Does it specify how to show reasoning without overwhelming the rep?
- Does it define controls for tone, urgency, channel, language, objection focus, and regeneration?
- Does it define low-confidence, missing-data, compliance-blocked, and opt-out states?
- Does it define how the assistant recommends, prepares, schedules, and follows up on actions, not just messages?
- Does it define the debrief flow after calls, visits, emails, and proposal revisions?
- Does it account for owner-operator time pressure, travel, active lead load, and installation work?
- Does it specify what a sales manager needs to trust, review, or approve the strategy?
- Does it identify which parts of the recommendation are installer-facing only versus customer-facing?

### Evaluation

- Does the research include a golden test set covering major personas, regions, objections, and edge cases?
- Does it define a rubric for strategic fit, factuality, tone, channel choice, timing, compliance, localization, and actionability?
- Does it include negative tests for unsupported claims, weak persona signals, missing quote data, fake urgency, and over-personalization?
- Does it define who reviews quality: solar sales experts, installers, customers, compliance reviewers, or internal product reviewers?
- Does it define minimum demo-readiness thresholds?
- Does it test the strategy reasoning separately from message copy quality?

### Experimentation

- Does the research convert strategy ideas into testable hypotheses?
- Does it define A/B variables such as framing, channel, timing, CTA, proof type, and sequence length?
- Does it define metrics beyond opens and clicks, including reply, call booked, proposal revisited, quote revised, contract signed, opt-out, complaint, rep adoption, and rep edit rate?
- Does it warn where sample size or selection bias would make conclusions weak?
- Does it define event tracking required for future production learning?
- Does it prevent tests of misleading, manipulative, or non-compliant tactics?

### Localization

- Does the research treat Germany as the first demo market and clearly label secondary-market evidence as transferable or unvalidated?
- Does it define local currency, units, language, tone, energy economics, incentives, rate structures, and outreach rules?
- Does it mark which claims are region-specific and require current local data?
- Does it define fallback behavior when local incentives, utility rates, production assumptions, or compliance requirements are unknown?
- Does it include localized sample prospects and sequences?

### Compliance, Privacy, And Ethics

- Does the research identify channel-specific consent and opt-out requirements for the target market?
- Does it define claim substantiation standards for savings, ROI, incentives, emissions, warranties, installation timelines, and production estimates?
- Does it define privacy handling for homeowner data, household context, behavioral tracking, and communication history?
- Does it define audit logs for AI-generated strategy, message drafts, user edits, approvals, and sent messages?
- Does it define human approval points for sensitive or high-risk communications?
- Does it explicitly block fake deadlines, fabricated social proof, unsupported comparisons, and repeated outreach after opt-out or disengagement?

### Data Model

- Does the research produce an implementation-ready data dictionary for homeowner, property, quote, financial, market, behavioral, installer, calendar, action, debrief, consent, sequence, message, experiment, and outcome entities?
- Does each field include type, source, required/optional status, sensitivity, freshness, and example values?
- Does it define derived metrics and their formulas or required source data?
- Does it map evidence items to recommendation rules and output explanations?
- Does it define missing-data handling and confidence degradation?
- Does it include example JSON records builders can use directly in the prototype?

## Phase 15: Suggested Research Agent Workstreams

### Agent 0: Reonic Public Ecosystem And Product Scope Lead

Responsibilities:

- Research Reonic's public website, customer stories, testimonials, product pages, public logos, partner pages, and related public signals.
- Identify public Reonic-connected installers where possible and inspect their websites for technology scope, customer segments, service regions, sales claims, reviews, and proof assets.
- Recommend the product scope the PoC should prioritize, such as PV, PV plus battery, heat pump, EV charger, or multi-technology household energy packages.
- Define which Reonic CRM, quote, calendar, proposal, communication, and installer workflow data should be mocked.
- Clearly separate verified public evidence from inference.

### Agent 1: Persona And Segmentation Lead

Responsibilities:

- Validate and expand homeowner personas with Germany-first evidence.
- Identify observable signals for persona inference.
- Create persona cards and persona confidence rules.

### Agent 2: Voice-Of-Customer Lead

Responsibilities:

- Analyze German installer reviews, public homeowner discussions, interviews, sales notes, and complaints.
- Extract customer language, emotions, recurring questions, and trust signals.
- Build the tagged feedback corpus.

### Agent 3: Objection And Sales Process Lead

Responsibilities:

- Build the objection library.
- Map objections to funnel stages, channels, proof assets, action types, scheduling needs, and escalation rules.
- Identify ghosting and close-readiness patterns.
- Capture debrief questions that reveal whether an objection is resolved, worse, or replaced by a new blocker.

### Agent 4: Germany Market And Regional Economics Lead

Responsibilities:

- Gather Germany-specific electricity, incentive, financing, cost, production, tariff, paperwork, and compliance context.
- Define which claims require current German local data before the assistant can use them.
- Create Germany-first regional market briefs and clearly labeled transferable notes from other markets.

### Agent 5: Persuasion Evidence Lead

Responsibilities:

- Review evidence for follow-up timing, personalization, risk reduction, social proof, urgency, and decision-friction reduction.
- Define ethical guardrails.
- Turn evidence into testable strategy hypotheses.

### Agent 6: Action, Calendar, And Debrief Lead

Responsibilities:

- Define next-best-action types across calls, emails, SMS, WhatsApp, videos, proposal revisions, visits, consultations, document requests, pauses, and escalations.
- Research when in-person visits or technical inspections are worth the time cost for small installers.
- Define calendar scheduling logic, capacity constraints, lead prioritization, action duration, travel assumptions, and debrief flows.
- Produce the action and debrief playbook.

### Agent 7: Product Synthesis Lead

Responsibilities:

- Convert research into product data fields, mock Reonic CRM records, strategy decision rules, UX requirements, and prototype content primitives.
- Maintain the evidence matrix.
- Flag unsupported claims and missing inputs.

### Recommended Output Paths

Later agents should save their work in a dedicated research directory. Suggested structure:

- `research/00_source_index.md`
- `research/01_reonic_public_ecosystem.md`
- `research/02_germany_market_context.md`
- `research/03_installer_sales_process.md`
- `research/04_personas.md`
- `research/05_voice_of_customer.md`
- `research/06_objection_library.md`
- `research/07_channel_timing_action_playbook.md`
- `research/08_persuasion_evidence.md`
- `research/09_case_study_database.md`
- `research/10_competitive_landscape.md`
- `research/11_data_dictionary.md`
- `research/12_strategy_rules.md`
- `research/13_mock_reonic_crm_dataset.md`
- `research/14_golden_prospect_set.md`
- `research/15_product_implications.md`
- `research/16_open_questions.md`

Each file should include citations, confidence ratings, region applicability, product implications, and explicit gaps.

### Suggested Agent Sequencing

Run the work in this order:

1. Source schema, source index, and research quality standards.
2. Reonic public ecosystem and product scope discovery.
3. Germany market and installer workflow context.
4. Voice-of-customer and objection mining.
5. Persona validation and segmentation.
6. Regional economics and compliance checks.
7. Persuasion methodology and ethical guardrails.
8. Channel, timing, action, calendar, and debrief synthesis.
9. Case study and competitive landscape synthesis.
10. Data model, mock CRM dataset, strategy rules, golden prospect set, and product implications.

This sequence prevents the team from designing the assistant around generic personas before understanding the quote-stage funnel and local market facts.

### Research Manager Responsibilities

One agent or human owner should maintain consistency across workstreams:

- Enforce source and confidence standards.
- Resolve conflicting terminology.
- Keep persona, objection, tactic, and data-field IDs stable.
- Make sure every finding maps to a product implication or is cut.
- Keep a running list of assumptions, risks, and decisions needed from stakeholders.
- Prevent duplicate research across agents.
- Red-team the final synthesis before PoC design starts.

## Product Translation Requirements

The final research package must be directly usable by builders. It should translate findings into:

- Persona classification rules with confidence thresholds and missing-data fallbacks.
- Objection-to-response mappings with proof assets and escalation rules.
- Ghosting-risk and close-readiness indicators tied to observable behavior.
- Channel and timing recommendations for each major persona and objection.
- Next-best-action recommendations that include messages, calls, visits, virtual consultations, proposal revisions, clarifying questions, pauses, and human escalations.
- Calendar and capacity logic for small installers, including action duration, travel time, urgency, lead priority, and scheduling constraints.
- Debrief prompts and strategy update rules after each completed action.
- Message tone controls, including what to say less of and what to avoid.
- Sequence templates with branching logic after reply, silence, objection, competitor mention, and proposal revisit.
- Installer-facing explanation snippets that justify recommendations in plain language.
- Customer-facing message primitives that are accurate, respectful, and localized.
- A/B test hypotheses with metrics and event tracking requirements.
- UX states for low confidence, compliance blocked, missing market facts, opt-out, human approval required, and no recommended follow-up.
- Guardrails for unsupported savings, ROI, incentive, environmental, financing, warranty, production, and urgency claims.

## PoC Readiness Gate

Do not move from research into PoC design until the team can answer these questions with evidence:

- Which Reonic-relevant installer and product scope should the PoC emphasize based on Reonic's public ecosystem and German market evidence?
- What are the top quote-stage homeowner personas in the primary market?
- Which objections most often delay or kill deals after quote delivery?
- Which objections require a human call instead of an automated message?
- Which proof assets are most persuasive by persona and objection?
- Which channels are appropriate by customer preference, urgency, complexity, and compliance status?
- Which situations justify an in-person visit, virtual consultation, proposal revision, or pause instead of another message?
- How should the assistant schedule recommended actions for a small installer with limited availability and many active leads?
- What debrief questions are needed after calls, visits, emails, and proposal revisions?
- How should recommendations change after positive, negative, neutral, or ambiguous debriefs?
- Which regional facts must be current before the assistant can mention savings, incentives, export rates, payback, installation timing, or urgency?
- Which signals indicate likely ghosting, close readiness, competitor risk, or household misalignment?
- Which recommendations can be implemented with current Reonic-like data, and which require future integrations or outcome tracking?
- What must the assistant refuse to claim or recommend?
- What will make a sales manager trust the recommendation rather than see it as generic AI copy?

## Key Research Risks

The research manager should actively watch for these failure modes:

- Over-indexing on generic solar adoption research instead of quote-stage closing behavior.
- Over-indexing on US-centric solar economics when the demo market is DACH or Europe.
- Treating installer testimonials as independent proof.
- Confusing installation complaints with buying objections.
- Mistaking review frequency for market frequency.
- Designing personas that cannot be inferred from available data.
- Creating strategy rules that rely on stale incentives or volatile pricing.
- Ignoring household decision dynamics.
- Recommending channels without consent or compliance checks.
- Optimizing for response rate while harming trust, opt-out rate, or close quality.
- Building a PoC that generates plausible copy but cannot explain why the strategy fits this customer.
- Building a PoC that ignores installer calendar pressure and recommends actions the installer cannot realistically execute.
- Treating in-person visits as always better than remote follow-up without accounting for lead value, travel time, urgency, and capacity.

## Final Approval Checklist

Before research is considered ready for PoC design, confirm that the team has:

- A sourced persona system with confidence levels.
- A sourced objection library.
- A tagged voice-of-customer corpus.
- Regional market assumptions and limits.
- A channel and timing playbook.
- A persuasion evidence brief with ethical constraints.
- A data dictionary for homeowner, quote, behavioral, and installer inputs.
- Predictive signal hypotheses tied to observable data.
- A/B testing hypotheses and metrics.
- Clear rules for when the assistant should recommend human follow-up.
- Clear rules for what the assistant must not claim.
- A traceable evidence matrix that product, design, and engineering can use.
- A Reonic public ecosystem brief that justifies the mocked product and installer scope.
- A mock Reonic CRM dataset for Germany.
- An action, calendar, and debrief playbook for the assistant loop.

## Review Questions For Later Research Agents

Use these questions to critique the research before synthesis:

- Are we grounding this in homeowners' actual words and actions, or in installer assumptions?
- Are we overfitting to the loudest customer complaints?
- Are we confusing solar adoption motivation with quote-stage close motivation?
- Are we treating ROI as universal when some buyers need reassurance or trust first?
- Are we treating environmental motivation as universal when many buyers are bill-driven?
- Are we recommending channels based on evidence or convenience?
- Are we making regional claims without regional data?
- Are we giving the installer a useful reason for each recommendation?
- Are we giving the homeowner a respectful, accurate, low-pressure message?
- Can this insight be tested in the product?
