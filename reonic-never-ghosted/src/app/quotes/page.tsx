"use client";

import React from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherArchive } from "@subframe/core";
import { FeatherCalendar } from "@subframe/core";
import { FeatherCheck } from "@subframe/core";
import { FeatherChevronsUpDown } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherClock } from "@subframe/core";
import { FeatherContact } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { FeatherHardHat } from "@subframe/core";
import { FeatherHelpCircle } from "@subframe/core";
import { FeatherHome } from "@subframe/core";
import { FeatherLayoutDashboard } from "@subframe/core";
import { FeatherMessageSquare } from "@subframe/core";
import { FeatherMoreVertical } from "@subframe/core";
import { FeatherPenTool } from "@subframe/core";
import { FeatherPhone } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherReceipt } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { FeatherWand2 } from "@subframe/core";
import { FeatherWrench } from "@subframe/core";
import { useRouter } from "next/navigation";

export default function QuotesPage() {
  const router = useRouter();

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
              placeholder="Search"
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
              Contacts
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherClipboardList className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">Tasks</span>
          </div>
          <div className="flex h-2 w-full flex-none flex-col items-start" />
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherMessageSquare className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Requests
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md bg-brand-50 px-3 py-2">
            <FeatherFileText className="text-body font-body text-brand-700" />
            <span className="text-body-bold font-body-bold text-brand-700">
              Quotes
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherHardHat className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Installations
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherWrench className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Services
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherReceipt className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Invoices
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start border-t border-solid border-neutral-border px-3 py-3">
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherSettings className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">
              Settings
            </span>
          </div>
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2">
            <FeatherHelpCircle className="text-body font-body text-subtext-color" />
            <span className="text-body font-body text-default-font">Help</span>
          </div>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-hidden">
        <div className="flex w-full flex-wrap items-center gap-3 border-b border-solid border-neutral-border px-6 py-4 mobile:px-4">
          <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
            Quotes
          </span>
          <Button
            icon={<FeatherPlus />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            Create quote
          </Button>
          <ToggleGroup value="kanban" onValueChange={(value: string) => {}}>
            <ToggleGroup.Item icon={null} value="25013662">
              List
            </ToggleGroup.Item>
            <ToggleGroup.Item icon={null} value="274ac0b3">
              Kanban
            </ToggleGroup.Item>
          </ToggleGroup>
        </div>
        <div className="flex w-full flex-wrap items-center gap-4 border-b border-solid border-neutral-border px-6 py-3 mobile:px-4">
          <TextField
            className="h-auto grow shrink-0 basis-0"
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
          <Button
            variant="neutral-tertiary"
            icon={<FeatherFilter />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            User
          </Button>
          <Button
            variant="neutral-tertiary"
            icon={<FeatherArchive />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          >
            Show archived
          </Button>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4 bg-neutral-50 px-6 py-6 overflow-auto mobile:px-4">
          <div className="flex w-80 flex-none flex-col items-start self-stretch rounded-md border border-solid border-neutral-border bg-neutral-50">
            <div className="flex w-full items-center gap-2 px-4 py-3">
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                Waiting for response
              </span>
              <Badge variant="error">8×</Badge>
            </div>
            <div className="flex w-full flex-col items-start gap-3 px-3 pb-4 overflow-auto">
              <div
                className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push("/requests/sabine-muller")}
              >
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Intersolar Demo
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); }}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); }}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Inter Solar · manuel.schneider@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Ungarnstraße 7, 52070 Aachen
                  </span>
                </div>
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-brand-50 px-3 py-2">
                  <div className="flex w-full items-center gap-2">
                    <FeatherSparkles className="text-caption font-caption text-brand-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-brand-700">
                      Next: Generate strategy
                    </span>
                  </div>
                  <Button
                    variant="brand-secondary"
                    size="small"
                    icon={<FeatherWand2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); router.push("/requests/sabine-muller/strategy"); }}
                  >
                    Generate strategy
                  </Button>
                </div>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <Avatar
                    size="x-small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/btvntvzhdbhpulae3kzk.jpg"
                  >
                    M
                  </Avatar>
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                    Manuel
                  </span>
                  <FeatherClock className="text-caption font-caption text-subtext-color" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €18,889
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Quote 1
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Udo Sill · udo.sill@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    aLATSEESTR 12, 86162 Augsburg
                  </span>
                </div>
                <Badge variant="warning" icon={<FeatherPenTool />}>
                  Signature pending
                </Badge>
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-warning-50 px-3 py-2">
                  <div className="flex w-full items-center gap-2">
                    <FeatherPhone className="text-caption font-caption text-warning-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-warning-700">
                      Next: Schedule a call
                    </span>
                  </div>
                  <Button
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherCalendar />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Schedule call
                  </Button>
                </div>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <Avatar
                    size="x-small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/btvntvzhdbhpulae3kzk.jpg"
                  >
                    M
                  </Avatar>
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                    Manuel
                  </span>
                  <FeatherClock className="text-caption font-caption text-subtext-color" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €17,539
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Becker, Anja
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Anja Becker · anja.becker@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Lindenweg 14, 80331 München
                  </span>
                </div>
                <Badge variant="warning" icon={<FeatherPenTool />}>
                  Signature pending
                </Badge>
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-warning-50 px-3 py-2">
                  <div className="flex w-full items-center gap-2">
                    <FeatherPhone className="text-caption font-caption text-warning-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-warning-700">
                      Next: Follow up on signature
                    </span>
                  </div>
                  <Button
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherClipboardList />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Log outcome
                  </Button>
                </div>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <Avatar
                    size="x-small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg"
                  >
                    L
                  </Avatar>
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                    Lukas
                  </span>
                  <FeatherClock className="text-caption font-caption text-subtext-color" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €24,210
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Hoffmann, Klaus
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Klaus Hoffmann · klaus.hoffmann@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Bahnhofstraße 3, 70173 Stuttgart
                  </span>
                </div>
                <div className="flex w-full flex-col items-start gap-2 rounded-md bg-brand-50 px-3 py-2">
                  <div className="flex w-full items-center gap-2">
                    <FeatherSparkles className="text-caption font-caption text-brand-600" />
                    <span className="grow shrink-0 basis-0 text-caption-bold font-caption-bold text-brand-700">
                      Next: Generate strategy
                    </span>
                  </div>
                  <Button
                    variant="brand-secondary"
                    size="small"
                    icon={<FeatherWand2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Generate strategy
                  </Button>
                </div>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <Avatar
                    size="x-small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417514/shared/ubsk7cs5hnnaj798efej.jpg"
                  >
                    S
                  </Avatar>
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                    Sophie
                  </span>
                  <FeatherClock className="text-caption font-caption text-subtext-color" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €31,420
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start self-stretch rounded-md border border-solid border-neutral-border bg-neutral-50">
            <div className="flex w-full items-center gap-2 px-4 py-3">
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                To specialist partner
              </span>
              <Badge variant="neutral">3×</Badge>
            </div>
            <div className="flex w-full flex-col items-start gap-3 px-3 pb-4 overflow-auto">
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Fleischmann, Paul
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Paul Fleischmann · paul.fleischmann@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Langweiderstraße 4a, 86462 Langweid
                  </span>
                </div>
                <Badge variant="brand" icon={<FeatherCheck />}>
                  Signed
                </Badge>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <FeatherClock className="text-caption font-caption text-subtext-color grow shrink-0 basis-0" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €26,269
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Schneider, Lars-Manuel
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Lars-Manuel Schneider · manuel.schneider@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Provinostraße 52, 86153 Augsburg
                  </span>
                </div>
                <Badge variant="brand" icon={<FeatherCheck />}>
                  Signed
                </Badge>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <FeatherClock className="text-caption font-caption text-subtext-color grow shrink-0 basis-0" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €21,140
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start self-stretch rounded-md border border-solid border-neutral-border bg-neutral-50">
            <div className="flex w-full items-center gap-2 px-4 py-3">
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                Waiting for installation
              </span>
              <Badge variant="neutral">7×</Badge>
            </div>
            <div className="flex w-full flex-col items-start gap-3 px-3 pb-4 overflow-auto">
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Sill, Udo
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Udo Sill · manuel.schneider@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Am Mittleren Moos 48, 86167 Augsburg
                  </span>
                </div>
                <Badge variant="brand" icon={<FeatherCheck />}>
                  Signed
                </Badge>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <FeatherClock className="text-caption font-caption text-subtext-color grow shrink-0 basis-0" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €19,448
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start self-stretch rounded-md border border-solid border-neutral-border bg-neutral-50">
            <div className="flex w-full items-center gap-2 px-4 py-3">
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                Completed
              </span>
              <Badge variant="success">16×</Badge>
            </div>
            <div className="flex w-full flex-col items-start gap-3 px-3 pb-4 overflow-auto">
              <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-sm">
                <div className="flex w-full items-start gap-2">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Schneider, Manuel
                  </span>
                  <IconButton
                    size="small"
                    icon={<FeatherMoreVertical />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    variant="neutral-secondary"
                    size="small"
                    icon={<FeatherEdit2 />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <div className="flex w-full flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Manuel Schneider · manuel.schneider@reonic.de
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Provinostraße 52, 86153 Augsburg
                  </span>
                </div>
                <Badge variant="brand" icon={<FeatherCheck />}>
                  Signed
                </Badge>
                <div className="flex w-full items-center gap-2 border-t border-solid border-neutral-border pt-3">
                  <Avatar
                    size="x-small"
                    image="https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/btvntvzhdbhpulae3kzk.jpg"
                  >
                    M
                  </Avatar>
                  <span className="grow shrink-0 basis-0 text-caption font-caption text-default-font">
                    Manuel
                  </span>
                  <FeatherClock className="text-caption font-caption text-subtext-color" />
                  <span className="text-body-bold font-body-bold text-default-font">
                    €13,898
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
