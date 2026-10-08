"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Select } from "./fields";

// A calendar popover styled like the rest of the wizard. The browser's own
// <input type="date"> popup can't be styled at all, so it always looked like
// a foreign widget stuck onto the page.
//
// With `withTime` it is a date-time picker: the value becomes a local
// "YYYY-MM-DDTHH:mm" string and hour/minute selectors appear under the grid.
// A "time not known yet" checkbox stores just the date ("YYYY-MM-DD") instead:
// a value with a date but no time part means the time is still unknown.

type ISO = string; // YYYY-MM-DD, always in the visitor's local calendar

const DEFAULT_TIME = "18:00";
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number): ISO => `${y}-${pad(m + 1)}-${pad(d)}`;

export function todayISO(): ISO {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth(), n.getDate());
}

function parseISO(iso: ISO): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function addDays(iso: ISO, days: number): ISO {
  const p = parseISO(iso)!;
  const dt = new Date(p.y, p.m, p.d + days);
  return toISO(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d={dir === "left" ? "M12.5 5 7.5 10l5 5" : "M7.5 5l5 5-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 text-ink-soft">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth={1.4} />
      <path d="M3 8.5h14M7 3v3M13 3v3" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

export default function DatePicker({
  value: rawValue,
  onChange,
  min,
  max,
  locale,
  placeholder,
  prevMonthLabel,
  nextMonthLabel,
  ariaLabel,
  withTime = false,
  defaultMonth,
  hourLabel = "Hour",
  minuteLabel = "Minutes",
  timeUnknownLabel = "Exact time not known yet",
  doneLabel = "Done",
}: {
  /** YYYY-MM-DD, or YYYY-MM-DDTHH:mm with `withTime`. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day (inclusive). */
  min?: ISO;
  /** Latest selectable day (inclusive). */
  max?: ISO;
  locale: string;
  placeholder: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  ariaLabel: string;
  withTime?: boolean;
  /** Day whose month opens first when nothing is selected yet (e.g. the wedding date). */
  defaultMonth?: ISO;
  hourLabel?: string;
  minuteLabel?: string;
  /** Label of the checkbox that drops the time (the date alone is kept). */
  timeUnknownLabel?: string;
  doneLabel?: string;
}) {
  // Date part ("YYYY-MM-DD") and time part ("HH:mm") of the value. Free text
  // saved before this picker existed doesn't parse and reads as "nothing chosen".
  const value: ISO = parseISO(rawValue.slice(0, 10)) ? rawValue.slice(0, 10) : "";
  const time = /^\d{2}:\d{2}$/.test(rawValue.slice(11, 16)) ? rawValue.slice(11, 16) : DEFAULT_TIME;
  // With a time picker, a date without a time part means "time not known yet".
  const timeUnknown = withTime && value !== "" && !/^\d{4}-\d{2}-\d{2}T/.test(rawValue);
  const emit = (iso: ISO, t: string | null) => onChange(withTime && t ? `${iso}T${t}` : iso);
  const startISO = defaultMonth && parseISO(defaultMonth) && (!min || defaultMonth >= min) ? defaultMonth : min && min > todayISO() ? min : todayISO();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [placeAbove, setPlaceAbove] = useState(false);
  const popoverId = useId();
  const today = todayISO();

  const selected = parseISO(value);
  // The month on display and the day that holds keyboard focus.
  const initial = selected ?? parseISO(startISO)!;
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const [focusISO, setFocusISO] = useState<ISO>(value || toISO(initial.y, initial.m, initial.d));

  function openPicker() {
    const base = parseISO(value) ?? parseISO(startISO)!;
    setView({ y: base.y, m: base.m });
    setFocusISO(toISO(base.y, base.m, base.d));
    setOpen(true);
  }

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // Decide where the popover goes before it paints: below the field by
  // default, above it when the space below is too short (a low window or a
  // field near the bottom of the wizard); if neither side fits, scroll the
  // popover into view so the time selectors are never cut off.
  useLayoutEffect(() => {
    if (!open) return;
    const pop = popoverRef.current;
    const trigger = triggerRef.current;
    if (!pop || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const needed = pop.offsetHeight + 12;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    const flip = needed > below && above >= needed;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured placement, must be applied before paint
    setPlaceAbove(flip);
    if (!flip && needed > below) pop.scrollIntoView({ block: "nearest" });
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Move real focus to the focused day when the popover is open.
  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusISO}"]`)?.focus();
  }, [open, focusISO, view]);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    // 2024-01-01 is a Monday; the week starts on Monday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const rawMonthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(view.y, view.m, 1),
  );
  // Spanish months are lowercase ("octubre de 2026"); capitalise just the first letter.
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const out: (ISO | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(toISO(view.y, view.m, d));
    return out;
  }, [view]);

  const minParsed = min ? parseISO(min) : null;
  const canGoPrev = !minParsed || view.y > minParsed.y || (view.y === minParsed.y && view.m > minParsed.m);
  const maxParsed = max ? parseISO(max) : null;
  const canGoNext = !maxParsed || view.y < maxParsed.y || (view.y === maxParsed.y && view.m < maxParsed.m);

  function shiftMonth(delta: number) {
    const dt = new Date(view.y, view.m + delta, 1);
    setView({ y: dt.getFullYear(), m: dt.getMonth() });
    setFocusISO(toISO(dt.getFullYear(), dt.getMonth(), 1));
  }

  function moveFocus(next: ISO) {
    if ((min && next < min) || (max && next > max)) return;
    const p = parseISO(next)!;
    setView({ y: p.y, m: p.m });
    setFocusISO(next);
  }

  function onDayKeyDown(e: React.KeyboardEvent, iso: ISO) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) {
      e.preventDefault();
      moveFocus(addDays(iso, step[e.key]));
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  // The date-time field is half-width, so it uses the short month ("22 oct 2026 · 18:00")
  // to stay on one line; the date-only field has room for the long form.
  const dateText = selected
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: withTime ? "short" : "long", year: "numeric" })
        .format(new Date(selected.y, selected.m, selected.d))
        .replace(/\./g, "")
    : null;
  const display = dateText && withTime && !timeUnknown ? `${dateText} · ${time}` : dateText;
  const [hh, mm] = time.split(":");

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => (open ? close(false) : openPicker())}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus:border-clay"
      >
        <span className={`truncate whitespace-nowrap ${display ? "text-ink" : "text-ink-soft/70"}`}>{display ?? placeholder}</span>
        <CalendarIcon />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={ariaLabel}
          className={`absolute left-0 z-30 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-paper-raised p-3.5 shadow-[0_24px_50px_-24px_rgba(33,29,26,0.35)] ${
            placeAbove ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink" aria-live="polite">
              {monthLabel}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrev}
                aria-label={prevMonthLabel}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sage-light hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canGoNext}
                aria-label={nextMonthLabel}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sage-light hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronIcon dir="right" />
              </button>
            </div>
          </div>

          <div className="grid min-h-[13.25rem] grid-cols-7 content-start gap-y-1 text-center" role="grid">
            {weekdays.map((w, i) => (
              <span key={i} className="pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-soft" aria-hidden="true">
                {w}
              </span>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <span key={`pad-${i}`} />;
              const disabled = Boolean((min && iso < min) || (max && iso > max));
              const isSelected = iso === value;
              const isToday = iso === today;
              const day = Number(iso.slice(8));
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  disabled={disabled}
                  tabIndex={iso === focusISO ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => {
                    emit(iso, timeUnknown ? null : time);
                    // A date-time picker stays open so the time can be set too.
                    if (!withTime) close();
                  }}
                  onKeyDown={(e) => onDayKeyDown(e, iso)}
                  className={[
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-clay/60",
                    disabled
                      ? "cursor-default text-ink-soft/35"
                      : isSelected
                        ? "cursor-pointer bg-ink font-medium text-paper"
                        : "cursor-pointer text-ink hover:bg-sage-light",
                    isToday && !isSelected && !disabled ? "font-semibold text-clay" : "",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {withTime ? (
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-3 border-t border-line pt-3">
              <label className="flex w-full cursor-pointer items-center gap-2 text-sm text-ink has-[:disabled]:cursor-default has-[:disabled]:opacity-50">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  disabled={!selected}
                  onChange={(e) => selected && emit(value, e.target.checked ? null : time)}
                  className="h-4 w-4 accent-[var(--color-ink)]"
                />
                {timeUnknownLabel}
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-ink-soft">
                {hourLabel}
                <Select
                  value={hh}
                  disabled={!selected || timeUnknown}
                  onChange={(e) => selected && emit(value, `${e.target.value}:${mm}`)}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs text-ink-soft">
                {minuteLabel}
                <Select
                  value={MINUTES.includes(mm) ? mm : "00"}
                  disabled={!selected || timeUnknown}
                  onChange={(e) => selected && emit(value, `${hh}:${e.target.value}`)}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </label>
              <button
                type="button"
                onClick={() => close()}
                className="cursor-pointer rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
              >
                {doneLabel}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
