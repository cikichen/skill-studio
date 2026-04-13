import clsx from "clsx";
import { ChevronRight, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";

export const inputClassName =
  "w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium tracking-[0.01em] text-gray-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-colors duration-150 placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50 focus:border-blue-200 focus:bg-white focus:ring-0 dark:border-slate-600 dark:bg-[#242c35] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-[#2a313b] dark:focus:border-blue-400";

export const secondaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium leading-none tracking-[0.01em] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[background-color,color,border-color,box-shadow] duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 hover:shadow-[0_6px_18px_-18px_rgba(15,23,42,0.24)] active:bg-gray-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-[#242c35] dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-[#2a313b] dark:hover:text-white dark:focus-visible:border-blue-400";

export const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-[12px] font-semibold leading-none tracking-[0.01em] text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.4)] transition-[background-color,color,border-color,box-shadow] duration-150 hover:border-slate-800 hover:bg-black hover:shadow-[0_14px_28px_-18px_rgba(15,23,42,0.46)] active:bg-slate-950 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:hover:shadow-[0_12px_26px_-18px_rgba(248,250,252,0.28)] dark:active:bg-slate-200 dark:focus-visible:border-blue-300";

export const accentButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-violet-200/70 bg-violet-50 px-3.5 py-2 text-[12px] font-medium leading-none tracking-[0.01em] text-violet-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[background-color,color,border-color,box-shadow] duration-150 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800 hover:shadow-[0_6px_18px_-18px_rgba(109,40,217,0.28)] active:bg-violet-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/24 dark:bg-violet-500/12 dark:text-violet-100 dark:hover:bg-violet-500/18";

export const dangerButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 py-2 text-[12px] font-medium leading-none tracking-[0.01em] text-rose-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[background-color,color,border-color,box-shadow] duration-150 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 hover:shadow-[0_6px_18px_-18px_rgba(225,29,72,0.18)] active:bg-rose-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/26 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/16";


export const listItemClassName =
  "rounded-[20px] border border-slate-200/85 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-150 dark:border-slate-600/90 dark:bg-[#242c35] dark:shadow-[0_1px_2px_rgba(2,6,23,0.22)]";

export const workbenchListItemClassName =
  "w-full rounded-[18px] border border-gray-200 bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none hover:border-gray-300 hover:bg-gray-50 hover:shadow-[0_6px_18px_-18px_rgba(15,23,42,0.28)] dark:border-slate-600 dark:bg-[#242c35] dark:hover:border-slate-500 dark:hover:bg-[#2a313b]";

export const workbenchSectionClassName =
  "rounded-[16px] border border-gray-200 bg-gray-50 px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-600 dark:bg-[#20272f]";

