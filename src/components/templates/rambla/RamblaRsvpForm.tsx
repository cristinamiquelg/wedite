"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import styles from "./rambla.module.css";

type YesNo = "si" | "no" | null;
type Companion = { id: number; firstName: string; lastName: string; kid: boolean; bus: YesNo; dietary: string };
type Errors = Record<string, string>;

const MAX_COMPANIONS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone numbers: digits only, optionally starting with "+" (spaces are just for readability).
const PHONE_RE = /^\+?\d{7,15}$/;
const phoneOnly = (v: string) => v.replace(/(?!^)\+/g, "").replace(/[^\d+\s]/g, "");

// A yes/no question shown as two pills. It is a radio group for assistive technology: the question names it,
// and the arrow keys move between the two answers.
function YesNoQuestion({
  question,
  value,
  onChange,
  yesLabel,
  noLabel,
  error,
  id,
  flash,
}: {
  question: string;
  value: YesNo;
  onChange: (v: "si" | "no") => void;
  yesLabel: string;
  noLabel: string;
  error?: string;
  id?: string;
  flash?: boolean;
}) {
  const uid = useId();
  const options: { v: "si" | "no"; label: string }[] = [
    { v: "si", label: yesLabel },
    { v: "no", label: noLabel },
  ];

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const next = value === "si" ? "no" : "si";
      onChange(next);
      e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-v="${next}"]`)?.focus();
    }
  }

  return (
    <div className={styles.question} id={id} data-flash={flash ? "" : undefined}>
      <p id={`${uid}-q`} className={styles.questionLabel}>
        {question}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${uid}-q`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${uid}-err` : undefined}
        className={styles.choices}
      >
        {options.map((o) => {
          const checked = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (value === null && o.v === "si") ? 0 : -1}
              data-v={o.v}
              onClick={() => onChange(o.v)}
              onKeyDown={onKeyDown}
              className={`${styles.choice} ${checked ? styles.choiceOn : ""}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${uid}-err`} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  error,
  optionalText,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  optionalText?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
        {optionalText ? <span className={styles.fieldOptional}> ({optionalText})</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error ? (
        <p id={`${id}-err`} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

// The guests' attendance form of a Rambla site: one page, from the name to "send". The couple's switches (bus,
// contact, kids' menu) add or remove questions. On a published site (`siteSlug`) the answers go to the server;
// in previews they only show the thanks screen.
export default function RamblaRsvpForm({
  locale,
  showBus = true,
  askContact = true,
  showKidsMenu = true,
  siteSlug,
  demoFocus,
}: {
  locale?: Locale;
  showBus?: boolean;
  askContact?: boolean;
  showKidsMenu?: boolean;
  siteSlug?: string;
  /** The wizard's live preview only: show the question the couple just switched on or off. `n` makes repeats count. */
  demoFocus?: { target: "bus" | "contact" | "kids"; n: number };
}) {
  const dict = getDict(locale).ribera.form;
  const formRef = useRef<HTMLFormElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [attending, setAttending] = useState<YesNo>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bus, setBus] = useState<YesNo>(null);
  const [dietary, setDietary] = useState("");
  const [withOthers, setWithOthers] = useState<YesNo>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [nextId, setNextId] = useState(1);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Resubmitting from this tab updates the same answer instead of adding another.
  const [clientRef] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
  );

  const comes = attending === "si";

  function newCompanion(id: number): Companion {
    return { id, firstName: "", lastName: "", kid: false, bus: null, dietary: "" };
  }

  // Preview: the wizard asks to show a question. The form answers "yes, I'm coming" (and adds a companion
  // for the kids' menu), then scrolls to it. Done while rendering: the state it changes is this component's own.
  const [focusSeen, setFocusSeen] = useState(demoFocus?.n);
  const [flash, setFlash] = useState<string | null>(null);
  if (demoFocus && demoFocus.n !== focusSeen) {
    setFocusSeen(demoFocus.n);
    setSubmitted(false);
    setAttending("si");
    setTried(false);
    if (demoFocus.target === "kids" && companions.length === 0) {
      setWithOthers("si");
      setCompanions([newCompanion(nextId)]);
      setNextId(nextId + 1);
    }
  }
  const focusN = demoFocus?.n;
  const focusTarget = demoFocus?.target;
  useEffect(() => {
    if (focusN === undefined || !focusTarget) return;
    // Wait for the new questions to be on the page.
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`rsvp-${focusTarget}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(el?.id ?? null);
    }, 150);
    const clear = window.setTimeout(() => setFlash(null), 2300);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [focusN, focusTarget]);

  function chooseOthers(v: "si" | "no") {
    setWithOthers(v);
    if (v === "no") {
      setCompanions([]);
    } else if (companions.length === 0) {
      setCompanions([newCompanion(nextId)]);
      setNextId(nextId + 1);
    }
  }

  function setCount(n: number) {
    const target = Math.max(1, Math.min(MAX_COMPANIONS, n));
    if (target <= companions.length) {
      setCompanions(companions.slice(0, target));
      return;
    }
    const extra: Companion[] = [];
    let id = nextId;
    for (let i = companions.length; i < target; i++) extra.push(newCompanion(id++));
    setNextId(id);
    setCompanions([...companions, ...extra]);
  }

  function updateCompanion(id: number, patch: Partial<Companion>) {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCompanion(id: number) {
    const next = companions.filter((c) => c.id !== id);
    setCompanions(next);
    if (next.length === 0) setWithOthers("no");
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = dict.errRequired;
    if (!lastName.trim()) e.lastName = dict.errRequired;
    if (!attending) e.attending = dict.errRequired;
    if (comes) {
      if (askContact) {
        if (!phone.trim() && !email.trim()) e.contact = dict.errContact;
        if (phone.trim() && !PHONE_RE.test(phone.replace(/\s/g, ""))) e.phone = dict.errPhone;
        if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = dict.errEmail;
      }
      companions.forEach((c) => {
        if (!c.firstName.trim()) e[`c${c.id}`] = dict.errRequired;
      });
    }
    return e;
  }
  const errors: Errors = tried ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (Object.keys(validate()).length > 0) {
      setTried(true);
      // Take the guest to the first thing to fix.
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    if (!siteSlug) {
      setSubmitted(true);
      return;
    }
    setSending(true);
    setSendFailed(false);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: siteSlug,
          clientRef,
          locale,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: askContact && comes ? phone.replace(/\s+/g, " ").trim() : "",
          email: askContact && comes ? email.trim() : "",
          attending,
          bus: comes && showBus ? bus === "si" : null,
          dietary: dietary.trim(),
          companions: companions.map((c) => ({
            firstName: c.firstName.trim(),
            lastName: c.lastName.trim(),
            kid: showKidsMenu && c.kid,
            bus: showBus ? c.bus === "si" : null,
            dietary: c.dietary.trim(),
          })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    const total = 1 + companions.length;
    return (
      <div className={styles.thanks} role="status">
        <h3 className={styles.thanksTitle}>{dict.thanks}</h3>
        <p className={styles.thanksSummary}>
          {comes ? dict.summaryAttending.replace("{n}", String(total)) : dict.summaryNotAttending}
        </p>
        <button type="button" className={styles.btn} onClick={() => setSubmitted(false)}>
          {dict.edit}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.row2}>
        <TextField label={dict.firstName} value={firstName} onChange={setFirstName} autoComplete="given-name" error={errors.firstName} maxLength={80} />
        <TextField label={dict.lastName} value={lastName} onChange={setLastName} autoComplete="family-name" error={errors.lastName} maxLength={80} />
      </div>

      <YesNoQuestion
        question={dict.attendingQ}
        value={attending}
        onChange={setAttending}
        yesLabel={dict.attendingYes}
        noLabel={dict.attendingNo}
        error={errors.attending}
      />

      {comes ? (
        <>
          {askContact ? (
            <div id="rsvp-contact" className={styles.question} data-flash={flash === "rsvp-contact" ? "" : undefined}>
              <p className={styles.hint}>{dict.contactHint}</p>
              <div className={styles.row2}>
                <TextField
                  label={dict.phone}
                  value={phone}
                  onChange={(v) => setPhone(phoneOnly(v))}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  error={errors.phone ?? errors.contact}
                  maxLength={30}
                />
                <TextField label={dict.email} value={email} onChange={setEmail} type="email" autoComplete="email" error={errors.email} maxLength={254} />
              </div>
            </div>
          ) : null}

          {showBus ? (
            <YesNoQuestion
              id="rsvp-bus"
              flash={flash === "rsvp-bus"}
              question={dict.busQ}
              value={bus}
              onChange={setBus}
              yesLabel={dict.busYes}
              noLabel={dict.busNo}
            />
          ) : null}

          <div className={styles.field}>
            <label htmlFor="rsvp-dietary" className={styles.questionLabel}>
              {dict.dietary} <span className={styles.fieldOptional}>({dict.optional})</span>
            </label>
            <textarea id="rsvp-dietary" className={styles.textarea} value={dietary} onChange={(e) => setDietary(e.target.value)} maxLength={300} rows={2} />
          </div>

          <YesNoQuestion
            question={dict.companionQ}
            value={withOthers}
            onChange={chooseOthers}
            yesLabel={dict.companionYes}
            noLabel={dict.companionNo}
          />

          {withOthers === "si" ? (
            <>
              <div className={styles.question}>
                <p className={styles.questionLabel}>{dict.howManyCompanions}</p>
                <div className={styles.stepper}>
                  <button type="button" className={styles.stepBtn} onClick={() => setCount(companions.length - 1)} disabled={companions.length <= 1} aria-label={dict.decreaseCompanions}>
                    −
                  </button>
                  <span className={styles.stepValue} aria-live="polite">
                    {companions.length}
                  </span>
                  <button type="button" className={styles.stepBtn} onClick={() => setCount(companions.length + 1)} disabled={companions.length >= MAX_COMPANIONS} aria-label={dict.increaseCompanions}>
                    +
                  </button>
                </div>
              </div>

              {companions.map((c, i) => (
                <div key={c.id} className={styles.companion}>
                  <div className={styles.companionHead}>
                    <h4 className={styles.companionTitle}>
                      {dict.companionInfo} {i + 1}
                    </h4>
                    <button type="button" className={styles.linkBtn} onClick={() => removeCompanion(c.id)}>
                      {dict.removeCompanion}
                    </button>
                  </div>
                  <div className={styles.row2}>
                    <TextField label={dict.firstName} value={c.firstName} onChange={(v) => updateCompanion(c.id, { firstName: v })} error={errors[`c${c.id}`]} maxLength={80} />
                    <TextField label={dict.lastName} value={c.lastName} onChange={(v) => updateCompanion(c.id, { lastName: v })} maxLength={80} />
                  </div>
                  {showKidsMenu ? (
                    <label
                      id={i === 0 ? "rsvp-kids" : undefined}
                      className={styles.check}
                      data-flash={i === 0 && flash === "rsvp-kids" ? "" : undefined}
                      style={{ position: "relative" }}
                    >
                      <input type="checkbox" checked={c.kid} onChange={(e) => updateCompanion(c.id, { kid: e.target.checked })} />
                      {dict.kidsMenu}
                    </label>
                  ) : null}
                  {showBus ? (
                    <YesNoQuestion
                      question={dict.busQ}
                      value={c.bus}
                      onChange={(v) => updateCompanion(c.id, { bus: v })}
                      yesLabel={dict.busYes}
                      noLabel={dict.busNo}
                    />
                  ) : null}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor={`rsvp-c${c.id}-dietary`}>
                      {dict.dietary} <span className={styles.fieldOptional}>({dict.optional})</span>
                    </label>
                    <textarea
                      id={`rsvp-c${c.id}-dietary`}
                      className={styles.textarea}
                      value={c.dietary}
                      onChange={(e) => updateCompanion(c.id, { dietary: e.target.value })}
                      maxLength={300}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </>
      ) : null}

      {hasErrors ? (
        <p className={styles.formError} role="alert">
          {dict.errSummary}
        </p>
      ) : null}
      {sendFailed ? (
        <p className={styles.formError} role="alert">
          {dict.sendError}
        </p>
      ) : null}

      <button type="submit" className={`${styles.btnSolid} ${styles.submit}`} disabled={sending}>
        {sending ? dict.sending : dict.submit}
      </button>
    </form>
  );
}
