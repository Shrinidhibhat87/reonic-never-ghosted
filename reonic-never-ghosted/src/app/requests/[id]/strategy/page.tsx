"use client";

import React from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TaskComponent } from "@/ui/components/TaskComponent";
import { TextArea } from "@/ui/components/TextArea";
import { TextField } from "@/ui/components/TextField";
import { FeatherActivity } from "@subframe/core";
import { FeatherArrowUpRight } from "@subframe/core";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherCalendar } from "@subframe/core";
import { FeatherCalendarClock } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherChevronsUpDown } from "@subframe/core";
import { FeatherChevronUp } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherClock } from "@subframe/core";
import { FeatherContact } from "@subframe/core";
import { FeatherCreditCard } from "@subframe/core";
import { FeatherDatabase } from "@subframe/core";
import { FeatherDot } from "@subframe/core";
import { FeatherFileSearch } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherHardHat } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherLayoutDashboard } from "@subframe/core";
import { FeatherLeaf } from "@subframe/core";
import { FeatherMail } from "@subframe/core";
import { FeatherMousePointerClick } from "@subframe/core";
import { FeatherPhone } from "@subframe/core";
import { FeatherPiggyBank } from "@subframe/core";
import { FeatherRoute } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSend } from "@subframe/core";
import { FeatherShieldCheck } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherTrendingUp } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherWallet } from "@subframe/core";
import { FeatherWand } from "@subframe/core";
import { FeatherWrench } from "@subframe/core";
import { useRouter } from "next/navigation";

