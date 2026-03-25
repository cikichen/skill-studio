import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";

export const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700/80";

export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-blue-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/40 dark:bg-blue-500 dark:hover:bg-blue-400";

export const accentButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-100 dark:hover:bg-violet-500/18";

export const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-100 dark:hover:bg-rose-500/18";

export const listItemClassName =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900";

const surfaceClassName =
  "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/95";

const subSurfaceClassName =
  "rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70";

type Tone = "emerald" | "blue" | "violet" | "amber" | "rose" | "slate";

const toneClasses: Record<
  Tone,
  {
    badge: string;
    iconWrap: string;
    accentText: string;
    tileHover: string;
  }
> = {
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200",
    accentText: "text-emerald-600 dark:text-emerald-200",
    tileHover: "hover:border-emerald-200 dark:hover:border-emerald-500/30",
  },
  blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-200",
    iconWrap: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-200",
    accentText: "text-blue-600 dark:text-blue-200",
    tileHover: "hover:border-blue-200 dark:hover:border-blue-500/30",
  },
  violet: {
    badge: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-200",
    iconWrap: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-200",
    accentText: "text-violet-600 dark:text-violet-200",
    tileHover: "hover:border-violet-200 dark:hover:border-violet-500/30",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200",
    iconWrap: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200",
    accentText: "text-amber-600 dark:text-amber-200",
    tileHover: "hover:border-amber-200 dark:hover:border-amber-500/30",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-200",
    iconWrap: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-200",
    accentText: "text-rose-600 dark:text-rose-200",
    tileHover: "hover:border-rose-200 dark:hover:border-rose-500/30",
  },
  slate: {
    badge: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
    iconWrap: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
    accentText: "text-slate-500 dark:text-slate-200",
    tileHover: "hover:border-slate-300 dark:hover:border-slate-600",
  },
};

export function PageLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("space-y-7", className)}>{children}</section>;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
            {eyebrow}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-[2rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400 md:text-[15px]">
            {description}
          </p>
        </div>

        {aside ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
            {aside}
          </div>
        ) : null}
      </div>

      {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        `${surfaceClassName} p-5 md:p-6`,
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white md:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "slate",
  className,
}: {
  icon?: ElementType;
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
  className?: string;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div
      className={clsx(
        `${subSurfaceClassName} min-h-[104px] p-4`,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 break-all text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
        {Icon ? (
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              toneClass.iconWrap
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {helper ? (
        <div className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</div>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium",
        toneClasses[tone].badge,
        className
      )}
    >
      {children}
    </span>
  );
}

export function ActionTile({
  to,
  icon: Icon,
  title,
  description,
  meta,
  tone = "slate",
}: {
  to: string;
  icon?: ElementType;
  title: string;
  description: string;
  meta?: string;
  tone?: Tone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <Link
      to={to}
        className={clsx(
          `group ${subSurfaceClassName} p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-800`,
          toneClass.tileHover
        )}
      >
      <div className="flex items-start justify-between gap-3">
        <div
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            toneClass.iconWrap
          )}
        >
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        {meta ? <Badge tone={tone}>{meta}</Badge> : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <ChevronRight
          className={clsx(
            "mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5",
            toneClass.accentText
          )}
        />
      </div>
    </Link>
  );
}

export function EmptyPanel({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function KeyValueList({
  items,
  className,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    mono?: boolean;
  }>;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/90"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {item.label}
          </div>
          <div
            className={clsx(
              "mt-2 text-sm text-slate-800 dark:text-slate-100",
              item.mono && "font-mono text-[13px] break-all text-slate-600 dark:text-slate-300"
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
