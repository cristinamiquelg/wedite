"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isReservedSlug, isValidCustomSlug } from "@/lib/site-address";
import type { SiteDict } from "@/lib/site-dict";

export type AddressChoice =
  | { kind: "suggested" | "custom"; slug: string }
  | { kind: "random"; slug: string };

type Mode = "suggested" | "random" | "custom";
type Check = { value: string; result: "ok" | "taken" | "reserved" | "invalid" | "error" };

const DOMAIN = "wedite.com/";
const RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 15 random letters and digits, from the browser's secure random source. */
function makeRandomSlug(): string {
  const bytes = new Uint8Array(15);
  // Rejection sampling keeps every character equally likely (62 does not divide 256).
  const out: string[] = [];
  while (out.length < 15) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) if (b < 248 && out.length < 15) out.push(RANDOM_CHARS[b % 62]);
  }
  return out.join("");
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lets the couple pick the public address of their site: the suggested one
 * (built from their names and date), a random private one, or their own.
 * Reports the current choice and whether it can be submitted.
 */
export default function AddressPicker({
  partnerA,
  partnerB,
  date,
  email,
  dict,
  lost,
  onChange,
}: {
  partnerA: string;
  partnerB: string;
  date: string;
  /** The buyer's email once typed: lets them get their own earlier unpaid address back. */
  email: string;
  dict: SiteDict["checkout"]["address"];
  /** The server said the chosen address was taken in the meantime. */
  lost: boolean;
  onChange: (choice: AddressChoice, valid: boolean) => void;
}) {
  const name = useId();
  const customInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  // undefined = still loading, null = nothing free to suggest.
  const [suggestion, setSuggestion] = useState<string | null | undefined>(undefined);
  const [custom, setCustom] = useState("");
  const [debounced, setDebounced] = useState("");
  const [check, setCheck] = useState<Check | null>(null);
  // The random address is drawn here so the couple sees exactly what they get.
  const [randomSlug, setRandomSlug] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setRandomSlug(makeRandomSlug()), 0);
    return () => clearTimeout(timer);
  }, []);

  const [debouncedEmail, setDebouncedEmail] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmail(EMAIL_RE.test(email.trim()) ? email.trim() : ""), 500);
    return () => clearTimeout(timer);
  }, [email]);

  // The suggestion depends on the names and the date, which are final on this page.
  useEffect(() => {
    if (!partnerA && !partnerB) return;
    let cancelled = false;
    const query = new URLSearchParams({ a: partnerA, b: partnerB, date });
    if (debouncedEmail) query.set("email", debouncedEmail);
    fetch(`/api/site-address?${query}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ suggestion: string | null }>) : { suggestion: null }))
      .then((body) => !cancelled && setSuggestion(body.suggestion))
      .catch(() => !cancelled && setSuggestion(null));
    return () => {
      cancelled = true;
    };
  }, [partnerA, partnerB, date, debouncedEmail]);

  // Debounce what they type before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(custom.trim().toLowerCase()), 350);
    return () => clearTimeout(timer);
  }, [custom]);

  useEffect(() => {
    if (mode !== "custom" || !debounced) return;
    if (isReservedSlug(debounced)) {
      setTimeout(() => setCheck({ value: debounced, result: "reserved" }), 0);
      return;
    }
    if (!isValidCustomSlug(debounced)) {
      setTimeout(() => setCheck({ value: debounced, result: "invalid" }), 0);
      return;
    }
    let cancelled = false;
    const emailQuery = debouncedEmail ? `&email=${encodeURIComponent(debouncedEmail)}` : "";
    fetch(`/api/site-address?slug=${encodeURIComponent(debounced)}${emailQuery}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ available: boolean; reason?: string }>) : null))
      .then((body) => {
        if (cancelled) return;
        if (!body) return setCheck({ value: debounced, result: "error" });
        setCheck({
          value: debounced,
          result: body.available ? "ok" : body.reason === "reserved" ? "reserved" : body.reason === "invalid" ? "invalid" : "taken",
        });
      })
      .catch(() => !cancelled && setCheck({ value: debounced, result: "error" }));
    return () => {
      cancelled = true;
    };
  }, [mode, debounced, debouncedEmail]);

  // Until they choose, the suggestion (when there is one) is selected.
  const effectiveMode: Mode = mode ?? (suggestion ? "suggested" : "random");
  const customTyped = custom.trim().toLowerCase();
  const customCheck = check && check.value === customTyped && customTyped === debounced ? check.result : null;

  const choice: AddressChoice =
    effectiveMode === "suggested" && suggestion
      ? { kind: "suggested", slug: suggestion }
      : effectiveMode === "custom"
        ? { kind: "custom", slug: customTyped }
        : { kind: "random", slug: randomSlug ?? "" };
  const valid =
    (effectiveMode === "random" && !!randomSlug) ||
    (effectiveMode === "suggested" && !!suggestion) ||
    (effectiveMode === "custom" && customCheck === "ok");
  const choiceKey = `${choice.kind}:${"slug" in choice ? choice.slug : ""}:${valid}`;

  useEffect(() => {
    onChange(choice, valid);
    // choiceKey captures everything the parent needs; `choice` is rebuilt on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceKey, onChange]);

  const status =
    effectiveMode !== "custom" || !customTyped
      ? null
      : customCheck === null
        ? dict.checking
        : customCheck === "ok"
          ? dict.available
          : customCheck === "taken"
            ? dict.taken
            : customCheck === "reserved"
              ? dict.reserved
              : customCheck === "invalid"
                ? dict.invalid
                : dict.invalid;
  const statusIsError = customCheck !== null && customCheck !== "ok";

  const radio = "mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink)]";
  // The three options share the same two lines: a small label and the address.
  const body = "flex min-w-0 flex-1 flex-col";
  const optionLabel = "text-xs text-ink-soft";
  const optionValue = "break-all text-sm font-medium text-ink";
  const option = "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-3.5 py-3 text-sm has-[:checked]:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-clay-dark";

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1.5 text-sm font-medium text-ink">{dict.title}</legend>
      <p className="text-xs text-ink-soft">{dict.hint}</p>

      {suggestion ? (
        <label className={option}>
          <input
            type="radio"
            name={name}
            className={radio}
            checked={effectiveMode === "suggested"}
            onChange={() => setMode("suggested")}
          />
          <span className={body}>
            <span className={optionLabel}>{dict.suggested}</span>
            <span className={optionValue}>
              {DOMAIN}
              {suggestion}
            </span>
          </span>
        </label>
      ) : suggestion === null ? (
        <p className="text-xs text-ink-soft">{dict.none}</p>
      ) : null}

      <label className={option}>
        <input
          type="radio"
          name={name}
          className={radio}
          checked={effectiveMode === "random"}
          onChange={() => setMode("random")}
        />
        <span className={body}>
          <span className={optionLabel}>{dict.random}</span>
          <span className={optionValue}>
            {DOMAIN}
            {randomSlug ?? "…"}
          </span>
        </span>
      </label>

      <label className={option}>
        <input
          type="radio"
          name={name}
          className={radio}
          checked={effectiveMode === "custom"}
          onChange={() => {
            setMode("custom");
            customInput.current?.focus();
          }}
        />
        <span className={body}>
          <span className={optionLabel}>{dict.custom}</span>
          {/* A real field, so it is clear this one is filled in by them. */}
          <span className="mt-1 flex items-baseline rounded-md border border-ink-soft bg-paper-raised px-3 py-2 text-sm font-medium text-ink focus-within:border-clay-dark focus-within:ring-1 focus-within:ring-clay-dark">
            <span aria-hidden="true">{DOMAIN}</span>
            <input
              ref={customInput}
              type="text"
              aria-label={dict.customLabel}
              aria-describedby={`${name}-status`}
              aria-invalid={statusIsError}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              placeholder={dict.customPlaceholder}
              value={custom}
              onFocus={() => setMode("custom")}
              onChange={(e) => setCustom(e.target.value)}
              className="min-w-0 flex-1 bg-transparent font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-soft"
            />
          </span>
        </span>
      </label>

      <p
        id={`${name}-status`}
        aria-live="polite"
        className={`min-h-4 text-xs ${statusIsError || lost ? "text-clay-dark" : "text-ink-soft"}`}
      >
        {lost ? dict.lost : status}
      </p>
    </fieldset>
  );
}