export default function StrategyPage() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <div className="flex w-60 flex-none flex-col items-start self-stretch border-r border-solid border-neutral-border bg-default-background mobile:hidden">
        <div className="flex w-full items-center gap-2 px-4 py-4">
          <Avatar className="bg-success-600" size="small" image="">
            TT
          </Avatar>
          <div className="flex grow shrink-0 basis-0 flex-col items-start">
            <span className="text-body-bold font-body-bold text-default-font">
              Theo Tiral
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Onboarding Demo Kunde
            </span>
          </div>
          <FeatherChevronsUpDown className="text-body font-body text-subtext-color" />
        </div>
        <div className="flex w-full flex-col items-start gap-2 px-3 pb-2">
          <TextField
            className="h-auto w-full flex-none"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search"
              value=""
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
            />
          </TextField>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 px-3 py-2 overflow-auto">
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherLayoutDashboard className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Dashboard
            </span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherContact className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Contacts
            </span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherClipboardList className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">Tasks</span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md bg-brand-50 px-3 py-2">
            <FeatherInbox className="text-body font-body text-brand-700" />
            <span className="text-body-bold font-body-bold text-brand-700">
              Requests
            </span>
          </div>
          <div className="flex w-full flex-col items-start pl-9">
            <span className="w-full text-body font-body text-subtext-color flex py-1.5">
              Residential
            </span>
            <span className="w-full text-body font-body text-subtext-color flex py-1.5">
              Commercial
            </span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherFileText className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Offers
            </span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherHardHat className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Installations
            </span>
          </div>
          <div className="flex w-full items-center gap-2 rounded-md px-3 py-2">
            <FeatherWrench className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Services
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-neutral-border px-5 py-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-caption-bold font-caption-bold text-subtext-color">
              AGENDA
            </span>
            <div className="flex items-center gap-1">
              <span className="text-caption font-caption text-subtext-color">
                Open
              </span>
              <FeatherArrowUpRight className="text-caption font-caption text-subtext-color" />
            </div>
          </div>
          <span className="text-caption font-caption text-subtext-color">
            All done for today.
          </span>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-auto">
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-8 py-4 mobile:px-4">
          <div className="flex grow shrink-0 basis-0 items-center gap-2">
            <span
              className="text-body font-body text-subtext-color cursor-pointer hover:text-default-font"
              onClick={() => router.push("/quotes")}
            >
              Requests
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span
              className="text-body font-body text-subtext-color cursor-pointer hover:text-default-font"
              onClick={() => router.push("/requests/sabine-muller")}
            >
              Sabine Müller
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-heading-3 font-heading-3 text-default-font">
              Closing Strategy
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-6 px-8 py-8 mobile:px-4 mobile:py-6">
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full items-center gap-3">
              <Avatar
                className="bg-brand-100 text-brand-700"
                size="small"
                image=""
              >
                SM
              </Avatar>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Sabine Müller
                  </span>
                  <Badge variant="warning">Hot lead</Badge>
                </div>
                <span className="text-caption font-caption text-subtext-color">
                  Sonnenberg 7, 21218 Seevetal · €38,400 · Heat pump + Solar 9.6
                  kWp
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-3 border-t border-solid border-neutral-border pt-4">
              <span className="text-caption-bold font-caption-bold text-subtext-color">
                BUYER PROFILE
              </span>
              <div className="flex w-full items-start gap-3">
                <FeatherLeaf className="text-body font-body text-success-600 mt-0.5" />
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Environmentalist
                    </span>
                    <Badge variant="success">Strong</Badge>
                  </div>
                  <span className="text-caption font-caption text-subtext-color">
                    Quoted heat pump + solar and asked about CO₂ reduction —
                    sustainability is a primary driver.
                  </span>
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                      <span className="text-caption font-caption text-default-font">
                        Asked about CO₂ reduction on the call
                      </span>
                      <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                        <FeatherPhone className="text-caption font-caption text-subtext-color" />
                        <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                          Call notes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                      <span className="text-caption font-caption text-default-font">
                        Requested max-coverage solar config
                      </span>
                      <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                        <FeatherFileText className="text-caption font-caption text-subtext-color" />
                        <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                          Intake form
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full items-start gap-3">
                <FeatherPiggyBank className="text-body font-body text-brand-600 mt-0.5" />
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Value-conscious
                    </span>
                    <Badge variant="warning">Moderate</Badge>
                  </div>
                  <span className="text-caption font-caption text-subtext-color">
                    Requested a competitor comparison and flagged &quot;monthly
                    payment&quot; — lead with payback over price.
                  </span>
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                      <span className="text-caption font-caption text-default-font">
                        Flagged &quot;monthly payment&quot; concern
                      </span>
                      <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                        <FeatherPhone className="text-caption font-caption text-subtext-color" />
                        <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                          Call notes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                      <span className="text-caption font-caption text-default-font">
                        Requested competitor comparison
                      </span>
                      <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                        <FeatherFileSearch className="text-caption font-caption text-subtext-color" />
                        <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                          Competitor intel
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full items-center gap-2">
              <FeatherRoute className="text-heading-3 font-heading-3 text-brand-600" />
              <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
                The play
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-2 border-b border-solid border-neutral-border pb-5">
              <span className="w-full text-heading-3 font-heading-3 text-default-font">
                Win Sabine by leading with climate impact, then dissolving the
                price objection before she shops competitors.
              </span>
              <span className="w-full text-body font-body text-subtext-color">
                Sabine is an environmentally-driven buyer who is also watching
                cost closely and actively comparing installers. The play stacks
                an early trust-builder, a financing move to remove the
                upfront-cost objection, and an ROI reframe — sequenced to close
                before she commits elsewhere.
              </span>
            </div>
            <TaskComponent
              stepNumber="1"
              category="BUILD TRUST"
              title="Call Sabine within 24 hours"
              collapseButton={
                <IconButton
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherChevronUp />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              }
              suggestion={
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-default-background px-4 py-3">
                  <div className="flex w-full items-center gap-2">
                    <FeatherSparkles className="text-body font-body text-brand-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-brand-700">
                      Suggested call script
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Thank Sabine for the time on site and open warmly.
                      </span>
                    </div>
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Tie the system to her goal of cutting her CO₂ footprint.
                      </span>
                    </div>
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Offer to walk through payment options and propose two
                        times.
                      </span>
                    </div>
                  </div>
                </div>
              }
              reasonTags={
                <>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherMousePointerClick className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      Opened quote email 4× in 48h
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherActivity className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Activity log
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherClock className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      Leads called &lt;24h close 2.3× more
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherBarChart2 className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Benchmark
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherUsers className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      14 similar past deals won this way
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherDatabase className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Deal history
                      </span>
                    </div>
                  </div>
                </>
              }
              whyThisLabel="Why this"
              highlight={
                <div className="flex w-full flex-wrap items-center gap-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-brand-100">
                    <FeatherCalendarClock className="text-heading-3 font-heading-3 text-brand-700" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-caption-bold font-caption-bold text-brand-700">
                      Suggested time
                    </span>
                    <span className="w-full text-body-bold font-body-bold text-default-font">
                      Tomorrow, Tue Jun 18
                    </span>
                    <span className="w-full text-body font-body text-subtext-color">
                      9:30 AM
                    </span>
                  </div>
                </div>
              }
              actions={
                <div className="flex w-full flex-wrap items-center gap-2">
                  <Button
                    variant="brand-primary"
                    icon={<FeatherPhone />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Call now
                  </Button>
                  <Button
                    variant="neutral-secondary"
                    icon={<FeatherCalendar />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Schedule call
                  </Button>
                </div>
              }
            />
            <TaskComponent
              stepNumber="2"
              category="CREATE URGENCY"
              title="Offer 0% financing for 12 months"
              headerIcon={<FeatherPiggyBank />}
              collapseButton={
                <IconButton
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherChevronUp />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              }
              suggestion={
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-default-background px-4 py-3">
                  <div className="flex w-full items-center gap-2">
                    <FeatherSparkles className="text-body font-body text-brand-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-brand-700">
                      How to position the offer
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Frame the 0% plan as removing the upfront cost barrier
                        entirely.
                      </span>
                    </div>
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Translate the quote into a fixed €320/month she can
                        budget around.
                      </span>
                    </div>
                    <div className="flex w-full items-start gap-2">
                      <FeatherDot className="text-body font-body text-brand-600" />
                      <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                        Note the offer is time-limited to nudge a decision
                        before she shops competitors.
                      </span>
                    </div>
                  </div>
                </div>
              }
              reasonTags={
                <>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherCreditCard className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      Flagged &quot;monthly payment&quot; concern
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherPhone className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Call notes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherTrendingUp className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      0% offers lift close rate by 31%
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherBarChart2 className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Benchmark
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-solid border-neutral-border bg-default-background px-3 py-1 hover:bg-neutral-50">
                    <FeatherFileSearch className="text-caption font-caption text-brand-600" />
                    <span className="text-caption font-caption text-default-font">
                      Comparing 2 other installers
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-solid border-neutral-border pl-2 ml-1">
                      <FeatherDatabase className="text-caption font-caption text-subtext-color" />
                      <span className="whitespace-nowrap text-caption-bold font-caption-bold text-subtext-color">
                        Competitor intel
                      </span>
                    </div>
                  </div>
                </>
              }
              whyThisLabel="Why this"
              highlight={
                <div className="flex w-full flex-wrap items-center gap-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-brand-100">
                    <FeatherWallet className="text-heading-3 font-heading-3 text-brand-700" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-caption-bold font-caption-bold text-brand-700">
                      Offer details
                    </span>
                    <span className="w-full text-body-bold font-body-bold text-default-font">
                      0% APR · 12 months · €320/mo
                    </span>
                    <span className="w-full text-body font-body text-subtext-color">
                      Valid through Fri Jun 28
                    </span>
                  </div>
                </div>
              }
              actions={
                <div className="flex w-full flex-wrap items-center gap-2">
                  <Button
                    variant="brand-primary"
                    icon={<FeatherSend />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Send offer
                  </Button>
                  <Button
                    variant="neutral-secondary"
                    icon={<FeatherMail />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Draft email
                  </Button>
                </div>
              }
            />
            <div className="flex w-full items-start gap-4">
              <div className="flex w-8 flex-none flex-col items-center self-stretch">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-solid border-brand-200 bg-default-background">
                  <span className="text-body-bold font-body-bold text-brand-600">
                    3
                  </span>
                </div>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-wrap items-center gap-4">
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                  <span className="text-heading-3 font-heading-3 text-subtext-color">
                    Reframe value
                  </span>
                  <span className="text-body font-body text-subtext-color">
                    Emphasize 18-month payback vs. competitor
                  </span>
                </div>
                <IconButton
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherChevronDown />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-solid border-neutral-border bg-neutral-50 px-6 py-5">
            <div className="flex flex-col items-start gap-1">
              <span className="text-body-bold font-body-bold text-default-font">
                Revise this strategy
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Describe what&#39;s off in plain language. Your input is checked
                against this deal&#39;s data before any step is changed.
              </span>
            </div>
            <TextArea className="h-auto w-full flex-none" label="" helpText="">
              <TextArea.Input
                className="h-24 w-full flex-none"
                placeholder="e.g. Sabine already arranged her own financing — drop the financing step and prioritize the payback comparison."
                value=""
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {}}
              />
            </TextArea>
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <FeatherShieldCheck className="text-caption font-caption text-subtext-color" />
                <span className="text-caption font-caption text-subtext-color">
                  Reviewed before applying — unsupported requests are flagged,
                  not auto-applied.
                </span>
              </div>
              <Button
                icon={<FeatherWand />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Review &amp; update plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
