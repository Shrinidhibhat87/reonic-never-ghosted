"use client";

import React from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherCalendar } from "@subframe/core";
import { FeatherCheckCircle } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronLeft } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherChevronsUpDown } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherClock } from "@subframe/core";
import { FeatherContact } from "@subframe/core";
import { FeatherExternalLink } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { FeatherGitBranchPlus } from "@subframe/core";
import { FeatherGrid } from "@subframe/core";
import { FeatherHardHat } from "@subframe/core";
import { FeatherHelpCircle } from "@subframe/core";
import { FeatherHome } from "@subframe/core";
import { FeatherLayoutDashboard } from "@subframe/core";
import { FeatherMessageSquare } from "@subframe/core";
import { FeatherPin } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherRefreshCw } from "@subframe/core";
import { FeatherRocket } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherSettings2 } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherWrench } from "@subframe/core";

export default function CalendarPage() {
  return (
    <div className="flex h-full w-full items-start bg-default-background">
      <div className="flex w-60 flex-none flex-col items-start self-stretch border-r border-solid border-neutral-border bg-default-background mobile:hidden">
        <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-3">
          <img
            className="h-5 flex-none object-contain"
            src="https://res.cloudinary.com/subframe/image/upload/v1711417518/shared/fdb8rlpzh1gds6vzsnt0.svg"
          />
          <span className="text-body-bold font-body-bold text-default-font">
            Reonic
          </span>
        </div>
        <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-3">
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
        <div className="flex w-full flex-col items-start gap-2 px-3 py-3">
          <TextField
            className="h-auto w-full flex-none"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Suche"
              value=""
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
            />
          </TextField>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 px-3 py-1 overflow-auto">
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherHome className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">Home</span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherLayoutDashboard className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Dashboard
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherContact className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Kontakte
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherClipboardList className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Aufgaben
            </span>
          </div>
          <div className="flex h-2 w-full flex-none flex-col items-start" />
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherMessageSquare className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Anfragen
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherUsers className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Angebote
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherHardHat className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Installationen
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherWrench className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Services
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherFileText className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Rechnungen
            </span>
          </div>
          <div className="flex w-full flex-col items-start gap-2 px-3 pt-6 pb-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-caption-bold font-caption-bold text-subtext-color">
                AGENDA
              </span>
              <FeatherSettings className="text-caption font-caption text-subtext-color" />
            </div>
            <div className="flex items-center gap-2">
              <FeatherCalendar className="text-caption font-caption text-subtext-color" />
              <span className="text-caption font-caption text-subtext-color">
                Alles erledigt für heute.
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start border-t border-solid border-neutral-border px-3 py-3">
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherGitBranchPlus className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Komponenten
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherSettings className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Einstellungen
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherRocket className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Updates
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md border-t border-solid border-neutral-border px-3 pt-3 pb-1 mt-1">
            <FeatherHelpCircle className="text-body font-body text-subtext-color" />
            <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
              Hilfe
            </span>
            <FeatherExternalLink className="text-caption font-caption text-subtext-color" />
            <FeatherPin className="text-caption font-caption text-subtext-color" />
          </div>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-hidden">
        <div className="flex w-full flex-wrap items-center gap-3 border-b border-solid border-neutral-border px-4 py-3">
          <Button
            variant="neutral-secondary"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            Heute
          </Button>
          <div className="flex items-center gap-1">
            <IconButton
              variant="neutral-secondary"
              icon={<FeatherChevronLeft />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
            <IconButton
              variant="neutral-secondary"
              icon={<FeatherChevronRight />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
          </div>
          <span className="text-heading-3 font-heading-3 text-default-font">
            29. Dezember - 04. Januar 2026
          </span>
          <div className="flex grow shrink-0 basis-0 items-center justify-end gap-2">
            <Button
              variant="neutral-secondary"
              icon={<FeatherPlus />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Neuer Termin
            </Button>
            <IconButton
              variant="neutral-tertiary"
              icon={<FeatherRefreshCw />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
            <IconButton
              variant="neutral-tertiary"
              icon={<FeatherSettings2 />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
            <IconButton
              variant="neutral-tertiary"
              icon={<FeatherSettings />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-4 py-2">
          <div className="flex items-center gap-1">
            <FeatherFilter className="text-caption font-caption text-subtext-color" />
            <span className="text-caption font-caption text-default-font">
              8 Kalender
            </span>
          </div>
          <span className="text-caption font-caption text-brand-600">
            Aufgaben, Persönlicher Kalender und 1 weiterer
          </span>
          <div className="flex grow shrink-0 basis-0 items-center gap-2">
            <FeatherBarChart2 className="text-caption font-caption text-subtext-color" />
            <span className="text-caption font-caption text-default-font">
              Planungsmodus
            </span>
            <span className="text-caption font-caption text-subtext-color">
              |
            </span>
            <span className="text-caption font-caption text-brand-600">
              Ein
            </span>
          </div>
          <div className="flex items-center overflow-hidden rounded-md border border-solid border-neutral-border">
            <div className="flex items-center justify-center border-r border-solid border-neutral-border px-4 py-1.5 hover:bg-neutral-50">
              <span className="text-caption font-caption text-default-font">
                Monat
              </span>
            </div>
            <div className="flex items-center justify-center border-r border-solid border-neutral-border bg-brand-50 px-4 py-1.5">
              <span className="text-caption-bold font-caption-bold text-brand-700">
                Woche
              </span>
            </div>
            <div className="flex items-center justify-center border-r border-solid border-neutral-border px-4 py-1.5 hover:bg-neutral-50">
              <span className="text-caption font-caption text-default-font">
                Tag
              </span>
            </div>
            <div className="flex items-center justify-center px-4 py-1.5 hover:bg-neutral-50">
              <span className="text-caption font-caption text-default-font">
                Agenda
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start overflow-auto">
          <div className="flex flex-col items-start min-w-[1100px] self-stretch">
            <div className="flex w-full border-b border-solid border-neutral-border items-stretch">
              <div className="flex w-48 flex-none items-center px-4 py-3">
                <span className="text-body-bold font-body-bold text-default-font">
                  Kalender
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 self-stretch border-l-2 border-solid border-brand-100 bg-brand-50 items-stretch">
                <div className="flex grow shrink-0 basis-0 flex-col items-start">
                  <div className="flex w-full items-center px-4 pt-3 pb-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Mo, 29. Dez.
                    </span>
                  </div>
                  <div className="flex w-full items-center">
                    <div className="flex grow shrink-0 basis-0 items-center justify-center border-r border-solid border-neutral-border py-1.5">
                      <span className="text-caption font-caption text-subtext-color">6</span>
                    </div>
                    <div className="flex grow shrink-0 basis-0 items-center justify-center border-r border-solid border-neutral-border py-1.5">
                      <span className="text-caption font-caption text-subtext-color">9</span>
                    </div>
                    <div className="flex grow shrink-0 basis-0 items-center justify-center border-r border-solid border-neutral-border py-1.5">
                      <span className="text-caption font-caption text-subtext-color">12</span>
                    </div>
                    <div className="flex grow shrink-0 basis-0 items-center justify-center border-r border-solid border-neutral-border py-1.5">
                      <span className="text-caption font-caption text-subtext-color">15</span>
                    </div>
                  </div>
                </div>
              </div>
              {["Di, 30. Dez.", "Mi, 31. Dez.", "Do, 1. Jan.", "Fr, 2. Jan."].map((day) => (
                <div key={day} className="flex grow shrink-0 basis-0 flex-col items-start">
                  <div className="flex w-full items-center px-4 pt-3 pb-1">
                    <span className="text-body-bold font-body-bold text-default-font">{day}</span>
                  </div>
                  <div className="flex w-full items-center">
                    {[6, 9, 12, 15].map((hour) => (
                      <div key={hour} className="flex grow shrink-0 basis-0 items-center justify-center border-r border-solid border-neutral-border py-1.5">
                        <span className="text-caption font-caption text-subtext-color">{hour}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border bg-neutral-50 px-4 py-2">
              <FeatherChevronDown className="text-body font-body text-subtext-color" />
              <span className="text-body-bold font-body-bold text-default-font">
                Aufgaben
              </span>
            </div>
            <div className="flex w-full border-b border-solid border-neutral-border items-stretch">
              <div className="flex w-48 flex-none items-center gap-2 px-4 py-4">
                <FeatherCheckCircle className="text-body font-body text-success-600" />
                <span className="text-body font-body text-default-font">
                  Aufgaben
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 self-stretch border-l-2 border-solid border-brand-100 bg-brand-50 items-stretch">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
              </div>
              {[0, 1, 2].map((day) => (
                <div key={day} className="flex grow shrink-0 basis-0 items-stretch">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                  ))}
                </div>
              ))}
              <div className="flex grow shrink-0 basis-0 items-stretch">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
                <div className="flex grow shrink-0 basis-0 items-center self-stretch border-r border-solid border-neutral-border px-0.5 py-2">
                  <div className="flex grow shrink-0 basis-0 items-center gap-1 rounded-sm border-l-2 border-solid border-warning-600 bg-warning-100 px-1.5 py-1">
                    <FeatherClock className="text-caption font-caption text-warning-700" />
                    <span className="line-clamp-1 text-caption font-caption text-warning-800">
                      Bitte
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex grow shrink-0 basis-0 items-stretch">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
                <div className="flex grow shrink-0 basis-0 items-start self-stretch" />
              </div>
            </div>
            <div className="flex w-full border-b border-solid border-neutral-border items-stretch">
              <div className="flex w-48 flex-none items-center gap-2 px-4 py-4">
                <div className="flex h-4 w-4 flex-none flex-col items-center justify-center rounded-sm bg-[#0078d4]">
                  <FeatherGrid className="text-caption font-caption text-white" />
                </div>
                <span className="text-body font-body text-default-font">
                  Persönlicher Kalender
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 self-stretch border-l-2 border-solid border-brand-100 bg-brand-50 items-stretch">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
              </div>
              {[0, 1, 2, 3].map((day) => (
                <div key={day} className="flex grow shrink-0 basis-0 items-stretch">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                  ))}
                  <div className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                </div>
              ))}
              <div className="flex grow shrink-0 basis-0 items-stretch">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
                <div className="flex grow shrink-0 basis-0 items-start self-stretch" />
              </div>
            </div>
            <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border bg-neutral-50 px-4 py-2">
              <FeatherChevronDown className="text-body font-body text-subtext-color" />
              <span className="text-body-bold font-body-bold text-default-font">
                Benutzer-Kalender
              </span>
            </div>
            <div className="flex w-full border-b border-solid border-neutral-border items-stretch">
              <div className="flex w-48 flex-none items-center gap-2 px-4 py-4">
                <Avatar className="bg-success-600" size="x-small" image="">
                  TT
                </Avatar>
                <span className="text-body font-body text-default-font">
                  Theo Tiral
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 self-stretch border-l-2 border-solid border-brand-100 bg-brand-50 items-stretch">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
              </div>
              {[0, 1, 2, 3].map((day) => (
                <div key={day} className="flex grow shrink-0 basis-0 items-stretch">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                  ))}
                </div>
              ))}
              <div className="flex grow shrink-0 basis-0 items-stretch">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch border-r border-solid border-neutral-border" />
                ))}
                <div className="flex grow shrink-0 basis-0 items-start self-stretch" />
              </div>
            </div>
            <div className="flex w-full grow shrink-0 basis-0 items-stretch">
              <div className="flex w-48 flex-none items-start self-stretch" />
              <div className="flex grow shrink-0 basis-0 items-start self-stretch border-l-2 border-solid border-brand-100 bg-brand-50" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex grow shrink-0 basis-0 items-start self-stretch" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
