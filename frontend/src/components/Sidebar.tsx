"use client";

// Shared sidebar — one source of truth, was copy-pasted across all 4 pages.
// Real <Link>s for Quotes/Requests/Calendar; active state from the pathname.
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/ui/components/Avatar";
import { TextField } from "@/ui/components/TextField";
import { FeatherCalendar } from "@subframe/core";
import { FeatherChevronsUpDown } from "@subframe/core";
import { FeatherClipboardList } from "@subframe/core";
import { FeatherContact } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherHardHat } from "@subframe/core";
import { FeatherHelpCircle } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherLayoutDashboard } from "@subframe/core";
import { FeatherReceipt } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherWrench } from "@subframe/core";

// Demo: logged-in installer is Manuel Tiral (installerId=1). Seam for real auth.
export const CURRENT_INSTALLER = { id: 1, name: "Manuel Tiral", initials: "MT", role: "Installer · SunPro GmbH" };

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href?: string; // present = real route; absent = inert demo item
  match?: (path: string) => boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", icon: <FeatherLayoutDashboard /> },
  { label: "Contacts", icon: <FeatherContact /> },
  { label: "Tasks", icon: <FeatherClipboardList /> },
  // Deal detail/strategy live under /requests; the board lives at /quotes —
  // keep the two highlights mutually exclusive so only one is active at a time.
  { label: "Requests", icon: <FeatherInbox />, href: "/quotes", match: (p) => p.startsWith("/requests") },
  { label: "Quotes", icon: <FeatherFileText />, href: "/quotes", match: (p) => p.startsWith("/quotes") },
  { label: "Calendar", icon: <FeatherCalendar />, href: "/calendar", match: (p) => p.startsWith("/calendar") },
  { label: "Installations", icon: <FeatherHardHat /> },
  { label: "Services", icon: <FeatherWrench /> },
  { label: "Invoices", icon: <FeatherReceipt /> },
];

function Row({ item, active }: { item: NavItem; active: boolean }) {
  const cls = active
    ? "flex w-full items-center gap-3 rounded-md bg-brand-50 px-3 py-2"
    : "flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-neutral-50";
  const iconCls = active ? "text-body font-body text-brand-700" : "text-body font-body text-subtext-color";
  const textCls = active
    ? "text-body-bold font-body-bold text-brand-700"
    : "text-body font-body text-default-font";
  const inner = (
    <div className={cls}>
      <span className={iconCls}>{item.icon}</span>
      <span className={textCls}>{item.label}</span>
    </div>
  );
  if (!item.href) return <div className="w-full cursor-default opacity-80">{inner}</div>;
  return (
    <Link href={item.href} className="w-full">
      {inner}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname() || "";
  return (
    <div className="flex w-60 flex-none flex-col items-start self-stretch border-r border-solid border-neutral-border bg-default-background mobile:hidden">
      <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-3">
        <img
          className="h-5 flex-none object-contain"
          src="https://res.cloudinary.com/subframe/image/upload/v1711417518/shared/fdb8rlpzh1gds6vzsnt0.svg"
          alt="Reonic"
        />
        <span className="text-body-bold font-body-bold text-default-font">Reonic</span>
      </div>
      <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-3">
        <Avatar className="bg-brand-600" size="small" image="">
          {CURRENT_INSTALLER.initials}
        </Avatar>
        <div className="flex grow shrink-0 basis-0 flex-col items-start">
          <span className="text-body-bold font-body-bold text-default-font">{CURRENT_INSTALLER.name}</span>
          <span className="text-caption font-caption text-subtext-color">{CURRENT_INSTALLER.role}</span>
        </div>
        <FeatherChevronsUpDown className="text-body font-body text-subtext-color" />
      </div>
      <div className="flex w-full flex-col items-start gap-2 px-3 py-3">
        <TextField className="h-auto w-full flex-none" variant="filled" label="" helpText="" icon={<FeatherSearch />}>
          <TextField.Input placeholder="Search" value="" onChange={() => {}} />
        </TextField>
      </div>
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 px-3 py-1 overflow-auto">
        {NAV.map((item) => (
          <Row key={item.label} item={item} active={!!item.match?.(pathname)} />
        ))}
      </div>
      <div className="flex w-full flex-col items-start border-t border-solid border-neutral-border px-3 py-3">
        <div className="flex w-full items-center gap-3 rounded-md px-3 py-2 opacity-80">
          <FeatherSettings className="text-body font-body text-subtext-color" />
          <span className="text-body font-body text-default-font">Settings</span>
        </div>
        <div className="flex w-full items-center gap-3 rounded-md px-3 py-2 opacity-80">
          <FeatherHelpCircle className="text-body font-body text-subtext-color" />
          <span className="text-body font-body text-default-font">Help</span>
        </div>
      </div>
    </div>
  );
}
