import {
  Activity,
  Bot,
  CalendarPlus,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Home,
  Leaf,
  Lock,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Send,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const iconMap = {
  activity: Activity,
  bot: Bot,
  calendar: CalendarPlus,
  check: Check,
  clipboard: ClipboardList,
  clock: Clock,
  fileText: FileText,
  home: Home,
  leaf: Leaf,
  lock: Lock,
  mail: Mail,
  mapPin: MapPin,
  more: MoreVertical,
  phone: Phone,
  send: Send,
  shield: Shield,
  sparkles: Sparkles,
  user: User,
};

export type AppIconName = keyof typeof iconMap;

export function AppIcon({ name, size = 16 }: { name?: string; size?: number }) {
  const Icon = iconMap[(name as AppIconName) ?? "sparkles"] ?? Sparkles;
  return <Icon size={size} />;
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "yellow" | "green" | "red" | "gray";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({
  label,
  tone = "blue",
  size = "sm",
}: {
  label: string;
  tone?: "green" | "blue" | "yellow" | "red";
  size?: "xs" | "sm" | "md";
}) {
  return <span className={`avatar avatar-${tone} avatar-${size}`}>{label}</span>;
}

export function IconButton({
  label,
  children,
  onClick,
  className,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button className={`icon-button${className ? ` ${className}` : ""}`} type="button" onClick={onClick} aria-label={label}>
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={6}>
          {label}
          <Tooltip.Arrow className="tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function PageHeader({
  title,
  breadcrumbs,
}: {
  title: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
}) {
  return (
    <header className="page-header">
      {breadcrumbs ? (
        <div className="breadcrumbs">
          {breadcrumbs.map((item) => (
            <span key={item.label}>
              {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
            </span>
          ))}
          <strong>{title}</strong>
        </div>
      ) : (
        <h1>{title}</h1>
      )}
    </header>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state-panel">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-panel state-error">
      <strong>Something went wrong</strong>
      <span>{message}</span>
    </div>
  );
}

export function EmptyPanel({
  icon = "sparkles",
  title,
  description,
  action,
}: {
  icon?: AppIconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-panel">
      <span className="empty-icon">
        <AppIcon name={icon} size={26} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
