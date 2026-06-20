"use client";

import React from "react";
import { Alert } from "@/ui/components/Alert";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { FeatherAlertTriangle } from "@subframe/core";
import { FeatherArrowUpRight } from "@subframe/core";
import { FeatherCheck } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherChevronsUpDown } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherContact } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherFolder } from "@subframe/core";
import { FeatherHardHat } from "@subframe/core";
import { FeatherImage } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherLayoutDashboard } from "@subframe/core";
import { FeatherMic } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherPaperclip } from "@subframe/core";
import { FeatherPlay } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherStickyNote } from "@subframe/core";
import { FeatherUploadCloud } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherWand } from "@subframe/core";
import { FeatherWrench } from "@subframe/core";
import { FeatherZap } from "@subframe/core";
import { useRouter } from "next/navigation";

export default function LeadMasterDataPage() {
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
            <span className="text-body font-body text-subtext-color">
              Sabine Müller
            </span>
            <FeatherChevronRight className="text-body font-body text-subtext-color" />
            <span className="text-heading-3 font-heading-3 text-default-font">
              Master Data
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-6 px-8 py-8 mobile:px-4 mobile:py-6">
          <Alert
            variant="warning"
            icon={<FeatherAlertTriangle />}
            title="Master data has changed"
            description="The closing strategy was generated before your latest edits and may be out of date."
            actions={
              <div className="flex items-center gap-2 mobile:grow mobile:shrink-0 mobile:basis-0 mobile:flex-col">
                <Button
                  icon={<FeatherWand />}
                  onClick={() => router.push("/requests/sabine-muller/strategy")}
                >
                  Regenerate strategy
                </Button>
              </div>
            }
          />
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherUser className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Prospect information
                </span>
              </div>
              <Button
                variant="neutral-secondary"
                size="small"
                icon={<FeatherEdit2 />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Edit
              </Button>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">
                Used to personalize the closing strategy
              </span>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4 border-t border-solid border-neutral-border pt-4">
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="Name"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="Sabine Müller"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="Email"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="sabine.mueller@email.de"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4">
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="Address"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="Sonnenberg 7, 21218 Seevetal"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="Phone"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="+49 4105 998231"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
            </div>
            <div className="flex w-full flex-wrap items-start gap-4">
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="System"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="Heat pump + Solar 9.6 kWp"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
              <TextField
                className="h-auto min-w-[240px] grow shrink-0 basis-0"
                label="Quote value"
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value="€38,400"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherClipboardList className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Installer notes
                </span>
                <Badge variant="neutral">2</Badge>
              </div>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">
                Insights here shape the recommended plays
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4">
              <div className="flex w-full flex-wrap items-center gap-3">
                <IconButton
                  variant="brand-primary"
                  icon={<FeatherPlay />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
                <div className="flex grow shrink-0 basis-0 items-center gap-0.5">
                  <div className="flex h-3 w-0.5 flex-none items-start rounded-full bg-brand-300" />
                  <div className="flex h-5 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-8 w-0.5 flex-none items-start rounded-full bg-brand-600" />
                  <div className="flex h-4 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-6 w-0.5 flex-none items-start rounded-full bg-brand-500" />
                  <div className="flex h-3 w-0.5 flex-none items-start rounded-full bg-brand-300" />
                  <div className="flex h-7 w-0.5 flex-none items-start rounded-full bg-brand-600" />
                  <div className="flex h-5 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-2 w-0.5 flex-none items-start rounded-full bg-brand-300" />
                  <div className="flex h-6 w-0.5 flex-none items-start rounded-full bg-brand-500" />
                  <div className="flex h-4 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-8 w-0.5 flex-none items-start rounded-full bg-brand-600" />
                  <div className="flex h-3 w-0.5 flex-none items-start rounded-full bg-brand-300" />
                  <div className="flex h-5 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-7 w-0.5 flex-none items-start rounded-full bg-brand-500" />
                  <div className="flex h-4 w-0.5 flex-none items-start rounded-full bg-brand-400" />
                  <div className="flex h-2 w-0.5 flex-none items-start rounded-full bg-brand-300" />
                  <div className="flex h-6 w-0.5 flex-none items-start rounded-full bg-brand-500" />
                </div>
                <span className="text-caption font-caption text-subtext-color">
                  1:24
                </span>
              </div>
              <div className="flex w-full flex-col items-start gap-2 rounded-md bg-neutral-50 px-4 py-3">
                <div className="flex w-full items-center gap-2">
                  <FeatherFileText className="text-caption font-caption text-subtext-color" />
                  <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-subtext-color">
                    Transcription
                  </span>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Transcribed
                  </Badge>
                </div>
                <span className="w-full text-caption font-caption text-default-font">
                  Sabine seemed really set on the environmental side — kept
                  asking how much CO₂ she&#39;d actually cut. She also mentioned
                  twice that she&#39;s comparing us with another installer and
                  is watching the monthly cost closely. Roof faces south-west,
                  no shading, so the 9.6 kWp config should perform well.
                </span>
              </div>
              <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                <Avatar className="bg-warning-600" size="x-small" image="">
                  JK
                </Avatar>
                <span className="grow shrink-0 basis-0 text-caption font-caption text-subtext-color">
                  Jonas Krüger · Installer
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Today, 9:14 am
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4">
              <div className="flex w-full items-center gap-2">
                <FeatherStickyNote className="text-body font-body text-subtext-color" />
                <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                  Site visit notes
                </span>
                <IconButton
                  size="small"
                  icon={<FeatherMoreHorizontal />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
              <span className="w-full text-body font-body text-default-font">
                Existing oil heating is 18 years old and due for replacement —
                strong urgency. Meter cabinet has room for the inverter.
                Customer asked about hold-time on the quote; said she&#39;d
                decide within two weeks.
              </span>
              <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                <Avatar className="bg-brand-600" size="x-small" image="">
                  JK
                </Avatar>
                <span className="grow shrink-0 basis-0 text-caption font-caption text-subtext-color">
                  Jonas Krüger · Installer
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Yesterday, 4:32 pm
                </span>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
              <Button
                variant="neutral-secondary"
                icon={<FeatherPlus />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Add note
              </Button>
              <Button
                variant="neutral-tertiary"
                icon={<FeatherMic />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Record voice
              </Button>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex grow shrink-0 basis-0 items-center gap-2">
                <FeatherFolder className="text-heading-3 font-heading-3 text-brand-600" />
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Files
                </span>
                <Badge variant="neutral">3</Badge>
              </div>
            </div>
            <div className="flex w-full items-center gap-1">
              <FeatherZap className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-subtext-color">
                Documents are parsed for context in the strategy
              </span>
            </div>
            <div className="flex w-full flex-col items-start border-t border-solid border-neutral-border pt-2">
              <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50">
                <FeatherFileText className="text-heading-3 font-heading-3 text-error-600" />
                <div className="flex grow shrink-0 basis-0 flex-col items-start">
                  <span className="line-clamp-1 text-body-bold font-body-bold text-default-font">
                    Intake form.pdf
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    PDF · 248 KB · Uploaded today
                  </span>
                </div>
                <IconButton
                  size="small"
                  icon={<FeatherDownload />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
              <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50">
                <FeatherFileText className="text-heading-3 font-heading-3 text-error-600" />
                <div className="flex grow shrink-0 basis-0 flex-col items-start">
                  <span className="line-clamp-1 text-body-bold font-body-bold text-default-font">
                    Energy bill 2024.pdf
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    PDF · 612 KB · Uploaded yesterday
                  </span>
                </div>
                <IconButton
                  size="small"
                  icon={<FeatherDownload />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
              <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50">
                <FeatherImage className="text-heading-3 font-heading-3 text-success-600" />
                <div className="flex grow shrink-0 basis-0 flex-col items-start">
                  <span className="line-clamp-1 text-body-bold font-body-bold text-default-font">
                    Roof site photo.jpg
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    JPG · 3.1 MB · Uploaded yesterday
                  </span>
                </div>
                <IconButton
                  size="small"
                  icon={<FeatherDownload />}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </div>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-border bg-neutral-50 px-6 py-8">
              <FeatherUploadCloud className="text-heading-2 font-heading-2 text-neutral-400" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-body-bold font-body-bold text-default-font">
                  Drop files to upload
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  PDF, images, or spreadsheets up to 25 MB
                </span>
              </div>
              <Button
                variant="neutral-secondary"
                size="small"
                icon={<FeatherPaperclip />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Browse files
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