export const workbenchDetailPanelClassName =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-600 dark:bg-[#242c35]";

export const workbenchDetailFieldClassName =
  "rounded-[16px] border border-gray-200 bg-gray-50 px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-600 dark:bg-[#20272f]";

export const workbenchToggleBaseClassName =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium leading-none tracking-[0.01em] text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[background-color,color,border-color,box-shadow] duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-slate-900 hover:shadow-[0_6px_18px_-18px_rgba(15,23,42,0.24)] active:bg-gray-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-[#242c35] dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-[#2a313b] dark:hover:text-white dark:focus-visible:border-blue-400";

export const workbenchSelectedSurfaceClassName =
  "border-slate-300 bg-slate-100 text-slate-900 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.3)] dark:border-slate-500 dark:bg-slate-100 dark:text-slate-900";

export const workbenchStepCardClassName =
  "flex flex-col gap-3 rounded-[18px] border border-slate-200/85 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-600/90 dark:bg-[#242c35] dark:shadow-[0_1px_2px_rgba(2,6,23,0.22)] xl:flex-row xl:items-center xl:justify-between";

export const workbenchMarkdownPanelClassName =
  "skill-detail-markdown rounded-[16px] border border-gray-200 bg-gray-50 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-600 dark:bg-[#20272f]";

export const workbenchGlassCardClassName =
  "rounded-[18px] border border-slate-200/85 bg-white shadow-[0_10px_24px_-22px_rgba(15,23,42,0.16)] dark:border-slate-700/85 dark:bg-slate-950/68 dark:shadow-[0_12px_26px_-24px_rgba(2,6,23,0.54)]";

export const workbenchHeaderCardClassName =
  "rounded-[18px] border border-slate-200/85 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-700/85 dark:bg-slate-950/72 dark:shadow-[0_1px_2px_rgba(2,6,23,0.4)]";

export const workbenchActionDockClassName =
  "rounded-[18px] border border-slate-200/85 bg-slate-50 px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700/85 dark:bg-slate-900/74";

export const workbenchSegmentedTrackClassName =
  "flex flex-wrap items-center gap-2 rounded-[18px] border border-gray-200 bg-gray-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/90";

export const workbenchSegmentTriggerClassName =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-transparent bg-transparent px-3 py-1.5 text-[11px] font-medium leading-none tracking-[0.01em] text-slate-600 transition-[background-color,color,border-color] duration-150 hover:border-gray-200 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white";

const surfaceClassName =
  "rounded-[20px] border border-slate-200/85 bg-white shadow-[0_10px_24px_-22px_rgba(15,23,42,0.14)] dark:border-slate-600/90 dark:bg-[#242c35] dark:shadow-[0_12px_24px_-22px_rgba(2,6,23,0.36)]";

const subSurfaceClassName =
  "rounded-[16px] border border-slate-200/85 bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-600/90 dark:bg-[#20272f] dark:shadow-[0_1px_2px_rgba(2,6,23,0.2)]";

type Tone = "emerald" | "blue" | "violet" | "amber" | "rose" | "slate";
type Density = "default" | "compact";

const toneClasses: Record<
  Tone,
  {
    badge: string;
    iconWrap: string;
    accentText: string;
    tileHover: string;
    alert: string;
  }
> = {
  emerald: {
    badge: "border-emerald-200/70 bg-emerald-50/88 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-emerald-500/28 dark:bg-emerald-500/14 dark:text-emerald-200",
    iconWrap: "border-emerald-200/70 bg-emerald-50/82 text-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-emerald-500/28 dark:bg-emerald-500/14 dark:text-emerald-200",
    accentText: "text-emerald-600 dark:text-emerald-200",
    tileHover: "hover:border-emerald-200/90 hover:bg-emerald-50/72 dark:hover:border-emerald-500/34 dark:hover:bg-emerald-500/10",
    alert: "border-emerald-200/75 bg-emerald-50/85 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-emerald-500/28 dark:bg-emerald-500/12 dark:text-emerald-100",
  },
  blue: {
    badge: "border-blue-200/70 bg-blue-50/88 text-blue-700 dark:border-blue-500/26 dark:bg-blue-500/12 dark:text-blue-100",
    iconWrap: "border-blue-200/70 bg-blue-50/82 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-blue-500/28 dark:bg-blue-500/14 dark:text-blue-200",
    accentText: "text-blue-600 dark:text-blue-200",
    tileHover: "hover:border-blue-200/90 hover:bg-blue-50/72 dark:hover:border-blue-500/34 dark:hover:bg-blue-500/10",
    alert: "border-blue-200/75 bg-blue-50/85 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-blue-500/28 dark:bg-blue-500/12 dark:text-blue-100",
  },
  violet: {
    badge: "border-violet-200/70 bg-violet-50/88 text-violet-700 dark:border-violet-500/26 dark:bg-violet-500/12 dark:text-violet-100",
    iconWrap: "border-violet-200/70 bg-violet-50/82 text-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-violet-500/28 dark:bg-violet-500/14 dark:text-violet-200",
    accentText: "text-violet-600 dark:text-violet-200",
    tileHover: "hover:border-violet-200/90 hover:bg-violet-50/72 dark:hover:border-violet-500/34 dark:hover:bg-violet-500/10",
    alert: "border-violet-200/75 bg-violet-50/85 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-violet-500/28 dark:bg-violet-500/12 dark:text-violet-100",
  },
  amber: {
    badge: "border-amber-200/70 bg-amber-50/88 text-amber-700 dark:border-amber-500/26 dark:bg-amber-500/12 dark:text-amber-100",
    iconWrap: "border-amber-200/70 bg-amber-50/82 text-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-amber-500/28 dark:bg-amber-500/14 dark:text-amber-200",
    accentText: "text-amber-600 dark:text-amber-200",
    tileHover: "hover:border-amber-200/90 hover:bg-amber-50/72 dark:hover:border-amber-500/34 dark:hover:bg-amber-500/10",
    alert: "border-amber-200/75 bg-amber-50/85 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-amber-500/28 dark:bg-amber-500/12 dark:text-amber-100",
  },
  rose: {
    badge: "border-rose-200/70 bg-rose-50/88 text-rose-700 dark:border-rose-500/26 dark:bg-rose-500/12 dark:text-rose-100",
    iconWrap: "border-rose-200/70 bg-rose-50/82 text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-rose-500/28 dark:bg-rose-500/14 dark:text-rose-200",
    accentText: "text-rose-600 dark:text-rose-200",
    tileHover: "hover:border-rose-200/90 hover:bg-rose-50/72 dark:hover:border-rose-500/34 dark:hover:bg-rose-500/10",
    alert: "border-rose-200/75 bg-rose-50/85 text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-rose-500/28 dark:bg-rose-500/12 dark:text-rose-100",
  },
  slate: {
    badge: "border-gray-200 bg-gray-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/88 dark:text-slate-200",
    iconWrap: "border-gray-200 bg-white text-gray-600 dark:border-slate-600 dark:bg-slate-900/72 dark:text-slate-200",
    accentText: "text-slate-500 dark:text-slate-200",
    tileHover: "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-slate-600 dark:hover:bg-slate-900/82",
    alert: "border-gray-200 bg-white text-gray-700 dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-200",
  },
};

export function PageLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("space-y-2.5 md:space-y-3", className)}>{children}</section>;
}

