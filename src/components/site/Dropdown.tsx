"use client";

import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption<T extends string> = { value: T; label: string };

// A styled replacement for the native <select> where its popup (system blue
// highlight, cramped arrow) clashes with the design. A button that opens a
// listbox: arrow keys move, Enter/Space choose, Escape and outside clicks close.
export default function Dropdown<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  align = "right",
}: {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  ariaLabel: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openMenu() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block text-left" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex items-center gap-2.5 rounded-full border border-line bg-paper-raised py-1.5 pl-4 pr-3.5 text-sm text-ink outline-none transition-colors hover:border-ink-soft focus-visible:border-ink"
      >
        <span>{options[selectedIndex].label}</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 8 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          className={`absolute z-20 mt-2 w-max min-w-full overflow-hidden rounded-2xl border border-line bg-paper-raised p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-6 rounded-xl px-3.5 py-2 text-sm ${
                  i === active ? "bg-sage-light" : ""
                } ${selected ? "font-medium text-ink" : "text-ink-soft"}`}
              >
                {o.label}
                {selected ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 text-sage" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 10.5 3.5 3.5 7.5-8" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