export function WorkbenchOverview({
  eyebrow,
  title,
  description,
  stats,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  stats?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx(workbenchGlassCardClassName, "overflow-hidden px-3.5 py-3.5 md:px-4 md:py-4", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white md:text-[1.35rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>

        {stats ? <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[390px] xl:max-w-[470px]">{stats}</div> : null}
      </div>

      {actions ? <div className="mt-3">{actions}</div> : null}
    </section>
  );
}

export function WorkbenchHeroActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx(workbenchSegmentedTrackClassName, className)}>{children}</div>;
}

export function WorkbenchSplit({
  children,
  sidebar,
  className,
  sidebarClassName,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
  sidebarClassName?: string;
}) {
  return (
    <section
      className={clsx(
        "grid gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,352px)]",
        className
      )}
    >
      <div className="space-y-3">{children}</div>
      <aside className={clsx("space-y-3", sidebarClassName)}>{sidebar}</aside>
    </section>
  );
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
  description?: string;
  aside?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-[1.18rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white md:text-[1.35rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>

        {aside ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:w-[280px] xl:grid-cols-1">{aside}</div>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
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
  density = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  density?: Density;
}) {
  const compact = density === "compact";

  return (
    <div
      className={clsx(
        surfaceClassName,
        compact ? "p-3 md:p-3.5" : "p-4 md:p-4.5",
        "flex min-h-0 flex-col overflow-hidden",
        className
      )}
    >
      <div className={clsx("flex flex-col gap-2 md:flex-row md:items-start md:justify-between", compact && "gap-1.5") }>
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </div>
          ) : null}
          <h2 className={clsx("mt-1 text-[14px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white", !compact && "md:text-[1.02rem]")}>
            {title}
          </h2>
          {description ? (
            <p className={clsx("mt-1 text-[12px] leading-5 text-slate-600 dark:text-slate-400", !compact && "max-w-3xl")}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={clsx(compact ? "mt-3" : "mt-3.5", "flex min-h-0 flex-1 flex-col")}>{children}</div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  meta,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </div>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</h3>
          {meta}
        </div>
        {description ? (
          <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function InlineAlert({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border px-4 py-3 text-sm", toneClasses[tone].alert, className)}>
      {children}
    </div>
  );
}

export function QueryHint({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={clsx("inline-flex items-center gap-1.5 rounded-full border border-current/10 bg-gray-100 px-3 py-1.5 text-[11px] font-medium leading-none shadow-none dark:bg-slate-800/88", toneClasses[tone].accentText)}>
      <LoaderCircle className="h-3 w-3 animate-spin" />
      <span>{children}</span>
    </div>
  );
}

export function SectionSkeleton({
  rows = 3,
  compact = false,
  className,
}: {
  rows?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("animate-pulse space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            "rounded-2xl border border-slate-200/70 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700/75 dark:bg-slate-900/55 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            compact ? "h-20" : "h-28"
          )}
        />
      ))}
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
    <div className={clsx(`${subSurfaceClassName} min-h-[72px] p-3`, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-1 break-all text-[1.35rem] font-semibold tracking-[-0.05em] text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
        {Icon ? (
          <div
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-[0.9rem] border",
              toneClass.iconWrap
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      {helper ? (
        <div className="mt-1 text-[10px] leading-4.5 text-slate-500 dark:text-slate-400">{helper}</div>
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none tracking-[0.01em]",
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
  dense = false,
}: {
  to: string;
  icon?: ElementType;
  title: string;
  description?: string;
  meta?: string;
  tone?: Tone;
  dense?: boolean;
}) {
  const toneClass = toneClasses[tone];

  return (
    <Link
      to={to}
      className={clsx(
        `group ${subSurfaceClassName} transition duration-200 hover:-translate-y-0.5`,
        dense ? "p-3" : "p-3.5",
        toneClass.tileHover
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-2xl border",
            dense ? "h-8 w-8" : "h-9 w-9",
            toneClass.iconWrap
          )}
        >
          {Icon ? <Icon className={dense ? "h-4 w-4" : "h-4.5 w-4.5"} /> : null}
        </div>
        {meta ? <Badge tone={tone}>{meta}</Badge> : null}
      </div>
      <div className={clsx("flex items-start justify-between gap-4", dense ? "mt-2.5" : "mt-3")}>
        <div>
          <div className={clsx("font-semibold tracking-[-0.03em] text-slate-900 dark:text-white", dense ? "text-sm" : "text-sm md:text-base")}>
            {title}
          </div>
          {description ? (
            <p className={clsx("mt-1.5 text-slate-600 dark:text-slate-400", dense ? "text-xs leading-5" : "text-sm leading-5")}>
              {description}
            </p>
          ) : null}
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
  icon,
}: {
  title: string;
  description: string;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-[24px] border border-dashed border-slate-300/85 bg-white/58 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] dark:border-slate-700/80 dark:bg-slate-950/34 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {icon ?? <TriangleAlert className="mx-auto h-5 w-5 text-slate-400 dark:text-slate-500" />}
      <div className="mt-2.5 text-base font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</div>
      <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}


export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/36 p-3 sm:items-center">
      <div className="w-full max-w-[460px] rounded-[24px] border border-slate-200/85 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.34)] dark:border-slate-700/85 dark:bg-slate-950/92 dark:shadow-[0_24px_60px_-32px_rgba(2,6,23,0.84)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              {title}
            </div>
            <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={cancelLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children ? <div className="px-4 py-4">{children}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/80 px-4 py-4 sm:flex-row sm:justify-end dark:border-slate-700/80">
          <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClassName}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={dangerButtonClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
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
    <div className={clsx("space-y-2.5", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200/70 bg-white/58 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700/75 dark:bg-slate-950/34 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
            {item.label}
          </div>
          <div
            className={clsx(
              "mt-2.5 text-sm text-slate-800 dark:text-slate-100",
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
